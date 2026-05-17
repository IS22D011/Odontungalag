import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Message, ChatRoom
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Өрөөнд нэгдэх
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Өрөөнөөс гарах
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_text = data.get('message')
        email = data.get('email') # Эсвэл user_id
        room_id = data.get('room_id')

        # Мессежийг DB-д хадгалах
        await self.save_message(email, room_id, message_text)

        # Өрөөнд байгаа бүх хүмүүст мессежийг илгээх
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message_text,
                'sender': email
            }
        )

    async def chat_message(self, event):
        # WebSocket-ээр дамжуулан клиент рүү илгээх
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender']
        }))

    @sync_to_async
    def save_message(self, email, room_id, text):
        user = User.objects.get(email=email)
        room = ChatRoom.objects.get(id=room_id)
        return Message.objects.create(sender=user, room=room, text=text)