from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.lib import colors
import os
from django.conf import settings

def generar_pdf_ranking(buffer, competencia, data_estructurada):
    """
    Genera un PDF oficial con resultados agrupados por Modalidad y Categoría.
    """
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    
    # --- CONFIGURACIÓN ---
    y = height - 1*inch
    x_margin = 20 * mm
    line_height = 18

    def draw_header():
        nonlocal y
        # Logo
        logo_path = os.path.join(settings.BASE_DIR, 'staticfiles', 'img', 'logo.png')
        try:
            c.drawImage(logo_path, x_margin, height - 35*mm, width=20*mm, height=20*mm, mask='auto')
        except: pass

        # Textos
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width/2, height - 20*mm, "RESULTADOS OFICIALES")
        c.setFont("Helvetica", 10)
        c.drawCentredString(width/2, height - 25*mm, competencia.name.upper())
        c.setFont("Helvetica-Oblique", 9)
        c.drawCentredString(width/2, height - 30*mm, f"Fecha: {competencia.start_date.strftime('%d/%m/%Y')}")
        
        c.line(x_margin, height - 38*mm, width - x_margin, height - 38*mm)
        return height - 50*mm

    # Dibujar primera cabecera
    y = draw_header()

    # --- CUERPO DEL REPORTE ---
    for modalidad in data_estructurada['modalidades']:
        # Verificar espacio para título de modalidad
        if y < 40*mm:
            c.showPage()
            y = draw_header()

        # Título Modalidad (Azul)
        c.setFillColorRGB(0.1, 0.1, 0.5)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x_margin, y, f"MODALIDAD: {modalidad['nombre'].upper()}")
        y -= line_height + 5
        c.setFillColorRGB(0, 0, 0) # Reset color

        for categoria in modalidad['categorias']:
            # Verificar espacio para tabla
            if y < 40*mm:
                c.showPage()
                y = draw_header()

            # Subtítulo Categoría
            c.setFont("Helvetica-Bold", 10)
            c.drawString(x_margin + 5*mm, y, f"Categoría: {categoria['nombre']}")
            y -= line_height

            # Encabezados Tabla
            c.setFont("Helvetica-Bold", 8)
            c.setFillColor(colors.grey)
            c.drawString(x_margin + 5*mm, y, "POS")
            c.drawString(x_margin + 20*mm, y, "DEPORTISTA")
            c.drawString(x_margin + 90*mm, y, "CLUB")
            c.drawRightString(width - x_margin, y, "PUNTAJE")
            c.setFillColor(colors.black)
            y -= 5
            c.line(x_margin + 5*mm, y, width - x_margin, y)
            y -= line_height

            # Filas
            c.setFont("Helvetica", 9)
            for idx, res in enumerate(categoria['resultados']):
                if y < 20*mm:
                    c.showPage()
                    y = draw_header()

                c.drawString(x_margin + 7*mm, y, str(idx + 1))
                c.drawString(x_margin + 20*mm, y, res['deportista'])
                c.drawString(x_margin + 90*mm, y, res['club'])
                c.setFont("Helvetica-Bold", 9)
                c.drawRightString(width - x_margin, y, f"{res['puntaje']:.2f}")
                c.setFont("Helvetica", 9)
                y -= line_height
            
            y -= 10 # Espacio entre categorías

        y -= 15 # Espacio entre modalidades

    c.save()