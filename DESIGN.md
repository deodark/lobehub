---
version: alpha
name: LobeHub
description: LobeHub's design system, built on @lobehub/ui (Ant Design + antd-style). Tokens are themeable — primary and neutral colors are user-configurable and resolve to CSS variables (cssVar key `lobe-vars`). Values below are the default Light theme; the Dark theme uses the same token names with different values.
themeable:
  # Users pick a primary and a neutral; components must read the semantic tokens
  # below rather than hard-coding any single value from this list.
  primaryColor:
    default: blue # antd default seed when unset
    options:
      [red, orange, gold, yellow, lime, green, cyan, blue, geekblue, purple, magenta, volcano]
  neutralColor:
    default: ~ # antd default grey when unset
    options: [mauve, slate, sage, olive, sand]
colors:
  # Semantic tokens (Ant Design names) — the real contract components consume via
  # `cssVar.colorPrimary`, `cssVar.colorText`, etc. Light-theme defaults shown.
  colorPrimary: '#1677ff' # derived from the chosen primaryColor; blue when unset
  colorSuccess: '#52c41a'
  colorWarning: '#faad14'
  colorError: '#ff4d4f'
  colorInfo: '#1677ff'
  # Text — opacity-based neutrals that hold contrast on any surface
  colorText: 'rgba(0, 0, 0, 0.88)' # primary text
  colorTextSecondary: 'rgba(0, 0, 0, 0.65)' # secondary text, labels
  colorTextTertiary: 'rgba(0, 0, 0, 0.45)' # placeholder, captions
  colorTextQuaternary: 'rgba(0, 0, 0, 0.25)' # disabled
  # Surfaces — separate scale from text; never substitute one for the other
  colorBgLayout: '#f5f5f5' # page background
  colorBgContainer: '#ffffff' # primary card / panel surface
  colorBgContainerSecondary: '#fafafa' # subtle secondary surface (lobe-ui custom token)
  colorBgElevated: '#ffffff' # popovers, menus, modals
  colorBgSpotlight: 'rgba(0, 0, 0, 0.85)' # tooltips
  # Borders & fills — translucent, layer over any background
  colorBorder: 'rgba(0, 0, 0, 0.15)'
  colorBorderSecondary: 'rgba(0, 0, 0, 0.06)' # default divider / subtle border
  colorFill: 'rgba(0, 0, 0, 0.15)'
  colorFillSecondary: 'rgba(0, 0, 0, 0.06)'
  colorFillTertiary: 'rgba(0, 0, 0, 0.04)' # hover wash
  colorFillQuaternary: 'rgba(0, 0, 0, 0.02)' # active wash
typography:
  fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, "HarmonyOS Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Microsoft YaHei", ui-sans-serif, system-ui, sans-serif'
  fontFamilyCode: '"Geist Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, "Cascadia Code", Consolas, "HarmonyOS Sans SC", monospace'
  # Body & label scale (Ant Design)
  fontSizeSM: 12 # captions, dense metadata
  fontSize: 14 # default body and UI text
  fontSizeLG: 16 # emphasis, large controls
  fontSizeXL: 20
  lineHeight: 1.5714 # ~22px at 14px
  lineHeightSM: 1.6667 # ~20px at 12px
  # Headings
  fontSizeHeading1: 38
  fontSizeHeading2: 30
  fontSizeHeading3: 24
  fontSizeHeading4: 20
  fontSizeHeading5: 16
  fontWeightStrong: 600
spacing:
  # 4px base scale (Ant Design padding/margin tokens)
  XXS: 4
  XS: 8
  SM: 12
  base: 16
  MD: 20
  LG: 24
  XL: 32
radius:
  borderRadiusXS: 4 # tags, chips
  borderRadiusSM: 6 # inputs, small controls
  borderRadius: 8 # default — buttons, cards
  borderRadiusLG: 12 # menus, modals, large surfaces
controls:
  controlHeightSM: 28
  controlHeight: 36 # default (lobe-ui base)
  controlHeightLG: 40
---

# LobeHub

## Overview

LobeHub is an AI-native product suite (chat, agents, tools). Its design system is built on **[@lobehub/ui](https://github.com/lobehub/lobe-ui)** — a layer over **Ant Design** styled with **antd-style** — and is themed at runtime through `ThemeProvider` with the cssVar key `lobe-vars`.

The aesthetic is calm and content-first: generous whitespace, restrained color, and a near-neutral canvas so the conversation and the user's content stay in focus. Color carries state and hierarchy, not decoration. Every surface is designed for both light and dark appearance and for desktop and mobile.

Two things make this system different from a fixed palette, and both matter when you build with it:

1. **It is themeable.** Users choose a **primary** color and a **neutral** color. Never hard-code a hex value from this file — read the **semantic token** (e.g. `cssVar.colorPrimary`, `cssVar.colorText`) so your UI follows the user's theme and adapts between light and dark automatically.
2. **It has design values.** LobeHub follows four product values — **自然 Natural・意义感 Meaningful・确定性 Certainty・生长性 Growth** — that decide trade-offs the tokens can't. They are summarized under [Design Values](#design-values) and are the tie-breaker when guidance conflicts.

The YAML above lists the default **Light** theme. The Dark theme redefines the same token names; build against names, not values.

## Design Values

The philosophy behind every LobeHub interface, adapted from Ant Design's design values. Read these before designing a flow.

- **自然 (Natural)** — Minimize cognitive load. The next step should be obvious without thinking; carry the user forward with sensible defaults, AI assistance, and smooth transitions rather than making them stop and figure things out.
- **意义感 (Meaningful)** — Root every screen in the user's real goal. Make the objective clear, give immediate feedback on each action, and always point at the next meaningful step.
- **确定性 (Certainty)** — Low-entropy, predictable interactions. Reuse the same patterns, components, and wording. Keep one clear focus per surface and design **every** state — empty, loading, error, success. Restraint over cleverness.
- **生长性 (Growth)** — The product grows with the user. Surface advanced capability progressively, revealing features at the moment they become relevant without crowding the novice path.

**Priority when values conflict** (moment-to-moment interaction): **意义感 ≳ 自然 > 确定性** — never sacrifice the user's goal or forward momentum just to keep things uniform. **生长性** is a longer-horizon lens for how a feature is discovered and scales, not a single-screen layout call.

## Colors

LobeHub uses Ant Design's **semantic token** model. A token's name encodes its **role**, so the same name resolves to the right value in light, dark, and under any user theme. Always consume tokens by name — in antd-style, `cssVar.colorText`, `cssVar.colorBgContainer`, and so on.

**Text** uses opacity-based neutrals that hold contrast on any surface — rank information with them rather than reaching for color:

- `colorText` — primary text and icons
- `colorTextSecondary` — secondary text, form labels
- `colorTextTertiary` — placeholders, captions, metadata
- `colorTextQuaternary` — disabled

**Surfaces** are a separate scale from text; do not swap one for the other. `colorBgLayout` is the page canvas, `colorBgContainer` is the primary card/panel surface, `colorBgContainerSecondary` gives subtle separation, `colorBgElevated` backs popovers, menus, and modals, and `colorBgSpotlight` backs tooltips.

**Borders and fills** are translucent (`rgba`/alpha), so they layer over any background. Use `colorBorderSecondary` for the everyday divider and `colorBorder` for a stronger edge; use the `colorFill*` ramp for hover/active washes (`colorFillTertiary` hover, `colorFillQuaternary` active).

**Functional color** is reserved for meaning: `colorPrimary` (the chosen brand color) for the single most important action, focus, and links; `colorSuccess`, `colorWarning`, `colorError`, `colorInfo` for state. Each functional and accent color also exposes a derived ramp — `color{Name}`, `color{Name}Hover`, `color{Name}Active`, `color{Name}Bg`, `color{Name}Border`, `color{Name}Text`, and `color{Name}Fill*` — so you can build tinted backgrounds, borders, and text without picking raw values.

## Typography

**Geist** sets UI and prose; **Geist Mono** sets code, data, and tabular figures. The stacks above fall through to `-apple-system`, then **HarmonyOS Sans SC** and platform CJK faces, so Latin and CJK text stay visually consistent.

Use the scale tokens rather than setting size, weight, or line height by hand:

- **Body & labels** — `fontSize` (14px) covers most UI and body text; `fontSizeSM` (12px) for captions and dense metadata; `fontSizeLG` (16px) for emphasis and large controls. Line height is generous (\~1.57) for readability.
- **Headings** — `fontSizeHeading1`–`fontSizeHeading5` (38 → 16px) title pages and sections; pair with `fontWeightStrong` (600).
- **Code & numbers** — the `fontFamilyCode` stack; prefer tabular figures when numbers must align.

## Layout

Spacing follows a **4px scale** via Ant Design padding/margin tokens: `XXS` 4, `XS` 8, `SM` 12, base 16, `MD` 20, `LG` 24, `XL` 32. Keep a clear rhythm — tight space inside a group (8px), more between groups (16px), most between sections (24–32px). Cards use 16–24px padding.

Layouts must work across appearances and form factors: every surface ships **light and dark** and **desktop and mobile** variants. Mobile is not an afterthought — `src/routes/(mobile)` and `.mobile`/`.desktop` component variants exist for exactly this. Center primary content and let side padding grow at wider breakpoints.

## Elevation & Depth

Hierarchy comes from **tonal surfaces and borders first**, so shadows stay subtle. Lift only what genuinely floats:

- Raised cards / panels: a soft, barely-there shadow — most cards need none, just a `colorBorderSecondary` edge.
- Popovers and menus: `boxShadowSecondary`.
- Modals and dialogs: `boxShadow`, the strongest tier.

Tooltips take the lightest treatment on `colorBgSpotlight`. Pair each elevation with the matching radius below, and prefer a border over a shadow when both would read.

## Motion

Motion clarifies change; it is never decoration. It is also **user-controllable** — LobeHub exposes an animation mode (`agile` ≈ 0.05 motion unit, default ≈ 0.1, or fully `disabled`), so motion must degrade gracefully and you must honor `prefers-reduced-motion` by dropping nonessential animation.

When motion helps — revealing, moving, or connecting elements — keep it short and physical: roughly 100–200ms for state changes and popovers, up to \~300ms for overlays and modals. Avoid long, looping, or attention-grabbing animation. For AI/loading moments, prefer the system's purpose-built loaders (skeletons, `NeuralNetworkLoading`) over ad-hoc spinners.

## Shapes

Radii stay soft but tight, and one family per view:

- `borderRadiusXS` 4px — tags, chips
- `borderRadiusSM` 6px — inputs, small controls
- `borderRadius` 8px — the default, for buttons and cards
- `borderRadiusLG` 12px — menus, modals, large surfaces

Reserve fully round (`9999px`) for pills, avatars, and circular icon buttons. Don't mix rounded and sharp corners in one view.

## Components

Prefer the system's components over bespoke markup, in this order:

1. **`@lobehub/ui/base-ui`** — headless primitives, first choice for new code (`Select`, `Modal` / `createModal` / `confirmModal`, `DropdownMenu`, `ContextMenu`, `Popover`, `ScrollArea`, `Switch`, `Toast`, `FloatingSheet`).
2. **`@lobehub/ui`** root — richer composed components when base-ui has no counterpart.
3. **antd** — last resort, only when neither covers the need.

When base-ui has the component, use it — don't reach for the root or antd version.

Default control height is **36px** (`controlHeight`); use `controlHeightSM` 28px and `controlHeightLG` 40px for the other sizes. Buttons follow Ant Design's hierarchy — one **primary** (`colorPrimary` fill) per view for the most important action, **default** (surface fill + `colorBorder`) for ordinary actions, **text/link** for low-emphasis, and **danger** (`colorError`) for destructive actions. Hover and active states step through the `colorFill*` / `color{Name}Hover` ramps; disabled uses `colorTextQuaternary` text with a not-allowed cursor. Every interactive element shows a visible focus ring at `:focus-visible`.

Style components with **antd-style**: prefer `createStaticStyles` with `cssVar.*` (zero-runtime) and fall back to `createStyles` + `token` only when styles need runtime computation.

## Voice & Content

Copy is part of the design — precise, calm, and free of filler. Match the UI language (LobeHub ships en-US and zh-CN by hand; keys live in `src/locales/default`).

- Name actions with a verb and a noun (`Create Agent`, `Delete Session`), never a bare `Confirm`, `OK`, or `Submit`.
- Write errors as what happened plus what to do next — surface the reason and a recovery path, not just "Something went wrong."
- Confirm outcomes by naming the specific thing that changed; skip "successfully" and marketing superlatives.
- Empty states point to the first action ("No agents yet. Create one to get started."), not a blank screen.
- Use present-participle with an ellipsis for in-progress states (`Generating…`, `Saving…`).
- Keep it human and concise; don't over-explain, don't patronize.

## Do's and Don'ts

- **Do** read semantic tokens (`cssVar.colorText`, `cssVar.colorPrimary`, …); they adapt to the user's theme and to light/dark. **Don't** hard-code hex values from this file.
- **Do** rank information with the text-opacity scale (`colorText` → `colorTextTertiary`). **Don't** signal state with color alone — pair it with an icon or label.
- **Do** keep solid `colorPrimary` for the single most important action and for state. **Don't** spread brand color as decoration.
- **Do** design all four data states — empty, loading, error, success. **Don't** ship only the happy path.
- **Do** build light + dark and desktop + mobile for every surface. **Don't** treat mobile or dark as an afterthought.
- **Do** keep `colorBg*` (surfaces) and the text/`colorFill` scales distinct. **Don't** swap a surface token for a text token.
- **Do** reach for `@lobehub/ui/base-ui` first, then `@lobehub/ui`, then antd. **Don't** rebuild a component the system already provides.
- **Do** honor `prefers-reduced-motion` and the user's animation mode. **Don't** add long or looping animation.
- **Do** hold WCAG AA contrast (4.5:1 for body text) and show a visible `:focus-visible` ring. **Don't** remove an outline without a visible replacement.
- **Do** keep one radius family and at most two font weights per view. **Don't** mix rounded and sharp corners.
