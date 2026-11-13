function hvForgeAsset(item) {
  return globalThis.honVietEquipmentAssetFor?.(item) || 'assets/ui/menu-v3233/icons/forge.png';
}

function hvForgeMaterial(id) {
  return globalThis.honVietForgeMaterialAssetFor?.(id) || 'assets/ui/menu-v3233/icons/forge.png';
}

function hvForgeMaterialChip(id, value) {
  const label = id === 'tinh' ? 'Tinh Lực' : id === 'hoat' ? 'Hoạt Lực' : 'Vàng';
  return `<span class="econ-chip" title="${label}"><img class="forge-material-art" src="${hvForgeMaterial(id)}" alt="${label}"><b>${value}</b></span>`;
}

function hvForgeCost(id, value) {
  const label = id === 'tinh' ? 'Tinh Lực' : id === 'hoat' ? 'Hoạt Lực' : 'Vàng';
  return `<span class="forge-cost"><img class="forge-material-art" src="${hvForgeMaterial(id)}" alt="${label}">${value}</span>`;
}

function hvForgeItemVisual(item, className = 'forge-item-art', tier = '') {
  const alt = typeof itemName === 'function' ? itemName(item) : 'Trang bị';
  const glow = tier || (typeof enhGlowTier === 'function' ? enhGlowTier(item && item.lvl, item && item.rar) : '');
  const cls = 'hv-item-slot' + (glow ? ' hv-glow-' + glow : '');
  return `<span class="${cls}"${glow ? ` data-glow="${glow}"` : ''}><img class="${className}" src="${hvForgeAsset(item)}" alt="${esc(alt)}" loading="lazy"></span>`;
}

function hvForgeReveal(item, kind = 'craft') {
  if (!item) return;
  ST.forgeRevealItem = { uid: item.uid, slot: item.slot, rar: item.rar, lvl: item.lvl, mold: item.mold, kind };
  if (ST.forgeRevealAudioUid !== item.uid) {
    ST.forgeRevealAudioUid = item.uid;
    const sfx = window.HonVietSfx;
    const fire = () => sfx?.play('forge-reveal', { group: 'ui' });
    if (sfx && typeof sfx.unlock === 'function') {
      Promise.resolve(sfx.unlock()).then(ready => { if (ready !== false) fire(); });
    } else fire();
  }
}

const hvCraftItemWithReveal = craftItem;
craftItem = function craftItemWithReveal(slot, commandId) {
  const item = hvCraftItemWithReveal(slot, commandId);
  if (item) hvForgeReveal(item, 'craft');
  return item;
};

const hvChooseDualForgeWithReveal = chooseDualForge;
chooseDualForge = function chooseDualForgeWithReveal(index, commandId, pendingId) {
  const before = P.inventory.length;
  const ok = hvChooseDualForgeWithReveal(index, commandId, pendingId);
  if (ok && P.inventory.length > before) hvForgeReveal(P.inventory[P.inventory.length - 1], 'dual');
  return ok;
};

// Owner 2026-10-25: Kiếm Thế enhancement glow tiers, scaled from its star ladder (9-12 purple, 13-16 orange,
// 17-20 yellow) onto our +0..+15 ceiling: +9..+11 tím, +12..+13 vàng kim, +14..+15 đỏ rực.
// Owner 2026-10-25: màu cường hoá không được đè lên phẩm đã có màu sẵn.
// Bậc màu: phẩm chưa màu 0 < tím 1 < vàng kim 2 < đỏ 3. Phẩm: b/a không màu, s tím, ss vàng kim, ssr đỏ.
// Chỉ hiện màu cường hoá khi bậc của nó >= bậc màu sẵn của phẩm, nên ss không bị tím/vàng đè, ssr chỉ có đỏ.
const HV_GLOW_RANK = { '': 0, purple: 1, gold: 2, red: 3 };
const HV_RAR_RANK = { b: 0, a: 0, s: 1, ss: 2, ssr: 3 };
function enhGlowTier(lvl, rar) {
  const n = Number(lvl) || 0;
  const byLevel = n >= 14 ? 'red' : n >= 12 ? 'gold' : n >= 9 ? 'purple' : '';
  if (!byLevel) return '';
  const rarRank = HV_RAR_RANK[String(rar || '').toLowerCase()] ?? 0;
  return HV_GLOW_RANK[byLevel] >= rarRank ? byLevel : '';
}
// Owner 2026-10-25: dòng phụ của trang bị. Dòng đặc biệt (chỉ đồ săn boss) in màu đỏ-cam.
function hvAffixLinesHtml(item) {
  if (typeof affixLines !== 'function') return '';
  const lines = affixLines(item);
  if (!lines.length) return '';
  return '<div class="hv-affix-list">' + lines.map(line =>
    '<span class="hv-affix' + (line.special ? ' is-special' : '') + '">' + line.text + '</span>'
  ).join('') + '</div>';
}
// Trần cường hoá theo phẩm (nguồn sự thật ở src/domain/equipment/forge-commands.mjs, hàm được nhúng vào trang).
function gearMaxLvl(item) {
  const rar = String((item && item.rar) || '').toLowerCase();
  if (typeof forgeMaxLevel === 'function') return forgeMaxLevel(rar);
  return ({ b: 10, a: 10, s: 12, ss: 15, ssr: 15 })[rar] || 15;
}

// Owner 2026-10-25: enhanced item cells - clear glass in the middle, a metallic tier-coloured fire burning inside the
// rim, coloured motes and bright embers rising like sparks, plus li-ti specks that now and then flash.
// Owner: "hạt chỉ được phép di chuyển trong phạm vi ô đồ, không được cháy ra ngoài" - everything is clipped to the
// inside of the cell; nothing is drawn past its border. One shared rAF for every glowing cell on screen.
const HV_ENH_FX = (() => {
  const PAL = {
    purple: { rim: [178, 96, 255], hot: [246, 214, 255], mote: [205, 140, 255], rate: 46, specks: 16 },
    gold:   { rim: [255, 196, 40], hot: [255, 248, 196], mote: [255, 224, 110], rate: 56, specks: 20 },
    red:    { rim: [255, 84, 22],  hot: [255, 222, 120], mote: [255, 146, 52],  rate: 72, specks: 24 },
  };
  const cells = new Set();
  let raf = 0, last = 0, manual = false, clock = 0;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // Any element carrying data-glow="purple|gold|red" gets the effect (forge item icons AND the Trợ trận gear board).
  // Re-run after every render: a cell whose tier changed is updated, a cell that lost its tier is cleaned up.
  function attach(root) {
    if (!root) return;
    if (!manual && typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('[data-glow], .hv-fx-host').forEach(el => {
      const tier = el.dataset.glow || '';
      if (el.__hvFx) {
        if (!PAL[tier]) { el.__hvFx.c.remove(); delete el.__hvFx; el.classList.remove('hv-fx-host'); cells.delete(el); return; }
        if (el.__hvFx.tier !== tier) { el.__hvFx.tier = tier; el.__hvFx.parts = []; el.__hvFx.specks = []; }
        return;
      }
      if (!PAL[tier]) return;
      const c = document.createElement('canvas');
      c.className = 'hv-fx';
      el.appendChild(c);
      el.classList.add('hv-fx-host');
      el.__hvFx = { c, tier, parts: [], specks: [], acc: 0, sacc: 0, seed: Math.random() * 1000 };
      cells.add(el);
    });
    if (cells.size && !raf && !manual) { last = 0; raf = requestAnimationFrame(loop); }
  }

  function loop(ts) {
    raf = 0;
    if (manual) return;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
    last = ts;
    const vh = innerHeight;
    for (const el of cells) {
      if (!el.isConnected) { cells.delete(el); continue; }
      const r = el.getBoundingClientRect();
      if (r.width < 12 || r.height < 12) continue;            // hidden screen (display:none) - no layout to draw into
      if (r.bottom < -40 || r.top > vh + 40) continue;        // off screen: keep state, skip drawing
      draw(el, ts / 1000, dt);
    }
    if (cells.size) raf = requestAnimationFrame(loop);
  }

  // Deterministic stepping (QA / video capture): advance every cell by dt seconds regardless of frame rate.
  function step(dt) {
    manual = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    clock += dt;
    for (const el of cells) if (el.isConnected) draw(el, clock, dt);
  }

  function draw(el, t, dt) {
    const fx = el.__hvFx, pal = PAL[fx.tier];
    const w = el.offsetWidth, h = el.offsetHeight;
    if (w < 12 || h < 12) return;                              // guard: radii below would go negative
    const dpr = Math.min(2, (window.devicePixelRatio) || 1);
    const c = fx.c;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      c.style.width = w + 'px'; c.style.height = h + 'px';
    }
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    // inside of the 2px border, rounded like the cell
    const b = 2, x0 = b, y0 = b, x1 = w - b, y1 = h - b, iw = x1 - x0, ih = y1 - y0, rad = Math.max(1, Math.min(6, iw / 4, ih / 4));
    g.save();
    g.beginPath();
    g.moveTo(x0 + rad, y0); g.arcTo(x1, y0, x1, y1, rad); g.arcTo(x1, y1, x0, y1, rad);
    g.arcTo(x0, y1, x0, y0, rad); g.arcTo(x0, y0, x1, y0, rad); g.closePath();
    g.clip();
    g.globalCompositeOperation = 'lighter';

    // 1) metallic fire along the inside of the rim, strongest at the bottom
    const flick = s => 0.55 + 0.45 * Math.sin(t * 7.3 + s) * Math.sin(t * 3.1 + s * 1.7);
    const edge = (gx0, gy0, gx1, gy1, a) => {
      const gr = g.createLinearGradient(gx0, gy0, gx1, gy1);
      gr.addColorStop(0, rgba(pal.hot, a));
      gr.addColorStop(0.35, rgba(pal.rim, a * 0.7));
      gr.addColorStop(1, rgba(pal.rim, 0));
      return gr;
    };
    const band = Math.max(7, iw * 0.19);
    g.fillStyle = edge(0, y1, 0, y1 - band * 1.6, 0.58 * flick(fx.seed)); g.fillRect(x0, y1 - band * 1.6, iw, band * 1.6);
    g.fillStyle = edge(x0, 0, x0 + band, 0, 0.34 * flick(fx.seed + 2)); g.fillRect(x0, y0, band, ih);
    g.fillStyle = edge(x1, 0, x1 - band, 0, 0.34 * flick(fx.seed + 4)); g.fillRect(x1 - band, y0, band, ih);
    g.fillStyle = edge(0, y0, 0, y0 + band, 0.22 * flick(fx.seed + 6)); g.fillRect(x0, y0, iw, band);

    // 2) flame tongues licking up from the bottom rim - inside the cell only
    const tongues = 5;
    for (let i = 0; i < tongues; i++) {
      const fxp = x0 + (i + 0.5) * (iw / tongues) + Math.sin(t * 2.3 + i * 1.9 + fx.seed) * 3;
      const fh = ih * (0.2 + 0.15 * (0.5 + 0.5 * Math.sin(t * 5.1 + i * 2.7 + fx.seed)));
      const rg = g.createRadialGradient(fxp, y1, 0, fxp, y1, Math.max(0.5, fh));
      rg.addColorStop(0, rgba(pal.hot, 0.5));
      rg.addColorStop(0.4, rgba(pal.rim, 0.3));
      rg.addColorStop(1, rgba(pal.rim, 0));
      g.fillStyle = rg;
      g.beginPath(); g.ellipse(fxp, y1, Math.max(0.5, iw / tongues * 0.75), Math.max(0.5, fh), 0, Math.PI, 0); g.fill();
    }

    // 3) motes + embers: born inside, rise and sway, die before the top border - never leave the cell
    fx.acc += pal.rate * dt;
    while (fx.acc >= 1) {
      fx.acc -= 1;
      const ember = Math.random() < 0.38;
      fx.parts.push({ x: x0 + 3 + Math.random() * (iw - 6), y: y1 - 2 - Math.random() * ih * 0.4,
        vx: (Math.random() - 0.5) * 6, vy: -(14 + Math.random() * 22) * (ember ? 1.3 : 1),
        life: 0, max: 0.8 + Math.random() * 0.9, r: ember ? 0.8 + Math.random() * 0.9 : 1.1 + Math.random() * 1.4, ember, ph: Math.random() * 6 });
    }
    const keep = [];
    for (const q of fx.parts) {
      q.life += dt;
      q.x += (q.vx + Math.sin(t * 4 + q.ph) * 5) * dt;
      q.y += q.vy * dt;
      if (q.life >= q.max || q.y < y0 + 2 || q.x < x0 + 1 || q.x > x1 - 1) continue;
      const k = q.life / q.max, nearTop = Math.min(1, (q.y - y0) / (ih * 0.25));
      const a = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * (q.ember ? 1 : 0.75) * nearTop;
      const col = q.ember ? pal.hot : pal.mote;
      const rr = q.r * (q.ember ? 2.6 : 2.2);
      const rg = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, rr);
      rg.addColorStop(0, rgba(col, a));
      rg.addColorStop(0.45, rgba(q.ember ? pal.mote : pal.rim, a * 0.55));
      rg.addColorStop(1, rgba(pal.rim, 0));
      g.fillStyle = rg;
      g.beginPath(); g.arc(q.x, q.y, rr, 0, Math.PI * 2); g.fill();
      keep.push(q);
    }
    fx.parts = keep.length > 110 ? keep.slice(-110) : keep;

    // 4) li-ti specks: tiny points scattered through the glass, mostly faint, now and then one FLASHES
    //    (a bright core with a short four-point glint) and fades again.
    fx.sacc += pal.specks * dt;
    while (fx.sacc >= 1) {
      fx.sacc -= 1;
      fx.specks.push({ x: x0 + 3 + Math.random() * (iw - 6), y: y0 + 3 + Math.random() * (ih - 6),
        life: 0, max: 0.7 + Math.random() * 1.1, flash: Math.random() < 0.3, at: 0.25 + Math.random() * 0.45,
        vy: -(2 + Math.random() * 5), r: 0.35 + Math.random() * 0.45 });
    }
    const sk = [];
    for (const s of fx.specks) {
      s.life += dt;
      if (s.life >= s.max) continue;
      s.y += s.vy * dt;
      if (s.y < y0 + 2) continue;
      const k = s.life / s.max;
      let a = 0.28 * Math.sin(Math.PI * k);
      let glint = 0;
      if (s.flash) { const d = Math.abs(k - s.at); if (d < 0.12) { glint = 1 - d / 0.12; a = Math.max(a, glint); } }
      g.fillStyle = rgba(pal.hot, a);
      g.beginPath(); g.arc(s.x, s.y, s.r + glint * 0.9, 0, Math.PI * 2); g.fill();
      if (glint > 0.05) {
        const L = 2.5 + glint * 4;
        g.strokeStyle = rgba(pal.hot, glint * 0.9);
        g.lineWidth = 0.6;
        g.beginPath(); g.moveTo(s.x - L, s.y); g.lineTo(s.x + L, s.y); g.moveTo(s.x, s.y - L); g.lineTo(s.x, s.y + L); g.stroke();
      }
      sk.push(s);
    }
    fx.specks = sk.length > 60 ? sk.slice(-60) : sk;

    g.restore();
    g.globalCompositeOperation = 'source-over';
  }

  return { attach, step };
})();
window.HV_ENH_FX = HV_ENH_FX;

const hvEnhanceItemWithReveal = enhanceItem;
enhanceItem = function enhanceItemWithReveal(uid, commandId) {
  const ok = hvEnhanceItemWithReveal(uid, commandId);
  if (ok) hvForgeReveal(P.inventory.find(item => item.uid === uid), 'enhance');
  return ok;
};

function renderForge(){ const b=document.getElementById('forgeBody');
  const inv=P.inventory.slice().sort((x,y)=>(RAR_ORDER[x.rar]-RAR_ORDER[y.rar])||x.slot.localeCompare(y.slot)||(y.lvl-x.lvl)); let pickBar='';
  if(ST.equipPick){const it=P.inventory.find(i=>i.uid===ST.equipPick); if(!it)ST.equipPick=null; else {const btns=P.squad.map(s=>`<button class="btn sm eqto" data-h="${s.id}">${DATA.heroes[s.id].name}</button>`).join(''); pickBar=`<div class="econ-panel full" style="border-color:#f2c14e"><div class="forge-pick-row">${hvForgeItemVisual(it,'forge-item-art forge-pick-art')}<div class="forge-pick-copy"><h3>Mặc “${itemName(it)}” cho ai?</h3><div class="econ-muted">${DATA.items.slotName[it.slot]} · +${itemStat(it)} ${DATA.items.statName[it.slot]}</div></div></div><div class="econ-actions">${btns}<button class="btn ghost sm" id="eqCancel">Huỷ</button></div></div>`;}}
  const reveal=ST.forgeRevealItem; const revealBar=reveal?`<div class="econ-panel full forge-item-reveal" data-forge-reveal="${reveal.uid}">${hvForgeItemVisual(reveal,'forge-reveal-art')}<div class="forge-reveal-copy"><strong>Đã ghi sổ sau khi lưu</strong><h3>${itemName(reveal)} <small>· ${reveal.rar.toUpperCase()}</small></h3><p>${DATA.items.slotName[reveal.slot]} · ${itemStat(reveal)} ${DATA.items.statName[reveal.slot]} · ${FORGE_MOLDS[reveal.mold]?.name||'Khuôn đã chọn'}</p></div><button class="btn ghost sm forge-reveal-dismiss" id="forgeRevealDismiss">Tiếp tục</button></div>`:'';
  const pending=econ().forgePending; const pendingBar=pending?`<div class="econ-panel full forge-pending"><h3>🔥 Song Rèn · chọn 1, bỏ 1</h3><div class="econ-muted">Hai phôi đã tiêu thụ nguyên liệu. Chọn món phù hợp build; lựa chọn còn lại bị tôi hỏng.</div><div class="forge-candidates">${pending.candidates.map((it,i)=>`<button class="btn forge-candidate dualpick" data-i="${i}" data-forge-item="${it.slot}-${it.rar}">${hvForgeItemVisual(it,'forge-item-art')}<b style="color:${rarCol(it.rar)}">${it.rar.toUpperCase()} · ${itemName(it)}</b><small>+${itemStat(it)} ${DATA.items.statName[it.slot]} · ${FORGE_MOLDS[it.mold].name}</small></button>`).join('')}</div></div>`:'';
  // Owner 2026-10-25: Kiếm Thế enhancement glow - +9..+11 tím, +12..+13 vàng kim, +14..+15 đỏ rực.
  const cards=inv.map(it=>{const eb=equippedBy(it.uid),m=FORGE_MOLDS[it.mold]||FORGE_MOLDS.strike,cls='econ-item t-'+it.rar;return `<div class="${cls}" data-forge-item="${it.slot}-${it.rar}"><div class="forge-card-head">${hvForgeItemVisual(it)}<div class="forge-card-copy"><div class="nm"><span class="rar" style="background:${rarCol(it.rar)}">${it.rar.toUpperCase()}</span>${itemName(it)}</div><div class="meta">${DATA.items.slotName[it.slot]} · +${it.lvl} · +${itemStat(it)} ${DATA.items.statName[it.slot]}</div>${hvAffixLinesHtml(it)}<div class="meta">${m.icon} ${m.name} · ${eb?('Đang mặc: '+DATA.heroes[eb].name):'Trong kho'}</div></div></div><div class="econ-actions"><button class="btn sm enh" data-u="${it.uid}" ${it.lvl>=gearMaxLvl(it)?'disabled':''}>${it.lvl>=gearMaxLvl(it)?'+'+gearMaxLvl(it)+' MAX':('Cường hoá · '+hvForgeCost('gold',enhCost(it).gold)+' + '+hvForgeCost('hoat',enhCost(it).hoat))}</button><button class="btn ghost sm eqp" data-u="${it.uid}">Trang bị</button>${eb?`<button class="btn ghost sm uneqp" data-u="${it.uid}" data-h="${eb}">Tháo</button>`:""}<button class="btn ghost sm itemlock" data-u="${it.uid}" data-locked="${isForgeItemLocked(it)}">${isForgeItemLocked(it)?"Mở khóa":"Khóa đồ"}</button><button class="btn ghost sm salv" data-u="${it.uid}" ${eb||isForgeItemLocked(it)?'disabled':''}>Phân giải</button></div></div>`;}).join('');
  const molds=Object.entries(FORGE_MOLDS).map(([id,m])=>`<button class="btn sm moldbtn ${econ().forgeMold===id?'gold':'ghost'}" data-m="${id}"><b>${m.icon} ${m.name}</b><br><small>${m.desc}</small></button>`).join('');
  b.innerHTML=`<div class="econ-stage"><div class="econ-hero"><img class="econ-hero-icon" src="assets/meta/economy/icon-forge.png" alt=""><div><div class="econ-eyebrow">Xưởng Binh · v2.72 Rèn Khuôn</div><div class="econ-title">Rèn Binh</div><div class="econ-copy">Chọn Khuôn để định hướng bộ trang bị, hoặc dùng Song Rèn đổi thêm nguyên liệu lấy quyền chọn giữa hai phôi. Khuôn tạo lối build ngang, không mở cấp vô hạn.</div><div class="econ-chips">${hvForgeMaterialChip('tinh',P.tinh||0)}${hvForgeMaterialChip('hoat',P.hoat||0)}${hvForgeMaterialChip('gold',P.gold)}<span class="econ-chip">Pity ${econ().craftPity}/${ECON.craftPitySSR}</span></div></div></div><div class="econ-grid"><div class="econ-panel full"><h3>🧩 Khuôn đang dùng</h3><div class="forge-molds">${molds}</div></div><div class="econ-panel full"><h3>🔨 Chọn loại trang bị</h3><div class="forge-slotbar">${DATA.items.slots.map(s=>`<div class="forge-action"><button class="btn forge-slot craftb" data-s="${s}">${hvForgeItemVisual({slot:s,rar:'b'},'forge-slot-art')}<span><b>${DATA.items.slotName[s]}</b><br><small>Rèn thường · ${hvForgeCost('tinh',CRAFT.tinh)} + ${hvForgeCost('gold',CRAFT.gold)}</small></span></button><button class="btn ghost sm dualb" data-s="${s}" ${pending?'disabled':''}>Song Rèn · ${hvForgeCost('tinh',DUAL_FORGE.tinh)} + ${hvForgeCost('gold',DUAL_FORGE.gold)}</button></div>`).join('')}</div></div>${revealBar}${pendingBar}${pickBar}<div class="econ-panel full"><h3>🎒 Kho trang bị · ${inv.length} món</h3>${inv.length?`<div class="econ-itemgrid">${cards}</div>`:'<div class="econ-muted">Chưa có món nào — chọn Khuôn rồi rèn để bắt đầu xây bộ.</div>'}</div></div></div>`;
  const forgeHero=b.querySelector('.econ-hero-icon'); if(forgeHero)forgeHero.src='assets/ui/menu-v3233/icons/forge.png';
  const dismiss=document.getElementById('forgeRevealDismiss'); if(dismiss)dismiss.addEventListener('click',()=>{ST.forgeRevealItem=null;ST.forgeRevealAudioUid=null;renderForge();});
  bindForgeCommands(b);
  try { HV_ENH_FX.attach(b); } catch (_) {}
}
