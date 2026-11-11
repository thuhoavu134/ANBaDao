(() => {
  const HUNT_ART = Object.freeze({
    ca_voi_nuot_trang: "assets/hunt/ca-voi-nuot-trang.png?v=hv2",
    nhen_det_ac_mong: "assets/hunt/nhen-det-ac-mong.png?v=hv2",
    dong_ho_cat_vo: "assets/hunt/dong-ho-cat-vo.png?v=hv2",
    crystal: "assets/hunt/mong-tinh.png?v=hv2"
  });
  const HUNT_DRAW_H = Object.freeze({
    ca_voi_nuot_trang: [168, 230],
    nhen_det_ac_mong: [210, 280],
    dong_ho_cat_vo: [280, 360],
    crystal: [78, 96]
  });
  const huntImages = {};
  Object.keys(HUNT_ART).forEach((form) => {
    const img = new Image();
    img.decoding = "async";
    img.src = HUNT_ART[form];
    huntImages[form] = img;
  });

  function inferHuntForm(unit) {
    if (!unit) return null;
    if (unit.huntForm) return String(unit.huntForm);
    const sid = String(unit.sourceId || unit.id || "");
    if (sid === "add1" || sid === "add2" || /(?:^|-)add[12]$/.test(sid)) return "crystal";
    // Boss cốt truyện có animation clip (owner 10/11).
    if (/Sơn Tặc Đầu Đảng/.test(String(unit.name || ""))) return "story_boss";
    if (/Hộ Pháp Ba Đầu/.test(String(unit.name || ""))) return "story_boss";
    if (/Thủy Trại Chúa|Cua Hoàng Đế|Hương Chủ|Giám Đốc Máy Ấp Mơ|Thiên Ảnh|Người Gác Mộng|^Khaos/.test(String(unit.name || "")) && sid.indexOf("huntboss") < 0) return "story_boss";
    if (sid === "huntboss" || sid.indexOf("huntboss") >= 0) {
      const name = String(unit.name || "");
      if (name.indexOf("Nhện") >= 0) return "nhen_det_ac_mong";
      if (name.indexOf("Đồng Hồ") >= 0 || name.indexOf("Cát") >= 0) return "dong_ho_cat_vo";
      return "ca_voi_nuot_trang";
    }
    return null;
  }

  function huntScaleFor(unit, form) {
    const given = Number(unit && unit.huntScale);
    if (Number.isFinite(given) && given > 0.05) return given;
    return form === "crystal" ? 0.38 : 2.45;
  }

  function artReady(form) {
    const img = huntImages[form];
    return img && img.complete && img.naturalWidth > 1 && img.naturalHeight > 1;
  }

  function drawCrystal(ctx, unit, t) {
    const pulse = 1 + Math.sin(t * 0.004 + (unit.phase || 0)) * 0.07;
    ctx.save();
    ctx.scale(pulse, pulse);
    ctx.fillStyle = "rgba(155, 207, 214, .28)";
    ctx.beginPath();
    ctx.ellipse(0, 10, 30, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(0, -42);
    const col = unit.color || "#9bcfd6";
    ctx.fillStyle = col;
    ctx.strokeStyle = "rgba(246, 230, 192, .9)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -52);
    ctx.lineTo(24, -10);
    ctx.lineTo(8, 32);
    ctx.lineTo(-8, 32);
    ctx.lineTo(-24, -10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 255, 255, .42)";
    ctx.beginPath();
    ctx.moveTo(-8, -32);
    ctx.lineTo(6, -20);
    ctx.lineTo(-2, 8);
    ctx.lineTo(-12, -8);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawWhale(ctx, unit, t) {
    const sway = Math.sin(t * 0.0022) * 5;
    ctx.save();
    ctx.translate(sway, -88);
    ctx.fillStyle = unit.color || "#5a7fd6";
    ctx.strokeStyle = "rgba(12, 18, 36, .6)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, 8, 118, 58, -0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(96, -6);
    ctx.quadraticCurveTo(148, -38, 138, 18);
    ctx.quadraticCurveTo(112, 28, 90, 14);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6e6c0";
    ctx.beginPath();
    ctx.arc(-48, -52, 22, 0.15, Math.PI * 1.75);
    ctx.lineTo(-48, -52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1b2438";
    ctx.beginPath();
    ctx.arc(-58, -10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSpider(ctx, unit, t) {
    const twitch = Math.sin(t * 0.008) * 4;
    ctx.save();
    ctx.translate(0, -78);
    ctx.strokeStyle = unit.color || "#8a5fae";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    for (const side of [-1, 1]) {
      for (let i = 0; i < 4; i += 1) {
        const y = -22 + i * 18;
        ctx.beginPath();
        ctx.moveTo(side * 22, 0);
        ctx.quadraticCurveTo(side * (68 + twitch), y - 28, side * (88 + (i % 2) * 8), y + 26);
        ctx.stroke();
      }
    }
    ctx.fillStyle = unit.color || "#8a5fae";
    ctx.beginPath();
    ctx.ellipse(0, 14, 42, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -28, 30, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2d27a";
    ctx.beginPath();
    ctx.arc(-10, -32, 5, 0, Math.PI * 2);
    ctx.arc(10, -32, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHourglass(ctx, unit, t) {
    const drip = (Math.sin(t * 0.003) + 1) * 8;
    ctx.save();
    ctx.translate(0, -96);
    ctx.fillStyle = unit.color || "#d6b45a";
    ctx.strokeStyle = "rgba(42, 24, 8, .75)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-48, -64);
    ctx.lineTo(48, -64);
    ctx.lineTo(14, 0);
    ctx.lineTo(46, 64);
    ctx.lineTo(-46, 64);
    ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(90, 48, 12, .58)";
    ctx.beginPath();
    ctx.moveTo(-26, -54);
    ctx.lineTo(26, -54);
    ctx.lineTo(6, -10);
    ctx.lineTo(-6, -10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(90, 48, 12, .48)";
    ctx.beginPath();
    ctx.moveTo(-24, 54);
    ctx.lineTo(24, 54);
    ctx.lineTo(8, 16 + drip);
    ctx.lineTo(-8, 16 + drip);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawHuntFallback(ctx, unit, time, form) {
    if (form === "crystal") return drawCrystal(ctx, unit, time);
    if (form === "nhen_det_ac_mong") return drawSpider(ctx, unit, time);
    if (form === "dong_ho_cat_vo") return drawHourglass(ctx, unit, time);
    return drawWhale(ctx, unit, time);
  }

  function drawHuntArt(ctx, unit, time, form) {
    const img = huntImages[form];
    if (!artReady(form)) return false;
    const mobile = typeof innerWidth === "number" && innerWidth < 600;
    const pair = HUNT_DRAW_H[form] || [220, 300];
    const h = pair[mobile ? 0 : 1];
    const w = h * (img.naturalWidth / img.naturalHeight);
    const bob = Math.sin(time * 0.0032 + (unit.phase || 0)) * (form === "crystal" ? 4 : 3);
    ctx.save();
    ctx.translate(0, bob);
    ctx.drawImage(img, -w / 2, -h + 6, w, h);
    ctx.restore();
    return true;
  }

  // Boss có animation thật (owner 09/11): idle / atk / ultimate / hit / fall-die từ Google Flow,
  // tách nền + cắt frame bằng kiemthe-animation-packager. Khung chọn theo unit.state của trận.
  const HUNT_ANIM = Object.freeze({ "huong-chu-luyen-dan": {"schema": "hunt-boss-anim/v1", "slug": "huong-chu-luyen-dan", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/huong-chu-luyen-dan/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 183, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/huong-chu-luyen-dan/atk.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 183, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/huong-chu-luyen-dan/ultimate.webp", "frames": 18, "cols": 6, "cellW": 272, "cellH": 220, "pivot": 136, "foot": 219, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/huong-chu-luyen-dan/hit.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 183, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/huong-chu-luyen-dan/fall-die.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 215, "durationMs": 1600, "loop": false}}}, "khaos": {"schema": "hunt-boss-anim/v1", "slug": "khaos", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/khaos/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 197, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/khaos/atk.webp", "frames": 18, "cols": 6, "cellW": 320, "cellH": 220, "pivot": 160, "foot": 197, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/khaos/ultimate.webp", "frames": 18, "cols": 6, "cellW": 280, "cellH": 220, "pivot": 140, "foot": 201, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/khaos/hit.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 197, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/khaos/fall-die.webp", "frames": 18, "cols": 6, "cellW": 448, "cellH": 220, "pivot": 224, "foot": 217, "durationMs": 1600, "loop": false}}}, "thien-anh": {"schema": "hunt-boss-anim/v1", "slug": "thien-anh", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/thien-anh/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 188, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/thien-anh/atk.webp", "frames": 18, "cols": 6, "cellW": 320, "cellH": 220, "pivot": 160, "foot": 192, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/thien-anh/ultimate.webp", "frames": 18, "cols": 6, "cellW": 400, "cellH": 220, "pivot": 200, "foot": 192, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/thien-anh/hit.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 188, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/thien-anh/fall-die.webp", "frames": 18, "cols": 6, "cellW": 256, "cellH": 220, "pivot": 128, "foot": 217, "durationMs": 1600, "loop": false}}}, "thuy-trai-chua": {"schema": "hunt-boss-anim/v1", "slug": "thuy-trai-chua", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/thuy-trai-chua/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 198, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/thuy-trai-chua/atk.webp", "frames": 18, "cols": 6, "cellW": 384, "cellH": 220, "pivot": 192, "foot": 200, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/thuy-trai-chua/ultimate.webp", "frames": 18, "cols": 6, "cellW": 440, "cellH": 220, "pivot": 220, "foot": 205, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/thuy-trai-chua/hit.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 213, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/thuy-trai-chua/fall-die.webp", "frames": 18, "cols": 6, "cellW": 384, "cellH": 220, "pivot": 192, "foot": 216, "durationMs": 1600, "loop": false}}}, "ho-phap-ba-dau": {"schema": "hunt-boss-anim/v1", "slug": "ho-phap-ba-dau", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/ho-phap-ba-dau/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 189, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/ho-phap-ba-dau/atk.webp", "frames": 18, "cols": 6, "cellW": 424, "cellH": 220, "pivot": 212, "foot": 189, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/ho-phap-ba-dau/ultimate.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 195, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/ho-phap-ba-dau/hit.webp", "frames": 18, "cols": 6, "cellW": 248, "cellH": 220, "pivot": 124, "foot": 189, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/ho-phap-ba-dau/fall-die.webp", "frames": 18, "cols": 6, "cellW": 448, "cellH": 220, "pivot": 224, "foot": 217, "durationMs": 1600, "loop": false}}}, "son-tac": {"schema": "hunt-boss-anim/v1", "slug": "son-tac", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/son-tac/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 195, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/son-tac/atk.webp", "frames": 18, "cols": 6, "cellW": 312, "cellH": 220, "pivot": 156, "foot": 195, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/son-tac/ultimate.webp", "frames": 18, "cols": 6, "cellW": 368, "cellH": 220, "pivot": 184, "foot": 197, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/son-tac/hit.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 195, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/son-tac/fall-die.webp", "frames": 18, "cols": 6, "cellW": 384, "cellH": 220, "pivot": 192, "foot": 216, "durationMs": 1600, "loop": false}}}, "thiet-giap-nguu": {"schema": "hunt-boss-anim/v1", "slug": "thiet-giap-nguu", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/thiet-giap-nguu/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 195, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/thiet-giap-nguu/atk.webp", "frames": 18, "cols": 6, "cellW": 392, "cellH": 220, "pivot": 196, "foot": 197, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/thiet-giap-nguu/ultimate.webp", "frames": 18, "cols": 6, "cellW": 296, "cellH": 220, "pivot": 148, "foot": 197, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/thiet-giap-nguu/hit.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 195, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/thiet-giap-nguu/fall-die.webp", "frames": 18, "cols": 6, "cellW": 312, "cellH": 220, "pivot": 156, "foot": 216, "durationMs": 1600, "loop": false}}}, "hac-xa": {"schema": "hunt-boss-anim/v1", "slug": "hac-xa", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/hac-xa/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 208, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/hac-xa/atk.webp", "frames": 18, "cols": 6, "cellW": 648, "cellH": 220, "pivot": 324, "foot": 207, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/hac-xa/ultimate.webp", "frames": 18, "cols": 6, "cellW": 400, "cellH": 220, "pivot": 200, "foot": 207, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/hac-xa/hit.webp", "frames": 18, "cols": 6, "cellW": 272, "cellH": 220, "pivot": 136, "foot": 207, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/hac-xa/fall-die.webp", "frames": 18, "cols": 6, "cellW": 264, "cellH": 220, "pivot": 132, "foot": 216, "durationMs": 1600, "loop": false}}}, 'bach-ho': {"schema": "hunt-boss-anim/v1", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager uniform", "clips": {"idle": {"src": "assets/hunt/bach-ho/idle.webp", "frames": 30, "cols": 6, "cellW": 456, "cellH": 220, "pivot": 228, "foot": 217, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/bach-ho/atk.webp", "frames": 18, "cols": 6, "cellW": 592, "cellH": 220, "pivot": 296, "foot": 217, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/bach-ho/ultimate.webp", "frames": 18, "cols": 6, "cellW": 504, "cellH": 220, "pivot": 252, "foot": 217, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/bach-ho/hit.webp", "frames": 18, "cols": 6, "cellW": 424, "cellH": 220, "pivot": 212, "foot": 217, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/bach-ho/fall-die.webp", "frames": 18, "cols": 6, "cellW": 464, "cellH": 220, "pivot": 232, "foot": 217, "durationMs": 1600, "loop": false}}} });
  // Mỗi boss Săn Boss có bộ animation riêng. Boss nhận theo tên hiển thị
  // (tên do lớp lore đặt); boss chưa có atlas thì rơi về ảnh tĩnh.
  // Owner 10/11: 3/6 boss cot truyen co atlas ve san quay mat sang PHAI (cung huong
  // voi doi hinh) nen phai lat quanh pivot khi ve. Cac boss con lai da quay sang TRAI
  // (huong ve doi) nen KHONG lat - chi lat theo slug, khong lat toan bo enemy.
  const HUNT_ANIM_MIRROR = Object.freeze(['ho-phap-ba-dau', 'thuy-trai-chua', 'thien-anh']);
  const BOSS_SLUGS = [
    [/Cua Hoàng Đế/i, 'thuy-trai-chua'],
    [/Giám Đốc Máy Ấp Mơ/i, 'huong-chu-luyen-dan'],
    [/Người Gác Mộng/i, 'khaos'],
    [/Thiên Ảnh/i, 'thien-anh'],
    [/Thủy Trại/i, 'thuy-trai-chua'],
    [/Khaos/i, 'khaos'],
    [/Hương Chủ/i, 'huong-chu-luyen-dan'],
    [/Thiên Ảnh/i, 'thien-anh'],
    [/Thủy Trại Chúa/i, 'thuy-trai-chua'],
    [/Bạch Hổ/i, 'bach-ho'],
    [/Hắc Xà/i, 'hac-xa'],
    [/Thiết Giáp/i, 'thiet-giap-nguu'],
    [/Sơn Tặc Đầu Đảng/i, 'son-tac'],
    [/Hộ Pháp Ba Đầu/i, 'ho-phap-ba-dau']
  ];
  function bossSlug(unit) {
    const name = String((unit && unit.name) || '');
    for (const pair of BOSS_SLUGS) if (pair[0].test(name)) return pair[1];
    const keys = Object.keys(HUNT_ANIM);
    return keys.length ? keys[0] : null;
  }

  const huntAnimImages = {};
  Object.keys(HUNT_ANIM).forEach((slugKey) => {
    huntAnimImages[slugKey] = {};
    Object.keys(HUNT_ANIM[slugKey].clips).forEach((key) => {
      const img = new Image();
      img.decoding = "async";
      img.src = HUNT_ANIM[slugKey].clips[key].src;
      huntAnimImages[slugKey][key] = img;
    });
  });
  function huntAnimClip(unit, now) {
    if ((unit.hp || 0) <= 0) {
      if (!unit._huntFallAt) unit._huntFallAt = now;
      return { key: "fall-die", t: now - unit._huntFallAt, hold: true };
    }
    unit._huntFallAt = 0;
    const st = String(unit.state || "idle");
    const key = st === "ultimate" ? "ultimate" : (st === "attack" || st === "skill1") ? "atk" : st === "hurt" ? "hit" : "idle";
    if (key === "idle") return { key, t: now, loop: true };
    const started = Number(unit.stateStarted) || now;
    // Tiếng đòn của boss (owner 09/11): mỗi lần vào state atk/ultimate chỉ phát 1 lần.
    if ((key === "atk" || key === "ultimate") && unit._huntSfxAt !== started) {
      unit._huntSfxAt = started;
      const slug = bossSlug(unit);
      const cue = slug ? slug + "-" + key : "";
      if (cue && window.HonVietSfx) {
        try { void window.HonVietSfx.play(cue, { group: "combat" }); } catch (e) {}
      }
    }
    const span = Math.max(120, Number(unit.stateDuration) || 800);
    return { key, span, started, ms: Math.max(0, now - started), p: Math.min(0.999, Math.max(0, (now - started) / span)) };
  }
  function huntAnimDebug() {
    const out = { draws: 0, fails: 0, lastForm: null, lastKey: null, lastState: null, lastErr: null, imgs: {} };
    Object.keys(huntAnimImages).forEach((f) => {
      out.imgs[f] = {};
      Object.keys(huntAnimImages[f]).forEach((k) => {
        const i = huntAnimImages[f][k];
        out.imgs[f][k] = { ok: !!(i.complete && i.naturalWidth), w: i.naturalWidth || 0 };
      });
    });
    return Object.assign(out, window.__HVBossStats || {});
  }
  window.huntAnimDebug = huntAnimDebug;
  window.__HVBossStats = { draws: 0, fails: 0 };



  // ---- VFX tu clip Flow (owner 10/11: VFX phai la clip, khong ve bang code) ----
  // ENTRY MAU (owner 10/11): boss khaos / ultimate dung 4 LOP CLIP chong nhau.
  // Dang tam dung lai clip Ultimate dang co (assets/hunt/khaos/vfx-ulti.webp) voi
  // scale/alpha khac nhau de chay thu ngay; khi co clip rieng (sky/fall/impact/dust)
  // thi chi thay truong "src" (va cellW/cellH neu clip khac kich thuoc).
  const HV_KHAOS_SKY = Object.freeze({"src": "assets/hunt/khaos/vfx-sky.webp", "frames": 18, "cols": 6, "cellW": 455, "cellH": 260, "durationMs": 3920, "cx": 0.507, "cy": 0.5});
  const HV_KHAOS_FALL = Object.freeze({"src": "assets/hunt/khaos/vfx-fall.webp", "frames": 18, "cols": 6, "cellW": 455, "cellH": 260, "durationMs": 3920, "cx": 0.506, "cy": 0.5});
  const HV_KHAOS_IMPACT = Object.freeze({"src": "assets/hunt/khaos/vfx-nova.webp", "frames": 18, "cols": 6, "cellW": 462, "cellH": 260, "durationMs": 3920, "cx": 0.5, "cy": 0.5});
  const HV_KHAOS_DUST = Object.freeze({"src": "assets/hunt/khaos/vfx-dust.webp", "frames": 18, "cols": 6, "cellW": 417, "cellH": 260, "durationMs": 3920, "cx": 0.507, "cy": 0.5});
  const HUNT_VFX = Object.freeze({ 'khaos': { atk: { clip: {"src": "assets/hunt/khaos/vfx-atk.webp", "frames": 18, "cols": 6, "cellW": 462, "cellH": 260, "durationMs": 3920, "cx": 0.499, "cy": 0.501}, scale: 1.0 }, ultimate: { layers: [ { name: 'sky', clip: HV_KHAOS_SKY, anchor: 'sky', perTarget: false, startMs: 0, scale: 1.2, alpha: 1 }, { name: 'fall', clip: HV_KHAOS_FALL, anchor: 'targetTop', perTarget: true, startMs: 200, staggerMs: 70, fromSky: true, fallMs: 520, scale: 1.0 }, { name: 'impact', clip: HV_KHAOS_IMPACT, anchor: 'feet', perTarget: true, startMs: 650, staggerMs: 70, scale: 0.9 }, { name: 'dust', clip: HV_KHAOS_DUST, anchor: 'feet', perTarget: true, startMs: 900, staggerMs: 70, scale: 1.1, alpha: 0.75 } ], shake: { atMs: 650, power: 5, ms: 200 }, mode: 'impact', scale: 1.3 }, mode: 'impact' }, 'huong-chu-luyen-dan': { atk: { clip: {"src": "assets/hunt/huong-chu-luyen-dan/vfx-atk.webp", "frames": 18, "cols": 6, "cellW": 453, "cellH": 260, "durationMs": 3920, "cx": 0.51, "cy": 0.5}, scale: 1.0 }, ultimate: { layers: [ { name: 'cauldron', clip: {"src": "assets/hunt/huong-chu-luyen-dan/vfx-sky.webp", "frames": 18, "cols": 6, "cellW": 286, "cellH": 260, "durationMs": 3920, "cx": 0.511, "cy": 0.469}, anchor: 'boss', perTarget: false, startMs: 0, scale: 0.85 }, { name: 'spit', clip: {"src": "assets/hunt/huong-chu-luyen-dan/vfx-fall.webp", "frames": 18, "cols": 6, "cellW": 458, "cellH": 260, "durationMs": 3920, "cx": 0.504, "cy": 0.5}, anchor: 'feet', perTarget: true, motion: 'arc', startMs: 280, staggerMs: 110, travelMs: 520, arcH: 280, scale: 0.7 }, { name: 'burst', clip: {"src": "assets/hunt/huong-chu-luyen-dan/vfx-nova.webp", "frames": 18, "cols": 6, "cellW": 432, "cellH": 260, "durationMs": 3920, "cx": 0.479, "cy": 0.5}, anchor: 'feet', perTarget: true, startMs: 780, staggerMs: 110, scale: 0.85 }, { name: 'gas', clip: {"src": "assets/hunt/huong-chu-luyen-dan/vfx-dust.webp", "frames": 18, "cols": 6, "cellW": 354, "cellH": 260, "durationMs": 3920, "cx": 0.495, "cy": 0.5}, anchor: 'feet', perTarget: false, motion: 'sweep', startMs: 1050, travelMs: 1400, sweepW: 640, scale: 1.35, alpha: 0.7 } ], shake: { atMs: 800, power: 5, ms: 220 }, mode: 'impact', scale: 1.3 }, impactClip: {"src": "assets/hunt/huong-chu-luyen-dan/vfx-nova.webp", "frames": 18, "cols": 6, "cellW": 432, "cellH": 260, "durationMs": 3920, "cx": 0.479, "cy": 0.5}, mode: 'impact' }, 'thien-anh': { atk: { clip: {"src": "assets/hunt/thien-anh/vfx-atk.webp", "frames": 18, "cols": 6, "cellW": 365, "cellH": 260, "durationMs": 3920, "cx": 0.512, "cy": 0.501}, scale: 1.0 }, ultimate: { clip: {"src": "assets/hunt/thien-anh/vfx-ulti.webp", "frames": 18, "cols": 6, "cellW": 455, "cellH": 260, "durationMs": 3920, "cx": 0.501, "cy": 0.5}, scale: 1.3 }, mode: 'impact' }, 'thuy-trai-chua': { atk: { clip: {"src": "assets/hunt/thuy-trai-chua/vfx-atk.webp", "frames": 18, "cols": 6, "cellW": 434, "cellH": 260, "durationMs": 3920, "cx": 0.486, "cy": 0.512}, scale: 1.0 }, ultimate: { layers: [ { name: 'whirl', clip: {"src": "assets/hunt/thuy-trai-chua/vfx-sky.webp", "frames": 18, "cols": 6, "cellW": 365, "cellH": 260, "durationMs": 3920, "cx": 0.41, "cy": 0.505}, anchor: 'boss', perTarget: false, startMs: 0, scale: 1.0 }, { name: 'wave', clip: {"src": "assets/hunt/thuy-trai-chua/vfx-nova.webp", "frames": 18, "cols": 6, "cellW": 466, "cellH": 260, "durationMs": 3920, "cx": 0.501, "cy": 0.49}, anchor: 'feet', perTarget: false, motion: 'sweep', startMs: 300, travelMs: 900, sweepW: 560, scale: 1.4, alpha: 0.9 }, { name: 'geyser', clip: {"src": "assets/hunt/thuy-trai-chua/vfx-fall.webp", "frames": 18, "cols": 6, "cellW": 461, "cellH": 260, "durationMs": 3920, "cx": 0.501, "cy": 0.5}, anchor: 'feet', perTarget: true, order: 'nearBoss', motion: 'rise', startMs: 850, staggerMs: 95, travelMs: 380, riseH: 200, rotate: 3.14159, scale: 1.05 }, { name: 'mist', clip: {"src": "assets/hunt/thuy-trai-chua/vfx-dust.webp", "frames": 18, "cols": 6, "cellW": 497, "cellH": 260, "durationMs": 3920, "cx": 0.509, "cy": 0.454}, anchor: 'feet', perTarget: true, startMs: 1250, staggerMs: 95, scale: 1.0, alpha: 0.65 } ], shake: { atMs: 900, power: 6, ms: 220 }, mode: 'impact', scale: 1.3 }, impactClip: {"src": "assets/hunt/thuy-trai-chua/vfx-nova.webp", "frames": 18, "cols": 6, "cellW": 466, "cellH": 260, "durationMs": 3920, "cx": 0.501, "cy": 0.49}, mode: 'impact' }, 'ho-phap-ba-dau': { atk: { clip: {"src": "assets/hunt/ho-phap-ba-dau/vfx-atk.webp", "frames": 18, "cols": 6, "cellW": 462, "cellH": 260, "durationMs": 3920, "cx": 0.5, "cy": 0.5}, scale: 1.0 }, ultimate: { layers: [ { name: 'wheels', clip: {"src": "assets/hunt/ho-phap-ba-dau/vfx-sky.webp", "frames": 18, "cols": 6, "cellW": 416, "cellH": 260, "durationMs": 3920, "cx": 0.504, "cy": 0.5}, anchor: 'center', perTarget: false, motion: 'orbit', count: 3, startMs: 0, travelMs: 1100, convergeMs: 1100, radius: 250, spin: 3.4, scale: 0.65 }, { name: 'vajra', clip: {"src": "assets/hunt/ho-phap-ba-dau/vfx-fall.webp", "frames": 18, "cols": 6, "cellW": 460, "cellH": 260, "durationMs": 3920, "cx": 0.502, "cy": 0.5}, anchor: 'center', perTarget: false, motion: 'fall', startMs: 950, travelMs: 280, scale: 1.3 }, { name: 'nova', clip: {"src": "assets/hunt/ho-phap-ba-dau/vfx-nova.webp", "frames": 18, "cols": 6, "cellW": 457, "cellH": 260, "durationMs": 3920, "cx": 0.495, "cy": 0.5}, anchor: 'center', perTarget: false, startMs: 1200, scale: 1.9 }, { name: 'embers', clip: {"src": "assets/hunt/ho-phap-ba-dau/vfx-dust.webp", "frames": 18, "cols": 6, "cellW": 397, "cellH": 260, "durationMs": 3920, "cx": 0.434, "cy": 0.491}, anchor: 'feet', perTarget: true, order: 'farBoss', startMs: 1350, staggerMs: 60, scale: 0.95, alpha: 0.8 } ], shake: { atMs: 1220, power: 7, ms: 220 }, mode: 'impact', scale: 1.3 }, impactClip: {"src": "assets/hunt/ho-phap-ba-dau/vfx-nova.webp", "frames": 18, "cols": 6, "cellW": 457, "cellH": 260, "durationMs": 3920, "cx": 0.495, "cy": 0.5}, mode: 'impact' }, 'son-tac': { atk: { clip: {"src": "assets/hunt/son-tac/vfx-atk.webp", "frames": 18, "cols": 6, "cellW": 448, "cellH": 260, "durationMs": 3920, "cx": 0.495, "cy": 0.5}, scale: 1.0 }, ultimate: { clip: {"src": "assets/hunt/son-tac/vfx-ulti.webp", "frames": 18, "cols": 6, "cellW": 472, "cellH": 260, "durationMs": 3920, "cx": 0.496, "cy": 0.486}, scale: 1.3 }, mode: 'impact' }, 'hac-xa': { atk: { clip: {"src": "assets/hunt/hac-xa/vfx-spray.webp", "frames": 18, "cols": 6, "cellW": 463, "cellH": 260, "durationMs": 3920, "cx": 0.5, "cy": 0.5}, scale: 1.0 }, ultimate: { clip: {"src": "assets/hunt/hac-xa/vfx-spray.webp", "frames": 18, "cols": 6, "cellW": 463, "cellH": 260, "durationMs": 3920, "cx": 0.5, "cy": 0.5}, scale: 1.4 } } , 'thiet-giap-nguu': { mode: 'impact', atk: { clip: {"src": "assets/hunt/thiet-giap-nguu/vfx-atk.webp", "frames": 18, "cols": 6, "cellW": 459, "cellH": 260, "durationMs": 3920, "cx": 0.493, "cy": 0.495}, scale: 1.0 }, ultimate: { clip: {"src": "assets/hunt/thiet-giap-nguu/vfx-ulti.webp", "frames": 18, "cols": 6, "cellW": 454, "cellH": 260, "durationMs": 3920, "cx": 0.492, "cy": 0.5}, scale: 1.35 } } });
  const huntVfxImages = {};
  function huntVfxImage(src) {
    if (!huntVfxImages[src]) { const im = new Image(); im.decoding = 'async'; im.src = src; huntVfxImages[src] = im; }
    return huntVfxImages[src];
  }
  // Đòn thường (atk) chỉ trúng ĐÚNG 1 mục tiêu boss đang đánh (owner 10/11).
  // Tuyệt kỹ (ultimate) hoặc kỹ năng có cờ AoE (aoe/aoeBurn/aoeDebuff) mới phun cả đội.
  function huntVfxTargets(boss, units, target, key, aoe) {
    const list = (Array.isArray(units) ? units : []).filter(u => u && u !== boss && u.team !== boss.team && (u.hp || 0) > 0 && Number.isFinite(u.x) && Number.isFinite(u.y));
    if (key !== 'ultimate' && !aoe) {
      const direct = target && target !== boss && target.team !== boss.team && (target.hp || 0) > 0 && Number.isFinite(target.x) && Number.isFinite(target.y) ? target : null;
      if (direct) return [direct];
      // Không có dữ liệu mục tiêu (bản build cũ): lấy tướng còn sống gần boss nhất.
      let best = null, bestD = Infinity;
      for (const u of list) {
        const dx = u.x - boss.x, dy = u.y - boss.y, d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = u; }
      }
      return best ? [best] : [];
    }
    return list.slice(0, 6);
  }
  // Vi tri mieng ran trong o atlas (ti le 0..1). Chinh o day neu lech.
  const HUNT_MOUTH = { x: 0.14, y: 0.30, dx: -0.12, dy: -0.72 };
  // ---- VFX nhieu lop (owner 10/11): chi XEP LOP clip Flow co san ----
  // Khong ve hieu ung bang code; chi dat vi tri, nhan ban, doi alpha/scale va rung khung.
  function hvVisibleWorldRect(ctx) {
    try {
      const m = ctx.getTransform();
      const det = m.a * m.d - m.b * m.c;
      if (!det) return null;
      const W = ctx.canvas ? ctx.canvas.width : 0, H = ctx.canvas ? ctx.canvas.height : 0;
      if (!W || !H) return null;
      const ia = m.d / det, ib = -m.b / det, ic = -m.c / det, id = m.a / det;
      const ie = (m.c * m.f - m.d * m.e) / det, iff = (m.b * m.e - m.a * m.f) / det;
      const wx = (px, py) => ({ x: ia * px + ic * py + ie, y: ib * px + id * py + iff });
      const pts = [wx(0, 0), wx(W, 0), wx(0, H), wx(W, H)];
      const left = Math.min.apply(null, pts.map(p => p.x)), right = Math.max.apply(null, pts.map(p => p.x));
      const top = Math.min.apply(null, pts.map(p => p.y)), bottom = Math.max.apply(null, pts.map(p => p.y));
      return { left, right, top, bottom, cx: (left + right) / 2 };
    } catch (e) { return null; }
  }
  function hvLayerDuration(layer) {
    return Math.max(1, Number((layer.clip || {}).durationMs) || 800);
  }
  function hvTeamCenter(targets, ox, oy) {
    if (!targets || !targets.length) return { x: ox, y: oy };
    let sx = 0, sy = 0;
    targets.forEach(t => { sx += t.x; sy += t.y; });
    return { x: sx / targets.length, y: sy / targets.length };
  }
  function hvLayerTotal(spec, count) {
    let total = 0;
    (spec.layers || []).forEach((layer) => {
      if (!layer || !layer.clip) return;
      const m = layer.motion;
      const reps = (m === "orbit" || m === "line") ? Math.max(1, Number(layer.count) || 1) : (layer.perTarget ? Math.max(1, count) : 1);
      const end = (Number(layer.startMs) || 0) + (Number(layer.staggerMs) || 0) * (reps - 1) + hvLayerDuration(layer);
      if (end > total) total = end;
    });
    return total;
  }
  function hvAnchorPoint(anchor, rect, unit, tg, depth, ox, oy) {
    if (anchor === "sky") return { x: rect ? rect.cx : (unit.x || 800) + 120, y: rect ? rect.top + 40 : (unit.y || 480) - 430 };
    if (anchor === "boss") return { x: ox, y: oy };
    if (anchor === "targetTop" && tg) return { x: tg.x, y: tg.y - 150 * depth };
    if (tg) return { x: tg.x, y: tg.y - 12 * depth };
    return { x: ox, y: oy };
  }
  // Rung khung hinh: hang doi ngan, battle.html doc qua window.honVietHuntShakeSample(time).
  let vfxShake = null;
  window.honVietHuntShake = function (power, ms) {
    const p = Math.max(0, Number(power) || 0), d = Math.max(1, Number(ms) || 120);
    if (!p) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    vfxShake = { power: p, start: now, ms: d };
  };
  window.honVietHuntShakeSample = function () {
    if (!vfxShake) return null;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const k = (now - vfxShake.start) / vfxShake.ms;
    if (!(k >= 0) || k >= 1) { vfxShake = null; return null; }
    const amp = vfxShake.power * (1 - k);
    return { x: (Math.random() - 0.5) * amp * 2, y: (Math.random() - 0.5) * amp };
  };
  function drawHuntVfxLayers(ctx, unit, st, spec, targets, now) {
    const elapsed = Math.max(0, now - (Number(st.started) || now));
    const total = hvLayerTotal(spec, Math.max(1, targets.length));
    st.totalMs = total;
    const vs = window.__HVBossStats || (window.__HVBossStats = { draws: 0, fails: 0 });
    vs.vfxLayers = (vs.vfxLayers || 0) + 1;
    vs.vfxElapsed = Math.round(elapsed); vs.vfxTotal = Math.round(total); vs.vfxTargets = targets.length;
    // Rung khung hinh 1 lan cho moi don, dung timeline cua lop va cham.
    if (spec.shake && st.shakeAt !== st.started && elapsed >= (Number(spec.shake.atMs) || 0)) {
      st.shakeAt = st.started;
      if (typeof window.honVietHuntShake === "function") {
        try { window.honVietHuntShake(spec.shake.power, spec.shake.ms); } catch (e) {}
      }
    }
    if (elapsed > total + 150) { unit.__hvVfx = null; return; }
    const depth = 0.83 + ((unit.y || 520) - 290) / 1500;
    const rect = hvVisibleWorldRect(ctx);
    const H0 = ((typeof innerWidth === "number" && innerWidth < 600) ? 200 : 270) * depth;
    const ox = unit.x + HUNT_MOUTH.dx * H0, oy = unit.y + HUNT_MOUTH.dy * H0;
    const baseH = 190 * (Number(spec.scale) || 1) * depth;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    spec.layers.forEach((layer) => {
      if (!layer || !layer.clip) return;
      const v = layer.clip, img = huntVfxImage(v.src);
      if (!img.complete || !img.naturalWidth) return;
      const clipMs = hvLayerDuration(layer);
      const cells = Math.max(1, Number(v.frames) || 1);
      // owner 11/11: "thien bien van hoa" — moi lop co the chon kieu chuyen dong (motion) va cach nhan ban.
      const motion = layer.motion || (layer.fromSky ? "fall" : "");
      const cen = hvTeamCenter(targets, ox, oy);
      let tlist = targets.slice();
      if (layer.order === "nearBoss") tlist.sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x));
      else if (layer.order === "farBoss") tlist.sort((a, b) => Math.abs(b.x - unit.x) - Math.abs(a.x - unit.x));
      const count = Math.max(1, Number(layer.count) || 1);
      let reps;
      if (motion === "orbit" || motion === "line") reps = Array.from({ length: count }, (_, i) => ({ tg: null, i }));
      else if (layer.perTarget) reps = tlist.map((tg, i) => ({ tg, i }));
      else reps = [{ tg: null, i: 0 }];
      const travelMs = Math.max(1, Number(layer.travelMs) || Number(layer.fallMs) || 450);
      reps.forEach(({ tg, i }) => {
        if (layer.perTarget && motion !== "orbit" && motion !== "line" && !tg) return;
        const delay = (Number(layer.startMs) || 0) + (Number(layer.staggerMs) || 0) * i;
        const local = elapsed - delay;
        if (local < 0 || local > clipMs) return;
        const anchor = layer.anchor === "center" ? { x: cen.x, y: cen.y - 30 * depth } : hvAnchorPoint(layer.anchor, rect, unit, tg, depth, ox, oy);
        let px = anchor.x, py = anchor.y, rot = Number(layer.rotate) || 0;
        const k = Math.min(1, local / travelMs);
        if (motion === "fall") {
          const sky = hvAnchorPoint("sky", rect, unit, tg, depth, ox, oy);
          px = sky.x + (anchor.x - sky.x) * k;
          py = sky.y + (anchor.y - sky.y) * k * k;   // roi nhanh dan
        } else if (motion === "arc" || motion === "bounce") {
          // arc: bay vong cung tu mieng boss toi muc tieu. bounce: nay tu muc tieu truoc sang muc tieu nay.
          const prev = motion === "bounce" && i > 0 ? tlist[i - 1] : null;
          const sx = prev ? prev.x : ox, sy = prev ? prev.y - 40 * depth : oy;
          const lift = (Number(layer.arcH) || 220) * depth;
          px = sx + (anchor.x - sx) * k;
          py = sy + (anchor.y - sy) * k - Math.sin(Math.PI * k) * lift;
          if (layer.faceVel) { const dx = anchor.x - sx, dy = (anchor.y - sy) - Math.cos(Math.PI * k) * Math.PI * lift; rot += Math.atan2(dy, dx); }
        } else if (motion === "rise") {
          const riseH = (Number(layer.riseH) || 160) * depth;
          const e = 1 - Math.pow(1 - k, 3);
          py = anchor.y + riseH * (1 - e);
        } else if (motion === "sweep") {
          // quet ngang tu phia boss tran qua ca doi (mot ban sao chay dai)
          const dir = cen.x < unit.x ? -1 : 1;
          const span = (Number(layer.sweepW) || 520) * depth;
          px = unit.x + dir * 120 * depth + dir * (Math.abs(cen.x - unit.x) - 120 * depth + span / 2) * k;
          py = cen.y - 20 * depth;
        } else if (motion === "line") {
          // tro theo duong thang tu boss toi tam doi (da nut troi len)
          const t = (i + 1) / count;
          px = ox + (cen.x - ox) * t;
          py = unit.y + (cen.y - unit.y) * t - 10 * depth;
          const riseH = (Number(layer.riseH) || 90) * depth;
          py += riseH * (1 - (1 - Math.pow(1 - k, 3)));
        } else if (motion === "orbit") {
          // bay vong quanh tam doi roi don vao giua
          const R0 = (Number(layer.radius) || 230) * depth;
          const conv = Math.max(1, Number(layer.convergeMs) || travelMs);
          const ang = (Math.PI * 2 * i) / count + (local / 1000) * (Number(layer.spin) || 3.2);
          const r = R0 * Math.max(0, 1 - Math.max(0, local - conv * 0.45) / (conv * 0.55));
          px = cen.x + Math.cos(ang) * r;
          py = cen.y - 40 * depth + Math.sin(ang) * r * 0.42;
        } else if (motion === "burst") {
          // loe ra tu nhieu huong cheo quanh tung muc tieu, moi muc tieu mot goc
          const ang = (Number(layer.angle0) || -0.7) + i * 2.399;
          const D = (Number(layer.dist) || 260) * depth;
          const e = 1 - Math.pow(1 - k, 2);
          px = anchor.x + Math.cos(ang) * D * (1 - e);
          py = anchor.y + Math.sin(ang) * D * 0.6 * (1 - e);
          if (layer.faceVel) rot += ang + Math.PI;
        }
        const f = Math.max(0, Math.min(cells - 1, Math.floor(local / clipMs * cells)));
        const h = baseH * (Number(layer.scale) || 1);
        const w = h * v.cellW / v.cellH;
        const alpha = layer.alpha == null ? 1 : Number(layer.alpha);
        ctx.globalAlpha = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
        const flip = layer.flipAlt && (i % 2) ? -1 : 1;
        if (rot || flip < 0) {
          ctx.save(); ctx.translate(px, py); if (rot) ctx.rotate(rot); if (flip < 0) ctx.scale(-1, 1);
          ctx.drawImage(img, (f % v.cols) * v.cellW, Math.floor(f / v.cols) * v.cellH, v.cellW, v.cellH, -w / 2, -h / 2, w, h);
          ctx.restore();
        } else {
          ctx.drawImage(img, (f % v.cols) * v.cellW, Math.floor(f / v.cols) * v.cellH, v.cellW, v.cellH,
            px - w / 2, py - h / 2, w, h);
        }
      });
    });
    ctx.restore();
  }
  // Va cham (impact) bang clip frame tai tung muc tieu trung don (owner 11/11: bo hat/chop ve bang code).
  // Tuyet ky da co lop 'impact' rieng nen khong them lan nua.
  const hvImpacts = [];
  window.honVietHuntImpact = function (actor, target) {
    if (!actor || !target) return;
    if (String(actor.state) === "ultimate") return;
    const slug = bossSlug(actor);
    const spec = HUNT_VFX[slug] || {};
    const clip = spec.impactClip || HV_KHAOS_IMPACT;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    hvImpacts.push({ target, t: now, clip, scale: Number(spec.impactScale) || 0.62 });
    if (hvImpacts.length > 12) hvImpacts.shift();
  };
  function drawHuntImpacts(ctx) {
    if (!hvImpacts.length) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (let i = hvImpacts.length - 1; i >= 0; i--) {
      const it = hvImpacts[i], v = it.clip, img = huntVfxImage(v.src);
      const dur = Math.min(Number(v.durationMs) || 900, 900);
      const local = now - it.t;
      if (local > dur) { hvImpacts.splice(i, 1); continue; }
      if (!img.complete || !img.naturalWidth) continue;
      const cells = Math.max(1, Number(v.frames) || 1);
      const f = Math.max(0, Math.min(cells - 1, Math.floor(local / dur * cells)));
      const tg = it.target;
      const depth = 0.83 + ((tg.y || 520) - 290) / 1500;
      const h = 190 * it.scale * depth, w = h * v.cellW / v.cellH;
      ctx.globalAlpha = 1;
      ctx.drawImage(img, (f % v.cols) * v.cellW, Math.floor(f / v.cols) * v.cellH, v.cellW, v.cellH,
        tg.x - w / 2, (tg.y - 50 * depth) - h / 2, w, h);
    }
    ctx.restore();
  }
  function drawHuntVfxTargets(ctx, unit, units, target, aoe) {
    drawHuntImpacts(ctx);
    const st = unit && unit.__hvVfx;
    if (!st) return;
    const spec = HUNT_VFX[st.slug] && HUNT_VFX[st.slug][st.key];
    if (!spec) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (Array.isArray(spec.layers) && spec.layers.length) {
      drawHuntVfxLayers(ctx, unit, st, spec, huntVfxTargets(unit, units, target, st.key, aoe), now);
      return;
    }
    const v = spec.clip, img = huntVfxImage(v.src);
    if (!img.complete || !img.naturalWidth) return;
    const depth = 0.83 + ((unit.y || 520) - 290) / 1500;
    // mieng ran theo dang dung idle (khong theo o atlas atk vi o ATK keo dai ngang)
    const H = ((typeof innerWidth === "number" && innerWidth < 600) ? 200 : 270) * depth;
    const ox = unit.x + HUNT_MOUTH.dx * H, oy = unit.y + HUNT_MOUTH.dy * H;
    const targets = huntVfxTargets(unit, units, target, st.key, aoe);
    const vs = window.__HVBossStats || (window.__HVBossStats = { draws: 0, fails: 0 });
    vs.vfx = (vs.vfx || 0) + 1; vs.vfxTargets = targets.length; vs.vfxKey = st.key; vs.mouth = [Math.round(ox), Math.round(oy)]; vs.boss = [Math.round(unit.x), Math.round(unit.y), +depth.toFixed(3)]; vs.tg = targets.map(q => [Math.round(q.x), Math.round(q.y)]); try { const m = ctx.getTransform(); vs.tf = [m.a, m.d, m.e, m.f].map(n => +n.toFixed(2)); } catch (e) {}
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    targets.forEach((tg, i) => {
      const p = st.p - i * 0.03;                 // phun lan luot
      if (!(p > 0) || p >= 1) return;
      const f = Math.max(0, Math.min(v.frames - 1, Math.floor(p * v.frames)));
      const tx = tg.x, ty = tg.y - 70;
      if (HUNT_VFX[st.slug].mode === 'impact') {
        // trau huc: vu no va cham dat ngay tren tung tuong
        const h2 = 190 * spec.scale * (0.83 + (ty - 290) / 1500), w2 = h2 * v.cellW / v.cellH;
        ctx.drawImage(img, (f % v.cols) * v.cellW, Math.floor(f / v.cols) * v.cellH, v.cellW, v.cellH, tx - w2 / 2, ty - h2 / 2, w2, h2);
        return;
      }
      const dx = tx - ox, dy = ty - oy, len = Math.hypot(dx, dy);
      if (len < 10) return;
      // clip phun tu PHAI sang TRAI: dau phun (mep phai) dat tai mieng, keo dai toi muc tieu
      const w = len * 1.08, h = Math.min(w * v.cellH / v.cellW, 150) * spec.scale;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(Math.atan2(dy, dx) - Math.PI);
      ctx.drawImage(img, (f % v.cols) * v.cellW, Math.floor(f / v.cols) * v.cellH, v.cellW, v.cellH, -w, -h / 2, w, h);
      ctx.restore();
    });
    ctx.restore();
  }

  // Tat VFX ve bang code cua engine cho boss da co VFX clip (goi tu battle.html).
  // Chi boss co clip (khong phai tuong phe ta): bossSlug() co fallback nen phai loc theo form truoc.
  window.honVietHuntSkipFx = function (actor) {
    if (!actor) return false;
    const form = inferHuntForm(actor);
    if (!form || form === "crystal") return false;
    return !!HUNT_VFX[bossSlug(actor)];
  };

  function drawHuntAnim(ctx, unit, time, form) {
    const slug = bossSlug(unit);
    const spec = slug ? HUNT_ANIM[slug] : null;
    if (!spec) return false;
    const now = typeof performance !== "undefined" ? performance.now() : time;
    const stats = window.__HVBossStats || (window.__HVBossStats = { draws: 0, fails: 0 });
    stats.lastForm = form;
    stats.lastState = String(unit.state || "idle");
    let pick = huntAnimClip(unit, now);
    let c = spec.clips[pick.key], img = huntAnimImages[slug][pick.key];
    if (!c || !img || !img.complete || !img.naturalWidth) {
      pick = { key: "idle", t: now, loop: true };
      c = spec.clips.idle; img = huntAnimImages[slug].idle;
      if (!img || !img.complete || !img.naturalWidth) { stats.fails += 1; return false; }
    }
    // Owner 10/11: sau don danh/hurt, engine giu unit.state = 'hurt'/'attack' (khong
    // reset ve idle cho boss khong co atlas rieng) nen truoc day boss dung im o khung
    // cuoi cua clip khong-loop. Het clip (hoac het cua so state) thi tu ve idle.
    if (!pick.loop && !pick.hold) {
      const clipMs = Math.max(1, Number(c.durationMs) || 1);
      const waitMs = Math.max(clipMs, Number(pick.span) || 0);
      if (Number(pick.ms) >= waitMs) {
        pick = { key: 'idle', t: now, loop: true };
        c = spec.clips.idle; img = huntAnimImages[slug].idle;
        if (!c || !img || !img.complete || !img.naturalWidth) { stats.fails += 1; return false; }
      }
    }
    let frame;
    if (pick.loop) frame = Math.floor((pick.t % c.durationMs) / c.durationMs * c.frames);
    else if (pick.hold) frame = Math.min(c.frames - 1, Math.floor(pick.t / c.durationMs * c.frames));
    else frame = Math.floor(pick.p * c.frames);
    frame = Math.max(0, Math.min(c.frames - 1, frame));
    const mobile = typeof innerWidth === "number" && innerWidth < 600;
    const targetH = mobile ? 200 : 270;
    const scale = targetH / c.cellH;
    ctx.save();
    ctx.scale(scale, scale);
    const mirrored = HUNT_ANIM_MIRROR.indexOf(slug) >= 0;
    if (mirrored) ctx.scale(-1, 1);
    stats.draws += 1;
    stats.lastKey = pick.key;
    ctx.drawImage(img, (frame % c.cols) * c.cellW, Math.floor(frame / c.cols) * c.cellH, c.cellW, c.cellH, -c.pivot, -c.foot, c.cellW, c.cellH);
    const prevVfx = unit.__hvVfx;
    // VFX nhiều lớp có thể dài hơn clip animation của boss: giữ trạng thái VFX
    // (để các lớp rơi/vụ nổ cuối vẫn vẽ) cho tới khi hết tổng thời lượng.
    const prevSpec = prevVfx ? (HUNT_VFX[prevVfx.slug] || {})[prevVfx.key] : null;
    const prevTotal = prevVfx
      ? (Number(prevVfx.totalMs) || (prevSpec && Array.isArray(prevSpec.layers) ? hvLayerTotal(prevSpec, 6) : 0))
      : 0;
    const keepVfx = !!(prevVfx && prevSpec && Array.isArray(prevSpec.layers)
      && Number(prevVfx.started) > 0
      && (now - Number(prevVfx.started)) < prevTotal + 150);
    unit.__hvVfx = pick.loop ? (keepVfx ? prevVfx : null) : { slug, key: pick.key,
      started: Number(pick.started) || now, span: Number(pick.span) || 0,
      p: Math.max(0, Math.min(1, pick.hold ? pick.t / c.durationMs : pick.p)),
      // mieng ran: phia trai-tren cua o (boss quay trai), toa do tuong doi chan
      mx: (mirrored ? (c.pivot - c.cellW * HUNT_MOUTH.x) : (-c.pivot + c.cellW * HUNT_MOUTH.x)) * scale, my: (-c.foot + c.cellH * HUNT_MOUTH.y) * scale };
    ctx.restore();
    return true;
  }

  function honVietDrawHuntUnit(context, unit, time, hooks) {
    const form = inferHuntForm(unit);
    if (!form) return false;
    if (!unit.huntForm) unit.huntForm = form;
    const alive = (unit.hp || 0) > 0;
    const depthScale = 0.83 + ((unit.y || 520) - 290) / 1500;
    const shadowW = form === "crystal" ? 22 : 62;
    context.save();
    const hasAnim = !!HUNT_ANIM[bossSlug(unit)];
    context.globalAlpha = (alive || hasAnim) ? 1 : 0.35;
    context.fillStyle = "rgba(0,0,0,.38)";
    context.beginPath();
    context.ellipse(unit.x, unit.y + 8, shadowW * depthScale, (form === "crystal" ? 9 : 18) * depthScale, 0, 0, Math.PI * 2);
    context.fill();
    context.translate(unit.x, unit.y);
    // Atlas animation của boss đã vẽ sẵn quay mặt sang trái (hướng về đội hình
    // người chơi) nên KHÔNG lật nữa; chỉ lật ảnh tĩnh legacy (owner 09/11).
    if (unit.team === "enemy" && !hasAnim) context.scale(-1, 1);
    context.scale(depthScale, depthScale);
    if (!drawHuntAnim(context, unit, time, form) && !drawHuntArt(context, unit, time, form)) {
      const scale = ((typeof innerWidth === "number" && innerWidth < 600) ? 0.64 : 0.86) * huntScaleFor(unit, form);
      context.scale(scale, scale);
      drawHuntFallback(context, unit, time, form);
    }
    context.restore();
    drawHuntVfxTargets(context, unit, hooks && hooks.units, (hooks && hooks.target) || unit.actionTarget || null, !!(hooks && hooks.aoe));
    if (form !== "crystal") {
      context.save();
      context.globalAlpha = alive ? 0.95 : 0.4;
      context.fillStyle = "#f6e6c0";
      context.strokeStyle = "rgba(16, 10, 6, .65)";
      context.lineWidth = 3;
      context.font = "800 13px 'Be Vietnam Pro', system-ui, sans-serif";
      context.textAlign = "center";
      context.strokeText(unit.name || "Boss Mộng", unit.x, unit.y + 28);
      context.fillText(unit.name || "Boss Mộng", unit.x, unit.y + 28);
      context.restore();
    }
    if (hooks && typeof hooks.drawHud === "function") {
      hooks.drawHud(context, unit, time, alive ? 1 : 0.35);
    }
    return true;
  }

  window.honVietInferHuntForm = inferHuntForm;
  window.honVietDrawHuntUnit = honVietDrawHuntUnit;
  window.honVietHuntVisual = Object.freeze({
    version: 4,
    animated: Object.freeze(Object.keys(HUNT_ANIM)),
    forms: Object.freeze(["crystal", "ca_voi_nuot_trang", "nhen_det_ac_mong", "dong_ho_cat_vo"]),
    art: HUNT_ART
  });
})();
