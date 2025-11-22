import os
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- 1. SEGURIDAD ---
# Lee del .env o usa valores por defecto inseguros (SOLO para local)
SECRET_KEY = config('SECRET_KEY', default='django-insecure-clave-local-super-secreta')
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=Csv())

# Application definition
INSTALLED_APPS = [
    'daphne', # <--- IMPORTANTE: Debe ir primero para WebSockets (ASGI)
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Terceros
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    'channels', 
    'drf_spectacular', # Documentación API
    
    # Mis Apps
    'users',
    'clubs',
    'deportistas',
    'competencias',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Servir estáticos optimizados
    'corsheaders.middleware.CorsMiddleware', # CORS (Conexión con React)
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'adtdcbba_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'adtdcbba_backend.wsgi.application'
ASGI_APPLICATION = 'adtdcbba_backend.asgi.application'


# --- 2. BASE DE DATOS HÍBRIDA ---
# Si existe DATABASE_URL (Render/Nube), usa Postgres.
# Si NO existe (Tu PC), crea automáticamente un archivo db.sqlite3
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600
    )
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]


# Internationalization
LANGUAGE_CODE = 'es-bo'
TIME_ZONE = 'America/La_Paz'
USE_I18N = True
USE_TZ = True


# --- ARCHIVOS ESTÁTICOS Y MEDIA ---
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Usamos Whitenoise para servir estáticos. 
# En local a veces da problemas si no se ejecuta collectstatic, 
# pero esta configuración es la estándar para producción.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- 3. CONFIGURACIÓN CORS (React) ---
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Aquí agregarás la URL de Vercel cuando despliegues el frontend
    # Ej: "https://mi-app-tiro.vercel.app"
]

# Si defines una URL de producción en el .env, la agrega automáticamente
if config('CORS_ALLOWED_ORIGIN_PROD', default=None):
    CORS_ALLOWED_ORIGINS.append(config('CORS_ALLOWED_ORIGIN_PROD'))

CORS_ALLOW_ALL_ORIGINS = False # Seguridad: Solo permitir orígenes listados

# --- REST FRAMEWORK & SWAGGER ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'API de Tiro Deportivo',
    'DESCRIPTION': 'Sistema de gestión de competencias y puntajes en tiempo real',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# --- JWT (Tokens) ---
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
}

# --- 4. WEBSOCKETS HÍBRIDOS (Channels) ---
# Si existe REDIS_URL (Nube/Render), usa Redis para escalar.
# Si NO existe (Tu PC), usa la Memoria RAM (InMemory) para desarrollo fácil.
if config('REDIS_URL', default=None):
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels_redis.core.RedisChannelLayer',
            'CONFIG': {
                "hosts": [config('REDIS_URL')],
            },
        },
    }
else:
    CHANNEL_LAYERS = {
        "default": {
            "BACKEND": "channels.layers.InMemoryChannelLayer"
        }
    }