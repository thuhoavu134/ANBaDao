import re

p = r'C:/lt/wt-result-icons/docs/qa/result-type-icons/qa-result.mjs'
s = open(p, encoding='utf-8').read()

# Use one explicit frame expression for every cross-frame evaluation.
FRAME = "const FRAME='(document.getElementById(\\'hvBattleFrame\\')&&document.getElementById(\\'hvBattleFrame\\').contentWindow&&document.getElementById(\\'hvBattleFrame\\').contentWindow.__HON_VIET__)?document.getElementById(\\'hvBattleFrame\\').contentWindow:window';"

old_f = """    const f = '(document.getElementById("hvBattleFrame")?.contentWindow?.__HON_VIET__?document.getElementById("hvBattleFrame").contentWindow:window)';"""
assert old_f in s
new_f = """    const f = '(document.getElementById("hvBattleFrame")?.contentWindow?.__HON_VIET__?document.getElementById("hvBattleFrame").contentWindow:window)';
    izq = 0;"""
s = s.replace(old_f, new_f)

# Confirm click: fully literal, no concatenation surprises.
old = """    await p.evaluate(f + '.querySelector("#integratedResultV6 [data-result-action=confirm]")?.click()');"""
assert old in s
new = """    await p.evaluate(`(()=>{const f=document.getElementById('hvBattleFrame');const d=f&&f.contentWindow&&f.contentWindow.__HON_VIET__?f.contentWindow.document:document;const b=d.querySelector('#integratedResultV6 [data-result-action="confirm"]');if(!b)return 'no-button';b.click();return 'clicked';})()`);"""
s = s.replace(old, new)

# Victory fixture: easy stage + levelled squad so the real engine delivers a win.
old_case = """const caseList = [
  { result: 'victory', chapter: 5, stage: 1, squad: 6 }, // Ải 6–2: the owner's screenshot stage
  { result: 'defeat', chapter: 5, stage: 1, squad: 1 },  // same encounter, real engine, one-hero squad
];"""
assert old_case in s
new_case = """const caseList = [
  { result: 'victory', chapter: 5, stage: 1, squad: 6, level: 120, stars: 6 }, // Ải 6–2, the owner's screenshot stage
  { result: 'defeat', chapter: 5, stage: 1, squad: 6, level: 1, stars: 1 },    // same encounter, default squad
];"""
s = s.replace(old_case, new_case)

# Apply level/stars fixture to the squad's owned heroes.
old_fix = """      if(${squad}>0)P.squad=(P.squad||[]).slice(0,${squad});"""
assert old_fix in s
new_fix = """      if(${squad}>0)P.squad=(P.squad||[]).slice(0,${squad});
      const lv=${level},st=${stars};
      for(const s of P.squad){const h=P.heroes&&P.heroes[s.id];if(h){h.level=lv;h.stars=st;h.owned=true;}}"""
s = s.replace(old_fix, new_fix)

s = s.replace("""async function runCase(browser, { result, width, height, chapter, stage, squad }) {""",
              """async function runCase(browser, { result, width, height, chapter, stage, squad, level, stars }) {""")
s = s.replace("""  const run = { result, width, height, dpr: DPR, chapter, stage, squad };""",
              """  const run = { result, width, height, dpr: DPR, chapter, stage, squad, level, stars };""")

open(p, 'w', encoding='utf-8').write(s)
print('patched')
