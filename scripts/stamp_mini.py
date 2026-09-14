#!/usr/bin/env python3
"""Stamp page numbers + chapter labels on the MINI (5-page max) revision booklets.
Short docs (<=5 pages): simple Arabic numbering on every page (pagination.md rule).
No 'Page X of Y' — bare number only."""
import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

BOOKLETS = [
    {
        'src': 'build/mini_history.pdf',
        'out': 'download/History_Ch5_5Page_Revision_Notes.pdf',
        'label': 'Ch 5 \u2022 State and Society up to 1000 CE \u2022 5-Page Revision',
        'muted': HexColor('#8b7f79'),
        'accent': HexColor('#9c3a26'),
    },
    {
        'src': 'build/mini_democracy.pdf',
        'out': 'download/Civics_Ch6_5Page_Revision_Notes.pdf',
        'label': 'Ch 6 \u2022 Democracy \u2022 5-Page Revision',
        'muted': HexColor('#7e8894'),
        'accent': HexColor('#2a5298'),
    },
    {
        'src': 'build/mini_elections.pdf',
        'out': 'download/Civics_Ch7_5Page_Revision_Notes.pdf',
        'label': 'Ch 7 \u2022 Elections \u2022 5-Page Revision',
        'muted': HexColor('#7c8a7f'),
        'accent': HexColor('#2d6b4a'),
    },
]

for b in BOOKLETS:
    reader = PdfReader(b['src'])
    box = reader.pages[0].mediabox
    W, H = float(box.width), float(box.height)
    writer = PdfWriter()
    for i, page in enumerate(reader.pages):
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=(W, H))
        num = str(i + 1)  # short doc: number every page from 1
        c.setFont('Helvetica', 7.2)
        c.setFillColor(b['muted'])
        c.drawString(40, 18, b['label'])
        c.setFont('Helvetica-Bold', 8.5)
        c.setFillColor(b['accent'])
        c.drawCentredString(W / 2, 18, num)
        c.setStrokeColor(b['muted'])
        c.setLineWidth(0.4)
        c.line(40, 28.5, W - 40, 28.5)
        c.save()
        buf.seek(0)
        overlay = PdfReader(buf).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)
    with open(b['out'], 'wb') as f:
        writer.write(f)
    print(f"{b['out']}: {len(reader.pages)} pages, numbered 1-{len(reader.pages)}")

print('Done.')
