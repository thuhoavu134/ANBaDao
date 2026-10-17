# PR310: action readiness and Run playback follow-up

Owner reports Basic/Ultimate remaining idle and asks for slower Run in victory/AFK.

Confirmed: character files in commit 24af7ff decode, campaign asset build passes. Battle renderer previously reused unchanged atlas URLs across incompatible atlas layouts and the repaired corrupt binaries. The loader retains failed URLs. Add explicit character asset revision to battle URLs so old responses/failure entries cannot poison the new cast. Add a bounded last-action diagnostic (`window.__HV_HONG_THUONG_ACTION`) and visible loading error instead of silent failure. This is a cache/readiness mitigation; no capture of the owner's failing battle is available, so the specific on-device cause remains unconfirmed.

Confirmed: victory manifest omitted Hồng Thương. Register the actual authored run/idle/fall and support idleVisual page descriptors and durations. Slow only Run frame playback to 0.65 in victory and AFK across characters; preserve travel/entrance duration and all attack clocks.

Validation: 7 runtime tests pass including a poisoned old URL followed by a successful versioned cast and changing Basic source frames. Victory descriptor evaluation passes: 11 idle pages, final one-frame page, 18-frame run. Installer syntax passes. Full production build/browser/iPhone validation not rerun. No merge. Existing unavailable-workflow-tool waiver applies; no VibeLab pass claimed.
