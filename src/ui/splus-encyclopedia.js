(()=>{'use strict';
  const $=id=>document.getElementById(id),colors={metal:'#e2c57a',soul:'#b2bfff',water:'#83d9ec',fire:'#ffaf82',wood:'#9cddb3',dream:'#cdb5f3'};
  const roles={guardian:'Đỡ đòn',healer:'Trị liệu',support:'Hỗ trợ',ranger:'Xạ thủ',striker:'Tiên phong',duelist:'Sát thủ',mystic:'Pháp sư'};
  const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
  let catalog=[],ui=null,returnHero=null,scroll=0;
  const strip=h=>{const n=node('div','splus-skill-strip');for(const slot of ['passive','skill','ultimate'])n.append(ui.button(h.id,slot));return n;};
  const fight=h=>{const a=node('a','fight',`Thử ${h.name}`);a.href='/battle.html?qaSplus42='+encodeURIComponent(h.id);return a;};
  function render(){
    const q=normalize($('search').value.trim()),list=catalog.filter(h=>($('element').value==='all'||h.element===$('element').value)&&($('role').value==='all'||h.role===$('role').value)&&normalize(h.name+' '+h.weapon+' '+h.elementName).includes(q));
    $('count').textContent=`${list.length} tướng · Chạm biểu tượng để xem chiêu`;$('heroes').replaceChildren();$('empty').hidden=list.length>0;
    for(const h of list){const card=node('article','hero-card');card.style.setProperty('--accent',colors[h.element]);card.dataset.heroId=h.id;
      const meta=node('p','meta',`${String(h.number).padStart(2,'0')} · ${h.elementName} · ${roles[h.role]}`),title=node('h2','',h.name),weapon=node('p','weapon',h.weapon);
      const actions=node('div','card-actions'),details=node('a','profile-link','Xem hồ sơ ↗');details.href='#'+h.id;details.dataset.profileLink=h.id;details.setAttribute('aria-label',`Xem hồ sơ ${h.name}`);details.addEventListener('click',()=>{scroll=window.scrollY;returnHero=h.id;});actions.append(details,fight(h));
      card.append(meta,title,weapon,strip(h),actions);$('heroes').append(card);
    }
  }
  function route(){if(!ui)return;ui.close();const id=decodeURIComponent(location.hash.slice(1)),h=catalog.find(x=>x.id===id),panel=$('profile-view');
    $('catalog-view').hidden=!!h;panel.hidden=!h;
    if(!h){document.title='Đồ giám S+ · Lục Thần';if(returnHero){const a=[...document.querySelectorAll('[data-profile-link]')].find(a=>a.dataset.profileLink===returnHero);a?.focus({preventScroll:true});window.scrollTo(0,scroll);}return;}
    document.title=`${h.name} · Đồ giám Lục Thần`;panel.replaceChildren();
    const back=node('button','back','← Về danh sách tướng');back.type='button';back.addEventListener('click',()=>{location.hash='';});
    const top=node('div','profile-top'),emblem=node('div','hero-emblem');
    if(h.art?.portrait){const img=node('img','hero-portrait');img.src=h.art.portrait;img.alt=h.name;emblem.append(img);}
    else emblem.append(ui.iconNode(h.skills.passive.iconId));
    const about=node('div'),meta=node('p','meta',`${h.elementName} · S+ · ${roles[h.role]}`);meta.style.color=colors[h.element];const title=node('h2','',h.name);title.tabIndex=-1;
    const facts=node('dl','profile-facts');for(const [label,text] of [['Vị trí đề xuất',h.recommendedSlots.map(s=>`Ô ${s+1}`).join(' / ')],['Vũ khí',h.weapon],['Giới tính',h.gender],['Tuổi',h.age]]){const pair=node('div');pair.append(node('dt','',label),node('dd','',text));facts.append(pair);}
    about.append(meta,title,node('p','introduction',h.introduction),facts);top.append(emblem,about);
    const bottom=node('div','profile-bottom'),skills=node('section'),voice=node('section');skills.append(node('h3','','Bộ kỹ năng'),node('p','note','Chạm một biểu tượng để mở mô tả đầy đủ.'),strip(h),fight(h));voice.append(node('h3','','Lời của tướng'));
    for(const [label,text] of [['Khi xuất hiện',h.voice.lobby],['Khi dùng Tuyệt kỹ',h.voice.ultimate]]){const quote=node('blockquote');quote.append(node('span','',label),document.createTextNode('“'+text+'”'));voice.append(quote);}
    bottom.append(skills,voice);panel.append(back,top,bottom);title.focus({preventScroll:true});panel.scrollIntoView({block:'start'});
  }
  async function load(){ $('retry').hidden=true;$('count').textContent='Đang mở đồ giám…';try{const r=await fetch('/splus42-catalog.json');if(!r.ok)throw Error('catalog');const data=await r.json();if(data.profiles?.length!==42||data.skillIcons?.length!==126)throw Error('incomplete');catalog=data.profiles;ui?.destroy();ui=globalThis.createSplusSkillUI(data);render();route();}catch{$('count').textContent='Chưa tải được đồ giám. Anh hùng vẫn đang chờ ở đây.';$('retry').hidden=false;}}
  for(const id of ['element','role'])$(id).addEventListener('change',render);$('search').addEventListener('input',render);
  $('reset').addEventListener('click',()=>{$('element').value='all';$('role').value='all';$('search').value='';render();});$('retry').addEventListener('click',load);window.addEventListener('hashchange',route);void load();
})();
