// Owner 2026-11-12: Rèn Mộng 3 tab (Chế tạo / Cường hoá / Phân giải).
// Chỉ đổi giao diện: mọi kết quả vẫn đi qua craftItem / startDualForge / chooseDualForge /
// enhanceItem / setForgeItemLock / confirmForgeSalvage có sẵn. Không tự tính tỉ lệ hay chi phí.
(function () {
  if (typeof renderForge !== 'function') return;
  var A = 'assets/ui/forge/v2/';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var RN = { b: 'B', a: 'A', s: 'S', ss: 'SS', ssr: 'SSR' };
  var RORD = { ssr: 0, ss: 1, s: 2, a: 3, b: 4 };
  var fa = function () { ST.fa = ST.fa || { tab: 'craft', slot: DATA.items.slots[0], sel: null }; return ST.fa; };
  var baseImg = function (it) { return typeof hvForgeAsset === 'function' ? hvForgeAsset(it) : 'assets/ui/menu-v3233/icons/forge.png'; };
  var img = function (it) { return it && it.art ? 'assets/items/equipment/slots/' + it.art + '-' + (it.rar || 's') + '.webp' : baseImg(it); };
  if (typeof globalThis.honVietEquipmentAssetFor === 'function' && !globalThis.honVietEquipmentAssetFor.__art) {
    var baseAsset = globalThis.honVietEquipmentAssetFor;
    globalThis.honVietEquipmentAssetFor = function (it) { return it && it.art ? 'assets/items/equipment/slots/' + it.art + '-' + (it.rar || 's') + '.webp' : baseAsset.apply(this, arguments); };
    globalThis.honVietEquipmentAssetFor.__art = true;
  }
  var vis = function (it, cls) { return typeof hvForgeItemVisual === 'function' ? hvForgeItemVisual(it, cls || 'fa-art') : '<img class="' + (cls || 'fa-art') + '" src="' + img(it) + '" alt="">'; };
  var mat = function (id, v) { return typeof hvForgeMaterialChip === 'function' ? hvForgeMaterialChip(id, v) : '<span class="econ-chip">' + v + '</span>'; };
  var cost = function (id, v) { return typeof hvForgeCost === 'function' ? hvForgeCost(id, v) : v; };
  var maxLvl = function (it) { return typeof gearMaxLvl === 'function' ? gearMaxLvl(it) : 15; };

  function header() {
    var e = econ();
    return '<div class="fa-res">' + mat('tinh', P.tinh || 0) + mat('hoat', P.hoat || 0) + mat('gold', P.gold || 0) + '</div>'
      + '<div class="fa-tabs" role="tablist">'
      + [['craft', 'Chế tạo'], ['enh', 'Cường hoá'], ['salv', 'Phân giải']].map(function (t) {
        return '<button class="fa-tabbtn' + (fa().tab === t[0] ? ' on' : '') + '" role="tab" data-fa-tab="' + t[0] + '">' + t[1] + '</button>';
      }).join('') + '</div>';
  }

  // Owner 2026-11-12: 12 ô đồ tài khoản (I..XII). Mỗi ô rèn theo loại của ô (weapon/armor/charm/boots),
  // món ra ghi item.art = ảnh của ô để túi đồ hiện đúng hình (Nhẫn ra hình nhẫn).
  // Bản sao ACCOUNT_GEAR_SLOTS (src/domain/equipment/account-board.mjs nằm trong IIFE nên không đọc được từ đây).
  var G12 = [['I', 'armor', 'Nón'], ['II', 'charm', 'Đai'], ['III', 'charm', 'Dây chuyền'], ['IV', 'charm', 'Nhẫn'], ['V', 'armor', 'Giáp'], ['VI', 'weapon', 'Quần'],
    ['VII', 'boots', 'Giày'], ['VIII', 'armor', 'Găng'], ['IX', 'boots', 'Hộ uyển'], ['X', 'weapon', 'Khăn'], ['XI', 'boots', 'Ngọc bội'], ['XII', 'weapon', 'Vũ khí']]
    .map(function (r) { return { id: r[0], kind: r[1], name: r[2] }; });
  var ART = { I: 'non', II: 'dai', III: 'day-chuyen', IV: 'nhan', V: 'giap', VI: 'quan', VII: 'giay', VIII: 'gang', IX: 'ho-uyen', X: 'khan', XI: 'ngoc-boi', XII: 'vu-khi' };
  var slotArt = function (key, rar) { return 'assets/items/equipment/slots/' + key + '-' + (rar || 's') + '.webp'; };
  var g12 = function (id) { return G12.find(function (g) { return g.id === id; }) || G12[G12.length - 1]; };
  var canCraft = function () { return Math.max(0, Math.min(Math.floor((P.tinh || 0) / CRAFT.tinh), Math.floor((P.gold || 0) / CRAFT.gold))); };
  var canSo = function () { return Math.min(Math.floor((P.tinh || 0) / 25), Math.floor((P.hoat || 0) / 25)); };
  var soState = function () { var bb = P.bachBao || {}; var day = typeof today === 'function' ? today() : 0; return bb.craftDay === day ? (bb.crafted || 0) : 0; };

  var DIR = {
    strike: ['⚔️', 'Công', '+2% Công', '+5% Công'],
    ward: ['🛡️', 'Thủ', '+2% Máu và Thủ', '+5% Máu và Thủ'],
    tempo: ['💨', 'Tốc', '+1 Tốc', '+3 Tốc']
  };

  function recentStrip() {
    var st = fa(), list = (st.recent || []).map(function (u) { return P.inventory.find(function (i) { return i.uid === u; }); }).filter(Boolean);
    if (!list.length) return '<div class="fa-recent fa-recent-empty">Đồ rèn ra sẽ hiện ở đây · chạm để xem chỉ số</div>';
    return '<div class="fa-recent"><div class="fa-recent-h">Vừa rèn · chạm để xem</div><div class="fa-recent-row">' + list.map(function (it) {
      return '<button class="fa-cell r-' + it.rar + '" data-fa-info="' + it.uid + '">' + vis(it, 'fa-art') + '<em>' + RN[it.rar] + '</em></button>';
    }).join('') + '</div></div>';
  }

  function infoCard() {
    var st = fa(), it = st.info && P.inventory.find(function (i) { return i.uid === st.info; });
    if (!it) return '';
    var eb = equippedBy(it.uid), d = DIR[it.mold] || DIR.strike, mx = maxLvl(it);
    return '<div class="fa-info" data-fa-infox><div class="fa-info-card r-' + it.rar + '" data-fa-stop>'
      + '<div class="fa-info-top">' + vis(it, 'fa-art') + '<div><div class="fa-info-name">' + esc(itemName(it)) + '</div><div class="fa-info-rar">Phẩm ' + RN[it.rar] + ' · +' + it.lvl + '/' + mx + '</div></div></div>'
      + '<div class="fa-info-row"><span>' + esc(DATA.items.statName[it.slot]) + '</span><b>+' + itemStat(it) + '</b></div>'
      + '<div class="fa-info-row"><span>Hướng</span><b>' + d[0] + ' ' + d[1] + '</b></div>'
      + '<div class="fa-info-row dim"><span>2 món cùng hướng</span><b>' + d[2] + '</b></div>'
      + '<div class="fa-info-row dim"><span>4 món cùng hướng</span><b>' + d[3] + '</b></div>'
      + '<div class="fa-info-row"><span>Đang ở</span><b>' + (eb ? esc(DATA.heroes[eb].name) : 'Túi đồ') + '</b></div>'
      + '<div class="fa-go"><button class="fa-btn main" data-fa-goenh="' + it.uid + '"><b>CƯỜNG HOÁ</b></button><button class="fa-btn alt" data-fa-infox2><b>ĐÓNG</b></button></div>'
      + '</div></div>';
  }

  // Tàn lửa: 18 hạt, kích thước/độ cao/độ lệch/thời gian khác nhau để không lặp máy móc.
  // Tàn lửa: 18 hạt, kích thước/độ cao/độ lệch/thời gian khác nhau để không lặp máy móc.
  function embers() {
    var h = '<div class="fa-embers">';
    for (var i = 0; i < 18; i++) {
      var sz = (2 + Math.random() * 4).toFixed(1);
      var x = (18 + Math.random() * 64).toFixed(1);
      var ex = Math.round(Math.random() * 34 - 17);
      var rise = -Math.round(40 + Math.random() * 70);
      var dur = (2.1 + Math.random() * 1.9).toFixed(2);
      var d = (Math.random() * 2.6).toFixed(2);
      var bdur = (0.9 + Math.random() * 0.7).toFixed(2);
      h += '<i style="--x:' + x + '%;--sz:' + sz + 'px;--ex:' + ex + 'px;--rise:' + rise + 'px;--dur:' + dur + 's;--d:' + d + 's;--bdur:' + bdur + 's"></i>';
    }
    return h + '</div>';
  }

  function craftTab() {
    var st = fa(), e = econ(), pending = e.forgePending;
    if (!G12.some(function (g) { return g.id === st.g; })) st.g = 'XII';
    var cur = g12(st.g), key = ART[cur.id];
    var rates = (typeof FORGE_RARITY !== 'undefined' ? FORGE_RARITY : []).map(function (r) {
      return '<span class="fa-rate r-' + r[0] + '">' + RN[r[0]] + ' ' + r[1] + '%</span>';
    }).join('');
    var pity = e.craftPity || 0, pSSR = ECON.craftPitySSR, pSS = ECON.craftPitySS;
    var ssLeft = Math.max(0, pSS - pity), ssrLeft = Math.max(0, pSSR - pity);
    var grid = G12.map(function (g) {
      return '<button class="fa-g' + (g.id === cur.id ? ' on' : '') + '" data-fa-g="' + g.id + '"><img src="' + slotArt(ART[g.id], 's') + '" alt=""><span>' + esc(g.name) + '</span></button>';
    }).join('');
    var molds = Object.keys(FORGE_MOLDS).map(function (id) {
      return '<button class="fa-mold' + (e.forgeMold === id ? ' on' : '') + '" data-fa-mold="' + id + '">' + DIR[id][0] + ' ' + DIR[id][1] + '</button>';
    }).join('');
    var dir = DIR[e.forgeMold] || DIR.strike;
    var pend = '';
    if (pending) {
      pend = '<div class="fa-pending"><h3>Phôi Song Rèn còn chờ · chọn 1</h3><div class="fa-cands">'
        + pending.candidates.map(function (it, i) {
          return '<button class="fa-cand r-' + it.rar + '" data-fa-pick="' + i + '">' + vis(it, 'fa-art') + '<b>' + RN[it.rar] + ' · ' + esc(itemName(it)) + '</b><small>+' + itemStat(it) + ' ' + esc(DATA.items.statName[it.slot]) + '</small></button>';
        }).join('') + '</div></div>';
    }
    var n = canCraft(), soMode = st.mode === 'so', nSo = canSo();
    return '<div class="fa-anvil' + (st.burstAt && Date.now() < st.burstAt ? ' fa-burst' : '') + '" data-fa-anvil>'
      + '<img class="fa-anvil-bg" src="' + A + 'scene.webp" alt="">'
      + '<div class="fa-flame' + (st.busy ? ' on' : '') + '"><i></i><i></i><i></i></div>'
      + (st.busy ? '<div class="fa-progress" data-fa-progress><div class="fa-progress-track"><span style="width:' + st.busy.pct.toFixed(1) + '%"></span></div><b>' + (st.busy.so ? 'Đang chế sò' : 'Đang rèn') + ' <em>' + st.busy.done + '/' + st.busy.total + '</em></b></div>' : '')
      + '<div class="fa-anvil-item"><img class="fa-art fa-ghost" src="' + (soMode ? 'assets/ui/festival/bbr/so.png' : slotArt(key, 's')) + '" alt=""></div>'
      + embers()
      + '<div class="fa-anvil-name">' + (soMode ? 'Sò Mộng · có ' + (P.so || 0) + ' sò' : esc(cur.name)) + '</div>'
      + '<button class="fa-bag" data-fa-bag title="Túi đồ"><img src="assets/ui/menu-v3233/icons/bag.png" alt=""><b>' + P.inventory.length + '</b></button>'
      + '</div>'
      + '<div class="fa-g12">' + grid + '<button class="fa-g fa-g-so' + (soMode ? ' on' : '') + '" data-fa-somode><img src="assets/ui/festival/bbr/so.png" alt=""><span>Sò</span></button></div>'
      + (soMode ? '' : '<div class="fa-dir"><span class="fa-dir-h">Hướng</span>' + molds + '</div>'
      + '<div class="fa-dir-tip">Mặc 2 món cùng hướng: <b>' + dir[2] + '</b> · 4 món: <b>' + dir[3] + '</b></div>')
      + pend
      + (soMode
        ? '<div class="fa-go3 two">'
          + '<button class="fa-btn alt" data-fa-so="1"' + (nSo ? '' : ' disabled') + '><b>CHẾ SÒ x10</b></button>'
          + '<button class="fa-btn main hot" data-fa-so="10"' + (nSo ? '' : ' disabled') + '><b>CHẾ SÒ x100</b></button>'
          + '</div>'
        : '<div class="fa-go3 two">'
          + '<button class="fa-btn main" data-fa-craft' + (n && !st.busy ? '' : ' disabled') + '><b>RÈN x1</b></button>'
          + '<button class="fa-btn main hot" data-fa-all' + (n ? '' : ' disabled') + '><b>RÈN x10</b></button>'
          + '</div>')
      + recentStrip();      + recentStrip();
  }

  function invGrid(filter, selUid) {
    var inv = P.inventory.slice().filter(filter).sort(function (x, y) { return (RORD[x.rar] - RORD[y.rar]) || (y.lvl - x.lvl) || x.slot.localeCompare(y.slot); });
    if (!inv.length) return '<div class="fa-empty">Chưa có món nào. Sang tab Chế tạo để rèn.</div>';
    return '<div class="fa-inv">' + inv.map(function (it) {
      var eb = equippedBy(it.uid);
      return '<button class="fa-cell r-' + it.rar + (it.uid === selUid ? ' on' : '') + '" data-fa-sel="' + it.uid + '">' + vis(it, 'fa-art')
        + '<em>+' + it.lvl + '</em>' + (eb ? '<i class="fa-worn">Mặc</i>' : '') + ((it.locked || it.lock) ? '<i class="fa-lock">🔒</i>' : '') + '</button>';
    }).join('') + '</div>';
  }

  // Mốc cường hoá (ENH_MILESTONES trong index.html): mốc đã đạt sáng, chưa đạt mờ, vượt trần phẩm thì gạch.
  function milestones(it) {
    if (typeof ENH_MILESTONES === 'undefined') return '';
    var mx = maxLvl(it);
    return '<div class="fa-ms"><div class="fa-sec">Mốc cường hoá</div>' + ENH_MILESTONES.map(function (m) {
      var cls = it.lvl >= m[0] ? 'on' : (m[0] > mx ? 'cap' : '');
      return '<div class="fa-msrow ' + cls + '"><b>+' + m[0] + '</b><span>' + esc(DATA.items.statName[it.slot]) + ' +' + Math.round(m[1] * 100) + '%</span>' + (cls === 'cap' ? '<small>phẩm ' + RN[it.rar] + ' tối đa +' + mx + '</small>' : '') + '</div>';
    }).join('') + '</div>';
  }

  // Bộ trang bị cùng phẩm (SETS trong index.html): 2 món / 4 món trên cùng một tướng.
  function setInfo(it) {
    if (typeof SETS === 'undefined' || !SETS.names[it.rar]) return '';
    var hid = equippedBy(it.uid), n = 0;
    if (hid) { var e = (P.equip || {})[hid] || {}; DATA.items.slots.forEach(function (s) { var x = P.inventory.find(function (i) { return i.uid === e[s]; }); if (x && x.rar === it.rar) n++; }); }
    var pc = function (v) { return Math.round(v * 100) + '%'; };
    return '<div class="fa-set"><div class="fa-sec">' + esc(SETS.names[it.rar]) + ' (' + n + '/4)' + (hid ? '' : ' · mặc lên tướng để tính bộ') + '</div>'
      + '<div class="fa-msrow ' + (n >= 2 ? 'on' : '') + '"><b>2 món</b><span>Chỉ số +' + pc(SETS.p2[it.rar]) + '</span></div>'
      + '<div class="fa-msrow ' + (n >= 4 ? 'on' : '') + '"><b>4 món</b><span>Chỉ số thêm +' + pc(SETS.p4[it.rar]) + (it.rar === 'ssr' ? ', Tốc +6' : '') + '</span></div></div>';
  }

  function enhTab() {
    var st = fa(), it = P.inventory.find(function (i) { return i.uid === st.sel; });
    var detail = '<div class="fa-detail fa-hint">Chọn một món bên dưới để cường hoá.</div>';
    if (it) {
      var mx = maxLvl(it), atMax = it.lvl >= mx, eb = equippedBy(it.uid);
      var nxt = atMax ? null : Object.assign({}, it, { lvl: it.lvl + 1 });
      var c = (!atMax && typeof enhCost === 'function') ? enhCost(it) : null;
      detail = '<div class="fa-detail r-' + it.rar + '">' + vis(it, 'fa-art fa-big')
        + '<div class="fa-dinfo"><b>' + RN[it.rar] + ' · ' + esc(itemName(it)) + '</b>'
        + '<div class="fa-lv">+' + it.lvl + (atMax ? ' <span class="fa-max">MAX</span>' : ' → <b>+' + (it.lvl + 1) + '</b>') + ' <small>(trần +' + mx + ')</small></div>'
        + '<div class="fa-stat">' + esc(DATA.items.statName[it.slot]) + ' ' + itemStat(it) + (nxt ? ' → <b>' + itemStat(nxt) + '</b>' : '') + '</div>'
        + '<small>' + (eb ? 'Đang mặc: ' + esc(DATA.heroes[eb].name) : 'Trong kho') + '</small></div></div>'
        + '<div class="fa-go">'
        + '<button class="fa-btn main" data-fa-enh="' + it.uid + '"' + (atMax ? ' disabled' : '') + '><b>' + (atMax ? 'ĐÃ TỐI ĐA' : 'CƯỜNG HOÁ') + '</b><span>' + (c ? cost('gold', c.gold) + cost('hoat', c.hoat) : '') + '</span></button>'
        + '<button class="fa-btn alt sm" data-fa-equip="' + it.uid + '"><b>TRANG BỊ</b></button>'
        + '</div>'
        + '<div class="fa-tip">' + milestones(it) + setInfo(it) + '</div>';
      if (ST.equipPick === it.uid) {
        detail += '<div class="fa-pick">' + P.squad.map(function (s) { return '<button class="fa-chipbtn" data-fa-to="' + s.id + '">' + esc(DATA.heroes[s.id].name) + '</button>'; }).join('')
          + '<button class="fa-chipbtn ghost" data-fa-pickx>Huỷ</button></div>';
      }
    }
    return detail + invGrid(function () { return true; }, st.sel);
  }

  // Phân giải: chọn theo phẩm (hàng loạt) hoặc chạm từng món. Đồ đang mặc / đã khoá tự bỏ qua.
  function salvable(it) { return typeof previewForgeSalvage === 'function' && previewForgeSalvage(P, it.uid, DATA.items.slots).ok; }
  function salvPicks() {
    var st = fa(); st.picks = st.picks || {}; st.rars = st.rars || {};
    return P.inventory.filter(function (it) { return (st.picks[it.uid] || st.rars[it.rar]) && salvable(it); });
  }
  function salvTab() {
    var st = fa(); st.picks = st.picks || {}; st.rars = st.rars || {};
    var list = salvPicks(), gain = 0;
    list.forEach(function (it) { gain += previewForgeSalvage(P, it.uid, DATA.items.slots).quote.gain; });
    var chips = ['b', 'a', 's', 'ss', 'ssr'].map(function (r) {
      var cnt = P.inventory.filter(function (it) { return it.rar === r && salvable(it); }).length;
      return '<button class="fa-rchip r-' + r + (st.rars[r] ? ' on' : '') + '" data-fa-rar="' + r + '"' + (cnt ? '' : ' disabled') + '><b>' + RN[r] + '</b><small>' + cnt + '</small></button>';
    }).join('');
    var inv = P.inventory.slice().sort(function (x, y) { return (RORD[y.rar] - RORD[x.rar]) || (x.lvl - y.lvl); });
    var grid = inv.length ? '<div class="fa-inv">' + inv.map(function (it) {
      var ok = salvable(it), on = ok && (st.picks[it.uid] || st.rars[it.rar]);
      return '<button class="fa-cell r-' + it.rar + (on ? ' on picked' : '') + (ok ? '' : ' no') + '" data-fa-pk="' + it.uid + '"' + (ok ? '' : ' disabled') + '>' + vis(it, 'fa-art') + '<em>+' + it.lvl + '</em>'
        + (equippedBy(it.uid) ? '<i class="fa-worn">Mặc</i>' : '') + ((it.locked || it.lock) ? '<i class="fa-lock">🔒</i>' : '') + (on ? '<i class="fa-tick">✓</i>' : '') + '</button>';
    }).join('') + '</div>' : '<div class="fa-empty">Túi đồ trống.</div>';
    return '<div class="fa-smelt"><img src="' + A.replace('v2', 'v3') + 'salvage.webp" alt="">'
      + '<div class="fa-smelt-sum">Đã chọn <b>' + list.length + '</b> món · nhận ' + cost('tinh', '+' + gain) + '</div></div>'
      + '<div class="fa-rchips"><span>Chọn nhanh</span>' + chips + '</div>'
      + '<div class="fa-go3 two">'
      + '<button class="fa-btn alt" data-fa-pkclear' + (list.length ? '' : ' disabled') + '><b>BỎ CHỌN</b></button>'
      + '<button class="fa-btn main hot" data-fa-smelt' + (list.length ? '' : ' disabled') + '><b>PHÂN GIẢI</b></button>'
      + '</div>'
      + '<div class="fa-smelt-hint">Chạm món để chọn/bỏ · đồ đang mặc và đồ khoá 🔒 không phân giải</div>'
      + grid
      + (st.confirm ? '<div class="fa-info" data-fa-cfx><div class="fa-info-card"><div class="fa-info-name">Phân giải ' + list.length + ' món?</div>'
        + '<div class="fa-info-row"><span>Nhận</span><b>' + cost('tinh', '+' + gain) + '</b></div>'
        + '<div class="fa-info-row dim"><span>Không thể hoàn tác</span><b></b></div>'
        + '<div class="fa-go"><button class="fa-btn alt" data-fa-cfno><b>GIỮ LẠI</b></button><button class="fa-btn main hot" data-fa-cfyes><b>XÁC NHẬN</b></button></div></div></div>' : '');
  }

  function doSmelt() {
    var st = fa(), list = salvPicks(), n = 0, got = 0, baseToast = window.toast;
    window.toast = function () {};
    try {
      list.forEach(function (it) {
        var pv = previewForgeSalvage(P, it.uid, DATA.items.slots); if (!pv.ok) return;
        var r = forgeCommand('salvage', { uid: it.uid, quote: pv.quote }, cid('salvage', it.uid + ':' + it.lvl));
        if (r && r.ok) { n++; got += pv.quote.gain; }
      });
    } finally { window.toast = baseToast; }
    st.picks = {}; st.rars = {}; st.confirm = false;
    if (typeof refreshResbar === 'function') refreshResbar();
    if (typeof persist === 'function') persist();
    if (typeof toast === 'function') toast(n ? 'Phân giải ' + n + ' món · +' + got + ' Tinh Lực' : 'Chưa phân giải được món nào.');
  }

  function reveal() { return ''; }

  // Mã lệnh theo trạng thái món (cấp, số thứ tự đồ): bấm lần nữa ở trạng thái mới là lệnh mới,
  // bấm đúp cùng trạng thái vẫn bị chặn trùng. Mã mặc định chỉ theo P.revision nên chơi offline bị kẹt ở lần đầu.
  function cid(action, tail) { return 'forge.' + action + ':' + tail + ':' + (P.revision || 0); }

  function act(fn) { return function (ev) { ev.preventDefault(); fn(ev.currentTarget); renderForge(); }; }

  // Rèn n lần (1 hoặc "hết"): dừng khi thiếu Tinh/vàng. Tắt toast từng món, báo một lần.
  // Rèn theo nhịp: thanh tiến trình chạy mượt (x1 ≈ 1 giây, x10 ≈ 2,6 giây), không toast xanh.
  function forgeMany(max) {
    var st = fa();
    if (st.busy) return;
    var cur = g12(st.g), total = Math.min(max, canCraft());
    if (total < 1) { if (typeof toast === 'function') toast('Thiếu Tinh Lực hoặc vàng để rèn.'); return; }
    var got = [], baseToast = window.toast, TICK = 50;
    var dur = max > 1 ? 2600 : 1000, ticks = Math.round(dur / TICK), t = 0;
    st.busy = { done: 0, total: total, pct: 0 };
    window.toast = function () {};
    // Chỉ 1 tiếng rèn cho cả lượt (x1 hay x10): phát 1 lần, chặn tiếng lặp của từng món.
    var sfx = window.HonVietSfx, basePlay = sfx && sfx.play;
    if (basePlay) {
      try { basePlay.call(sfx, 'forge-reveal', { group: 'ui' }); } catch (e) {}
      sfx.play = function (ev) { return ev === 'forge-reveal' ? false : basePlay.apply(sfx, arguments); };
    }
    renderForge();
    var paint = function () {
      var pr = document.querySelector('[data-fa-progress]');
      if (!pr) return;
      pr.querySelector('span').style.width = st.busy.pct.toFixed(1) + '%';
      pr.querySelector('em').textContent = st.busy.done + '/' + st.busy.total;
    };
    var timer = setInterval(function () {
      t++;
      st.busy.pct = Math.min(100, t / ticks * 100);
      var want = Math.min(total, Math.floor(t / ticks * total + 1e-9));
      while (st.busy.done < want && canCraft() > 0) {
        var it = craftItem(cur.kind, cid('craft', cur.kind + ':' + (P.itemSeq || 0)));
        st.busy.done++;
        if (!it) { want = st.busy.done; break; }
        var live = P.inventory.find(function (x) { return x.uid === it.uid; });
        if (live) { live.art = ART[cur.id]; it = live; }
        got.push(it);
      }
      paint();
      if (t >= ticks || (st.busy.done >= want && canCraft() <= 0 && st.busy.done < total)) {
        clearInterval(timer);
        window.toast = baseToast;
        // tiếng của từng món được phát trễ (sau khi mở khoá âm thanh) nên giữ bộ lọc thêm một nhịp
        if (basePlay) setTimeout(function () { sfx.play = basePlay; }, 900);
        st.busy = null;
        ST.forgeRevealItem = null; ST.forgeRevealAudioUid = null;
        if (got.length && typeof persist === 'function') persist();
        if (got.length) afterForge(got);
        renderForge();
      }
    }, TICK);
  }

  function afterForge(got) {
    var st = fa();
    st.recent = got.map(function (x) { return x.uid; }).reverse().concat(st.recent || []).filter(function (u, i, arr) { return arr.indexOf(u) === i; }).slice(0, 12);
    var ssr = got.filter(function (x) { return x.rar === 'ssr'; });
    // Owner 12/11: loa he thong o man Tro Chuyen (kenh He Thong + dai chuc mung) nhan tin SSR.
    if (ssr.length && typeof chatPush === 'function') ssr.forEach(function (x) { try { chatPush('Hệ thống', 'Chúc mừng đại hiệp rèn được ' + itemName(x) + ' phẩm SSR!', false, 'world'); } catch (_) {} });
    if (ssr.length && window.HV_MARQUEE) ssr.forEach(function (x) { window.HV_MARQUEE.push('🎉 Chúc mừng đại hiệp rèn được <b style="color:#ff8a3a">' + esc(itemName(x)) + '</b> phẩm SSR!', 'gold', 1); });
    var order = { ssr: 0, ss: 1, s: 2, a: 3, b: 4 };
    st.burstAt = Date.now() + 1400; clearTimeout(st._bt); st._bt = setTimeout(function () { var a = document.querySelector('.fa-anvil.fa-burst'); if (a) a.classList.remove('fa-burst'); }, 1400);
    st.fly = got.slice().sort(function (x, y) { return order[x.rar] - order[y.rar]; }).slice(0, 5);
  }

  // Đồ bay từ đe vào túi đồ (góc khung đe).
  function flyToBag(root, items) {
    var from = root.querySelector('.fa-anvil-item'), to = root.querySelector('[data-fa-bag]');
    if (!from || !to || !items.length) return;
    var fr = from.getBoundingClientRect(), tr = to.getBoundingClientRect();
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    items.forEach(function (it, i) {
      var el = document.createElement('img');
      el.className = 'fa-fly r-' + it.rar; el.src = it.so ? 'assets/ui/festival/bbr/so.png' : img(it); el.alt = '';
      el.style.left = (fr.left + fr.width / 2 - 36) + 'px'; el.style.top = (fr.top + fr.height / 2 - 36) + 'px';
      document.body.appendChild(el);
      var dx = tr.left + tr.width / 2 - (fr.left + fr.width / 2), dy = tr.top + tr.height / 2 - (fr.top + fr.height / 2);
      var anim = el.animate([
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: 'translate(0,-40px) scale(1.1)', opacity: 1, offset: .3 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.25)', opacity: .9 }
      ], { duration: reduced ? 1 : 900, delay: reduced ? 0 : i * 160, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'both' });
      anim.onfinish = function () { el.remove(); to.classList.remove('bump'); void to.offsetWidth; to.classList.add('bump'); };
    });
  }

  // Chế sò trên khay: x10 (1 lần) hoặc x100 (10 lần), hiệu ứng như rèn đồ.
  function craftSo(times) {
    var st = fa(), done = 0, baseToast = window.toast;
    window.toast = function () {};
    try {
      for (var i = 0; i < times; i++) { var r = typeof window.hvCraftSo === 'function' ? window.hvCraftSo() : null; if (!r || !r.ok) break; done++; }
    } finally { window.toast = baseToast; }
    if (!done) { if (typeof toast === 'function') toast('Cần 25 Tinh + 25 Hoạt để chế sò.'); return; }
    if (typeof toast === 'function') toast('Chế được ' + (done * 10) + ' sò');
    st.burstAt = Date.now() + 1400;
    st.flySo = Math.min(done, 5);
  }


  // Neo lửa vào miệng lò theo toạ độ ẢNH GỐC scene.webp (1152x768), tính lại theo object-fit:cover
  // nên đổi kích thước màn hình/khung thì lửa vẫn nằm đúng trong lò.
  var FURNACE = { iw: 1152, ih: 768, cx: 655, baseY: 434, w: 128, hIdle: 92, hOn: 150 };
  function anchorFlame(root) {
    var box = root && root.querySelector('.fa-anvil'), fl = box && box.querySelector('.fa-flame');
    if (!box || !fl) return;
    var W = box.clientWidth, H = box.clientHeight; if (!W || !H) return;
    var sc = Math.max(W / FURNACE.iw, H / FURNACE.ih);
    var ox = (W - FURNACE.iw * sc) / 2, oy = (H - FURNACE.ih * sc) / 2;
    var w = FURNACE.w * sc, h = (fl.classList.contains('on') ? FURNACE.hOn : FURNACE.hIdle) * sc;
    var set = function (k, v) { fl.style.setProperty(k, v, 'important'); };
    set('left', (ox + FURNACE.cx * sc - w / 2) + 'px');
    set('top', (oy + FURNACE.baseY * sc - h) + 'px');
    set('width', w + 'px'); set('height', h + 'px'); set('transform', 'none');
  }
  var flameRO = typeof ResizeObserver === 'function' ? new ResizeObserver(function () { anchorFlame(document.getElementById('forgeBody')); }) : null;
  renderForge = function renderForgeTabs() {
    var b = document.getElementById('forgeBody'); if (!b) return;
    var st = fa();
    if (st.sel && !P.inventory.some(function (i) { return i.uid === st.sel; })) st.sel = null;
    if (econ().forgePending) st.tab = 'craft';
    var body = st.tab === 'enh' ? enhTab() : st.tab === 'salv' ? salvTab() : craftTab();
    b.innerHTML = '<div class="fa-root" data-tab="' + st.tab + '">' + header() + '<div class="fa-body">' + body + '</div>' + reveal() + infoCard() + '</div>';
    var on = function (sel, fn) { b.querySelectorAll(sel).forEach(function (x) { x.addEventListener('click', act(fn)); }); };
    on('[data-fa-tab]', function (x) { st.tab = x.dataset.faTab; ST.equipPick = null; });
    on('[data-fa-g]', function (x) { st.g = x.dataset.faG; });
    on('[data-fa-mold]', function (x) { setForgeMold(x.dataset.faMold); });
    on('[data-fa-craft]', function () { forgeMany(1); });
    on('[data-fa-all]', function () { forgeMany(10); });
    on('[data-fa-somode]', function () { st.mode = st.mode === 'so' ? '' : 'so'; });
    on('[data-fa-g]', function () { st.mode = ''; });
    on('[data-fa-so]', function (x) { craftSo(+x.dataset.faSo); });
    on('[data-fa-bag]', function () { if (typeof navTo === 'function') navTo('bag'); else if (typeof showScreen === 'function') showScreen('bag'); });
    on('[data-fa-rar]', function (x) { st.rars = st.rars || {}; st.rars[x.dataset.faRar] = !st.rars[x.dataset.faRar]; });
    on('[data-fa-pk]', function (x) { var u = +x.dataset.faPk, it = P.inventory.find(function (i) { return i.uid === u; }); st.picks = st.picks || {}; st.rars = st.rars || {};
      if (st.picks[u] || (it && st.rars[it.rar])) { delete st.picks[u]; if (it && st.rars[it.rar]) { st.rars[it.rar] = false; P.inventory.forEach(function (o) { if (o.rar === it.rar && o.uid !== u) st.picks[o.uid] = true; }); } } else st.picks[u] = true; });
    on('[data-fa-pkclear]', function () { st.picks = {}; st.rars = {}; });
    on('[data-fa-smelt]', function () { st.confirm = true; });
    on('[data-fa-cfno]', function () { st.confirm = false; });
    on('[data-fa-cfyes]', function () { doSmelt(); });
    on('[data-fa-pick]', function (x) { var before = P.inventory.length; if (chooseDualForge(+x.dataset.faPick) && P.inventory.length > before) afterForge([P.inventory[P.inventory.length - 1]]); });
    on('[data-fa-sel]', function (x) { st.sel = +x.dataset.faSel; ST.equipPick = null; });
    on('[data-fa-enh]', function (x) { var it = P.inventory.find(function (i) { return i.uid === +x.dataset.faEnh; }); if (it) enhanceItem(it.uid, cid('enhance', it.uid + ':' + it.lvl)); });
    on('[data-fa-equip]', function (x) { ST.equipPick = ST.equipPick === +x.dataset.faEquip ? null : +x.dataset.faEquip; });
    on('[data-fa-to]', function (x) { if (equipItem(ST.equipPick, x.dataset.faTo)) ST.equipPick = null; });
    on('[data-fa-pickx]', function () { ST.equipPick = null; });
    on('[data-fa-lock]', function (x) { var it = P.inventory.find(function (i) { return i.uid === +x.dataset.faLock; }); if (it) setForgeItemLock(it.uid, !(it.locked || it.lock), cid('lock', it.uid + ':' + !(it.locked || it.lock) + ':' + Date.now())); });
    on('[data-fa-bannerx]', function () { fa().banner = ''; });
    on('[data-fa-info]', function (x) { st.info = +x.dataset.faInfo; });
    on('[data-fa-infox2]', function () { st.info = null; });
    on('[data-fa-goenh]', function (x) { st.tab = 'enh'; st.sel = +x.dataset.faGoenh; st.info = null; });
    b.querySelectorAll('[data-fa-infox]').forEach(function (x) { x.addEventListener('click', function (ev) { if (ev.target === x) { st.info = null; renderForge(); } }); });
    if (fa().fly) { var f = fa().fly; fa().fly = null; flyToBag(b, f); }
    if (fa().flySo) { var k = fa().flySo; fa().flySo = 0; var arr = []; for (var q = 0; q < k; q++) arr.push({ so: 1, rar: 'ss' }); flyToBag(b, arr); }
    b.querySelectorAll('[data-fa-salv]').forEach(function (x) {
      x.addEventListener('click', function (ev) { ev.preventDefault(); if (typeof confirmForgeSalvage === 'function') confirmForgeSalvage(+x.dataset.faSalv, x); });
    });
    anchorFlame(b);
    var an = b.querySelector('.fa-anvil'); if (flameRO && an) { flameRO.disconnect(); flameRO.observe(an); }
  };
  window.hvForgeTabs = true;
})();
