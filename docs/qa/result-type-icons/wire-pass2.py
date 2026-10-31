"""Second pass: contract import + battle.html reward-card map + drift test."""
from pathlib import Path

root = Path(r'C:/lt/wt-result-icons')

# ---------------------------------------------------------- contract imports
p = root / 'scripts/result-screen-contract-v1.mjs'
s = p.read_text(encoding='utf-8')
assert "REWARD_ICON_MAP" in s, 'first pass not applied'
head = """import { readFileSync, writeFileSync } from 'node:fs';
"""
if 'result-reward-icons.mjs' not in s:
    # Insert the import after the first import block.
    lines = s.split('\n')
    idx = 0
    for i, line in enumerate(lines[:20]):
        if line.startswith('import '):
            idx = i
    lines.insert(idx + 1, "import { rewardIconMapLiteral, REWARD_ICON_FALLBACK } from './result-reward-icons.mjs';")
    s = '\n'.join(lines)
if 'const REWARD_ICON_MAP' not in s:
    s = s.replace("import { rewardIconMapLiteral, REWARD_ICON_FALLBACK } from './result-reward-icons.mjs';",
                  "import { rewardIconMapLiteral, REWARD_ICON_FALLBACK } from './result-reward-icons.mjs';\n\n"
                  "// Embedded into the generated in-page helper (see installResultScreenContract).\n"
                  "const REWARD_ICON_MAP = rewardIconMapLiteral();\n"
                  "const REWARD_ICON_FALLBACK_LITERAL = JSON.stringify(REWARD_ICON_FALLBACK);")
s = s.replace('const icons=${REWARD_ICON_MAP};const fallback=${REWARD_ICON_FALLBACK};',
              'const icons=${REWARD_ICON_MAP};const fallback=${REWARD_ICON_FALLBACK_LITERAL};')
p.write_text(s, encoding='utf-8')
print('contract imports ok:', 'REWARD_ICON_MAP' in s)

# --------------------------------------------------- battle.html reward cards
p = root / 'battle.html'
s = p.read_text(encoding='utf-8')
import re
m = re.search(r'const RESULT_REWARD_ART_ICONS=\{[^}]*\};', s)
if not m:
    m = re.search(r'RESULT_REWARD_ART_ICONS\s*=\s*Object\.freeze\(\{[^}]*\}\);', s)
assert m, 'RESULT_REWARD_ART_ICONS not found'
print('OLD CARD MAP:', m.group(0)[:400])
