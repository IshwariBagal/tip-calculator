/**
 * TipSplit — app.js
 *
 * Rounding policy: ceiling each person's share to the nearest paisa (₹0.01).
 * This ensures the group never underpays. Any extra charged is displayed
 * as a rounding note beneath the per-person amount.
 *
 * No frameworks. No build step. Just JS.
 */

'use strict';

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const MAX_BILL   = 1_000_000;   // ₹10 lakh upper limit
const MAX_TIP    = 100;         // 100% tip max
const MAX_PEOPLE = 1_000;       // 1000 people max

// ─────────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────────
const billInput    = document.getElementById('bill-input');
const tipInput     = document.getElementById('tip-input');
const peopleInput  = document.getElementById('people-input');

const billWrapper   = document.getElementById('bill-wrapper');
const tipWrapper    = document.getElementById('tip-wrapper');
const peopleWrapper = document.getElementById('people-wrapper');

const billError    = document.getElementById('bill-error');
const tipError     = document.getElementById('tip-error');
const peopleError  = document.getElementById('people-error');

const perPersonEl  = document.getElementById('per-person');
const tipAmountEl  = document.getElementById('tip-amount');
const grandTotalEl = document.getElementById('grand-total');
const roundingNote = document.getElementById('rounding-note');
const resultsPanel = document.querySelector('.results-panel');

const resetBtn     = document.getElementById('reset-btn');
const presetBtns   = document.querySelectorAll('.preset-btn');
const peopleDecBtn = document.getElementById('people-dec');
const peopleIncBtn = document.getElementById('people-inc');

// ─────────────────────────────────────────────
// STATE — tracks which fields have been touched
// ─────────────────────────────────────────────
const touched = {
  bill:   false,
  tip:    false,
  people: false,
};

// ─────────────────────────────────────────────
// VALIDATION
// Returns a string (error message) or null (valid / empty).
// ─────────────────────────────────────────────
function validateBill(raw) {
  const s = raw.trim();
  if (s === '') return null;                             // empty → no error shown

  const n = parseFloat(s);
  if (isNaN(n) || !isFinite(n))   return 'Enter a valid bill amount';
  if (n < 0)                       return 'Bill amount cannot be negative';
  if (n === 0)                     return 'Bill must be greater than ₹0';
  if (n > MAX_BILL)                return `Too large — max is ₹${MAX_BILL.toLocaleString('en-IN')}`;
  return null;
}

function validateTip(raw) {
  const s = raw.trim();
  if (s === '') return null;                             // empty → defaults to 0%

  const n = parseFloat(s);
  if (isNaN(n) || !isFinite(n))   return 'Enter a valid tip percentage';
  if (n < 0)                       return 'Tip percentage must be 0% or more';
  if (n > MAX_TIP)                 return `Tip cannot exceed ${MAX_TIP}%`;
  return null;
}

function validatePeople(raw) {
  const s = raw.trim();
  if (s === '') return null;                             // empty → no error shown

  const n = Number(s);
  // Must be a positive integer — reject decimals and non-numbers
  if (!Number.isFinite(n) || !Number.isInteger(n) || isNaN(n)) {
    return 'Enter a whole number of people';
  }
  if (n < 1)            return 'At least 1 person required';
  if (n > MAX_PEOPLE)   return `Maximum ${MAX_PEOPLE.toLocaleString()} people supported`;
  return null;
}

// ─────────────────────────────────────────────
// ERROR DISPLAY
// Shows or hides inline error messages gracefully.
// ─────────────────────────────────────────────
function setError(msgEl, wrapperEl, msg) {
  if (msg) {
    // Only update text if it changed (avoids screen reader re-announcing same error)
    if (msgEl.textContent !== msg) msgEl.textContent = msg;
    msgEl.classList.add('visible');
    wrapperEl.classList.add('has-error');
  } else {
    msgEl.classList.remove('visible');
    wrapperEl.classList.remove('has-error');
    // Delay clearing text so the fade-out animation completes
    setTimeout(() => {
      if (!msgEl.classList.contains('visible')) msgEl.textContent = '';
    }, 220);
  }
}

// ─────────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────────
function fmt(n) {
  return '₹' + n.toFixed(2);
}

// ─────────────────────────────────────────────
// POP ANIMATION — brief scale bounce on number change
// ─────────────────────────────────────────────
const popTimers = new WeakMap();

function popEl(el) {
  el.classList.remove('pop');
  // Force reflow to restart animation
  void el.offsetWidth;
  el.classList.add('pop');

  if (popTimers.has(el)) clearTimeout(popTimers.get(el));
  popTimers.set(el, setTimeout(() => el.classList.remove('pop'), 160));
}

// ─────────────────────────────────────────────
// SET RESULTS
// ─────────────────────────────────────────────
function setResults(data) {
  if (!data) {
    perPersonEl.textContent  = '₹0.00';
    tipAmountEl.textContent  = '₹0.00';
    grandTotalEl.textContent = '₹0.00';
    roundingNote.textContent = '';
    resultsPanel.classList.remove('has-value');
    return;
  }

  const newPP = fmt(data.perPerson);
  const newTA = fmt(data.tipAmount);
  const newGT = fmt(data.grandTotal);

  // Only pop-animate when the displayed value actually changed
  if (perPersonEl.textContent  !== newPP) popEl(perPersonEl);
  if (tipAmountEl.textContent  !== newTA) popEl(tipAmountEl);
  if (grandTotalEl.textContent !== newGT) popEl(grandTotalEl);

  perPersonEl.textContent  = newPP;
  tipAmountEl.textContent  = newTA;
  grandTotalEl.textContent = newGT;
  roundingNote.textContent = data.roundingNote;

  resultsPanel.classList.add('has-value');
}

// ─────────────────────────────────────────────
// CALCULATE
// The core logic — runs on every input event.
// ─────────────────────────────────────────────
function calculate() {
  const billRaw   = billInput.value;
  const tipRaw    = tipInput.value;
  const peopleRaw = peopleInput.value;

  // Run validators
  const billErr   = validateBill(billRaw);
  const tipErr    = validateTip(tipRaw);
  const peopleErr = validatePeople(peopleRaw);

  // Only display errors for touched fields (or those with content)
  if (touched.bill   || billRaw.trim()   !== '') setError(billError,   billWrapper,   billErr);
  if (touched.tip    || tipRaw.trim()    !== '') setError(tipError,    tipWrapper,    tipErr);
  if (touched.people || peopleRaw.trim() !== '') setError(peopleError, peopleWrapper, peopleErr);

  // Parse values
  const bill   = parseFloat(billRaw);
  const tipPct = tipRaw.trim() === '' ? 0 : parseFloat(tipRaw);  // empty tip = 0%
  const people = parseInt(peopleRaw, 10);

  // Need valid bill and people to compute anything meaningful
  const billOk   = billErr   === null && billRaw.trim()   !== '';
  const tipOk    = tipErr    === null;                              // tip can be empty (= 0%)
  const peopleOk = peopleErr === null && peopleRaw.trim() !== '';

  if (!billOk || !tipOk || !peopleOk) {
    setResults(null);
    return;
  }

  // Core arithmetic
  const tipAmount  = bill * (tipPct / 100);
  const grandTotal = bill + tipAmount;

  // Rounding policy: ceiling per-person to nearest paisa (₹0.01)
  const exactPerPerson = grandTotal / people;
  const perPerson      = Math.ceil(exactPerPerson * 100) / 100;

  // Compute extra charged due to rounding (in paise, i.e. 1/100 of ₹)
  const totalCharged   = perPerson * people;
  const extraPaise     = Math.round((totalCharged - grandTotal) * 100);

  let roundingNoteText = '';
  if (extraPaise > 0) {
    const extra = (extraPaise / 100).toFixed(2);
    roundingNoteText = `↑ Rounded up ₹${extra} total so group doesn't underpay`;
  }

  setResults({ perPerson, tipAmount, grandTotal, roundingNote: roundingNoteText });
}

// ─────────────────────────────────────────────
// PRESET BUTTONS
// ─────────────────────────────────────────────
function setActivePreset(matchValue) {
  presetBtns.forEach(btn => {
    const isActive = btn.dataset.value === String(matchValue);
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

function clearAllPresets() {
  presetBtns.forEach(btn => {
    btn.classList.remove('active');
    btn.setAttribute('aria-pressed', 'false');
  });
}

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tipInput.value = btn.dataset.value;
    touched.tip = true;
    setActivePreset(btn.dataset.value);
    calculate();
  });
});

// ─────────────────────────────────────────────
// INPUT EVENTS — Bill
// ─────────────────────────────────────────────
billInput.addEventListener('input', () => {
  calculate();
});

billInput.addEventListener('blur', () => {
  touched.bill = true;
  calculate();
});

// ─────────────────────────────────────────────
// INPUT EVENTS — Tip
// ─────────────────────────────────────────────
tipInput.addEventListener('input', () => {
  touched.tip = true;
  const val = tipInput.value.trim();

  // Sync preset buttons: highlight if typed value matches a preset exactly
  const matchingPreset = [...presetBtns].find(b => b.dataset.value === val);
  if (matchingPreset) {
    setActivePreset(val);
  } else {
    clearAllPresets();
  }

  calculate();
});

tipInput.addEventListener('blur', () => {
  touched.tip = true;
  calculate();
});

// ─────────────────────────────────────────────
// INPUT EVENTS — People
// ─────────────────────────────────────────────
peopleInput.addEventListener('input', () => {
  // Clamp to integers in real time by stripping any decimal portion
  const raw = peopleInput.value;
  if (raw.includes('.')) {
    const truncated = Math.floor(parseFloat(raw));
    peopleInput.value = isNaN(truncated) ? '' : String(truncated);
  }
  calculate();
});

peopleInput.addEventListener('blur', () => {
  touched.people = true;
  calculate();
});

// Block non-integer keys in people field (allow control keys)
peopleInput.addEventListener('keydown', e => {
  const controlKeys = [
    'Backspace', 'Delete', 'Tab', 'Enter',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
    'Home', 'End',
  ];
  const isCtrl = e.ctrlKey || e.metaKey;     // allow Ctrl+A, Ctrl+C, etc.
  const isDigit = /^\d$/.test(e.key);

  if (!controlKeys.includes(e.key) && !isCtrl && !isDigit) {
    e.preventDefault();
  }
});

// ─────────────────────────────────────────────
// STEPPER BUTTONS  (+ / −)
// ─────────────────────────────────────────────
function stepPeople(delta) {
  const current = parseInt(peopleInput.value, 10);
  const next    = isNaN(current) ? (delta > 0 ? 1 : 1) : current + delta;

  if (next < 1) {
    // Shake to indicate can't go lower
    peopleWrapper.classList.add('shake');
    setTimeout(() => peopleWrapper.classList.remove('shake'), 360);
    return;
  }
  if (next > MAX_PEOPLE) return;

  peopleInput.value = next;
  touched.people = true;
  calculate();
}

peopleDecBtn.addEventListener('click', () => stepPeople(-1));
peopleIncBtn.addEventListener('click', () => stepPeople(+1));

// Allow holding down stepper buttons for fast increment/decrement
let stepInterval = null;
let stepTimeout  = null;

function startStepping(delta) {
  stepTimeout = setTimeout(() => {
    stepInterval = setInterval(() => stepPeople(delta), 80);
  }, 400); // start repeating after 400ms hold
}

function stopStepping() {
  clearTimeout(stepTimeout);
  clearInterval(stepInterval);
  stepTimeout  = null;
  stepInterval = null;
}

peopleDecBtn.addEventListener('pointerdown', () => startStepping(-1));
peopleIncBtn.addEventListener('pointerdown', () => startStepping(+1));
document.addEventListener('pointerup',   stopStepping);
document.addEventListener('pointercancel', stopStepping);

// ─────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────
resetBtn.addEventListener('click', () => {
  // Clear inputs
  billInput.value   = '';
  tipInput.value    = '';
  peopleInput.value = '';

  // Clear errors
  setError(billError,   billWrapper,   null);
  setError(tipError,    tipWrapper,    null);
  setError(peopleError, peopleWrapper, null);

  // Reset presets
  clearAllPresets();

  // Reset touched state
  touched.bill   = false;
  touched.tip    = false;
  touched.people = false;

  // Reset results
  setResults(null);

  // Return focus to first field for a smooth UX
  billInput.focus();
});

// ─────────────────────────────────────────────
// INITIAL RENDER
// ─────────────────────────────────────────────
calculate();
