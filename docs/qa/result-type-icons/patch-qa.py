import re

p = r'C:/lt/wt-result-icons/docs/qa/result-type-icons/qa-result.mjs'
s = open(p, encoding='utf-8').read()

old_probe_head = """const PROBE = `(()=>{
  const root=document.getElementById('integratedResultV6');"""
new_probe_head = """const PROBE = `(()=>{
  const doc=document.getElementById('hvBattleFrame')?.contentDocument||document;
  const root=doc.getElementById('integratedResultV6');
  if(!root)return {missing:true,href:doc.location?doc.location.href:null};"""

assert old_probe_head in s, 'probe head missing'
s = s.replace(old_probe_head, new_probe_head)

# Root-relative queries already go through `root`; fix the one document-wide read.
s = s.replace(
    "overflow:over,scrollW:document.documentElement.scrollWidth,imgs};",
    "overflow:over,scrollW:doc.documentElement.scrollWidth,imgs};")

old_wait = """await p.wait('!!document.querySelector("#integratedResultV6.show")', 30000);"""
new_wait = """await p.wait(f + '.document.querySelector("#integratedResultV6.show")', 30000);"""
assert old_wait in s, 'overlay wait missing'
s = s.replace(old_wait, new_wait)

old_confirm = """await p.evaluate('document.querySelector("#integratedResultV6 [data-result-action=confirm]")?.click()');"""
new_confirm = """await p.evaluate(f + '.querySelector("#integratedResultV6 [data-result-action=confirm]")?.click()');"""
assert old_confirm in s, 'confirm click missing'
s = s.replace(old_confirm, new_confirm)

old_after = """      const f=document.getElementById('hvBattleFrame');
      return {url:location.href,resultVisible:!!document.querySelector('#integratedResultV6.show'),"""
new_after = """      const bf=document.getElementById('hvBattleFrame');
      const d=bf?bf.contentDocument:document;
      return {url:location.href,resultVisible:!!d.querySelector('#integratedResultV6.show'),"""
assert old_after in s, 'after-confirm block missing'
s = s.replace(old_after, new_after)

open(p, 'w', encoding='utf-8').write(s)
print('patched qa-result.mjs')
