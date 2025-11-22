from datetime import date, timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from competencias.models import Competencia
from deportistas.models import Deportista, Arma
from .serializers import UserInfoSerializer

class UserInfoAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        serializer = UserInfoSerializer(request.user)
        return Response(serializer.data)

class UserNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        notifications = []
        today = date.today()
        warning_date = today + timedelta(days=90) # 3 MESES

        # COMPETENCIAS
        proximas = Competencia.objects.filter(status='Próxima', start_date__gte=today).order_by('start_date')
        for comp in proximas:
            notifications.append({'id': f'new-{comp.id}', 'type': 'info', 'title': 'Nueva Competencia', 'message': f"{comp.name} el {comp.start_date}.", 'link': '/admin/competencias'})
        
        recent_final = Competencia.objects.filter(status='Finalizada', end_date__gte=today-timedelta(days=3))
        for comp in recent_final:
             notifications.append({'id': f'res-{comp.id}', 'type': 'success', 'title': 'Resultados Publicados', 'message': f"Ya puedes ver los resultados de {comp.name}.", 'link': f'/admin/resultados/{comp.id}'})

        # ALERTAS PERSONALES
        deps = []
        if hasattr(user, 'club'): deps = Deportista.objects.filter(club=user.club)
        elif hasattr(user, 'deportista'): deps = [user.deportista]

        for dep in deps:
            # A. Licencia B
            licencia = dep.documentos.filter(document_type='Licencia B').order_by('-expiration_date').first()
            if licencia and licencia.expiration_date:
                if licencia.expiration_date < today:
                    notifications.append({'id': f'lic-exp-{dep.id}', 'type': 'danger', 'title': 'Licencia Vencida', 'message': f"{dep.first_name}: Licencia caducada. Solo Aire permitido.", 'link': '/mi-perfil'})
                elif licencia.expiration_date <= warning_date:
                    notifications.append({'id': f'lic-warn-{dep.id}', 'type': 'warning', 'title': 'Renovar Licencia', 'message': f"{dep.first_name}: Vence el {licencia.expiration_date}.", 'link': '/mi-perfil'})

            # B. Inspección Armas (Solo Fuego)
            armas = Arma.objects.filter(deportista=dep, es_aire_comprimido=False)
            for arma in armas:
                if arma.fecha_inspeccion:
                    if arma.fecha_inspeccion < today:
                        notifications.append({'id': f'arma-exp-{arma.id}', 'type': 'danger', 'title': 'Inspección Vencida', 'message': f"{arma.marca}: Inspección requerida.", 'link': '/mi-perfil'})
                    elif arma.fecha_inspeccion <= warning_date:
                        notifications.append({'id': f'arma-warn-{arma.id}', 'type': 'warning', 'title': 'Próxima Inspección', 'message': f"{arma.marca}: Vence el {arma.fecha_inspeccion}.", 'link': '/mi-perfil'})

        return Response(notifications)