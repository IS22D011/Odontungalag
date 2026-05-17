from django.urls import path
from .views import (
    ChatRoomListView, 
    MessageListView,  
    MessageDetailView, 
    ChatRoomMembersView, 
    UserSearchView, 
    CreatePrivateChatView
)

urlpatterns = [
    path('rooms/', ChatRoomListView.as_view(), name='chat-rooms'),
    path('rooms/private-create/', CreatePrivateChatView.as_view(), name='create-private-chat'),
    path('rooms/<int:room_id>/members/', ChatRoomMembersView.as_view(), name='room-members'),
    
    # SendMessageView-ийн оронд MessageListView-ийг ашиглана. 
    # Учир нь энэ View дотор GET (татах), POST (илгээх) хоёулаа байгаа.
    path('rooms/<int:room_id>/messages/', MessageListView.as_view(), name='room-messages'),
    path('rooms/<int:room_id>/send_message/', MessageListView.as_view(), name='send-message'), 
    
    path('messages/<int:message_id>/', MessageDetailView.as_view(), name='message-detail'),
    path('users/search/', UserSearchView.as_view(), name='user-search'),
]