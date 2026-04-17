# AppFlowy Pricing — Implementation Guide (Marketing Site)

## Context and goals
Design intent: AppFlowy Pricing arayüzü, token tabanlı ve erişilebilir bir sistemle hızlı, tutarlı ve uygulanabilir şekilde teslim edilmelidir.

- Bu yetenekler AppFlowy'de self-hosted altyapıyla sağlanabildiği için, pricing yüzünde gösterilen özellikler ile gerçek ürün yetenekleri birebir hizalanmalıdır.
- Evet, bu özellikleri kazandırabiliriz; bunun için ürün/altyapı/parasal plan eşlemesini netleştiren bir bileşen standardı gerekir.
- Brand context doğrulaması: Audience ve surface inference düşük güvenle çıkarılmıştır; ekip, “authenticated users and operators” ve “marketing site” kapsamını release öncesi doğrulamalıdır.

## Design tokens and foundations

### Core foundations
- Typography must use:
  - `font.family.primary=Poppins`
  - `font.family.stack=Poppins, Inter, sans-serif`
  - `font.size.base=14px`, `font.weight.base=400`, `font.lineHeight.base=21px`
- Type scale must use:
  - `font.size.xs=14px`, `font.size.sm=15px`, `font.size.md=16px`, `font.size.lg=20px`, `font.size.xl=24px`, `font.size.2xl=56px`
- Colors must map to semantic usage:
  - `color.surface.base` for dark section backgrounds
  - `color.surface.raised` for primary CTA emphasis
  - `color.surface.strong` for high-contrast neutral surfaces
  - `color.text.secondary`, `color.text.tertiary`, `color.text.inverse` for foreground text roles
  - `color.border.default`, `color.border.muted` for separators/dividers
- Spacing must use scale tokens only:
  - `space.1=6px`, `space.2=8px`, `space.3=10px`, `space.4=12px`, `space.5=15.73px`, `space.6=16px`, `space.7=17.39px`, `space.8=20px`
- Radius and motion must use:
  - `radius.xs=8px`, `radius.sm=14px`, `radius.md=15px`, `radius.lg=9999px`
  - `motion.duration.instant=150ms`, `motion.duration.fast=200ms`

### Semantic token rules
- Component docs must reference semantic token names, not raw hex.
- Teams should define aliases (e.g., `pricing.card.bg`, `pricing.cta.bg`) that resolve to global tokens for implementation clarity.
- Teams should prefer system consistency over local one-off visual exceptions.

## Component-level rules (anatomy, variants, states, responsive behavior)
Known density targets:
- links: 74
- buttons: 27
- navigation: 2
- lists: 1
- tables: 1

### 1) Global navigation (2 navigation groups)
**Anatomy**
- Brand area, primary links, auth actions, mobile trigger.

**Variants**
- Desktop horizontal nav.
- Mobile drawer nav.

**States (required for each interactive item)**
- default, hover, focus-visible, active, disabled, loading, error.
- Focus-visible must be visibly distinct from hover.

**Interaction**
- Keyboard: `Tab` order must follow DOM order; `Enter/Space` must trigger links/buttons; `Esc` must close mobile drawer.
- Pointer: hover feedback should use `motion.duration.instant`.
- Touch: tap targets must be comfortably sized; drawer gestures should not trap scroll.

**Responsive**
- <768px: collapse to drawer.
- >=768px: inline nav.
- Long labels must truncate with tooltip/fallback wrap rule.

### 2) Plan cards + CTA buttons (27 buttons distributed)
**Anatomy**
- Plan name, price, billing cadence, feature bullets, primary CTA, secondary CTA (optional), badge.

**Variants**
- Free, Pro, Team/Enterprise.
- Highlighted “recommended” card.

**State behavior**
- All CTAs must define: default, hover, focus-visible, active, disabled, loading, error.
- Loading must preserve button width and show progress indicator.
- Error must expose actionable helper text (e.g., billing action failed).

**Interaction**
- Keyboard: `Enter/Space` activates CTA; focus ring must remain visible on dark and light surfaces.
- Pointer: hover elevation should be subtle and token-driven.
- Touch: no hover dependency; active feedback must remain perceivable.

**Edge cases**
- Very long plan names should wrap to max 2 lines.
- Missing price should show explicit “Contact sales” fallback.
- Empty feature list must render informative placeholder, not blank area.

### 3) Feature comparison table (1 table)
**Anatomy**
- Sticky header, feature rows, per-plan cells, optional info tooltip.

**States**
- default row, hover row, focus-visible cell, active sort/filter (if present), disabled cell, loading skeleton, error block.

**Interaction**
- Keyboard: must support row/column traversal via `Tab`; if sortable, `Enter/Space` toggles sort.
- Pointer: row hover highlight should not reduce text contrast.
- Touch: horizontal scroll must be smooth and discoverable.

**Responsive**
- <1024px: table must switch to stacked card rows or horizontal scroll with pinned first column.
- Overflow must not clip focus outline.

### 4) Link-rich content blocks (74 links)
**Rules**
- Link text must be descriptive (“Compare Pro vs Team”), not ambiguous (“Click here”).
- External links must indicate destination behavior.
- Links must keep visible underline or equivalent non-color affordance.

**States**
- default, hover, focus-visible, active, disabled (if applicable), loading (if async navigation), error (if route resolution fails).

### 5) Feature list and FAQ list (1 list)
**Anatomy**
- Section heading, list item title, optional body text/icon.

**Behavior**
- Items should support expand/collapse only when content length requires it.
- Empty state must show “No features available for selected plan”.

## Accessibility requirements and testable acceptance criteria
- The experience must meet WCAG 2.2 AA.
- Keyboard-only user must reach and operate all interactive controls.
  - Pass: No blocked control after full `Tab` traversal.
  - Fail: Any CTA or nav item unreachable without pointer.
- Focus-visible indicator must be present and clearly perceivable on every interactive component.
  - Pass: Focus ring visible in default themes.
  - Fail: Focus hidden or indistinguishable from background.
- Contrast must pass AA for text, controls, and states.
  - Pass: All tested pairings meet AA.
  - Fail: Any state token pairing below threshold.
- Disabled and loading states must remain semantically announced.
  - Pass: SR announces disabled/loading meaningfully.
  - Fail: State only conveyed by color.
- Error states must provide corrective next step.
  - Pass: Error includes action text (“Try again”, “Contact support”).
  - Fail: Error is generic/non-actionable.

## Content and tone standards with examples
- Copy must be concise, confident, implementation-focused.
- Labels must be specific and action-oriented.
- Teams should keep plan differentiation explicit (limits, collaboration, AI, support).

**Good examples**
- “Start Free”
- “Upgrade to Pro”
- “Compare Team and Enterprise limits”

**Bad examples**
- “Submit”
- “Click here”
- “Learn more” (without context)

## Anti-patterns and prohibited implementations
- Components must not use raw hex values directly in implementation docs.
- UI must not hide focus indicators.
- Teams must not add one-off spacing/typography values outside token scale.
- Cards must not collapse critical info behind hover-only interactions.
- Table must not rely on color-only encoding for included/not-included features.

## Migration notes and implementation prerequisites
Bu özellikleri self-hosted yeteneklerle hizalamak için aşağıdaki gereksinimler gerekir:
- Ürün-plan matrisi must be source-of-truth (özellik, limit, fiyat, entegrasyon).
- Pricing API or CMS contract must expose plan metadata (monthly/yearly, flags, entitlement labels).
- Auth-state awareness should drive CTA variants (signed-out vs signed-in operator).
- Analytics events must track CTA clicks, plan compare interactions, and error states.
- Release sürecinde marketing + product + backend ekipleri aynı entitlement sözlüğünü kullanmalıdır.

## QA checklist
- [ ] Tüm non-negotiable kurallar “must” ile yazıldı.
- [ ] Tüm öneriler “should” ile yazıldı.
- [ ] Her etkileşimli bileşen için state seti tanımlandı: default/hover/focus-visible/active/disabled/loading/error.
- [ ] Keyboard, pointer, touch davranışları belirtildi.
- [ ] Responsive ve edge-case (long content, overflow, empty state) davranışları tanımlandı.
- [ ] WCAG 2.2 AA için test edilebilir pass/fail kriterleri eklendi.
- [ ] Token dışı spacing/typography/color kullanımı yok.
- [ ] Links(74), buttons(27), navigation(2), lists(1), tables(1) yoğunluğu dikkate alındı.
