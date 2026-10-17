# Owner follow-up: 30% Run + double impact

Run frame playback in AFK and victory is now 0.30 of original speed (previously 0.65). Travel duration and combat attack timing stay unchanged.

Each spear impact draws two synchronized copies of the approved sample-22 atlas, offset by four display pixels, opacity 1.0 / 0.65 with screen blending. It remains one impact event; no extra damage, sound, or asset load is created.

`node scripts/hong-thuong-upscale-vfx.mjs` creates impact-2x.webp from the original impact.webp: each of 14 cells independently resized 128→256 using Lanczos3 plus mild sharpening, then lossless WebP. This avoids cross-cell bleed and repeated lossy encoding. It improves resampling at the 160px display size but does not invent missing source detail. The new filename avoids stale cached atlases. Output 1280×768 (~431 KiB); decoded memory ~3.75 MiB.

8/8 runtime regressions pass including two draws from one impact event. Atlas inspected visually. Normal battle/browser/iPhone validation not performed; no merge. Existing workflow-tool waiver applies; no VibeLab pass asserted.
