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

  function honVietDrawHuntUnit(context, unit, time, hooks) {
    const form = inferHuntForm(unit);
    if (!form) return false;
    if (!unit.huntForm) unit.huntForm = form;
    const alive = (unit.hp || 0) > 0;
    const depthScale = 0.83 + ((unit.y || 520) - 290) / 1500;
    const shadowW = form === "crystal" ? 22 : 62;
    context.save();
    context.globalAlpha = alive ? 1 : 0.35;
    context.fillStyle = "rgba(0,0,0,.38)";
    context.beginPath();
    context.ellipse(unit.x, unit.y + 8, shadowW * depthScale, (form === "crystal" ? 9 : 18) * depthScale, 0, 0, Math.PI * 2);
    context.fill();
    context.translate(unit.x, unit.y);
    if (unit.team === "enemy") context.scale(-1, 1);
    context.scale(depthScale, depthScale);
    if (!drawHuntArt(context, unit, time, form)) {
      const scale = ((typeof innerWidth === "number" && innerWidth < 600) ? 0.64 : 0.86) * huntScaleFor(unit, form);
      context.scale(scale, scale);
      drawHuntFallback(context, unit, time, form);
    }
    context.restore();
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
    version: 3,
    forms: Object.freeze(["crystal", "ca_voi_nuot_trang", "nhen_det_ac_mong", "dong_ho_cat_vo"]),
    art: HUNT_ART
  });
})();
