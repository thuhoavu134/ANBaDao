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
  const HUNT_ANIM = Object.freeze({ "thiet-giap-nguu": {"schema": "hunt-boss-anim/v1", "slug": "thiet-giap-nguu", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/thiet-giap-nguu/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 195, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/thiet-giap-nguu/atk.webp", "frames": 18, "cols": 6, "cellW": 392, "cellH": 220, "pivot": 196, "foot": 197, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/thiet-giap-nguu/ultimate.webp", "frames": 18, "cols": 6, "cellW": 296, "cellH": 220, "pivot": 148, "foot": 197, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/thiet-giap-nguu/hit.webp", "frames": 18, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 195, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/thiet-giap-nguu/fall-die.webp", "frames": 18, "cols": 6, "cellW": 312, "cellH": 220, "pivot": 156, "foot": 216, "durationMs": 1600, "loop": false}}}, "hac-xa": {"schema": "hunt-boss-anim/v1", "slug": "hac-xa", "form": "ca_voi_nuot_trang", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager (uniform framing)", "clips": {"idle": {"src": "assets/hunt/hac-xa/idle.webp", "frames": 30, "cols": 6, "cellW": 240, "cellH": 220, "pivot": 120, "foot": 208, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/hac-xa/atk.webp", "frames": 18, "cols": 6, "cellW": 648, "cellH": 220, "pivot": 324, "foot": 207, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/hac-xa/ultimate.webp", "frames": 18, "cols": 6, "cellW": 400, "cellH": 220, "pivot": 200, "foot": 207, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/hac-xa/hit.webp", "frames": 18, "cols": 6, "cellW": 272, "cellH": 220, "pivot": 136, "foot": 207, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/hac-xa/fall-die.webp", "frames": 18, "cols": 6, "cellW": 264, "cellH": 220, "pivot": 132, "foot": 216, "durationMs": 1600, "loop": false}}}, 'bach-ho': {"schema": "hunt-boss-anim/v1", "source": "Google Flow Omni 1.2 Flash + kiemthe-animation-packager uniform", "clips": {"idle": {"src": "assets/hunt/bach-ho/idle.webp", "frames": 30, "cols": 6, "cellW": 456, "cellH": 220, "pivot": 228, "foot": 217, "durationMs": 3042, "loop": true}, "atk": {"src": "assets/hunt/bach-ho/atk.webp", "frames": 18, "cols": 6, "cellW": 592, "cellH": 220, "pivot": 296, "foot": 217, "durationMs": 1500, "loop": false}, "ultimate": {"src": "assets/hunt/bach-ho/ultimate.webp", "frames": 18, "cols": 6, "cellW": 504, "cellH": 220, "pivot": 252, "foot": 217, "durationMs": 2600, "loop": false}, "hit": {"src": "assets/hunt/bach-ho/hit.webp", "frames": 18, "cols": 6, "cellW": 424, "cellH": 220, "pivot": 212, "foot": 217, "durationMs": 700, "loop": false}, "fall-die": {"src": "assets/hunt/bach-ho/fall-die.webp", "frames": 18, "cols": 6, "cellW": 464, "cellH": 220, "pivot": 232, "foot": 217, "durationMs": 1600, "loop": false}}} });
  // Mỗi boss Săn Boss có bộ animation riêng. Boss nhận theo tên hiển thị
  // (tên do lớp lore đặt); boss chưa có atlas thì rơi về ảnh tĩnh.
  const BOSS_SLUGS = [
    [/Bạch Hổ/i, 'bach-ho'],
    [/Hắc Xà/i, 'hac-xa'],
    [/Thiết Giáp/i, 'thiet-giap-nguu']
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
    return { key, p: Math.min(0.999, Math.max(0, (now - started) / span)) };
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
  const HUNT_VFX = Object.freeze({ 'hac-xa': { atk: { clip: {"src": "assets/hunt/hac-xa/vfx-spray.webp", "frames": 18, "cols": 6, "cellW": 463, "cellH": 260, "durationMs": 3920, "cx": 0.5, "cy": 0.5}, scale: 1.0 }, ultimate: { clip: {"src": "assets/hunt/hac-xa/vfx-spray.webp", "frames": 18, "cols": 6, "cellW": 463, "cellH": 260, "durationMs": 3920, "cx": 0.5, "cy": 0.5}, scale: 1.4 } } , 'thiet-giap-nguu': { mode: 'impact', atk: { clip: {"src": "assets/hunt/thiet-giap-nguu/vfx-atk.webp", "frames": 18, "cols": 6, "cellW": 459, "cellH": 260, "durationMs": 3920, "cx": 0.493, "cy": 0.495}, scale: 1.0 }, ultimate: { clip: {"src": "assets/hunt/thiet-giap-nguu/vfx-ulti.webp", "frames": 18, "cols": 6, "cellW": 454, "cellH": 260, "durationMs": 3920, "cx": 0.492, "cy": 0.5}, scale: 1.35 } } });
  const huntVfxImages = {};
  function huntVfxImage(src) {
    if (!huntVfxImages[src]) { const im = new Image(); im.decoding = 'async'; im.src = src; huntVfxImages[src] = im; }
    return huntVfxImages[src];
  }
  // Noc phun toi 6 vi tri doi hinh nguoi choi (owner 10/11), ve bang clip Flow.
  function huntVfxTargets(boss, units) {
    const list = (Array.isArray(units) ? units : []).filter(u => u && u !== boss && u.team !== boss.team && (u.hp || 0) > 0 && Number.isFinite(u.x) && Number.isFinite(u.y));
    return list.slice(0, 6);
  }
  // Vi tri mieng ran trong o atlas (ti le 0..1). Chinh o day neu lech.
  const HUNT_MOUTH = { x: 0.14, y: 0.30, dx: -0.12, dy: -0.72 };
  function drawHuntVfxTargets(ctx, unit, units) {
    const st = unit && unit.__hvVfx;
    if (!st) return;
    const spec = HUNT_VFX[st.slug] && HUNT_VFX[st.slug][st.key];
    if (!spec) return;
    const v = spec.clip, img = huntVfxImage(v.src);
    if (!img.complete || !img.naturalWidth) return;
    const depth = 0.83 + ((unit.y || 520) - 290) / 1500;
    // mieng ran theo dang dung idle (khong theo o atlas atk vi o ATK keo dai ngang)
    const H = ((typeof innerWidth === "number" && innerWidth < 600) ? 200 : 270) * depth;
    const ox = unit.x + HUNT_MOUTH.dx * H, oy = unit.y + HUNT_MOUTH.dy * H;
    const targets = huntVfxTargets(unit, units);
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
  window.honVietHuntSkipFx = function (actor) { return !!(actor && HUNT_VFX[bossSlug(actor)]); };

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
    stats.draws += 1;
    stats.lastKey = pick.key;
    ctx.drawImage(img, (frame % c.cols) * c.cellW, Math.floor(frame / c.cols) * c.cellH, c.cellW, c.cellH, -c.pivot, -c.foot, c.cellW, c.cellH);
    unit.__hvVfx = pick.loop ? null : { slug, key: pick.key, p: Math.max(0, Math.min(1, pick.hold ? pick.t / c.durationMs : pick.p)),
      // mieng ran: phia trai-tren cua o (boss quay trai), toa do tuong doi chan
      mx: (-c.pivot + c.cellW * HUNT_MOUTH.x) * scale, my: (-c.foot + c.cellH * HUNT_MOUTH.y) * scale };
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
    drawHuntVfxTargets(context, unit, hooks && hooks.units);
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
