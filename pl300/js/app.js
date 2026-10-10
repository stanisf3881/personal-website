import { DOMAINS, GROUPS, SKILLS, groupOf, learnSearch, SYLLABUS_VERSION, STUDY_GUIDE_URL, PRACTICE_ASSESSMENT_URL, EXAM_SANDBOX_URL } from "./data/syllabus.js";
import { LESSON_ZERO, PRIMERS } from "./data/lessons.js";
import { PLAN } from "./data/plan.js";
import { CAPSTONES } from "./data/capstones.js";
import * as store from "./store.js";
import { BANK, CASES, ALL, byId, renderQuestion, grade, correctAnswerText, responseText, shuffle } from "./quiz.js";
import { PROVIDERS, aiReady, chat } from "./ai.js";
import { tutorSystem, STARTERS, teachPrompt, mistakePrompt, generateQuestions } from "./tutor.js";

const main = document.getElementById("view");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pct = (x) => (x == null ? "–" : Math.round(x * 100) + "%");
const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
let cleanup = null;

// Small Markdown renderer for tutor replies. Everything is HTML-escaped first, so model
// output can never inject markup; only the patterns below become formatting.
function md(text) {
  const blocks = [];
  let src = String(text || "").replace(/```[^\n]*\n?([\s\S]*?)(```|$)/g, (_, code) => { blocks.push(code.replace(/\n$/, "")); return `\u0000${blocks.length - 1}\u0000`; });
  const inline = (s) => esc(s)
    .replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(blocks[+i])}</code>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const out = []; let list = null; let para = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join("<br>")}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`); list = null; } };
  for (const line of src.split("\n")) {
    const code = line.match(/^\u0000(\d+)\u0000$/);
    const h = line.match(/^(#{1,4})\s+(.*)/);
    const ul = line.match(/^\s*[-*•]\s+(.*)/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (code) { flushPara(); flushList(); out.push(`<pre><code>${esc(blocks[+code[1]])}</code></pre>`); }
    else if (h) { flushPara(); flushList(); const lvl = Math.min(4, h[1].length + 2); out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); }
    else if (ul || ol) { flushPara(); const tag = ul ? "ul" : "ol"; if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; } list.items.push((ul || ol)[1]); }
    else if (!line.trim()) { flushPara(); flushList(); }
    else { flushList(); para.push(line); }
  }
  flushPara(); flushList();
  return out.join("");
}
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}
function render(html, focusHeading = true) {
  main.innerHTML = `<div class="view">${html}</div>`;
  if (focusHeading) { main.querySelector("h1")?.setAttribute("tabindex", "-1"); }
}
function askTutor(text) {
  try { sessionStorage.setItem("tutor-prefill", text); } catch { /* storage unavailable */ }
  location.hash = "#/tutor";
}
// Delegated handler for "teach me" and "ask the tutor" buttons anywhere.
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-teach]");
  if (t) { e.preventDefault(); askTutor(teachPrompt(t.dataset.teach)); }
  const a = e.target.closest("[data-ask]");
  if (a) { e.preventDefault(); askTutor(a.dataset.ask); }
});

/* ---------- shared pieces ---------- */
function scaleHTML(score, marks = []) {
  const pos = (v) => Math.max(0, Math.min(100, v / 10));
  return `<div class="scale" role="img" aria-label="Projected score ${score} of 1000; 700 is a pass">
    <div class="scale-track"><div class="scale-ticks"></div>
      <div class="scale-fill" style="width:${pos(score)}%"></div>
      ${marks.map((m) => `<div class="scale-mark" style="left:${pos(m.v)}%"><span>${esc(m.label)}</span></div>`).join("")}
      <div class="scale-pass"></div>
    </div>
    <div class="scale-labels"><span>0</span><span>250</span><span>500</span><span>750</span><span>1000</span></div>
  </div>`;
}
function barHTML(label, score, sub = "") {
  return `<div class="bar ${score < 0.75 ? "low" : ""}"><span class="lbl">${esc(label)}${sub ? ` <span class="small">${esc(sub)}</span>` : ""}</span><span class="pct">${pct(score)}</span><span class="track"><i style="width:${Math.round(score * 100)}%"></i><b></b></span></div>`;
}
function setNav(route) {
  document.querySelectorAll("[data-route]").forEach((a) => {
    if (a.dataset.route === route) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
}

/* ---------- Today ---------- */
function viewToday() {
  const st = store.getState();
  if (!st.startDate) {
    render(`
      <h1>Pass PL-300 in 30 days, starting from zero</h1>
      <p class="lede">This lab teaches every skill on Microsoft's current PL-300 outline (${esc(SYLLABUS_VERSION)}) as if you've never opened Power BI, finds your weak spots, and keeps aiming practice at them until you're ready.</p>
      <div class="sheet">
        <h2 style="margin-top:0">How it works</h2>
        <ol>
          <li><strong>Lesson zero</strong> gets Power BI Desktop, a service account and the AI tutor working.</li>
          <li><strong>The diagnostic</strong> measures your starting point across all four exam areas.</li>
          <li><strong>Daily plan</strong>: 4–8 hours a day of lessons, tutor sessions and adaptive practice.</li>
          <li><strong>Three finance capstones</strong>, beginner to advanced, build the hands-on skills the exam assumes.</li>
          <li><strong>Mock exams</strong> under a 100-minute timer. You're marked exam-ready only when two mocks score 800+, every skill group is at 75%+, and all three capstones are done.</li>
        </ol>
        <div class="row"><button class="btn primary" id="start">Start day 1</button><a class="btn quiet" href="#/learn/L0">Read lesson zero first</a></div>
      </div>
      <p class="small">Practice questions here are original, written to match the exam's formats and skills. Real PL-300 questions are confidential, and "dump" sites that sell them can get a certification revoked.</p>`);
    document.getElementById("start").onclick = () => { store.ensureStarted(); route(); };
    return;
  }
  const day = store.studyDay();
  const plan = PLAN[Math.min(day, PLAN.length) - 1];
  const proj = store.projectedScore();
  const marks = st.mocks.slice(-3).map((m, i, a) => ({ v: m.score, label: `Mock ${st.mocks.length - a.length + i + 1}` }));
  const rd = store.readiness(CAPSTONES);
  const weak = store.weakestSkills(3);
  const tasks = plan.tasks.map((t, i) => {
    const k = `${plan.day}-${i}`; const done = !!st.planDone[k];
    return `<li><input type="checkbox" id="t${i}" data-k="${k}" ${done ? "checked" : ""}><label for="t${i}" class="${done ? "done" : ""}">${esc(t)}</label></li>`;
  }).join("");
  render(`
    <div class="spread"><h1>Day ${day}${day > 30 ? "" : " of 30"}: ${esc(plan.title)}</h1></div>
    ${day > 30 ? `<div class="notice">You're past the 30-day plan. Keep using adaptive practice and mocks until the readiness checklist is complete.</div>` : ""}
    ${!st.diagnostic ? `<div class="notice">You haven't taken the diagnostic yet. It takes about 30 minutes and tells the tutor where to start. <a href="#/diagnostic">Take the diagnostic</a></div>` : ""}
    <div class="sheet">
      <h2 style="margin-top:0">Today's plan</h2>
      <ul class="checks" id="tasks">${tasks}</ul>
      ${plan.groups.length ? `<div class="row" style="margin-top:12px">${plan.groups.map((g) => `<a class="btn sm quiet" href="#/learn/${g}">Lesson ${g}</a><a class="btn sm quiet" href="#/practice/group/${g}">Practice ${g}</a>`).join("")}</div>` : ""}
    </div>
    <div class="sheet">
      <div class="spread"><h2 style="margin-top:0">Projected score</h2><span class="bignum">${proj}</span></div>
      ${scaleHTML(proj, marks)}
      <p class="small">Weighted by the official domain percentages, with untested skills counted as zero. It rises as you cover and master more skills.</p>
    </div>
    <div class="grid2">
      <div class="sheet">
        <h2 style="margin-top:0">Focus next</h2>
        <div class="list">${weak.map((s) => `<div><span><span class="t">${esc(s.name)}</span><br><span class="sub">${s.id} · ${s.m == null ? "not tested yet" : pct(s.m) + " mastery"}</span></span><span class="row"><button class="btn sm quiet" data-teach="${s.id}">Teach me</button><a class="btn sm" href="#/practice/skill/${s.id}">Practice</a></span></div>`).join("")}</div>
      </div>
      <div class="sheet">
        <h2 style="margin-top:0">Exam areas</h2>
        <div class="bars">${DOMAINS.map((d) => barHTML(d.name, store.domainStats(d.id).score, d.weight)).join("")}</div>
        <p style="margin-top:14px"><a href="#/ready">Readiness: ${[rd.diagOk, rd.groupsOk, rd.capsOk, rd.mocksOk].filter(Boolean).length} of 4 conditions met</a></p>
      </div>
    </div>`);
  main.querySelectorAll("#tasks input").forEach((cb) => cb.addEventListener("change", () => {
    if (cb.checked) st.planDone[cb.dataset.k] = true; else delete st.planDone[cb.dataset.k];
    store.save(); cb.nextElementSibling.classList.toggle("done", cb.checked);
  }));
}

/* ---------- Learn ---------- */
function viewLearn() {
  const st = store.getState();
  render(`
    <h1>Learn</h1>
    <p class="lede">Every skill Microsoft lists for PL-300, grouped the way the exam is. Read the primer, then have the tutor teach each skill from zero and practice it.</p>
    <div class="list" style="margin-bottom:24px"><a href="#/learn/L0"><span><span class="t">${esc(LESSON_ZERO.title)}</span><br><span class="sub">Install, accounts, data files, AI key · about ${LESSON_ZERO.minutes} minutes</span></span><span class="pill ${st.lessonsRead.L0 ? "ok" : ""}">${st.lessonsRead.L0 ? "Done" : "Start here"}</span></a></div>
    ${DOMAINS.map((d) => `
      <h2>${esc(d.name)} <span class="small">${d.weight} of the exam</span></h2>
      <div class="list">${GROUPS.filter((g) => g.domain === d.id).map((g) => {
        const s = store.groupStats(g.id);
        return `<a href="#/learn/${g.id}"><span><span class="t">${esc(g.name)}</span><br><span class="sub">${g.id} · ${g.skills.length} skills · ${s.tested}/${s.total} tested${st.lessonsRead[g.id] ? " · primer read" : ""}</span></span><span class="pill ${s.score >= 0.75 ? "ok" : ""}">${pct(s.score)}</span></a>`;
      }).join("")}</div>`).join("")}
    <p class="small" style="margin-top:20px">Source: <a href="${STUDY_GUIDE_URL}" target="_blank" rel="noopener">Microsoft's PL-300 study guide</a>. Check its change log before exam day.</p>`);
}
function viewLesson(id) {
  const st = store.getState();
  if (id === "L0") {
    render(`<p class="small"><a href="#/learn">Learn</a></p><h1>${esc(LESSON_ZERO.title)}</h1><div class="prose">${LESSON_ZERO.html}</div>
      <div class="row"><button class="btn primary" id="done">${st.lessonsRead.L0 ? "Done" : "Mark lesson zero done"}</button><a class="btn quiet" href="#/settings">Set up the AI tutor</a><a class="btn quiet" href="#/diagnostic">Take the diagnostic</a></div>`);
    document.getElementById("done").onclick = () => { st.lessonsRead.L0 = true; store.ensureStarted(); store.save(); toast("Lesson zero done"); route(); };
    return;
  }
  const g = GROUPS.find((x) => x.id === id);
  if (!g) return viewLearn();
  const dom = DOMAINS.find((d) => d.id === g.domain);
  const bankCount = (sid) => ALL.filter((q) => q.skill === sid).length;
  render(`
    <p class="small"><a href="#/learn">Learn</a> / ${esc(dom.name)}</p>
    <h1>${esc(g.name)}</h1>
    <div class="row" style="margin-bottom:18px"><a class="btn primary" href="#/practice/group/${g.id}">Practice this group</a><button class="btn quiet" data-ask="${esc(`Teach me the whole skill group "${g.name}" (${g.id}) from absolute zero, one skill at a time. Start with the first skill and check my understanding before moving on.`)}">Tutor: teach the whole group</button></div>
    <div class="sheet prose">${PRIMERS[g.id]}</div>
    <div class="row" style="margin-bottom:8px"><button class="btn sm ${st.lessonsRead[g.id] ? "" : "primary"}" id="read">${st.lessonsRead[g.id] ? "Primer read ✓" : "Mark primer as read"}</button></div>
    <h2>Skills in this group</h2>
    <table class="skills-table"><tbody>${g.skills.map(([sid, name]) => {
      const m = store.skillMastery(sid);
      return `<tr><td class="id">${sid}</td><td><strong>${esc(name)}</strong><div class="small">${m == null ? "Not tested yet" : pct(m) + " mastery"} · ${bankCount(sid)} bank question${bankCount(sid) === 1 ? "" : "s"}</div>
        <div class="acts"><button class="btn sm" data-teach="${sid}">Teach me from zero</button><a class="btn sm quiet" href="#/practice/skill/${sid}">Practice</a><a class="btn sm quiet" href="${learnSearch(name)}" target="_blank" rel="noopener">Microsoft Learn</a></div></td></tr>`;
    }).join("")}</tbody></table>`);
  document.getElementById("read").onclick = () => { st.lessonsRead[g.id] = true; store.save(); route(); };
}

/* ---------- Practice ---------- */
function viewPracticeHome() {
  const ai = aiReady(store.getSettings());
  const st = store.getState();
  const recent = st.history.slice(-50);
  const acc = recent.length ? recent.reduce((a, h) => a + h.score, 0) / recent.length : null;
  render(`
    <h1>Practice</h1>
    <p class="lede">${BANK.length} original questions plus ${CASES.length} case studies, each tagged to an official skill. Adaptive mode serves what you're weakest at and brings back questions you missed.</p>
    ${recent.length ? `<p class="small">Last ${recent.length} answers: ${pct(acc)} correct.</p>` : ""}
    <div class="grid2">
      <div class="sheet"><h2 style="margin-top:0">Adaptive practice</h2><p>Mixed questions weighted toward your weakest and untested skills. Missed questions come back a few questions later.</p><a class="btn primary" href="#/practice/adaptive">Start adaptive practice</a></div>
      <div class="sheet"><h2 style="margin-top:0">Fresh AI questions</h2><p>New exam-style questions written by the AI for your weakest skills, so you never run out.</p>${ai ? `<a class="btn" href="#/practice/ai">Generate questions</a>` : `<a class="btn quiet" href="#/settings">Add an API key first</a>`}</div>
    </div>
    <div class="grid2">
      <div class="sheet"><h2 style="margin-top:0">Diagnostic</h2><p>24 questions, no feedback until the end. ${st.diagnostic ? `Last taken ${new Date(st.diagnostic.ts).toLocaleDateString()}: ${pct(st.diagnostic.score)}.` : "Take it first."}</p><a class="btn" href="#/diagnostic">${st.diagnostic ? "Retake diagnostic" : "Take the diagnostic"}</a></div>
      <div class="sheet"><h2 style="margin-top:0">Mock exam</h2><p>50 questions including a case study, 100 minutes, scored out of 1000.</p><a class="btn" href="#/mock">Go to mock exams</a></div>
    </div>
    <h2>Case studies</h2>
    <div class="list">${CASES.map((c) => `<a href="#/practice/case/${c.id}"><span><span class="t">${esc(c.title)}</span><br><span class="sub">${c.questions.length} questions</span></span><span class="pill">Case</span></a>`).join("")}</div>
    <h2>By skill group</h2>
    <div class="list">${GROUPS.map((g) => `<a href="#/practice/group/${g.id}"><span><span class="t">${esc(g.name)}</span><br><span class="sub">${g.id} · ${ALL.filter((q) => groupOf(q.skill).id === g.id).length} questions</span></span><span class="pill ${store.groupStats(g.id).score >= 0.75 ? "ok" : ""}">${pct(store.groupStats(g.id).score)}</span></a>`).join("")}</div>`);
}

function pickAdaptive(pool) {
  const st = store.getState();
  const recent = st.history.slice(-12).map((h) => h.qid);
  let best = null, bestP = -Infinity;
  for (const q of pool) {
    const m = st.skills[q.skill]?.m ?? 0;
    const a = st.answered[q.id];
    let p = (1 - m) * 2 + (a ? 0 : 1) + Math.random() * 0.6;
    if (a?.wrongAt && st.totalAnswered - a.wrongAt >= 5) p += 2;
    if (a && a.lastScore === 1 && a.n >= 2) p -= 1;
    if (recent.includes(q.id)) p -= 6;
    if (p > bestP) { bestP = p; best = q; }
  }
  return best;
}

function viewPracticeSession(kind, arg) {
  const settings = store.getSettings();
  let title, pool = [], caseObj = null, aiTargets = null;
  if (kind === "adaptive") { title = "Adaptive practice"; pool = BANK; }
  else if (kind === "group") { const g = GROUPS.find((x) => x.id === arg); if (!g) return viewPracticeHome(); title = g.name; pool = ALL.filter((q) => groupOf(q.skill).id === g.id); aiTargets = g.skills.map((s) => s[0]); }
  else if (kind === "skill") { const s = SKILLS[arg]; if (!s) return viewPracticeHome(); title = s.name; pool = ALL.filter((q) => q.skill === s.id); aiTargets = [s.id]; }
  else if (kind === "case") { caseObj = CASES.find((c) => c.id === arg); if (!caseObj) return viewPracticeHome(); title = caseObj.title; pool = caseObj.questions; }
  else if (kind === "ai") { title = "Fresh AI questions"; }

  const session = { n: 0, sum: 0, aiQueue: [], caseIdx: 0, busy: false };
  const canAI = aiReady(settings);
  const ac = new AbortController();
  cleanup = () => ac.abort();

  async function fillAI() {
    const targets = aiTargets || store.weakestSkills(4).map((s) => s.id);
    const chosen = shuffle(targets).slice(0, 3);
    const qs = await generateQuestions(settings, chosen, 3, ac.signal);
    session.aiQueue.push(...qs);
  }

  async function nextQuestion() {
    if (caseObj) return caseObj.questions[session.caseIdx] || null;
    if (kind === "ai" || (aiTargets && canAI && session.useAI)) {
      if (!session.aiQueue.length) await fillAI();
      return session.aiQueue.shift();
    }
    const seenThisSession = session.seen || (session.seen = new Set());
    let candidates = pool.filter((q) => !seenThisSession.has(q.id));
    if (!candidates.length) return null;
    const q = pickAdaptive(candidates);
    seenThisSession.add(q.id);
    return q;
  }

  async function show() {
    const wrap = main.querySelector("#qwrap");
    wrap.innerHTML = `<div class="qcard"><p class="typing">${kind === "ai" || session.useAI ? "Writing fresh questions for your weak spots" : "Loading"}</p></div>`;
    let q;
    try { q = await nextQuestion(); }
    catch (e) { if (e.name === "AbortError") return; wrap.innerHTML = `<div class="notice">${esc(e.message)}</div><div class="row"><button class="btn" id="retry">Try again</button></div>`; wrap.querySelector("#retry").onclick = show; return; }
    if (!q) {
      wrap.innerHTML = `<div class="sheet"><h2 style="margin-top:0">${caseObj ? "Case study finished" : "You've answered every bank question here"}</h2><p>Session score: ${session.n ? pct(session.sum / session.n) : "–"} over ${session.n} questions.</p>
        <div class="row">${aiTargets && canAI ? `<button class="btn primary" id="moreai">Continue with fresh AI questions</button>` : ""}${aiTargets && !canAI ? `<a class="btn" href="#/settings">Add an API key for unlimited questions</a>` : ""}<a class="btn quiet" href="#/practice">Back to practice</a></div></div>`;
      wrap.querySelector("#moreai")?.addEventListener("click", () => { session.useAI = true; show(); });
      return;
    }
    let checked = false;
    const sk = SKILLS[q.skill];
    wrap.innerHTML = `
      <div class="qcard">
        <div class="qmeta"><span>${esc(sk.id)} · ${esc(sk.name)}</span><span>${q.ai ? "AI-generated" : q.id}${q.d ? " · difficulty " + q.d : ""}</span></div>
        <div id="q"></div>
        <div id="fb"></div>
        <div class="qactions" id="acts"><button class="btn primary" id="check" disabled>Check answer</button><button class="btn quiet" id="idk">I don't know yet</button></div>
      </div>`;
    const qel = wrap.querySelector("#q");
    const btn = wrap.querySelector("#check");
    let ctl = renderQuestion(qel, q, { onChange: () => { btn.disabled = !ctl.isComplete(); } });
    btn.disabled = !ctl.isComplete();
    const finish = (resp) => {
      if (checked) return; checked = true;
      const score = grade(q, resp);
      store.recordAnswer(q, score, kind === "case" ? "case" : "practice");
      session.n++; session.sum += score;
      renderQuestion(qel, q, { response: resp === "skip" ? undefined : resp, locked: true, showResult: true });
      const cls = resp === "skip" ? "part" : score === 1 ? "" : score > 0 ? "part" : "bad";
      const head = resp === "skip" ? "Here's the answer" : score === 1 ? "Correct" : score > 0 ? `Partly right: ${pct(score)}` : "Not quite";
      wrap.querySelector("#fb").innerHTML = `<div class="feedback ${cls}" role="status"><h3>${head}</h3>${q.type === "single" || q.type === "multi" ? `<p><strong>Answer:</strong> ${esc(correctAnswerText(q))}</p>` : ""}<p>${esc(q.explain || "")}</p></div>`;
      const acts = wrap.querySelector("#acts");
      const mistake = mistakePrompt(q, responseText(q, resp), correctAnswerText(q));
      acts.innerHTML = `<button class="btn primary" id="next">${caseObj && session.caseIdx >= caseObj.questions.length - 1 ? "Finish" : "Next question"}</button>
        ${score < 1 ? `<button class="btn" id="explain">Explain my mistake</button>` : ""}<button class="btn quiet" data-teach="${q.skill}">Teach me this skill</button>`;
      acts.querySelector("#next").onclick = () => { session.caseIdx++; show(); updateHead(); };
      acts.querySelector("#explain")?.addEventListener("click", () => askTutor(mistake));
      acts.querySelector("#next").focus();
      updateHead();
    };
    btn.onclick = () => finish(ctl.getResponse());
    wrap.querySelector("#idk").onclick = () => finish("skip");
  }

  function updateHead() {
    const el = main.querySelector("#sess");
    if (el) el.textContent = session.n ? `${session.n} answered · ${pct(session.sum / session.n)}` : "";
  }

  if (kind === "ai" && !canAI) {
    render(`<h1>Fresh AI questions</h1><div class="notice">Add your API key in <a href="#/settings">Settings</a> to generate unlimited questions.</div>`);
    return;
  }
  render(`
    <p class="small"><a href="#/practice">Practice</a></p>
    <div class="spread"><h1>${esc(title)}</h1><span class="small" id="sess"></span></div>
    ${caseObj ? `<details class="case" open><summary>Case study: read the scenario</summary><div>${caseObj.scenario}</div></details>` : ""}
    <div id="qwrap"></div>
    ${aiTargets && canAI ? `<p class="small" style="margin-top:16px"><button class="linkbtn" id="useai">Switch to fresh AI questions for this ${kind}</button></p>` : ""}`);
  main.querySelector("#useai")?.addEventListener("click", (e) => { session.useAI = true; e.target.remove(); show(); });
  show();
}

/* ---------- Diagnostic ---------- */
function viewDiagnostic() {
  const picks = [];
  for (const d of DOMAINS) {
    const groups = GROUPS.filter((g) => g.domain === d.id);
    const byGroup = groups.map((g) => shuffle(BANK.filter((q) => groupOf(q.skill).id === g.id && (q.d || 2) <= 2)));
    let i = 0, taken = 0;
    while (taken < 6 && byGroup.some((a) => a.length)) {
      const arr = byGroup[i % byGroup.length];
      if (arr.length) { picks.push(arr.shift()); taken++; }
      i++;
    }
  }
  const qs = shuffle(picks);
  let idx = 0; const responses = [];
  render(`<h1>Diagnostic</h1>
    <p class="lede">${qs.length} questions across all four exam areas. You won't see answers until the end. If you don't know something, say so: guessing hides what you need to learn.</p>
    <div class="spread"><span class="small" id="prog"></span></div>
    <div id="qwrap"></div>`);
  function show() {
    const q = qs[idx];
    main.querySelector("#prog").textContent = `Question ${idx + 1} of ${qs.length}`;
    const wrap = main.querySelector("#qwrap");
    wrap.innerHTML = `<div class="qcard"><div id="q"></div><div class="qactions"><button class="btn primary" id="next" disabled>${idx === qs.length - 1 ? "Finish" : "Next"}</button><button class="btn quiet" id="idk">I don't know</button></div></div>`;
    const btn = wrap.querySelector("#next");
    const ctl = renderQuestion(wrap.querySelector("#q"), q, { onChange: () => { btn.disabled = !ctl.isComplete(); } });
    btn.disabled = !ctl.isComplete();
    const go = (r) => { responses[idx] = r; idx++; if (idx < qs.length) show(); else finish(); };
    btn.onclick = () => go(ctl.getResponse());
    wrap.querySelector("#idk").onclick = () => go("skip");
  }
  function finish() {
    const st = store.getState();
    const byDomain = {};
    let total = 0;
    qs.forEach((q, i) => {
      const s = grade(q, responses[i]); total += s;
      store.recordAnswer(q, s, "diagnostic");
      const d = q.skill[0]; byDomain[d] = byDomain[d] || { sum: 0, n: 0 }; byDomain[d].sum += s; byDomain[d].n++;
    });
    st.diagnostic = { ts: Date.now(), score: total / qs.length, byDomain: Object.fromEntries(Object.entries(byDomain).map(([k, v]) => [k, v.sum / v.n])) };
    store.ensureStarted(); store.save();
    render(`<h1>Your starting line</h1>
      <div class="sheet"><div class="spread"><h2 style="margin-top:0">Overall</h2><span class="bignum">${pct(st.diagnostic.score)}</span></div>
      <div class="bars">${DOMAINS.map((d) => barHTML(d.name, st.diagnostic.byDomain[d.id] ?? 0)).join("")}</div></div>
      <p>A low score here is normal and useful: the tutor and adaptive practice now know where to aim. Review what you missed below, then follow today's plan.</p>
      <div class="row"><a class="btn primary" href="#/">Go to today's plan</a><button class="btn" data-ask="I just finished the diagnostic. Based on my results, explain in plain words where I stand, then start teaching the most important weak area from zero.">Talk it through with the tutor</button></div>
      <h2>Review</h2>
      ${qs.map((q, i) => { const s = grade(q, responses[i]); return `<details class="sheet"><summary><span class="pill ${s === 1 ? "ok" : s > 0 ? "" : "bad"}">${s === 1 ? "Right" : s > 0 ? pct(s) : responses[i] === "skip" ? "Didn't know" : "Wrong"}</span> ${esc(q.q.slice(0, 110))}${q.q.length > 110 ? "…" : ""}</summary><div style="margin-top:12px"><p><strong>Correct:</strong> ${esc(correctAnswerText(q))}</p><p>${esc(q.explain)}</p><button class="btn sm quiet" data-teach="${q.skill}">Teach me ${q.skill}</button></div></details>`; }).join("")}`);
  }
  show();
}

/* ---------- Mock exam ---------- */
const MOCK_KEY = "pl300-studylab-mock-live";
const MOCK_MIX = { P: 12, M: 12, V: 13, S: 8 };
const MOCK_MINUTES = 100;
function loadLive() { try { return JSON.parse(localStorage.getItem(MOCK_KEY) || "null"); } catch { return null; } }
function saveLive(x) { try { if (x) localStorage.setItem(MOCK_KEY, JSON.stringify(x)); else localStorage.removeItem(MOCK_KEY); } catch { /* ignore */ } }

function buildMock() {
  const st = store.getState();
  const ids = [];
  for (const [d, n] of Object.entries(MOCK_MIX)) {
    const pool = BANK.filter((q) => q.skill[0] === d);
    // Prefer questions answered least, so repeated mocks rotate through the bank.
    const ordered = shuffle(pool).sort((a, b) => (st.answered[a.id]?.n || 0) - (st.answered[b.id]?.n || 0));
    ids.push(...ordered.slice(0, n).map((q) => q.id));
  }
  const cs = CASES[st.mocks.length % CASES.length];
  return { ids: shuffle(ids).concat(cs.questions.map((q) => q.id)), caseId: cs.id, responses: {}, flags: {}, cur: 0, start: Date.now(), deadline: Date.now() + MOCK_MINUTES * 60000 };
}

function viewMockHome() {
  const st = store.getState();
  const live = loadLive();
  render(`<h1>Mock exam</h1>
    <p class="lede">50 questions: 45 standalone questions in proportion to the official domain weights, then one case study. 100 minutes. You can flag questions and go back. Scores are scaled to 1000 with 700 as the pass mark.</p>
    ${live ? `<div class="notice">You have a mock in progress. <a href="#/mock/run">Resume it</a></div>` : ""}
    <div class="sheet">
      <h2 style="margin-top:0">Before you start</h2>
      <ul><li>Sit somewhere quiet and don't use notes or the tutor, like the real exam.</li><li>Microsoft scales real scores, so 700 isn't exactly 70%. Here the scale is your average credit × 1000, a close stand-in.</li><li>Readiness needs your two most recent mocks at 800 or higher, a safety margin above 700.</li></ul>
      <button class="btn primary" id="go">${live ? "Start a new mock (discards the one in progress)" : "Start mock exam"}</button>
    </div>
    ${st.mocks.length ? `<h2>Your mocks</h2>
      <div class="sheet">${scaleHTML(st.mocks[st.mocks.length - 1].score, st.mocks.map((m, i) => ({ v: m.score, label: "#" + (i + 1) })))}</div>
      <div class="list">${st.mocks.map((m, i) => `<a href="#/mock/result/${i}"><span><span class="t">Mock ${i + 1}: ${m.score}</span><br><span class="sub">${new Date(m.ts).toLocaleString()} · ${Math.round(m.seconds / 60)} min</span></span><span class="pill ${m.score >= 800 ? "ok" : m.score >= 700 ? "" : "bad"}">${m.score >= 700 ? "Pass" : "Below 700"}</span></a>`).reverse().join("")}</div>` : ""}`);
  main.querySelector("#go").onclick = () => { saveLive(buildMock()); location.hash = "#/mock/run"; };
}

function viewMockRun() {
  const live = loadLive();
  if (!live) { location.hash = "#/mock"; return; }
  const qs = live.ids.map(byId).filter(Boolean);
  const caseObj = CASES.find((c) => c.id === live.caseId);
  let timer = null;
  cleanup = () => clearInterval(timer);

  render(`<div class="examhead"><strong>Mock exam</strong><span class="timer" id="timer" aria-live="off"></span><button class="btn sm" id="review">Review &amp; submit</button></div><div id="body"></div>`);
  const tick = () => {
    const left = Math.max(0, live.deadline - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
    const el = main.querySelector("#timer");
    if (el) { el.textContent = `${m}:${String(s).padStart(2, "0")}`; el.classList.toggle("low", left < 10 * 60000); }
    if (left <= 0) { clearInterval(timer); submit(true); }
  };
  timer = setInterval(tick, 1000); tick();
  main.querySelector("#review").onclick = showReview;

  function showQ(i) {
    live.cur = i; saveLive(live);
    const q = qs[i];
    const body = main.querySelector("#body");
    const inCase = !!q.caseId;
    body.innerHTML = `
      <div class="qmeta"><span>Question ${i + 1} of ${qs.length}${inCase ? " · Case study" : ""}</span><label class="row"><input type="checkbox" id="flag" ${live.flags[q.id] ? "checked" : ""}> Flag for review</label></div>
      ${inCase ? `<details class="case" ${q.id.endsWith("-1") ? "open" : ""}><summary>${esc(caseObj.title)}: scenario</summary><div>${caseObj.scenario}</div></details>` : ""}
      <div class="qcard"><div id="q"></div></div>
      <div class="qactions"><button class="btn quiet" id="prev" ${i === 0 ? "disabled" : ""}>Previous</button><button class="btn primary" id="next">${i === qs.length - 1 ? "Review & submit" : "Next"}</button></div>`;
    renderQuestion(body.querySelector("#q"), q, { response: live.responses[q.id], onChange: (r) => { live.responses[q.id] = r; saveLive(live); } });
    body.querySelector("#flag").onchange = (e) => { live.flags[q.id] = e.target.checked; saveLive(live); };
    body.querySelector("#prev").onclick = () => showQ(i - 1);
    body.querySelector("#next").onclick = () => (i === qs.length - 1 ? showReview() : showQ(i + 1));
    window.scrollTo(0, 0);
  }
  function showReview() {
    const body = main.querySelector("#body");
    const answered = qs.filter((q) => live.responses[q.id] != null).length;
    body.innerHTML = `<h1>Review your answers</h1><p>${answered} of ${qs.length} answered. Flagged questions have a dot. Select a number to go back.</p>
      <div class="navgrid">${qs.map((q, i) => `<button data-i="${i}" class="${live.responses[q.id] != null ? "ans" : ""} ${live.flags[q.id] ? "flag" : ""}" aria-label="Question ${i + 1}${live.flags[q.id] ? ", flagged" : ""}${live.responses[q.id] != null ? ", answered" : ""}">${i + 1}</button>`).join("")}</div>
      <div class="qactions"><button class="btn primary" id="submit">Submit exam</button><button class="btn quiet" id="back">Back to question ${live.cur + 1}</button></div>`;
    body.querySelectorAll(".navgrid button").forEach((b) => (b.onclick = () => showQ(+b.dataset.i)));
    body.querySelector("#back").onclick = () => showQ(live.cur);
    body.querySelector("#submit").onclick = () => { if (confirm(`Submit now? ${qs.length - answered} unanswered question(s) will score zero.`)) submit(false); };
  }
  function submit(timeUp) {
    clearInterval(timer);
    const st = store.getState();
    const byDomain = {}; let sum = 0;
    const items = qs.map((q) => {
      const r = live.responses[q.id];
      const s = r != null ? grade(q, r) : 0;
      sum += s;
      const d = q.skill[0]; byDomain[d] = byDomain[d] || { sum: 0, n: 0 }; byDomain[d].sum += s; byDomain[d].n++;
      store.recordAnswer(q, s, "mock");
      return { id: q.id, s: Math.round(s * 100) / 100, r: r ?? null };
    });
    st.mocks.push({ ts: Date.now(), score: Math.round((sum / qs.length) * 1000), byDomain: Object.fromEntries(Object.entries(byDomain).map(([k, v]) => [k, v.sum / v.n])), seconds: Math.round((Date.now() - live.start) / 1000), n: qs.length, items, timeUp });
    store.save(); saveLive(null);
    location.hash = `#/mock/result/${st.mocks.length - 1}`;
  }
  showQ(live.cur || 0);
}

function viewMockResult(i) {
  const st = store.getState();
  const m = st.mocks[+i];
  if (!m) { location.hash = "#/mock"; return; }
  const misses = m.items.filter((it) => it.s < 1);
  render(`<p class="small"><a href="#/mock">Mock exams</a></p>
    <h1>Mock ${+i + 1}: ${m.score} / 1000</h1>
    ${m.timeUp ? `<div class="notice">Time ran out; unanswered questions scored zero.</div>` : ""}
    <div class="sheet">${scaleHTML(m.score, [{ v: m.score, label: "This mock" }])}
      <p><span class="pill ${m.score >= 800 ? "ok" : m.score >= 700 ? "" : "bad"}">${m.score >= 800 ? "Pass with margin" : m.score >= 700 ? "Pass, but under the 800 readiness bar" : "Below the pass mark"}</span> · ${Math.round(m.seconds / 60)} minutes</p>
      <div class="bars">${DOMAINS.map((d) => barHTML(d.name, m.byDomain[d.id] ?? 0)).join("")}</div>
    </div>
    <div class="row"><a class="btn primary" href="#/practice/adaptive">Practice your weak spots</a><button class="btn" data-ask="${esc(`I scored ${m.score}/1000 on a mock exam. By domain: ${DOMAINS.map((d) => d.name + " " + pct(m.byDomain[d.id] ?? 0)).join(", ")}. I missed questions on these skills: ${[...new Set(misses.map((x) => byId(x.id)?.skill))].join(", ")}. Make me a focused plan for the next two study days, then start teaching the weakest skill from zero.`)}">Plan my next two days with the tutor</button></div>
    <h2>Questions to review (${misses.length})</h2>
    ${misses.map((it) => { const q = byId(it.id); if (!q) return ""; return `<details class="sheet"><summary><span class="pill ${it.s > 0 ? "" : "bad"}">${it.s > 0 ? pct(it.s) : it.r == null ? "Unanswered" : "Wrong"}</span> ${esc(q.skill)} · ${esc(q.q.slice(0, 100))}${q.q.length > 100 ? "…" : ""}</summary><div class="qrev" data-id="${q.id}" style="margin-top:12px"></div><p>${esc(q.explain)}</p><div class="row"><button class="btn sm" data-ask="${esc(mistakePrompt(q, responseText(q, it.r ?? "skip"), correctAnswerText(q)))}">Explain my mistake</button><button class="btn sm quiet" data-teach="${q.skill}">Teach me ${q.skill}</button></div></details>`; }).join("")}`);
  main.querySelectorAll("details.sheet").forEach((d) => d.addEventListener("toggle", () => {
    const box = d.querySelector(".qrev");
    if (d.open && !box.dataset.done) {
      const it = m.items.find((x) => x.id === box.dataset.id);
      renderQuestion(box, byId(it.id), { response: it.r ?? undefined, locked: true, showResult: true });
      box.dataset.done = 1;
    }
  }));
}

/* ---------- Capstones ---------- */
function viewCapstones() {
  const day = store.studyDay();
  render(`<h1>Capstone projects</h1>
    <p class="lede">Three guided builds in Power BI Desktop with real-looking finance data. Each step names the exam skills it trains, and checkpoints confirm your numbers match the data exactly. All three must be finished before you're marked exam-ready.</p>
    ${CAPSTONES.map((c) => {
      const cp = store.capstone(c.id);
      const stepsDone = c.steps.filter((_, i) => cp.steps[i]).length;
      const checks = c.checkpoints.filter((k) => cp.checks[k.id]?.ok).length;
      const done = stepsDone === c.steps.length && checks === c.checkpoints.length;
      return `<div class="sheet"><div class="spread"><span class="chip lvl">${c.level}</span><span class="pill ${done ? "ok" : ""}">${done ? "Complete" : `${stepsDone}/${c.steps.length} steps · ${checks}/${c.checkpoints.length} checkpoints`}</span></div>
        <h2 style="margin-top:10px">${esc(c.title)}</h2><p>${esc(c.story)}</p>
        <p class="small">Planned for day ${c.unlockDay}${day < c.unlockDay ? ` (you're on day ${day}; you can start early)` : ""} · ${c.skills.length} exam skills</p>
        <a class="btn ${done ? "quiet" : "primary"}" href="#/capstones/${c.id}">${stepsDone ? "Continue" : "Open project"}</a></div>`;
    }).join("")}`);
}
function normalizeNum(s) { const t = String(s).replace(/[,$£€\s%]/g, "").replace(/^\((.*)\)$/, "-$1"); return t === "" ? NaN : Number(t); }
function viewCapstone(id) {
  const c = CAPSTONES.find((x) => x.id === id);
  if (!c) return viewCapstones();
  const cp = store.capstone(c.id);
  const cpById = Object.fromEntries(c.checkpoints.map((k) => [k.id, k]));
  const cpHTML = (k) => {
    const res = cp.checks[k.id];
    return `<div class="cp ${res?.ok ? "ok" : ""}" data-cp="${k.id}"><label for="in-${k.id}"><strong>Checkpoint:</strong> ${esc(k.q)}</label>
      <div class="row"><input type="text" inputmode="${k.text ? "text" : "decimal"}" id="in-${k.id}" value="${esc(res?.value ?? "")}" autocomplete="off"><button class="btn sm" data-check="${k.id}">Check</button></div>
      <span class="small" data-msg="${k.id}" role="status">${res?.ok ? "✓ Matches the data." : res ? "Not matching yet." : ""}</span></div>`;
  };
  render(`<p class="small"><a href="#/capstones">Capstones</a></p>
    <span class="chip lvl">${c.level}</span>
    <h1 style="margin-top:10px">${esc(c.title)}</h1>
    <p class="lede">${esc(c.story)}</p>
    <div class="grid2">
      <div class="sheet"><h2 style="margin-top:0">Data files</h2><a class="btn primary" href="${c.zip}" download>Download all files (.zip)</a><div class="files" style="margin-top:10px">${c.files.map(([p, d]) => `<a href="${p}" download>${esc(p.split("/").pop())}</a><span class="small">${esc(d)}</span>`).join("")}</div></div>
      <div class="sheet"><h2 style="margin-top:0">Exam skills trained</h2><div class="chips">${c.skills.map((s) => `<span class="chip" title="${esc(SKILLS[s].name)}">${s}</span>`).join("")}</div>
      <p class="small" style="margin-top:12px">Stuck on a step? Use its "Ask the tutor" button: it sends the step and your question to the tutor.</p></div>
    </div>
    <h2>Steps</h2>
    <div id="steps">${c.steps.map((s, i) => {
      const cps = s.checkpoint ? [].concat(s.checkpoint).map((x) => cpById[x]) : [];
      return `<details class="step ${cp.steps[i] ? "done" : ""}" ${!cp.steps[i] && c.steps.findIndex((_, j) => !cp.steps[j]) === i ? "open" : ""}>
        <summary><span class="n">${i + 1}</span><span class="ttl">${esc(s.title)}</span><span class="chips">${s.skills.map((k) => `<span class="chip">${k}</span>`).join("")}</span></summary>
        <div class="inner prose">${s.html}${s.hint ? `<p class="hint"><strong>Hint:</strong> ${esc(s.hint)}</p>` : ""}${cps.map(cpHTML).join("")}
          <div class="row" style="margin-top:10px"><label class="row"><input type="checkbox" data-step="${i}" ${cp.steps[i] ? "checked" : ""} style="width:22px;height:22px;accent-color:var(--green)"> Step done</label>
          <button class="btn sm quiet" data-ask="${esc(`I'm on step ${i + 1} ("${s.title}") of the ${c.level} capstone "${c.title}". The step says: ${s.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 1400)}\n\nExplain this step to me from zero: what each action does, why we do it, and which exam skills it trains. Then ask me what part I'm stuck on.`)}">Ask the tutor about this step</button></div>
        </div></details>`;
    }).join("")}</div>
    <div id="done"></div>`);

  const refreshDone = () => {
    const stepsDone = c.steps.filter((_, i) => cp.steps[i]).length;
    const ok = c.checkpoints.filter((k) => cp.checks[k.id]?.ok).length;
    main.querySelector("#done").innerHTML = stepsDone === c.steps.length && ok === c.checkpoints.length
      ? `<div class="sheet" style="text-align:center"><span class="ready-stamp">Capstone complete</span><p style="margin-top:14px">Every step done and every number matches. Ask the tutor for a final review of your measures before moving on.</p></div>`
      : `<p class="small">${stepsDone}/${c.steps.length} steps and ${ok}/${c.checkpoints.length} checkpoints complete.</p>`;
  };
  refreshDone();
  main.querySelectorAll("[data-step]").forEach((cb) => cb.addEventListener("change", () => {
    cp.steps[cb.dataset.step] = cb.checked; store.save();
    cb.closest(".step").classList.toggle("done", cb.checked); refreshDone();
  }));
  main.querySelectorAll("[data-check]").forEach((b) => b.addEventListener("click", () => {
    const k = cpById[b.dataset.check];
    const val = main.querySelector(`#in-${k.id}`).value.trim();
    let ok;
    if (k.text) ok = k.text.includes(val.toLowerCase());
    else { const n = normalizeNum(val); ok = !isNaN(n) && Math.abs(n - k.num) <= k.tol; }
    cp.checks[k.id] = { ok, value: val }; store.save();
    const box = main.querySelector(`[data-cp="${k.id}"]`);
    box.classList.toggle("ok", ok);
    const n = normalizeNum(val);
    let msg = ok ? "✓ Matches the data." : "Not matching yet.";
    if (!ok && !k.text && !isNaN(n)) {
      if (Math.abs(n) > Math.abs(k.num) * 5 && k.id.includes("cash")) msg += " Your number is far too large: are you summing balances across days?";
      else if (Math.abs(n - k.num) / Math.abs(k.num) < 0.02) msg += " You're very close: check rounding, display units, or a filter.";
      else msg += " Re-check the previous steps' filters and types, or ask the tutor.";
    }
    main.querySelector(`[data-msg="${k.id}"]`).textContent = msg;
    refreshDone();
  }));
}

/* ---------- Tutor ---------- */
function viewTutor() {
  const settings = store.getSettings();
  const st = store.getState();
  if (!aiReady(settings)) {
    render(`<h1>AI tutor</h1>
      <p class="lede">The tutor teaches each skill as if you've never seen it, checks your understanding with questions, and steers toward the skills your practice shows you're weakest at.</p>
      <div class="notice">To use it, add an API key from Anthropic or OpenAI in <a href="#/settings">Settings</a>. The key is stored only in this browser and sent only to that provider.</div>`);
    return;
  }
  let prefill = null;
  try { prefill = sessionStorage.getItem("tutor-prefill"); sessionStorage.removeItem("tutor-prefill"); } catch { /* ignore */ }
  const ac = new AbortController();
  cleanup = () => ac.abort();
  render(`<div class="spread"><h1>AI tutor</h1><button class="btn sm quiet" id="new">New conversation</button></div>
    <div class="chat" id="chat" aria-live="polite"></div>
    <div class="starters" id="starters"></div>
    <form class="composer" id="form"><label for="msg" class="sr-only">Message the tutor</label><textarea id="msg" rows="2" placeholder="Ask anything about PL-300, paste DAX, or say what confuses you"></textarea><button class="btn primary" id="send">Send</button></form>`);
  const chatEl = main.querySelector("#chat");
  const form = main.querySelector("#form");
  const input = main.querySelector("#msg");
  let busy = false;

  function draw() {
    chatEl.innerHTML = st.tutorThread.map((m) => m.role === "user" ? `<div class="msg user">${esc(m.content)}</div>` : `<div class="msg ai">${md(m.content)}</div>`).join("");
    main.querySelector("#starters").innerHTML = st.tutorThread.length ? "" : STARTERS.map((s, i) => `<button type="button" data-s="${i}">${esc(s.label)}</button>`).join("");
    main.querySelectorAll("[data-s]").forEach((b) => (b.onclick = () => { const s = STARTERS[+b.dataset.s]; send(typeof s.text === "function" ? s.text() : s.text); }));
  }
  async function send(text) {
    if (busy || !text.trim()) return;
    busy = true; main.querySelector("#send").disabled = true;
    st.tutorThread.push({ role: "user", content: text.trim() });
    store.save(); draw();
    const bubble = document.createElement("div");
    bubble.className = "msg ai typing"; bubble.textContent = "";
    chatEl.appendChild(bubble);
    bubble.scrollIntoView({ block: "end" });
    try {
      const history = st.tutorThread.slice(-24);
      const full = await chat(store.getSettings(), { system: tutorSystem(), messages: history, maxTokens: 1500, signal: ac.signal, onDelta: (t) => { bubble.innerHTML = md(t); } });
      bubble.classList.remove("typing");
      st.tutorThread.push({ role: "assistant", content: full });
      if (st.tutorThread.length > 80) st.tutorThread = st.tutorThread.slice(-80);
      store.save();
    } catch (e) {
      if (e.name === "AbortError") return;
      bubble.classList.remove("typing"); bubble.classList.add("err");
      bubble.textContent = e.message.includes("Failed to fetch") ? "Couldn't reach the AI provider. Check your connection, the provider choice, and (for OpenAI-compatible services) that the base URL allows browser requests." : e.message;
      st.tutorThread.pop(); store.save();
      input.value = text;
    } finally { busy = false; const b = main.querySelector("#send"); if (b) b.disabled = false; }
  }
  form.onsubmit = (e) => { e.preventDefault(); const t = input.value; input.value = ""; send(t); };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !matchMedia("(pointer: coarse)").matches) { e.preventDefault(); form.requestSubmit(); } });
  main.querySelector("#new").onclick = () => { if (!st.tutorThread.length || confirm("Start a new conversation? The current one will be cleared.")) { st.tutorThread = []; store.save(); draw(); } };
  draw();
  if (prefill) { if (st.tutorThread.length > 30) st.tutorThread = []; send(prefill); }
  else chatEl.lastElementChild?.scrollIntoView({ block: "end" });
}

/* ---------- Readiness ---------- */
function viewReady() {
  const rd = store.readiness(CAPSTONES);
  const st = store.getState();
  const item = (ok, title, detail) => `<li><span class="status ${ok ? "ok" : ""}">${ok ? "✓" : ""}</span><span><strong>${title}</strong><br><span class="small">${detail}</span></span></li>`;
  render(`<h1>Exam readiness</h1>
    ${rd.ready ? `<div class="sheet" style="text-align:center"><span class="ready-stamp">Exam-ready</span><p style="margin-top:14px">Every condition is met. Book the exam while it's fresh.</p><a class="btn primary" href="https://learn.microsoft.com/en-us/credentials/certifications/exams/pl-300/" target="_blank" rel="noopener">Schedule PL-300 on Microsoft Learn</a></div>`
      : `<p class="lede">You're marked ready only when all four conditions hold at the same time. This is stricter than the real pass mark on purpose.</p>`}
    <div class="sheet"><ul class="checks">
      ${item(rd.diagOk, "Diagnostic taken", rd.diagOk ? `Starting score ${pct(st.diagnostic.score)}` : `<a href="#/diagnostic">Take the diagnostic</a>`)}
      ${item(rd.groupsOk, "Every skill group at 75% or higher", `${rd.groups.filter((g) => g.score >= 0.75).length} of ${rd.groups.length} groups there. Untested skills count as zero.`)}
      ${item(rd.capsOk, "All three capstones complete", rd.caps.map((x) => `${x.c.level}: ${x.done ? "done" : `${x.stepsDone}/${x.c.steps.length} steps, ${x.checksOk}/${x.c.checkpoints.length} checkpoints`}`).join(" · "))}
      ${item(rd.mocksOk, "Two most recent mock exams at 800+", rd.lastMocks.length ? rd.lastMocks.map((m) => m.score).join(" and ") : `<a href="#/mock">No mocks yet</a>`)}
    </ul></div>
    <h2>Skill groups</h2>
    <div class="sheet"><div class="bars">${rd.groups.map((x) => barHTML(`${x.g.id} ${x.g.name}`, x.score, `${x.tested}/${x.total} tested`)).join("")}</div><p class="small" style="margin-top:12px">The faint line on each bar marks 75%.</p></div>
    <h2>Official resources to use before booking</h2>
    <div class="list">
      <a href="${PRACTICE_ASSESSMENT_URL}" target="_blank" rel="noopener"><span><span class="t">Microsoft's free practice assessment</span><br><span class="sub">The closest thing to real exam wording that's legally available</span></span></a>
      <a href="${EXAM_SANDBOX_URL}" target="_blank" rel="noopener"><span><span class="t">Exam sandbox</span><br><span class="sub">Try the real exam interface: case studies, drag and drop, review screen</span></span></a>
      <a href="${STUDY_GUIDE_URL}" target="_blank" rel="noopener"><span><span class="t">PL-300 study guide and change log</span><br><span class="sub">Confirm the skills outline hasn't changed since ${esc(SYLLABUS_VERSION.replace("Skills measured as of ", ""))}</span></span></a>
    </div>`);
}

/* ---------- Settings ---------- */
function viewSettings() {
  const s = store.getSettings();
  const st = store.getState();
  const prov = PROVIDERS[s.provider] || PROVIDERS.anthropic;
  render(`<h1>Settings</h1>
    <h2>AI tutor</h2>
    <div class="sheet">
      <p class="small">Your key is saved only in this browser and sent directly to the provider you choose, never to this site or GitHub. It is not included in progress exports. Usage is billed to your provider account.</p>
      <label class="field">Provider<select class="inp" id="provider">${Object.entries(PROVIDERS).map(([k, v]) => `<option value="${k}" ${k === s.provider ? "selected" : ""}>${esc(v.label)}</option>`).join("")}</select></label>
      <label class="field">API key<input type="password" id="key" value="${esc(s.apiKey)}" placeholder="${esc(prov.keyHint)}" autocomplete="off" spellcheck="false"><span class="small"><label><input type="checkbox" id="show"> Show key</label></span></label>
      <label class="field">Model<input type="text" id="model" value="${esc(s.model)}" placeholder="${esc(prov.defaultModel || "model name")}" list="models" spellcheck="false"><datalist id="models">${prov.models.map((m) => `<option value="${m}">`).join("")}</datalist><span class="small">Leave blank for the default${prov.defaultModel ? ` (${esc(prov.defaultModel)})` : ""}. Any chat model your key can use works.</span></label>
      <label class="field" id="baseRow" ${s.provider === "compatible" ? "" : "hidden"}>Base URL<input type="url" id="base" value="${esc(s.baseUrl)}" placeholder="https://openrouter.ai/api/v1"></label>
      <div class="row"><button class="btn primary" id="saveai">Save</button><button class="btn" id="test">Test connection</button><button class="btn quiet danger" id="forget">Remove key</button></div>
      <p class="small" id="testmsg" role="status"></p>
      <p class="small">Get a key: <a href="https://console.anthropic.com/" target="_blank" rel="noopener">Anthropic Console</a> · <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">OpenAI</a>. Set a monthly spend limit with your provider.</p>
    </div>
    <h2>Study plan</h2>
    <div class="sheet">
      <label class="field">Day 1 of your plan<input type="date" id="start" value="${esc(st.startDate || "")}"><span class="small">Change this if you started earlier or want to restart the 30-day schedule.</span></label>
      <button class="btn" id="savestart">Save start date</button>
    </div>
    <h2>Progress</h2>
    <div class="sheet">
      <p>Progress is saved in this browser. To move to another device or keep a backup, export it to a file, then import it there.</p>
      <div class="row"><button class="btn primary" id="export">Export progress file</button><label class="btn" for="importfile">Import progress file</label><input type="file" id="importfile" accept="application/json,.json" hidden></div>
      <p class="small">${st.totalAnswered} answers, ${st.mocks.length} mocks, ${Object.keys(st.capstones).length} capstones started.</p>
      <button class="btn quiet danger" id="reset">Reset all progress</button>
    </div>
    <h2>About</h2>
    <p class="small">PL-300 Study Lab is an independent study tool built by Franklyn A. Stanislaus. It is not affiliated with or endorsed by Microsoft. All questions, case studies and datasets are original; company names are fictional. Skills follow Microsoft's published outline (${esc(SYLLABUS_VERSION)}).</p>`);
  const $ = (id) => main.querySelector("#" + id);
  $("provider").onchange = () => { store.saveSettings({ provider: $("provider").value, model: "" }); viewSettings(); };
  $("show").onchange = (e) => { $("key").type = e.target.checked ? "text" : "password"; };
  const collect = () => ({ provider: $("provider").value, apiKey: $("key").value.trim(), model: $("model").value.trim(), baseUrl: $("base").value.trim() });
  $("saveai").onclick = () => { store.saveSettings(collect()); toast("AI settings saved"); };
  $("forget").onclick = () => { store.saveSettings({ apiKey: "" }); $("key").value = ""; toast("Key removed from this browser"); };
  $("test").onclick = async () => {
    store.saveSettings(collect());
    const msg = $("testmsg"); msg.textContent = "Testing…";
    try {
      const out = await chat(store.getSettings(), { system: "Reply with exactly: Ready to tutor.", messages: [{ role: "user", content: "Test" }], maxTokens: 20 });
      msg.textContent = "Connected. The model replied: " + out.trim().slice(0, 80);
    } catch (e) { msg.textContent = e.message.includes("Failed to fetch") ? "Couldn't reach the provider from this browser. Check the provider, base URL and your connection." : e.message; }
  };
  $("savestart").onclick = () => { st.startDate = $("start").value || null; store.save(); toast("Start date saved"); };
  $("export").onclick = () => {
    const blob = new Blob([store.exportProgress()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `pl300-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  $("importfile").onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const text = await f.text();
      if (!confirm("Importing replaces the progress in this browser with the file's progress. Continue?")) return;
      store.importProgress(text); toast("Progress imported"); route();
    } catch (err) { alert("Couldn't import that file: " + err.message); }
  };
  $("reset").onclick = () => { if (confirm("Erase all progress in this browser? Export first if you want a backup.") && confirm("This can't be undone. Erase everything?")) { store.resetProgress(); saveLive(null); toast("Progress reset"); location.hash = "#/"; } };
}

/* ---------- Router ---------- */
function route() {
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  const parts = (location.hash.replace(/^#\/?/, "") || "").split("/").filter(Boolean);
  const [a, b, c] = parts;
  const navMap = { "": "today", learn: "learn", practice: "practice", diagnostic: "practice", mock: "mock", capstones: "capstones", tutor: "tutor", ready: "ready", settings: "settings" };
  setNav(navMap[a || ""] || "");
  switch (a) {
    case undefined: viewToday(); break;
    case "learn": b ? viewLesson(b) : viewLearn(); break;
    case "practice":
      if (!b) viewPracticeHome();
      else if (b === "adaptive" || b === "ai") viewPracticeSession(b);
      else viewPracticeSession(b, c);
      break;
    case "diagnostic": viewDiagnostic(); break;
    case "mock": b === "run" ? viewMockRun() : b === "result" ? viewMockResult(c) : viewMockHome(); break;
    case "capstones": b ? viewCapstone(b) : viewCapstones(); break;
    case "tutor": viewTutor(); break;
    case "ready": viewReady(); break;
    case "settings": viewSettings(); break;
    default: viewToday();
  }
  if (a !== "tutor") window.scrollTo(0, 0);
  main.querySelector("h1")?.focus({ preventScroll: true });
}
window.addEventListener("hashchange", route);
route();
