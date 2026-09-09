/* One dialog owner shared by the encyclopedia and the existing battle scheduler. */
globalThis.createSplusSkillUI=function createSplusSkillUI(data){
  'use strict';
  const profiles=new Map(data.profiles.map(h=>[h.id,h]));
  const icons=new Map(data.skillIcons.map(i=>[i.id,i]));
  const labels={passive:'Nội tại',skill:'Kỹ năng 1',ultimate:'Tuyệt kỹ'};
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const dialog=el('dialog','splus-skill-dialog');dialog.id='splus-skill-dialog';dialog.setAttribute('aria-labelledby','splus-skill-title');
  const top=el('div','splus-dialog-top'),art=el('div','splus-dialog-art'),heading=el('div'),kind=el('p','splus-kicker'),title=el('h2');title.id='splus-skill-title';
  const closeButton=el('button','splus-close','×');closeButton.type='button';closeButton.setAttribute('aria-label','Đóng mô tả kỹ năng');
  heading.append(kind,title);top.append(art,heading,closeButton);
  const meter=el('p','splus-skill-meter'),target=el('p','splus-skill-target'),description=el('p','splus-skill-description'),effects=el('ul','splus-effects');
  const castButton=el('button','splus-cast','Thi triển'),footer=el('p','splus-skill-footer','Chạm tên tướng để trở về hồ sơ.');castButton.type='button';
  dialog.append(top,meter,target,description,effects,castButton,footer);document.body.append(dialog);
  let selection=null,opener=null,destroyed=false;
  const iconNode=(id)=>{const icon=icons.get(id);if(!icon)return el('span','splus-art-fallback','◇');
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',icon.rect.join(' '));svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.classList.add('splus-skill-art');
    const image=document.createElementNS(ns,'image');image.setAttribute('href',icon.atlas);image.setAttribute('width',String(icon.width));image.setAttribute('height',String(icon.height));svg.append(image);return svg;};
  function stateFor(options){return options?.getState?.()||null;}
  function updateButton(button,skill,state){
    const badge=button.querySelector('.splus-skill-badge');
    button.classList.toggle('rage-full',skill.slot==='ultimate'&&Number(state?.energy)>=100);
    if(skill.slot==='passive'){badge.textContent='P';return;}
    const cooldown=Number(state?.cooldowns?.[skill.slot]||0);
    badge.textContent=state?(cooldown>0?`${cooldown}h`:skill.slot==='ultimate'?`${Math.floor(state.energy||0)}/100`:'S1'):(skill.slot==='ultimate'?'ULT':'S1');
    button.dataset.cooldown=String(cooldown);button.dataset.rage=String(state?.energy??'');
  }
  function refresh(){
    for(const button of document.querySelectorAll('[data-splus-skill]')){const h=profiles.get(button.dataset.heroId),s=h?.skills[button.dataset.splusSkill];if(s)updateButton(button,s,stateFor(button.splusOptions));}
    if(!selection||!dialog.open)return;
    const {hero,skill,options}=selection,state=stateFor(options),cooldown=Number(state?.cooldowns?.[skill.slot]||0);
    meter.textContent=skill.slot==='passive'?'Tự động kích hoạt theo điều kiện':`${skill.cost} Nộ · Hồi chiêu cơ bản: ${skill.cooldown} hiệp${state?` · Hiện có ${Math.floor(state.energy||0)}/100 Nộ · Còn ${cooldown} hiệp hồi` : ''}`;
    castButton.hidden=skill.slot==='passive'||typeof options?.cast!=='function';
    castButton.disabled=!!state&&(state.canUse?.[skill.slot]===false||cooldown>0||state.energy<skill.cost);
    castButton.textContent=castButton.disabled?'Chưa thể thi triển':`Thi triển ${skill.shortName}`;
    footer.textContent=state?'Nhấn Thi triển để chọn mục tiêu trong trận.':`${hero.name} · ${hero.elementName} · ${labels[skill.slot]}`;
  }
  function open(heroId,slot,from,options={}){
    if(destroyed)return false;
    const hero=profiles.get(heroId),skill=hero?.skills[slot];if(!skill||!Object.hasOwn(labels,slot))return false;
    selection={hero,skill,options};opener=from||document.activeElement;
    kind.textContent=`${hero.name} · ${labels[slot]}`;title.textContent=skill.name;
    art.replaceChildren(iconNode(skill.iconId));target.textContent=`Mục tiêu: ${skill.target}`;description.textContent=skill.description;
    effects.replaceChildren(...skill.effects.map(t=>el('li','',t)));
    dialog.dataset.heroId=heroId;dialog.dataset.skill=slot;
    if(!dialog.open)dialog.showModal();refresh();closeButton.focus();return true;
  }
  function clearSelection(){const restore=opener;selection=null;opener=null;if(restore?.isConnected)restore.focus();}
  function close(){if(dialog.open)dialog.close();clearSelection();}
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  closeButton.addEventListener('click',close);
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
  dialog.addEventListener('close',()=>{if(!dialog.open)clearSelection();});
  castButton.addEventListener('click',()=>{if(!selection||castButton.disabled)return;const {skill,options}=selection;close();options.cast(skill.slot);});
  function button(heroId,slot,options={}){
    const hero=profiles.get(heroId),skill=hero?.skills[slot];if(!skill)return null;
    const b=el('button',`splus-skill-button ${slot}`);b.type='button';b.dataset.heroId=heroId;b.dataset.splusSkill=slot;b.splusOptions=options;
    b.setAttribute('aria-label',`Xem ${skill.shortName} của ${hero.name}`);b.setAttribute('aria-haspopup','dialog');
    const visual=el('span','splus-skill-visual');visual.append(iconNode(skill.iconId),el('span','splus-skill-badge'));
    b.append(visual,el('span','splus-skill-kind',labels[slot]),el('span','splus-skill-name',skill.shortName));
    b.addEventListener('click',()=>open(heroId,slot,b,options));updateButton(b,skill,stateFor(options));return b;
  }
  return {open,close,button,refresh,iconNode,destroy(){destroyed=true;close();dialog.remove();}};
};

