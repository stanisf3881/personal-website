// Question rendering and grading for every PL-300 format used here.
import prepare from "./data/q-prepare.js";
import model from "./data/q-model.js";
import visualize from "./data/q-visualize.js";
import manage from "./data/q-manage.js";
import cases from "./data/q-cases.js";
import { SKILLS } from "./data/syllabus.js";

export const CASES = cases;
export const BANK = [...prepare, ...model, ...visualize, ...manage];
for (const c of cases) for (const q of c.questions) q.caseId = c.id;
export const ALL = [...BANK, ...cases.flatMap((c) => c.questions)];

// The source files list the correct option first for readability. Reorder options with a
// fixed per-question seed so the right answer lands in different positions, consistently
// everywhere the question appears (practice, mock review, tutor explanations).
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; };
}
for (const q of ALL) {
  if (q.type !== "single" && q.type !== "multi") continue;
  const rand = seeded(q.id);
  const order = q.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  q.options = order.map((i) => q.options[i]);
  q.answer = q.type === "single" ? order.indexOf(q.answer) : q.answer.map((a) => order.indexOf(a)).sort((x, y) => x - y);
}
export const byId = (id) => ALL.find((q) => q.id === id);

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Validate a question object (used for AI-generated questions). */
export function validQuestion(q) {
  if (!q || typeof q.q !== "string" || !SKILLS[q.skill]) return false;
  switch (q.type) {
    case "single": return Array.isArray(q.options) && q.options.length >= 3 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length;
    case "multi": return Array.isArray(q.options) && Array.isArray(q.answer) && q.answer.length >= 2 && q.answer.every((i) => Number.isInteger(i) && i < q.options.length) && (q.pick = q.answer.length);
    case "yesno": return Array.isArray(q.statements) && q.statements.length >= 2 && q.statements.every((s) => Array.isArray(s) && typeof s[1] === "boolean");
    case "order": return Array.isArray(q.items) && q.items.length >= 3;
    case "dropdown": return typeof q.template === "string" && Array.isArray(q.blanks) && q.blanks.every((b, i) => q.template.includes(`{${i}}`) && Array.isArray(b.options) && Number.isInteger(b.answer) && b.answer < b.options.length);
    default: return false;
  }
}

/** Score 0..1 with partial credit, like the real exam's multi-part items. */
export function grade(q, r) {
  if (r == null || r === "skip") return 0;
  switch (q.type) {
    case "single": return r === q.answer ? 1 : 0;
    case "multi": {
      const right = r.filter((i) => q.answer.includes(i)).length;
      const wrong = r.length - right;
      return Math.max(0, (right - wrong) / q.answer.length);
    }
    case "yesno": return q.statements.filter((s, i) => r[i] === s[1]).length / q.statements.length;
    case "dropdown": return q.blanks.filter((b, i) => r[i] === b.answer).length / q.blanks.length;
    case "order": return r.filter((itemIdx, pos) => itemIdx === pos).length / q.items.length;
  }
  return 0;
}

export function correctAnswerText(q) {
  switch (q.type) {
    case "single": return q.options[q.answer];
    case "multi": return q.answer.map((i) => q.options[i]).join("; ");
    case "yesno": return q.statements.map((s) => `${s[0]} → ${s[1] ? "Yes" : "No"}`).join("\n");
    case "dropdown": return q.blanks.map((b, i) => `Blank ${i + 1}: ${b.options[b.answer]}`).join("; ");
    case "order": return q.items.map((t, i) => `${i + 1}. ${t}`).join("\n");
  }
}
export function responseText(q, r) {
  if (r == null || r === "skip") return "I didn't know";
  switch (q.type) {
    case "single": return q.options[r];
    case "multi": return r.map((i) => q.options[i]).join("; ") || "(nothing selected)";
    case "yesno": return q.statements.map((s, i) => `${s[0]} → ${r[i] == null ? "?" : r[i] ? "Yes" : "No"}`).join("\n");
    case "dropdown": return q.blanks.map((b, i) => `Blank ${i + 1}: ${r[i] == null ? "?" : b.options[r[i]]}`).join("; ");
    case "order": return r.map((idx, pos) => `${pos + 1}. ${q.items[idx]}`).join("\n");
  }
}

const typeLabel = { single: "Choose one", multi: "Choose", yesno: "Yes or No for each statement", order: "Put in order", dropdown: "Complete the blanks" };

/**
 * Render an interactive question into el.
 * opts: { response, locked, showResult, onChange(response) }
 * Returns { getResponse(), isComplete() }.
 */
export function renderQuestion(el, q, opts = {}) {
  const locked = !!opts.locked;
  let r = opts.response ?? initialResponse(q);
  const name = "q" + Math.random().toString(36).slice(2, 8);
  // Only the ordering question needs a full redraw; other formats update in place so
  // keyboard focus and arrow-key navigation inside radio groups aren't lost.
  const changed = () => {
    opts.onChange?.(r);
    if (q.type === "order") return draw();
    if (q.type === "single" || q.type === "multi") {
      el.querySelectorAll(".opts input").forEach((inp) => {
        const on = q.type === "single" ? r === +inp.value : r.includes(+inp.value);
        inp.checked = on; inp.closest(".opt").classList.toggle("sel", on);
      });
    }
  };

  function draw() {
    const result = opts.showResult;
    let body = "";
    if (q.type === "single" || q.type === "multi") {
      const multi = q.type === "multi";
      body = `<fieldset class="opts"><legend class="sr-only">Answer options</legend>` + q.options.map((o, i) => {
        const sel = multi ? r.includes(i) : r === i;
        const right = multi ? q.answer.includes(i) : q.answer === i;
        const cls = result ? (right ? "right" : sel ? "wrong" : "") : "";
        return `<label class="opt ${sel ? "sel" : ""} ${cls}"><input type="${multi ? "checkbox" : "radio"}" name="${name}" value="${i}" ${sel ? "checked" : ""} ${locked ? "disabled" : ""}><span class="key">${String.fromCharCode(65 + i)}</span><span>${esc(o)}</span>${result && right ? `<span class="mark" aria-label="correct answer">✓</span>` : ""}</label>`;
      }).join("") + `</fieldset>`;
    } else if (q.type === "yesno") {
      body = `<table class="yn"><thead><tr><th>Statement</th><th>Yes</th><th>No</th></tr></thead><tbody>` + q.statements.map((s, i) => {
        const cell = (val) => {
          const sel = r[i] === val; const right = s[1] === val;
          const cls = result ? (right ? "right" : sel ? "wrong" : "") : "";
          return `<td class="${cls}"><input type="radio" name="${name}-${i}" aria-label="${val ? "Yes" : "No"}" data-i="${i}" value="${val}" ${sel ? "checked" : ""} ${locked ? "disabled" : ""}></td>`;
        };
        return `<tr><td>${esc(s[0])}</td>${cell(true)}${cell(false)}</tr>`;
      }).join("") + `</tbody></table>`;
    } else if (q.type === "dropdown") {
      let html = esc(q.template);
      q.blanks.forEach((b, i) => {
        const right = r[i] === b.answer;
        const sel = `<select data-i="${i}" ${locked ? "disabled" : ""} class="${result ? (right ? "right" : "wrong") : ""}" aria-label="Blank ${i + 1}"><option value="">Select…</option>${b.options.map((o, j) => `<option value="${j}" ${r[i] === j ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
        html = html.replace(`{${i}}`, sel + (result && !right ? `<span class="fix">${esc(b.options[b.answer])}</span>` : ""));
      });
      body = `<div class="code-fill">${html}</div>`;
    } else if (q.type === "order") {
      body = `<ol class="order">` + r.map((idx, pos) => {
        const cls = result ? (idx === pos ? "right" : "wrong") : "";
        return `<li class="${cls}"><span class="txt">${esc(q.items[idx])}</span>${locked ? "" : `<span class="mv"><button type="button" class="icon" data-up="${pos}" aria-label="Move up" ${pos === 0 ? "disabled" : ""}>▲</button><button type="button" class="icon" data-down="${pos}" aria-label="Move down" ${pos === r.length - 1 ? "disabled" : ""}>▼</button></span>`}</li>`;
      }).join("") + `</ol>` + (result && grade(q, r) < 1 ? `<p class="small">Correct order:</p><ol class="order solution">${q.items.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>` : "");
    }
    const pickNote = q.type === "multi" ? ` ${q.answer.length}` : "";
    el.innerHTML = `<p class="qtype">${typeLabel[q.type]}${pickNote}</p><div class="qtext">${esc(q.q)}</div>${body}`;
    bind();
  }

  function bind() {
    if (locked) return;
    el.querySelectorAll(".opts input").forEach((inp) => inp.addEventListener("change", () => {
      const i = +inp.value;
      if (q.type === "single") r = i;
      else { r = inp.checked ? [...r, i] : r.filter((x) => x !== i); if (r.length > q.answer.length) r = r.slice(1); }
      changed();
    }));
    el.querySelectorAll(".yn input").forEach((inp) => inp.addEventListener("change", () => { r = r.slice(); r[+inp.dataset.i] = inp.value === "true"; changed(); }));
    el.querySelectorAll(".code-fill select").forEach((s) => s.addEventListener("change", () => { r = r.slice(); r[+s.dataset.i] = s.value === "" ? null : +s.value; changed(); }));
    el.querySelectorAll("[data-up],[data-down]").forEach((b) => b.addEventListener("click", () => {
      const p = b.dataset.up != null ? +b.dataset.up : +b.dataset.down;
      const t = b.dataset.up != null ? p - 1 : p + 1;
      r = r.slice(); [r[p], r[t]] = [r[t], r[p]];
      changed();
      el.querySelector(`[data-${b.dataset.up != null ? "up" : "down"}="${t}"]`)?.focus();
    }));
  }

  draw();
  return {
    getResponse: () => r,
    isComplete: () => isComplete(q, r),
  };
}

export function initialResponse(q) {
  switch (q.type) {
    case "single": return null;
    case "multi": return [];
    case "yesno": return q.statements.map(() => null);
    case "dropdown": return q.blanks.map(() => null);
    case "order": {
      let o = shuffle(q.items.map((_, i) => i));
      if (o.every((v, i) => v === i)) o = o.slice().reverse();
      return o;
    }
  }
}
export function isComplete(q, r) {
  switch (q.type) {
    case "single": return r != null;
    case "multi": return r.length === q.answer.length;
    case "yesno": case "dropdown": return r.every((x) => x != null);
    case "order": return true;
  }
}
