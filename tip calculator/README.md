# TipSplit — Tip Calculator & Bill Splitter

A premium, single-screen tip calculator and bill splitter. Results update live as you type — no calculate button, no build step, no dependencies.

## How to Run

**Option 1 — Open directly (simplest):**

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

**Option 2 — Serve locally (recommended, avoids any browser CORS quirks):**

```bash
# Python 3 (no install needed on most systems)
python3 -m http.server 8080
# then open http://localhost:8080

# Node.js (if you have npx)
npx -y serve .
# then open the URL it prints
```

That's it. No `npm install`, no build step, no node_modules.

## What's Inside

```
tip-calculator/
├── index.html    ← structure & semantics
├── style.css     ← all styling (dark glassmorphism, responsive)
├── app.js        ← all logic (vanilla JS, no framework)
├── README.md     ← this file
└── ANSWERS.md    ← assessment answers
```

## Features

- **Live calculation** — results update on every keystroke, no calculate button
- **Tip presets** — 10 / 15 / 20% one-click pills, synced with a custom % input
- **Stepper buttons** — +/− to adjust party size; hold down to repeat
- **Inline validation** — errors fade in near each field, disappear as soon as the value is valid
- **Ceiling rounding** — each person's share is rounded up to the nearest ₹0.01, with a note shown when rounding occurred
- **Keyboard accessible** — full tab order, visible focus rings, Enter/Arrow keys work naturally
- **Screen reader support** — `aria-live`, `role="alert"`, `aria-pressed`, `aria-label`
- **Mobile optimised** — correct `inputmode` per field, 44px+ touch targets, result panel always in view
- **Reduced motion** — animations disabled when `prefers-reduced-motion: reduce` is set

## Stack

Vanilla HTML + CSS + JavaScript. Zero runtime dependencies. Zero build tooling.
