# adtdcbba_backend/middleware.py
import jwt
from django.conf import settings
from django.contrib.auth.models import User, AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs

@database_sync_to_async
def get_user(token_key):
    """
    Obtiene el usuario de la base de datos de forma asíncrona
    basado en el token JWT.
    """
    try:
        # Decodifica el token (simplejwt usa la SECRET_KEY)
        payload = jwt.decode(token_key, settings.SECRET_KEY, algorithms=["HS256"])
        user = User.objects.get(id=payload['user_id'])
        return user
    except (jwt.ExpiredSignatureError, jwt.exceptions.DecodeError, User.DoesNotExist):
        # Si el token es inválido o el usuario no existe, devuelve Anónimo.
        return AnonymousUser()

class TokenAuthMiddleware(BaseMiddleware):
    """
    Middleware de autenticación de Django Channels que lee un token
    desde los query parameters de la URL.
    """
    async def __call__(self, scope, receive, send):
        # Busca el token en la URL (ej: ws://.../?token=...)
        query_string = scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            # Si hay token, obtiene el usuario y lo guarda en el 'scope'
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()

        # Continúa con la conexión
        return await super().__call__(scope, receive, send)