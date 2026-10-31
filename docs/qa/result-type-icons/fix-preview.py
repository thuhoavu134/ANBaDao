"""Fix the preview page: `top` collides with window.top in a classic script."""
from pathlib import Path

p = Path(r'C:/lt/wt-result-icons/docs/qa/result-type-icons/word-preview.html')
s = p.read_text(encoding='utf-8')
s = s.replace("  const top = Number(q.get('top') || 0.22);", "  const topFrac = Number(q.get('top') || 0.22);")
s = s.replace("word.style.top = `calc(min(100vw,56.25vh) * ${top})`;",
              "word.style.top = `calc(min(100vw,56.25vh) * ${topFrac})`;")
p.write_text(s, encoding='utf-8')
print('top -> topFrac:', 'topFrac' in s, '| remaining bare top decl:', 'const top =' in s)
