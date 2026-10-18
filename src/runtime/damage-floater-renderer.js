function drawCompactDamageFloater(context,floater,age,visibleFloaterBounds){
  let pop=1;
  if(age<.09)pop=.58+(age/.09)*.60;
  else if(age<.18)pop=1.18-((age-.09)/.09)*.16;
  else if(age<.30)pop=1.02+Math.sin((age-.18)/.12*Math.PI)*.03;
  const fontPx=floater.isCrit?22:18;
  const critical=String(floater.text).match(/^(?:BẠO KÍCH|BAO KICH|CRIT)\s*([−-]?\d[\d.,]*)$/i);
  const rawNumber=critical?critical[1]:String(floater.text);
  const number=rawNumber.replace(/^([−-]?)(\d+)$/,(_,sign,digits)=>sign+digits.padStart(3,'0')); 
  const font=size=>'900 italic '+size+'px "Arial","DejaVu Sans",system-ui,sans-serif';
  context.font=font(fontPx);const numberWidth=context.measureText(number).width;
  const labelWidth=floater.isCrit?17:0;
  const width=numberWidth+labelWidth;
  let safe=visibleFloaterBounds(width*pop,10);
  // The column remains inside the visible canvas even for large damage values.
  if(Number.isFinite(safe.right-safe.left)){
    pop=Math.min(pop,Math.max(.1,(safe.right-safe.left-20)/Math.max(1,width)));
    safe=visibleFloaterBounds(width*pop,10);
  }
  context.translate(safe.x,floater.y);context.scale(pop,pop);
  context.textAlign='left';context.lineJoin='round';context.miterLimit=2;
  context.lineWidth=floater.isCrit?3.5:3;
  context.strokeStyle=floater.isCrit?'#ffe6c4':'rgba(45,14,7,.96)';
  context.shadowColor='rgba(30,12,18,.5)';context.shadowBlur=2;
  const g=context.createLinearGradient(0,-fontPx,0,fontPx*.45);
  g.addColorStop(0,floater.isCrit?'#bd3a56':'#fff3a1');g.addColorStop(.4,floater.isCrit?'#9e2345':'#ffd34b');g.addColorStop(1,floater.isCrit?'#74152f':'#ffb52e');context.fillStyle=g;
  if(floater.isCrit){
    // Vector impact star: no missing glyph or emoji substitution on iOS/Android.
    const x=-width/2+7;
    context.beginPath();context.moveTo(x,-8);context.lineTo(x+2,-2);
    context.lineTo(x+7,0);context.lineTo(x+2,2);context.lineTo(x,8);
    context.lineTo(x-2,2);context.lineTo(x-7,0);context.lineTo(x-2,-2);
    context.closePath();context.stroke();context.fill();
  }
  context.font=font(fontPx);context.strokeText(number,-width/2+labelWidth,0);context.fillText(number,-width/2+labelWidth,0);
}

