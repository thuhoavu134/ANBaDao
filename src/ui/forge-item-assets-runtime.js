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
  const glow = tier || (typeof enhGlowTier === 'function' ? enhGlowTier(item && item.lvl) : '');
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
function enhGlowTier(lvl){ const n=Number(lvl)||0; return n>=14?'red':n>=12?'gold':n>=9?'purple':''; }

// Owner 2026-10-25: enhanced item cells - clear glass in the middle, a metallic tier-coloured fire burning inside and
// around the rim, coloured motes and bright embers rising like sparks. One shared rAF for every glowing cell on screen.
const HV_ENH_FX = (() => {
  const PAL = {
    purple: { rim: [178, 96, 255], hot: [246, 214, 255], mote: [205, 140, 255], rate: 46 },
    gold:   { rim: [255, 196, 40], hot: [255, 248, 196], mote: [255, 224, 110], rate: 56 },
    red:    { rim: [255, 84, 22],  hot: [255, 222, 120], mote: [255, 146, 52],  rate: 72 },
  };
  const PAD_X = 16, PAD_TOP = 22, PAD_BOTTOM = 12;
  const cells = new Set();
  let raf = 0, last = 0;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function attach(root) {
    if (!root) return;
    if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.querySelectorAll('.hv-item-slot[data-glow]').forEach(el => {
      if (el.__hvFx) return;
      const tier = el.dataset.glow;
      if (!PAL[tier]) return;
      const c = document.createElement('canvas');
      c.className = 'hv-fx';
      el.appendChild(c);
      el.__hvFx = { c, tier, parts: [], acc: 0, seed: Math.random() * 1000 };
      cells.add(el);
    });
    if (cells.size && !raf) { last = 0; raf = requestAnimationFrame(loop); }
  }

  function loop(ts) {
    raf = 0;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
    last = ts;
    const vh = innerHeight;
    for (const el of cells) {
      if (!el.isConnected) { cells.delete(el); continue; }
      const r = el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) continue;        // off screen: keep state, skip drawing
      draw(el, ts / 1000, dt);
    }
    if (cells.size) raf = requestAnimationFrame(loop);
  }

  function draw(el, t, dt) {
    const fx = el.__hvFx, pal = PAL[fx.tier];
    const w = el.offsetWidth, h = el.offsetHeight;
    const W = w + PAD_X * 2, H = h + PAD_TOP + PAD_BOTTOM;
    // (not the campaign scene's exact dpr line: a build step anchors on that text being unique)
    const dpr = Math.min(2, (window.devicePixelRatio) || 1);
    const c = fx.c;
    if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) {
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      c.style.width = W + 'px'; c.style.height = H + 'px';
    }
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    const x0 = PAD_X, y0 = PAD_TOP, x1 = PAD_X + w, y1 = PAD_TOP + h;

    // 1) metallic fire burning along the INSIDE of the rim: flickering soft bands on all four edges,
    //    stronger along the bottom where the flames start.
    const flick = s => 0.55 + 0.45 * Math.sin(t * 7.3 + s) * Math.sin(t * 3.1 + s * 1.7);
    const edge = (gx0, gy0, gx1, gy1, a) => {
      const gr = g.createLinearGradient(gx0, gy0, gx1, gy1);
      gr.addColorStop(0, rgba(pal.hot, a));
      gr.addColorStop(0.35, rgba(pal.rim, a * 0.7));
      gr.addColorStop(1, rgba(pal.rim, 0));
      return gr;
    };
    const band = Math.max(8, w * 0.2);
    g.fillStyle = edge(0, y1, 0, y1 - band * 1.5, 0.55 * flick(fx.seed)); g.fillRect(x0, y1 - band * 1.5, w, band * 1.5);
    g.fillStyle = edge(x0, 0, x0 + band, 0, 0.32 * flick(fx.seed + 2)); g.fillRect(x0, y0, band, h);
    g.fillStyle = edge(x1, 0, x1 - band, 0, 0.32 * flick(fx.seed + 4)); g.fillRect(x1 - band, y0, band, h);
    g.fillStyle = edge(0, y0, 0, y0 + band, 0.22 * flick(fx.seed + 6)); g.fillRect(x0, y0, w, band);

    // 2) flame tongues licking up from the bottom rim (outside + inside)
    const tongues = 5;
    for (let i = 0; i < tongues; i++) {
      const fxp = x0 + (i + 0.5) * (w / tongues) + Math.sin(t * 2.3 + i * 1.9 + fx.seed) * 3;
      const fh = h * (0.22 + 0.16 * (0.5 + 0.5 * Math.sin(t * 5.1 + i * 2.7 + fx.seed)));
      const rg = g.createRadialGradient(fxp, y1, 0, fxp, y1, fh);
      rg.addColorStop(0, rgba(pal.hot, 0.55));
      rg.addColorStop(0.4, rgba(pal.rim, 0.32));
      rg.addColorStop(1, rgba(pal.rim, 0));
      g.fillStyle = rg;
      g.beginPath(); g.ellipse(fxp, y1, w / tongues * 0.75, fh, 0, Math.PI, 0); g.fill();
    }

    // 3) shimmering metallic rim line
    g.lineWidth = 1.5;
    g.strokeStyle = rgba(pal.hot, 0.35 + 0.3 * flick(fx.seed + 9));
    g.strokeRect(x0 + 1, y0 + 1, w - 2, h - 2);

    // 4) particles: coloured motes + bright embers, born near the bottom / rim, drifting up and swaying
    fx.acc += pal.rate * dt;
    while (fx.acc >= 1) {
      fx.acc -= 1;
      const ember = Math.random() < 0.38;
      const side = Math.random();
      const px = side < 0.7 ? x0 + Math.random() * w : (side < 0.85 ? x0 + Math.random() * 6 : x1 - Math.random() * 6);
      const py = side < 0.7 ? y1 - Math.random() * h * 0.35 : y0 + h * (0.3 + Math.random() * 0.7);
      fx.parts.push({ x: px, y: py, vx: (Math.random() - 0.5) * 8, vy: -(18 + Math.random() * 30) * (ember ? 1.35 : 1),
        life: 0, max: 0.9 + Math.random() * 0.9, r: ember ? 0.9 + Math.random() * 1.1 : 1.4 + Math.random() * 1.8, ember, ph: Math.random() * 6 });
    }
    const keep = [];
    for (const q of fx.parts) {
      q.life += dt;
      if (q.life >= q.max) continue;
      q.x += (q.vx + Math.sin(t * 4 + q.ph) * 6) * dt;
      q.y += q.vy * dt;
      if (q.y < 0) continue;
      const k = q.life / q.max, a = (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85) * (q.ember ? 1 : 0.75);
      const col = q.ember ? pal.hot : pal.mote;
      const rad = q.r * (q.ember ? 3.2 : 2.6);
      const rg = g.createRadialGradient(q.x, q.y, 0, q.x, q.y, rad);
      rg.addColorStop(0, rgba(col, a));
      rg.addColorStop(0.45, rgba(q.ember ? pal.mote : pal.rim, a * 0.55));
      rg.addColorStop(1, rgba(pal.rim, 0));
      g.fillStyle = rg;
      g.beginPath(); g.arc(q.x, q.y, rad, 0, Math.PI * 2); g.fill();
      keep.push(q);
    }
    fx.parts = keep.length > 120 ? keep.slice(-120) : keep;
    g.globalCompositeOperation = 'source-over';
  }

  return { attach };
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
  const cards=inv.map(it=>{const eb=equippedBy(it.uid),m=FORGE_MOLDS[it.mold]||FORGE_MOLDS.strike,cls='econ-item t-'+it.rar;return `<div class="${cls}" data-forge-item="${it.slot}-${it.rar}"><div class="forge-card-head">${hvForgeItemVisual(it)}<div class="forge-card-copy"><div class="nm"><span class="rar" style="background:${rarCol(it.rar)}">${it.rar.toUpperCase()}</span>${itemName(it)}</div><div class="meta">${DATA.items.slotName[it.slot]} · +${it.lvl} · +${itemStat(it)} ${DATA.items.statName[it.slot]}</div><div class="meta">${m.icon} ${m.name} · ${eb?('Đang mặc: '+DATA.heroes[eb].name):'Trong kho'}</div></div></div><div class="econ-actions"><button class="btn sm enh" data-u="${it.uid}" ${it.lvl>=15?'disabled':''}>${it.lvl>=15?'+15 MAX':('Cường hoá · '+hvForgeCost('gold',enhCost(it).gold)+' + '+hvForgeCost('hoat',enhCost(it).hoat))}</button><button class="btn ghost sm eqp" data-u="${it.uid}">Trang bị</button>${eb?`<button class="btn ghost sm uneqp" data-u="${it.uid}" data-h="${eb}">Tháo</button>`:""}<button class="btn ghost sm itemlock" data-u="${it.uid}" data-locked="${isForgeItemLocked(it)}">${isForgeItemLocked(it)?"Mở khóa":"Khóa đồ"}</button><button class="btn ghost sm salv" data-u="${it.uid}" ${eb||isForgeItemLocked(it)?'disabled':''}>Phân giải</button></div></div>`;}).join('');
  const molds=Object.entries(FORGE_MOLDS).map(([id,m])=>`<button class="btn sm moldbtn ${econ().forgeMold===id?'gold':'ghost'}" data-m="${id}"><b>${m.icon} ${m.name}</b><br><small>${m.desc}</small></button>`).join('');
  b.innerHTML=`<div class="econ-stage"><div class="econ-hero"><img class="econ-hero-icon" src="assets/meta/economy/icon-forge.png" alt=""><div><div class="econ-eyebrow">Xưởng Mộng · v2.72 Rèn Khuôn</div><div class="econ-title">Rèn Mộng</div><div class="econ-copy">Chọn Khuôn để định hướng bộ trang bị, hoặc dùng Song Rèn đổi thêm nguyên liệu lấy quyền chọn giữa hai phôi. Khuôn tạo lối build ngang, không mở cấp vô hạn.</div><div class="econ-chips">${hvForgeMaterialChip('tinh',P.tinh||0)}${hvForgeMaterialChip('hoat',P.hoat||0)}${hvForgeMaterialChip('gold',P.gold)}<span class="econ-chip">Pity ${econ().craftPity}/${ECON.craftPitySSR}</span></div></div></div><div class="econ-grid"><div class="econ-panel full"><h3>🧩 Khuôn đang dùng</h3><div class="forge-molds">${molds}</div></div><div class="econ-panel full"><h3>🔨 Chọn loại trang bị</h3><div class="forge-slotbar">${DATA.items.slots.map(s=>`<div class="forge-action"><button class="btn forge-slot craftb" data-s="${s}">${hvForgeItemVisual({slot:s,rar:'b'},'forge-slot-art')}<span><b>${DATA.items.slotName[s]}</b><br><small>Rèn thường · ${hvForgeCost('tinh',CRAFT.tinh)} + ${hvForgeCost('gold',CRAFT.gold)}</small></span></button><button class="btn ghost sm dualb" data-s="${s}" ${pending?'disabled':''}>Song Rèn · ${hvForgeCost('tinh',DUAL_FORGE.tinh)} + ${hvForgeCost('gold',DUAL_FORGE.gold)}</button></div>`).join('')}</div></div>${revealBar}${pendingBar}${pickBar}<div class="econ-panel full"><h3>🎒 Kho trang bị · ${inv.length} món</h3>${inv.length?`<div class="econ-itemgrid">${cards}</div>`:'<div class="econ-muted">Chưa có món nào — chọn Khuôn rồi rèn để bắt đầu xây bộ.</div>'}</div></div></div>`;
  const forgeHero=b.querySelector('.econ-hero-icon'); if(forgeHero)forgeHero.src='assets/ui/menu-v3233/icons/forge.png';
  const dismiss=document.getElementById('forgeRevealDismiss'); if(dismiss)dismiss.addEventListener('click',()=>{ST.forgeRevealItem=null;ST.forgeRevealAudioUid=null;renderForge();});
  bindForgeCommands(b);
  try { HV_ENH_FX.attach(b); } catch (_) {}
}
