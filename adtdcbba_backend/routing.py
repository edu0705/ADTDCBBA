# adtdcbba_backend/routing.py
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from competencias.consumers import ResultadoConsumer # Importa el Consumer

websocket_urlpatterns = [
    # La ruta que conecta el frontend con el consumidor de Django Channels
    path('ws/competencia/<int:competencia_id>/', ResultadoConsumer.as_asgi()), 
]