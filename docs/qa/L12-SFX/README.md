## 10/09/2026 — sửa âm rèn trong trận (TKT-0002)

Code `235c66699a0340f36300b1d3c54d4039217ede8f`, nhánh `work/l12-pointer-lifecycle-20260909`. Tách `forge-reveal` riêng cho rèn; bỏ shared impact sound khỏi combat và chặn sự kiện rèn trong battle channel. Âm ra chiêu giữ nguyên; không thêm âm thay thế, không sửa asset/VFX/damage timing/UI/balance.

RED 0/5 → GREEN 5/5. Focused 13 PASS / 1 thiếu dist; full local 386/418 PASS, 32 lỗi thiếu assets/dist/sharp; không full-green. Preview exact SHA READY: https://luc-than-9a271tpx7-cuong-duc-ai-s-projects.vercel.app/.

Chrome QA đã rèn thành công (`forge-reveal`) → trận 6v4 (`basic`, `ultimate`) → Victory (`victory`, active0) → Xác nhận về ải1-2 (battleActive false). MVP Cô Đào 737 damage/3 kills;16 actions/2 rounds. Có quan sát VFX/số sát thương. Chưa thu/nghe audio, chưa Safari/mobile; telemetry không thay nghiệm thu âm sắc. [Evidence](evidence.json). Vibe gate còn OPEN vì full local verification; chưa DONE/MERGED.

Main/production không đổi. Visual pass Bày trận `74b3976` vẫn bị từ chối/revert; không khôi phục. Next: owner nghe preview xác nhận tiếng rèn đã hết; bổ sung device/full checkout verification. Không mở rộng mapping âm riêng từng tướng trong lát cắt này.

Tests lifecycle đổi event probe impact→skill vì impact đã bị loại; giữ nguyên assertions cleanup và restart.
