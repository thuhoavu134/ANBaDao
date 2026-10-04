# Compact floaters QA

Renderer command/format tests are dependency-free Node tests. They verify exact numeric text, label/number font hierarchy, compact pop scale, stroke/glow settings and generated integration; they do not certify pixel layout.

Offline visual preview was generated and inspected with the optional @napi-rs/canvas package available in the development workspace. The preview generator requires that package; it is not part of npm test or the production game, and no runtime dependency is added. Authored Thầy Mo atlas crop: x/y 3, cell 235×264, cols12, stride241×270.

Actual browser/mobile/Safari rendering remains unverified. User-provided reference/current screenshots informed proportions; no pixel-identical claim.
