/* Owner 07/11: Tran Hinh - tuong dung idle tren 6 be da.
   Thu tu nguon: renderer idle cua man chi tiet -> atlas idle trong runtime-meta.json -> anh tinh cua tuong (khong co idle). */
(() => {
  const live = new Map();
  const metaCache = new Map();
  const imgCache = new Map();
  // renderer nay nhan canvas rieng nen chay duoc nhieu con cung luc (loai dung id co dinh/1 RAF chung)
  function rendererFor(id) {
    const d = {
      ky_van: typeof startKyVanDetailIdle === 'function' ? startKyVanDetailIdle : null,
      tieu_phong: typeof startTieuPhongDetailIdle === 'function' ? startTieuPhongDetailIdle : null,
      hong_thuong: typeof startHongThuongDetailIdle === 'function' ? startHongThuongDetailIdle : null,
      tich_dao: typeof startTichDaoDetailIdle === 'function' ? startTichDaoDetailIdle : null,
      dinh_loi: typeof startOwnerRefreshDetailIdle === 'function' ? cv => startOwnerRefreshDetailIdle('dinh_loi', cv) : null,
      thay_mo: typeof startOwnerRefreshDetailIdle === 'function' ? cv => startOwnerRefreshDetailIdle('thay_mo', cv) : null
    };
    if (d[id]) return d[id];
    if (typeof AUTHORED_DETAIL_IDLE === 'object' && AUTHORED_DETAIL_IDLE[id] && typeof startAuthoredDetailIdle === 'function') return cv => startAuthoredDetailIdle(id, cv);
    return null;
  }
  function loadMeta(id) {
    if (metaCache.has(id)) return metaCache.get(id);
    const slug = id.replace(/_/g, '-');
    // Tướng không có runtime-meta.json (danh sách do build ghi) thì không gọi 404, rơi về ảnh tĩnh như cũ.
    const known = typeof window === 'object' ? window.HV_RUNTIME_META_SLUGS : null;
    if (Array.isArray(known) && !known.includes(slug)) { const none = Promise.resolve(null); metaCache.set(id, none); return none; }
    const pr = fetch('assets/characters/' + slug + '/runtime-meta.json', { cache: 'force-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(m => {
        const c = m && m.clips && m.clips.idle;
        if (!c || !c.pages || !c.pages.length || !c.cellW) return null;
        return { slug, c };
      }).catch(() => null);
    metaCache.set(id, pr);
    return pr;
  }
  function img(src) {
    if (imgCache.has(src)) return imgCache.get(src);
    const im = new Image(); im.decoding = 'async'; im.src = src; imgCache.set(src, im); return im;
  }
  // Atlas idle: ve tung o theo thoi luong rieng cua moi khung
  function atlasPlayer(cv, meta) {
    const c = meta.c, base = 'assets/characters/' + meta.slug + '/';
    const pages = c.pages.map(p => ({ ...p, im: img(base + p.file) }));
    const durs = c.frameDurationsMs && c.frameDurationsMs.length ? c.frameDurationsMs : Array(c.frames).fill((c.durationMs || 2400) / c.frames);
    const total = durs.reduce((a, b) => a + b, 0);
    cv.width = c.cellW; cv.height = c.cellH;
    const g = cv.getContext('2d');
    const t0 = performance.now(); let raf = 0, alive = true;
    const tick = () => {
      if (!alive) return;
      let t = (performance.now() - t0) % total, f = 0;
      while (f < durs.length - 1 && t >= durs[f]) { t -= durs[f]; f++; }
      let pi = 0, local = f;
      while (pi < pages.length - 1 && local >= pages[pi].frames) { local -= pages[pi].frames; pi++; }
      const pg = pages[pi], cols = pg.cols || c.cols;
      if (pg.im.complete && pg.im.naturalWidth) {
        g.clearRect(0, 0, cv.width, cv.height);
        g.drawImage(pg.im, (local % cols) * c.cellW, Math.floor(local / cols) * c.cellH, c.cellW, c.cellH, 0, 0, c.cellW, c.cellH);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return {
      stop: () => { alive = false; cancelAnimationFrame(raf); },
      foot: { x: (c.pivot != null ? c.pivot : c.cellW / 2) / c.cellW, y: (c.foot != null ? c.foot : c.cellH) / c.cellH }
    };
  }
  function footOf(cv) {
    try {
      const w = cv.width, h = cv.height; if (!w || !h) return null;
      const d = cv.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
      for (let y = h - 1; y > h * 0.3; y--) {
        let sx = 0, n = 0;
        for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 140) { sx += x; n++; }
        if (n > w * 0.008) {
          // tam chan = trung vi cot co diem anh trong dai 4% duoi cung (bua/vu khi cham dat khong keo lech)
          // 2 ban chan co the lech cao thap (chan truoc thap hon): lay dai 8% de bat ca 2 chan,
          // tam = trung diem mep trai chan sau va mep phai chan truoc
          const yb = y + 1, ya = Math.max(0, yb - Math.round(h * 0.08));
          let mn = w, mx = -1;
          for (let yy = ya; yy < yb; yy++) for (let x = 0; x < w; x++) if (d[(yy * w + x) * 4 + 3] > 140) { if (x < mn) mn = x; if (x > mx) mx = x; }
          return { x: (mx >= mn ? (mn + mx) / 2 : sx / n) / w, y: yb / h };
        }
      }
    } catch (_) {}
    return null;
  }
  const FOOT = Object.create(null);
  let pendingStarts = 0;
  function staticArt(slot) {
    const u = slot.querySelector('.wunit-art');
    return u && u.getAttribute('src');
  }
  function layer(field) {
    let L = field.querySelector('#hvTeamIdle');
    if (!L) { L = document.createElement('div'); L.id = 'hvTeamIdle'; field.append(L); }
    return L;
  }
  function make(i, id, slot, L) {
    const wrap = document.createElement('div'); wrap.className = 'hv-tidle';
    const cur = { id, wrap, stop: () => {}, foot: null, cv: null, kind: 'wait', tries: 0, h: 0.27, ph: null };
    L.append(wrap); live.set(i, cur);
    // Owner 08/11: tuong hien NGAY bang anh toan than (nhe), idle thay vao khi da san sang - khong de dai trong
    const phSrc = staticArt(slot);
    if (phSrc) { const ph = document.createElement('img'); ph.alt = ''; ph.className = 'hv-tidle-ph'; ph.decoding = 'async'; ph.src = phSrc; wrap.append(ph); cur.ph = ph; }
    const render = rendererFor(id);
    if (render) {
      const cv = document.createElement('canvas'); cv.style.visibility = 'hidden'; wrap.append(cv); cur.cv = cv; cur.kind = 'detail';
      // khoi dong renderer lech nhau theo thu tu -> khong don giai ma 6 bo anh lon vao cung 1 khung hinh
      const delay = 90 * (pendingStarts++);
      setTimeout(() => { pendingStarts = Math.max(0, pendingStarts - 1); if (live.get(i) !== cur) return; try { cur.stop = render(cv) || cur.stop; } catch (_) {} }, delay);
      return;
    }
    loadMeta(id).then(meta => {
      if (live.get(i) !== cur) return;
      if (meta) {
        const cv = document.createElement('canvas'); cv.style.visibility = 'hidden'; wrap.append(cv); cur.cv = cv; cur.kind = 'atlas';
        const pl = atlasPlayer(cv, meta); cur.stop = pl.stop; cur.foot = pl.foot;
        // body = chieu cao than trong o: chuan hoa de cac tuong cung co
        if (meta.c.body) cur.h = 0.27 * meta.c.cellH / meta.c.body * 0.78;
      } else {
        const src = staticArt(slot);
        if (!src) return;
        const im = document.createElement('img'); im.alt = ''; im.className = 'hv-tidle-static';
        im.onload = () => {
          if (live.get(i) !== cur) return;
          // Anh chi la ban than (cut ngang vai) thi giu huy hieu tron, khong dung "dau lo lung" tren be
          let bust = false, fx = 0.5, fy = 0.97;
          try {
            const w = im.naturalWidth, h = im.naturalHeight, c2 = document.createElement('canvas');
            c2.width = w; c2.height = h; const g = c2.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
            const d = g.getImageData(0, 0, w, h).data;
            for (let y = h - 1; y > h * 0.3; y--) {
              let sx = 0, n = 0;
              for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 140) { sx += x; n++; }
              if (n > w * 0.008) { fx = sx / n / w; fy = (y + 1) / h; let m = 0; for (let yy = Math.max(0, y - Math.round(h * 0.06)); yy <= y; yy++) { let k = 0; for (let x = 0; x < w; x++) if (d[(yy * w + x) * 4 + 3] > 140) k++; if (k > m) m = k; } bust = m / w > 0.42; break; }
            }
            // Owner 07/11: tam chan = trung vi cot co diem anh trong dai 10% duoi cung cua dang nguoi
            // (trung vi -> don ganh / vu khi cham dat khong keo lech)
            // 2 ban chan nam o dai 4% duoi cung: tam chan = trung diem mep trai va mep phai cua dai nay
            const yb = Math.round(fy * h), ya = Math.max(0, yb - Math.round(h * 0.04));
            let mn = w, mxx = -1;
            for (let y = ya; y < yb; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 140) { if (x < mn) mn = x; if (x > mxx) mxx = x; }
            if (mxx >= mn) fx = (mn + mxx) / 2 / w;
          } catch (_) {}
          if (bust) { if (cur.ph) { cur.ph.remove(); cur.ph = null; } cur.kind = 'badge'; return; }
          // anh tinh: tam ngang lay giua anh (vu khi chia xuong dat lam lech trung binh hang day)
          if (cur.ph) { cur.ph.remove(); cur.ph = null; }
          wrap.append(im); cur.kind = 'static'; cur.cv = im; cur.foot = { x: fx, y: fy };
        };
        im.src = src;
      }
    });
  }
  function sync() {
    const root = document.getElementById('hvTeamRoot');
    const field = root && root.querySelector('#fieldPrev');
    if (!field || !field.getBoundingClientRect().width) { clearAll(); return; }
    const L = layer(field);
    const lr = L.getBoundingClientRect();
    const slots = [...field.querySelectorAll('.wside.ally .wslot')];
    const seen = new Set();
    slots.forEach((slot, i) => {
      const id = slot.dataset.wid || '';
      let cur = live.get(i);
      if (cur && cur.id !== id) { kill(i); cur = null; }
      // Owner 07/11: man bi ve lai (vd bam Doi goi y) lam wrapper cu bi go khoi DOM -> phai tao lai, neu khong idle bien mat
      if (cur && !cur.wrap.isConnected) { kill(i); cur = null; }
      if (!id) return;
      if (!cur) { make(i, id, slot, L); cur = live.get(i); }
      seen.add(i);
      if (cur.kind === 'badge') { slot.classList.remove('hv-idle-on', 'hv-idle-wait'); cur.wrap.style.opacity = '0'; return; }
      slot.classList.add('hv-idle-wait');
      let el = cur.cv;
      let w0 = el && (el.width || el.naturalWidth), h0 = el && (el.height || el.naturalHeight);
      if (cur.kind === 'detail' && !cur.foot && FOOT[cur.id]) cur.foot = FOOT[cur.id];
      if (cur.kind === 'detail' && w0 && !cur.foot && cur.tries < 40) { cur.tries++; cur.foot = footOf(el); if (cur.foot) FOOT[cur.id] = cur.foot; }
      let foot = cur.foot, usePh = false;
      // canvas idle phai da ve that (co diem anh) moi thay anh cho
      const drawn = !!(w0 && h0 && foot && (cur.kind !== 'detail' || cur.drawn || (cur.drawn = !!footOf(el))));
      if (!drawn) {
        const ph = cur.ph;
        if (!ph || !ph.complete || !ph.naturalWidth) { cur.wrap.style.opacity = '0'; return; }
        el = ph; w0 = ph.naturalWidth; h0 = ph.naturalHeight; foot = { x: 0.5, y: 0.97 }; usePh = true;
      } else if (cur.ph) { cur.ph.remove(); cur.ph = null; if (cur.cv && cur.cv.style) cur.cv.style.visibility = ''; }
      else if (cur.cv && cur.cv.style && cur.cv.style.visibility) cur.cv.style.visibility = '';
      slot.classList.add('hv-idle-on'); slot.classList.remove('hv-idle-wait');
      // Owner 07/11: chan dat dung tam mat dai dat (do tren anh concept, ti le theo be rong anh)
      const PED = [[32.55, 38.17], [32.55, 47.52], [32.55, 57.17], [67.9, 38.17], [67.9, 47.52], [67.9, 57.17]]; // owner 07/11: tam vong vang do tren anh (trung diem trai-phai, tren-duoi)
      const pt = PED[i] || PED[0];
      const bx = lr.width * pt[0] / 100, by = lr.width * 1.4156 * pt[1] / 100;
      const H = lr.width * ((cur.kind === 'static' || usePh) ? 0.24 : cur.h), W = H * w0 / h0;
      Object.assign(cur.wrap.style, {
        width: W.toFixed(1) + 'px', height: H.toFixed(1) + 'px',
        left: (bx - foot.x * W).toFixed(1) + 'px', top: (by - foot.y * H).toFixed(1) + 'px',
        zIndex: String(10 + Math.round(by)), opacity: '1'
      });
    });
    [...live.keys()].forEach(k => { if (!seen.has(k)) kill(k); });
  }
  function kill(k) {
    const c = live.get(k); if (!c) return;
    try { c.stop(); } catch (_) {}
    c.wrap.remove(); live.delete(k);
  }
  function clearAll() { [...live.keys()].forEach(kill); }



  // Owner 08/11: chon tuong la idle hien ngay - goi sync ngay sau moi lan renderTeam (khong cho nhip 250ms)
  function hookRender() {
    if (typeof window.renderTeam !== 'function' || window.renderTeam.__hvIdle) return;
    const orig = window.renderTeam;
    const wrapped = function () { const r = orig.apply(this, arguments); try { sync(); requestAnimationFrame(() => { try { sync(); } catch (_) {} }); } catch (_) {} return r; };
    wrapped.__hvIdle = true;
    window.renderTeam = wrapped;
  }
  // Owner 08/11: nap san idle cua MOI tuong dang so huu ngay sau dang nhap -> len dai/vao tran khong phai cho tai
  let warmed = false;
  function warmAll() {
    if (warmed || typeof P !== 'object' || !P || !P.heroes || typeof DATA !== 'object') return;
    warmed = true;
    const ids = Object.keys(P.heroes).filter(id => P.heroes[id].owned && DATA.heroes[id]);
    let k = 0;
    const step = () => {
      const id = ids[k++]; if (!id) return;
      loadMeta(id).then(meta => {
        if (meta) meta.c.pages.forEach(pg => { const im = img('assets/characters/' + meta.slug + '/' + pg.file); if (im.decode) im.decode().catch(() => {}); });
      }).finally(() => setTimeout(step, 40));
    };
    step(); step(); step();
    // Tuong dung renderer idle rieng (Thay Mo, Dinh Loi, Lang ...): chay thu 1 lan tren canvas an de giai ma
    // san cac trang anh lon -> luc len dai khong bi khung 1-2 giay giai ma anh tren luong chinh
    const det = ids.filter(id => rendererFor(id));
    let j = 0;
    const warmDet = () => {
      const id = det[j++]; if (!id) return;
      let stop = null;
      let cv = null;
      try { cv = document.createElement('canvas'); stop = rendererFor(id)(cv); } catch (_) {}
      setTimeout(() => { try { if (cv && !FOOT[id]) { const f = footOf(cv); if (f) FOOT[id] = f; } } catch (_) {} try { if (typeof stop === 'function') stop(); } catch (_) {} setTimeout(warmDet, 60); }, 450);
    };
    setTimeout(warmDet, 200);
  }
  setInterval(() => { try { hookRender(); warmAll(); } catch (_) {} }, 300);
  setInterval(() => { try { sync(); } catch (_) {} }, 120);
  window.HV_TEAM_IDLE = { sync, clearAll, live };
})();
