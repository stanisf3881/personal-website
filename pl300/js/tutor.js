// Prompts for the AI tutor. The tutor always assumes zero prior knowledge and aims at the learner's weakest skills.
import { GROUPS, SKILLS, SYLLABUS_VERSION } from "./data/syllabus.js";
import { getState, weakestSkills, groupStats, projectedScore, studyDay } from "./store.js";
import { chat, extractJSON } from "./ai.js";
import { validQuestion } from "./quiz.js";

function syllabusText() {
  return GROUPS.map((g) => `${g.id} ${g.name}\n` + g.skills.map(([id, n]) => `  ${id} ${n}`).join("\n")).join("\n");
}

function learnerSnapshot() {
  const st = getState();
  const weak = weakestSkills(8).map((s) => `${s.id} ${s.name}: ${s.m == null ? "not yet tested" : Math.round(s.m * 100) + "% over " + s.n + " answers"}`).join("\n");
  const groups = GROUPS.map((g) => { const x = groupStats(g.id); return `${g.id} ${g.name}: ${Math.round(x.score * 100)}% (${x.tested}/${x.total} skills tested)`; }).join("\n");
  const recentMisses = st.history.filter((h) => h.score < 1).slice(-6).map((h) => `${h.skill} ${SKILLS[h.skill]?.name}`).join("\n") || "none yet";
  return `Study day ${studyDay()} of a 30-day plan. Projected score from practice: ${projectedScore()}/1000 (700 passes).
Mastery by skill group:
${groups}
Weakest skills:
${weak}
Most recent misses:
${recentMisses}
Mock exams taken: ${st.mocks.length}${st.mocks.length ? ", latest " + st.mocks[st.mocks.length - 1].score : ""}.`;
}

const CORE = `You are a patient, professional tutor preparing one learner for Microsoft exam PL-300: Microsoft Power BI Data Analyst (${SYLLABUS_VERSION}).

How you teach:
- Assume the learner has absolutely no prior knowledge of the topic. Define every term the first time you use it. Never skip a step because it seems obvious.
- Teach one idea at a time. Start with a plain-language explanation and an everyday analogy, then a concrete Power BI example, then the exact menu path or DAX/M code.
- Prefer finance and accounting examples (general ledger, invoices, budgets, receivables, cash balances, P&L) because the learner is aiming at finance analytics.
- After each idea, ask ONE short check question and wait for the answer before moving on. If the answer is wrong or shaky, re-explain differently (new analogy, smaller step) rather than repeating yourself.
- Always connect the idea to how the exam tests it: typical wording, distractors, and traps.
- Keep each reply short enough to read on a phone: usually under 250 words. Use short paragraphs, bullet lists, and code blocks for DAX or M.
- Be accurate about current Power BI behavior. If something depends on licensing, capacity or a tenant setting, say so. If you're unsure, say so rather than guessing.
- Never claim to have real exam questions. Real PL-300 questions are confidential; write original exam-style questions instead, and discourage exam dumps (they violate Microsoft's exam agreement).

Official skills measured (ids are used by this study site):
${syllabusText()}`;

export function tutorSystem(extra = "") {
  return `${CORE}

Current learner progress (use it to choose what to focus on; steer toward weak or untested skills when the learner asks what to study):
${learnerSnapshot()}
${extra}`;
}

export const STARTERS = [
  { label: "What should I study right now?", text: "Look at my progress and tell me the single most valuable thing to study next. Then start teaching it to me from zero." },
  { label: "Teach my weakest skill", text: () => { const w = weakestSkills(1)[0]; return `Teach me skill ${w.id} "${w.name}" from absolute zero, then check my understanding.`; } },
  { label: "Quiz me out loud", text: "Give me 5 original exam-style questions, one at a time, on my weakest areas. Wait for my answer each time, grade it, and explain." },
  { label: "Explain DAX filter context", text: "I have no idea what filter context is. Teach me from zero with a finance example, then check my understanding." },
  { label: "Review a capstone", text: "I'm going to paste my DAX measures and model description from a capstone. Review them like a senior Power BI analyst: correctness, performance, naming, and what the exam would expect." },
];

export function teachPrompt(skillId) {
  const s = SKILLS[skillId];
  return `Teach me skill ${s.id} "${s.name}" from absolute zero. Assume I've never heard any of the terms. Use a finance or accounting example, show where it is in Power BI, explain how the exam tests it, then ask me one check question.`;
}

export function mistakePrompt(q, yourAnswer, correct) {
  return `I got this practice question wrong (skill ${q.skill} ${SKILLS[q.skill]?.name}).

Question: ${q.q}
${q.options ? "Options:\n" + q.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join("\n") : ""}${q.statements ? "Statements:\n" + q.statements.map((s) => "- " + s[0]).join("\n") : ""}${q.template ? "Template: " + q.template : ""}${q.items ? "Items:\n" + q.items.map((t) => "- " + t).join("\n") : ""}

My answer: ${yourAnswer}
Correct answer: ${correct}

Explain from zero why the correct answer is right and why my answer is wrong, what concept I'm missing, and how to recognize this kind of question on the exam. Then ask me one similar question to check I've got it.`;
}

/** Ask the AI for fresh exam-style questions on given skills. Returns validated question objects. */
export async function generateQuestions(settings, skillIds, n = 3, signal) {
  const list = skillIds.map((id) => `${id} ${SKILLS[id].name}`).join("\n");
  const system = `${CORE}\n\nYou write original PL-300 practice questions. Output JSON only.`;
  const prompt = `Write ${n} original exam-style PL-300 questions covering these skills (spread across them):
${list}

Mix formats like the real exam. Use realistic business scenarios, preferably finance/accounting. Each must have one unambiguously correct answer according to current Power BI behavior, and plausible distractors.

Return a JSON array. Each item uses one of these shapes:
{"type":"single","skill":"M2.2","d":2,"q":"...","options":["...","...","...","..."],"answer":0,"explain":"..."}
{"type":"multi","skill":"...","d":2,"q":"Which TWO ...","options":["...","...","...","..."],"answer":[0,2],"explain":"..."}
{"type":"yesno","skill":"...","d":2,"q":"For each statement, choose Yes if it is true.","statements":[["...",true],["...",false],["...",true]],"explain":"..."}
{"type":"dropdown","skill":"...","d":2,"q":"Complete the DAX measure.","template":"Measure = {0}( [Sales], {1}( 'Date'[Date] ) )","blanks":[{"options":["CALCULATE","SUMX","FILTER"],"answer":0},{"options":["DATESYTD","LASTDATE","VALUES"],"answer":0}],"explain":"..."}
{"type":"order","skill":"...","d":2,"q":"Put the steps in order.","items":["first","second","third","fourth"],"explain":"..."}
"answer" indexes are zero-based. For "order", list items in the CORRECT order. "explain" teaches the concept to a beginner in 2-4 sentences. Vary the position of the correct option.`;
  const text = await chat(settings, { system, messages: [{ role: "user", content: prompt }], maxTokens: 3000, signal });
  const arr = extractJSON(text);
  const out = (Array.isArray(arr) ? arr : [arr]).filter(validQuestion);
  out.forEach((q) => { q.id = "AI-" + Math.random().toString(36).slice(2, 9); q.ai = true; });
  if (!out.length) throw new Error("The AI reply didn't contain usable questions. Try again.");
  return out;
}
