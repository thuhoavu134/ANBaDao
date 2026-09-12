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

function hvForgeItemVisual(item, className = 'forge-item-art') {
  const alt = typeof itemName === 'function' ? itemName(item) : 'Trang bị';
  return `<img class="${className}" src="${hvForgeAsset(item)}" alt="${esc(alt)}" loading="lazy">`;
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
  const cards=inv.map(it=>{const eb=equippedBy(it.uid),m=FORGE_MOLDS[it.mold]||FORGE_MOLDS.strike;return `<div class="econ-item t-${it.rar}" data-forge-item="${it.slot}-${it.rar}"><div class="forge-card-head">${hvForgeItemVisual(it)}<div class="forge-card-copy"><div class="nm"><span class="rar" style="background:${rarCol(it.rar)}">${it.rar.toUpperCase()}</span>${itemName(it)}</div><div class="meta">${DATA.items.slotName[it.slot]} · +${it.lvl} · +${itemStat(it)} ${DATA.items.statName[it.slot]}</div><div class="meta">${m.icon} ${m.name} · ${eb?('Đang mặc: '+DATA.heroes[eb].name):'Trong kho'}</div></div></div><div class="econ-actions"><button class="btn sm enh" data-u="${it.uid}" ${it.lvl>=15?'disabled':''}>${it.lvl>=15?'+15 MAX':('Cường hoá · '+hvForgeCost('gold',enhCost(it).gold)+' + '+hvForgeCost('hoat',enhCost(it).hoat))}</button><button class="btn ghost sm eqp" data-u="${it.uid}">Trang bị</button>${eb?`<button class="btn ghost sm uneqp" data-u="${it.uid}" data-h="${eb}">Tháo</button>`:""}<button class="btn ghost sm itemlock" data-u="${it.uid}" data-locked="${isForgeItemLocked(it)}">${isForgeItemLocked(it)?"Mở khóa":"Khóa đồ"}</button><button class="btn ghost sm salv" data-u="${it.uid}" ${eb||isForgeItemLocked(it)?'disabled':''}>Phân giải</button></div></div>`;}).join('');
  const molds=Object.entries(FORGE_MOLDS).map(([id,m])=>`<button class="btn sm moldbtn ${econ().forgeMold===id?'gold':'ghost'}" data-m="${id}"><b>${m.icon} ${m.name}</b><br><small>${m.desc}</small></button>`).join('');
  b.innerHTML=`<div class="econ-stage"><div class="econ-hero"><img class="econ-hero-icon" src="assets/meta/economy/icon-forge.png" alt=""><div><div class="econ-eyebrow">Xưởng Mộng · v2.72 Rèn Khuôn</div><div class="econ-title">Rèn Mộng</div><div class="econ-copy">Chọn Khuôn để định hướng bộ trang bị, hoặc dùng Song Rèn đổi thêm nguyên liệu lấy quyền chọn giữa hai phôi. Khuôn tạo lối build ngang, không mở cấp vô hạn.</div><div class="econ-chips">${hvForgeMaterialChip('tinh',P.tinh||0)}${hvForgeMaterialChip('hoat',P.hoat||0)}${hvForgeMaterialChip('gold',P.gold)}<span class="econ-chip">Pity ${econ().craftPity}/${ECON.craftPitySSR}</span></div></div></div><div class="econ-grid"><div class="econ-panel full"><h3>🧩 Khuôn đang dùng</h3><div class="forge-molds">${molds}</div></div><div class="econ-panel full"><h3>🔨 Chọn loại trang bị</h3><div class="forge-slotbar">${DATA.items.slots.map(s=>`<div class="forge-action"><button class="btn forge-slot craftb" data-s="${s}">${hvForgeItemVisual({slot:s,rar:'b'},'forge-slot-art')}<span><b>${DATA.items.slotName[s]}</b><br><small>Rèn thường · ${hvForgeCost('tinh',CRAFT.tinh)} + ${hvForgeCost('gold',CRAFT.gold)}</small></span></button><button class="btn ghost sm dualb" data-s="${s}" ${pending?'disabled':''}>Song Rèn · ${hvForgeCost('tinh',DUAL_FORGE.tinh)} + ${hvForgeCost('gold',DUAL_FORGE.gold)}</button></div>`).join('')}</div></div>${revealBar}${pendingBar}${pickBar}<div class="econ-panel full"><h3>🎒 Kho trang bị · ${inv.length} món</h3>${inv.length?`<div class="econ-itemgrid">${cards}</div>`:'<div class="econ-muted">Chưa có món nào — chọn Khuôn rồi rèn để bắt đầu xây bộ.</div>'}</div></div></div>`;
  const forgeHero=b.querySelector('.econ-hero-icon'); if(forgeHero)forgeHero.src='assets/ui/menu-v3233/icons/forge.png';
  const dismiss=document.getElementById('forgeRevealDismiss'); if(dismiss)dismiss.addEventListener('click',()=>{ST.forgeRevealItem=null;ST.forgeRevealAudioUid=null;renderForge();});
  bindForgeCommands(b);
}
