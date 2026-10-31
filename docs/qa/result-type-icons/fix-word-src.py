"""Point the .irv-word <img> at the vector word mark (exact line edit)."""
from pathlib import Path

p = Path(r'C:/lt/wt-result-icons/scripts/owner-refresh-20261018.mjs')
lines = p.read_text(encoding='utf-8').split('\n')
hit = False
for i, line in enumerate(lines):
    if 'class="irv-word"' in line and '-letters.png' in line:
        lines[i] = line.replace(
            'assets/owner-refresh-20261018/result-\\${victory?\'victory\':\'defeat\'}-letters.png',
            'assets/result-art/result-word-v2/\\${victory?\'victory\':\'defeat\'}.svg')
        hit = lines[i] != line
p.write_text('\n'.join(lines), encoding='utf-8')
print('replaced:', hit)
print([l for l in lines if 'class="irv-word"' in l][0][:260])
