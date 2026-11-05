// Owner 2026-11-05: man show SSR (san dinh) phai chay DUNG renderer idle cua man chi tiet tuong.
// Luc Anh / Linh Dong / Bach Dien la 3 renderer cu ve vao canvas co id co dinh va dung chung _lucDetailRaf.
// Buoc nay chay CUOI build (sau moi owner da viet lai cac ham nay) va them mot tham so canvas dich tuy chon:
//   startXDetailIdle()        -> hanh vi cu y nguyen (man chi tiet)
//   startXDetailIdle(canvas)  -> ve vao canvas do, RAF rieng, tra ve ham dung.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const NAMES = [
  ['startLucAnhDetailIdle', 'lucAnhDetailIdle'],
  ['startLinhDongDetailIdle', 'linhDongDetailIdle'],
  // Be An: canvas do markup dat width/height = o atlas; canvas dich phai nhan cung kich thuoc
  ['startBeAnDetailIdle', 'beAnDetailIdle', 'if(target){cv.width=BE_AN_META_DETAIL.cellW;cv.height=BE_AN_META_DETAIL.cellH;}']
];

function bodyEnd(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) return i;
  }
  throw new Error('detail idle target: unbalanced body');
}

function must(text, from, to, label) {
  if (!text.includes(from)) throw new Error('detail idle target: missing ' + label);
  return text.split(from).join(to);
}

export function patchDetailIdleTargets(html) {
  for (const [fn, id, size] of NAMES) {
    const head = 'function ' + fn + '(){';
    const at = html.indexOf(head);
    if (at < 0) {
      if (html.includes('function ' + fn + '(target){')) continue; // da patch
      throw new Error('detail idle target: missing ' + fn);
    }
    const open = at + head.length - 1;
    const close = bodyEnd(html, open);
    let body = html.slice(open + 1, close);
    body = must(body, 'cancelAnimationFrame(_lucDetailRaf);', 'if(own)cancelAnimationFrame(_lucDetailRaf);', fn + ' cancel');
    body = must(body, "document.getElementById('" + id + "')", "(target||document.getElementById('" + id + "'))", fn + ' canvas');
    if (size) body = must(body, 'if(!cv)return;', 'if(!cv)return;' + size, fn + ' size');
    body = must(body, '_lucDetailRaf=requestAnimationFrame(tick)', '(raf=requestAnimationFrame(tick),own&&(_lucDetailRaf=raf))', fn + ' raf');
    body = body.split('_lucDetailRaf=0;').join('if(own)_lucDetailRaf=0;');
    body = body.split("ST.screen!=='heroDetail'").join("(own&&ST.screen!=='heroDetail')");
    const next = 'function ' + fn + '(target){const own=!target;let raf=0;' + body + ';return()=>cancelAnimationFrame(raf);}';
    html = html.slice(0, at) + next + html.slice(close + 1);
  }
  return html;
}

// Dinh Loi / Thay Mo: renderer tu tao canvas sau .hsava trong stage -> ham rieng.
function patchOwnerRefresh(html) {
  const head = 'function startOwnerRefreshDetailIdle(id){';
  const at = html.indexOf(head);
  if (at < 0) {
    if (html.includes('function startOwnerRefreshDetailIdle(id,target){')) return html;
    throw new Error('detail idle target: missing startOwnerRefreshDetailIdle');
  }
  const open = at + head.length - 1, close = bodyEnd(html, open);
  let b = html.slice(open + 1, close);
  const R = (f, t, l) => { b = must(b, f, t, 'owner refresh ' + l); };
  R('cancelAnimationFrame(_lucDetailRaf);', 'if(own)cancelAnimationFrame(_lucDetailRaf);', 'cancel');
  R("const stage=document.querySelector(", "const stage=own&&document.querySelector(", 'stage');
  R('if(!stage)return;', 'if(own&&!stage)return;', 'stage guard');
  R("const portrait=stage.querySelector('.hsava');if(!portrait)return;", "const portrait=own?stage.querySelector('.hsava'):null;if(own&&!portrait)return;", 'portrait');
  R("const cv=document.createElement('canvas')", "const cv=target||document.createElement('canvas')", 'canvas');
  R("cv.style.cssText='", "if(!own){cv.style.width='300px';cv.style.height='300px';}else cv.style.cssText='", 'css');
  R('portrait.after(cv);', 'if(own)portrait.after(cv);', 'insert');
  R("ST.screen!=='heroDetail'", "(own&&ST.screen!=='heroDetail')", 'screen guard');
  R("portrait.hidden=true;portrait.style.display='none';", "if(portrait){portrait.hidden=true;portrait.style.display='none';}", 'hide');
  R('_lucDetailRaf=requestAnimationFrame(tick)', '(raf=requestAnimationFrame(tick),own&&(_lucDetailRaf=raf))', 'raf');
  return html.slice(0, at) + 'function startOwnerRefreshDetailIdle(id,target){const own=!target;let raf=0;' + b + ';return()=>{cancelAnimationFrame(raf);abort.abort();};}' + html.slice(close + 1);
}

export function installDetailIdleTargets(root = process.cwd()) {
  const file = join(root, 'dist', 'index.html');
  writeFileSync(file, patchOwnerRefresh(patchDetailIdleTargets(readFileSync(file, 'utf8'))));
  console.log('Detail idle targets installed');
}
