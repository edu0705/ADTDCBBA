from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    DeportistaViewSet, DocumentoViewSet, ArmaViewSet, PrestamoArmaViewSet,
    DeportistaRegistrationAPIView, MiPerfilAPIView, 
    DeportistaStatsView, DeportistaCVView, PublicVerificationView # <-- Importar
)

router = DefaultRouter()
router.register(r'deportistas', DeportistaViewSet)
router.register(r'documentos', DocumentoViewSet)
router.register(r'armas', ArmaViewSet)
router.register(r'prestamos', PrestamoArmaViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', DeportistaRegistrationAPIView.as_view(), name='deportista-register'),
    path('mi-perfil/', MiPerfilAPIView.as_view(), name='mi-perfil'),
    path('stats/<int:pk>/', DeportistaStatsView.as_view(), name='stats-admin'),
    path('stats/me/', DeportistaStatsView.as_view(), name='stats-me'),
    path('cv/<int:pk>/', DeportistaCVView.as_view(), name='cv-download'),
    
    # --- RUTA DE VERIFICACIÓN PÚBLICA ---
    path('verify/', PublicVerificationView.as_view(), name='public-verify'),
]