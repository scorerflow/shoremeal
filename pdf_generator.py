"""
PDF Generator for Nutrition Plans
Creates professional, formatted PDF documents from nutrition plan text
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, HRFlowable, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
from reportlab.platypus.frames import Frame
from reportlab.pdfgen import canvas
from datetime import datetime
import re
import html


class NumberedCanvas(canvas.Canvas):
    """Custom canvas that adds page numbers and headers"""

    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []
        self.client_name = kwargs.get('client_name', 'Client')

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        """Draw page number and header on each page"""
        page_num = self._pageNumber

        # Skip header/footer on cover page (page 1)
        if page_num == 1:
            return

        # Header line
        self.setStrokeColor(colors.HexColor('#2C5F2D'))
        self.setLineWidth(0.5)
        self.line(0.75*inch, 10.25*inch, 7.75*inch, 10.25*inch)

        # Header text
        self.setFont('Helvetica', 9)
        self.setFillColor(colors.HexColor('#666666'))
        self.drawString(0.75*inch, 10.35*inch, "Personal Nutrition Plan")
        self.drawRightString(7.75*inch, 10.35*inch, getattr(self, '_client_name', 'Client'))

        # Footer line
        self.line(0.75*inch, 0.6*inch, 7.75*inch, 0.6*inch)

        # Page number
        self.setFont('Helvetica', 9)
        self.setFillColor(colors.HexColor('#666666'))
        self.drawCentredString(4.25*inch, 0.4*inch, f"Page {page_num} of {page_count}")


class NutritionPlanPDF:
    # Colour scheme
    PRIMARY_GREEN = '#2C5F2D'
    SECONDARY_GREEN = '#4A7C4E'
    LIGHT_GREEN = '#E8F5E9'
    ACCENT_ORANGE = '#FF8C00'
    TEXT_DARK = '#333333'
    TEXT_LIGHT = '#666666'

    def __init__(self, filename, client_name):
        self.filename = filename
        self.client_name = client_name
        self.doc = SimpleDocTemplate(
            filename,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.9*inch,
            bottomMargin=0.75*inch
        )
        self.story = []
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()

    def _create_custom_styles(self):
        """Create custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor(self.PRIMARY_GREEN),
            spaceAfter=20,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Normal'],
            fontSize=14,
            textColor=colors.HexColor(self.TEXT_LIGHT),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Oblique'
        ))

        # Section heading - larger, with underline effect via spaceBefore
        self.styles.add(ParagraphStyle(
            name='SectionHeading',
            parent=self.styles['Heading2'],
            fontSize=18,
            textColor=colors.HexColor(self.PRIMARY_GREEN),
            spaceAfter=12,
            spaceBefore=24,
            fontName='Helvetica-Bold',
            borderPadding=0,
            borderWidth=0
        ))

        # Subsection heading
        self.styles.add(ParagraphStyle(
            name='SubsectionHeading',
            parent=self.styles['Heading3'],
            fontSize=13,
            textColor=colors.HexColor(self.SECONDARY_GREEN),
            spaceAfter=8,
            spaceBefore=14,
            fontName='Helvetica-Bold'
        ))

        # Day heading style
        self.styles.add(ParagraphStyle(
            name='DayHeading',
            parent=self.styles['Heading3'],
            fontSize=14,
            textColor=colors.HexColor(self.PRIMARY_GREEN),
            spaceAfter=10,
            spaceBefore=16,
            fontName='Helvetica-Bold',
            backColor=colors.HexColor(self.LIGHT_GREEN),
            borderPadding=(8, 8, 8, 8)
        ))

        # Body text
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor(self.TEXT_DARK),
            spaceAfter=8,
            alignment=TA_JUSTIFY,
            leading=14
        ))

        # Recipe title style
        self.styles.add(ParagraphStyle(
            name='RecipeTitle',
            parent=self.styles['Heading4'],
            fontSize=12,
            textColor=colors.HexColor(self.ACCENT_ORANGE),
            spaceAfter=6,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))

        # Recipe style
        self.styles.add(ParagraphStyle(
            name='Recipe',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor(self.TEXT_DARK),
            spaceAfter=4,
            leftIndent=15,
            leading=13
        ))

        # Bullet item style
        self.styles.add(ParagraphStyle(
            name='BulletItem',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor(self.TEXT_DARK),
            spaceAfter=4,
            leftIndent=20,
            bulletIndent=10,
            leading=13
        ))

        # Macro label style
        self.styles.add(ParagraphStyle(
            name='MacroLabel',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor(self.TEXT_LIGHT),
            alignment=TA_CENTER
        ))

        # Macro value style
        self.styles.add(ParagraphStyle(
            name='MacroValue',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor(self.PRIMARY_GREEN),
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

        # Small text style
        self.styles.add(ParagraphStyle(
            name='SmallText',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor(self.TEXT_LIGHT),
            spaceAfter=4,
            leading=10
        ))

    def add_cover_page(self, user_data):
        """Add a professional cover page"""
        # Add some vertical space to center content
        self.story.append(Spacer(1, 1.5*inch))

        # Title
        title = Paragraph(
            "Personal Nutrition Plan",
            self.styles['CustomTitle']
        )
        self.story.append(title)

        # Decorative line
        self.story.append(Spacer(1, 0.1*inch))
        self.story.append(HRFlowable(
            width="40%",
            thickness=2,
            color=colors.HexColor(self.ACCENT_ORANGE),
            spaceBefore=5,
            spaceAfter=5,
            hAlign='CENTER'
        ))

        # Subtitle
        subtitle = Paragraph(
            f"Customised for {self.client_name}",
            self.styles['CustomSubtitle']
        )
        self.story.append(subtitle)
        self.story.append(Spacer(1, 0.6*inch))

        # Client info box - more refined
        client_info = [
            [Paragraph('<b>Your Profile</b>', ParagraphStyle(
                'TableHeader', fontSize=12, textColor=colors.whitesmoke, alignment=TA_CENTER
            )), ''],
            ['Name', self.client_name],
            ['Age', user_data.get('age', 'N/A')],
            ['Goal', user_data.get('goal', 'N/A')],
            ['Diet Type', user_data.get('dietary_type', 'N/A').title()],
            ['Activity Level', user_data.get('activity_level', 'N/A')],
            ['Plan Duration', f"{user_data.get('plan_duration', '7')} days"],
            ['Created', datetime.now().strftime('%d %B %Y')]
        ]

        table = Table(client_info, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.PRIMARY_GREEN)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('SPAN', (0, 0), (1, 0)),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('ALIGN', (0, 1), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 1), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F8F8')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(self.SECONDARY_GREEN)),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor(self.SECONDARY_GREEN)),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('PADDING', (0, 1), (-1, -1), 10),
        ]))

        self.story.append(table)
        self.story.append(Spacer(1, 0.8*inch))

        # What's inside section
        contents_title = Paragraph(
            "<b>What's Inside</b>",
            ParagraphStyle('ContentsTitle', fontSize=12, textColor=colors.HexColor(self.PRIMARY_GREEN),
                          alignment=TA_CENTER, spaceAfter=10)
        )
        self.story.append(contents_title)

        contents_items = [
            "Personalised nutritional analysis & calorie targets",
            f"Complete {user_data.get('plan_duration', '7')}-day meal plan with macros",
            "Detailed recipes with step-by-step instructions",
            "Organised shopping list with budget guidance",
            "Meal prep strategies & storage tips",
            "Expert advice for long-term success"
        ]

        for item in contents_items:
            self.story.append(Paragraph(
                f"✓ {item}",
                ParagraphStyle('ContentsItem', fontSize=10, textColor=colors.HexColor(self.TEXT_DARK),
                              alignment=TA_CENTER, spaceAfter=4)
            ))

        self.story.append(Spacer(1, 0.6*inch))

        # Disclaimer in a box
        disclaimer_text = (
            "<i>This nutrition plan is for informational purposes only and should not replace "
            "professional medical advice. Please consult with a healthcare provider before starting "
            "any new diet or nutrition programme.</i>"
        )
        disclaimer_data = [[Paragraph(disclaimer_text, ParagraphStyle(
            'DisclaimerText', fontSize=8, textColor=colors.HexColor(self.TEXT_LIGHT),
            alignment=TA_CENTER, leading=11
        ))]]
        disclaimer_table = Table(disclaimer_data, colWidths=[6*inch])
        disclaimer_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F5F5F5')),
            ('PADDING', (0, 0), (-1, -1), 12),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
        ]))
        self.story.append(disclaimer_table)

        self.story.append(PageBreak())

    def _sanitize_text(self, text):
        """Sanitise text for PDF generation - fix malformed HTML and convert markdown"""
        text = html.escape(text)
        text = re.sub(r'\*\*([^\*]+)\*\*', r'<b>\1</b>', text)
        text = re.sub(r'\*([^\*]+)\*', r'<i>\1</i>', text)
        text = re.sub(r'_([^_]+)_', r'<i>\1</i>', text)

        # Unescape the HTML tags we just added
        text = text.replace('&lt;b&gt;', '<b>')
        text = text.replace('&lt;/b&gt;', '</b>')
        text = text.replace('&lt;i&gt;', '<i>')
        text = text.replace('&lt;/i&gt;', '</i>')

        return text

    def _is_major_section(self, line):
        """Check if line is a major section header"""
        major_keywords = [
            'NUTRITIONAL ANALYSIS', 'MEAL PLAN', 'DAY MEAL PLAN', 'RECIPES',
            'SHOPPING LIST', 'MEAL PREP', 'ADDITIONAL TIPS', 'TIPS & ADVICE',
            'TIPS AND ADVICE', 'HYDRATION', 'SUPPLEMENT'
        ]
        clean_line = line.upper().replace('**', '').replace('*', '').replace('#', '').strip()
        return any(keyword in clean_line for keyword in major_keywords)

    def _is_day_header(self, line):
        """Check if line is a day header"""
        patterns = [
            r'^#{0,3}\s*\*{0,2}DAY\s*\d+',
            r'^#{0,3}\s*\*{0,2}(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)',
            r'^DAY\s*\d+\s*[-:–]',
            r'^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s*[-:–]'
        ]
        for pattern in patterns:
            if re.match(pattern, line.strip(), re.IGNORECASE):
                return True
        return False

    def _is_recipe_title(self, line):
        """Check if line looks like a recipe title"""
        clean = line.replace('**', '').replace('*', '').replace('#', '').strip()
        recipe_indicators = [
            'recipe', 'breakfast:', 'lunch:', 'dinner:', 'snack:',
            'serves', 'prep time', 'cook time'
        ]
        # Recipe titles are often bold and not too long
        if line.startswith('**') and len(clean) < 60 and ':' not in clean:
            return True
        if any(ind in clean.lower() for ind in recipe_indicators):
            return True
        return False

    def parse_and_add_content(self, plan_text):
        """Parse the plan text and add formatted content with improved structure"""
        lines = plan_text.split('\n')
        i = 0
        in_recipe = False
        recipe_lines = []
        recipe_title = ""
        current_section = ""
        shopping_items = []
        in_shopping_list = False

        while i < len(lines):
            line = lines[i].strip()

            # Skip empty lines (but track them for recipe endings)
            if not line:
                if in_recipe and recipe_lines:
                    # End of recipe - create recipe card
                    self.story.append(self._create_recipe_card(recipe_title, recipe_lines))
                    recipe_lines = []
                    recipe_title = ""
                    in_recipe = False
                if in_shopping_list and shopping_items and i + 1 < len(lines):
                    # Check if next non-empty line is still shopping content
                    next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
                    if next_line and not next_line.startswith(('-', '•', '*', '☐')):
                        # End shopping list section
                        table = self._create_shopping_table(shopping_items)
                        if table:
                            self.story.append(table)
                            self.story.append(Spacer(1, 0.2*inch))
                        shopping_items = []
                        in_shopping_list = False
                i += 1
                continue

            try:
                # Check for main sections (all caps or **SECTION**)
                is_section = (
                    (line.isupper() and len(line) > 3) or
                    (line.startswith('**') and line.endswith('**') and line.count('**') == 2) or
                    (line.startswith('## ') or line.startswith('# '))
                )

                if is_section:
                    # Flush any pending recipe
                    if in_recipe and recipe_lines:
                        self.story.append(self._create_recipe_card(recipe_title, recipe_lines))
                        recipe_lines = []
                        recipe_title = ""
                        in_recipe = False

                    # Flush shopping list
                    if shopping_items:
                        table = self._create_shopping_table(shopping_items)
                        if table:
                            self.story.append(table)
                        shopping_items = []
                        in_shopping_list = False

                    section_title = line.replace('**', '').replace('*', '').replace('#', '').strip()
                    section_title = html.escape(section_title)
                    current_section = section_title.upper()

                    # Add page break before major sections (except first one)
                    if self._is_major_section(line) and len(self.story) > 10:
                        self.story.append(PageBreak())

                    self.story.append(Paragraph(section_title, self.styles['SectionHeading']))
                    self.story.append(self._create_section_divider())

                    # Track if we're entering shopping list
                    if 'SHOPPING' in current_section:
                        in_shopping_list = True

                # Check for day headers
                elif self._is_day_header(line):
                    day_title = line.replace('**', '').replace('*', '').replace('#', '').strip()
                    day_title = html.escape(day_title)

                    # Add spacer before day (but not page break for every day)
                    self.story.append(Spacer(1, 0.15*inch))

                    # Create a styled day header box
                    day_table = Table([[Paragraph(f"<b>{day_title}</b>", ParagraphStyle(
                        'DayTitle', fontSize=12, textColor=colors.HexColor(self.PRIMARY_GREEN),
                        alignment=TA_LEFT
                    ))]], colWidths=[6.5*inch])
                    day_table.setStyle(TableStyle([
                        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.LIGHT_GREEN)),
                        ('PADDING', (0, 0), (-1, -1), 10),
                        ('LEFTPADDING', (0, 0), (-1, -1), 15),
                        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor(self.SECONDARY_GREEN)),
                    ]))
                    self.story.append(day_table)
                    self.story.append(Spacer(1, 0.1*inch))

                # Check for subsections (### or bold text with colon)
                elif line.startswith('###') or (line.startswith('**') and ':' in line and not self._is_recipe_title(line)):
                    subsection_title = line.replace('###', '').replace('**', '').strip()
                    subsection_title = html.escape(subsection_title)
                    self.story.append(Paragraph(subsection_title, self.styles['SubsectionHeading']))

                # Check for recipe titles
                elif self._is_recipe_title(line) and 'RECIPE' in current_section:
                    # Start collecting recipe
                    if in_recipe and recipe_lines:
                        self.story.append(self._create_recipe_card(recipe_title, recipe_lines))
                        recipe_lines = []

                    recipe_title = line.replace('**', '').replace('*', '').replace('#', '').strip()
                    in_recipe = True

                # Collecting recipe content
                elif in_recipe:
                    recipe_lines.append(line)

                # Shopping list items
                elif in_shopping_list and (line.startswith('-') or line.startswith('•') or line.startswith('*')):
                    shopping_items.append(line)

                # Check for bullet points
                elif line.startswith('•') or line.startswith('-') or line.startswith('*'):
                    bullet_text = line[1:].strip()
                    bullet_text = self._sanitize_text(bullet_text)
                    self.story.append(Paragraph(f"• {bullet_text}", self.styles['BulletItem']))

                # Regular paragraph
                else:
                    sanitized_line = self._sanitize_text(line)
                    self.story.append(Paragraph(sanitized_line, self.styles['CustomBody']))

            except Exception as e:
                print(f"Warning: Could not parse line: {line[:50]}... ({e})")
                try:
                    safe_line = html.escape(line)
                    self.story.append(Paragraph(safe_line, self.styles['CustomBody']))
                except:
                    pass

            i += 1

        # Flush any remaining content
        if in_recipe and recipe_lines:
            self.story.append(self._create_recipe_card(recipe_title, recipe_lines))
        if shopping_items:
            table = self._create_shopping_table(shopping_items)
            if table:
                self.story.append(table)

    def _create_section_divider(self):
        """Create a horizontal line divider"""
        return HRFlowable(
            width="100%",
            thickness=1,
            color=colors.HexColor(self.PRIMARY_GREEN),
            spaceBefore=10,
            spaceAfter=15
        )

    def _create_macro_box(self, calories, protein, carbs, fats):
        """Create a nutrition facts mini-box"""
        data = [
            [
                Paragraph(f"<b>{calories}</b>", self.styles['MacroValue']),
                Paragraph(f"<b>{protein}g</b>", self.styles['MacroValue']),
                Paragraph(f"<b>{carbs}g</b>", self.styles['MacroValue']),
                Paragraph(f"<b>{fats}g</b>", self.styles['MacroValue'])
            ],
            [
                Paragraph("Calories", self.styles['MacroLabel']),
                Paragraph("Protein", self.styles['MacroLabel']),
                Paragraph("Carbs", self.styles['MacroLabel']),
                Paragraph("Fats", self.styles['MacroLabel'])
            ]
        ]

        table = Table(data, colWidths=[1.5*inch, 1.2*inch, 1.2*inch, 1.2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(self.LIGHT_GREEN)),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor(self.SECONDARY_GREEN)),
            ('TOPPADDING', (0, 0), (-1, 0), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
            ('TOPPADDING', (0, 1), (-1, 1), 2),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 6),
        ]))
        return table

    def _create_recipe_card(self, title, content_lines):
        """Create a styled recipe card"""
        elements = []

        # Recipe title with orange accent
        title_para = Paragraph(f"🍽️ {title}", self.styles['RecipeTitle'])
        elements.append(title_para)

        # Recipe content
        for line in content_lines:
            if line.strip():
                sanitized = self._sanitize_text(line.strip())
                if line.strip().startswith(('-', '•', '*')):
                    bullet_text = sanitized.lstrip('-•* ')
                    elements.append(Paragraph(f"• {bullet_text}", self.styles['Recipe']))
                else:
                    elements.append(Paragraph(sanitized, self.styles['Recipe']))

        elements.append(Spacer(1, 0.15*inch))
        return KeepTogether(elements)

    def _create_shopping_table(self, items):
        """Create a formatted shopping list table"""
        if not items:
            return None

        # Group items by category if possible
        data = [['☐', 'Item', 'Quantity']]
        for item in items[:30]:  # Limit to prevent overflow
            clean_item = item.strip().lstrip('-•* ')
            if clean_item:
                # Try to split quantity if present
                parts = clean_item.rsplit(' - ', 1) if ' - ' in clean_item else [clean_item, '']
                data.append(['☐', parts[0][:50], parts[1] if len(parts) > 1 else ''])

        if len(data) <= 1:
            return None

        table = Table(data, colWidths=[0.3*inch, 4.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.PRIMARY_GREEN)),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'CENTER'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FAFAFA')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F5F5F5')]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#DDDDDD')),
            ('PADDING', (0, 1), (-1, -1), 6),
        ]))
        return table

    def generate(self, plan_text, user_data):
        """Generate the complete PDF"""
        # Add cover page
        self.add_cover_page(user_data)

        # Add plan content
        self.parse_and_add_content(plan_text)

        # Build PDF with custom canvas for page numbers
        client_name = self.client_name

        def make_canvas(filename, pagesize, **kwargs):
            c = NumberedCanvas(filename, pagesize=pagesize)
            c._client_name = client_name
            return c

        self.doc.build(self.story, canvasmaker=make_canvas)
        return self.filename


def create_nutrition_plan_pdf(plan_text, user_data, output_path):
    """
    Convenience function to create a nutrition plan PDF

    Args:
        plan_text: The generated nutrition plan text
        user_data: Dictionary with user information
        output_path: Path where PDF should be saved

    Returns:
        Path to the generated PDF
    """
    pdf = NutritionPlanPDF(output_path, user_data.get('name', 'Client'))
    return pdf.generate(plan_text, user_data)
