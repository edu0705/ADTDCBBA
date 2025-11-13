import os
from pathlib import Path
from datetime import timedelta
from decouple import config  # <-- Importado para leer el .env
import dj_database_url      # <-- Importado para la DB de producción

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: Lee la clave desde .env
SECRET_KEY = config('SECRET_KEY')

# SECURITY WARNING: Lee DEBUG desde .env (False en producción)
DEBUG = config('DEBUG', default=False, cast=bool)

# MODIFICADO PARA PRODUCCIÓN (Render)
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    config('RENDER_EXTERNAL_HOSTNAME', default=''), # URL de Render
]


# Application definition
INSTALLED_APPS = [
    'daphne', # <-- AÑADIDO: Debe ser la primera app
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
    'channels', # Para WebSockets
    
    # Mis Apps
    'users',
    'clubs',
    'deportistas',
    'competencias',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    # AÑADIDO: Para servir archivos estáticos del Admin en producción
    'whitenoise.middleware.WhiteNoiseMiddleware', 
    'corsheaders.middleware.CorsMiddleware', # Debe estar aquí para CORS
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


# Database
# MODIFICADO PARA PRODUCCIÓN (Render)
# Lee la URL de la base de datos desde las variables de entorno
DATABASES = {
    'default': dj_database_url.config(
        # Lee la variable 'DATABASE_URL' (de Render o del .env)
        default=config('DATABASE_URL'), 
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
LANGUAGE_CODE = 'es-bo' # Usamos español de Bolivia
TIME_ZONE = 'America/La_Paz'
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
# MODIFICADO PARA PRODUCCIÓN

# 1. Configuración de Archivos Estáticos del ADMIN
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles' 
# AÑADIDO: Storage para producción
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# 2. Configuración de Archivos Multimedia (Subidos por el Usuario)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- CONFIGURACIÓN DE TERCEROS ---

# CORS (Comunicación con React)
# MODIFICADO PARA PRODUCCIÓN
CORS_ALLOWED_ORIGINS = [
    # Lee la URL de tu frontend (de Render o del .env)
    config('CORS_ALLOWED_ORIGIN_PROD', default='http://localhost:3000'), 
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://localhost:8001",
    # (Si RENDER_EXTERNAL_HOSTNAME está configurada, la añade)
    config('RENDER_EXTERNAL_HOSTNAME', default=''), 
]
CORS_ALLOW_ALL_ORIGINS = False # <-- MODIFICADO por seguridad

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
}


# ASGI (Configuración de WebSockets/Django Channels)
ASGI_APPLICATION = 'adtdcbba_backend.asgi.application'

# MODIFICADO PARA PRODUCCIÓN (Render)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            # Lee la URL de tu servicio Redis (de Render o del .env)
            "hosts": [config('REDIS_URL', default='redis://localhost:6379')],
        },
    },
}