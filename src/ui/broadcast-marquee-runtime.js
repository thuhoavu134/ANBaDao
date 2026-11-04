// Owner 2026-11-04: dong chu chay thong bao dung chung toan game.
// - push(text, tone): hien chu chay ngang dau man hinh (hang cho, tung tin mot)
// - announce(event, data): hien ngay cho chinh nguoi choi + gui loa he thong len server (server tu dung cau chu)
(() => {
  if (typeof document === 'undefined' || window.HV_MARQUEE) return;
  const TONE = { ssr: 'ssr', boss_drop: 'boss', bbr_jackpot: 'bbr', enhance: 'enh', net: 'net' };
  const LOCAL = {
    ssr: d => {
      const n = (d.heroes || []).map(x => `<em>【SSR】${esc(x)}</em>`);
      if (n.length === 1) return `✦ Thiên mệnh chiếu rọi! Đại hiệp đã chiêu mộ thành công ${n[0]} — kỳ tài hiếm có, giang hồ chấn động! ✦`;
      if (n.length === 2) return `✦ Song long xuất thế! ${n[0]} và ${n[1]} cùng quy về một mối — vạn hùng cúi đầu, giang hồ dậy sóng! ✦`;
      return `✦ Quần hùng tụ hội! ${n.join(', ')} cùng tề tựu — <b>Thiên Mệnh</b> đã chọn đại hiệp! ✦`;
    },
    boss_drop: d => `✦ Đại hiệp hạ gục ${esc(d.boss || 'Boss')}, nhận được báu vật <em>【${d.rarity === 'legend' ? 'Thần Thoại' : 'Truyền Thuyết'}】${esc(d.item)}</em>! ✦`,
    bbr_jackpot: d => `✦ Vận may tột đỉnh! Đại hiệp quay Bách Bảo Rương trúng <em>${esc(d.prize)}</em>! ✦`,
    enhance: d => `✦ Thần binh hiện thế! Đại hiệp cường hoá <em>${esc(d.item)}</em> lên <b>+${Number(d.level) | 0}</b>! ✦`
  };
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  const bar = document.createElement('div');
  bar.id = 'hvMarquee';
  bar.setAttribute('role', 'status');
  bar.setAttribute('aria-live', 'polite');
  bar.innerHTML = '<i class="hv-mq-l"></i><div class="hv-mq-track"><span class="hv-mq-txt"></span></div><i class="hv-mq-r"></i>';
  document.body.append(bar);
  const txt = bar.querySelector('.hv-mq-txt');
  const track = bar.querySelector('.hv-mq-track');
  const queue = [];
  let running = false;

  function next() {
    const item = queue.shift();
    if (!item) { running = false; bar.classList.remove('on'); return; }
    running = true;
    bar.dataset.tone = item.tone;
    txt.innerHTML = item.html;
    bar.classList.add('on');
    txt.getAnimations().forEach(a => a.cancel());
    requestAnimationFrame(() => {
      const w = track.clientWidth, tw = txt.scrollWidth;
      const dist = w + tw;
      const an = txt.animate([{ transform: `translateX(${w}px)` }, { transform: `translateX(-${tw}px)` }],
        { duration: Math.max(6000, dist / 70 * 1000), iterations: item.loops, easing: 'linear' });
      an.onfinish = () => setTimeout(next, 250);
    });
  }
  function push(html, tone = 'net', loops = 1) {
    if (!html) return;
    if (queue.length > 6) queue.shift();
    queue.push({ html, tone: TONE[tone] || tone, loops });
    if (!running) next();
  }
  function announce(event, data = {}) {
    const fn = LOCAL[event];
    if (!fn) return;
    push(fn(data), event, 2);
    try {
      if (typeof netOnline === 'function' && netOnline() && typeof api === 'function') {
        api('/api/broadcast', 'POST', { event, data }).catch(() => {});
      }
    } catch (_) {}
  }
  window.HV_MARQUEE = { push, announce, esc };

  // tin he thong cua nguoi choi khac (kenh sys tren server)
  let since = Date.now() - 60_000;
  async function pollSys() {
    try {
      if (typeof netOnline !== 'function' || !netOnline() || typeof api !== 'function') return;
      const j = await api('/api/chat?channel=sys&since=' + since);
      since = Math.max(since, j.last || 0);
      const me = (typeof NET === 'object' && NET.user) || '';
      (j.messages || []).forEach(m => { if (m.by !== me) push(esc(m.text).replace(/【([^】]+)】([^—!,]+)/g, '<em>【$1】$2</em>'), (m.meta && m.meta.event) || 'net', 1); });
    } catch (_) {}
  }
  setInterval(pollSys, 8000);

  // ---- 4 su kien ----
  if (typeof doSummon === 'function') {
    const base = doSummon;
    doSummon = function doSummonWithMarquee() {
      const res = base.apply(this, arguments);
      try {
        const ssr = (res || []).filter(r => r.t === 'ssr').map(r => (DATA.heroes[r.id] || {}).name).filter(Boolean);
        if (ssr.length) announce('ssr', { heroes: ssr });
      } catch (_) {}
      return res;
    };
  }
  if (typeof enhanceItem === 'function') {
    const base = enhanceItem;
    enhanceItem = function enhanceItemWithMarquee(uid) {
      const ok = base.apply(this, arguments);
      try {
        const it = ok && (P.inventory || []).find(i => i.uid === uid);
        if (it && it.lvl >= 10) announce('enhance', { item: typeof itemName === 'function' ? itemName(it) : 'Thần binh', level: it.lvl });
      } catch (_) {}
      return ok;
    };
  }
})();
