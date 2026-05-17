from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Өрөөний нэрээр WebSocket холболт үүсгэх зам
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]