# Contribution Popup Design QA

- Source visual truth: `/Users/kartikbansal/Downloads/WhatsApp Image 2026-09-18 at 00.50.35.jpeg`
- User-specified background asset: `/Users/kartikbansal/Downloads/WhatsApp Image 2026-09-18 at 00.50.35 (1).jpeg`
- Browser-rendered implementation: `/Users/kartikbansal/Desktop/nalum/nalum/design-qa-assets/contribution-popup-implementation.png`
- Normalized source crop: `/Users/kartikbansal/Desktop/nalum/nalum/design-qa-assets/contribution-popup-reference-crop.png`
- Normalized implementation crop: `/Users/kartikbansal/Desktop/nalum/nalum/design-qa-assets/contribution-popup-crop.png`
- Side-by-side comparison: `/Users/kartikbansal/Desktop/nalum/nalum/design-qa-assets/design-qa-comparison.png`
- Browser viewport: 1440 × 1000 CSS px, device scale factor 1
- Source pixels: 681 × 577; normalized popup region: 544 × 473
- Implementation pixels: 1440 × 1000; normalized popup region: 544 × 474
- State: contribution popup open in the public-site layout

## Full-view comparison evidence

The rendered popup preserves the reference's centered 544 px composition, dimmed/blurred page treatment, warm paper palette, rounded frame, title hierarchy, support panel, contact block, and close control. The campus and graduates scene intentionally differs from the second screenshot because the user explicitly selected the first supplied image as the background.

## Focused region comparison evidence

The popup itself was isolated at 1:1 pixel density and placed beside the normalized reference in `design-qa-comparison.png`. No additional crop was needed because the isolated component makes the typography, icon, spacing, background sharpness, contact copy, and close treatment clearly readable.

## Findings

- No actionable P0, P1, or P2 differences remain.
- Fonts and typography: Georgia/Times fallbacks closely match the editorial serif reference; sizes, weights, line heights, and wrapping reproduce the hierarchy and copy without truncation at the reference width.
- Spacing and layout rhythm: frame width, title placement, accent rule, support-card dimensions, contact spacing, radius, and elevation match the normalized reference.
- Colors and visual tokens: the rust headline/accent, charcoal copy, cream support panel, gray close control, and dark translucent overlay align with the source palette.
- Image quality and asset fidelity: the supplied 1370 × 1148 background is used directly without upscaling, preserving its sharpness and requested artwork.
- Copy and content: all visible wording, name, role, and phone number match the second supplied image.
- P3: the support icon uses the closest available library icon rather than reproducing the custom illustration embedded in the reference screenshot.

## Comparison history

1. Initial capture: support panel was too wide, lower content was vertically compressed, and the close control showed its focus ring immediately.
2. Fixes: constrained the support panel to 385 px, adjusted vertical rhythm through the contact block, and prevented initial autofocus while retaining keyboard focus styling.
3. Post-fix evidence: the final 1:1 comparison shows no remaining P0/P1/P2 mismatch.

## Interaction and runtime checks

- Browser-rendered timed-open state captured successfully.
- Automated tests cover delayed opening, session dismissal, close button, Escape, route exclusions, timer cleanup, the callable phone link, and the hand-heart toggle state.
- No popup-related browser runtime error appeared during capture.
- Production build and focused lint completed successfully.

## Implementation checklist

- [x] Use the first supplied image as the background.
- [x] Match the second supplied image's text and hierarchy.
- [x] Preserve existing popup timing, route, dismissal, and accessibility behavior.
- [x] Keep the phone number actionable.
- [x] Verify tests, build, lint, and visual fidelity.

## Follow-up polish

- Optional only: replace the library support icon if a standalone original icon asset becomes available.

final result: passed
