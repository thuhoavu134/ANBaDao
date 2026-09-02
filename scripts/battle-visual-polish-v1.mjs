import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const p=join(process.cwd(),'dist','battle.html');
let s=readFileSync(p,'utf8');

function must(re,to,label){
  if(!re.test(s)) throw new Error(`battle-visual-polish-v1 missing ${label}`);
  s=s.replace(re,to);
}

// 1) Runtime battlefield is image-based. Keep a chapter registry so each chapter can
// swap to its own authored/AI-generated scenic asset without touching combat code.
if(!s.includes('const BATTLE_MAP_REGISTRY=')){
  must(
    /const VIETNAM_HORIZON = new Image\(\);\n  VIETNAM_HORIZON\.decoding = "async";\n  \/\*[\s\S]*?no broken request is emitted in direct mode\. \*\//,
    `const BATTLE_MAP_REGISTRY=Object.freeze({\n    1:'assets/hub/hub-bg-city-clean-v2571.png',\n    default:'assets/hub/hub-bg-city-clean-v2571.png'\n  });\n  function battleChapterNumber(){\n    const raw=String(EMBED_CONFIG.chapterId||EMBED_CONFIG.chapter||EMBED_CONFIG.chapterTitle||'1');\n    const m=raw.match(/\\d+/); return m?Math.max(1,Number(m[0])||1):1;\n  }\n  const VIETNAM_HORIZON = new Image();\n  VIETNAM_HORIZON.decoding = "async";\n  VIETNAM_HORIZON.src=BATTLE_MAP_REGISTRY[battleChapterNumber()]||BATTLE_MAP_REGISTRY.default;\n  window.__HV_BATTLE_MAPS=Object.freeze({registry:BATTLE_MAP_REGISTRY,chapter:()=>battleChapterNumber(),source:()=>VIETNAM_HORIZON.src});`,
    'battle map image source'
  );
}

// Remove the old CSS-painted canvas background in embedded campaign mode. The canvas
// is now fully owned by drawBackground() and its image source.
if(!s.includes('id="hv-image-map-override-v1"')){
  s=s.replace('</head>',`<style id="hv-image-map-override-v1">\n.embedded-battle.reference-simple #gameCanvas{background:transparent!important}\n.embedded-battle.reference-simple .game-viewport{background:#111!important}\n</style>\n</head>`);
}

// 2) Damage popup: stack more concurrent hits, keep each line readable and mark damage/crit.
must(
  /  function addFloater\(unit, text, color, large = false\) \{[\s\S]*?\n  \}\n\n  function burst\(/,
`  function addFloater(unit, text, color, large = false) {\n    const now=performance.now();\n    const raw=String(text??'');\n    const isCrit=/BẠO KÍCH|BAO KICH|CRIT/i.test(raw);\n    const isDamage=isCrit||/^[−-]\\s*\\d/.test(raw)||/^[−-]\\d/.test(raw);\n    const recent=floaters.filter(item=>item.unitId===unit.id&&now-item.createdAt<950&&item.isDamage===isDamage).length;\n    const lane=recent%6;\n    const side=(lane%2===0?-1:1)*Math.floor((lane+1)/2);\n    floaters.push({\n      unitId:unit.id,\n      createdAt:now,\n      x:unit.x+side*10,\n      y:unit.y-108-lane*27,\n      text:raw,\n      color,\n      large,\n      isDamage,\n      isCrit,\n      life:isDamage?1.35:1,\n      drift:side*1.8\n    });\n  }\n\n  function burst(`,
  'addFloater'
);

// Hold damage lines longer and let them float more slowly so multi-hit skills create
// a satisfying vertical stream instead of overwriting one number.
must(
  /floater\.life -= delta \* 0\.82;\n      floater\.y -= delta \* 42;\n      floater\.x \+= floater\.drift \* delta;/,
  `floater.life -= delta * (floater.isDamage?0.58:0.82);\n      floater.y -= delta * (floater.isDamage?27:42);\n      floater.x += floater.drift * delta;`,
  'floater update'
);

// Bounce/pop animation inspired by the reference: hard outline, warm damage fill,
// larger critical text, slight overshoot then settle. Status/heal floaters retain old colors.
must(
  /    for \(const floater of floaters\) \{\n      context\.save\(\);\n      context\.globalAlpha = Core\.clamp\(floater\.life \* 1\.7, 0, 1\);\n      context\.textAlign = "center";\n      context\.textBaseline = "middle";\n      context\.font = `\$\{floater\.large \? 900 : 800\} \$\{floater\.large \? 25 : 18\}px system-ui, sans-serif`;\n      context\.lineWidth = 5;\n      context\.strokeStyle = "rgba\(5,18,16,\.85\)";\n      context\.strokeText\(floater\.text, floater\.x, floater\.y\);\n      context\.fillStyle = floater\.color;\n      context\.fillText\(floater\.text, floater\.x, floater\.y\);/,
`    for (const floater of floaters) {\n      context.save();\n      const age=Math.max(0,(performance.now()-floater.createdAt)/1000);\n      context.globalAlpha=Core.clamp(floater.life*1.45,0,1);\n      context.textAlign="center";\n      context.textBaseline="middle";\n      if(floater.isDamage){\n        let pop=1;\n        if(age<.09) pop=.58+(age/.09)*.78;\n        else if(age<.18) pop=1.36-((age-.09)/.09)*.34;\n        else if(age<.30) pop=1.02+Math.sin((age-.18)/.12*Math.PI)*.06;\n        const fontPx=floater.isCrit?31:24;\n        context.translate(floater.x,floater.y);\n        context.scale(pop,pop);\n        context.font=\`900 italic \${fontPx}px "Arial Black","Impact",system-ui,sans-serif\`;\n        context.lineJoin="round";\n        context.miterLimit=2;\n        context.lineWidth=floater.isCrit?8:7;\n        context.strokeStyle=floater.isCrit?'rgba(93,16,4,.98)':'rgba(45,14,7,.96)';\n        context.shadowColor=floater.isCrit?'rgba(255,84,0,.82)':'rgba(255,179,45,.38)';\n        context.shadowBlur=floater.isCrit?10:5;\n        context.strokeText(floater.text,0,0);\n        const g=context.createLinearGradient(0,-fontPx,0,fontPx*.45);\n        if(floater.isCrit){g.addColorStop(0,'#fff3a1');g.addColorStop(.38,'#ffd34b');g.addColorStop(1,'#ff7a10');}\n        else{g.addColorStop(0,'#fff7be');g.addColorStop(.48,'#ffd45b');g.addColorStop(1,'#ff9b27');}\n        context.fillStyle=g;\n        context.fillText(floater.text,0,0);\n      }else{\n        context.font=\`\${floater.large?900:800} \${floater.large?25:18}px system-ui,sans-serif\`;\n        context.lineWidth=5;\n        context.strokeStyle="rgba(5,18,16,.85)";\n        context.strokeText(floater.text,floater.x,floater.y);\n        context.fillStyle=floater.color;\n        context.fillText(floater.text,floater.x,floater.y);\n      }`,
  'floater renderer'
);

writeFileSync(p,s);
console.log('Battle visual polish v1 applied: image chapter map + stacked bouncing damage font');
