"""One-time migration from checkpoint 7757ac07. Refuses duplicate application."""
from pathlib import Path
R=Path(__file__).resolve().parents[2]
p=R/'src/ui/shop-screen.css'; s=p.read_text(encoding='utf-8')
assert 'CANONICAL_SHOP_MODAL' not in s
# Remove the entire accumulated repair tail, retaining original geometry only.
s=s[:s.index('/* Owner 2026-11-03: không đủ điểm')]
# Remove obsolete forced legacy close block.
a=s.index('#hvShopRoot.hv-shopl:not(.is-tile-open) .hv-shopc-x,'); b=s.index('#hvShopRoot.hv-shopl:not(.is-tile-open) .hv-shopc-title',a)
s=s[:a]+s[b:]
s+='''\n/* CANONICAL_SHOP_MODAL: one overlay, authored frame, independent close control. */
html body #hvShopRoot.hv-shopl{
 position:fixed!important;inset:0!important;z-index:120!important;min-height:0!important;
 height:100dvh!important;width:100%!important;box-sizing:border-box!important;
 background:rgba(5,3,1,.46)!important;padding:12px!important;overflow:auto!important;
 align-items:center!important;justify-content:center!important;
}
html body #hvShopRoot.hv-shopl::before,html body #hvShopRoot.hv-shopl::after{display:none!important;content:none!important}
html body #hvShopRoot.hv-shopl .hv-shopc-x,html body #hvShopRoot.hv-shopl .hv-shopc-title{display:none!important}
html body #hvShopRoot .hv-cityf,html body #hvShopRoot .hv-ptsf{
 width:min(calc(100vw - 24px),calc((100dvh - 24px) * 768 / 1376))!important;
 flex:none;overflow:visible;filter:drop-shadow(0 8px 14px #0008);
}
html body #hvShopRoot.hv-shopl .hv-shopf{
 width:min(calc(100vw - 24px),calc((100dvh - 24px) * 717 / 1194))!important;
 flex:none;overflow:visible;filter:drop-shadow(0 8px 14px #0008);
}
html body #hvShopRoot .hv-cityf-x,html body #hvShopRoot .hv-ptsf-x,html body #hvShopRoot .hv-shopf .hv-shop-back{
 position:absolute!important;left:auto!important;right:1.8%!important;top:1.4%!important;
 width:11%!important;height:auto!important;min-height:0!important;aspect-ratio:1;
 background:transparent url('assets/ui/jobs/jobs-close.png') center/contain no-repeat!important;
 border:0!important;border-radius:50%!important;padding:0!important;margin:0!important;
 box-shadow:none!important;z-index:10!important;font-size:0!important;line-height:1!important;
 cursor:pointer;display:block!important;appearance:none;
}
html body #hvShopRoot .hv-shopf-pill,html body #hvShopRoot .hv-ptsf-pill{
 min-height:0!important;min-width:0!important;padding:0!important;margin:0!important;
 display:flex!important;align-items:center!important;justify-content:center!important;line-height:1!important;
}
html body #hvShopRoot .hv-shopf-pill img,html body #hvShopRoot .hv-ptsf-pill img{display:block;width:3cqw!important;height:3cqw!important;flex:none;object-fit:contain}
html body #hvShopRoot .hv-shop-buy,html body #hvShopRoot .hv-ptsf-btn{
 display:flex!important;align-items:center!important;justify-content:center!important;
 min-height:0!important;min-width:0!important;margin:0!important;padding:0!important;line-height:1!important;appearance:none;
}
html body #hvShopRoot .hv-ptsf-btn:disabled{opacity:.55;filter:grayscale(1);cursor:default}
html body #hvShopRoot .hv-ptsf-name b{font-size:2.9cqw;line-height:1.15;white-space:normal;overflow:hidden;max-height:2.3em}
html body #hvShopRoot .hv-cityf-title{display:grid!important}
html body #hvShopRoot .hv-shopf-pill.c{border-radius:99px!important;background:#1b100ccc!important;padding:0 .4cqw!important}
'''
p.write_text(s,encoding='utf-8',newline='\n')
p=R/'src/ui/shop-3d-runtime.js'; s=p.read_text(encoding='utf-8')
s=s.replace("    root.setAttribute('aria-label', 'Chợ Lục Châu');", "    root.setAttribute('aria-label', 'Chợ Lục Châu');\n    root.setAttribute('role', 'dialog');\n    root.setAttribute('aria-modal', 'true');")
s=s.replace("    baseShowScreen(name);\n    syncOpen(ST.screen);", "    // Real hub DOM behind the modal. Never substitute a concept image backdrop.\n    baseShowScreen(name === 'shop' ? 'hub' : name);\n    if (name === 'shop') ST.screen = 'shop';\n    syncOpen(name);")
# The root capture handler used to accumulate each time innerHTML recreated city.
s=s.replace("      root.addEventListener('click', ev => {", "      if (!root.__shopBackBound) {\n      root.__shopBackBound = true;\n      root.addEventListener('click', ev => {")
s=s.replace("      }, true);\n    }", "      }, true);\n      }\n    }")
p.write_text(s,encoding='utf-8',newline='\n')
print('canonical CSS and real hub modal applied')
