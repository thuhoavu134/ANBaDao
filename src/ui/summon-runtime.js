(() => {
  if (typeof document === 'undefined' || !document.body) return;
  if (typeof prepareSummonPull !== 'function') return;

  function commitSummon(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    const apply = player => {
      if (next.gems != null) player.gems = next.gems;
      if (next.pity != null) player.pity = next.pity;
      if (next.heroes) player.heroes = next.heroes;
      if (next.shards) player.shards = next.shards;
      if (next.economy) player.economy = next.economy;
      if (next.summonCount != null) player.summonCount = next.summonCount;
      if (next.freePullDay != null) player.freePullDay = next.freePullDay;
      return { ok: true };
    };
    if (!run) {
      apply(P);
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source,
      reason: 'summon',
      mutate: apply
    });
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('vi-VN');
  }

  function dayNow() {
    return typeof today === 'function' ? today() : 0;
  }

  function catalog() {
    return (typeof DATA === 'object' && DATA.heroes) ? DATA.heroes : {};
  }

  function rosterIds() {
    if (typeof OFFICIAL_ROSTER_12_IDS !== 'undefined' && Array.isArray(OFFICIAL_ROSTER_12_IDS)) {
      return OFFICIAL_ROSTER_12_IDS.slice();
    }
    return Object.keys(catalog());
  }

  function openArgs() {
    return {
      heroes: catalog(),
      rosterIds: rosterIds(),
      rng: Math.random.bind(Math),
      day: dayNow(),
      rates: (typeof GACHA === 'object' && GACHA.rates) || GACHA_RATES,
      pityAt: (typeof GACHA === 'object' && GACHA.pityAt) || GACHA_PITY_AT
    };
  }

  function bannerState() {
    const args = openArgs();
    const poolFor = tier => (typeof poolOfCatalog === 'function'
      ? poolOfCatalog(args.rosterIds, args.heroes, tier)
      : (typeof poolOf === 'function' ? poolOf(tier) : []));
    return typeof validateSummonBanner === 'function'
      ? validateSummonBanner(args.rates, poolFor)
      : { ok: true };
  }

  function sparkNow() {
    return Number(P.economy?.spark || 0);
  }

  function pityLeft() {
    const at = (typeof GACHA === 'object' && GACHA.pityAt) || GACHA_PITY_AT;
    return Math.max(0, at - (P.pity || 0));
  }

  function heroName(id) {
    return catalog()[id]?.name || id || 'Kẻ Mất Ngủ';
  }

  function ssrIds() {
    return rosterIds().filter(id => catalog()[id]?.rarity === 'ssr');
  }

  function freeReady() {
    return bannerState().ok && P.freePullDay !== dayNow();
  }

  function msToMidnightLabel() {
    if (typeof msToMidnight === 'function') return msToMidnight();
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    const m = Math.max(0, d - Date.now());
    return Math.floor(m / 3600000) + 'g' + String(Math.floor(m % 3600000 / 60000)).padStart(2, '0') + 'p';
  }

  function paintResults(pulls) {
    const grid = document.querySelector('[data-summon-grid]');
    if (!grid || !Array.isArray(pulls)) return;
    grid.innerHTML = pulls.map((r, i) => {
      const name = heroName(r.id);
      const sub = r.dup ? ('trùng · +' + r.sh + ' mảnh hồn') : '✨ MỚI GIA NHẬP';
      return `<article class="hv-sum-card t-${r.t}" style="animation-delay:${i * 90}ms" data-summon-card="${r.id}">
        <b class="hv-sum-tier">${String(r.t || '').toUpperCase()}</b>
        <span>${name}</span>
        <small>${sub}</small>
      </article>`;
    }).join('');
  }

  function renderLacquer() {
    const screen = document.getElementById('summonScreen');
    const body = document.getElementById('summonBody');
    if (!body) return;
    screen?.classList.add('hv-summon-live');
    const banner = bannerState();
    const at = (typeof GACHA === 'object' && GACHA.pityAt) || GACHA_PITY_AT;
    const left = pityLeft();
    const pct = Math.max(0, Math.min(100, ((at - left) / at) * 100));
    const sparkNeed = (typeof ECON === 'object' && ECON.sparkSelect) || SPARK_SELECT;
    const spark = sparkNow();
    const cost1 = (typeof GACHA === 'object' && GACHA.cost1) || GACHA_COST1;
    const cost10 = (typeof GACHA === 'object' && GACHA.cost10) || GACHA_COST10;
    const locked = !banner.ok;
    const free = freeReady();
    body.innerHTML = `
      <div id="hvSummonRoot" data-testid="hv-summon">
        <div class="hv-sum-top">
          <button type="button" class="hv-sum-back" data-summon-back aria-label="Về Thành Chính">‹</button>
          <b>Gọi Mộng</b>
          <div class="hv-sum-chips">
            <span class="hv-sum-chip" data-summon-gems>💎 ${fmt(P.gems)}</span>
            <span class="hv-sum-chip" data-summon-spark>🕯 ${fmt(spark)}/${sparkNeed}</span>
          </div>
        </div>
        <div class="hv-sum-hero">
          <div class="hv-sum-kicker">Mộng Phố · Linh hồn hội tụ</div>
          <div class="hv-sum-title" data-summon-title>Vòng Gọi Mộng</div>
          <div class="hv-sum-best">SSR 3% · Pity ${at} · ×10 có S+</div>
        </div>
        <div class="hv-sum-panel">
          ${locked ? `<p class="hv-sum-lock" data-summon-lock role="status">Gọi Mộng tạm khóa: danh sách tướng chưa khớp cấu hình triệu hồi. Ngọc, bảo hiểm và lượt miễn phí được giữ nguyên.</p>` : `<p class="hv-sum-copy">Mỗi lượt tăng Hồi Ức. Tướng trùng thành mảnh hồn + Mộng Tủy. Tỉ lệ và pity giữ nguyên.</p>`}
          <div class="hv-sum-meter">
            <div>Còn <b data-summon-pity>${left}</b> lượt nữa chắc chắn SSR</div>
            <i><u style="width:${pct}%"></u></i>
            <small>SSR 3% · SS 9% · S 18% · A 30% · B 40%</small>
          </div>
          <div class="hv-sum-free" data-summon-free>${free ? 'Lượt miễn phí hôm nay đang sẵn sàng.' : (locked ? 'Trạng thái lượt miễn phí được giữ nguyên.' : ('Quay lại sau <b>' + msToMidnightLabel() + '</b>.'))}</div>
          <div class="hv-sum-actions">
            ${free ? `<button type="button" class="hv-sum-btn is-gold" data-summon-pull="free" ${locked ? 'disabled' : ''}>Chiêu mộ miễn phí</button>` : ''}
            <button type="button" class="hv-sum-btn" data-summon-pull="1" ${locked ? 'disabled' : ''}>Gọi ×1 · 💎${cost1}</button>
            <button type="button" class="hv-sum-btn is-gold" data-summon-pull="10" ${locked ? 'disabled' : ''}>Gọi ×10 · 💎${cost10}</button>
          </div>
          <div class="hv-sum-spark">
            <div class="hv-sum-spark-h">🕯 Hồi Ức Tuyển Chọn · ${sparkNeed}</div>
            <small>Không reset theo banner. Đủ mốc thì tự chọn 1 SSR; đã sở hữu → 30 mảnh + 8 Mộng Tủy.</small>
            <div class="hv-sum-picks" data-summon-picks>
              ${ssrIds().map(id => `<button type="button" class="hv-sum-pick" data-summon-pick="${id}" ${spark < sparkNeed ? 'disabled' : ''}>${heroName(id)}</button>`).join('')}
            </div>
          </div>
          <div class="hv-sum-grid" data-summon-grid></div>
        </div>
      </div>`;
    body.querySelector('[data-summon-back]')?.addEventListener('click', () => navTo('hub'));
    body.querySelectorAll('[data-summon-pull]').forEach(btn => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.summonPull;
        if (kind === 'free') honVietSummonPull(1, true);
        else honVietSummonPull(Number(kind), false);
      });
    });
    body.querySelectorAll('[data-summon-pick]').forEach(btn => {
      btn.addEventListener('click', () => honVietSparkSelect(btn.dataset.summonPick));
    });
  }

  function honVietSummonPull(n, free) {
    if (typeof refreshStamina === 'function') refreshStamina();
    const result = prepareSummonPull(P, { n, free, ...openArgs() });
    if (!result.ok) {
      toast?.(result.message);
      return null;
    }
    const cmd = free
      ? ('summon.free:' + result.freePullDay)
      : ('summon.pull:' + n + ':' + (P.summonCount || 0));
    if (commitSummon(result, cmd, free ? 'summon.free' : 'summon.pull').ok) {
      questProgress?.('summon', 1);
      refreshResbar?.();
      if (result.pulls.some(r => r.t === 'ssr')) {
        chatSys?.('Vòng Gọi Mộng loé sáng — một SSR vừa xuất hiện!');
        toast?.('🌟 SSR xuất hiện ×' + result.pulls.filter(r => r.t === 'ssr').length + '!');
      }
      renderSummon();
      paintResults(result.pulls);
      return result.pulls;
    }
    return null;
  }

  function honVietSparkSelect(id) {
    const result = prepareSparkSelect(P, id, { heroes: catalog() });
    if (!result.ok) {
      toast?.(result.message);
      return;
    }
    if (commitSummon(result, 'summon.spark:' + id + ':' + sparkNow(), 'summon.spark').ok) {
      refreshResbar?.();
      toast?.('🕯 ' + heroName(id) + ': ' + result.msg);
      renderSummon();
    }
  }

  const baseDo = typeof doSummon === 'function' ? doSummon : null;
  doSummon = function honVietDoSummon(n, free) {
    const pulls = honVietSummonPull(n, free);
    if (pulls) return pulls;
    return null;
  };

  const baseRender = typeof renderSummon === 'function' ? renderSummon : null;
  renderSummon = function honVietRenderSummon() {
    if (typeof refreshStamina === 'function') refreshStamina();
    renderLacquer();
    if (!document.getElementById('hvSummonRoot') && baseRender) baseRender();
  };

  const baseSpark = typeof sparkSelectHero === 'function' ? sparkSelectHero : null;
  sparkSelectHero = function honVietSparkSelectHero(id) {
    const result = prepareSparkSelect(P, id, { heroes: catalog() });
    if (!result.ok) return { ok: false, msg: result.message };
    if (commitSummon(result, 'summon.spark:' + id + ':' + sparkNow(), 'summon.spark').ok) {
      return { ok: true, msg: result.msg };
    }
    return baseSpark ? baseSpark(id) : { ok: false, msg: result.message };
  };

  const baseUi = typeof doSummonUI === 'function' ? doSummonUI : null;
  doSummonUI = function honVietDoSummonUI(n, free) {
    const pulls = honVietSummonPull(n, free);
    if (pulls) return pulls;
    if (baseUi && !document.getElementById('hvSummonRoot')) return baseUi(n, free);
  };

  window.HonVietSummon = {
    render: renderSummon,
    pull: honVietSummonPull,
    pick: honVietSparkSelect
  };
})();
