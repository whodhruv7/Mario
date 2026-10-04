#!/usr/bin/env python3
"""Stamp page numbers + subject labels on the Class 9 workbook PDFs.
Rules (pagination.md): cover = hidden page 1, body pages get Arabic numbers starting at 1.
No 'Page X of Y' format — bare number only."""
import io, os
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

BOOKS = [
    {
        'src': 'build/geo_workbook.pdf',
        'out': 'download/Geography_Workbook_Ch2_Ch3.pdf',
        'label': 'Geography \u2022 Ch 2 + Ch 3 \u2022 Exam Workbook',
        'muted': HexColor('#75887C'),
        'accent': HexColor('#2E7D4F'),
    },
    {
        'src': 'build/civ_workbook.pdf',
        'out': 'download/Civics_Workbook_Ch6_Ch7.pdf',
        'label': 'Civics \u2022 Ch 6 + Ch 7 \u2022 Exam Workbook',
        'muted': HexColor('#8386A0'),
        'accent': HexColor('#4F46B8'),
    },
]

W, H = 595.92, 841.92

for b in BOOKS:
    if not os.path.exists(b['src']):
        print(f"skip (not built yet): {b['src']}")
        continue
    reader = PdfReader(b['src'])
    writer = PdfWriter()
    n = len(reader.pages)
    for i, page in enumerate(reader.pages):
        if i == 0:
            writer.add_page(page)  # cover: no visible number
            continue
        buf = io.BytesIO()
        c = canvas.Canvas(buf, pagesize=(W, H))
        # left: subject label (muted, small caps feel)
        c.setFont('Helvetica-Bold', 7.2)
        c.setFillColor(b['muted'])
        c.drawString(46, 16, b['label'].upper())
        # right: bare Arabic page number (body starts at 1 on physical page 2)
        c.setFont('Helvetica-Bold', 8.6)
        c.setFillColor(b['accent'])
        c.drawRightString(W - 46, 15.5, str(i))
        c.save()
        buf.seek(0)
        overlay = PdfReader(buf).pages[0]
        page.merge_page(overlay)
        writer.add_page(page)
    with open(b['out'], 'wb') as f:
        writer.write(f)
    print(f"stamped {b['out']}: {n} pages (cover hidden, body 1..{n-1})")
