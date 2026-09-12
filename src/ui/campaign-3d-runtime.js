(() => {
  if (typeof document === 'undefined' || !document.body) return;

  const hoist = () => {
    const root = document.getElementById('hvCampaignScene');
    if (!root) return null;
    if (root.parentElement !== document.body) document.body.append(root);
    root.classList.add('hv-campaign-3d');
    return root;
  };

  const syncOpen = name => {
    const root = hoist();
    if (!root) return;
    const open = name === 'campaign';
    root.classList.toggle('is-open', open);
    document.body.classList.toggle('campaign-3d-active', open);
  };

  const baseShowScreen = showScreen;
  showScreen = function showScreenWithCampaign3d(name) {
    baseShowScreen(name);
    syncOpen(ST.screen);
  };

  if (typeof renderCampaign === 'function') {
    const baseRender = renderCampaign;
    renderCampaign = function renderCampaignWith3d() {
      baseRender.apply(this, arguments);
      syncOpen(typeof ST === 'object' ? ST.screen : 'campaign');
    };
  }

  syncOpen(typeof ST === 'object' ? ST.screen : '');
})();
