# ANSWERS.md — TipSplit Assessment

---

## 1. How to Run

No install required. Open `index.html` directly in any modern browser:

```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

Or serve it locally to avoid any CORS edge cases with remote fonts:

```bash
# Python 3 (available on most machines)
python3 -m http.server 8080
# → open http://localhost:8080

# Node / npx
npx -y serve .
```

**Stack**: Vanilla HTML + CSS + JavaScript. Zero dependencies. No build step. If you can open a browser, it runs.

---

## 2. Stack & Design Choices

**Why vanilla HTML/CSS/JS?**

This task is fundamentally about interaction quality — live updates, graceful validation, keyboard experience. A framework like React adds complexity without adding value here; there's no component tree to manage, no async data, no routing. Vanilla JS means the evaluator can read the logic without knowing a framework, and there is genuinely nothing to install or compile. Every millisecond of startup time goes to the user, not to a bundle.

**Visual decision 1: The per-person amount is the hero, not the grand total.**

The results panel has a clear hierarchy: "Each Person Pays" is displayed at 3–3.4× the font size of the secondary figures (tip amount, grand total), and it gets a gradient treatment. The grand total and tip live below a hairline divider in smaller, uniform cards.

This affects the **results panel** directly. The rationale: when you're splitting a bill at a restaurant, the question on everyone's mind is *what do I owe* — not the total. Reversing the typical calculator layout (total first, per-person as an afterthought) makes the app immediately answer the right question without any reading. The hero number is what your eye lands on within a quarter second of the results appearing.

**Visual decision 2: The tip presets are pill-shaped buttons that stay horizontally scrollable, not a segmented control or a dropdown.**

This affects the **tip percentage input row**. A segmented control locks you to exactly 3 options and makes adding or removing presets awkward. A dropdown hides the options behind a click. Pills let all three options sit visible and tappable in one glance, with the active one filled amber so there's no ambiguity about which is selected — and because they scroll horizontally on small screens (`overflow-x: auto; scrollbar-width: none`), they don't wrap or break the layout on a 360px phone. The custom input sits below the pills so users who want 18% or 0% aren't trapped.

---

## 3. Responsive & Accessibility

**360px phone vs. 1440px laptop:**

On a **360px phone**, the card takes full viewport width with 14px side padding. The tip preset pills scroll horizontally (no wrapping). The secondary result grid (`grid-template-columns: 1fr 1fr`) collapses to a single column with horizontal label/value rows below 380px, so nothing gets truncated. Input touch targets are at least 48px tall. The `inputmode` attributes (`decimal` for bill/tip, `numeric` for people) ensure iOS/Android shows the correct keyboard — the bill field shows the numeric pad with decimal point, the people field shows the integer pad. The results panel is always visible below the inputs, so the on-screen keyboard never covers it (the user can scroll if needed, and the layout is short enough to fit on a 667px-tall phone without scrolling at all).

On a **1440px laptop**, the card is centred at 500px max-width. The ambient background orbs are visible. The results secondary grid is two columns side by side. Font sizes scale up via `clamp()` on the hero value. Hover states on buttons and inputs become active (not relevant on touch).

**Accessibility — what I handled:**

- **All inputs have associated `<label>` elements** — not placeholder-as-label, which disappears on focus.
- **Error messages use `role="alert"` and `aria-live="assertive"`** so a screen reader announces the error immediately when it appears, without the user having to navigate to it.
- **Preset buttons use `aria-pressed`** — toggled between `"true"` and `"false"` so a screen reader announces whether a tip preset is currently selected, matching the visual filled/unfilled state.
- **The results panel uses `aria-live="polite"`** — screen readers announce updated values after the user stops typing, without interrupting mid-keystroke.
- **Stepper buttons have descriptive `aria-label`** attributes ("Increase number of people") since their visible text is just "+" and "−".
- **Visible focus rings**: custom `outline: 2px solid var(--accent)` on all interactive elements — not removed, not hidden behind `:focus` (uses `:focus-visible` so mouse users don't see them on click).
- **`prefers-reduced-motion`**: all transitions and animations collapse to near-zero duration for users who have that system preference set.

**Accessibility — what I knowingly skipped:**

I did not audit the glassmorphism backdrop-blur effect against WCAG 1.4.3 (minimum contrast) for all possible background states. The blur makes the card background semi-transparent, and depending on what's behind it (the animated orbs shift colour over time), the contrast ratio of secondary text against the card background could dip below 4.5:1 in some frames. With another day, I would either pin the card background to a fully opaque colour, or run a contrast audit against the lowest-contrast orb position and adjust text colours accordingly.

---

## 4. AI Usage

I used **Claude (Anthropic)** as a coding assistant throughout this project.

**Where I used it:**

1. **Initial HTML scaffold** — I asked for a semantic HTML structure for a tip calculator card with labelled inputs, a results section, and ARIA attributes. The AI produced a reasonable structure but used `<div class="error">` elements with `aria-live` on the parent wrapper rather than on the individual message elements. I changed each error `<span>` to have its own `role="alert"` and `aria-live="assertive"` directly, because a single `aria-live` region on a container wrapping multiple fields would announce all three errors simultaneously if they all appeared at once, making it confusing for screen reader users. Each field's error needs to be announced independently.

2. **CSS glassmorphism card** — I described the visual direction (dark slate, amber accent, backdrop-blur, animated orbs). The AI gave me orbs with `position: absolute` on the `body` element itself, which caused layout shifts. I moved them into a dedicated `.bg-orbs` container with `position: fixed; inset: 0; pointer-events: none; z-index: 0` so they genuinely sit behind all content and don't affect the document flow.

3. **Validation logic** — I asked for a validate-on-input pattern. The AI's first output showed all errors on every `input` event from the start, which meant if you tab into the bill field and immediately tab out (or just land on the page), you'd see "Enter a valid bill amount" for an empty field you haven't touched yet. I introduced a `touched` object (one flag per field, set on `blur` or when the field has content) so errors only appear after the user has interacted with a field — which is the standard pattern in production form design.

4. **Rounding note wording** — The AI suggested "Rounded up to avoid group underpaying" but that's grammatically clunky and too long for a small caption. I rewrote it to `↑ Rounded up ₹0.01 total so group doesn't underpay` — shorter, includes the actual extra amount, and the ↑ arrow gives a visual cue without adding words.

---

## 5. Honest Gap

**What's not polished enough: the stepper button's hold-to-repeat behaviour on touch screens.**

On desktop, you can hold the + button and the people count increments rapidly (via `pointerdown` + `setInterval`). On iOS Safari, `pointerdown` sometimes fires but the `pointerup` on the document doesn't always cancel the interval cleanly if the touch drifts off the button. In testing I saw the counter run away by 2–3 extra increments after lifting a finger on a real iPhone.

To fix it with another day, I would replace the raw `pointerdown`/`pointerup` approach with a proper touch gesture handler: listen to `touchstart`, `touchend`, and `touchcancel` on the button itself (not the document), clear the interval in both `touchend` and `touchcancel`, and add a `touchmove` listener that cancels the interval if the user's finger moves more than a threshold distance from the button's bounding rect. I'd also add a visual "pressed" state driven by `:active` CSS for better tactile feedback on touch.
