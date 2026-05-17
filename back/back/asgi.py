import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'back.settings')
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import apps.chat.routing  # chat апп дотор routing.py үүсгэсэн байх ёстой

application = ProtocolTypeRouter({
    # Ердийн HTTP API хүсэлтүүд
    "http": get_asgi_application(),
    
    # WebSocket (Чат) холболтууд
    "websocket": AuthMiddlewareStack(
        URLRouter(
            apps.chat.routing.websocket_urlpatterns
        )
    ),
})