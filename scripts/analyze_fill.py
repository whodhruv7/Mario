"""Analyze per-page content fill of the workbook PDF to find void gaps."""
import fitz

doc = fitz.open("/home/z/my-project/download/Economics_Workbook_Ch8_Ch9.pdf")
print(f"pages: {len(doc)}  size: {doc[0].rect.width:.0f}x{doc[0].rect.height:.0f}")
for i, page in enumerate(doc):
    blocks = [b for b in page.get_text("blocks") if b[6] == 0 and b[4].strip()]
    H = page.rect.height
    if not blocks:
        print(f"p{i+1:02d}  EMPTY")
        continue
    top = min(b[1] for b in blocks)
    bot = max(b[3] for b in blocks)
    # biggest vertical gap between consecutive blocks
    ys = sorted((b[1], b[3]) for b in blocks)
    gaps, cur = [], ys[0][1]
    for y0, y1 in ys[1:]:
        if y0 - cur > 40:
            gaps.append((cur, y0, y0 - cur))
        cur = max(cur, y1)
    fill = (bot - top) / H * 100
    gstr = "  GAPS:" + ", ".join(f"y{a:.0f}-{b:.0f}({g:.0f}px)" for a, b, g in gaps[:3]) if gaps else ""
    print(f"p{i+1:02d}  content y{top:6.1f} → y{bot:6.1f}   span {fill:5.1f}%  trailing-void {100-fill:4.1f}%{gstr}")
doc.close()
