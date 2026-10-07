(() => {
  if (typeof document === 'undefined' || !document.body) return;
  const slots = typeof ACCOUNT_GEAR_SLOTS !== 'undefined' ? ACCOUNT_GEAR_SLOTS : [];
  const rarOrder = typeof RAR_ORDER === 'object' && RAR_ORDER ? RAR_ORDER : { ssr: 0, ss: 1, s: 2, a: 3, b: 4 };
  const traySize = typeof SMELT_TRAY_SIZE === 'number' ? SMELT_TRAY_SIZE : 8;
  const SMELT_FILTERS = [
    { kind: 'all', label: 'Tất cả' },
    { kind: 'weapon', label: 'Vũ khí' },
    { kind: 'armor', label: 'Giáp' },
    { kind: 'charm', label: 'Phụ kiện' },
    { kind: 'boots', label: 'Giày' }
  ];
  const WHEEL = [
    { key: 'relic', label: 'Bảo Vật', angle: 0, open: 'relic' },
    { key: 'gear', label: 'Trang bị', angle: 33, open: 'board' },
    { key: 'fish', label: 'Đồ Giám Cẩu Cá', angle: 65, open: 'fish' },
    { key: 'pet', label: 'Linh Thú', angle: 98, open: 'pet' },
    { key: 'spirit', label: 'Cửu Ứ Chiến Linh', angle: 131, open: 'spirit' },
    { key: 'divine', label: 'Thần Binh', angle: 164, open: 'divine' },
    { key: 'star', label: 'Tướng Tinh', angle: 196, open: 'star' },
    { key: 'antique', label: 'Cổ Vật', angle: 229, open: 'antique' },
    { key: 'luck', label: 'Tuệ Vận', angle: 262, open: 'luck' },
    { key: 'illusion', label: 'Ảo Hình', angle: 295, open: 'illusion' },
    { key: 'formation', label: 'Quân Trận', angle: 327, open: 'formation' }
  ];

  function spokeIcon(key) {
    return 'assets/ui/account-gear/spokes/' + key + '.jpg';
  }

  const root = document.createElement('div');
  root.id = 'hvGearRoot';
  root.hidden = true;
  root.innerHTML = `
    <section class="hv-gear-screen" data-gear-view="wheel">
      <div class="hv-gear-top"><button type="button" class="hv-gear-back" data-gear-close aria-label="Đóng">‹</button><b>Trợ trận</b><span></span></div>
      <div class="hv-assist-stage">
        <img class="hv-assist-hero" alt="" data-gear-hero>
        <div class="hv-assist-wheel">
          <div class="hv-assist-core">Trợ trận</div>
          ${WHEEL.map(item => `<button type="button" class="hv-assist-spoke${item.open === 'board' ? ' is-on' : ''}${item.open ? '' : ' is-locked'}" data-assist="${item.key}" style="transform:rotate(${item.angle}deg) translate(0, calc(-1 * var(--wheel-r))) rotate(${-item.angle}deg)"><span><img src="${spokeIcon(item.key)}" alt=""></span><small>${item.label}</small></button>`).join('')}
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="board">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <button type="button" class="hv-gear-smelt" data-gear-smelt>Dung luyện</button>
      </div>
      <div class="hv-gear-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Trang Bị: Lv<span data-gear-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-gear-master-progress>0/12</span>
          <i class="hv-gear-master-bar"><b data-gear-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-gear-master-copy>Tất cả trang bị đạt cùng mức độ bồi dưỡng sẽ kích hoạt</p>
        <div class="hv-gear-slots">
          <button type="button" class="hv-gear-slot" data-gear-slot="I" aria-label="Nón"><b class="roman">I</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="II" aria-label="Đai"><b class="roman">II</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="III" aria-label="Dây chuyền"><b class="roman">III</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="IV" aria-label="Nhẫn"><b class="roman">IV</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="V" aria-label="Giáp"><b class="roman">V</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="VI" aria-label="Túi"><b class="roman">VI</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="VII" aria-label="Giày"><b class="roman">VII</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="VIII" aria-label="Khôi"><b class="roman">VIII</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="IX" aria-label="Hộ uyển"><b class="roman">IX</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="X" aria-label="Khăn"><b class="roman">X</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="XI" aria-label="Ngọc bội"><b class="roman">XI</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
          <button type="button" class="hv-gear-slot" data-gear-slot="XII" aria-label="Vũ khí"><b class="roman">XII</b><img alt=""><i class="plus">+</i><small class="lvl" hidden></small></button>
        </div>
        <div class="hv-gear-tab-body" data-gear-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-gear-tab="enhance">Cường hóa</button>
          <button type="button" data-gear-tab="wear">Trang bị</button>
        </div>
      </div>
      <div class="hv-gear-picker" data-gear-picker>
        <div class="hv-gear-sheet">
          <h3>Mặc trang bị</h3>
          <p>Hãy chọn trang bị trong danh sách</p>
          <div data-gear-choices></div>
          <button type="button" data-gear-picker-close>Đóng</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen hv-smelt-screen" data-gear-view="smelt">
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-board aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/tinh-luc.png" alt=""><b data-gear-tinh>0</b></span>
        </div>
        <span class="hv-gear-smelt">Dung luyện</span>
      </div>
      <div class="hv-smelt-body">
        <h2 class="hv-gear-title">Chọn trang bị</h2>
        <div class="hv-smelt-tray" data-smelt-tray></div>
        <p class="hv-smelt-gain" data-smelt-gain></p>
        <div class="hv-smelt-filters">
          ${SMELT_FILTERS.map(item => `<button type="button" data-smelt-kind="${item.kind}">${item.label}</button>`).join('')}
        </div>
        <div class="hv-smelt-bag" data-smelt-bag></div>
      </div>
      <div class="hv-smelt-foot">
        <div class="hv-gear-actions" data-smelt-actions></div>
        <div class="hv-gear-tabs">
          <button type="button" data-smelt-tab="smelt">Dung luyện</button>
          <button type="button" data-smelt-tab="enhance">Cường hóa</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="relic">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
        <div class="hv-relic-cols">
          <div class="hv-relic-col" data-relic-col="left"></div>
          <div class="hv-relic-col" data-relic-col="right"></div>
        </div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <span></span>
      </div>
      <div class="hv-gear-panel hv-relic-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Bảo Vật: Lv<span data-relic-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-relic-master-progress>0/1</span>
          <i class="hv-gear-master-bar"><b data-relic-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-relic-master-copy>Tất cả bảo vật đạt cùng cấp sẽ kích hoạt</p>
        <div class="hv-gear-tab-body" data-relic-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-relic-tab="enhance">Cường hóa</button>
          <button type="button" data-relic-tab="codex">Đồ giám</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="pet">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
        <div class="hv-pet-cols">
          <div class="hv-pet-col" data-pet-col="left"></div>
          <div class="hv-pet-col" data-pet-col="right"></div>
        </div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <span></span>
      </div>
      <div class="hv-gear-panel hv-pet-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Linh Thú: Lv<span data-pet-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-pet-master-progress>0/1</span>
          <i class="hv-gear-master-bar"><b data-pet-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-pet-master-copy>Tất cả linh thú đạt cùng cấp sẽ kích hoạt</p>
        <div class="hv-gear-tab-body" data-pet-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-pet-tab="enhance">Cường hóa</button>
          <button type="button" data-pet-tab="deploy">Xuất chiến</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="spirit">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
        <div class="hv-spirit-grid" data-spirit-grid></div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <span></span>
      </div>
      <div class="hv-gear-panel hv-spirit-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Chiến Linh: Lv<span data-spirit-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-spirit-master-progress>0/1</span>
          <i class="hv-gear-master-bar"><b data-spirit-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-spirit-master-copy>Tất cả chiến linh đạt cùng cấp sẽ kích hoạt</p>
        <div class="hv-spirit-loadout" data-spirit-loadout></div>
        <div class="hv-gear-tab-body" data-spirit-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-spirit-tab="enhance">Cường hóa</button>
          <button type="button" data-spirit-tab="slot">An vị</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="divine">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
        <div class="hv-divine-grid" data-divine-grid></div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <span></span>
      </div>
      <div class="hv-gear-panel hv-divine-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Thần Binh: Lv<span data-divine-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-divine-master-progress>0/1</span>
          <i class="hv-gear-master-bar"><b data-divine-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-divine-master-copy>Tất cả thần binh đạt cùng cấp sẽ kích hoạt</p>
        <div class="hv-gear-tab-body" data-divine-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-divine-tab="enhance">Cường hóa</button>
          <button type="button" data-divine-tab="codex">Đồ giám</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="star">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
        <div class="hv-star-grid" data-star-grid></div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><b data-star-shards>0</b> mảnh</span>
        </div>
        <span></span>
      </div>
      <div class="hv-gear-panel hv-star-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Tướng Tinh: ★<span data-star-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-star-master-progress>0/1</span>
          <i class="hv-gear-master-bar"><b data-star-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-star-master-copy>Mỗi sao tăng 12% chỉ số gốc của tướng đó</p>
        <div class="hv-gear-tab-body" data-star-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-star-tab="enhance">Thăng sao</button>
          <button type="button" data-star-tab="codex">Đồ giám</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="antique">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
        <div class="hv-antique-grid" data-antique-grid></div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <span></span>
      </div>
      <div class="hv-gear-panel hv-antique-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Cổ Vật: Lv<span data-antique-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-antique-master-progress>0/1</span>
          <i class="hv-gear-master-bar"><b data-antique-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-antique-master-copy>Tất cả cổ vật đạt cùng cấp sẽ kích hoạt</p>
        <div class="hv-gear-tab-body" data-antique-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-antique-tab="enhance">Cường hóa</button>
          <button type="button" data-antique-tab="slot">An vị</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="luck">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
        <div class="hv-luck-row" data-luck-row></div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <span></span>
      </div>
      <div class="hv-gear-panel hv-luck-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Tuệ Vận: Lv<span data-luck-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-luck-master-progress>0/1</span>
          <i class="hv-gear-master-bar"><b data-luck-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-luck-master-copy>Tất cả vận đạt cùng cấp sẽ kích hoạt</p>
        <div class="hv-gear-tab-body" data-luck-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-luck-tab="enhance">Cường hóa</button>
          <button type="button" data-luck-tab="slot">Chọn vận</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="illusion">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
        <div class="hv-illusion-grid" data-illusion-grid></div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <span></span>
      </div>
      <div class="hv-gear-panel hv-illusion-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Ảo Hình: Lv<span data-illusion-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-illusion-master-progress>0/1</span>
          <i class="hv-gear-master-bar"><b data-illusion-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-illusion-master-copy>Tất cả ảo hình đạt cùng cấp sẽ kích hoạt</p>
        <div class="hv-illusion-loadout" data-illusion-loadout></div>
        <div class="hv-gear-tab-body" data-illusion-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-illusion-tab="enhance">Cường hóa</button>
          <button type="button" data-illusion-tab="slot">An vị</button>
        </div>
      </div>
    </section>
    <section class="hv-gear-screen" data-gear-view="fish">
      <div class="hv-gear-stage">
        <img class="hv-gear-hero" alt="" data-gear-hero>
        <div class="hv-gear-float" data-gear-float hidden></div>
        <div class="hv-fish-grid" data-fish-grid></div>
      </div>
      <div class="hv-gear-top">
        <button type="button" class="hv-gear-back" data-gear-wheel aria-label="Quay lại">‹</button>
        <div class="hv-gear-chips">
          <span class="hv-gear-chip"><img src="assets/items/materials/gold.png" alt=""><b data-gear-gold>0</b></span>
          <span class="hv-gear-chip"><img src="assets/items/materials/hoat-luc.png" alt=""><b data-gear-hoat>0</b></span>
        </div>
        <span></span>
      </div>
      <div class="hv-gear-panel hv-fish-panel">
        <div class="hv-gear-power" data-gear-power></div>
        <h2 class="hv-gear-title">Bậc Thầy Cẩu Cá: Lv<span data-fish-master>0</span></h2>
        <div class="hv-gear-master-track">
          <span data-fish-master-progress>0/1</span>
          <i class="hv-gear-master-bar"><b data-fish-master-fill></b></i>
        </div>
        <p class="hv-gear-copy" data-fish-master-copy>Tất cả cá đạt cùng cấp sẽ kích hoạt</p>
        <div class="hv-gear-tab-body" data-fish-tab-body></div>
        <div class="hv-gear-tabs">
          <button type="button" data-fish-tab="cast">Câu</button>
          <button type="button" data-fish-tab="codex">Đồ giám</button>
        </div>
      </div>
    </section>
  `;
  document.body.append(root);

  const relics = typeof ACCOUNT_RELICS !== 'undefined' ? ACCOUNT_RELICS : [];
  const relicSets = typeof RELIC_SETS !== 'undefined' ? RELIC_SETS : [];
  const relicMax = typeof RELIC_MAX_LEVEL === 'number' ? RELIC_MAX_LEVEL : 15;
  const pets = typeof ACCOUNT_PETS !== 'undefined' ? ACCOUNT_PETS : [];
  const petMax = typeof PET_MAX_LEVEL === 'number' ? PET_MAX_LEVEL : 15;
  const spirits = typeof ACCOUNT_SPIRITS !== 'undefined' ? ACCOUNT_SPIRITS : [];
  const spiritSets = typeof SPIRIT_SETS !== 'undefined' ? SPIRIT_SETS : [];
  const spiritMax = typeof SPIRIT_MAX_LEVEL === 'number' ? SPIRIT_MAX_LEVEL : 15;
  const divines = typeof ACCOUNT_DIVINES !== 'undefined' ? ACCOUNT_DIVINES : [];
  const divineMax = typeof DIVINE_MAX_LEVEL === 'number' ? DIVINE_MAX_LEVEL : 15;
  const starIds = typeof STAR_ROSTER_IDS !== 'undefined' ? STAR_ROSTER_IDS : (typeof OFFICIAL_ROSTER_12_IDS !== 'undefined' ? OFFICIAL_ROSTER_12_IDS : []);
  const starMax = typeof STAR_MAX === 'number' ? STAR_MAX : 6;
  const antiques = typeof ACCOUNT_ANTIQUES !== 'undefined' ? ACCOUNT_ANTIQUES : [];
  const antiqueMax = typeof ANTIQUE_MAX_LEVEL === 'number' ? ANTIQUE_MAX_LEVEL : 15;
  const lucks = typeof ACCOUNT_LUCKS !== 'undefined' ? ACCOUNT_LUCKS : [];
  const luckMax = typeof LUCK_MAX_LEVEL === 'number' ? LUCK_MAX_LEVEL : 15;
  const illusions = typeof ACCOUNT_ILLUSIONS !== 'undefined' ? ACCOUNT_ILLUSIONS : [];
  const illusionMax = typeof ILLUSION_MAX_LEVEL === 'number' ? ILLUSION_MAX_LEVEL : 15;
  const fishes = typeof ACCOUNT_FISHES !== 'undefined' ? ACCOUNT_FISHES : [];
  const state = { view: 'wheel', tab: 'enhance', slot: 'I', picker: null, smeltTab: 'smelt', smeltKind: 'all', smeltPicks: [], relic: relics[0]?.id || 'trong-dong', relicTab: 'enhance', pet: pets[0]?.id || 'kim-quy', petTab: 'enhance', spirit: spirits[0]?.id || 'son-tinh', spiritTab: 'enhance', divine: divines[0]?.id || 'cam-quan', divineTab: 'enhance', star: starIds[0] || 'ong_hang_pho', starTab: 'enhance', antique: antiques[0]?.id || 'bia-tien-si', antiqueTab: 'enhance', luck: lucks[0]?.id || 'van-phu', luckTab: 'enhance', illusion: illusions[0]?.id || 'hon-trang', illusionTab: 'enhance', fish: fishes[0]?.id || 'ca-loc', fishTab: 'cast', lastFish: null };

  function leadId() {
    return P?.squad?.[0]?.id || Object.keys(P?.heroes || {}).find(id => P.heroes[id]?.owned) || null;
  }
  function portrait() {
    const id = leadId();
    if (!id || typeof portraitSrc !== 'function') return '';
    return portraitSrc(id, 'master') || portraitSrc(id, 'card') || portraitSrc(id, 'avatar') || '';
  }
  function board() {
    P.gear = normalizeAccountGear(P.gear);
    return P.gear;
  }
  function itemOf(uid) {
    return (P.inventory || []).find(item => item.uid === uid) || null;
  }
  function selectedItem() {
    return itemOf(board()[state.slot]);
  }
  function artFor(item) {
    return globalThis.honVietEquipmentAssetFor?.(item) || 'assets/ui/menu-v3233/icons/forge.png';
  }
  function commit(gear, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) { P.gear = gear; persist?.(); return { ok: true }; }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-gear',
      mutate: player => { player.gear = gear; return { ok: true }; }
    });
  }
  function bonus() {
    return accountGearBonus(board(), P.inventory || [], {
      statMap: DATA?.items?.statMap || { weapon: 'atk', armor: 'hp', charm: 'def', boots: 'spd' },
      itemStat: typeof itemStat === 'function' ? itemStat : (() => 0)
    });
  }
  function relicBoard() {
    P.relics = typeof normalizeAccountRelics === 'function' ? normalizeAccountRelics(P.relics) : (P.relics || {});
    return P.relics;
  }
  function relicBonus() {
    return typeof accountRelicBonus === 'function' ? accountRelicBonus(relicBoard()) : { hp: 0, atk: 0, def: 0, spd: 0 };
  }
  function petBoard() {
    P.pets = typeof normalizeAccountPets === 'function' ? normalizeAccountPets(P.pets) : (P.pets || {});
    return P.pets;
  }
  function petBonus() {
    return typeof accountPetBonus === 'function' ? accountPetBonus(petBoard()) : { hp: 0, atk: 0, def: 0, spd: 0 };
  }
  function selectedPet() {
    return (typeof findAccountPet === 'function' ? findAccountPet(state.pet) : null) || pets[0] || null;
  }
  function spiritBoard() {
    P.spirits = typeof normalizeAccountSpirits === 'function' ? normalizeAccountSpirits(P.spirits) : (P.spirits || {});
    return P.spirits;
  }
  function spiritBonus() {
    return typeof accountSpiritBonus === 'function' ? accountSpiritBonus(spiritBoard()) : { hp: 0, atk: 0, def: 0, spd: 0 };
  }
  function selectedSpirit() {
    return (typeof findAccountSpirit === 'function' ? findAccountSpirit(state.spirit) : null) || spirits[0] || null;
  }
  function commitSpirits(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) {
      P.spirits = next.spirits;
      if (next.gold != null) P.gold = next.gold;
      if (next.hoat != null) P.hoat = next.hoat;
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-spirits',
      mutate: player => {
        player.spirits = next.spirits;
        if (next.gold != null) player.gold = next.gold;
        if (next.hoat != null) player.hoat = next.hoat;
        return { ok: true };
      }
    });
  }
  function divineBoard() {
    P.divines = typeof normalizeAccountDivines === 'function' ? normalizeAccountDivines(P.divines) : (P.divines || {});
    return P.divines;
  }
  function divineBonus() {
    return typeof accountDivineBonus === 'function' ? accountDivineBonus(divineBoard()) : { hp: 0, atk: 0, def: 0, spd: 0 };
  }
  function selectedDivine() {
    return (typeof findAccountDivine === 'function' ? findAccountDivine(state.divine) : null) || divines[0] || null;
  }
  function commitDivines(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) {
      P.divines = next.divines;
      if (next.gold != null) P.gold = next.gold;
      if (next.hoat != null) P.hoat = next.hoat;
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-divines',
      mutate: player => {
        player.divines = next.divines;
        if (next.gold != null) player.gold = next.gold;
        if (next.hoat != null) player.hoat = next.hoat;
        return { ok: true };
      }
    });
  }
  function commitPets(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) {
      P.pets = next.pets;
      if (next.gold != null) P.gold = next.gold;
      if (next.hoat != null) P.hoat = next.hoat;
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-pets',
      mutate: player => {
        player.pets = next.pets;
        if (next.gold != null) player.gold = next.gold;
        if (next.hoat != null) player.hoat = next.hoat;
        return { ok: true };
      }
    });
  }
  function selectedRelic() {
    return (typeof findAccountRelic === 'function' ? findAccountRelic(state.relic) : null) || relics[0] || null;
  }
  function commitRelics(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) {
      P.relics = next.relics;
      P.gold = next.gold;
      P.hoat = next.hoat;
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-relics',
      mutate: player => {
        player.relics = next.relics;
        player.gold = next.gold;
        player.hoat = next.hoat;
        return { ok: true };
      }
    });
  }
  function teamHp() {
    return (typeof normalizeSquad === 'function' ? normalizeSquad(P.squad, P, true) : (P.squad || []))
      .reduce((sum, pick) => sum + (typeof heroStats === 'function' ? heroStats(pick.id).hp : 0), 0);
  }
  function fillChips() {
    root.querySelectorAll('[data-gear-gold]').forEach(node => { node.textContent = Number(P.gold || 0).toLocaleString('vi-VN'); });
    root.querySelectorAll('[data-gear-hoat]').forEach(node => { node.textContent = Number(P.hoat || 0).toLocaleString('vi-VN'); });
    root.querySelectorAll('[data-gear-tinh]').forEach(node => { node.textContent = Number(P.tinh || 0).toLocaleString('vi-VN'); });
    root.querySelectorAll('[data-star-shards]').forEach(node => { node.textContent = Number((P.shards || {})[state.star] || 0).toLocaleString('vi-VN'); });
  }
  function commitStars(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) {
      P.heroes = next.heroes;
      P.shards = next.shards;
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-stars',
      mutate: player => {
        player.heroes = next.heroes;
        player.shards = next.shards;
        return { ok: true };
      }
    });
  }
  function antiqueBoard() {
    P.antiques = typeof normalizeAccountAntiques === 'function' ? normalizeAccountAntiques(P.antiques) : (P.antiques || emptyAccountAntiques?.() || { equipped: null, levels: {} });
    return P.antiques;
  }
  function antiqueBonus() {
    return typeof accountAntiqueBonus === 'function' ? accountAntiqueBonus(antiqueBoard()) : { hp: 0, atk: 0, def: 0, spd: 0 };
  }
  function selectedAntique() {
    return (typeof findAccountAntique === 'function' ? findAccountAntique(state.antique) : null) || antiques[0] || null;
  }
  function commitAntiques(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) {
      P.antiques = next.antiques;
      if (next.gold != null) P.gold = next.gold;
      if (next.hoat != null) P.hoat = next.hoat;
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-antiques',
      mutate: player => {
        player.antiques = next.antiques;
        if (next.gold != null) player.gold = next.gold;
        if (next.hoat != null) player.hoat = next.hoat;
        return { ok: true };
      }
    });
  }
  function luckBoard() {
    P.luck = typeof normalizeAccountLuck === 'function' ? normalizeAccountLuck(P.luck) : (P.luck || { chosen: null, levels: {} });
    return P.luck;
  }
  function luckBonus() {
    return typeof accountLuckBonus === 'function' ? accountLuckBonus(luckBoard()) : { hp: 0, atk: 0, def: 0, spd: 0 };
  }
  function selectedLuck() {
    return (typeof findAccountLuck === 'function' ? findAccountLuck(state.luck) : null) || lucks[0] || null;
  }
  function commitLuck(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) {
      P.luck = next.luck;
      if (next.gold != null) P.gold = next.gold;
      if (next.hoat != null) P.hoat = next.hoat;
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-luck',
      mutate: player => {
        player.luck = next.luck;
        if (next.gold != null) player.gold = next.gold;
        if (next.hoat != null) player.hoat = next.hoat;
        return { ok: true };
      }
    });
  }
  function illusionBoard() {
    P.illusions = typeof normalizeAccountIllusions === 'function' ? normalizeAccountIllusions(P.illusions) : (P.illusions || { slots: [null, null], levels: {} });
    return P.illusions;
  }
  function illusionBonus() {
    return typeof accountIllusionBonus === 'function' ? accountIllusionBonus(illusionBoard()) : { hp: 0, atk: 0, def: 0, spd: 0 };
  }
  function selectedIllusion() {
    return (typeof findAccountIllusion === 'function' ? findAccountIllusion(state.illusion) : null) || illusions[0] || null;
  }
  function commitIllusions(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) {
      P.illusions = next.illusions;
      if (next.gold != null) P.gold = next.gold;
      if (next.hoat != null) P.hoat = next.hoat;
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-illusions',
      mutate: player => {
        player.illusions = next.illusions;
        if (next.gold != null) player.gold = next.gold;
        if (next.hoat != null) player.hoat = next.hoat;
        return { ok: true };
      }
    });
  }
  function fishBoard() {
    P.fish = typeof normalizeAccountFish === 'function' ? normalizeAccountFish(P.fish) : (P.fish || {});
    return P.fish;
  }
  function fishBonus() {
    return typeof accountFishBonus === 'function' ? accountFishBonus(fishBoard()) : { hp: 0, atk: 0, def: 0, spd: 0 };
  }
  function selectedFish() {
    return (typeof findAccountFish === 'function' ? findAccountFish(state.fish) : null) || fishes[0] || null;
  }
  function commitFish(next, commandId, source) {
    const run = typeof hvRunCommittedTransaction === 'function' ? hvRunCommittedTransaction : null;
    if (!run) {
      P.fish = next.fish;
      if (next.gold != null) P.gold = next.gold;
      if (next.hoat != null) P.hoat = next.hoat;
      persist?.();
      return { ok: true };
    }
    return run({
      commandId: commandId || (source + ':' + (P.revision || 0)),
      source, reason: 'account-fish',
      mutate: player => {
        player.fish = next.fish;
        if (next.gold != null) player.gold = next.gold;
        if (next.hoat != null) player.hoat = next.hoat;
        return { ok: true };
      }
    });
  }
  function isWornUid(uid) {
    if (Object.values(board()).includes(uid)) return true;
    return Object.values(P.equip || {}).some(links => Object.values(links || {}).includes(uid));
  }
  function itemCell(item, selected) {
    if (!item) return '<span class="hv-smelt-cell is-empty"><i class="plus">+</i></span>';
    const name = typeof itemName === 'function' ? itemName(item) : item.slot;
    const worn = isWornUid(item.uid) ? '<em>Mặc</em>' : '';
    return `<button type="button" class="hv-smelt-cell rar-${item.rar || 'b'}${selected ? ' is-on' : ''}" data-smelt-item="${item.uid}" aria-label="${name}"><img src="${artFor(item)}" alt=""><small class="lvl">+${item.lvl}</small>${worn}</button>`;
  }

  function renderWheel() {
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); img.alt = DATA?.heroes?.[leadId()]?.name || ''; });
  }

  function renderBoard() {
    const gear = board();
    const master = accountGearMasterLevel(gear, P.inventory || []);
    const progress = typeof accountGearMasterProgress === 'function'
      ? accountGearMasterProgress(gear, P.inventory || [])
      : { level: master, next: master + 1, ready: 0, need: 12, active: master > 0 };
    const masterAdd = typeof accountGearMasterBonus === 'function'
      ? accountGearMasterBonus(master)
      : { hp: 0, atk: 0, def: 0, spd: 0 };
    root.querySelector('[data-gear-master]').textContent = String(master);
    const progressLabel = root.querySelector('[data-gear-master-progress]');
    if (progressLabel) {
      progressLabel.textContent = progress.level + '/' + progress.next;
    }
    const fill = root.querySelector('[data-gear-master-fill]');
    if (fill) {
      const pct = progress.next ? Math.round((progress.level / progress.next) * 100) : 0;
      fill.style.width = pct + '%';
    }
    const copy = root.querySelector('[data-gear-master-copy]');
    if (copy) {
      copy.textContent = progress.active
        ? ('Đã kích hoạt · HP +' + masterAdd.hp + ' · Công +' + masterAdd.atk + ' · Thủ +' + masterAdd.def + ' · Tốc +' + masterAdd.spd)
        : ('Tất cả trang bị đạt +' + progress.next + ' sẽ kích hoạt (' + progress.ready + '/' + progress.need + ')');
    }
    fillChips();
    const power = typeof teamPower === 'function' ? teamPower() : 0;
    root.querySelector('[data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + power.toLocaleString('vi-VN');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    for (const slot of slots) {
      const button = root.querySelector('[data-gear-slot="' + slot.id + '"]');
      if (!button) continue;
      const item = itemOf(gear[slot.id]);
      button.classList.toggle('is-on', state.slot === slot.id);
      button.classList.toggle('is-empty', !item);
      button.classList.remove('rar-ssr', 'rar-ss', 'rar-s', 'rar-a', 'rar-b');
      if (item?.rar) button.classList.add('rar-' + item.rar);
      const img = button.querySelector('img');
      const lvl = button.querySelector('.lvl');
      const plus = button.querySelector('.plus');
      img.hidden = !item;
      plus.hidden = !!item;
      if (item) {
        img.src = artFor(item);
        img.alt = typeof itemName === 'function' ? itemName(item) : slot.name;
        lvl.hidden = false;
        lvl.textContent = '+' + item.lvl;
      } else {
        img.removeAttribute('src');
        img.alt = '';
        lvl.hidden = true;
      }
    }
    root.querySelectorAll('[data-gear-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.gearTab === state.tab));
    const body = root.querySelector('[data-gear-tab-body]');
    const item = selectedItem();
    const add = bonus();
    if (state.tab === 'wear') {
      body.innerHTML = `<div class="hv-gear-stats">
        <div>HP <b>${Number(add.hp).toLocaleString('vi-VN')}</b></div><div>Tấn công <b>${Number(add.atk).toLocaleString('vi-VN')}</b></div>
        <div>Vật thủ <b>${Number(add.def).toLocaleString('vi-VN')}</b></div><div>Tốc <b>${Number(add.spd).toLocaleString('vi-VN')}</b></div>
      </div><p class="hv-gear-copy">Buff thuộc tính có hiệu lực với toàn thể tướng</p>
      <div class="hv-gear-actions"><button type="button" class="ghost" data-gear-unequip-all>Tháo nhanh</button><button type="button" data-gear-equip-all>Mặc nhanh</button></div>`;
    } else {
      const cost = item && typeof enhCost === 'function' ? enhCost(item) : { gold: 0, hoat: 0 };
      const now = teamHp();
      let next = now;
      if (item && item.lvl < 15) {
        try { item.lvl += 1; next = teamHp(); } finally { item.lvl -= 1; }
      }
      body.innerHTML = `<div class="hv-gear-cost"><span>Lv ${item ? item.lvl : 0} → ${item ? Math.min(15, item.lvl + 1) : 1}</span><span>HP ${now} → ${next}</span></div>
        <div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">${cost.gold}</span><span><img src="assets/items/materials/hoat-luc.png" alt="">${cost.hoat}</span></div>
        <div class="hv-gear-actions"><button type="button" data-gear-enhance ${item && item.lvl < 15 ? '' : 'disabled'}>Cường hóa</button><button type="button" data-gear-enhance-all ${item ? '' : 'disabled'}>Cường hóa nhanh</button></div>`;
    }
  }

  function renderSmelt() {
    fillChips();
    const smelting = state.smeltTab !== 'enhance';
    const bag = smelting
      ? smeltCandidates(P, { kind: state.smeltKind })
      : (P.inventory || []).filter(item => item && Number.isSafeInteger(item.uid) && (!state.smeltKind || state.smeltKind === 'all' || item.slot === state.smeltKind));
    const picks = state.smeltPicks.map(uid => itemOf(uid)).filter(Boolean);
    state.smeltPicks = picks.map(item => item.uid);
    const tray = root.querySelector('[data-smelt-tray]');
    const cells = [];
    for (let index = 0; index < traySize; index++) {
      const item = picks[index];
      cells.push(item
        ? `<button type="button" class="hv-smelt-cell is-on rar-${item.rar || 'b'}" data-smelt-item="${item.uid}"><img src="${artFor(item)}" alt=""><small class="lvl">+${item.lvl}</small></button>`
        : '<span class="hv-smelt-cell is-empty"><i class="plus">+</i></span>');
    }
    tray.innerHTML = cells.join('');
    const quoted = smelting && picks.length ? prepareSmeltSelection(P, state.smeltPicks) : null;
    root.querySelector('[data-smelt-gain]').textContent = quoted?.ok ? ('Nhận +' + quoted.gain + ' Tinh Lực') : '';
    root.querySelectorAll('[data-smelt-kind]').forEach(button => button.classList.toggle('is-on', button.dataset.smeltKind === state.smeltKind));
    const bagBox = root.querySelector('[data-smelt-bag]');
    const selected = new Set(state.smeltPicks);
    const shown = bag.map(item => itemCell(item, selected.has(item.uid)));
    while (shown.length < 16) shown.push('<span class="hv-smelt-cell is-empty"></span>');
    bagBox.innerHTML = shown.join('');
    root.querySelectorAll('[data-smelt-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.smeltTab === state.smeltTab));
    root.querySelector('[data-smelt-actions]').innerHTML = smelting
      ? '<button type="button" class="ghost" data-smelt-once>Dung luyện x1</button><button type="button" data-smelt-all>Dung luyện</button>'
      : '<button type="button" class="ghost" data-smelt-enhance>Cường hóa x1</button><button type="button" data-smelt-enhance-all>Cường hóa nhanh</button>';
  }

  function statLine(stats) {
    return 'HP +' + Number(stats.hp || 0).toLocaleString('vi-VN')
      + ' · Công +' + Number(stats.atk || 0).toLocaleString('vi-VN')
      + ' · Thủ +' + Number(stats.def || 0).toLocaleString('vi-VN')
      + ' · Tốc +' + Number(stats.spd || 0).toLocaleString('vi-VN');
  }

  function renderRelic() {
    const boardState = relicBoard();
    const catalog = relics.slice().sort((a, b) => a.column === b.column ? a.order - b.order : (a.column === 'left' ? -1 : 1));
    const master = typeof accountRelicMasterLevel === 'function' ? accountRelicMasterLevel(boardState) : 0;
    const progress = typeof accountRelicMasterProgress === 'function'
      ? accountRelicMasterProgress(boardState)
      : { level: master, next: master + 1, ready: 0, need: 8, active: master > 0 };
    const masterAdd = typeof accountRelicMasterBonus === 'function' ? accountRelicMasterBonus(master) : { hp: 0, atk: 0, def: 0, spd: 0 };
    fillChips();
    root.querySelector('[data-gear-view="relic"] [data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + (typeof teamPower === 'function' ? teamPower() : 0).toLocaleString('vi-VN');
    root.querySelector('[data-relic-master]').textContent = String(master);
    root.querySelector('[data-relic-master-progress]').textContent = progress.level + '/' + progress.next;
    const fill = root.querySelector('[data-relic-master-fill]');
    if (fill) fill.style.width = (progress.next ? Math.round((progress.level / progress.next) * 100) : 0) + '%';
    root.querySelector('[data-relic-master-copy]').textContent = progress.active
      ? ('Đã kích hoạt · ' + statLine(masterAdd))
      : ('Tất cả bảo vật đạt +' + progress.next + ' sẽ kích hoạt (' + progress.ready + '/' + progress.need + ')');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    for (const side of ['left', 'right']) {
      const col = root.querySelector('[data-relic-col="' + side + '"]');
      if (!col) continue;
      col.innerHTML = catalog.filter(item => item.column === side).map(item => {
        const level = boardState[item.id]?.lvl || 0;
        const art = typeof relicArt === 'function' ? relicArt(item.id) : ('assets/ui/account-relics/' + item.id + '.png');
        return '<button type="button" class="hv-relic-slot' + (state.relic === item.id ? ' is-on' : '') + (level ? '' : ' is-off') + '" data-relic="' + item.id + '" aria-label="' + item.name + '"><img src="' + art + '" alt=""><small class="lvl">+' + level + '</small></button>';
      }).join('');
    }
    root.querySelectorAll('[data-relic-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.relicTab === state.relicTab));
    const picked = selectedRelic();
    const level = picked ? (boardState[picked.id]?.lvl || 0) : 0;
    const add = relicBonus();
    const body = root.querySelector('[data-relic-tab-body]');
    if (state.relicTab === 'codex') {
      body.innerHTML = '<div class="hv-gear-stats"><div>HP <b>' + Number(add.hp).toLocaleString('vi-VN') + '</b></div><div>Tấn công <b>' + Number(add.atk).toLocaleString('vi-VN') + '</b></div><div>Vật thủ <b>' + Number(add.def).toLocaleString('vi-VN') + '</b></div><div>Tốc <b>' + Number(add.spd).toLocaleString('vi-VN') + '</b></div></div>'
        + relicSets.map(set => {
          const ready = catalog.filter(item => item.set === set.id && (boardState[item.id]?.lvl || 0) >= 1).length;
          return '<p class="hv-gear-copy">' + set.name + ' ' + ready + '/4 · 2 món ' + statLine(set.two) + ' · 4 món ' + statLine(set.four) + '</p>';
        }).join('');
    } else {
      const cost = typeof relicEnhanceCost === 'function' ? relicEnhanceCost(level) : { gold: 0, hoat: 0 };
      const can = picked && level < relicMax;
      body.innerHTML = '<p class="hv-relic-name">' + (picked ? picked.name : 'Bảo Vật') + '</p>'
        + '<div class="hv-gear-cost"><span>Lv ' + level + ' → ' + (can ? level + 1 : relicMax) + '</span><span>' + (picked ? (picked.stat.toUpperCase() + ' +' + ((typeof RELIC_STAT_PER_LEVEL === 'object' && RELIC_STAT_PER_LEVEL[picked.stat] || 0) * Math.max(1, level || 1))) : '') + '</span></div>'
        + '<div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">' + cost.gold + '</span><span><img src="assets/items/materials/hoat-luc.png" alt="">' + cost.hoat + '</span></div>'
        + '<div class="hv-gear-actions"><button type="button" data-relic-enhance ' + (can ? '' : 'disabled') + '>Cường hóa</button><button type="button" data-relic-enhance-all ' + (picked ? '' : 'disabled') + '>Cường hóa nhanh</button></div>';
    }
  }

  function renderPet() {
    const boardState = petBoard();
    const catalog = pets.slice().sort((a, b) => a.column === b.column ? a.order - b.order : (a.column === 'left' ? -1 : 1));
    const master = typeof accountPetMasterLevel === 'function' ? accountPetMasterLevel(boardState) : 0;
    const progress = typeof accountPetMasterProgress === 'function'
      ? accountPetMasterProgress(boardState)
      : { level: master, next: master + 1, ready: 0, need: 6, active: master > 0 };
    const masterAdd = typeof accountPetMasterBonus === 'function' ? accountPetMasterBonus(master) : { hp: 0, atk: 0, def: 0, spd: 0 };
    fillChips();
    root.querySelector('[data-gear-view="pet"] [data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + (typeof teamPower === 'function' ? teamPower() : 0).toLocaleString('vi-VN');
    root.querySelector('[data-pet-master]').textContent = String(master);
    root.querySelector('[data-pet-master-progress]').textContent = progress.level + '/' + progress.next;
    const fill = root.querySelector('[data-pet-master-fill]');
    if (fill) fill.style.width = (progress.next ? Math.round((progress.level / progress.next) * 100) : 0) + '%';
    root.querySelector('[data-pet-master-copy]').textContent = progress.active
      ? ('Đã kích hoạt · ' + statLine(masterAdd))
      : ('Tất cả linh thú đạt +' + progress.next + ' sẽ kích hoạt (' + progress.ready + '/' + progress.need + ')');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    for (const side of ['left', 'right']) {
      const col = root.querySelector('[data-pet-col="' + side + '"]');
      if (!col) continue;
      col.innerHTML = catalog.filter(item => item.column === side).map(item => {
        const level = boardState.levels?.[item.id]?.lvl || 0;
        const art = typeof petArt === 'function' ? petArt(item.id) : ('assets/ui/account-pets/' + item.id + '.png');
        const deployed = boardState.deployed === item.id;
        return '<button type="button" class="hv-pet-slot' + (state.pet === item.id ? ' is-on' : '') + (level ? '' : ' is-off') + (deployed ? ' is-deployed' : '') + '" data-pet="' + item.id + '" aria-label="' + item.name + '"><img src="' + art + '" alt=""><small class="lvl">+' + level + '</small>' + (deployed ? '<em>Chiến</em>' : '') + '</button>';
      }).join('');
    }
    root.querySelectorAll('[data-pet-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.petTab === state.petTab));
    const picked = selectedPet();
    const level = picked ? (boardState.levels?.[picked.id]?.lvl || 0) : 0;
    const add = petBonus();
    const body = root.querySelector('[data-pet-tab-body]');
    if (state.petTab === 'deploy') {
      const deployed = catalog.find(item => item.id === boardState.deployed);
      body.innerHTML = '<div class="hv-gear-stats"><div>HP <b>' + Number(add.hp).toLocaleString('vi-VN') + '</b></div><div>Tấn công <b>' + Number(add.atk).toLocaleString('vi-VN') + '</b></div><div>Vật thủ <b>' + Number(add.def).toLocaleString('vi-VN') + '</b></div><div>Tốc <b>' + Number(add.spd).toLocaleString('vi-VN') + '</b></div></div>'
        + '<p class="hv-pet-name">' + (picked ? picked.name : 'Linh Thú') + '</p>'
        + '<p class="hv-gear-copy">Xuất chiến: ' + (deployed ? deployed.name : 'Chưa chọn') + ' · thú khác +' + Math.round((typeof PET_SUPPORT_RATIO === 'number' ? PET_SUPPORT_RATIO : 0.25) * 100) + '% chỉ số</p>'
        + '<div class="hv-gear-actions"><button type="button" data-pet-deploy ' + (picked && boardState.deployed !== picked.id ? '' : 'disabled') + '>Xuất chiến</button></div>';
    } else {
      const cost = typeof petEnhanceCost === 'function' ? petEnhanceCost(level) : { gold: 0, hoat: 0 };
      const can = picked && level < petMax;
      body.innerHTML = '<p class="hv-pet-name">' + (picked ? picked.name : 'Linh Thú') + '</p>'
        + '<div class="hv-gear-cost"><span>Lv ' + level + ' → ' + (can ? level + 1 : petMax) + '</span><span>' + (picked ? (picked.stat.toUpperCase() + ' +' + ((typeof PET_STAT_PER_LEVEL === 'object' && PET_STAT_PER_LEVEL[picked.stat] || 0) * Math.max(1, level || 1))) : '') + '</span></div>'
        + '<div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">' + cost.gold + '</span><span><img src="assets/items/materials/hoat-luc.png" alt="">' + cost.hoat + '</span></div>'
        + '<div class="hv-gear-actions"><button type="button" data-pet-enhance ' + (can ? '' : 'disabled') + '>Cường hóa</button><button type="button" data-pet-enhance-all ' + (picked ? '' : 'disabled') + '>Cường hóa nhanh</button></div>';
    }
  }

  function renderSpirit() {
    const boardState = spiritBoard();
    const master = typeof accountSpiritMasterLevel === 'function' ? accountSpiritMasterLevel(boardState) : 0;
    const progress = typeof accountSpiritMasterProgress === 'function'
      ? accountSpiritMasterProgress(boardState)
      : { level: master, next: master + 1, ready: 0, need: 9, active: master > 0 };
    const masterAdd = typeof accountSpiritMasterBonus === 'function' ? accountSpiritMasterBonus(master) : { hp: 0, atk: 0, def: 0, spd: 0 };
    fillChips();
    root.querySelector('[data-gear-view="spirit"] [data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + (typeof teamPower === 'function' ? teamPower() : 0).toLocaleString('vi-VN');
    root.querySelector('[data-spirit-master]').textContent = String(master);
    root.querySelector('[data-spirit-master-progress]').textContent = progress.level + '/' + progress.next;
    const fill = root.querySelector('[data-spirit-master-fill]');
    if (fill) fill.style.width = (progress.next ? Math.round((progress.level / progress.next) * 100) : 0) + '%';
    root.querySelector('[data-spirit-master-copy]').textContent = progress.active
      ? ('Đã kích hoạt · ' + statLine(masterAdd))
      : ('Tất cả chiến linh đạt +' + progress.next + ' sẽ kích hoạt (' + progress.ready + '/' + progress.need + ')');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    const grid = root.querySelector('[data-spirit-grid]');
    const cells = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const item = spirits.find(spirit => spirit.row === row && spirit.col === col);
        if (!item) continue;
        const level = boardState.levels?.[item.id]?.lvl || 0;
        const art = typeof spiritArt === 'function' ? spiritArt(item.id) : ('assets/ui/account-spirits/' + item.id + '.png');
        const slotted = (boardState.slots || []).includes(item.id);
        cells.push('<button type="button" class="hv-spirit-cell' + (state.spirit === item.id ? ' is-on' : '') + (level ? '' : ' is-off') + (slotted ? ' is-slotted' : '') + '" data-spirit="' + item.id + '" aria-label="' + item.name + '"><img src="' + art + '" alt=""><small class="lvl">+' + level + '</small>' + (slotted ? '<em>An</em>' : '') + '</button>');
      }
    }
    grid.innerHTML = cells.join('');
    const loadout = root.querySelector('[data-spirit-loadout]');
    loadout.innerHTML = [0, 1, 2].map(index => {
      const id = boardState.slots?.[index];
      const item = spirits.find(spirit => spirit.id === id);
      if (!item) return '<button type="button" class="hv-spirit-slot is-empty" data-spirit-slot="' + index + '"><i>+</i><small>' + (index + 1) + '</small></button>';
      const art = typeof spiritArt === 'function' ? spiritArt(item.id) : ('assets/ui/account-spirits/' + item.id + '.png');
      return '<button type="button" class="hv-spirit-slot' + (state.spirit === item.id ? ' is-on' : '') + '" data-spirit-slot="' + index + '"><img src="' + art + '" alt=""><small>' + (index + 1) + '</small></button>';
    }).join('');
    root.querySelectorAll('[data-spirit-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.spiritTab === state.spiritTab));
    const picked = selectedSpirit();
    const level = picked ? (boardState.levels?.[picked.id]?.lvl || 0) : 0;
    const add = spiritBonus();
    const body = root.querySelector('[data-spirit-tab-body]');
    if (state.spiritTab === 'slot') {
      body.innerHTML = '<div class="hv-gear-stats"><div>HP <b>' + Number(add.hp).toLocaleString('vi-VN') + '</b></div><div>Tấn công <b>' + Number(add.atk).toLocaleString('vi-VN') + '</b></div><div>Vật thủ <b>' + Number(add.def).toLocaleString('vi-VN') + '</b></div><div>Tốc <b>' + Number(add.spd).toLocaleString('vi-VN') + '</b></div></div>'
        + spiritSets.map(set => {
          const ready = (boardState.slots || []).filter(id => spirits.find(item => item.id === id)?.set === set.id).length;
          return '<p class="hv-gear-copy">' + set.name + ' ' + ready + '/3 · bộ 3 ' + statLine(set.three) + '</p>';
        }).join('')
        + '<div class="hv-gear-actions"><button type="button" data-spirit-anvi>An vị</button></div>';
    } else {
      const cost = typeof spiritEnhanceCost === 'function' ? spiritEnhanceCost(level) : { gold: 0, hoat: 0 };
      const can = picked && level < spiritMax;
      body.innerHTML = '<p class="hv-spirit-name">' + (picked ? picked.name : 'Chiến Linh') + '</p>'
        + '<div class="hv-gear-cost"><span>Lv ' + level + ' → ' + (can ? level + 1 : spiritMax) + '</span><span>' + (picked ? (picked.stat.toUpperCase() + ' +' + ((typeof SPIRIT_STAT_PER_LEVEL === 'object' && SPIRIT_STAT_PER_LEVEL[picked.stat] || 0) * Math.max(1, level || 1))) : '') + '</span></div>'
        + '<div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">' + cost.gold + '</span><span><img src="assets/items/materials/hoat-luc.png" alt="">' + cost.hoat + '</span></div>'
        + '<div class="hv-gear-actions"><button type="button" data-spirit-enhance ' + (can ? '' : 'disabled') + '>Cường hóa</button><button type="button" data-spirit-enhance-all ' + (picked ? '' : 'disabled') + '>Cường hóa nhanh</button></div>';
    }
  }

  function pctLine(stats) {
    const fmt = n => ((Number(n) || 0) * 100).toFixed(1).replace(/\.0$/, '') + '%';
    return 'HP +' + fmt(stats.hp) + ' · Công +' + fmt(stats.atk) + ' · Thủ +' + fmt(stats.def) + ' · Tốc +' + fmt(stats.spd);
  }

  function renderDivine() {
    const boardState = divineBoard();
    const master = typeof accountDivineMasterLevel === 'function' ? accountDivineMasterLevel(boardState) : 0;
    const progress = typeof accountDivineMasterProgress === 'function'
      ? accountDivineMasterProgress(boardState)
      : { level: master, next: master + 1, ready: 0, need: 4, active: master > 0 };
    const masterAdd = typeof accountDivineMasterBonus === 'function' ? accountDivineMasterBonus(master) : { hp: 0, atk: 0, def: 0, spd: 0 };
    fillChips();
    root.querySelector('[data-gear-view="divine"] [data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + (typeof teamPower === 'function' ? teamPower() : 0).toLocaleString('vi-VN');
    root.querySelector('[data-divine-master]').textContent = String(master);
    root.querySelector('[data-divine-master-progress]').textContent = progress.level + '/' + progress.next;
    const fill = root.querySelector('[data-divine-master-fill]');
    if (fill) fill.style.width = (progress.next ? Math.round((progress.level / progress.next) * 100) : 0) + '%';
    root.querySelector('[data-divine-master-copy]').textContent = progress.active
      ? ('Đã kích hoạt · ' + pctLine(masterAdd))
      : ('Tất cả thần binh đạt +' + progress.next + ' sẽ kích hoạt (' + progress.ready + '/' + progress.need + ')');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    const grid = root.querySelector('[data-divine-grid]');
    grid.innerHTML = divines.slice().sort((a, b) => a.cell - b.cell).map(item => {
      const level = boardState[item.id]?.lvl || 0;
      const art = typeof divineArt === 'function' ? divineArt(item.id) : ('assets/ui/account-divines/' + item.id + '.png');
      return '<button type="button" class="hv-divine-banner' + (state.divine === item.id ? ' is-on' : '') + (level ? '' : ' is-off') + '" data-divine="' + item.id + '" aria-label="' + item.name + '"><img src="' + art + '" alt=""><b>' + item.name + '</b><small class="lvl">+' + level + '</small></button>';
    }).join('');
    root.querySelectorAll('[data-divine-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.divineTab === state.divineTab));
    const picked = selectedDivine();
    const level = picked ? (boardState[picked.id]?.lvl || 0) : 0;
    const add = divineBonus();
    const body = root.querySelector('[data-divine-tab-body]');
    if (state.divineTab === 'codex') {
      body.innerHTML = '<p class="hv-gear-copy">Buff % thuộc tính toàn đội. Cộng dồn với trang bị, bảo vật, linh thú và chiến linh.</p>'
        + '<p class="hv-gear-copy">Hiện tại · ' + pctLine(add) + '</p>';
    } else {
      const cost = typeof divineEnhanceCost === 'function' ? divineEnhanceCost(level) : { gold: 0, hoat: 0 };
      const can = picked && level < divineMax;
      const per = picked && typeof DIVINE_PCT_PER_LEVEL === 'object' ? DIVINE_PCT_PER_LEVEL[picked.stat] || 0 : 0;
      body.innerHTML = '<p class="hv-divine-name">' + (picked ? picked.name : 'Thần Binh') + '</p>'
        + '<div class="hv-gear-cost"><span>Lv ' + level + ' → ' + (can ? level + 1 : divineMax) + '</span><span>' + (picked ? (picked.stat.toUpperCase() + ' +' + ((per * Math.max(1, level || 1)) * 100).toFixed(1).replace(/\.0$/, '') + '%') : '') + '</span></div>'
        + '<div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">' + cost.gold + '</span><span><img src="assets/items/materials/hoat-luc.png" alt="">' + cost.hoat + '</span></div>'
        + '<div class="hv-gear-actions"><button type="button" data-divine-enhance ' + (can ? '' : 'disabled') + '>Cường hóa</button><button type="button" data-divine-enhance-all ' + (picked ? '' : 'disabled') + '>Cường hóa nhanh</button></div>';
    }
  }

  function renderStar() {
    const ids = starIds.length ? starIds : (typeof OFFICIAL_ROSTER_12_IDS !== 'undefined' ? OFFICIAL_ROSTER_12_IDS : []);
    const master = typeof accountStarMasterLevel === 'function' ? accountStarMasterLevel(P, ids) : 0;
    const progress = typeof accountStarMasterProgress === 'function'
      ? accountStarMasterProgress(P, ids)
      : { level: master, next: master + 1, ready: 0, need: 12, active: master > 0 };
    fillChips();
    root.querySelector('[data-gear-view="star"] [data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + (typeof teamPower === 'function' ? teamPower() : 0).toLocaleString('vi-VN');
    root.querySelector('[data-star-master]').textContent = String(master);
    root.querySelector('[data-star-master-progress]').textContent = progress.level + '/' + progress.next;
    const fill = root.querySelector('[data-star-master-fill]');
    if (fill) fill.style.width = (progress.next ? Math.round((progress.level / progress.next) * 100) : 0) + '%';
    root.querySelector('[data-star-master-copy]').textContent = progress.active
      ? ('Đội hình Tinh ★' + master + ' · mỗi sao +12% chỉ số gốc')
      : ('Sở hữu đủ 12 tướng ★' + progress.next + ' sẽ ghi nhận (' + progress.ready + '/' + progress.need + ')');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    const grid = root.querySelector('[data-star-grid]');
    grid.innerHTML = ids.map(id => {
      const owned = !!P.heroes?.[id]?.owned;
      const stars = owned ? (typeof heroStarCount === 'function' ? heroStarCount(P, id) : (P.heroes[id].stars || 1)) : 0;
      const src = (typeof portraitSrc === 'function' && (portraitSrc(id, 'card') || portraitSrc(id, 'avatar') || portraitSrc(id, 'master'))) || '';
      const name = (DATA?.heroes?.[id]?.name || id).split(' — ')[0];
      return '<button type="button" class="hv-star-cell' + (state.star === id ? ' is-on' : '') + (owned ? '' : ' is-off') + '" data-star="' + id + '" aria-label="' + name + '">'
        + (src ? '<img src="' + src + '" alt="">' : '<span>' + name.slice(0, 1) + '</span>')
        + '<small class="lvl">' + (owned ? ('★' + stars) : '🔒') + '</small></button>';
    }).join('');
    root.querySelectorAll('[data-star-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.starTab === state.starTab));
    const id = state.star;
    const owned = !!P.heroes?.[id]?.owned;
    const stars = owned ? (typeof heroStarCount === 'function' ? heroStarCount(P, id) : (P.heroes[id]?.stars || 1)) : 0;
    const have = Number((P.shards || {})[id] || 0);
    const cost = typeof starUpCost === 'function' ? starUpCost(Math.max(1, stars || 1)) : 20;
    const name = (DATA?.heroes?.[id]?.name || 'Tướng').split(' — ')[0];
    const body = root.querySelector('[data-star-tab-body]');
    if (state.starTab === 'codex') {
      const ownedCount = ids.filter(key => P.heroes?.[key]?.owned).length;
      body.innerHTML = '<p class="hv-gear-copy">Thăng sao dùng mảnh hồn của đúng tướng. Mỗi sao +12% HP/Công/Thủ gốc.</p>'
        + '<p class="hv-gear-copy">Sở hữu ' + ownedCount + '/' + ids.length + ' · Bậc Thầy ★' + master + '</p>';
    } else {
      const can = owned && stars < starMax && have >= cost;
      const pips = owned ? ('★'.repeat(stars) + '☆'.repeat(Math.max(0, starMax - stars))) : 'Chưa sở hữu';
      body.innerHTML = '<p class="hv-star-name">' + name + '</p>'
        + '<div class="hv-gear-cost"><span>' + pips + '</span><span>' + have + ' / ' + cost + ' mảnh</span></div>'
        + '<div class="hv-gear-actions"><button type="button" data-star-up ' + (can ? '' : 'disabled') + '>Thăng sao</button></div>';
    }
  }

  function renderAntique() {
    const boardState = antiqueBoard();
    const master = typeof accountAntiqueMasterLevel === 'function' ? accountAntiqueMasterLevel(boardState) : 0;
    const progress = typeof accountAntiqueMasterProgress === 'function'
      ? accountAntiqueMasterProgress(boardState)
      : { level: master, next: master + 1, ready: 0, need: 6, active: master > 0 };
    const masterAdd = typeof accountAntiqueMasterBonus === 'function' ? accountAntiqueMasterBonus(master) : { hp: 0, atk: 0, def: 0, spd: 0 };
    fillChips();
    root.querySelector('[data-gear-view="antique"] [data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + (typeof teamPower === 'function' ? teamPower() : 0).toLocaleString('vi-VN');
    root.querySelector('[data-antique-master]').textContent = String(master);
    root.querySelector('[data-antique-master-progress]').textContent = progress.level + '/' + progress.next;
    const fill = root.querySelector('[data-antique-master-fill]');
    if (fill) fill.style.width = (progress.next ? Math.round((progress.level / progress.next) * 100) : 0) + '%';
    root.querySelector('[data-antique-master-copy]').textContent = progress.active
      ? ('Đã kích hoạt · ' + statLine(masterAdd))
      : ('Tất cả cổ vật đạt +' + progress.next + ' sẽ kích hoạt (' + progress.ready + '/' + progress.need + ')');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    const grid = root.querySelector('[data-antique-grid]');
    grid.innerHTML = antiques.slice().sort((a, b) => a.cell - b.cell).map(item => {
      const level = boardState.levels?.[item.id]?.lvl || 0;
      const art = typeof antiqueArt === 'function' ? antiqueArt(item.id) : ('assets/ui/account-antiques/' + item.id + '.png');
      const equipped = boardState.equipped === item.id;
      return '<button type="button" class="hv-antique-cell' + (state.antique === item.id ? ' is-on' : '') + (level ? '' : ' is-off') + (equipped ? ' is-slotted' : '') + '" data-antique="' + item.id + '" aria-label="' + item.name + '"><img src="' + art + '" alt=""><small class="lvl">+' + level + '</small>' + (equipped ? '<em>An</em>' : '') + '</button>';
    }).join('');
    root.querySelectorAll('[data-antique-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.antiqueTab === state.antiqueTab));
    const picked = selectedAntique();
    const level = picked ? (boardState.levels?.[picked.id]?.lvl || 0) : 0;
    const add = antiqueBonus();
    const body = root.querySelector('[data-antique-tab-body]');
    if (state.antiqueTab === 'slot') {
      const equipped = antiques.find(item => item.id === boardState.equipped);
      body.innerHTML = '<p class="hv-gear-copy">Chỉ một cổ vật an vị. Đang dùng: <b>' + (equipped ? equipped.name : 'trống') + '</b></p>'
        + '<div class="hv-gear-stats"><div>HP <b>' + Number(add.hp).toLocaleString('vi-VN') + '</b></div><div>Tấn công <b>' + Number(add.atk).toLocaleString('vi-VN') + '</b></div><div>Vật thủ <b>' + Number(add.def).toLocaleString('vi-VN') + '</b></div><div>Tốc <b>' + Number(add.spd).toLocaleString('vi-VN') + '</b></div></div>'
        + '<div class="hv-gear-actions"><button type="button" data-antique-anvi>An vị</button></div>';
    } else {
      const cost = typeof antiqueEnhanceCost === 'function' ? antiqueEnhanceCost(level) : { gold: 0, hoat: 0 };
      const can = picked && level < antiqueMax;
      body.innerHTML = '<p class="hv-antique-name">' + (picked ? picked.name : 'Cổ Vật') + '</p>'
        + '<div class="hv-gear-cost"><span>Lv ' + level + ' → ' + (can ? level + 1 : antiqueMax) + '</span><span>' + (picked ? (picked.stat.toUpperCase() + ' +' + ((typeof ANTIQUE_STAT_PER_LEVEL === 'object' && ANTIQUE_STAT_PER_LEVEL[picked.stat] || 0) * Math.max(1, level || 1))) : '') + '</span></div>'
        + '<div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">' + cost.gold + '</span><span><img src="assets/items/materials/hoat-luc.png" alt="">' + cost.hoat + '</span></div>'
        + '<div class="hv-gear-actions"><button type="button" data-antique-enhance ' + (can ? '' : 'disabled') + '>Cường hóa</button><button type="button" data-antique-enhance-all ' + (picked ? '' : 'disabled') + '>Cường hóa nhanh</button></div>';
    }
  }

  function renderLuck() {
    const boardState = luckBoard();
    const master = typeof accountLuckMasterLevel === 'function' ? accountLuckMasterLevel(boardState) : 0;
    const progress = typeof accountLuckMasterProgress === 'function'
      ? accountLuckMasterProgress(boardState)
      : { level: master, next: master + 1, ready: 0, need: 5, active: master > 0 };
    const masterAdd = typeof accountLuckMasterBonus === 'function' ? accountLuckMasterBonus(master) : { hp: 0, atk: 0, def: 0, spd: 0 };
    fillChips();
    root.querySelector('[data-gear-view="luck"] [data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + (typeof teamPower === 'function' ? teamPower() : 0).toLocaleString('vi-VN');
    root.querySelector('[data-luck-master]').textContent = String(master);
    root.querySelector('[data-luck-master-progress]').textContent = progress.level + '/' + progress.next;
    const fill = root.querySelector('[data-luck-master-fill]');
    if (fill) fill.style.width = (progress.next ? Math.round((progress.level / progress.next) * 100) : 0) + '%';
    root.querySelector('[data-luck-master-copy]').textContent = progress.active
      ? ('Đã kích hoạt · ' + pctLine(masterAdd))
      : ('Tất cả vận đạt +' + progress.next + ' sẽ kích hoạt (' + progress.ready + '/' + progress.need + ')');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    const row = root.querySelector('[data-luck-row]');
    row.innerHTML = lucks.slice().sort((a, b) => a.cell - b.cell).map(item => {
      const level = boardState.levels?.[item.id]?.lvl || 0;
      const art = typeof luckArt === 'function' ? luckArt(item.id) : ('assets/ui/account-luck/' + item.id + '.png');
      const chosen = boardState.chosen === item.id;
      return '<button type="button" class="hv-luck-seal' + (state.luck === item.id ? ' is-on' : '') + (level ? '' : ' is-off') + (chosen ? ' is-slotted' : '') + '" data-luck="' + item.id + '" aria-label="' + item.name + '"><img src="' + art + '" alt=""><b>' + item.name.replace('Vận ', '') + '</b><small class="lvl">+' + level + '</small>' + (chosen ? '<em>Vận</em>' : '') + '</button>';
    }).join('');
    root.querySelectorAll('[data-luck-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.luckTab === state.luckTab));
    const picked = selectedLuck();
    const level = picked ? (boardState.levels?.[picked.id]?.lvl || 0) : 0;
    const add = luckBonus();
    const body = root.querySelector('[data-luck-tab-body]');
    if (state.luckTab === 'slot') {
      const chosen = lucks.find(item => item.id === boardState.chosen);
      body.innerHTML = '<p class="hv-gear-copy">Chỉ một vận hiệu lực. Đang chọn: <b>' + (chosen ? chosen.name : 'trống') + '</b></p>'
        + '<p class="hv-gear-copy">Hiện tại · ' + pctLine(add) + '</p>'
        + '<div class="hv-gear-actions"><button type="button" data-luck-choose>Chọn vận</button></div>';
    } else {
      const cost = typeof luckEnhanceCost === 'function' ? luckEnhanceCost(level) : { gold: 0, hoat: 0 };
      const can = picked && level < luckMax;
      const per = picked && picked.stat === 'all'
        ? LUCK_ALL_PCT_PER_LEVEL
        : (picked && typeof LUCK_PCT_PER_LEVEL === 'object' ? LUCK_PCT_PER_LEVEL[picked.stat] || 0 : 0);
      const label = picked ? (picked.stat === 'all' ? 'ALL' : picked.stat.toUpperCase()) : '';
      body.innerHTML = '<p class="hv-luck-name">' + (picked ? picked.name : 'Tuệ Vận') + '</p>'
        + '<div class="hv-gear-cost"><span>Lv ' + level + ' → ' + (can ? level + 1 : luckMax) + '</span><span>' + (picked ? (label + ' +' + ((per * Math.max(1, level || 1)) * 100).toFixed(1).replace(/\.0$/, '') + '%') : '') + '</span></div>'
        + '<div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">' + cost.gold + '</span><span><img src="assets/items/materials/hoat-luc.png" alt="">' + cost.hoat + '</span></div>'
        + '<div class="hv-gear-actions"><button type="button" data-luck-enhance ' + (can ? '' : 'disabled') + '>Cường hóa</button><button type="button" data-luck-enhance-all ' + (picked ? '' : 'disabled') + '>Cường hóa nhanh</button></div>';
    }
  }

  function renderIllusion() {
    const boardState = illusionBoard();
    const master = typeof accountIllusionMasterLevel === 'function' ? accountIllusionMasterLevel(boardState) : 0;
    const progress = typeof accountIllusionMasterProgress === 'function'
      ? accountIllusionMasterProgress(boardState)
      : { level: master, next: master + 1, ready: 0, need: 6, active: master > 0 };
    const masterAdd = typeof accountIllusionMasterBonus === 'function' ? accountIllusionMasterBonus(master) : { hp: 0, atk: 0, def: 0, spd: 0 };
    fillChips();
    root.querySelector('[data-gear-view="illusion"] [data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + (typeof teamPower === 'function' ? teamPower() : 0).toLocaleString('vi-VN');
    root.querySelector('[data-illusion-master]').textContent = String(master);
    root.querySelector('[data-illusion-master-progress]').textContent = progress.level + '/' + progress.next;
    const fill = root.querySelector('[data-illusion-master-fill]');
    if (fill) fill.style.width = (progress.next ? Math.round((progress.level / progress.next) * 100) : 0) + '%';
    root.querySelector('[data-illusion-master-copy]').textContent = progress.active
      ? ('Đã kích hoạt · ' + statLine(masterAdd))
      : ('Tất cả ảo hình đạt +' + progress.next + ' sẽ kích hoạt (' + progress.ready + '/' + progress.need + ')');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    const grid = root.querySelector('[data-illusion-grid]');
    grid.innerHTML = illusions.slice().sort((a, b) => a.cell - b.cell).map(item => {
      const level = boardState.levels?.[item.id]?.lvl || 0;
      const art = typeof illusionArt === 'function' ? illusionArt(item.id) : ('assets/ui/account-illusions/' + item.id + '.png');
      const worn = (boardState.slots || []).indexOf(item.id);
      return '<button type="button" class="hv-illusion-cell' + (state.illusion === item.id ? ' is-on' : '') + (level ? '' : ' is-off') + (worn >= 0 ? ' is-slotted' : '') + '" data-illusion="' + item.id + '" aria-label="' + item.name + '"><img src="' + art + '" alt=""><small class="lvl">+' + level + '</small>' + (worn === 0 ? '<em>Chính</em>' : worn === 1 ? '<em>Phụ</em>' : '') + '</button>';
    }).join('');
    const loadout = root.querySelector('[data-illusion-loadout]');
    loadout.innerHTML = [0, 1].map(index => {
      const id = boardState.slots?.[index];
      const item = illusions.find(ill => ill.id === id);
      const label = index === 0 ? 'Chính' : 'Phụ';
      if (!item) return '<button type="button" class="hv-illusion-slot is-empty" data-illusion-slot="' + index + '"><i>+</i><small>' + label + '</small></button>';
      const art = typeof illusionArt === 'function' ? illusionArt(item.id) : ('assets/ui/account-illusions/' + item.id + '.png');
      return '<button type="button" class="hv-illusion-slot' + (state.illusion === item.id ? ' is-on' : '') + '" data-illusion-slot="' + index + '"><img src="' + art + '" alt=""><small>' + label + '</small></button>';
    }).join('');
    root.querySelectorAll('[data-illusion-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.illusionTab === state.illusionTab));
    const picked = selectedIllusion();
    const level = picked ? (boardState.levels?.[picked.id]?.lvl || 0) : 0;
    const add = illusionBonus();
    const body = root.querySelector('[data-illusion-tab-body]');
    if (state.illusionTab === 'slot') {
      body.innerHTML = '<p class="hv-gear-copy">Chính 100% · Phụ 50%. An vị để đeo hoặc gỡ.</p>'
        + '<div class="hv-gear-stats"><div>HP <b>' + Number(add.hp).toLocaleString('vi-VN') + '</b></div><div>Tấn công <b>' + Number(add.atk).toLocaleString('vi-VN') + '</b></div><div>Vật thủ <b>' + Number(add.def).toLocaleString('vi-VN') + '</b></div><div>Tốc <b>' + Number(add.spd).toLocaleString('vi-VN') + '</b></div></div>'
        + '<div class="hv-gear-actions"><button type="button" data-illusion-anvi>An vị</button></div>';
    } else {
      const cost = typeof illusionEnhanceCost === 'function' ? illusionEnhanceCost(level) : { gold: 0, hoat: 0 };
      const can = picked && level < illusionMax;
      body.innerHTML = '<p class="hv-illusion-name">' + (picked ? picked.name : 'Ảo Hình') + '</p>'
        + '<div class="hv-gear-cost"><span>Lv ' + level + ' → ' + (can ? level + 1 : illusionMax) + '</span><span>' + (picked ? (picked.stat.toUpperCase() + ' +' + ((typeof ILLUSION_STAT_PER_LEVEL === 'object' && ILLUSION_STAT_PER_LEVEL[picked.stat] || 0) * Math.max(1, level || 1))) : '') + '</span></div>'
        + '<div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">' + cost.gold + '</span><span><img src="assets/items/materials/hoat-luc.png" alt="">' + cost.hoat + '</span></div>'
        + '<div class="hv-gear-actions"><button type="button" data-illusion-enhance ' + (can ? '' : 'disabled') + '>Cường hóa</button><button type="button" data-illusion-enhance-all ' + (picked ? '' : 'disabled') + '>Cường hóa nhanh</button></div>';
    }
  }

  function renderFish() {
    const boardState = fishBoard();
    const master = typeof accountFishMasterLevel === 'function' ? accountFishMasterLevel(boardState) : 0;
    const progress = typeof accountFishMasterProgress === 'function'
      ? accountFishMasterProgress(boardState)
      : { level: master, next: master + 1, ready: 0, need: 8, active: master > 0 };
    const masterAdd = typeof accountFishMasterBonus === 'function' ? accountFishMasterBonus(master) : { hp: 0, atk: 0, def: 0, spd: 0 };
    fillChips();
    root.querySelector('[data-gear-view="fish"] [data-gear-power]').innerHTML = '<i class="hv-gear-power-ico"></i>' + (typeof teamPower === 'function' ? teamPower() : 0).toLocaleString('vi-VN');
    root.querySelector('[data-fish-master]').textContent = String(master);
    root.querySelector('[data-fish-master-progress]').textContent = progress.level + '/' + progress.next;
    const fill = root.querySelector('[data-fish-master-fill]');
    if (fill) fill.style.width = (progress.next ? Math.round((progress.level / progress.next) * 100) : 0) + '%';
    root.querySelector('[data-fish-master-copy]').textContent = progress.active
      ? ('Đã kích hoạt · ' + statLine(masterAdd))
      : ('Tất cả cá đạt +' + progress.next + ' sẽ kích hoạt (' + progress.ready + '/' + progress.need + ')');
    root.querySelectorAll('[data-gear-hero]').forEach(img => { img.src = portrait(); });
    const grid = root.querySelector('[data-fish-grid]');
    grid.innerHTML = fishes.slice().sort((a, b) => a.cell - b.cell).map(item => {
      const level = boardState[item.id]?.lvl || 0;
      const art = typeof fishArt === 'function' ? fishArt(item.id) : ('assets/ui/account-fish/' + item.id + '.png');
      return '<button type="button" class="hv-fish-cell' + (state.fish === item.id ? ' is-on' : '') + (level ? '' : ' is-off') + (state.lastFish === item.id ? ' is-catch' : '') + '" data-fish="' + item.id + '" aria-label="' + item.name + '"><img src="' + art + '" alt=""><small class="lvl">+' + level + '</small></button>';
    }).join('');
    root.querySelectorAll('[data-fish-tab]').forEach(button => button.classList.toggle('is-on', button.dataset.fishTab === state.fishTab));
    const picked = selectedFish();
    const add = fishBonus();
    const cost = typeof FISH_CAST_COST === 'object' ? FISH_CAST_COST : { gold: 50, hoat: 3 };
    const body = root.querySelector('[data-fish-tab-body]');
    if (state.fishTab === 'codex') {
      body.innerHTML = '<p class="hv-gear-copy">Cả đàn cá đã câu đều cộng chỉ số. Câu ngẫu nhiên một loài.</p>'
        + '<div class="hv-gear-stats"><div>HP <b>' + Number(add.hp).toLocaleString('vi-VN') + '</b></div><div>Tấn công <b>' + Number(add.atk).toLocaleString('vi-VN') + '</b></div><div>Vật thủ <b>' + Number(add.def).toLocaleString('vi-VN') + '</b></div><div>Tốc <b>' + Number(add.spd).toLocaleString('vi-VN') + '</b></div></div>';
    } else {
      const last = fishes.find(item => item.id === state.lastFish);
      body.innerHTML = '<p class="hv-fish-name">' + (last ? ('Câu được ' + last.name) : (picked ? picked.name : 'Cẩu Cá')) + '</p>'
        + '<div class="hv-gear-cost"><span><img src="assets/items/materials/gold.png" alt="">' + cost.gold + '</span><span><img src="assets/items/materials/hoat-luc.png" alt="">' + cost.hoat + '</span></div>'
        + '<div class="hv-gear-actions"><button type="button" data-fish-cast>Câu</button></div>';
    }
  }

  function show(view) {
    state.view = view;
    root.hidden = false;
    root.classList.add('is-open');
    root.querySelectorAll('.hv-gear-screen').forEach(screen => screen.classList.toggle('is-active', screen.dataset.gearView === view));
    if (view === 'wheel') renderWheel();
    else if (view === 'smelt') renderSmelt();
    else if (view === 'relic') renderRelic();
    else if (view === 'pet') renderPet();
    else if (view === 'spirit') renderSpirit();
    else if (view === 'divine') renderDivine();
    else if (view === 'star') renderStar();
    else if (view === 'antique') renderAntique();
    else if (view === 'luck') renderLuck();
    else if (view === 'illusion') renderIllusion();
    else if (view === 'fish') renderFish();
    else renderBoard();
  }
  function hide() {
    root.hidden = true;
    root.classList.remove('is-open');
    closePicker();
  }
  function openAssistWheel() { show('wheel'); }
  function openBoard() { if (!state.slot) state.slot = 'I'; show('board'); }
  function openRelic() { if (!state.relic) state.relic = relics[0]?.id || 'trong-dong'; show('relic'); }
  function openPet() { if (!state.pet) state.pet = pets[0]?.id || 'kim-quy'; show('pet'); }
  function openSpirit() { if (!state.spirit) state.spirit = spirits[0]?.id || 'son-tinh'; show('spirit'); }
  function openDivine() { if (!state.divine) state.divine = divines[0]?.id || 'cam-quan'; show('divine'); }
  function openStar() { if (!state.star) state.star = starIds[0] || 'ong_hang_pho'; show('star'); }
  function openAntique() { if (!state.antique) state.antique = antiques[0]?.id || 'bia-tien-si'; show('antique'); }
  function openLuck() { if (!state.luck) state.luck = lucks[0]?.id || 'van-phu'; show('luck'); }
  function openIllusion() { if (!state.illusion) state.illusion = illusions[0]?.id || 'hon-trang'; show('illusion'); }
  function openFish() { if (!state.fish) state.fish = fishes[0]?.id || 'ca-loc'; show('fish'); }
  function openSmelt() {
    closePicker();
    state.smeltTab = state.smeltTab || 'smelt';
    state.smeltKind = state.smeltKind || 'all';
    if (!Array.isArray(state.smeltPicks)) state.smeltPicks = [];
    show('smelt');
  }
  function closePicker() {
    root.querySelector('[data-gear-picker]').classList.remove('is-open');
    state.picker = null;
  }
  function openPicker(slotId) {
    state.slot = slotId;
    state.picker = slotId;
    const list = candidatesForGearSlot(P, slotId, { rarOrder });
    const box = root.querySelector('[data-gear-choices]');
    if (!list.length) {
      box.innerHTML = `<div class="hv-gear-empty"><p>Chưa có trang bị!</p><button type="button" data-gear-go="forge">Đi nhận thưởng</button></div>`;
    } else {
      box.innerHTML = list.map(item => `<button type="button" class="hv-gear-choice" data-gear-pick="${item.uid}"><img src="${artFor(item)}" alt=""><span>${typeof itemName === 'function' ? itemName(item) : item.slot} +${item.lvl}<small style="display:block">${String(item.rar).toUpperCase()}</small></span><b>Mặc</b></button>`).join('');
    }
    root.querySelector('[data-gear-picker]').classList.add('is-open');
    renderBoard();
  }
  function toggleSmeltPick(uid) {
    const index = state.smeltPicks.indexOf(uid);
    if (index >= 0) {
      state.smeltPicks.splice(index, 1);
      return;
    }
    if (state.smeltTab === 'enhance') {
      state.smeltPicks = [uid];
      return;
    }
    if (state.smeltPicks.length >= traySize) {
      toast?.('Chỉ dung luyện tối đa 8 món.');
      return;
    }
    state.smeltPicks.push(uid);
  }
  function runSmelt(limit) {
    const uids = state.smeltPicks.slice(0, limit);
    const prepared = prepareSmeltSelection(P, uids);
    if (!prepared.ok) { toast?.(prepared.message || 'Hãy chọn trang bị!'); return; }
    if (typeof forgeCommand !== 'function') { toast?.('Chưa dung luyện được.'); return; }
    let gained = 0;
    for (const quote of prepared.quotes) {
      const result = forgeCommand('salvage', { uid: quote.uid, quote }, 'forge.salvage:' + quote.uid + ':' + (P.revision || 0));
      if (!result.ok) { toast?.(result.message || 'Chưa dung luyện được.'); break; }
      gained += quote.gain;
    }
    state.smeltPicks = state.smeltPicks.filter(uid => itemOf(uid));
    if (gained) toast?.('Dung luyện → +' + gained + ' Tinh Lực');
    if (typeof refreshResbar === 'function') refreshResbar();
    renderSmelt();
  }
  function runEnhance(fast) {
    const uid = state.smeltPicks[0];
    if (!uid || !itemOf(uid)) { toast?.('Hãy chọn trang bị!'); return; }
    if (typeof enhanceItem !== 'function') return;
    if (!fast) { enhanceItem(uid); renderSmelt(); return; }
    let n = 0;
    while (n < 15 && enhanceItem(uid)) n++;
    if (!n) toast?.('Không đủ nguyên liệu để cường hóa.');
    renderSmelt();
  }

  root.addEventListener('click', event => {
    const close = event.target.closest('[data-gear-close]');
    if (close) { hide(); if (typeof navTo === 'function') navTo('hub'); return; }
    if (event.target.closest('[data-gear-wheel]')) { closePicker(); show('wheel'); return; }
    if (event.target.closest('[data-gear-board]')) { show('board'); return; }
    if (event.target.closest('[data-gear-picker-close]')) { closePicker(); return; }
    if (event.target.matches('[data-gear-picker]')) { closePicker(); return; }
    const smelt = event.target.closest('[data-gear-smelt]');
    if (smelt) { openSmelt(); return; }
    const smeltTab = event.target.closest('[data-smelt-tab]');
    if (smeltTab) {
      state.smeltTab = smeltTab.dataset.smeltTab;
      state.smeltPicks = [];
      renderSmelt();
      return;
    }
    const kind = event.target.closest('[data-smelt-kind]');
    if (kind) { state.smeltKind = kind.dataset.smeltKind; renderSmelt(); return; }
    const smeltItem = event.target.closest('[data-smelt-item]');
    if (smeltItem) {
      toggleSmeltPick(+smeltItem.dataset.smeltItem);
      renderSmelt();
      return;
    }
    if (event.target.closest('[data-smelt-once]')) { runSmelt(1); return; }
    if (event.target.closest('[data-smelt-all]')) { runSmelt(traySize); return; }
    if (event.target.closest('[data-smelt-enhance]')) { runEnhance(false); return; }
    if (event.target.closest('[data-smelt-enhance-all]')) { runEnhance(true); return; }
    const assist = event.target.closest('[data-assist]');
    if (assist) {
      if (assist.dataset.assist === 'gear') { openBoard(); return; }
      if (assist.dataset.assist === 'relic') { openRelic(); return; }
      if (assist.dataset.assist === 'pet') { openPet(); return; }
      if (assist.dataset.assist === 'spirit') { openSpirit(); return; }
      if (assist.dataset.assist === 'divine') { openDivine(); return; }
      if (assist.dataset.assist === 'star') { openStar(); return; }
      if (assist.dataset.assist === 'antique') { openAntique(); return; }
      if (assist.dataset.assist === 'luck') { openLuck(); return; }
      if (assist.dataset.assist === 'illusion') { openIllusion(); return; }
      if (assist.dataset.assist === 'fish') { openFish(); return; }
      if (assist.dataset.assist === 'formation') {
        hide();
        ST.hvOpenFormation = true;
        navTo('team');
        return;
      }
      toast?.('Khu này chưa mở.');
      return;
    }
    const slotButton = event.target.closest('[data-gear-slot]');
    if (slotButton) {
      const id = slotButton.dataset.gearSlot;
      const worn = itemOf(board()[id]);
      if (!worn) { state.slot = id; openPicker(id); return; }
      if (state.slot === id && state.tab === 'wear') { openPicker(id); return; }
      state.slot = id;
      renderBoard();
      return;
    }
    const pick = event.target.closest('[data-gear-pick]');
    if (pick) {
      const change = prepareAccountGearChange(P, { slotId: state.picker, uid: +pick.dataset.gearPick, action: 'equip' });
      if (!change.ok) { toast?.(change.message || 'Không mặc được.'); return; }
      const saved = commit(change.gear, 'gear.equip:' + change.uid + ':' + change.slotId, 'gear.equip');
      if (saved.ok) { closePicker(); renderBoard(); toast?.('Đã mặc trang bị.'); }
      return;
    }
    const go = event.target.closest('[data-gear-go]');
    if (go) { hide(); navTo(go.dataset.gearGo); return; }
    if (event.target.closest('[data-gear-equip-all]')) {
      const change = prepareQuickEquip(P, { rarOrder });
      if (!change.changed) { toast?.(change.message); return; }
      if (commit(change.gear, 'gear.quick-equip:' + (P.revision || 0), 'gear.quick-equip').ok) {
        renderBoard(); toast?.('Đã mặc trang bị tốt nhất.');
      }
      return;
    }
    if (event.target.closest('[data-gear-unequip-all]')) {
      if (commit(prepareQuickUnequip(P).gear, 'gear.quick-unequip:' + (P.revision || 0), 'gear.quick-unequip').ok) {
        renderBoard(); toast?.('Đã tháo toàn bộ trang bị.');
      }
      return;
    }
    const enhanceOnce = () => {
      const item = selectedItem();
      if (!item || typeof enhanceItem !== 'function') return false;
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      const ok = enhanceItem(item.uid);
      if (ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
      }
      return ok;
    };
    if (event.target.closest('[data-gear-enhance]')) { enhanceOnce(); renderBoard(); return; }
    if (event.target.closest('[data-gear-enhance-all]')) {
      let n = 0; while (n < 15 && enhanceOnce()) n++;
      if (!n) toast?.('Không đủ nguyên liệu để cường hóa.');
      renderBoard();
      return;
    }
    const relicPick = event.target.closest('[data-relic]');
    if (relicPick) {
      state.relic = relicPick.dataset.relic;
      renderRelic();
      return;
    }
    const relicTab = event.target.closest('[data-relic-tab]');
    if (relicTab) { state.relicTab = relicTab.dataset.relicTab; renderRelic(); return; }
    const runRelic = times => {
      if (typeof prepareRelicEnhance !== 'function') return;
      const result = prepareRelicEnhance(P, { id: state.relic, times });
      if (!result.ok) { toast?.(result.message || 'Không cường hóa được.'); return; }
      if (!result.raised) { toast?.('Không đủ nguyên liệu để cường hóa.'); return; }
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      if (commitRelics(result, 'relic.enhance:' + result.id + ':' + result.level, 'relic.enhance').ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-view="relic"] [data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
        renderRelic();
      }
    };
    if (event.target.closest('[data-relic-enhance]')) { runRelic(1); return; }
    if (event.target.closest('[data-relic-enhance-all]')) { runRelic(relicMax); return; }
    const petPick = event.target.closest('[data-pet]');
    if (petPick) {
      state.pet = petPick.dataset.pet;
      renderPet();
      return;
    }
    const petTab = event.target.closest('[data-pet-tab]');
    if (petTab) { state.petTab = petTab.dataset.petTab; renderPet(); return; }
    if (event.target.closest('[data-pet-deploy]')) {
      if (typeof preparePetDeploy !== 'function') return;
      const result = preparePetDeploy(P, { id: state.pet });
      if (!result.ok) { toast?.(result.message || 'Không xuất chiến được.'); return; }
      if (commitPets(result, 'pet.deploy:' + result.id, 'pet.deploy').ok) {
        toast?.('Đã xuất chiến ' + (selectedPet()?.name || 'Linh Thú') + '.');
        renderPet();
      }
      return;
    }
    const runPet = times => {
      if (typeof preparePetEnhance !== 'function') return;
      const result = preparePetEnhance(P, { id: state.pet, times });
      if (!result.ok) { toast?.(result.message || 'Không cường hóa được.'); return; }
      if (!result.raised) { toast?.('Không đủ nguyên liệu để cường hóa.'); return; }
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      if (commitPets(result, 'pet.enhance:' + result.id + ':' + result.level, 'pet.enhance').ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-view="pet"] [data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
        renderPet();
      }
    };
    if (event.target.closest('[data-pet-enhance]')) { runPet(1); return; }
    if (event.target.closest('[data-pet-enhance-all]')) { runPet(petMax); return; }
    const spiritTab = event.target.closest('[data-spirit-tab]');
    if (spiritTab) { state.spiritTab = spiritTab.dataset.spiritTab; renderSpirit(); return; }
    if (event.target.closest('[data-spirit-anvi]') || event.target.closest('[data-spirit-slot]')) {
      const slotButton = event.target.closest('[data-spirit-slot]');
      const index = slotButton ? +slotButton.dataset.spiritSlot : (spiritBoard().slots || []).findIndex(id => !id);
      const target = index >= 0 ? index : 0;
      if (typeof prepareSpiritSlot !== 'function') return;
      const result = prepareSpiritSlot(P, { slot: target, id: state.spirit });
      if (!result.ok) { toast?.(result.message || 'Không an vị được.'); return; }
      if (commitSpirits(result, 'spirit.slot:' + result.id + ':' + result.slot, 'spirit.slot').ok) {
        toast?.('Đã an vị ' + (selectedSpirit()?.name || 'Chiến Linh') + '.');
        renderSpirit();
      }
      return;
    }
    const spiritPick = event.target.closest('[data-spirit]');
    if (spiritPick) {
      state.spirit = spiritPick.dataset.spirit;
      renderSpirit();
      return;
    }
    const runSpirit = times => {
      if (typeof prepareSpiritEnhance !== 'function') return;
      const result = prepareSpiritEnhance(P, { id: state.spirit, times });
      if (!result.ok) { toast?.(result.message || 'Không cường hóa được.'); return; }
      if (!result.raised) { toast?.('Không đủ nguyên liệu để cường hóa.'); return; }
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      if (commitSpirits(result, 'spirit.enhance:' + result.id + ':' + result.level, 'spirit.enhance').ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-view="spirit"] [data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
        renderSpirit();
      }
    };
    if (event.target.closest('[data-spirit-enhance]')) { runSpirit(1); return; }
    if (event.target.closest('[data-spirit-enhance-all]')) { runSpirit(spiritMax); return; }
    const divinePick = event.target.closest('[data-divine]');
    if (divinePick) {
      state.divine = divinePick.dataset.divine;
      renderDivine();
      return;
    }
    const divineTab = event.target.closest('[data-divine-tab]');
    if (divineTab) { state.divineTab = divineTab.dataset.divineTab; renderDivine(); return; }
    const runDivine = times => {
      if (typeof prepareDivineEnhance !== 'function') return;
      const result = prepareDivineEnhance(P, { id: state.divine, times });
      if (!result.ok) { toast?.(result.message || 'Không cường hóa được.'); return; }
      if (!result.raised) { toast?.('Không đủ nguyên liệu để cường hóa.'); return; }
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      if (commitDivines(result, 'divine.enhance:' + result.id + ':' + result.level, 'divine.enhance').ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-view="divine"] [data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
        renderDivine();
      }
    };
    if (event.target.closest('[data-divine-enhance]')) { runDivine(1); return; }
    if (event.target.closest('[data-divine-enhance-all]')) { runDivine(divineMax); return; }
    const starPick = event.target.closest('[data-star]');
    if (starPick) {
      state.star = starPick.dataset.star;
      renderStar();
      return;
    }
    const starTab = event.target.closest('[data-star-tab]');
    if (starTab) { state.starTab = starTab.dataset.starTab; renderStar(); return; }
    if (event.target.closest('[data-star-up]')) {
      if (typeof prepareStarUp !== 'function') return;
      const result = prepareStarUp(P, { id: state.star });
      if (!result.ok) { toast?.(result.message || 'Không thăng sao được.'); return; }
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      if (commitStars(result, 'star.up:' + result.id + ':' + result.stars, 'star.up').ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-view="star"] [data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
        toast?.('Thăng sao ' + ((DATA?.heroes?.[result.id]?.name || '').split(' — ')[0] || 'Tướng') + ' ★' + result.stars);
        renderStar();
      }
      return;
    }
    const antiquePick = event.target.closest('[data-antique]');
    if (antiquePick) {
      state.antique = antiquePick.dataset.antique;
      renderAntique();
      return;
    }
    const antiqueTab = event.target.closest('[data-antique-tab]');
    if (antiqueTab) { state.antiqueTab = antiqueTab.dataset.antiqueTab; renderAntique(); return; }
    if (event.target.closest('[data-antique-anvi]')) {
      if (typeof prepareAntiqueEquip !== 'function') return;
      const result = prepareAntiqueEquip(P, { id: state.antique });
      if (!result.ok) { toast?.(result.message || 'Không an vị được.'); return; }
      if (commitAntiques(result, 'antique.equip:' + (result.id || 'off'), 'antique.equip').ok) renderAntique();
      return;
    }
    const runAntique = times => {
      if (typeof prepareAntiqueEnhance !== 'function') return;
      const result = prepareAntiqueEnhance(P, { id: state.antique, times });
      if (!result.ok) { toast?.(result.message || 'Không cường hóa được.'); return; }
      if (!result.raised) { toast?.('Không đủ nguyên liệu để cường hóa.'); return; }
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      if (commitAntiques(result, 'antique.enhance:' + result.id + ':' + result.level, 'antique.enhance').ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-view="antique"] [data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
        renderAntique();
      }
    };
    if (event.target.closest('[data-antique-enhance]')) { runAntique(1); return; }
    if (event.target.closest('[data-antique-enhance-all]')) { runAntique(antiqueMax); return; }
    const luckPick = event.target.closest('[data-luck]');
    if (luckPick) {
      state.luck = luckPick.dataset.luck;
      renderLuck();
      return;
    }
    const luckTab = event.target.closest('[data-luck-tab]');
    if (luckTab) { state.luckTab = luckTab.dataset.luckTab; renderLuck(); return; }
    if (event.target.closest('[data-luck-choose]')) {
      if (typeof prepareLuckChoose !== 'function') return;
      const result = prepareLuckChoose(P, { id: state.luck });
      if (!result.ok) { toast?.(result.message || 'Không chọn vận được.'); return; }
      if (commitLuck(result, 'luck.choose:' + (result.id || 'off'), 'luck.choose').ok) renderLuck();
      return;
    }
    const runLuck = times => {
      if (typeof prepareLuckEnhance !== 'function') return;
      const result = prepareLuckEnhance(P, { id: state.luck, times });
      if (!result.ok) { toast?.(result.message || 'Không cường hóa được.'); return; }
      if (!result.raised) { toast?.('Không đủ nguyên liệu để cường hóa.'); return; }
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      if (commitLuck(result, 'luck.enhance:' + result.id + ':' + result.level, 'luck.enhance').ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-view="luck"] [data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
        renderLuck();
      }
    };
    if (event.target.closest('[data-luck-enhance]')) { runLuck(1); return; }
    if (event.target.closest('[data-luck-enhance-all]')) { runLuck(luckMax); return; }
    const illusionPick = event.target.closest('[data-illusion]');
    if (illusionPick) {
      state.illusion = illusionPick.dataset.illusion;
      renderIllusion();
      return;
    }
    const illusionTab = event.target.closest('[data-illusion-tab]');
    if (illusionTab) { state.illusionTab = illusionTab.dataset.illusionTab; renderIllusion(); return; }
    const illusionSlot = event.target.closest('[data-illusion-slot]');
    if (illusionSlot) {
      const index = Number(illusionSlot.dataset.illusionSlot);
      const id = (P.illusions?.slots || [])[index];
      if (id) state.illusion = id;
      renderIllusion();
      return;
    }
    if (event.target.closest('[data-illusion-anvi]')) {
      if (typeof prepareIllusionSlot !== 'function') return;
      const result = prepareIllusionSlot(P, { id: state.illusion });
      if (!result.ok) { toast?.(result.message || 'Không an vị được.'); return; }
      if (commitIllusions(result, 'illusion.slot:' + result.id, 'illusion.slot').ok) renderIllusion();
      return;
    }
    const runIllusion = times => {
      if (typeof prepareIllusionEnhance !== 'function') return;
      const result = prepareIllusionEnhance(P, { id: state.illusion, times });
      if (!result.ok) { toast?.(result.message || 'Không cường hóa được.'); return; }
      if (!result.raised) { toast?.('Không đủ nguyên liệu để cường hóa.'); return; }
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      if (commitIllusions(result, 'illusion.enhance:' + result.id + ':' + result.level, 'illusion.enhance').ok) {
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-view="illusion"] [data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
        renderIllusion();
      }
    };
    if (event.target.closest('[data-illusion-enhance]')) { runIllusion(1); return; }
    if (event.target.closest('[data-illusion-enhance-all]')) { runIllusion(illusionMax); return; }
    const fishPick = event.target.closest('[data-fish]');
    if (fishPick) {
      state.fish = fishPick.dataset.fish;
      renderFish();
      return;
    }
    const fishTab = event.target.closest('[data-fish-tab]');
    if (fishTab) { state.fishTab = fishTab.dataset.fishTab; renderFish(); return; }
    if (event.target.closest('[data-fish-cast]')) {
      if (typeof prepareFishCast !== 'function') return;
      const result = prepareFishCast(P);
      if (!result.ok) { toast?.(result.message || 'Không câu được.'); return; }
      const before = typeof teamPower === 'function' ? teamPower() : 0;
      if (commitFish(result, 'fish.cast:' + result.id + ':' + result.level, 'fish.cast').ok) {
        state.fish = result.id;
        state.lastFish = result.id;
        const gained = (typeof teamPower === 'function' ? teamPower() : 0) - before;
        const floater = root.querySelector('[data-gear-view="fish"] [data-gear-float]');
        if (gained && floater) {
          floater.hidden = false;
          floater.textContent = '+' + gained;
          floater.replaceWith(floater.cloneNode(true));
        }
        const name = (fishes.find(item => item.id === result.id) || {}).name || 'Cá';
        toast?.('Câu được ' + name + ' +' + result.level);
        renderFish();
      }
      return;
    }
    const tab = event.target.closest('[data-gear-tab]');
    if (tab) { state.tab = tab.dataset.gearTab; renderBoard(); }
  });

  const baseNav = typeof navTo === 'function' ? navTo : null;
  if (baseNav) {
    navTo = function accountGearNavTo(name) {
      if (name === 'gear') { showScreen('team'); openBoard(); return; }
      if (name === 'team' && !ST.hvOpenFormation) { showScreen('team'); openAssistWheel(); return; }
      ST.hvOpenFormation = false;
      hide();
      return baseNav(name);
    };
  }
  if (typeof heroStats === 'function') {
    const baseStats = heroStats;
    heroStats = function accountGearHeroStats(id) {
      const stats = baseStats(id);
      const add = bonus();
      const relicsAdd = relicBonus();
      const petsAdd = petBonus();
      const spiritsAdd = spiritBonus();
      const divineAdd = divineBonus();
      const antiquesAdd = antiqueBonus();
      const luckAdd = luckBonus();
      const illusionsAdd = illusionBonus();
      const fishAdd = fishBonus();
      return {
        ...stats,
        hp: Math.round((stats.hp + add.hp + relicsAdd.hp + petsAdd.hp + spiritsAdd.hp + antiquesAdd.hp + illusionsAdd.hp + fishAdd.hp) * (1 + divineAdd.hp + luckAdd.hp)),
        atk: Math.round((stats.atk + add.atk + relicsAdd.atk + petsAdd.atk + spiritsAdd.atk + antiquesAdd.atk + illusionsAdd.atk + fishAdd.atk) * (1 + divineAdd.atk + luckAdd.atk)),
        def: Math.round((stats.def + add.def + relicsAdd.def + petsAdd.def + spiritsAdd.def + antiquesAdd.def + illusionsAdd.def + fishAdd.def) * (1 + divineAdd.def + luckAdd.def)),
        spd: Math.round((stats.spd + add.spd + relicsAdd.spd + petsAdd.spd + spiritsAdd.spd + antiquesAdd.spd + illusionsAdd.spd + fishAdd.spd) * (1 + divineAdd.spd + luckAdd.spd))
      };
    };
  }

  window.HonVietAccountGear = { openAssistWheel, openBoard, openSmelt, openRelic, openPet, openSpirit, openDivine, openStar, openAntique, openLuck, openIllusion, openFish, close: hide, slots };
})();
