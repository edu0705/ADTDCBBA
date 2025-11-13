# deportistas/urls.py
from rest_framework.routers import DefaultRouter
from django.urls import path, include
# ¡Añadimos MiPerfilAPIView a las importaciones!
from .views import DeportistaViewSet, ArmaViewSet, DeportistaRegistrationAPIView, MiPerfilAPIView

router = DefaultRouter()
router.register(r'deportistas', DeportistaViewSet, basename='deportista')
router.register(r'armas', ArmaViewSet, basename='arma')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', DeportistaRegistrationAPIView.as_view(), name='deportista-register'),
    
    # ¡NUEVA RUTA AÑADIDA!
    path('mi-perfil/', MiPerfilAPIView.as_view(), name='mi-perfil'),
]