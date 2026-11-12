// Owner 2026-11-12: skin Bang Hoi mau A - giay do + danh sach bang dang dai ngang.
// Khong dung MutationObserver (tung gay lap vo han). Ap lai sau showScreen va sau moi lan bam trong man.
(() => {
  if (typeof document === 'undefined') return;
  const root = document.getElementById('hvGuildRoot'); if (!root) return;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const list = () => { try { return typeof GUILDS !== 'undefined' ? GUILDS : []; } catch (_) { return []; } };
  const mine = () => { try { return (typeof myGuild === 'function' && myGuild()) || null; } catch (_) { return null; } };

  const TH = ['vo-duong', 'ho-tran', 'kho-bao', 'bang-chien', 'chien-dich', 'gia-toc'];
  function apply() {
    const hero = root.querySelector('[data-ghero]'), city = root.querySelector('[data-gcity]');
    if (!hero || !city) return;
    root.classList.toggle('gi-joined', !!mine());
    if (mine()) return;
    if (!hero.querySelector('.gi-hero-copy')) {
      hero.innerHTML = `<div class="gi-hero-copy"><div class="gi-kicker">Giang Hồ · Bang Hội</div><div class="nm">Chưa có mái bang</div>
        <div class="sub">Gia nhập một bang để mở Võ Đường, Gia Tộc và Bang Chiến.</div></div>
        <div class="gi-clan"><span>Nhánh trực thuộc</span><b>Gia Tộc</b><small>Mở sau khi vào bang</small></div>`;
    }
    if (!city.querySelector('.gi-row')) {
      city.innerHTML = list().map((g, i) => `<article class="gi-row">
        <img src="assets/ui/guild/tiles/${TH[i % TH.length]}.jpg" alt="">
        <div class="gi-copy"><b>${esc(g.ic || '')} ${esc(g.name)}</b><small>${esc(g.desc || '')}</small></div>
        <button type="button" data-gact="join:${esc(g.id)}">Gia nhập</button>
      </article>`).join('');
    }
  }

  const baseShow = showScreen;
  showScreen = function showScreenGuildInk() {
    baseShow.apply(this, arguments);
    try { if (ST.screen === 'guild') apply(); } catch (_) {}
  };
  root.addEventListener('click', () => setTimeout(apply, 0));
  apply();
  window.HV_GUILD_INK = { apply };
})();
