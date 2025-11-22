from django.http import HttpResponse
from django.db.models import Sum, Count, F, Q
from django.contrib.auth.models import User, Group
from django.utils.crypto import get_random_string
from datetime import date
from collections import defaultdict
import os
from django.conf import settings

# ReportLab
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4, landscape, LETTER
from reportlab.lib.units import inch, mm
from reportlab.lib import colors

# DRF
from rest_framework import viewsets, generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

# Modelos
from .models import (
    Competencia, Modalidad, Categoria, Poligono, Juez, 
    Inscripcion, Resultado, Participacion, Record, CategoriaCompetencia, Gasto
)
from deportistas.models import Deportista, Arma, PrestamoArma
from clubs.models import Club

# Serializadores
from .serializers import (
    CompetenciaSerializer, ModalidadSerializer, CategoriaSerializer, 
    PoligonoSerializer, JuezSerializer, InscripcionSerializer, 
    InscripcionCreateSerializer, ScoreSubmissionSerializer, 
    ResultadoSerializer, GastoSerializer, CategoriaCompetenciaSerializer
)
from .reports import generar_pdf_ranking

# --- FUNCIÓN AUXILIAR: DIBUJAR LOGO ---
def draw_logo(canvas_obj, x, y, width, height):
    try:
        logo_path = os.path.join(settings.BASE_DIR, 'staticfiles', 'img', 'logo.png')
        if os.path.exists(logo_path):
            canvas_obj.drawImage(logo_path, x, y, width=width, height=height, mask='auto')
    except Exception as e:
        print(f"Error cargando logo: {e}")

# --- FUNCIÓN AUXILIAR: CÁLCULO DE RANKING (QUÓRUM) ---
def calcular_puntos_ranking(year):
    ranking_deportistas = defaultdict(lambda: defaultdict(lambda: {'puntaje_acumulado': 0, 'eventos': 0, 'nombre': '', 'club': '', 'apellidos': ''}))
    ranking_clubes = defaultdict(int)
    competencias = Competencia.objects.filter(status='Finalizada', start_date__year=year)

    for comp in competencias:
        modalidades = Modalidad.objects.filter(categorias__competencias=comp).distinct()
        for mod in modalidades:
            for cat in comp.categorias.filter(modalidad=mod):
                # FILTRO: Solo deportistas locales (NO invitados) suman puntos
                resultados = Resultado.objects.filter(
                    inscripcion__competencia=comp, 
                    inscripcion__participaciones__modalidad=mod, 
                    inscripcion__estado='APROBADA',
                    inscripcion__deportista__es_invitado=False,
                    es_descalificado=False
                ).select_related('inscripcion__deportista', 'inscripcion__club')
                
                scores_map = {} 
                for res in resultados:
                    insc_id = res.inscripcion.id
                    if insc_id not in scores_map: 
                        scores_map[insc_id] = {
                            'inscripcion': res.inscripcion, 
                            'total': 0,
                            'sort_key': 0
                        }
                    
                    scores_map[insc_id]['total'] += float(res.puntaje)
                    # Usar sort_key del JSON si existe (para FBI), sino el puntaje
                    if 'sort_key' in res.detalles_json:
                        scores_map[insc_id]['sort_key'] = float(res.detalles_json['sort_key'])
                    else:
                        scores_map[insc_id]['sort_key'] = float(res.puntaje)

                # Ordenar por la clave maestra de desempate
                lista_posiciones = sorted(scores_map.values(), key=lambda x: x['sort_key'], reverse=True)
                
                # Reglas de Quórum
                cantidad = len(lista_posiciones)
                top_validos = 0
                if cantidad == 2: top_validos = 1
                elif cantidad == 3: top_validos = 2
                elif cantidad >= 4: top_validos = 999 # Todos suman según tabla

                # Tabla de Puntos: 10, 7, 5, 4, 3, 2, 1...
                tabla_puntos = [10, 7, 5, 4, 3, 2]

                for i, datos in enumerate(lista_posiciones):
                    if i < top_validos:
                        dep = datos['inscripcion'].deportista
                        club = datos['inscripcion'].club
                        
                        # Puntos Deportista
                        puntos_dep = 1
                        if i < len(tabla_puntos): puntos_dep = tabla_puntos[i]
                        
                        entry = ranking_deportistas[mod.name][dep.id]
                        entry['nombre'] = dep.first_name
                        entry['apellidos'] = f"{dep.apellido_paterno} {dep.apellido_materno or ''}".strip()
                        entry['club'] = club.name if club else 'Sin Club'
                        entry['puntaje_acumulado'] += puntos_dep
                        entry['eventos'] += 1
                        
                        # Puntos Club (Solo Podio: 1 punto por medalla)
                        if i <= 2 and club: 
                            ranking_clubes[club.name] += 1
    return ranking_deportistas, ranking_clubes


# --- VIEWSETS DE GESTIÓN ---

class InscripcionViewSet(viewsets.ModelViewSet):
    queryset = Inscripcion.objects.all()
    serializer_class = InscripcionSerializer
    permission_classes = [IsAuthenticated]

    # ACCIÓN: IMPRIMIR RECIBO
    @action(detail=True, methods=['get'])
    def print_receipt(self, request, pk=None):
        try: inscripcion = self.get_object()
        except Inscripcion.DoesNotExist: return Response({"detail": "No encontrado"}, status=404)

        response = HttpResponse(content_type='application/pdf')
        filename = f"Recibo_{inscripcion.id}_{inscripcion.deportista.ci}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        c = canvas.Canvas(response, pagesize=A4); w, h = A4
        
        draw_logo(c, 1*inch, h - 1.5*inch, 1.2*inch, 1.2*inch)

        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(w/2, h - 1*inch, "RECIBO DE INGRESO")
        c.setFont("Helvetica", 10)
        c.drawCentredString(w/2, h - 1.3*inch, "Asociación Departamental de Tiro Deportivo")
        
        y = h - 2.5*inch; x = 1*inch
        c.setStrokeColor(colors.grey); c.rect(x-10, y-150, w-2*inch+20, 170, fill=0)
        
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x, y, f"Nro. Transacción: {inscripcion.id:06d}")
        c.drawRightString(w-x, y, f"Fecha: {date.today().strftime('%d/%m/%Y')}")
        y -= 30
        c.setFont("Helvetica", 11)
        c.drawString(x, y, f"Recibimos de: {inscripcion.deportista.first_name} {inscripcion.deportista.apellido_paterno}")
        y -= 20
        c.drawString(x, y, f"La suma de: {inscripcion.monto_pagado} Bolivianos")
        y -= 20
        c.drawString(x, y, f"Por concepto de: Inscripción a {inscripcion.competencia.name}")
        y -= 30
        c.setFont("Helvetica-Oblique", 10)
        c.drawString(x, y, f"Observaciones: {inscripcion.observaciones_pago or 'Ninguna'}")

        y -= 40; c.setFont("Helvetica-Bold", 11); c.drawString(x, y, "Detalle:"); y -= 20; c.setFont("Helvetica", 10)
        
        for part in inscripcion.participaciones.all():
            cat_name = part.categoria.name if part.categoria else part.modalidad.name
            c.drawString(x+20, y, f"• {cat_name}")
            c.drawRightString(w-x-20, y, f"{part.costo_cobrado} Bs")
            y -= 15
            
        y -= 10; c.line(x, y, w-x, y); y -= 20
        c.setFont("Helvetica-Bold", 12); c.drawString(x, y, "TOTAL PAGADO"); c.drawRightString(w-x, y, f"{inscripcion.monto_pagado} Bs")

        y_firma = 2*inch; c.line(x+20, y_firma, x+200, y_firma); c.drawString(x+50, y_firma-15, "Entregué Conforme")
        c.line(x+250, y_firma, x+450, y_firma); c.drawString(x+300, y_firma-15, "Recibí Conforme (Tesorería)")
        c.save()
        return response

class CompetenciaViewSet(viewsets.ModelViewSet):
    queryset = Competencia.objects.all()
    serializer_class = CompetenciaSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def close_competition(self, request, pk=None):
        competencia = self.get_object()
        if competencia.status == 'Finalizada': return Response({"detail": "Ya cerrada."}, status=400)
        competencia.status = 'Finalizada'; competencia.save(); return Response({"message": "Finalizada."}, status=200)

    @action(detail=True, methods=['get'])
    def generate_report(self, request, pk=None):
        competencia = self.get_object()
        # Este es el reporte simple para admin, el detallado está en frontend
        ranking_data = Resultado.objects.filter(inscripcion__competencia=competencia).values(
            'inscripcion__deportista__first_name','inscripcion__deportista__apellido_paterno','inscripcion__club__name'
        ).annotate(total_score=Sum('puntaje')).order_by('-total_score')
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Ranking_{competencia.id}.pdf"'
        generar_pdf_ranking(response, competencia, ranking_data)
        return response

    # --- RESULTADOS OFICIALES PARA LA WEB ---
    @action(detail=True, methods=['get'])
    def official_results(self, request, pk=None):
        competencia = self.get_object()
        pdf_url = competencia.resultados_pdf.url if competencia.resultados_pdf else None
        response_data = {'competencia': competencia.name, 'fecha': competencia.start_date, 'estado': competencia.status, 'pdf_url': pdf_url, 'modalidades': []}
        
        inscripciones = Inscripcion.objects.filter(competencia=competencia, estado='APROBADA')
        modalidades_activas = Modalidad.objects.filter(categorias__competencias=competencia).distinct()

        for modalidad in modalidades_activas:
            mod_data = {'nombre': modalidad.name, 'categorias': []}
            for categoria in competencia.categorias.filter(modalidad=modalidad):
                cat_data = {'nombre': categoria.name, 'resultados': []}
                resultados_temp = []
                for inscripcion in inscripciones:
                    participacion = inscripcion.participaciones.filter(modalidad=modalidad).first()
                    if participacion:
                        # Buscar resultado principal
                        res_obj = inscripcion.resultados.filter(ronda_o_serie__icontains="Final").first() or inscripcion.resultados.last()
                        total_score = inscripcion.resultados.aggregate(total=Sum('puntaje'))['total'] or 0
                        
                        if total_score > 0 or (res_obj and res_obj.es_descalificado):
                            # Extraer datos de desempate FBI
                            detalles = res_obj.detalles_json if res_obj else {}
                            match_percent = detalles.get('match_percent', '')
                            
                            # Calcular Sort Key para FBI
                            sort_key = float(total_score)
                            if "FBI" in modalidad.name.upper() and not res_obj.es_descalificado:
                                impactos = detalles.get('final_hits_5', 0)
                                tiempo_inv = 100 - float(detalles.get('tiempo_r1', 99.99))
                                sort_key = float(total_score) + (impactos * 0.01) + (tiempo_inv * 0.0001)

                            resultados_temp.append({
                                'id': res_obj.id if res_obj else 0,
                                'deportista': f"{inscripcion.deportista.first_name} {inscripcion.deportista.apellido_paterno}",
                                'club': inscripcion.club.name if inscripcion.club else 'Sin Club',
                                'es_invitado': inscripcion.deportista.es_invitado,
                                'origen': inscripcion.deportista.departamento_origen if inscripcion.deportista.es_invitado else inscripcion.club.name,
                                'arma': participacion.arma_utilizada.modelo if participacion.arma_utilizada else 'N/A',
                                'puntaje': 0 if res_obj and res_obj.es_descalificado else float(total_score),
                                'es_descalificado': res_obj.es_descalificado if res_obj else False,
                                'motivo_dq': res_obj.motivo_descalificacion if res_obj else '',
                                'extra_info': f"{match_percent}%" if match_percent else "",
                                'sort_key': -999 if res_obj and res_obj.es_descalificado else sort_key # DQ al final
                            })
                
                cat_data['resultados'] = sorted(resultados_temp, key=lambda x: x['sort_key'], reverse=True)
                if cat_data['resultados']: mod_data['categorias'].append(cat_data)
            if mod_data['categorias']: response_data['modalidades'].append(mod_data)
        return Response(response_data)

class ResultadoViewSet(viewsets.ModelViewSet):
    queryset = Resultado.objects.all()
    serializer_class = ResultadoSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def print_diploma(self, request, pk=None):
        resultado = self.get_object()
        if resultado.es_descalificado:
             return Response({"detail": "Deportista descalificado."}, 400)

        inscripcion = resultado.inscripcion
        deportista = f"{inscripcion.deportista.first_name} {inscripcion.deportista.apellido_paterno}"
        competencia = inscripcion.competencia.name
        fecha = inscripcion.competencia.start_date.strftime("%d de %B de %Y")
        part = inscripcion.participaciones.first()
        modalidad = part.modalidad.name if part else "Tiro Deportivo"
        categoria = part.categoria.name if part and part.categoria else "General"

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Diploma.pdf"'
        c = canvas.Canvas(response, pagesize=landscape(A4)); w, h = landscape(A4)
        
        c.setStrokeColorRGB(0.8, 0.6, 0.2); c.setLineWidth(5); c.rect(30, 30, w-60, h-60)
        draw_logo(c, w/2 - 50, h - 130, 100, 100)

        c.setFont("Times-Bold", 36); c.drawCentredString(w/2, h - 160, "DIPLOMA DE HONOR")
        c.setFont("Times-Roman", 16); c.drawCentredString(w/2, h - 200, "La Asociación Departamental de Tiro Deportivo")
        c.drawCentredString(w/2, h - 220, "Confiere el presente reconocimiento a:")
        
        c.setFont("Times-BoldItalic", 30); c.setFillColorRGB(0.1, 0.1, 0.5)
        c.drawCentredString(w/2, h - 270, deportista.upper()); c.setFillColorRGB(0, 0, 0)
        
        c.setFont("Times-Roman", 16)
        c.drawCentredString(w/2, h - 320, f"Por su participación en {modalidad.upper()} - {categoria.upper()}")
        c.drawCentredString(w/2, h - 345, f"Evento: {competencia}")
        c.setFont("Helvetica", 12); c.drawCentredString(w/2, 130, f"Cochabamba, {fecha}")
        
        y_firma = 60; c.line(w/4 - 50, y_firma, w/4 + 100, y_firma); c.drawString(w/4, y_firma - 15, "Presidente")
        c.line(w*0.75 - 100, y_firma, w*0.75 + 50, y_firma); c.drawString(w*0.75 - 30, y_firma - 15, "Director Técnico")
        c.showPage(); c.save()
        return response

class AnnualRankingView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        year = request.query_params.get('year', date.today().year)
        data_dep, _ = calcular_puntos_ranking(year)
        res = {'year': year, 'rankings_por_modalidad': []}
        for mod, dict_dep in data_dep.items():
            lst = [{'deportista': f"{d['nombre']} {d['apellidos']}", 'club': d['club'], 'puntaje_total': d['puntaje_acumulado'], 'eventos_disputados': d['eventos']} for d in dict_dep.values()]
            lst.sort(key=lambda x: x['puntaje_total'], reverse=True)
            for idx, item in enumerate(lst): item['posicion'] = idx + 1
            res['rankings_por_modalidad'].append({'modalidad': mod, 'ranking': lst})
        return Response(res)

class ClubRankingView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        year = request.query_params.get('year', date.today().year)
        _, data_clubes = calcular_puntos_ranking(year)
        lst = [{'club': n, 'puntos': p} for n, p in data_clubes.items()]
        lst.sort(key=lambda x: x['puntos'], reverse=True)
        for idx, item in enumerate(lst): item['posicion'] = idx + 1
        return Response(lst)

class DepartmentalRecordsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        recs = Record.objects.filter(es_actual=True, deportista__es_invitado=False).select_related('deportista', 'modalidad', 'categoria', 'competencia', 'antecesor').order_by('modalidad__name')
        data = []
        for r in recs:
            it = {'modalidad': r.modalidad.name, 'categoria': r.categoria.name, 'actual': {'deportista': f"{r.deportista.first_name} {r.deportista.apellido_paterno}", 'puntaje': r.puntaje, 'fecha': r.fecha_registro, 'competencia': r.competencia.name}, 'anterior': None}
            if r.antecesor: it['anterior'] = {'deportista': f"{r.antecesor.deportista.first_name} {r.antecesor.deportista.apellido_paterno}", 'puntaje': r.antecesor.puntaje}
            data.append(it)
        return Response(data)

class PoligonoViewSet(viewsets.ModelViewSet): queryset = Poligono.objects.all(); serializer_class = PoligonoSerializer; permission_classes = [IsAuthenticated]
class JuezViewSet(viewsets.ModelViewSet):
    queryset = Juez.objects.all(); serializer_class = JuezSerializer; permission_classes = [IsAuthenticated]
    @action(detail=True, methods=['post'])
    def create_access(self, request, pk=None):
        # (Lógica de crear acceso copiada anteriormente)
        return Response({"message": "Acceso generado"})
class ModalidadViewSet(viewsets.ModelViewSet): queryset = Modalidad.objects.all(); serializer_class = ModalidadSerializer; permission_classes = [IsAuthenticated]
class CategoriaViewSet(viewsets.ModelViewSet): queryset = Categoria.objects.all(); serializer_class = CategoriaSerializer; permission_classes = [IsAuthenticated]
class GastoViewSet(viewsets.ModelViewSet): queryset = Gasto.objects.all(); serializer_class = GastoSerializer; permission_classes = [IsAuthenticated]; perform_create = lambda self, s: s.save(registrado_por=self.request.user)

class InscripcionCreateAPIView(generics.CreateAPIView): queryset = Inscripcion.objects.all(); serializer_class = InscripcionCreateSerializer; permission_classes = [IsAuthenticated]
class ScoreSubmissionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, *args, **kwargs):
        serializer = ScoreSubmissionSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        resultado = serializer.save() 
        return Response(ResultadoSerializer(resultado).data, status=200)