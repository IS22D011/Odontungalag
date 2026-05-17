import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# 1. Үндсэн замын тохиргоо (Хамгийн дээр байх ёстой)
BASE_DIR = Path(__file__).resolve().parent.parent

# 2. .env файлыг унших
load_dotenv(os.path.join(BASE_DIR, '.env'))

# 3. Нууцлал ба DEBUG горим
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key')
DEBUG = os.getenv('DEBUG') == 'True'
ALLOWED_HOSTS = ['192.168.144.53','192.168.144.53', 'localhost', '127.0.0.1', '*']


# 4. Програмын жагсаалт
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party
    'rest_framework',
    'rest_framework_simplejwt', 
    'corsheaders',
    'rest_framework_simplejwt.token_blacklist',
    'channels',

    # Local apps
    'apps.users',
    'apps.tasks',
    'apps.hr',
    'apps.chat',
    'apps.organizations',
    'apps.notifications',
]

ASGI_APPLICATION = 'back.asgi.application'

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer",
    },
}

# 5. Middleware тохиргоо
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.common.CommonMiddleware',
    
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# 6. Хэрэглэгчийн модел (Custom User)
AUTH_USER_MODEL = 'users.User'

# 7. Django REST Framework & JWT
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'ALGORITHM': 'HS256',
    'AUTH_HEADER_TYPES': ('Bearer',),
}

CORS_ALLOW_METHODS = [
    "DELETE",
    "GET",
    "OPTIONS",
    "PATCH",
    "POST",
    "PUT",
]

CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# 8. CORS тохиргоо
CORS_ALLOW_ALL_ORIGINS = True  # Хөгжүүлэлтийн үед True байлгана
CORS_ALLOW_CREDENTIALS = True

ROOT_URLCONF = 'back.urls'

# 9. Өгөгдлийн сан (Neon DB эсвэл PostgreSQL)
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': os.getenv('DB_NAME'),      
#         'USER': os.getenv('DB_USER'),      
#         'PASSWORD': os.getenv('DB_PASSWORD'),  
#         'HOST': os.getenv('DB_HOST'),      
#         'PORT': os.getenv('DB_PORT'),    
#         'CONN_MAX_AGE': 30,  
#         'OPTIONS': {
#             'sslmode': 'require',
#             # TCP Keepalive тохиргоог нэмэх:
#             'keepalives': 1,
#             'keepalives_idle': 30,
#             'keepalives_interval': 10,
#             'keepalives_count': 5,
#         },
#     }
# }

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'odkeDiplom',
        'USER': 'postgres',
        'PASSWORD': '1230',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# 10. Templates тохиргоо
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

# 11. Static болон Media файлууд (Зураг оруулахад чухал)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

CORS_ALLOWED_ORIGINS = [
    "http://localhost:19006", # React Native Web-ийн стандарт порт
    "http://127.0.0.1:19006",
    "http://localhost:8081",  # Metro-ийн шинэ порт
]

LANGUAGE_CODE = 'mn'
TIME_ZONE = 'Asia/Ulaanbaatar'
USE_I18N = True
USE_TZ = True