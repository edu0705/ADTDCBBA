# adtdcbba_backend/asgi.py
import os
from django.core.asgi import get_asgi_application

# 1. Establece la variable de entorno de settings PRIMERO.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adtdcbba_backend.settings')

# 2. Llama a get_asgi_application(). 
# ESTA ES LA LÍNEA QUE INICIALIZA DJANGO y carga todas las apps.
# (Esto también incluye las rutas de /media/ y /static/ 
# que ya están en tu urls.py)
django_asgi_app = get_asgi_application()

# 3. AHORA que Django está cargado, es seguro importar
#    nuestro middleware y el enrutamiento de Channels.
from channels.routing import ProtocolTypeRouter, URLRouter
from adtdcbba_backend.routing import websocket_urlpatterns
from .middleware import TokenAuthMiddleware 

# 4. Construye la aplicación principal
application = ProtocolTypeRouter({
    "http": django_asgi_app, # La app HTTP de Django se encarga de TODO (API y archivos)
    
    "websocket": TokenAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})