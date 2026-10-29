#!/usr/bin/env python3
"""Generate the FindIt minor project report in Punjabi University academic format."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch, mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfgen import canvas

DELIVERABLES = Path(__file__).resolve().parents[1] / "deliverables"
W, H = letter  # 612 x 792 pts — matches demoreport.pdf

ALL_STUDENTS = [
    ("Taran Singh", "12401067"),
    ("Prince", "12401062"),
]
# Active student(s) for the report currently being generated (set per run).
STUDENTS: list[tuple[str, str]] = list(ALL_STUDENTS)
MENTOR = "Dr. Harpreet Kaur"
PROJECT = "FindIt"
PROJECT_FULL = "FindIt — Smart Campus Lost & Found"
COURSE = "WEB DEVELOPMENT / FULL STACK"
DEPT = "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING"
UNIV = "PUNJABI UNIVERSITY, PATIALA - 147002"


def _slug(name: str) -> str:
    return name.replace(" ", "_")


def _out_path(students: list[tuple[str, str]]) -> Path:
    if len(students) == 1:
        return DELIVERABLES / f"FindIt_Project_Report_{_slug(students[0][0])}.pdf"
    return DELIVERABLES / "FindIt_Project_Report.pdf"

MARGIN_L = 1.0 * inch
MARGIN_R = 1.0 * inch
MARGIN_T = 0.85 * inch
MARGIN_B = 0.75 * inch
CONTENT_W = W - MARGIN_L - MARGIN_R

INK = HexColor("#111111")
MUTED = HexColor("#333333")
LINE = HexColor("#666666")


class Doc:
    def __init__(self, path: Path | None = None) -> None:
        DELIVERABLES.mkdir(parents=True, exist_ok=True)
        target = path or _out_path(STUDENTS)
        self.c = canvas.Canvas(str(target), pagesize=letter)
        self.c.setTitle("Minor Project Report - FindIt")
        self.c.setAuthor(", ".join(name for name, _ in STUDENTS))
        self.page = 0
        self.y = H - MARGIN_T
        self.mode = "front"  # front | body
        self.body_start_page = 0
        self.toc_entries: list[tuple[str, str]] = []
        self.figures: list[tuple[str, str]] = []
        self.tables: list[tuple[str, str]] = []
        self._front_label = ""

    # --- page helpers -------------------------------------------------
    def new_page(self, front: bool | None = None) -> None:
        if self.page > 0:
            self._footer()
            self.c.showPage()
        self.page += 1
        self.y = H - MARGIN_T
        if front is not None:
            self.mode = "front" if front else "body"
            if not front and self.body_start_page == 0:
                self.body_start_page = self.page

    def _footer(self) -> None:
        self.c.setStrokeColor(LINE)
        self.c.setLineWidth(0.4)
        self.c.line(MARGIN_L, MARGIN_B - 8, W - MARGIN_R, MARGIN_B - 8)
        self.c.setFillColor(MUTED)
        self.c.setFont("Times-Roman", 9)
        if self.mode == "front":
            # Roman numerals for front matter (page index among front pages)
            roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]
            # Cover is page 1 but unnumbered in many reports; we number from ack
            label = ""
            # We will set roman via explicit calls; default blank for cover
            if hasattr(self, "_front_label") and self._front_label:
                label = self._front_label
            if label:
                self.c.drawCentredString(W / 2, MARGIN_B - 22, label)
        else:
            num = self.page - self.body_start_page + 1
            self.c.drawCentredString(W / 2, MARGIN_B - 22, str(num))
            self.c.setFont("Times-Roman", 8)
            self.c.drawString(MARGIN_L, MARGIN_B - 22, "FindIt | Minor Project Report")

    def set_front_label(self, label: str) -> None:
        self._front_label = label

    def ensure_space(self, need: float) -> None:
        if self.y - need < MARGIN_B + 20:
            self.new_page()

    def body_page_num(self) -> int:
        return self.page - self.body_start_page + 1

    # --- text helpers -------------------------------------------------
    def wrap(self, text: str, font: str, size: float, width: float | None = None) -> list[str]:
        width = width or CONTENT_W
        words = text.split()
        if not words:
            return [""]
        lines: list[str] = []
        cur = ""
        for w in words:
            trial = w if not cur else f"{cur} {w}"
            if self.c.stringWidth(trial, font, size) <= width:
                cur = trial
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        return lines

    def para(
        self,
        text: str,
        *,
        font: str = "Times-Roman",
        size: float = 11,
        leading: float = 16,
        indent: float = 0,
        align: str = "justify",
        space_after: float = 10,
        color=INK,
    ) -> None:
        width = CONTENT_W - indent
        lines = self.wrap(text, font, size, width)
        for i, line in enumerate(lines):
            self.ensure_space(leading + 2)
            self.c.setFillColor(color)
            self.c.setFont(font, size)
            x = MARGIN_L + indent
            if align == "center":
                self.c.drawCentredString(W / 2, self.y, line)
            elif align == "right":
                self.c.drawRightString(W - MARGIN_R, self.y, line)
            elif align == "justify" and i < len(lines) - 1 and len(line.split()) > 1:
                self._draw_justified(line, x, self.y, width, font, size)
            else:
                self.c.drawString(x, self.y, line)
            self.y -= leading
        self.y -= space_after

    def _draw_justified(self, line: str, x: float, y: float, width: float, font: str, size: float) -> None:
        words = line.split()
        if len(words) == 1:
            self.c.drawString(x, y, line)
            return
        total = sum(self.c.stringWidth(w, font, size) for w in words)
        gap = (width - total) / (len(words) - 1)
        cx = x
        for w in words:
            self.c.drawString(cx, y, w)
            cx += self.c.stringWidth(w, font, size) + gap

    def heading_centered(self, title: str, size: float = 14, space_before: float = 0, space_after: float = 16) -> None:
        self.y -= space_before
        self.ensure_space(40)
        self.c.setFillColor(INK)
        self.c.setFont("Times-Bold", size)
        for line in self.wrap(title, "Times-Bold", size):
            self.c.drawCentredString(W / 2, self.y, line)
            self.y -= size + 4
        self.y -= space_after

    def chapter_title(self, chapter: str, title: str, toc_label: str | None = None) -> None:
        self.new_page(front=False)
        self.ensure_space(80)
        self.c.setFillColor(INK)
        self.c.setFont("Times-Bold", 14)
        self.c.drawCentredString(W / 2, self.y, chapter.upper())
        self.y -= 22
        self.c.setFont("Times-Bold", 13)
        for line in self.wrap(title.upper(), "Times-Bold", 13):
            self.c.drawCentredString(W / 2, self.y, line)
            self.y -= 18
        self.y -= 18
        label = toc_label or f"{chapter}. {title}"
        # page number filled after body_start known
        self.toc_entries.append((label, str(self.body_page_num())))

    def section(self, number: str, title: str) -> None:
        self.ensure_space(36)
        self.y -= 4
        self.c.setFillColor(INK)
        self.c.setFont("Times-Bold", 12)
        text = f"{number} {title}"
        self.c.drawString(MARGIN_L, self.y, text)
        self.y -= 18

    def subsection(self, number: str, title: str) -> None:
        self.ensure_space(30)
        self.c.setFillColor(INK)
        self.c.setFont("Times-Bold", 11)
        self.c.drawString(MARGIN_L, self.y, f"{number} {title}")
        self.y -= 16

    def bullet(self, text: str, bold_prefix: str = "") -> None:
        self.ensure_space(20)
        marker_x = MARGIN_L + 12
        text_x = MARGIN_L + 28
        width = W - MARGIN_R - text_x
        self.c.setFont("Times-Roman", 11)
        self.c.setFillColor(INK)
        self.c.drawString(marker_x, self.y, "•")
        if bold_prefix:
            self.c.setFont("Times-Bold", 11)
            self.c.drawString(text_x, self.y, bold_prefix)
            prefix_w = self.c.stringWidth(bold_prefix, "Times-Bold", 11)
            rest_lines = self.wrap(text, "Times-Roman", 11, width - prefix_w)
            if rest_lines:
                self.c.setFont("Times-Roman", 11)
                self.c.drawString(text_x + prefix_w, self.y, rest_lines[0])
                self.y -= 15
                for line in rest_lines[1:]:
                    self.ensure_space(16)
                    self.c.drawString(text_x, self.y, line)
                    self.y -= 15
            else:
                self.y -= 15
        else:
            lines = self.wrap(text, "Times-Roman", 11, width)
            for i, line in enumerate(lines):
                self.ensure_space(16)
                self.c.drawString(text_x if i == 0 else text_x, self.y, line)
                self.y -= 15
        self.y -= 4

    def caption(self, text: str) -> None:
        self.ensure_space(24)
        self.c.setFont("Times-Italic", 10)
        self.c.setFillColor(MUTED)
        for line in self.wrap(text, "Times-Italic", 10):
            self.c.drawCentredString(W / 2, self.y, line)
            self.y -= 13
        self.y -= 8

    def figure_box(self, fig_id: str, title: str, lines: list[str]) -> None:
        self.ensure_space(120)
        box_h = 18 + 14 * len(lines) + 10
        self.ensure_space(box_h + 30)
        self.c.setStrokeColor(LINE)
        self.c.setLineWidth(0.8)
        self.c.setFillColor(HexColor("#F5F5F5"))
        self.c.rect(MARGIN_L, self.y - box_h, CONTENT_W, box_h, fill=1, stroke=1)
        self.c.setFillColor(INK)
        self.c.setFont("Times-Bold", 10)
        ty = self.y - 16
        self.c.drawCentredString(W / 2, ty, title)
        ty -= 16
        self.c.setFont("Times-Roman", 9)
        for line in lines:
            self.c.drawCentredString(W / 2, ty, line)
            ty -= 13
        self.y -= box_h + 8
        page = str(self.body_page_num())
        self.figures.append((f"{fig_id}: {title}", page))
        self.caption(f"{fig_id}: {title}")

    def simple_table(
        self,
        table_id: str,
        title: str,
        headers: list[str],
        rows: list[list[str]],
        col_weights: list[float] | None = None,
    ) -> None:
        n = len(headers)
        weights = col_weights or [1 / n] * n
        col_ws = [CONTENT_W * w for w in weights]
        row_h = 16
        header_h = 18
        # estimate height; wrap cells roughly
        est = header_h + 8
        wrapped_rows: list[list[list[str]]] = []
        for row in rows:
            cells = []
            max_lines = 1
            for i, cell in enumerate(row):
                lines = self.wrap(str(cell), "Times-Roman", 9, col_ws[i] - 8)
                cells.append(lines)
                max_lines = max(max_lines, len(lines))
            wrapped_rows.append(cells)
            est += max_lines * 12 + 6
        self.ensure_space(est + 36)
        # header
        self.c.setFillColor(HexColor("#E8E8E8"))
        self.c.rect(MARGIN_L, self.y - header_h, CONTENT_W, header_h, fill=1, stroke=0)
        self.c.setStrokeColor(LINE)
        self.c.setLineWidth(0.5)
        self.c.rect(MARGIN_L, self.y - header_h, CONTENT_W, header_h, fill=0, stroke=1)
        self.c.setFillColor(INK)
        self.c.setFont("Times-Bold", 9)
        x = MARGIN_L
        for i, h in enumerate(headers):
            self.c.drawString(x + 4, self.y - 12, h)
            x += col_ws[i]
        self.y -= header_h
        for cells in wrapped_rows:
            max_lines = max(len(c) for c in cells)
            h = max_lines * 12 + 6
            self.ensure_space(h + 4)
            self.c.setStrokeColor(LINE)
            self.c.rect(MARGIN_L, self.y - h, CONTENT_W, h, fill=0, stroke=1)
            x = MARGIN_L
            for i, lines in enumerate(cells):
                self.c.setFont("Times-Roman", 9)
                ly = self.y - 12
                for line in lines:
                    self.c.drawString(x + 4, ly, line)
                    ly -= 12
                x += col_ws[i]
            self.y -= h
        self.y -= 6
        page = str(self.body_page_num())
        self.tables.append((f"{table_id}: {title}", page))
        self.caption(f"{table_id}: {title}")

    def code_block(self, lines: list[str], size: float = 8) -> None:
        leading = size + 3
        need = 12 + leading * len(lines)
        self.ensure_space(need)
        self.c.setFillColor(HexColor("#F4F4F4"))
        self.c.setStrokeColor(LINE)
        h = 8 + leading * len(lines)
        self.c.rect(MARGIN_L, self.y - h, CONTENT_W, h, fill=1, stroke=1)
        self.c.setFillColor(INK)
        self.c.setFont("Courier", size)
        ty = self.y - 12
        for line in lines:
            # truncate if too long
            while self.c.stringWidth(line, "Courier", size) > CONTENT_W - 12 and len(line) > 3:
                line = line[:-1]
            self.c.drawString(MARGIN_L + 6, ty, line)
            ty -= leading
        self.y -= h + 10

    def save(self) -> None:
        self._footer()
        self.c.save()


def _build_with_merge(out: Path | None = None) -> Path:
    import subprocess

    target = out or _out_path(STUDENTS)
    suffix = _slug(STUDENTS[0][0]) if len(STUDENTS) == 1 else "collective"
    body_path = DELIVERABLES / f"_findit_body_{suffix}.pdf"
    front_path = DELIVERABLES / f"_findit_front_{suffix}.pdf"

    body = Doc(body_path)
    _write_body(body)
    body.save()

    front = Doc(front_path)
    # Copy collected lists from body
    front.toc_entries = body.toc_entries
    front.figures = body.figures
    front.tables = body.tables
    _write_front(front, body_page_count=body.page)
    front.save()

    # Merge with pypdf or pdftk or gs
    merged = False
    try:
        from pypdf import PdfReader, PdfWriter

        w = PdfWriter()
        for path in (front_path, body_path):
            r = PdfReader(str(path))
            for p in r.pages:
                w.add_page(p)
        with open(target, "wb") as f:
            w.write(f)
        merged = True
    except Exception:
        pass

    if not merged:
        # try pip install
        subprocess.run(
            [str(Path(__file__).resolve().parents[1] / ".report-venv" / "bin" / "pip"),
             "install", "pypdf", "-q"],
            check=False,
        )
        try:
            from pypdf import PdfReader, PdfWriter

            w = PdfWriter()
            for path in (front_path, body_path):
                r = PdfReader(str(path))
                for p in r.pages:
                    w.add_page(p)
            with open(target, "wb") as f:
                w.write(f)
            merged = True
        except Exception as e:
            # fallback: copy body only and warn
            import shutil
            shutil.copy(body_path, target)
            print("WARN: could not merge front matter:", e)

    for p in (body_path, front_path):
        if p.exists():
            p.unlink()
    print(f"Wrote {target}")
    return target


def _write_front(d: Doc, body_page_count: int) -> None:
    # COVER
    d.new_page(front=True)
    d.set_front_label("")
    d.y = H - 1.3 * inch
    d.c.setFont("Times-Bold", 16)
    d.c.drawCentredString(W / 2, d.y, "MINOR PROJECT REPORT")
    d.y -= 22
    d.c.setFont("Times-Bold", 12)
    d.c.drawCentredString(W / 2, d.y, "OF")
    d.y -= 22
    d.c.setFont("Times-Bold", 14)
    d.c.drawCentredString(W / 2, d.y, COURSE)
    d.y -= 40
    d.c.setFont("Times-Bold", 12)
    d.c.drawCentredString(W / 2, d.y, "ON")
    d.y -= 28
    d.c.setFont("Times-Bold", 18)
    d.c.drawCentredString(W / 2, d.y, "FINDIT")
    d.y -= 20
    d.c.setFont("Times-Bold", 12)
    d.c.drawCentredString(W / 2, d.y, "SMART CAMPUS LOST & FOUND PLATFORM")
    d.y -= 48
    d.c.setFont("Times-Roman", 11)
    d.c.drawCentredString(W / 2, d.y, "SUBMITTED IN PARTIAL FULFILLMENT OF THE DEGREE")
    d.y -= 18
    d.c.setFont("Times-Bold", 11)
    d.c.drawCentredString(W / 2, d.y, "OF")
    d.y -= 18
    d.c.setFont("Times-Bold", 12)
    d.c.drawCentredString(W / 2, d.y, "BACHELOR OF TECHNOLOGY")
    d.y -= 18
    d.c.setFont("Times-Bold", 11)
    d.c.drawCentredString(W / 2, d.y, "IN")
    d.y -= 18
    d.c.setFont("Times-Bold", 12)
    d.c.drawCentredString(W / 2, d.y, "Computer Science and Engineering")
    d.y -= 48
    d.c.setFont("Times-Bold", 11)
    d.c.drawCentredString(W / 2, d.y, "Submitted By:")
    d.y -= 20
    for name, roll in STUDENTS:
        d.c.setFont("Times-Roman", 11)
        d.c.drawCentredString(W / 2, d.y, name)
        d.y -= 15
        d.c.drawCentredString(W / 2, d.y, f"Roll No.: {roll}")
        d.y -= 20
    d.y -= 10
    d.c.setFont("Times-Bold", 11)
    d.c.drawCentredString(W / 2, d.y, f"Under the guidance of {MENTOR}")
    d.y -= 60
    d.c.setFont("Times-Bold", 11)
    d.c.drawCentredString(W / 2, d.y, DEPT)
    d.y -= 16
    d.c.drawCentredString(W / 2, d.y, UNIV)

    single = len(STUDENTS) == 1

    # ACK
    d.new_page(front=True)
    d.set_front_label("ii")
    d.heading_centered("ACKNOWLEDGEMENT", 14)
    if single:
        d.para(
            "I would like to express my sincere gratitude to everyone who supported me throughout the "
            "completion of this minor project. Their guidance, technical insight, and continuous "
            "encouragement were instrumental in helping me design, implement, and document a complete "
            "full-stack web application from first requirements through a working campus demonstration."
        )
        d.para(
            f"I am deeply thankful to my project mentor, {MENTOR}, and to the faculty of the "
            "Department of Computer Science & Engineering, Punjabi University, Patiala, for invaluable "
            "feedback that helped me refine the product scope, the layered API design, the explainable "
            "matching heuristic, and the claim-moderation workflow. Their expertise was crucial in "
            "helping me overcome challenges related to authentication, data modelling, and local deployment."
        )
        d.para(
            "Finally, I thank my peers and family for unwavering support and motivation during "
            "development. This project has been a significant learning milestone in modern web "
            "development, and I am grateful for the opportunity to practise the full path from "
            "problem statement to a usable Next.js and Express application backed by MongoDB."
        )
    else:
        d.para(
            "We would like to express our sincere gratitude to everyone who supported us throughout the "
            "completion of this minor project. Their guidance, technical insight, and continuous "
            "encouragement were instrumental in helping us design, implement, and document a complete "
            "full-stack web application from first requirements through a working campus demonstration."
        )
        d.para(
            f"We are deeply thankful to our project mentor, {MENTOR}, and to the faculty of the "
            "Department of Computer Science & Engineering, Punjabi University, Patiala, for invaluable "
            "feedback that helped us refine the product scope, the layered API design, the explainable "
            "matching heuristic, and the claim-moderation workflow. Their expertise was crucial in "
            "helping us overcome challenges related to authentication, data modelling, and local deployment."
        )
        d.para(
            "Finally, we thank our peers and families for unwavering support and motivation during "
            "development. This project has been a significant learning milestone in modern web "
            "development, and we are grateful for the opportunity to practise the full path from "
            "problem statement to a usable Next.js and Express application backed by MongoDB."
        )
    d.para("Thank you all for your support.")
    d.y -= 30
    for name, roll in STUDENTS:
        d.c.setFont("Times-Roman", 11)
        d.c.drawRightString(W - MARGIN_R, d.y, name)
        d.y -= 14
        d.c.drawRightString(W - MARGIN_R, d.y, f"Roll No.: {roll}")
        d.y -= 22

    # ABSTRACT
    d.new_page(front=True)
    d.set_front_label("iii")
    d.heading_centered("ABSTRACT", 14)
    d.para(
        "Lost belongings on a university campus are usually announced in scattered group chats and "
        "notice boards. Those posts are hard to search, easy to miss, and awkward when a student "
        "must share a private identifying detail in public. FindIt addresses this gap with a smart "
        "campus lost-and-found platform: students report lost or found items, search approved "
        "listings, review short explanations when another report looks similar, and follow a "
        "moderated claim path that keeps ownership proof off the public record."
    )
    d.para(
        "The system is implemented as two cooperating applications in one repository. The browser "
        "interface is built with Next.js App Router, React, TypeScript, and Tailwind CSS. Business "
        "operations are handled by an Express API organised into controllers, services, and "
        "repositories, with Mongoose models persisted in MongoDB. Sessions use an HTTP-only cookie; "
        "the API stores only a SHA-256 hash of the session identifier. Registration always creates a "
        "student role. Administrators are created by a seed script and can moderate reports, review "
        "claims, and inspect activity history."
    )
    d.para(
        "Match suggestions are a capped, explainable heuristic rather than a machine-learning "
        "probability. Default weights favour category (0.35) and meaningful word overlap in title "
        "and description (0.35), with smaller contributions from location words (0.15) and dates "
        "inside a fourteen-day window (0.15). Candidates below a minimum score of 0.35 are dropped. "
        "Claims move through pending, approved, rejected, and cancelled states; approval can mark "
        "an item resolved. Automated tests use Vitest and Supertest against an in-memory MongoDB."
    )
    d.para(
        "As a minor project in Web Development / Full Stack, this work demonstrates a complete "
        "campus-oriented web workflow: authentication, moderated content, searchable listings, "
        "explainable matching, claim review, and administrator oversight — packaged for local "
        "demonstration with seed data and documented setup steps."
    )

    # DECLARATION
    d.new_page(front=True)
    d.set_front_label("iv")
    d.heading_centered("CANDIDATE'S DECLARATION", 14)
    if single:
        name, roll = STUDENTS[0]
        d.para(
            f'I, "{name.upper()}" (Roll No. {roll}), hereby declare '
            f'that I have undertaken this Minor Project on "FindIt — Smart Campus Lost & Found" in '
            "partial fulfillment of the requirements for the award of the degree of B.Tech (Department "
            f"of Computer Science & Engineering). The work presented in this project report is an "
            f"authentic record of my own work carried out under the guidance of {MENTOR}. I sincerely "
            "thank my mentor for valuable guidance, support, and encouragement throughout the project."
        )
        d.y -= 20
        d.para("Signature of the Student", font="Times-Bold", size=11, align="left", space_after=40)
        d.c.setFont("Times-Roman", 11)
        d.c.drawString(MARGIN_L, d.y, f"{name} ________________")
    else:
        d.para(
            f'We, "TARAN SINGH" (Roll No. 12401067) and "PRINCE" (Roll No. 12401062), hereby declare '
            f'that we have undertaken this Minor Project on "FindIt — Smart Campus Lost & Found" in '
            "partial fulfillment of the requirements for the award of the degree of B.Tech (Department "
            f"of Computer Science & Engineering). The work presented in this project report is an "
            f"authentic record of our own work carried out under the guidance of {MENTOR}. We sincerely "
            "thank our mentor for valuable guidance, support, and encouragement throughout the project."
        )
        d.y -= 20
        d.para("Signature of the Students", font="Times-Bold", size=11, align="left", space_after=40)
        d.c.setFont("Times-Roman", 11)
        d.c.drawString(MARGIN_L, d.y, "Taran Singh ________________")
        d.c.drawString(MARGIN_L + 260, d.y, "Prince ________________")
    d.y -= 40
    d.para(
        "The minor project Viva-Voce Examination has been held on ___________________ and accepted.",
        space_after=40,
    )
    d.para("Signature of Mentor", font="Times-Bold", size=11, space_after=30)
    d.c.setFont("Times-Roman", 11)
    d.c.drawString(MARGIN_L, d.y, f"{MENTOR} ________________")

    # LIST OF FIGURES
    d.new_page(front=True)
    d.set_front_label("v")
    d.heading_centered("LIST OF FIGURES", 14)
    for label, page in d.figures:
        d.ensure_space(18)
        d.c.setFont("Times-Roman", 10)
        d.c.setFillColor(INK)
        # dotted leader
        left = f"Figure {label}" if not label.startswith("Figure") else label
        if not left.startswith("Figure"):
            left = f"Figure {label}"
        # figures already stored as "Figure 4.1: title"
        left = label if label.startswith("Figure") else f"Figure {label}"
        right = page
        d.c.drawString(MARGIN_L, d.y, left[:90])
        d.c.drawRightString(W - MARGIN_R, d.y, right)
        d.y -= 16
    if not d.figures:
        d.para("No figures listed.", font="Times-Italic")

    # LIST OF TABLES
    d.new_page(front=True)
    d.set_front_label("vi")
    d.heading_centered("LIST OF TABLES", 14)
    for label, page in d.tables:
        d.ensure_space(18)
        d.c.setFont("Times-Roman", 10)
        left = label if label.startswith("Table") else f"Table {label}"
        d.c.drawString(MARGIN_L, d.y, left[:90])
        d.c.drawRightString(W - MARGIN_R, d.y, page)
        d.y -= 16

    # TOC
    d.new_page(front=True)
    d.set_front_label("vii")
    d.heading_centered("TABLE OF CONTENTS", 14)
    toc_front = [
        ("Front Page", "i"),
        ("Acknowledgement", "ii"),
        ("Abstract", "iii"),
        ("Candidate's Declaration", "iv"),
        ("List of Figures", "v"),
        ("List of Tables", "vi"),
        ("Table of Contents", "vii"),
    ]
    for label, page in toc_front:
        d.c.setFont("Times-Roman", 11)
        d.c.drawString(MARGIN_L, d.y, label)
        d.c.drawRightString(W - MARGIN_R, d.y, page)
        d.y -= 16
    for label, page in d.toc_entries:
        d.ensure_space(18)
        d.c.setFont("Times-Roman", 11)
        d.c.drawString(MARGIN_L, d.y, label[:85])
        d.c.drawRightString(W - MARGIN_R, d.y, page)
        d.y -= 16


def _write_body(d: Doc) -> None:
    # Force body mode from first page
    d.mode = "body"
    d.body_start_page = 1

    # ===== CHAPTER 1 =====
    d.chapter_title("CHAPTER 1", "INTRODUCTION", "1. Introduction")
    d.section("1.1", "Background of the Project")
    d.para(
        "University campuses are busy environments in which personal belongings move constantly "
        "between classrooms, libraries, hostels, laboratories, and transport hubs. When an item is "
        "lost or found, recovery traditionally depends on informal communication: a message in a "
        "class group chat, a handwritten notice on a board, or word of mouth. Those channels are "
        "familiar, but they do not scale well. Posts disappear under newer messages, people who "
        "join a chat late never see an earlier announcement, and searching old threads for a "
        "specific item is unreliable."
    )
    d.para(
        "At the same time, proving ownership often requires a private detail — a scratch on a "
        "laptop, a sticker inside a bag, or a partial serial number. Publishing that detail in a "
        "public chat weakens the proof and can invite misuse. A campus-oriented information system "
        "can keep identifying details private until a claim is reviewed by the finder or an "
        "administrator, while still making the public description searchable."
    )
    d.para(
        "FindIt is a smart campus lost-and-found platform built for this setting. A student reports "
        "a lost or found item, searches what has already been approved, and sees a short explanation "
        "when another report looks similar. Claims and moderation stay on the record. The project "
        "is submitted as a B.Tech CSE third-year minor project in Web Development / Full Stack. "
        "Sample people and places in the seed data are fictional."
    )
    d.para(
        "Modern campuses already run learning-management systems, hostel portals, and library "
        "catalogues. A lost-and-found module fits naturally beside those services because it shares "
        "the same expectations: sign-in, searchable records, and accountable staff actions. Building "
        "FindIt as a standalone full-stack application lets the team demonstrate those expectations "
        "without depending on a proprietary campus ERP."
    )
    d.para(
        "The technical backdrop is a TypeScript monorepo. Separating apps/web from apps/api mirrors "
        "how many production teams deploy front ends and APIs independently, while still keeping "
        "one repository for a minor-project viva. Documentation in docs/architecture.md and "
        "docs/api-reference.md accompanies the code so that examiners can trace a request from the "
        "browser to MongoDB."
    )

    d.section("1.2", "Motivation")
    d.para(
        "The first motivation was practical usefulness. Students already know how to post in chats; "
        "what they lack is a single place where reports can be filtered by type, category, location, "
        "and date, and where similar opposite-type reports are suggested with readable reasons."
    )
    d.para(
        "The second motivation was to practise a complete full-stack workflow rather than only a "
        "user-interface prototype. Many student projects stop at static screens. This project "
        "deliberately covers authentication, validation, persistence, role-based access, file "
        "upload checks, automated tests, and a seed script for demonstration."
    )
    d.para(
        "The third motivation was transparency. Match suggestions should not present a mysterious "
        "score. FindIt uses a rule-based heuristic with published weights and written reasons so "
        "that a reviewer can understand why two reports were linked — and can still reject a claim "
        "when the proof is weak."
    )
    d.para(
        "A fourth motivation was reproducibility for examination. Seed data, environment examples, "
        "and npm scripts make it possible to recreate the same demonstration on another machine. "
        "That matters for a viva: examiners should see a stable scenario rather than a fragile "
        "one-off database state."
    )

    d.section("1.3", "Problem Statement")
    d.para("Campus lost-and-found communication creates several recurring problems:")
    d.bullet(
        "Group chats and notice boards fragment information so that updates are easy to miss.",
        bold_prefix="Scattered announcements: ",
    )
    d.bullet(
        "Owners must often reveal unique marks in public to prove ownership.",
        bold_prefix="Awkward privacy: ",
    )
    d.bullet(
        "Humans may overlook similar reports when wording differs slightly.",
        bold_prefix="Weak matching: ",
    )
    d.bullet(
        "There is little durable history of who claimed what and who approved it.",
        bold_prefix="Missing audit trail: ",
    )

    d.section("1.4", "Objectives of the System")
    d.bullet("Give students one place to report lost and found items.")
    d.bullet("Let anyone search the public (approved) listings.")
    d.bullet("Suggest possible matches with an explainable score.")
    d.bullet("Let a student claim a found item and let the reporter or an administrator decide.")
    d.bullet("Keep administrator actions limited to administrator accounts.")

    d.section("1.5", "Scope of the Project")
    d.para(
        "In-Scope: student registration and session-based sign-in; lost and found reports with "
        "optional images; search, filters, sorting, and pagination; rule-based match suggestions; "
        "claim requests with pending, approved, rejected, and cancelled states; a student dashboard; "
        "and an administrator area for moderation, claim review, and activity history."
    )
    d.para(
        "Out-of-Scope: email or push notifications, campus map integrations, cloud object storage "
        "for images, and any claim that match scores are probabilities of recovery. The application "
        "is intended for campus demonstration and further academic development."
    )

    d.section("1.6", "Context within the Course: Web Development / Full Stack")
    d.para(
        "This report is submitted as a minor project for Web Development / Full Stack. The course "
        "emphasises building end-to-end applications: structured front ends, HTTP APIs, persistent "
        "storage, authentication, and honest discussion of limitations. FindIt represents that "
        "journey on a concrete campus problem. Ideas such as layered services, cookie-based "
        "sessions, and schema validation carry over directly to larger production systems."
    )

    d.section("1.7", "Organisation of the Report")
    d.para(
        "Chapter 2 restates objectives and scope. Chapter 3 surveys related approaches. Chapter 4 "
        "describes the data model. Chapters 5 and 6 present methodology and implementation. "
        "Chapter 7 documents testing. Chapter 8 discusses results and a sample walkthrough. "
        "Chapter 9 concludes and outlines future work. Chapters 10 and 11 cover project management "
        "and limitations. Appendices provide source excerpts, a glossary, a user manual, and "
        "references."
    )

    # ===== CHAPTER 2 =====
    d.chapter_title("CHAPTER 2", "PROJECT OBJECTIVES AND SCOPE", "2. Project Objectives and Scope")
    d.section("2.1", "Primary Objectives")
    d.bullet(
        "Design a clean data model for users, sessions, items, claims, and activity records."
    )
    d.bullet(
        "Implement a layered Express API with validation, authentication, and role checks."
    )
    d.bullet(
        "Deliver a Next.js interface that supports reporting, browsing, matching, claims, and admin moderation without requiring users to call the API manually."
    )

    d.section("2.2", "Secondary Objectives")
    d.para(
        "Secondary goals include transparency of match explanations, privacy of claim proof text, "
        "reproducible seed data for class demonstrations, and automated tests that do not depend "
        "on the developer’s Atlas cluster."
    )

    d.section("2.3", "Scope of the Project")
    d.subsection("2.3.1", "In-Scope (Doable Tasks)")
    d.bullet("Student registration, sign-in, and sign-out with an HTTP-only session cookie.")
    d.bullet("Lost and found reports, including optional JPEG/PNG/WebP images.")
    d.bullet("Search, filters, sorting by newest, and pagination backed by MongoDB.")
    d.bullet("Rule-based match suggestions with written reasons.")
    d.bullet("Claim workflow and administrator moderation with activity logging.")

    d.subsection("2.3.2", "Out-of-Scope (Non-Doable Tasks)")
    d.bullet("Automated email when a claim is reviewed.")
    d.bullet("Geospatial maps or building floor plans.")
    d.bullet("Managed object storage for images.")
    d.bullet("Mobile native applications.")

    d.section("2.4", "Expected Deliverables")
    d.para(
        "Expected deliverables are a working monorepo with apps/web and apps/api, environment "
        "examples, a seed script, automated tests, architecture and API documentation, this written "
        "report, and a demonstration presentation."
    )

    d.section("2.5", "Success Criteria")
    d.para(
        "The project is considered successful if (1) a seeded campus scenario can be demonstrated "
        "end-to-end from report to resolved claim, (2) public item JSON never exposes identifying "
        "details or claim proof, (3) match reasons are visible on item detail, and (4) automated "
        "tests pass against an in-memory database."
    )

    # ===== CHAPTER 3 =====
    d.chapter_title("CHAPTER 3", "LITERATURE OVERVIEW", "3. Literature Overview")
    d.section("3.1", "Campus Lost-and-Found as an Information Problem")
    d.para(
        "Lost-and-found offices and informal peer networks have long existed on campuses. Digital "
        "tools change the problem from physical storage alone to searchability, notification, and "
        "trust. Research and practitioner reports on community platforms repeatedly note that "
        "visibility without moderation creates spam, while moderation without search creates "
        "backlogs. FindIt balances both: reports start as pending, become publicly searchable when "
        "approved, and can be resolved through claims."
    )

    d.section("3.2", "Web Application Approaches")
    d.para(
        "Classical campus portals often used server-rendered pages with session cookies. Modern "
        "stacks separate a JSON API from a rich client. FindIt follows that pattern: Next.js owns "
        "routing and presentation; Express owns rules and persistence. Component libraries and "
        "schema validators (Zod) reduce form errors. This mirrors common industry practice for "
        "internal tools where correctness and auditability matter more than viral growth features."
    )

    d.section("3.3", "Similarity and Matching Heuristics")
    d.para(
        "Item matching can be approached with machine learning embeddings, fuzzy string matching, "
        "or weighted rules. For a minor project with limited labelled data, a transparent heuristic "
        "is preferable: category equality, Jaccard overlap of tokenised text and locations, and a "
        "decay based on date distance. The score is capped and explained in plain language so that "
        "users do not confuse it with a probability."
    )

    d.section("3.4", "Authentication and Session Security")
    d.para(
        "Browser applications commonly store tokens in localStorage or cookies. HTTP-only cookies "
        "reduce exposure to script injection on the page. Hashing session identifiers at rest limits "
        "damage if the sessions collection is leaked. Role checks must remain on the server: hiding "
        "an administrator button is not a security control."
    )

    d.section("3.5", "Current Gaps and Challenges")
    d.bullet("Informal chats remain the default despite poor search.")
    d.bullet("Many prototypes omit claim privacy and audit logs.")
    d.bullet("Aggressive automated matching without explanation reduces trust.")
    d.bullet("Image hosting and notifications are often left unfinished in student systems.")

    d.section("3.6", "Comparative Study of Existing Approaches")
    d.simple_table(
        "Table 3.1",
        "Comparison of FindIt against broad categories of campus recovery approaches",
        ["Approach", "Search", "Privacy of proof", "Audit", "Fit for demo"],
        [
            ["Group chats / notice boards", "Weak", "Poor (public)", "None", "Familiar but fragile"],
            ["Simple public CRUD form", "Good", "Often weak", "Limited", "Easy, low trust"],
            ["ML-only matching portal", "Strong recall possible", "Varies", "Varies", "Needs data & ops"],
            ["FindIt (this project)", "Filters + heuristic", "Proof to reviewers only", "Activity log", "Designed for viva demo"],
        ],
        [0.28, 0.18, 0.22, 0.14, 0.18],
    )

    d.section("3.7", "Summary of Literature Review")
    d.para(
        "The literature and practitioner patterns suggest that a successful campus tool must combine "
        "moderated visibility, private ownership proof, searchable listings, and explainable "
        "suggestions. FindIt adopts those principles with a full-stack implementation suitable for "
        "academic demonstration."
    )
    d.para(
        "In short, FindIt is positioned between disposable chat posts and heavy institutional ERPs. "
        "It borrows web-engineering practice — layered services, schema validation, cookie sessions — "
        "and applies it to a recovery workflow students recognise immediately."
    )

    # ===== CHAPTER 4 =====
    d.chapter_title(
        "CHAPTER 4",
        "DATA MODEL DESCRIPTION AND EXPLORATION",
        "4. Dataset Description and Exploratory Data Analysis",
    )
    # Keep TOC label closer to demo naming but content is data model
    d.toc_entries[-1] = ("4. Data Model Description and Exploration", d.toc_entries[-1][1])

    d.section("4.1", "Data Source and Persistence")
    d.para(
        "FindIt does not train on a downloadable market dataset. Its “data” are operational "
        "MongoDB documents created by students, administrators, and the seed script. The database "
        "name is typically findit in the Atlas or local URI. Restarting the API does not delete "
        "saved users, reports, or claims."
    )

    d.section("4.2", "Description of Core Collections")
    d.simple_table(
        "Table 4.1",
        "Core entities stored by the FindIt API",
        ["Entity", "Key fields", "Purpose"],
        [
            ["User", "name, email, studentId, role, passwordHash", "Students and administrators"],
            ["Session", "tokenHash, userId, expiresAt", "HTTP-only cookie sessions"],
            ["Item", "title, description, type, category, location, eventDate, status, image", "Lost/found reports"],
            ["Claim", "itemId, claimantId, proof, status, reviewNote", "Ownership requests"],
            ["ActivityLog", "actor, action, resource, time", "Moderation and claim history"],
        ],
        [0.18, 0.42, 0.40],
    )

    d.section("4.3", "Statuses and Visibility")
    d.para(
        "Item statuses include pending, approved, rejected, resolved, and archived. Public browse "
        "lists show approved reports. Pending and rejected reports remain visible to the reporter "
        "and administrators. Claim statuses include pending, approved, rejected, and cancelled. "
        "Public item JSON omits identifying details, private notes, and the reporter id."
    )

    d.figure_box(
        "Figure 4.1",
        "Report status path used during moderation",
        [
            "create (pending) → admin approve → approved (public)",
            "approved → claim approved → resolved",
            "pending → reject / archive (not public)",
        ],
    )

    d.section("4.4", "Seed and Demo Records")
    d.para(
        "The seed script upserts fictional students (for example asha.menon@campus.example) and "
        "sample reports such as lost and found earbuds. Demo students share a configured "
        "DEMO_STUDENT_PASSWORD. The administrator account comes from ADMIN_NAME, ADMIN_EMAIL, "
        "and ADMIN_PASSWORD. Seed:clear removes demo-marked documents without dropping the "
        "database or deleting the administrator."
    )

    d.simple_table(
        "Table 4.2",
        "Expected relationship between match signals and recovery usefulness",
        ["Signal", "Represents", "Why it matters"],
        [
            ["Category", "Item class (electronics, etc.)", "Opposite-type pairs in the same class are likelier"],
            ["Text overlap", "Shared meaningful words", "Titles/descriptions often name the object"],
            ["Location overlap", "Shared place words", "Loss and find often share a building"],
            ["Date proximity", "Days between events", "Same-week events are more plausible"],
        ],
        [0.22, 0.28, 0.50],
    )

    d.section("4.5", "Data Quality Observations")
    d.para(
        "Validation with Zod rejects malformed emails, short passwords, and invalid enums. Image "
        "uploads are checked for JPEG, PNG, or WebP signatures and size limits before being written "
        "to UPLOAD_DIR. Duplicate demo records are avoided by upserting seed documents rather than "
        "blind inserts."
    )

    # ===== CHAPTER 5 =====
    d.chapter_title("CHAPTER 5", "METHODOLOGIES AND TECHNIQUES", "5. Methodologies and Techniques")
    d.section("5.1", "Proposed System Framework")
    d.figure_box(
        "Figure 5.1",
        "End-to-end framework of FindIt",
        [
            "Browser → Next.js pages → /backend proxy → Express /api",
            "→ middleware → controller → service → repository → MongoDB",
        ],
    )
    d.para(
        "The browser never talks to MongoDB and never sees the connection string. Next.js rewrites "
        "/backend to the API so cookies belong to the site origin during development."
    )

    d.section("5.2", "Request Preparation and Validation")
    d.figure_box(
        "Figure 5.2",
        "Main steps used to prepare an API request",
        [
            "1. Parse JSON or multipart body",
            "2. Validate with Zod schemas",
            "3. Resolve session cookie → user + role",
            "4. Enforce route auth and ownership rules",
        ],
    )

    d.section("5.3", "Layered API Design")
    d.para(
        "Routes and controllers translate HTTP into function calls and status codes. Services hold "
        "rules for claims and matching and do not read req or res. Repositories are the only layer "
        "that runs Mongoose queries. This separation keeps demonstration code readable and testable."
    )

    d.section("5.4", "Matching Method")
    d.para(
        "For a lost report the matcher considers a limited set of approved found reports (and the "
        "reverse). The score adds four weighted signals. The date window defaults to 14 days. "
        "Scores below 0.35 are dropped. Results are sorted descending and capped (default eight)."
    )
    d.simple_table(
        "Table 5.1",
        "Default match signal weights and evaluation meaning",
        ["Signal", "Default weight", "How it is read"],
        [
            ["Category", "0.35", "1 if equal, else 0"],
            ["Text (Jaccard)", "0.35", "Token overlap of title+description"],
            ["Location (Jaccard)", "0.15", "Token overlap of location strings"],
            ["Date proximity", "0.15", "Linear decay inside date window"],
            ["Minimum score", "0.35", "Candidates below this are omitted"],
        ],
        [0.28, 0.22, 0.50],
    )

    d.section("5.5", "Claims and Moderation")
    d.para(
        "A student may claim an approved found item they did not report. One pending claim is "
        "allowed per person per item. The reporter or an administrator may approve or reject. The "
        "claimant may cancel a pending claim. Nobody may approve their own claim. Approval updates "
        "the claim and marks the item resolved; on Atlas this uses a transaction, with ordered "
        "fallback updates on standalone servers."
    )

    d.section("5.6", "Deployment Pipeline for Local Demo")
    d.figure_box(
        "Figure 5.3",
        "Flow of a typical student action through the stack",
        [
            "UI form → fetch(/backend/api/...) with credentials",
            "→ Express validates & authorises → service rule → MongoDB write",
            "→ JSON success/error → UI toast / navigation",
        ],
    )
    d.para(
        "Developers run npm install, configure MONGODB_URI and admin password, npm run seed, and "
        "npm run dev to serve the site on port 3000 and the API on port 4000."
    )
    d.para(
        "Image handling is part of the methodology even though storage remains local. Uploads are "
        "signature-checked for JPEG, PNG, or WebP and constrained by size before the filename is "
        "stored on the item. Serving happens through /api/uploads, proxied by Next.js as "
        "/backend/uploads, so the browser stays on one origin during development."
    )
    d.para(
        "Error handling returns structured JSON with safe messages and optional validation details. "
        "Stack traces, password hashes, and database credentials are never included in responses. "
        "This keeps demonstrations honest about failures without exposing secrets on screen."
    )

    # ===== CHAPTER 6 =====
    d.chapter_title("CHAPTER 6", "IMPLEMENTATION", "6. Implementation")
    d.section("6.1", "Development Environment and Technical Stack")
    d.bullet("Next.js App Router, React, TypeScript, Tailwind CSS")
    d.bullet("Aceternity UI background lines; ReUI and shadcn-style components")
    d.bullet("Express, Mongoose, MongoDB")
    d.bullet("Zod, React Hook Form, Vitest, Supertest")
    d.bullet("Node.js 20 or newer; npm workspaces-style monorepo scripts")

    d.section("6.2", "System Architecture and Pipeline Integration")
    d.figure_box(
        "Figure 6.1",
        "Simplified three-layer architecture of the API",
        [
            "Controllers (HTTP) → Services (rules) → Repositories (MongoDB)",
            "Shared auth middleware and Zod validators on the edge",
        ],
    )
    d.figure_box(
        "Figure 6.2",
        "Major product surfaces in the Next.js application",
        [
            "Home & Browse · Auth · Report · Item detail + matches",
            "Claims · Student dashboard · Administrator console",
        ],
    )

    d.section("6.3", "The Application Interface")
    d.subsection("6.3.1", "Browse and Report")
    d.para(
        "Browse lists approved items with search and filters. Creating a report collects title, "
        "description, type, category, location, event date, optional identifying details, contact "
        "preference, and optional image. New reports start pending until moderated."
    )
    d.subsection("6.3.2", "Item Detail and Matches")
    d.para(
        "Item detail shows the public description and, when available, ranked match suggestions "
        "with scores and reason strings such as shared words or date distance."
    )
    d.figure_box(
        "Figure 6.3",
        "Conceptual layout of the item detail page with match panel",
        [
            "[ Item summary & image ]",
            "[ Match list: score · reasons · link to candidate ]",
            "[ Claim action for approved found items ]",
        ],
    )
    d.subsection("6.3.3", "Dashboard and Administration")
    d.para(
        "Students see counts derived from their own reports and claims. Administrators open /admin "
        "for overview statistics, moderation actions, claim review, and resource history."
    )
    d.subsection("6.3.4", "Implementation Notes on the Web App")
    d.para(
        "The web application uses the App Router. Public marketing and browse pages sit beside "
        "authenticated dashboard and admin routes. Forms rely on React Hook Form with Zod-aligned "
        "validation messages. File upload controls send multipart bodies when an image is attached. "
        "Protected pages look for the session cookie, while the API remains the authority for every "
        "mutating request."
    )
    d.para(
        "Concurrent development is started with npm run dev, which launches both processes through "
        "concurrently. Typechecking, linting, and production builds are available as separate "
        "scripts so that the team can catch regressions before a demonstration."
    )

    d.section("6.4", "Data Handling and Workflow Optimisation")
    d.para(
        "List endpoints paginate with a maximum limit of 50. Match candidate queries are bounded "
        "by opposite type, approved status, category or date window, and a candidate limit "
        "(default 80) so that scoring does not scan the entire collection on every request."
    )

    d.section("6.5", "Interface Design Principles")
    d.para(
        "The interface prefers clear task-oriented screens over dense dashboards. Public pages "
        "emphasise search and recovery. Authenticated areas emphasise the student’s own records. "
        "Administrator tools expose moderation without mixing them into the student navigation."
    )

    d.section("6.6", "Security and Privacy Considerations")
    d.para(
        "Passwords are hashed. Session tokens are hashed at rest. Claim proof text is returned only "
        "to the reporter and administrators. Activity logs store actor, action, resource, and time "
        "— not passwords, raw session tokens, or proof text. A student who tampers with a request "
        "body cannot escalate to administrator."
    )
    d.para(
        "Representative public routes include health, registration, login, item search, item stats, "
        "and visible item details. Authenticated students create reports and claims. Administrators "
        "use /api/admin routes for overview counts, moderation, claim review, and resource history. "
        "The full catalogue appears in the project API reference."
    )

    # ===== CHAPTER 7 =====
    d.chapter_title("CHAPTER 7", "TESTING AND VALIDATION", "7. Testing and Validation")
    d.section("7.1", "Testing Approach and Levels")
    d.para(
        "Testing combines automated API tests with a scripted manual demonstration. Automated "
        "tests use Vitest and Supertest with an in-memory MongoDB and do not read or write the "
        "developer’s MONGODB_URI."
    )

    d.section("7.2", "Unit and Integration Testing")
    d.simple_table(
        "Table 7.1",
        "Representative unit and integration test cases",
        ["ID", "Focus", "Expected result"],
        [
            ["TC-01", "Register + login cookie", "Session established; /me returns student"],
            ["TC-02", "Create item pending", "Item stored; not listed on public browse"],
            ["TC-03", "Admin approve item", "Item appears in public list"],
            ["TC-04", "Match earbuds scenario", "Opposite-type candidate scored with reasons"],
            ["TC-05", "Claim approve resolves", "Claim approved; item status resolved"],
            ["TC-06", "Public JSON privacy", "No identifyingDetails / proof in public payload"],
        ],
        [0.12, 0.32, 0.56],
    )

    d.section("7.3", "Validation Strategy")
    d.para(
        "Schema validation rejects invalid enums and missing required fields with safe error "
        "messages. Health returns 503 with DATABASE_UNAVAILABLE when MongoDB is down. Auth routes "
        "are rate limited outside tests."
    )

    d.section("7.4", "Interface and Usability Checks")
    d.para(
        "Manual checks confirm that navigation between browse, report, detail, dashboard, and "
        "admin remains understandable for a first-time demonstrator, and that empty states are "
        "readable when the database has not been seeded."
    )

    d.section("7.5", "Demonstration Checklist Validation")
    d.para(
        "The README demonstration path — seed, sign in as a demo student, open the lost earbuds "
        "report, read the match explanation, moderate a pending found item, and complete a claim — "
        "is treated as an acceptance checklist for viva preparation."
    )

    d.simple_table(
        "Table 7.2",
        "Acceptance outcomes for the seeded demonstration path",
        ["Step", "Outcome"],
        [
            ["Seed admin + demo students", "Accounts available; fictional reports upserted"],
            ["Home stats", "Non-zero counts after seed"],
            ["Match explanation visible", "Reasons list includes heuristic disclaimer"],
            ["Claim → approve", "Item becomes resolved"],
        ],
        [0.40, 0.60],
    )

    # ===== CHAPTER 8 =====
    d.chapter_title("CHAPTER 8", "RESULTS AND DISCUSSION", "8. Results and Discussion")
    d.section("8.1", "Overall System Behaviour")
    d.para(
        "After seeding and starting both processes, the platform behaves as a coherent recovery "
        "workspace: public browse shows approved items, pending reports stay private to owners and "
        "admins, matches appear on eligible item pages, and claims leave an auditable trail."
    )
    d.figure_box(
        "Figure 8.1",
        "Demonstration outcome board (logical view)",
        [
            "Approved lost earbuds ↔ approved found earbuds",
            "Match score above threshold with shared keywords",
            "Claim approved → item resolved",
        ],
    )

    d.section("8.2", "Sample Walkthrough")
    d.simple_table(
        "Table 8.1",
        "Walkthrough of the seeded earbuds recovery scenario",
        ["Step", "Actor", "Action", "Result"],
        [
            ["1", "Operator", "npm run seed", "Demo data ready"],
            ["2", "Student Asha", "Open lost earbuds", "Sees match to found report"],
            ["3", "Admin", "Approve pending found (if any)", "Listing becomes public"],
            ["4", "Claimant", "Submit claim with proof", "Claim pending"],
            ["5", "Reporter/Admin", "Approve claim", "Item resolved"],
        ],
        [0.10, 0.20, 0.35, 0.35],
    )

    d.section("8.3", "Match Explanation Discussion")
    d.figure_box(
        "Figure 8.2",
        "Relative contribution of default match weights",
        [
            "Category 35% · Text 35% · Location 15% · Date 15%",
            "Minimum display threshold 0.35",
        ],
    )
    d.simple_table(
        "Table 8.2",
        "Practical reading of default match weights",
        ["Signal", "Approx. share", "Reading"],
        [
            ["Category", "35%", "Strong gate when classes differ"],
            ["Text", "35%", "Names the object in overlapping words"],
            ["Location", "15%", "Supports same-building stories"],
            ["Date", "15%", "Prefers events close in time"],
        ],
        [0.22, 0.22, 0.56],
    )

    d.section("8.4", "Discussion of Results")
    d.simple_table(
        "Table 8.3",
        "Practical reading of demonstration results",
        ["Observation", "Interpretation"],
        [
            ["Explainable scores", "Reviewers can contest weak matches"],
            ["Pending before public", "Reduces spam on browse"],
            ["Proof not public", "Protects ownership secrets"],
            ["Heuristic limits", "May miss paraphrases outside window"],
        ],
        [0.35, 0.65],
    )

    d.section("8.5", "Behaviour Outside Ideal Conditions")
    d.para(
        "If MongoDB is unreachable, the API exits or health fails rather than inventing fake data. "
        "If images are uploaded while the API is down, the web proxy cannot serve /backend/uploads. "
        "Match suggestions can miss similar items outside the category and date window by design."
    )
    d.section("8.6", "Interpretation for Examiners")
    d.para(
        "The results should be read as evidence of a working educational system, not as a claim of "
        "production readiness for an entire university. Success is the coherent loop — report, "
        "moderate, match, claim, resolve — with privacy boundaries that can be shown live. Residual "
        "limitations are listed openly in Chapter 11 so that future teams know where to extend."
    )
    d.para(
        "Compared with a notebook-only prototype, the presence of seeded accounts, HTTP cookies, "
        "and administrator history makes the demonstration closer to how internal campus tools "
        "actually behave. That realism is an intentional result of the full-stack methodology."
    )

    # ===== CHAPTER 9 =====
    d.chapter_title("CHAPTER 9", "CONCLUSION AND FUTURE WORK", "9. Conclusion and Future Work")
    d.section("9.1", "Conclusion")
    d.para(
        "FindIt demonstrates that a campus lost-and-found workflow can be implemented as a clear "
        "full-stack system: moderated listings, private claim proof, explainable matching, and "
        "administrator oversight. The project meets its educational goals by exposing students to "
        "authentication, layered APIs, validation, testing, and honest product boundaries."
    )

    d.section("9.2", "Future Work")
    d.bullet("Email or in-app notifications when a claim is reviewed.")
    d.bullet("A map or building list for locations.")
    d.bullet("Object storage for images instead of local disk.")
    d.bullet("A richer audit view for administrators.")
    d.bullet("Optional stronger text similarity while keeping explanations.")

    d.section("9.3", "Extension towards Richer Campus Services")
    d.para(
        "The same architecture could later host related campus services — for example locker "
        "returns or lab-equipment loans — by reusing sessions, roles, and activity logging while "
        "replacing the item schema and match rules."
    )

    # ===== CHAPTER 10 =====
    d.chapter_title(
        "CHAPTER 10",
        "PROJECT MANAGEMENT AND DEVELOPMENT TIMELINE",
        "10. Project Management and Development Timeline",
    )
    d.section("10.1", "Development Methodology")
    d.para(
        "Work followed an iterative full-stack approach: agree on the recovery workflow, model "
        "collections, implement API routes with tests, build corresponding Next.js screens, seed "
        "demo data, and refine documentation for viva demonstration."
    )

    d.section("10.2", "Project Timeline")
    d.simple_table(
        "Table 10.1",
        "Project timeline by phase",
        ["Phase", "Focus", "Outcome"],
        [
            ["1", "Requirements & scope", "Problem, objectives, out-of-scope list"],
            ["2", "Data model & API", "Mongoose schemas, layered services"],
            ["3", "Matching & claims", "Heuristic scorer, claim states"],
            ["4", "Web interface", "Browse, report, detail, admin"],
            ["5", "Testing & seed", "Vitest suite, demo script"],
            ["6", "Report & PPT", "Academic documentation"],
        ],
        [0.12, 0.35, 0.53],
    )

    d.section("10.3", "Resource and Tool Summary")
    d.simple_table(
        "Table 10.2",
        "Summary of tools and libraries used in the project",
        ["Tool", "Role"],
        [
            ["Node.js / npm", "Runtime and package management"],
            ["Next.js / React / TS", "Web application"],
            ["Express / Mongoose", "HTTP API and ODM"],
            ["MongoDB Atlas/local", "Persistence"],
            ["Zod / RHF", "Validation and forms"],
            ["Vitest / Supertest", "Automated tests"],
            ["Git", "Version control"],
        ],
        [0.35, 0.65],
    )

    d.section("10.4", "Risk Management")
    d.figure_box(
        "Figure 10.1",
        "Risk-mitigation cycle followed during development",
        ["Identify → Mitigate in design → Test → Document residual risk"],
    )
    d.simple_table(
        "Table 10.3",
        "Project risks and mitigation strategies",
        ["Risk", "Mitigation"],
        [
            ["DB connection failures", "Fail fast; health 503; no fake data"],
            ["Role escalation", "Server-side role checks; register forces student"],
            ["Match overtrust", "Disclaimer in reasons; human claim review"],
            ["Image disk limits", "Type/size checks; future object storage noted"],
            ["Demo flakiness", "Idempotent seed upserts; clear README steps"],
        ],
        [0.35, 0.65],
    )

    # ===== CHAPTER 11 =====
    d.chapter_title(
        "CHAPTER 11",
        "LIMITATIONS, ETHICAL AND PRACTICAL CONSIDERATIONS",
        "11. Limitations, Ethical and Practical Considerations",
    )
    d.section("11.1", "Limitations of the Current System")
    d.bullet("Images are stored on the API machine; object storage is not wired up.")
    d.bullet("Matching is a capped heuristic and can miss paraphrased reports.")
    d.bullet("The app does not send email.")
    d.bullet("Standalone MongoDB may not support transactions; ordered fallback is used.")

    d.section("11.2", "Ethical Considerations")
    d.para(
        "Lost-and-found systems handle sensitive personal context. FindIt therefore keeps "
        "identifying details and claim proof out of public JSON, restricts administrator routes, "
        "and labels match scores as similarity estimates. Seed data uses fictional identities so "
        "that demonstrations do not expose real student information."
    )

    d.section("11.3", "Practical Deployment Considerations")
    d.para(
        "A real campus deployment would additionally require institutional authentication, "
        "backup policies, abuse reporting, retention rules for images, and monitored hosting. "
        "Those operational concerns are acknowledged as future work rather than claimed as finished."
    )

    d.section("11.4", "Comparison with Informal Human Judgement")
    d.para(
        "Human judgement in chats can be nuanced but is inconsistent and hard to audit. FindIt "
        "does not replace human review of claims; it structures the evidence and the decision so "
        "that outcomes are repeatable and inspectable."
    )

    # ===== CHAPTER 12 Appendix A =====
    d.chapter_title("CHAPTER 12", "APPENDIX A — SOURCE CODE", "12. Appendix A — Source Code")
    d.section("A.1", "Repository Layout")
    d.code_block(
        [
            "apps/web          Next.js interface",
            "apps/api          Express API, models, tests, seed",
            "docs              Architecture and API reference",
        ]
    )

    d.section("A.2", "Match Scoring (excerpt)")
    d.code_block(
        [
            "const raw =",
            "  config.weights.category * categoryScore +",
            "  config.weights.text * textScore +",
            "  config.weights.location * locationScore +",
            "  config.weights.date * dateScore;",
            "const score = Math.round(raw * 100) / 100;",
            "if (score < config.minScore) return null;",
        ]
    )

    d.section("A.3", "Default Matching Configuration (excerpt)")
    d.code_block(
        [
            "weights: { category: 0.35, text: 0.35, location: 0.15, date: 0.15 },",
            "dateWindowDays: 14,",
            "minScore: 0.35,",
            "candidateLimit: 80,",
            "resultLimit: 8,",
        ]
    )

    d.section("A.4", "Request Path (conceptual)")
    d.code_block(
        [
            "Browser -> Next.js -> /backend proxy -> Express route",
            "       -> middleware -> controller -> service",
            "       -> repository -> MongoDB",
        ]
    )

    d.section("A.5", "Key npm Scripts")
    d.code_block(
        [
            "npm install",
            "npm run seed",
            "npm run dev          # web :3000, api :4000",
            "npm run test",
            "npm run seed:clear",
        ]
    )

    # ===== CHAPTER 13 Glossary =====
    d.chapter_title(
        "CHAPTER 13",
        "GLOSSARY OF KEY TERMS AND ABBREVIATIONS",
        "13. Glossary of Key Terms and Abbreviations",
    )
    glossary = [
        ("FindIt", "Smart campus lost-and-found platform developed in this project."),
        ("Item", "A lost or found report document with status and metadata."),
        ("Claim", "A request asserting ownership of an approved found item."),
        ("Match score", "Heuristic similarity estimate with written reasons; not a probability."),
        ("Jaccard overlap", "Size of token intersection divided by union; used for text/location."),
        ("Session cookie", "HTTP-only findit_session cookie holding a random session id."),
        ("Repository", "API layer that alone executes Mongoose queries."),
        ("Moderation", "Administrator approve/reject/archive/resolve actions on reports."),
        ("Seed script", "Idempotent loader of fictional demo users and reports."),
        ("Vitest / Supertest", "Tools used for automated API tests."),
        ("Zod", "Schema validation library for request bodies and config."),
        ("ODM", "Object-Document Mapper; Mongoose maps schemas to MongoDB."),
    ]
    for term, meaning in glossary:
        d.ensure_space(40)
        d.c.setFont("Times-Bold", 11)
        d.c.drawString(MARGIN_L, d.y, term)
        d.y -= 14
        d.para(meaning, size=10, leading=14, space_after=8)

    # ===== CHAPTER 14 Appendix B =====
    d.chapter_title(
        "CHAPTER 14",
        "APPENDIX B — SAMPLE TEST CASES AND USER MANUAL",
        "14. Appendix B — Sample Test Cases and User Manual",
    )
    d.section("B.1", "Extended Sample Test Cases")
    d.simple_table(
        "Table B.1",
        "Extended set of illustrative scenarios used during testing",
        ["Profile", "Purpose"],
        [
            ["Default seed earbuds", "Baseline match + claim path"],
            ["New student pending found", "Confirm browse hides pending"],
            ["Admin reject report", "Confirm not public; owner can still see"],
            ["Second claim same user", "Reject duplicate pending claim"],
            ["Self-claim attempt", "Blocked by service rules"],
            ["Invalid image type", "Upload rejected safely"],
        ],
        [0.40, 0.60],
    )

    d.section("B.2", "User Manual — Running the Application")
    d.bullet("Install Node.js 20+ and npm; clone the repository.")
    d.bullet("Run npm install from the project root.")
    d.bullet("Copy apps/api/.env.example to .env and set MONGODB_URI and ADMIN_PASSWORD.")
    d.bullet("Copy apps/web/.env.example to .env.local (proxy defaults are already suitable).")
    d.bullet("Run npm run seed, then npm run dev.")
    d.bullet("Open http://localhost:3000; API health at http://localhost:4000/api/health.")
    d.bullet("Sign in as asha.menon@campus.example with DEMO_STUDENT_PASSWORD.")
    d.bullet("Walk the earbuds match and claim path; use admin credentials for moderation.")

    d.section("B.3", "Troubleshooting FAQ")
    d.simple_table(
        "Table B.2",
        "Common issues and suggested fixes",
        ["Issue", "Suggested fix"],
        [
            ["API exits immediately", "Check MONGODB_URI and Atlas IP allow list"],
            ["Site loads but actions fail", "Ensure API is running; check API_PROXY_TARGET"],
            ["Seed rejects admin password", "Replace change-me-admin-password"],
            ["Images missing", "API must serve /uploads via /backend proxy"],
        ],
        [0.35, 0.65],
    )

    # ===== CHAPTER 15 References =====
    d.chapter_title("CHAPTER 15", "REFERENCES", "15. References")
    refs = [
        "1. Vercel Inc., “Next.js Documentation,” [Online]. Available: https://nextjs.org/docs",
        "2. OpenJS Foundation, “Express — Node.js web application framework,” [Online]. Available: https://expressjs.com/",
        "3. MongoDB Inc., “MongoDB Manual,” [Online]. Available: https://www.mongodb.com/docs/manual/",
        "4. Automattic, “Mongoose ODM,” [Online]. Available: https://mongoosejs.com/docs/",
        "5. Zod Documentation, [Online]. Available: https://zod.dev/",
        "6. React Hook Form, [Online]. Available: https://react-hook-form.com/",
        "7. Vitest, [Online]. Available: https://vitest.dev/",
        "8. Tailwind Labs, “Tailwind CSS,” [Online]. Available: https://tailwindcss.com/docs",
        "9. Fielding, R. T., Architectural Styles and the Design of Network-based Software Architectures, Doctoral dissertation, UC Irvine, 2000.",
        "10. OWASP Foundation, “Session Management Cheat Sheet,” [Online]. Available: https://cheatsheetseries.owasp.org/",
        "11. MDN Web Docs, “HTTP cookies,” [Online]. Available: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies",
        "12. Punjabi University, Patiala — Department of Computer Science & Engineering, Minor Project Guidelines (course reference).",
    ]
    for r in refs:
        d.para(r, size=10, leading=14, space_after=8)


def main() -> None:
    global STUDENTS
    DELIVERABLES.mkdir(parents=True, exist_ok=True)
    # Generate one individual report per student (same body, personalised front matter).
    for student in ALL_STUDENTS:
        STUDENTS = [student]
        _build_with_merge()


if __name__ == "__main__":
    main()
