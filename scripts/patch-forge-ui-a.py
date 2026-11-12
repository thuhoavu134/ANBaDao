"""Mau A man Ren: ao giao dien bang anh gpt_image + thanh tien trinh ren. Giu nguyen logic."""
from pathlib import Path
p = Path(__file__).resolve().parents[1] / 'index.html'
t = p.read_text(encoding='utf-8')
n0 = len(t)

def rep(old, new, count=1):
    global t
    c = t.count(old)
    assert c == count, (old[:70], c)
    t = t.replace(old, new)

A = 'assets/ui/forge/v2/'

# 1) Hero cu -> canh lo ren + bien LO REN + chips
rep('''b.innerHTML=`<div class="econ-stage"><div class="econ-hero"><img class="econ-hero-icon" src="assets/meta/economy/icon-forge.png" alt=""><div><div class="econ-eyebrow">Xưởng Mộng · v2.72 Rèn Khuôn</div><div class="econ-title">Rèn Mộng</div><div class="econ-copy">Chọn Khuôn để định hướng bộ trang bị, hoặc dùng Song Rèn đổi thêm nguyên liệu lấy quyền chọn giữa hai phôi. Khuôn tạo lối build ngang, không mở cấp vô hạn.</div><div class="econ-chips">''',
    '''b.innerHTML=`<div class="econ-stage fa-stage"><div class="fa-hero"><img class="fa-scene" src="''' + A + '''scene.webp" alt=""><img class="fa-plaque" src="''' + A + '''plaque.webp" alt="Lò Rèn"><div class="econ-chips fa-chips">''')
rep('''<span class="econ-chip">Pity ${econ().craftPity}/${ECON.craftPitySSR}</span></div></div></div><div class="econ-grid">''',
    '''<span class="econ-chip">Pity ${econ().craftPity}/${ECON.craftPitySSR}</span></div></div><div class="econ-grid">''')

# 2) Nut ren / song ren bang anh
rep('''<button class="btn forge-slot craftb" data-s="${s}"><img src="assets/meta/economy/icon-forge.png" alt=""><span><b>${DATA.items.slotName[s]}</b><br><small>Rèn thường · ${CRAFT.tinh}⚗ + 🪙${CRAFT.gold}</small></span></button><button class="btn ghost sm dualb" data-s="${s}" ${pending?'disabled':''}>Song Rèn · ${DUAL_FORGE.tinh}⚗ + 🪙${DUAL_FORGE.gold}</button>''',
    '''<div class="fa-slotname">${DATA.items.slotName[s]}</div><button class="fa-ib fa-ren craftb" data-s="${s}" aria-label="Rèn ${DATA.items.slotName[s]}"></button><small class="fa-cost">${CRAFT.tinh}⚗ + 🪙${CRAFT.gold}</small><button class="fa-ib fa-songren dualb" data-s="${s}" aria-label="Song Rèn ${DATA.items.slotName[s]}" ${pending?'disabled':''}></button><small class="fa-cost">${DUAL_FORGE.tinh}⚗ + 🪙${DUAL_FORGE.gold}</small>''')

# 3) Nut trong the trang bi
rep('''<button class="btn sm enh" data-u="${it.uid}" ${it.lvl>=gearMaxLvl(it)?'disabled':''}>${it.lvl>=gearMaxLvl(it)?'+'+gearMaxLvl(it)+' MAX':('Cường hoá · '+enhCostStr(it))}</button><button class="btn ghost sm eqp" data-u="${it.uid}">Trang bị</button><button class="btn ghost sm salv" data-u="${it.uid}" ${eb?'disabled':''}>Phân giải</button>''',
    '''<button class="fa-ib fa-cuonghoa enh" data-u="${it.uid}" aria-label="Cường hoá" ${it.lvl>=gearMaxLvl(it)?'disabled':''}></button><button class="fa-ib fa-trangbi eqp" data-u="${it.uid}" aria-label="Trang bị"></button><button class="fa-ib fa-phanra salv" data-u="${it.uid}" aria-label="Phân rã" ${eb?'disabled':''}></button></div><div class="fa-cost">${it.lvl>=gearMaxLvl(it)?'+'+gearMaxLvl(it)+' MAX':('Cường hoá: '+enhCostStr(it))}''')
rep('''<button class="btn ghost sm" id="eqCancel">Huỷ</button>''', '''<button class="fa-ib fa-huy" id="eqCancel" aria-label="Huỷ"></button>''')

# 4) Tab loc kho: Vu khi / Giap / Trang suc (chi loc hien thi)
rep('''<div class="econ-panel full"><h3>🎒 Kho trang bị · ${inv.length} món</h3>${inv.length?`<div class="econ-itemgrid">${cards}</div>`''',
    '''<div class="econ-panel full"><div class="fa-tabs">${[['all','',''],['weapon','tab-vukhi','Vũ khí'],['armor','tab-giap','Giáp'],['acc','tab-trangsuc','Trang sức']].map(([k,img,lb])=>k==='all'?`<button class="fa-tab fa-tab-all ${(ST.forgeTab||'all')==='all'?'on':''}" data-t="all">Tất cả</button>`:`<button class="fa-tab ${ST.forgeTab===k?'on':''}" data-t="${k}" aria-label="${lb}" style="background-image:url('''+"'"+A+'''${img}.webp')"></button>`).join('')}</div><h3>🎒 Kho trang bị · ${inv.length} món</h3>${inv.length?`<div class="econ-itemgrid">${cards}</div>`''')
rep('''const inv=P.inventory.slice().sort(''', '''const __faTab=ST.forgeTab||'all'; const inv=P.inventory.filter(i=>__faTab==='all'||(__faTab==='acc'?(i.slot==='charm'||i.slot==='boots'):i.slot===__faTab)).slice().sort(''')

# 5) Bo icon cu, gan tab + thanh tien trinh cho ren / song ren / cuong hoa
rep('''const forgeHero=b.querySelector('.econ-hero-icon'); if(forgeHero)forgeHero.src='assets/ui/menu-v3233/icons/forge.png'; b.querySelectorAll('.forge-slot img').forEach(img=>img.src='assets/ui/menu-v3233/icons/forge.png');''',
    '''b.querySelectorAll('.fa-tab').forEach(x=>x.addEventListener('click',()=>{ST.forgeTab=x.dataset.t;renderForge();}));''')
rep('''b.querySelectorAll('.craftb').forEach(x=>x.addEventListener('click',()=>{if(craftItem(x.dataset.s))renderForge();}));''',
    '''b.querySelectorAll('.craftb').forEach(x=>x.addEventListener('click',()=>forgeProgressRun(()=>{if(craftItem(x.dataset.s))renderForge();})));''')
rep('''b.querySelectorAll('.dualb').forEach(x=>x.addEventListener('click',()=>{const r=startDualForge(x.dataset.s);toast(r.ok?'🔥 Song Rèn đã ra hai phôi — chọn một.':r.msg);renderForge();}));''',
    '''b.querySelectorAll('.dualb').forEach(x=>x.addEventListener('click',()=>forgeProgressRun(()=>{const r=startDualForge(x.dataset.s);toast(r.ok?'🔥 Song Rèn đã ra hai phôi — chọn một.':r.msg);renderForge();})));''')
rep('''b.querySelectorAll('.enh').forEach(x=>x.addEventListener('click',()=>{if(enhanceItem(+x.dataset.u))renderForge();}));''',
    '''b.querySelectorAll('.enh').forEach(x=>x.addEventListener('click',()=>forgeProgressRun(()=>{if(enhanceItem(+x.dataset.u))renderForge();})));''')

# 6) Ham thanh tien trinh (dat ngay truoc renderForge)
rep('function renderForge(){ const b=document.getElementById(\'forgeBody\');',
    '''function forgeProgressRun(done){ if(window.__faBusy)return; window.__faBusy=true;
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches; const dur=reduce?400:1600;
  const ov=document.createElement('div'); ov.className='fa-prog'; ov.innerHTML=`<div class="fa-prog-box"><div class="fa-prog-lbl">Đang rèn...</div><div class="fa-prog-bar"><div class="fa-prog-fill"></div><img class="fa-prog-frame" src="''' + A + '''bar-frame.webp" alt=""><i class="fa-spark"></i></div><div class="fa-prog-pct">0%</div></div>`;
  document.body.appendChild(ov); const fill=ov.querySelector('.fa-prog-fill'), pct=ov.querySelector('.fa-prog-pct'), sp=ov.querySelector('.fa-spark'); const t0=performance.now();
  const step=now=>{ const k=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-k,2), v=Math.round(e*100); fill.style.clipPath=`inset(0 ${100-v}% 0 0)`; sp.style.left=v+'%'; pct.textContent=v+'%';
    if(k<1)requestAnimationFrame(step); else setTimeout(()=>{ ov.remove(); window.__faBusy=false; try{done();}catch(err){console.error(err);} },reduce?60:220); };
  requestAnimationFrame(step); }
function renderForge(){ const b=document.getElementById('forgeBody');''')

# 7) CSS (sau block light theme de de len)
CSS = '''
/* Lo Ren mau A (owner 11/11): ao bang anh gpt_image */
#forgeScreen,#forgeScreen::before{background:#1a120c!important}
#forgeScreen::before{background:radial-gradient(120% 70% at 50% 0%,rgba(255,150,60,.18),transparent 70%),#1a120c!important;opacity:1!important}
#forgeScreen .econ-stage.fa-stage{padding-top:0!important}
#forgeScreen .fa-hero{position:relative;margin:0 0 10px;border-radius:14px;overflow:hidden;box-shadow:0 10px 26px rgba(0,0,0,.5)}
#forgeScreen .fa-scene{display:block;width:100%;aspect-ratio:3/2;object-fit:cover}
#forgeScreen .fa-plaque{position:absolute;left:50%;top:6px;transform:translateX(-50%);width:min(58%,300px);filter:drop-shadow(0 4px 6px rgba(0,0,0,.55))}
#forgeScreen .fa-chips{position:absolute;left:8px;right:8px;bottom:8px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
#forgeScreen .fa-chips .econ-chip{background:rgba(30,18,10,.78)!important;color:#ffe2a8!important;border:1px solid rgba(240,180,90,.55)!important}
#forgeScreen .econ-panel{background:url(''' + A + '''panel.webp) center/100% 100% no-repeat!important;border:0!important;box-shadow:none!important;padding:22px 20px!important;color:#ffe9c4!important}
#forgeScreen .econ-panel h3{color:#ffd27a!important;text-shadow:0 1px 2px #000}
#forgeScreen .econ-panel .meta,#forgeScreen .econ-muted,#forgeScreen .fa-cost{color:#f3d9b0!important}
#forgeScreen .econ-item{background:rgba(40,24,12,.72)!important;border:1px solid rgba(230,170,80,.35)!important;border-radius:12px!important;color:#ffe9c4!important}
#forgeScreen .fa-ib{display:inline-block;border:0;padding:0;margin:2px;cursor:pointer;background:center/contain no-repeat;width:120px;height:57px;font-size:0;filter:drop-shadow(0 3px 4px rgba(0,0,0,.45));transition:transform .08s}
#forgeScreen .fa-ib:active{transform:scale(.95)}
#forgeScreen .fa-ib[disabled]{filter:grayscale(1) brightness(.7);opacity:.6;cursor:default}
#forgeScreen .econ-item .fa-ib{width:31%;max-width:110px;height:auto;aspect-ratio:453/214}
#forgeScreen .fa-ren{background-image:url(''' + A + '''btn-ren.webp)}
#forgeScreen .fa-songren{background-image:url(''' + A + '''btn-songren.webp)}
#forgeScreen .fa-cuonghoa{background-image:url(''' + A + '''btn-cuonghoa.webp)}
#forgeScreen .fa-trangbi{background-image:url(''' + A + '''btn-trangbi.webp)}
#forgeScreen .fa-phanra{background-image:url(''' + A + '''btn-phanra.webp)}
#forgeScreen .fa-huy{background-image:url(''' + A + '''btn-huy.webp)}
#forgeScreen .forge-slotbar{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:10px}
#forgeScreen .forge-action{display:flex;flex-direction:column;align-items:center;gap:2px;background:rgba(40,24,12,.6);border-radius:12px;padding:8px 4px}
#forgeScreen .fa-slotname{font-weight:800;color:#ffd27a;text-shadow:0 1px 2px #000}
#forgeScreen .fa-cost{font-size:11px;display:block;text-align:center;margin-bottom:4px}
#forgeScreen .fa-tabs{display:flex;gap:6px;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
#forgeScreen .fa-tab{border:0;padding:0;cursor:pointer;width:88px;height:38px;background:center/contain no-repeat;font-size:0;opacity:.55;filter:saturate(.6)}
#forgeScreen .fa-tab.on{opacity:1;filter:drop-shadow(0 0 6px rgba(255,200,90,.8))}
#forgeScreen .fa-tab-all{font-size:12px;font-weight:800;color:#ffe2a8;background:rgba(40,24,12,.8);border:1px solid rgba(230,170,80,.5);border-radius:10px;width:auto;padding:0 10px;height:32px}
.fa-prog{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(10,6,3,.62)}
.fa-prog-box{width:min(88vw,420px);text-align:center}
.fa-prog-lbl{font-weight:900;color:#ffd27a;font-size:18px;text-shadow:0 2px 4px #000;margin-bottom:6px}
.fa-prog-bar{position:relative;width:100%;aspect-ratio:900/197}
.fa-prog-fill{position:absolute;left:11%;right:5%;top:30%;bottom:30%;background:url(''' + A + '''bar-fill.webp) center/100% 100% no-repeat;clip-path:inset(0 100% 0 0);border-radius:6px}
.fa-prog-frame{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.fa-spark{position:absolute;top:50%;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;background:radial-gradient(circle,#fff6c9,#ffb347 45%,transparent 70%);margin-left:calc(11% - 9px);transform:translateX(calc(var(--k,0)*1px))}
.fa-prog-pct{color:#ffe9c4;font-weight:800;margin-top:4px;text-shadow:0 1px 2px #000}
@media (prefers-reduced-motion: reduce){.fa-spark{display:none}}
'''
anchor = '#shopScreen .econ-panel,#summonScreen .econ-panel,#forgeScreen .econ-panel{'
i = t.index(anchor)
j = t.index('\n', i)
t = t[:j + 1] + CSS + t[j + 1:]
p.write_text(t, encoding='utf-8')
print('patched', n0, '->', len(t))
