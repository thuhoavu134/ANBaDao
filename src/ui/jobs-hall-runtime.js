(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.getElementById('jobsBody');
  if (!body || document.getElementById('hvJobsRoot')) return;

  const root = document.createElement('section');
  root.id = 'hvJobsRoot';
  root.setAttribute('aria-label', 'Giao việc');
  root.innerHTML = `<div class="hv-jobs-frame">
    <header class="hv-jobs-top"><b>Giao việc</b></header>
    <button type="button" class="hv-jobs-back" data-jobs-close aria-label="Đóng">×</button>
    <nav class="hv-tabnav">
      <button type="button" class="hv-tab" data-jtab="board">Việc<br>trong ngày</button>
      <button type="button" class="hv-tab" data-jtab="active">Đang<br>làm</button>
      <button type="button" class="hv-tab" data-jtab="rep">Danh<br>vọng</button>
    </nav>
    <div class="hv-jobs-list"></div>
    <div class="hv-rep">
      <div class="hv-rep-head"><span>Danh vọng giang hồ</span><b data-rep-rank></b></div>
      <div class="hv-rep-track"><i data-rep-fill></i></div>
      <div class="hv-rep-foot"><span data-rep-num></span><span data-rep-perfect></span></div>
    </div>
    <div class="hv-pick" data-pick hidden></div>
  </div>`;
  const list = root.querySelector('.hv-jobs-list');
  list.append(body);
  document.body.append(root);

  /* Owner 2026-11-01 — concept 2: khung gỗ sơn mài làm nền, dữ liệu thật đặt lên đúng
     vị trí tranh vẽ. Toàn bộ luật chơi vẫn là startJob()/claimJob()/socialClaimDaily(). */
  const ROWS = [[0, 23.3], [24.6, 24.2], [50.0, 24.3], [75.5, 24.5]];
  const TIERS = [
    { min: 30, max: 100, name: 'Danh chấn giang hồ' },
    { min: 15, max: 30, name: 'Đại hiệp' },
    { min: 6, max: 15, name: 'Thiếu hiệp' },
    { min: 0, max: 6, name: 'Vô danh tiểu tốt' }
  ];
  const ui = { tab: 'board', pick: null };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtN = n => (n >= 10000 ? Math.round(n / 1000) + 'K' : String(n));
  const pick = () => (typeof _jobsPick === 'object' && _jobsPick) || {};
  const save = () => { if (typeof persist === 'function') persist(); };
  const toastMsg = m => { if (typeof toast === 'function') toast(m); };
  const jobs = () => (typeof DATA === 'object' && Array.isArray(DATA.jobs) ? DATA.jobs : []);
  const jobOf = id => jobs().find(j => j.id === id) || null;

  /* Owner 2026-11-02: Bảng cáo thị — lore giang hồ + 4 thưởng thật cho mỗi việc.
     index.html giữ nguyên (patch khác bám vào nó); dữ liệu và luật nhận thưởng được bổ sung ở đây. */
  const BOUNTY = {
    ship_pho: ['Hộ tống thư khẩn', 'Phong thư phải tới tay minh chủ trước canh ba.', { gold: 320, gems: 6, tinh: 10, hoat: 10 }],
    trong_quan: ['Truy nã đạo chích', 'Tên trộm lẩn trong chợ đêm — bắt sống mới được lĩnh thưởng.', { gems: 22, gold: 160, tinh: 15, hoat: 15 }],
    don_kho: ['Canh giữ Tàng Kinh Các', 'Bí kíp thất truyền nằm đây, không kẻ nào được bén mảng.', { shards: 5, gold: 400, gems: 12, hoat: 30 }],
    tuoi_cay: ['Thu thảo dược Vân Sơn', 'Linh chi trăm năm mọc nơi vách đá sương mù.', { gold: 460, gems: 8, tinh: 12, hoat: 12 }],
    canh_den: ['Dẹp sơn trại Hắc Phong', 'Bọn cướp núi chặn đường thương lái đã ba tháng nay.', { gems: 34, gold: 240, tinh: 25, hoat: 20 }],
    do_rac_mo: ['Dò thám Ma giáo', 'Lần theo dấu huyết ấn, tuyệt đối không để bị phát hiện.', { shards: 3, gold: 280, gems: 10, tinh: 20 }]
  };
  jobs().forEach(j => {
    const b = BOUNTY[j.id];
    if (!b) return;
    j.name = b[0]; j.flavor = b[1]; j.reward = Object.assign({}, b[2]);
  });
  if (typeof claimJob === 'function' && !claimJob.__bounty) {
    const baseClaim = claimJob;
    const wrapped = function bountyClaimJob(jobId) {
      const st = (typeof P === 'object' && P && P.jobs) || {};
      const act = (st.active || []).find(a => a.jobId === jobId);
      const job = jobOf(jobId);
      let mult = 1;
      if (act && job && typeof jobRewardMult === 'function') {
        const q = act.quality || (typeof jobFit === 'function' ? jobFit(job, act.heroIds).grade : '');
        mult = jobRewardMult(q);
      }
      const before = typeof P === 'object' && P ? { gold: P.gold || 0, gems: P.gems || 0, sh: Object.values(P.shards || {}).reduce((t, v) => t + v, 0) } : null;
      const res = baseClaim.apply(this, arguments);
      if (res && res.ok && job && before) {
        const rw = job.reward || {};
        const parts = [];
        const dg = (P.gold || 0) - before.gold, dm = (P.gems || 0) - before.gems;
        const ds = Object.values(P.shards || {}).reduce((t, v) => t + v, 0) - before.sh;
        if (dg > 0) parts.push('🪙 ' + dg);
        if (dm > 0) parts.push('💎 ' + dm);
        if (ds > 0) parts.push(ds + ' mảnh tướng');
        if (rw.tinh) { const v = Math.round(rw.tinh * mult); P.tinh = (P.tinh || 0) + v; parts.push('Tinh ' + v); }
        if (rw.hoat) { const v = Math.round(rw.hoat * mult); P.hoat = (P.hoat || 0) + v; parts.push('Hoạt ' + v); }
        if (parts.length) res.txt = parts.join(' · ');
        save();
      }
      return res;
    };
    wrapped.__bounty = true;
    claimJob = wrapped;
  }
  const state = () => {
    if (typeof P !== 'object' || !P) return { board: [], active: [], rep: 0, perfect: 0 };
    P.jobs = P.jobs || { day: -1, board: [], active: [], rep: 0, perfect: 0 };
    P.jobs.active = P.jobs.active || [];
    P.jobs.board = P.jobs.board || [];
    return P.jobs;
  };
  const heroName = id => {
    try { return DATA.heroes[id].name; } catch (_) { return id; }
  };
  const shortName = id => heroName(id).split(' ').pop();
  const face = id => (typeof heroThumbInline === 'function' ? heroThumbInline(id, 'avatar') : '');
  const initials = id => heroName(id).split(' ').filter(Boolean).slice(-2).map(w => w[0]).join('').toUpperCase();
  const busySet = () => {
    const s = new Set();
    (state().active || []).forEach(a => (a.heroIds || []).forEach(h => s.add(h)));
    return s;
  };
  const rowBox = i => ROWS[i] || [100 + (i - 4) * 24.5, 24.5];

  const RW_KINDS = {
    gold: ['Vàng', 'assets/items/materials/gold.png'],
    gems: ['Ngọc', 'assets/ui/menu-v3233/icons/resource-gem-imagen.png'],
    shards: ['Mảnh tướng', 'assets/result-icons-art/hero-shard-imagen.png'],
    tinh: ['Tinh Lực', 'assets/items/materials/tinh-luc.png'],
    hoat: ['Hoạt Lực', 'assets/items/materials/hoat-luc.png']
  };
  function rewardCell(job) {
    const rw = (job && job.reward) || {};
    const cells = Object.keys(rw).filter(k => RW_KINDS[k] && rw[k] > 0).slice(0, 4).map((k, i) => {
      const [label, img] = RW_KINDS[k];
      return `<span class="hv-job-slot rw r${i}" title="${label}"><img src="${img}" alt=""><em>${fmtN(rw[k])}</em></span>`;
    });
    while (cells.length < 4) cells.push(`<span class="hv-job-slot rw r${cells.length} is-empty" aria-hidden="true"></span>`);
    return cells.join('');
  }


  function heroSlot(jobId, heroId, idx) {
    if (!heroId) return `<button type="button" class="hv-job-slot s${idx} is-empty" data-jslot="${esc(jobId)}" aria-label="Chọn tướng"></button>`;
    return `<button type="button" class="hv-job-slot s${idx}" data-jremove="${esc(jobId)}:${esc(heroId)}" style="${esc(face(heroId))}" title="${esc(heroName(heroId))}" aria-label="Bỏ ${esc(heroName(heroId))}"><em>${esc(shortName(heroId))}</em></button>`;
  }

  function boardRow(job, index) {
    const jid = job.id;
    const act = (state().active || []).find(a => a.jobId === jid);
    const [top, h] = rowBox(index);
    const needs = (job.needNames || []).slice(0, 2).join(' · ');
    if (act) {
      const left = act.hours - jobElapsedH(act);
      const done = left <= 0;
      const q = act.quality || jobFit(job, act.heroIds).grade;
      const crew = (act.heroIds || []).map(shortName).join(' & ');
      const prog = Math.min(100, Math.max(0, (1 - Math.max(0, left) / act.hours) * 100));
      return `<div class="hv-job" style="top:${top}%;height:${h}%">
        <div class="hv-job-name"><span class="jn">${esc(job.name)}</span><em>${esc(crew)}</em></div>
        <div class="hv-job-need">${done ? 'Xong việc' : 'còn ' + fmtLeft(left)}</div>
        <div class="hv-job-bar"><i style="width:${done ? 100 : prog}%"></i><span>${jobQualityLabel({ grade: q })}</span></div>
        <div class="hv-job-slots">${heroSlot(jid, (act.heroIds || [])[0], 0)}${heroSlot(jid, (act.heroIds || [])[1], 1)}${rewardCell(job)}</div>
        <button type="button" class="hv-job-go" data-jclaim="${esc(jid)}" ${done ? '' : 'disabled'}>${done ? 'NHẬN' : 'ĐANG LÀM'}</button>
      </div>`;
    }
    const picks = pick()[jid] || [];
    const fit = jobFit(job, picks);
    const bonus = Math.round((jobRewardMult(fit.grade) - 1) * 100);
    const hrs = jobHoursEff(job, picks.length === 2 ? picks : []);
    return `<div class="hv-job" style="top:${top}%;height:${h}%">
      <div class="hv-job-name"><span class="jn">${esc(job.name)}</span>${bonus ? `<em>+${bonus}%</em>` : ''}</div>
      <div class="hv-job-need">${esc(needs)}</div>
      <div class="hv-job-bar"><i style="width:${(picks.length / 2) * 100}%"></i><span>${picks.length}/2 tướng${picks.length === 2 ? ' · ' + hrs.toFixed(1).replace('.0', '') + 'h' : ''}</span></div>
      <div class="hv-job-slots">${heroSlot(jid, picks[0], 0)}${heroSlot(jid, picks[1], 1)}${rewardCell(job)}</div>
      <button type="button" class="hv-job-go" data-jgo="${esc(jid)}" ${picks.length === 2 ? '' : 'disabled'}>ĐI</button>
    </div>`;
  }

  function activeRow(job, act, index) {
    const [top, h] = rowBox(index);
    const left = act.hours - jobElapsedH(act);
    const done = left <= 0;
    const q = act.quality || jobFit(job, act.heroIds).grade;
    const crew = (act.heroIds || []).map(shortName).join(' & ');
    const prog = Math.min(100, Math.max(0, (1 - Math.max(0, left) / act.hours) * 100));
    return `<div class="hv-job" style="top:${top}%;height:${h}%">
      <div class="hv-job-name"><span class="jn">${esc(job.name)}</span><em>${esc(crew)}</em></div>
      <div class="hv-job-need">${done ? 'Xong việc' : 'còn ' + fmtLeft(left)}</div>
      <div class="hv-job-bar"><i style="width:${done ? 100 : prog}%"></i><span>${jobQualityLabel({ grade: q })}</span></div>
      <div class="hv-job-slots">${heroSlot(job.id, (act.heroIds || [])[0], 0)}${heroSlot(job.id, (act.heroIds || [])[1], 1)}${rewardCell(job)}</div>
      <button type="button" class="hv-job-go" data-jclaim="${esc(job.id)}" ${done ? '' : 'disabled'}>${done ? 'NHẬN' : 'ĐANG LÀM'}</button>
    </div>`;
  }

  function streetRow(index) {
    const [top, h] = rowBox(index);
    const s = (typeof P === 'object' && P && P.social) || {};
    const posts = Math.min(3, Number(s.posts || 0));
    const claimed = !!s.claimed;
    const ok = posts >= 3 && !claimed;
    return `<div class="hv-job" style="top:${top}%;height:${h}%">
      <div class="hv-job-name">Truyền tin giang hồ</div>
      <div class="hv-job-need">Gửi 3 tin</div>
      <div class="hv-job-bar"><i style="width:${(posts / 3) * 100}%"></i><span>${posts}/3 tin</span></div>
      <div class="hv-job-slots"><span class="hv-job-slot s0 is-empty" aria-hidden="true"></span><span class="hv-job-slot s1 is-empty" aria-hidden="true"></span><span class="hv-job-slot s2" title="Thưởng"><img src="assets/items/materials/gold.png" alt=""><em>120</em></span></div>
      <button type="button" class="hv-job-go" data-jobs-street ${ok ? '' : 'disabled'}>${claimed ? 'ĐÃ NHẬN' : 'NHẬN'}</button>
    </div>`;
  }

  function repRows() {
    const rep = Math.max(0, Math.min(100, Number(state().rep || 0)));
    return TIERS.map((t, i) => {
      const [top, h] = rowBox(i);
      const inside = rep >= t.min;
      const state = rep >= t.max ? 'Đã qua' : inside ? 'Đang ở' : 'Chưa tới';
      const span = t.max - t.min;
      const prog = Math.min(100, Math.max(0, ((rep - t.min) / span) * 100));
      return `<div class="hv-job" style="top:${top}%;height:${h}%">
        <div class="hv-job-name">${esc(t.name)}</div>
        <div class="hv-job-need">${t.min}–${t.max} danh vọng</div>
        <div class="hv-job-bar"><i style="width:${inside ? prog : 0}%"></i><span>${rep}/${t.max}</span></div>
        <div class="hv-job-slots"><span class="hv-job-slot s2 ${inside ? '' : 'is-empty'}" title="${esc(state)}"><u>${inside ? '★' : '☆'}</u><em>${esc(state)}</em></span></div>
        <span class="hv-job-go" aria-hidden="true">${esc(state === 'Đang ở' ? 'HIỆN TẠI' : state === 'Đã qua' ? 'XONG' : 'KHÓA')}</span>
      </div>`;
    }).join('');
  }

  function repPanel() {
    const P0 = state();
    const rep = Math.max(0, Math.min(100, Number(P0.rep || 0)));
    const rank = rep >= 30 ? 'Danh chấn giang hồ' : rep >= 15 ? 'Đại hiệp' : rep >= 6 ? 'Thiếu hiệp' : 'Vô danh tiểu tốt';
    root.querySelector('[data-rep-rank]').textContent = rank;
    root.querySelector('[data-rep-num]').textContent = `${rep}/100 danh vọng`;
    root.querySelector('[data-rep-perfect]').textContent = `Hoàn hảo ${Number(P0.perfect || 0)}`;
    root.querySelector('[data-rep-fill]').style.width = rep + '%';
    root.querySelectorAll('.hv-rep-track s').forEach(n => n.remove());
    const track = root.querySelector('.hv-rep-track');
    [20, 40, 60, 80].forEach(v => {
      const t = document.createElement('s');
      t.style.left = v + '%';
      track.append(t);
    });
  }

  function draw() {
    if (!root.classList.contains('is-open')) return;
    if (typeof jobsEnsure === 'function') jobsEnsure();
    root.querySelectorAll('[data-jtab]').forEach(b => b.classList.toggle('is-on', b.getAttribute('data-jtab') === ui.tab));
  root.dataset.jtab = ui.tab;
    const P0 = state();
    let html = '';
    if (ui.tab === 'board') {
      const board = (P0.board || []).map(jobOf).filter(Boolean);
      html = board.map((j, i) => boardRow(j, i)).join('') + streetRow(board.length);
    } else if (ui.tab === 'active') {
      const rows = (P0.active || []).map(a => ({ a, j: jobOf(a.jobId) })).filter(r => r.j);
      html = rows.map((r, i) => activeRow(r.j, r.a, i)).join('')
        || `<div class="hv-empty">Chưa giao việc nào. Sang tab Việc trong ngày để chọn 2 tướng.</div>`;
    } else {
      html = repRows();
    }
    body.innerHTML = html;
    repPanel();
  }

  /* ---- bảng chọn tướng ---- */
  function openPicker(jid) {
    const job = jobOf(jid);
    if (!job) return;
    ui.pick = jid;
    const busy = busySet();
    const chosen = pick()[jid] || [];
    const cand = Object.keys(DATA.heroes || {})
      .filter(x => P.heroes[x] && P.heroes[x].owned && !busy.has(x))
      .sort((a, b) => {
        const af = jobFit(job, [a]).hit, bf = jobFit(job, [b]).hit;
        return bf - af || (typeof heroPower === 'function' ? heroPower(b) - heroPower(a) : 0);
      })
      .slice(0, 18);
    const panel = root.querySelector('[data-pick]');
    panel.innerHTML = `<div class="hv-pick-panel">
      <div class="hv-pick-head"><span>${esc(job.name)}</span><button type="button" data-pick-close aria-label="Đóng">✕</button></div>
      <div class="hv-pick-sub">Cần: ${esc((job.needNames || []).join(' · '))} — đã chọn ${chosen.length}/2</div>
      <div class="hv-pick-grid">${cand.map(id => {
        const m = (job.needs || []).filter(n => jobHeroTags(id).includes(n)).length;
        return `<button type="button" class="hv-pick-face${chosen.includes(id) ? ' is-on' : ''}" data-jpick="${esc(id)}" style="${esc(face(id))}" title="${esc(heroName(id))} · khớp ${m}/${(job.needs || []).length}"><b>${esc(initials(id))}${m ? ' ·' + m : ''}</b></button>`;
      }).join('') || '<div class="hv-empty">Không còn tướng rảnh.</div>'}</div>
    </div>`;
    panel.hidden = false;
  }

  function closePicker(redraw) {
    const panel = root.querySelector('[data-pick]');
    panel.hidden = true;
    panel.innerHTML = '';
    ui.pick = null;
    if (redraw) draw();
  }

  root.addEventListener('click', ev => {
    const t = ev.target.closest('[data-jtab],[data-jgo],[data-jclaim],[data-jslot],[data-jremove],[data-jpick],[data-pick-close],[data-jobs-street]');
    if (!t || !root.contains(t)) return;
    const d = t.dataset;
    if (d.jtab) { ui.tab = d.jtab; closePicker(false); draw(); return; }
    if (d.jslot) { openPicker(d.jslot); return; }
    if (d.jremove) {
      const [jid, hid] = d.jremove.split(':');
      const arr = pick()[jid] = pick()[jid] || [];
      const ix = arr.indexOf(hid);
      if (ix >= 0) arr.splice(ix, 1);
      save(); draw(); return;
    }
    if (d.jpick) {
      const jid = ui.pick;
      const arr = pick()[jid] = pick()[jid] || [];
      const ix = arr.indexOf(d.jpick);
      if (ix >= 0) arr.splice(ix, 1);
      else { if (arr.length >= 2) arr.shift(); arr.push(d.jpick); }
      closePicker(true);
      return;
    }
    if (t.hasAttribute('data-pick-close')) { closePicker(true); return; }
    if (d.jgo) {
      const jid = d.jgo;
      const r = typeof startJob === 'function' ? startJob(jid, pick()[jid] || []) : { ok: false };
      if (!r.ok) { toastMsg(r.msg || 'Không giao được việc.'); return; }
      delete pick()[jid];
      save();
      toastMsg('📦 Đã giao việc · ' + r.label + '!');
      ui.tab = 'active';
      draw();
      return;
    }
    if (d.jclaim) {
      const r = typeof claimJob === 'function' ? claimJob(d.jclaim) : { ok: false };
      if (!r.ok) { toastMsg(r.msg || 'Chưa nhận được.'); return; }
      const q = r.quality === 'perfect' ? ' · ★ Ca hoàn hảo' : r.quality === 'fit' ? ' · ◐ Ca phù hợp' : '';
      toastMsg('✅ ' + r.name + ': +' + r.txt + q + (r.gift ? ' · 🐓 Gà Báo Thức về nhà!' : ''));
      if (typeof refreshResbar === 'function') refreshResbar();
      draw();
      return;
    }
    if (t.hasAttribute('data-jobs-street')) {
      if (typeof socialClaimDaily === 'function' && socialClaimDaily()) {
        save();
        toastMsg('Đã nhận thưởng giao lưu.');
      }
      draw();
    }
  });

  if (typeof renderJobs === 'function') {
    renderJobs = function renderJobsLacquer() { draw(); };
  }

  const syncOpen = name => {
    const open = name === 'jobs';
    root.hidden = !open;
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('jobs-hall-active', open);
    if (open) draw();
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithJobsHall(name) {
    baseShowScreen(name);
    syncOpen(typeof ST === 'object' ? ST.screen : '');
  };

  root.querySelector('[data-jobs-close]').addEventListener('click', () => navTo('hub'));
  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
