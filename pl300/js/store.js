// Progress lives in this browser (localStorage) and moves between devices through export/import files.
import { SKILLS, GROUPS, DOMAINS } from "./data/syllabus.js";

const KEY = "pl300-studylab-v1";
const SETTINGS_KEY = "pl300-studylab-settings";

const blank = () => ({
  version: 1,
  created: new Date().toISOString(),
  startDate: null,
  examDate: null,
  skills: {},        // skillId -> { m, n, last }
  answered: {},      // qid -> { n, lastScore, wrongAt }
  totalAnswered: 0,
  history: [],       // { ts, qid, skill, score, mode }
  diagnostic: null,  // { ts, score, byDomain }
  mocks: [],         // { ts, score, byDomain, seconds, n }
  capstones: {},     // id -> { steps: {i: true}, checks: { id: { ok, value } } }
  lessonsRead: {},
  planDone: {},      // "day-task" -> true
  tutorThread: [],
});

let state = load();
let settings = loadSettings();
const listeners = new Set();

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }

function load() {
  const raw = safeGet(KEY);
  if (!raw) return blank();
  try { return { ...blank(), ...JSON.parse(raw) }; } catch { return blank(); }
}
function loadSettings() {
  try { return { provider: "anthropic", apiKey: "", model: "", baseUrl: "", ...JSON.parse(safeGet(SETTINGS_KEY) || "{}") }; }
  catch { return { provider: "anthropic", apiKey: "", model: "", baseUrl: "" }; }
}

export const getState = () => state;
export const getSettings = () => settings;
export function save() { safeSet(KEY, JSON.stringify(state)); listeners.forEach((f) => f()); }
export function saveSettings(next) { settings = { ...settings, ...next }; safeSet(SETTINGS_KEY, JSON.stringify(settings)); }
export function onChange(f) { listeners.add(f); }

export function ensureStarted() {
  if (!state.startDate) { state.startDate = new Date().toISOString().slice(0, 10); save(); }
}
export function studyDay() {
  if (!state.startDate) return 1;
  const start = new Date(state.startDate + "T00:00:00");
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor((now - start) / 86400000) + 1);
}

/** Record an answer. score is 0..1 (partial credit allowed). */
export function recordAnswer(q, score, mode = "practice") {
  const s = state.skills[q.skill] || { m: 0, n: 0, last: 0 };
  const alpha = Math.max(0.3, 1 / (s.n + 1));
  s.m = s.n === 0 ? score : s.m + alpha * (score - s.m);
  s.n += 1; s.last = Date.now();
  state.skills[q.skill] = s;
  state.totalAnswered += 1;
  const a = state.answered[q.id] || { n: 0 };
  a.n += 1; a.lastScore = score;
  a.wrongAt = score < 1 ? state.totalAnswered : null;
  state.answered[q.id] = a;
  state.history.push({ ts: Date.now(), qid: q.id, skill: q.skill, score: Math.round(score * 100) / 100, mode });
  if (state.history.length > 3000) state.history = state.history.slice(-3000);
  save();
}

export const skillMastery = (id) => state.skills[id]?.m ?? null;

/** Group score treats untested skills as 0 so coverage counts. */
export function groupStats(gid) {
  const g = GROUPS.find((x) => x.id === gid);
  let sum = 0, tested = 0, answers = 0;
  for (const [sid] of g.skills) {
    const s = state.skills[sid];
    if (s) { sum += s.m; tested++; answers += s.n; }
  }
  return { score: sum / g.skills.length, tested, total: g.skills.length, answers, avgTested: tested ? sum / tested : null };
}
export function domainStats(did) {
  const ids = Object.values(SKILLS).filter((s) => s.domain === did).map((s) => s.id);
  let sum = 0, tested = 0;
  for (const id of ids) { const s = state.skills[id]; if (s) { sum += s.m; tested++; } }
  return { score: sum / ids.length, tested, total: ids.length };
}
/** Rough projected scaled score using the midpoint of each domain's published weight. */
export function projectedScore() {
  const totalW = DOMAINS.reduce((a, d) => a + d.mid, 0);
  return Math.round(DOMAINS.reduce((a, d) => a + d.mid * domainStats(d.id).score, 0) / totalW * 1000);
}
export function weakestSkills(n = 5) {
  return Object.values(SKILLS)
    .map((s) => ({ ...s, m: state.skills[s.id]?.m ?? null, n: state.skills[s.id]?.n ?? 0 }))
    .sort((a, b) => (a.m ?? -1) - (b.m ?? -1) || a.n - b.n)
    .slice(0, n);
}

export function capstone(id) {
  if (!state.capstones[id]) state.capstones[id] = { steps: {}, checks: {} };
  return state.capstones[id];
}

export const READY = { groupMin: 0.75, mockMin: 800, mocksNeeded: 2 };
export function readiness(capstones) {
  const groups = GROUPS.map((g) => ({ g, ...groupStats(g.id) }));
  const groupsOk = groups.every((x) => x.score >= READY.groupMin);
  const caps = capstones.map((c) => {
    const st = state.capstones[c.id] || { steps: {}, checks: {} };
    const stepsDone = c.steps.filter((_, i) => st.steps[i]).length;
    const checksOk = c.checkpoints.filter((k) => st.checks[k.id]?.ok).length;
    return { c, stepsDone, checksOk, done: stepsDone === c.steps.length && checksOk === c.checkpoints.length };
  });
  const capsOk = caps.every((x) => x.done);
  const lastMocks = state.mocks.slice(-READY.mocksNeeded);
  const mocksOk = lastMocks.length === READY.mocksNeeded && lastMocks.every((m) => m.score >= READY.mockMin);
  const diagOk = !!state.diagnostic;
  return { groups, groupsOk, caps, capsOk, lastMocks, mocksOk, diagOk, ready: groupsOk && capsOk && mocksOk && diagOk };
}

export function exportProgress() {
  return JSON.stringify({ app: "pl300-study-lab", exported: new Date().toISOString(), state }, null, 2);
}
export function importProgress(text) {
  const parsed = JSON.parse(text);
  if (parsed.app !== "pl300-study-lab" || !parsed.state) throw new Error("This isn't a PL-300 Study Lab progress file.");
  state = { ...blank(), ...parsed.state };
  save();
}
export function resetProgress() { state = blank(); save(); }
