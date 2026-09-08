#!/usr/bin/env python3
"""Stamp page numbers + chapter labels on the revision booklets.
Rules (pagination.md): cover = hidden page 1, body pages get Arabic numbers starting at 1.
No 'Page X of Y' format — bare number only."""
import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

BOOKLETS = [
    {
        'src': 'build/history_booklet.pdf',
        'out': 'build/history_booklet_numbered.pdf',
        'label': 'Ch 5 \u2022 State and Society up to 1000 CE',
        'muted': HexColor('#8b7f79'),
        'accent': HexColor('#9c3a26'),
    },
    {
        'src': 'build/civics_democracy.pdf',
        'out': 'build/civics_democracy_numbered.pdf',
        'label': 'Ch 6 \u2022 Democracy',
        'muted': HexColor('#7e8894'),
        'accent': HexColor('#2a5298'),
    },
    {
        'src': 'build/civics_elections.pdf',
        'out': 'build/civics_elections_numbered.pdf',
        'label': 'Ch 7 \u2022 Elections',
        'muted': HexColor('#7c8a7f'),
        'accent': HexColor('#2d6b4a'),
    },
]

W, H = 595.92, 841.92

for b in BOOKLETS:
    reader = PdfReader(b['src'])
    writer = PdfWriter()
    for i, page in enumerate(reader.pages):
        if i == 0:
            # Cover: internal page 1, number hidden
            writer.add_page(page)
            continue
        # Overlay footer
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=(W, H))
        num = str(i)  # body numbering starts at 1 on physical page 2
        # chapter label — bottom left
        c.setFont('Helvetica', 7.2)
        c.setFillColor(b['muted'])
        c.drawString(44, 20, b['label'])
        # page number — bottom center
        c.setFont('Helvetica-Bold', 8.5)
        c.setFillColor(b['accent'])
        c.drawCentredString(W / 2, 20, num)
        # thin accent rule above footer (subtle)
        c.setStrokeColor(b['muted'])
        c.setLineWidth(0.4)
        c.line(44, 30.5, W - 44, 30.5)
        c.save()
        buf.seek(0)
        overlay = PdfReader(buf).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)
    with open(b['out'], 'wb') as f:
        writer.write(f)
    print(f"{b['out']}: {len(reader.pages)} pages, numbered from physical page 2")

print('Done.')
