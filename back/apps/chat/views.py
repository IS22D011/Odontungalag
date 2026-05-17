from django.db import models # Q-г ашиглахын тулд нэмэв
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count

from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer
from apps.users.serializers import UserSerializer

User = get_user_model()

class ChatRoomListView(generics.ListAPIView):
    """ Нэвтэрсэн хэрэглэгчийн бүх чат өрөөнүүд """
    serializer_class = ChatRoomSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.request.user.chat_rooms.all().order_by('-created_at')

class MessageListView(APIView):
    """ Мессеж унших болон илгээх """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        # Хэрэглэгч тухайн өрөөний гишүүн эсэхийг шалгана
        room = get_object_or_404(ChatRoom, id=room_id, users=request.user)
        messages = Message.objects.filter(room=room).order_by('timestamp')
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id, users=request.user)
        text = request.data.get('text')
        if not text:
            return Response({"error": "Текст хоосон байна"}, status=status.HTTP_400_BAD_REQUEST)
            
        message = Message.objects.create(room=room, sender=request.user, text=text)
        # Serializer-т request-ийг context-оор дамжуулах нь илүү найдвартай
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)

class MessageDetailView(APIView):
    """ Мессеж засах/устгах (Зөвхөн өөрийнхөөг) """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, message_id):
        message = get_object_or_404(Message, id=message_id, sender=request.user)
        text = request.data.get('text')
        if text:
            message.text = text
            message.save()
            return Response(MessageSerializer(message).data)
        return Response({"error": "Текст хоосон байна"}, status=400)

    def delete(self, request, message_id):
        message = get_object_or_404(Message, id=message_id, sender=request.user)
        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ChatRoomMembersView(APIView):
    """ Группийн гишүүдийг удирдах """
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id, users=request.user)
        members = room.users.all()
        return Response(UserSerializer(members, many=True).data)

    def post(self, request, room_id):
        # 1. Өрөөг олох (Хүсэлт гаргагч өөрөө энэ өрөөний гишүүн байх ёстой)
        room = get_object_or_404(ChatRoom, id=room_id, users=request.user)
        
        # 2. Нэмэх гэж буй хэрэглэгчийг олох
        user_id = request.data.get('user_id')
        user_to_add = get_object_or_404(User, id=user_id)
        
        # 3. Шууд нэмэх (Админ эрх шалгахгүй)
        room.users.add(user_to_add)
        return Response({"status": "Success"}, status=status.HTTP_200_OK)
    
    def delete(self, request, room_id):
        room = get_object_or_404(ChatRoom, id=room_id)
        target_user_id = request.data.get('user_id', request.user.id)
        
        # Өөрөөсөө бусад хүнийг хасах гэж байгаа бол эрх шалгана
        if int(target_user_id) != request.user.id:
            if not room.has_management_permission(request.user):
                return Response({"error": "Танд гишүүн хасах эрх байхгүй"}, status=status.HTTP_403_FORBIDDEN)
        
        user_to_remove = get_object_or_404(User, id=target_user_id)
        room.users.remove(user_to_remove)
        
        # Админ өөрөө гарсан бол admins list-ээс хасна
        if room.admins.filter(id=user_to_remove.id).exists():
            room.admins.remove(user_to_remove)
            
        return Response({"status": "Removed"}, status=status.HTTP_200_OK)

class UserSearchView(generics.ListAPIView):
    serializer_class = UserSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('search', '')
        # Тухайн байгууллагын бүх хэрэглэгчийг авна (Өөрийгөө л хасна)
        queryset = User.objects.filter(organization=self.request.user.organization).exclude(id=self.request.user.id)
        
        if query:
            queryset = queryset.filter(
                models.Q(first_name__icontains=query) | 
                models.Q(last_name__icontains=query) |
                models.Q(username__icontains=query)
            )
        else:
            queryset = queryset[:20] # Хайлтын үггүй үед эхний 20 хүнийг харуулна

        return queryset

class CreatePrivateChatView(APIView):
    def post(self, request):
        target_user_id = request.data.get('user_id')
        current_user = request.user

        # 1. Хоёр хэрэглэгч хоёулаа байгаа, ГРУПП БИШ өрөөг хайх
        rooms = ChatRoom.objects.filter(
            is_group=False, 
            users=current_user
        ).filter(
            users__id=target_user_id
        ).annotate(user_count=Count('users')).filter(user_count=2)

        # 2. Хэрэв тийм өрөө байвал шууд тэр өрөөгөө буцаана
        if rooms.exists():
            return Response(ChatRoomSerializer(rooms.first()).data)

        # 3. Байхгүй бол шинээр хувийн өрөө үүсгэнэ
        from django.contrib.auth import get_user_model
        User = get_user_model()
        target_user = User.objects.get(id=target_user_id)

        # Хувийн өрөөний нэрийг хэрэглэгчдийн нэрээр үүсгэх
        new_room = ChatRoom.objects.create(
            name=f"{target_user.first_name}",
            is_group=False
        )
        new_room.users.add(current_user, target_user)
        
        return Response(ChatRoomSerializer(new_room).data, status=201)
        
class SendMessageView(MessageListView):
    pass


class PrivateChatCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_user_id = request.data.get('user_id')
        current_user = request.user

        if not target_user_id:
            return Response({"error": "user_id шаардлагатай"}, status=400)

        # 1. Тэр хүнтэй үүссэн 'хувийн' (is_group=False) өрөө байгаа эсэхийг хайх
        # Хоёр хэрэглэгч хоёулаа байгаа өрөөг шүүнэ
        rooms = ChatRoom.objects.filter(is_group=False, users=current_user).filter(users__id=target_user_id)
        
        # 2. Хэрэв өрөө олдвол шууд тэр өрөөгөө буцаана
        if rooms.exists():
            room = rooms.first()
            return Response(ChatRoomSerializer(room).data)

        # 3. Хэрэв байхгүй бол ШИНЭЭР ХУВИЙН ӨРӨӨ үүсгэнэ
        # Хувийн өрөөнд нэр өгөхдөө хэн хэний чат гэдгийг тодорхой болгох нь дээр
        from django.contrib.auth import get_user_model
        User = get_user_model()
        target_user = User.objects.get(id=target_user_id)

        new_room = ChatRoom.objects.create(
            name=f"{current_user.first_name}, {target_user.first_name}",
            is_group=False
        )
        new_room.users.add(current_user, target_user)
        
        return Response(ChatRoomSerializer(new_room).data)