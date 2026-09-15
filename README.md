# Realcognita — General Assembly 2026

A countdown holding screen that turns into a full-screen presentation deck.
Plain HTML, CSS and JavaScript — no build step, no dependencies.

**One Team. One Purpose. One Future.** · 27 November 2026

---

## Run it

```bash
node dev-server.js
```

Then open:

| | URL |
|---|---|
| Countdown | `http://localhost:5173` |
| Presentation | `http://localhost:5173/#preview` |

The server prints a **Network** URL as well, so teammates on the same Wi-Fi can
watch along — see [SHARING.md](SHARING.md).

Use a different port with `PORT=8080 node dev-server.js`.

There is no build and nothing to install. You can also just open `index.html`
in a browser, though you lose live reload.

---

## What's here

| File | Purpose |
|---|---|
| `index.html` | Countdown screen + all 17 presentation slides |
| `style.css` | Everything visual |
| `script.js` | Countdown clock, deck navigation, entrance animations |
| `dev-server.js` | Zero-dependency static server with live reload |
| `assets/` | Logo, favicon, flags, placeholder photos |
| `SHARING.md` | How to share the deck over the office network |

---

## The two screens

**Countdown** — the holding screen shown before doors open. Logo, headline, and
the time remaining in large figures. When the clock reaches zero it hands over
to the deck automatically.

**Deck** — 17 full-screen slides. It is a presentation, not a scrolling page.

| Keys | |
|---|---|
| `→` `←` / `Space` | Next / previous slide |
| `F` | Fullscreen |
| `P` | Autoplay (9s per slide) |
| `Home` / `End` | First / last slide |

Mouse wheel, touch swipe, the on-screen buttons and the dot rail on the right
all work too.

---

## Editing the content

### The event date

One line, at the top of `script.js`:

```js
const TARGET_DATE = new Date('2026-11-27T09:00:00+08:00');
```

The date printed in the countdown footer is derived from this, so the two can
never disagree.

### Slides

Each slide is one `<section class="slide">` in `index.html`, in running order.
Slides needing real content are marked `<!-- TODO -->`. To reorder, move the
whole `<section>`; the slide counter and dot rail follow automatically.

Three layouts, set by the class on `.stage`:

| Class | Use for |
|---|---|
| `stage-center` | Statements and chapter breaks |
| `stage-split` | Two columns, text left / visual right |
| `stage` | Left-aligned lists and long-form |

Reusable blocks: `figure-row` (counting numbers), `tile-grid`, `pillar-row`,
`timeline`, `agenda`, `flag-grid`, `quote`, `statement`, `photo-wall`.

### Photos

Every picture is a `<figure class="photo">`. Drop in a real image by replacing
the placeholder with an `<img>`:

```html
<figure class="photo kb">
  <img src="assets/photos/your-photo.jpg" alt="" />
</figure>
```

A `<video src="..." autoplay muted loop playsinline>` works in the same place.
`kb` adds the slow Ken Burns drift. Crop with `tall`, `tall2`, `square`, `wide`
or `bleed`.

The images currently in `assets/photos/` are generated placeholders, there so
the layout can be reviewed before real photography arrives.

### Offices and flags

Slide 05 reads from `assets/flags/`. Add a country by dropping in its SVG and
copying one `<article class="flag-card">` block.

---

## Notes

- **Brand** — colours and type follow the Realcognita style guide. Poppins
  stands in for Komet; swap the `@font-face` when the licensed files are
  available (see the comment at the top of `style.css`).
- **Performance** — every animation is `transform` / `opacity` only, so the
  compositor handles it and the page holds its refresh rate. No blurs or
  backdrop filters in the animation path.
- **Offline** — the only external request is the Google Fonts stylesheet, and
  the page falls back to system fonts without it. Run it locally on the
  presenting machine for the event.
- **Accessibility** — honours `prefers-reduced-motion`.
