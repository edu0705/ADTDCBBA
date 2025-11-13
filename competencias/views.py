from django.http import HttpResponse
from django.db.models import Sum # Necesario para la lógica de ranking
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch # <-- ¡IMPORTACIÓN AÑADIDA!
from rest_framework import viewsets, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Competencia, Modalidad, Categoria, Poligono, Juez, Inscripcion, Resultado
)
from .serializers import (
    CompetenciaSerializer, 
    ModalidadSerializer, 
    CategoriaSerializer, 
    PoligonoSerializer, 
    JuezSerializer,
    InscripcionSerializer,
    InscripcionCreateSerializer,
    ScoreSubmissionSerializer,
    ResultadoSerializer
)


# --- ViewSets para CRUD de Gestión ---
class CompetenciaViewSet(viewsets.ModelViewSet):
    queryset = Competencia.objects.all()
    serializer_class = CompetenciaSerializer
    permission_classes = [IsAuthenticated]

    # ACCIÓN 1: CIERRE DE COMPETENCIA (POST)
    @action(detail=True, methods=['post'])
    def close_competition(self, request, pk=None):
        try:
            competencia = self.get_object()
        except Competencia.DoesNotExist:
            return Response({"detail": "Competencia no encontrada."}, status=404)

        if competencia.status == 'Finalizada':
            return Response({"detail": "La competencia ya está cerrada."}, status=400)

        competencia.status = 'Finalizada'
        competencia.save()
        
        return Response({"message": f"Competencia '{competencia.name}' finalizada y resultados oficializados."}, status=200)

    # ACCIÓN 2: GENERACIÓN DE REPORTE (GET)
    # ¡ESTA ES LA SECCIÓN CORREGIDA Y COMPLETADA!
    @action(detail=True, methods=['get'])
    def generate_report(self, request, pk=None):
        try:
            competencia = self.get_object()
        except Competencia.DoesNotExist:
            return Response({"detail": "Competencia no encontrada."}, status=404)

        if competencia.status != 'Finalizada':
            return Response({"detail": "Los resultados deben estar OFICIALIZADOS."}, status=400)

        # LÓGICA DE RANKING (Tu consulta original estaba perfecta)
        ranking_data = Resultado.objects.filter(
            inscripcion__competencia=competencia
        ).values(
            'inscripcion__deportista__first_name',
            'inscripcion__deportista__last_name',
            'inscripcion__club__name',
        ).annotate(
            total_score=Sum('puntaje')
        ).order_by('-total_score')
        
        # Configuración del PDF (ReportLab)
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Ranking_Oficial_{competencia.name}.pdf"'

        p = canvas.Canvas(response, pagesize=A4)
        width, height = A4
        
        # --- INICIO DE LÓGICA DE DIBUJO DE PDF ---
        
        # Definir márgenes y posición inicial
        margin = 0.75 * inch
        y = height - margin
        line_height = 20 # Espacio entre líneas

        # Título
        p.setFont("Helvetica-Bold", 16)
        p.drawCentredString(width / 2.0, y, f"RANKING OFICIAL: {competencia.name.upper()}")
        y -= (line_height * 2) # Bajar dos líneas

        # Encabezados de la tabla
        p.setFont("Helvetica-Bold", 10)
        p.drawString(margin, y, "POS.")
        p.drawString(margin + 50, y, "DEPORTISTA")
        p.drawString(margin + 250, y, "CLUB")
        p.drawString(width - margin - 80, y, "PUNTAJE FINAL")
        y -= line_height
        
        # Línea horizontal
        p.line(margin, y + (line_height / 2), width - margin, y + (line_height / 2))

        # Contenido de la tabla (Resultados)
        p.setFont("Helvetica", 10)
        for i, row in enumerate(ranking_data):
            pos = i + 1
            nombre = f"{row['inscripcion__deportista__first_name']} {row['inscripcion__deportista__last_name']}"
            club = row['inscripcion__club__name'] or 'N/A'
            score = str(row['total_score'])

            p.drawString(margin, y, str(pos))
            p.drawString(margin + 50, y, nombre)
            p.drawString(margin + 250, y, club)
            p.drawString(width - margin - 80, y, score) # Alineado a la derecha
            y -= line_height

            # Si nos quedamos sin espacio, crea una nueva página
            if y < margin:
                p.showPage() # Finaliza la página actual
                y = height - margin # Resetea 'y' al tope de la nueva página
                # (Opcional: podrías volver a dibujar los encabezados aquí)

        # --- FIN DE LÓGICA DE DIBUJO ---

        p.showPage() # Finaliza la última página
        p.save() # Guarda el PDF

        return response


class PoligonoViewSet(viewsets.ModelViewSet):
    queryset = Poligono.objects.all()
    serializer_class = PoligonoSerializer
    permission_classes = [IsAuthenticated]


class JuezViewSet(viewsets.ModelViewSet):
    queryset = Juez.objects.all()
    serializer_class = JuezSerializer
    permission_classes = [IsAuthenticated]


class ModalidadViewSet(viewsets.ModelViewSet):
    queryset = Modalidad.objects.all()
    serializer_class = ModalidadSerializer
    permission_classes = [IsAuthenticated]


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    permission_classes = [IsAuthenticated]


class InscripcionViewSet(viewsets.ModelViewSet):
    queryset = Inscripcion.objects.all()
    serializer_class = InscripcionSerializer
    permission_classes = [IsAuthenticated]

# CLASE QUE ESTABA CAUSANDO EL ERROR DE IMPORTACIÓN EN urls.py
class ResultadoViewSet(viewsets.ModelViewSet):
    queryset = Resultado.objects.all()
    serializer_class = ResultadoSerializer
    permission_classes = [IsAuthenticated]


# --- Vistas Específicas ---
class InscripcionCreateAPIView(generics.CreateAPIView):
    queryset = Inscripcion.objects.all()
    serializer_class = InscripcionCreateSerializer 
    permission_classes = [IsAuthenticated]


class ScoreSubmissionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # ¡CAMBIO AQUÍ! (Paso 8.C)
        # Añadimos context={'request': request}
        serializer = ScoreSubmissionSerializer(data=request.data, context={'request': request})
        
        serializer.is_valid(raise_exception=True)

        # ¡CAMBIO AQUÍ! (Paso 8.C)
        # Usamos serializer.save() que llama a .create() internamente
        resultado = serializer.save() 
        
        # Devolver el resultado
        return Response(ResultadoSerializer(resultado).data, status=200)