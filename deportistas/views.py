from rest_framework import viewsets, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny # AllowAny para verificación
from rest_framework.decorators import action 
from django.contrib.auth.models import User, Group 
from django.http import HttpResponse
from django.db.models import Avg, Max, Count, Q
from django.conf import settings
import os
from datetime import date

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch, mm

from .models import Deportista, Documento, Arma, PrestamoArma
from competencias.models import Resultado, Record, Competencia, Participacion
from .serializers import DeportistaSerializer, DeportistaRegistrationSerializer, DocumentoSerializer, ArmaSerializer, PrestamoArmaSerializer

def draw_logo(canvas_obj, x, y, width, height):
    try:
        logo_path = os.path.join(settings.BASE_DIR, 'staticfiles', 'img', 'logo.png')
        if os.path.exists(logo_path): canvas_obj.drawImage(logo_path, x, y, width=width, height=height, mask='auto')
    except: pass

# --- API DE VERIFICACIÓN PÚBLICA (REAFUC) ---
class PublicVerificationView(APIView):
    permission_classes = [AllowAny] # Abierto al público

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        tipo = request.query_params.get('type', 'deportista')

        if not query: return Response({"detail": "Ingrese código de búsqueda."}, status=400)
        data = {}

        # 1. DEPORTISTA
        if tipo == 'deportista':
            dep = Deportista.objects.filter(Q(codigo_unico__iexact=query) | Q(ci__iexact=query)).first()
            if not dep: return Response({"detail": "Deportista no encontrado."}, status=404)

            licencia = dep.documentos.filter(document_type='Licencia B').order_by('-id').first()
            participaciones = Resultado.objects.filter(inscripcion__deportista=dep).order_by('-fecha_registro')
            historial = [{'fecha': p.inscripcion.competencia.start_date, 'evento': p.inscripcion.competencia.name, 'modalidad': p.inscripcion.participaciones.first().modalidad.name, 'puntaje': p.puntaje} for p in participaciones]

            data = {
                'valido': True,
                'nombre': f"{dep.first_name} {dep.apellido_paterno} {dep.apellido_materno or ''}",
                'ci': dep.ci,
                'codigo_unico': dep.codigo_unico,
                'club': dep.club.name if dep.club else "Particular",
                'estado': dep.status,
                'licencia_b_vencimiento': licencia.expiration_date if licencia else "NO REGISTRADA",
                'foto_url': dep.foto_path.url if dep.foto_path else None,
                'historial': historial,
                'total_participaciones': len(historial)
            }

        # 2. ARMA
        elif tipo == 'arma':
            arma = Arma.objects.filter(numero_matricula__iexact=query).first()
            if not arma: return Response({"detail": "Arma no registrada."}, status=404)
            
            usos = Participacion.objects.filter(arma_utilizada=arma).order_by('-inscripcion__competencia__start_date')
            actividad = [{'fecha': u.inscripcion.competencia.start_date, 'evento': u.inscripcion.competencia.name} for u in usos]

            data = {
                'valido': True,
                'matricula': arma.numero_matricula,
                'marca_modelo': f"{arma.marca} {arma.modelo}",
                'calibre': arma.calibre,
                'propietario': f"{arma.deportista.first_name} {arma.deportista.apellido_paterno}",
                'ci_propietario': arma.deportista.ci,
                'fecha_inspeccion': arma.fecha_inspeccion,
                'actividad_reciente': actividad
            }

        # 3. CERTIFICADO
        elif tipo == 'certificado':
            res = Resultado.objects.filter(codigo_verificacion=query).first()
            if not res: return Response({"detail": "Código de certificado inválido."}, 404)
            ins = res.inscripcion
            part = ins.participaciones.first()
            data = {
                'valido': True,
                'tipo': 'CERTIFICADO OFICIAL',
                'deportista': f"{ins.deportista.first_name} {ins.deportista.apellido_paterno}",
                'competencia': ins.competencia.name,
                'fecha': ins.competencia.start_date,
                'modalidad': part.modalidad.name,
                'puntaje': res.puntaje
            }

        return Response(data)

# --- RESTO DE VISTAS (DeportistaViewSet, Stats, CV, etc.) ---
# (Mantén el código que ya tenías para DeportistaViewSet, StatsView, CVView, etc. de la respuesta anterior)
# Solo asegúrate de agregar PublicVerificationView al archivo.
class DeportistaViewSet(viewsets.ModelViewSet):
    queryset = Deportista.objects.all(); serializer_class = DeportistaSerializer; permission_classes = [IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.groups.filter(name__in=['Presidente', 'Tesorero']).exists(): return Deportista.objects.all()
        try: 
            if user.groups.filter(name='Club').exists(): return Deportista.objects.filter(club__user=user)
        except: pass
        return Deportista.objects.none()

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        # ... (Lógica de aprobación y creación de usuario igual que antes) ...
        return Response({"message": "Aprobado"})

    @action(detail=True, methods=['get'])
    def print_carnet(self, request, pk=None):
        # ... (Lógica de carnet igual que antes) ...
        return HttpResponse()

class DocumentoViewSet(viewsets.ModelViewSet): queryset = Documento.objects.all(); serializer_class = DocumentoSerializer; permission_classes = [IsAuthenticated]
class ArmaViewSet(viewsets.ModelViewSet): queryset = Arma.objects.all(); serializer_class = ArmaSerializer; permission_classes = [IsAuthenticated]; filter_backends = [filters.SearchFilter]; search_fields = ['marca', 'modelo', 'numero_matricula']
class PrestamoArmaViewSet(viewsets.ModelViewSet): queryset = PrestamoArma.objects.all(); serializer_class = PrestamoArmaSerializer; permission_classes = [IsAuthenticated]
class DeportistaRegistrationAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request): 
        serializer = DeportistaRegistrationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid(): serializer.save(); return Response({"message": "Registrado"}, 201)
        return Response(serializer.errors, 400)
class MiPerfilAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        try: return Response(DeportistaSerializer(request.user.deportista).data)
        except: return Response({"detail": "Sin perfil"}, 404)
class DeportistaStatsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk=None): return Response({}) # Placeholder, usar la lógica completa que te pasé antes
class DeportistaCVView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, pk=None): return HttpResponse() # Placeholder