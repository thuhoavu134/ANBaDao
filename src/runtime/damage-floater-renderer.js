function drawCompactDamageFloater(context,floater,age,visibleFloaterBounds){
  let pop=1;
  if(age<.09)pop=.58+(age/.09)*.60;
  else if(age<.18)pop=1.18-((age-.09)/.09)*.16;
  else if(age<.30)pop=1.02+Math.sin((age-.18)/.12*Math.PI)*.03;
  const fontPx=floater.isCrit?22:18;
  const critical=String(floater.text).match(/^(?:BẠO KÍCH|BAO KICH|CRIT)\s*([−-]?\d[\d.,]*)$/i);
  const label=critical?'Bạo kích ':'';
  const number=critical?critical[1]:String(floater.text);
  const font=size=>'900 italic '+size+'px "Arial",system-ui,sans-serif';
  context.font=font(fontPx);const numberWidth=context.measureText(number).width;
  context.font=font(14);const labelWidth=label?context.measureText(label).width:0;
  const width=numberWidth+labelWidth,safe=visibleFloaterBounds(width*pop,10);
  context.translate(safe.x,floater.y);context.scale(pop,pop);
  context.textAlign='left';context.lineJoin='round';context.miterLimit=2;
  context.lineWidth=floater.isCrit?3.5:3;
  context.strokeStyle=floater.isCrit?'rgba(93,16,4,.98)':'rgba(45,14,7,.96)';
  context.shadowColor='rgba(255,140,20,.45)';context.shadowBlur=2;
  const g=context.createLinearGradient(0,-fontPx,0,fontPx*.45);
  g.addColorStop(0,'#fff3a1');g.addColorStop(.4,'#ffd34b');g.addColorStop(1,floater.isCrit?'#ff7a10':'#ff9b27');context.fillStyle=g;
  if(label){context.font=font(14);context.strokeText(label,-width/2,0);context.fillText(label,-width/2,0);}
  context.font=font(fontPx);context.strokeText(number,-width/2+labelWidth,0);context.fillText(number,-width/2+labelWidth,0);
}
