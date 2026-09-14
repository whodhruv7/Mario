#!/usr/bin/env python3
"""Stamp page numbers + footer label on the Class 9 SST Exam Pack PDF.
Short doc (7 pages): simple Arabic numbering on every page (pagination.md rule).
No 'Page X of Y' — bare number only."""
import io
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

SRC = 'build/exam_pack.pdf'
OUT = 'download/Class9_SST_Exam_Pack.pdf'
LABEL = 'Class 9 SST Exam Pack \u2022 Notes + Definitions + MCQs'
MUTED = HexColor('#7a82a6')   # neutral indigo-grey
ACCENT = HexColor('#4653c8')  # XS-tier indigo

reader = PdfReader(SRC)
box = reader.pages[0].mediabox
W, H = float(box.width), float(box.height)
writer = PdfWriter()
for i, page in enumerate(reader.pages):
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(W, H))
    num = str(i + 1)  # short doc: number every page from 1
    c.setFont('Helvetica', 7.2)
    c.setFillColor(MUTED)
    c.drawString(48, 16, LABEL)
    c.setFont('Helvetica-Bold', 8.5)
    c.setFillColor(ACCENT)
    c.drawCentredString(W / 2, 16, num)
    c.setStrokeColor(MUTED)
    c.setLineWidth(0.4)
    c.line(48, 26.5, W - 48, 26.5)
    c.save()
    buf.seek(0)
    overlay = PdfReader(buf).pages[0]
    page.merge_page(overlay)
    writer.add_page(page)
with open(OUT, 'wb') as f:
    writer.write(f)
print(f"{OUT}: {len(reader.pages)} pages, numbered 1-{len(reader.pages)}")
