from rest_framework import viewsets, permissions, views, status, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import User, VerificationCode
from .serializers import (
    UserSerializer, 
    DepartmentSerializer, 
    RegisterSerializer, 
    LoginSerializer, 
    ChangePasswordSerializer, AcceptInviteRegisterSerializer, InvitationSerializer
)
from rest_framework.parsers import MultiPartParser, FormParser
from django.contrib.auth.tokens import default_token_generator 
from .serializers import OrganizationRegisterSerializer 
from .utils import send_verification_email
from django.utils.crypto import get_random_string
from django.utils import timezone
from apps.organizations.models import Organization, Invitation, Department


User = get_user_model()

# class UserViewSet(viewsets.ModelViewSet):
#     """
#     Ажилчдын жагсаалт харах, засах болон 'me' endpoint
#     """
#     queryset = User.objects.all()
#     serializer_class = UserSerializer
#     permission_classes = [permissions.IsAuthenticated]

#     @action(detail=False, methods=['get'])
#     def me(self, request):
#         """Нэвтэрсэн байгаа хэрэглэгчийн мэдээллийг авах"""
#         serializer = self.get_serializer(request.user)
#         return Response(serializer.data)

class DepartmentViewSet(viewsets.ModelViewSet):
    """
    Хэлтсийн мэдээлэл удирдах
    """
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            # 1. Хэрэглэгчийг идэвхгүйгээр үүсгэх
            user = serializer.save()
            user.is_active = False
            user.save()

            # 2. 6 оронтой код үүсгэж хадгалах
            code = get_random_string(length=6, allowed_chars='0123456789')
            VerificationCode.objects.update_or_create(
                user=user, 
                defaults={'code': code, 'created_at': timezone.now()}
            )

            # 3. Имэйл илгээх
            email_body = f"""
            <html>
                <body>
                    <h2>Сайн байна уу, {user.first_name}!</h2>
                    <p>Таны бүртгэл баталгаажуулах код: <b style="font-size: 20px;">{code}</b></p>
                    <p>Энэ код 10 минутын дараа хүчингүй болно.</p>
                </body>
            </html>
            """
            send_verification_email(user.email, "Бүртгэл баталгаажуулах", email_body)

            return Response({
                "message": "Бүртгэл амжилттай. Баталгаажуулах кодыг имэйлээр илгээлээ.",
                "email": user.email
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user.role
                }
            }, status=status.HTTP_200_OK)
        
        # Хэрэв дата буруу бол энд яг ямар алдаа байгааг (Имэйл бүртгэлгүй эсвэл Нууц үг буруу) илгээнэ
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    # Зураг (File) болон Text датаг зэрэг хүлээн авахын тулд заавал байх ёстой
    parser_classes = (MultiPartParser, FormParser)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        """
        Нэвтэрсэн хэрэглэгчийн мэдээллийг авах (GET) болон засах (PATCH)
        URL: /api/users/me/
        """
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            # partial=True нь хэрэглэгч заавал бүх талбарыг явуулах албагүйг заана
            # Жишээ нь: зөвхөн зургаа явуулж болно.
            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Профайл амжилттай шинэчлэгдлээ",
                    "user": serializer.data
                }, status=status.HTTP_200_OK)
            
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get_queryset(self):
        """Зөвхөн өөрийн байгууллагын ажилчдыг харах"""
        return User.objects.filter(organization=self.request.user.organization).exclude(role='display')
    
      
class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist() # Токеныг хүчингүй болгох
            return Response({"message": "Амжилттай гарлаа."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({"error": "Токен буруу байна."}, status=status.HTTP_400_BAD_REQUEST)
        

class ChangePasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"message": "Нууц үг амжилттай солигдлоо."}, status=status.HTTP_200_OK)
    


class ResetPasswordRequestView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        if user:
            # Сэргээх токен үүсгэх
            token = default_token_generator.make_token(user)
            # Бодит амьдрал дээр энд ИМЭЙЛ илгээх функц дуудагдана.
            # Одоохондоо зөвхөн терминал дээр токеныг хэвлэж харуулъя.
            print(f"Reset Token for {user.email}: {token}")
            return Response({"message": "Нууц үг сэргээх зааврыг имэйл хаяг руу илгээлээ."}, status=status.HTTP_200_OK)
        return Response({"error": "Хэрэглэгч олдсонгүй."}, status=status.HTTP_404_NOT_FOUND)
    


class InviteEmployeeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Зөвхөн Админ эсвэл HR (менежер) урилга илгээх эрхтэй гэж үзвэл
        if request.user.role not in ['admin', 'manager']:
            return Response({"error": "Урилга илгээх эрхгүй байна."}, status=403)
        
        serializer = InvitationSerializer(data=request.data)
        if serializer.is_valid():
            # invitation хадгалахдаа тухайн админы байгууллагыг онооно
            invitation = serializer.save(
                organization=request.user.organization
            )
            
            invite_url = f"http://localhost:3000/accept-invite?token={invitation.token}"
            email_body = f"""
                <h3>Сайн байна уу?</h3>
                <p>Танд <b>{request.user.organization.name}</b>-аас урилга ирлээ.</p>
                <p>Роль: {invitation.role}</p>
                <p>Доорх линкээр орж нууц үгээ тохируулан нэгдэнэ үү:</p>
                <a href="{invite_url}">Нэгдэх</a>
            """
            send_verification_email(invitation.email, "Байгууллагын урилга", email_body)
            return Response({"message": "Урилга илгээгдлээ."}, status=201)
        
        return Response(serializer.errors, status=400)

class AcceptInviteView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AcceptInviteRegisterSerializer(data=request.data)
        if serializer.is_valid():
            # Serializer-ийн create() дотор урилгын мэдээллийг уншиж User үүсгэж байгаа
            user = serializer.save() 
            return Response({"message": "Амжилттай бүртгэгдлээ. Одоо нэвтэрнэ үү."}, status=201)
        print("!!! ACCEPT INVITE ERROR:", serializer.errors)
        return Response(serializer.errors, status=400)
    
class RegisterOrganizationView(generics.CreateAPIView):
    """
    Шинэ байгууллага болон түүний админ хэрэглэгчийг бүртгэх + OTP хадгалах + Имэйл илгээх
    """
    serializer_class = OrganizationRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # 1. Хэрэглэгч болон Байгууллагыг хадгалах (Serializer-ийн create ажиллана)
            user = serializer.save()
            user.is_active = False  # OTP баталгаажуулах хүртэл нэвтрэх боломжгүй
            user.save()

            # 2. Баталгаажуулах код (OTP) үүсгэх
            code = get_random_string(length=6, allowed_chars='0123456789')
            
            # 3. OTP-г датабаазад хадгалах (ЧУХАЛ ХЭСЭГ)
            # Хэрэв энэ хэрэглэгчид өмнө нь код байсан бол шинэчилнэ (update_or_create)
            VerificationCode.objects.update_or_create(
                user=user, 
                defaults={
                    'code': code, 
                    'created_at': timezone.now()
                }
            )

            # 4. Имэйл илгээх логик
            email_body = f"""
            <html>
                <body style="font-family: Arial, sans-serif;">
                    <h2 style="color: #2c3e50;">Сайн байна уу, {user.first_name if user.first_name else user.username}!</h2>
                    <p>Танай байгууллагыг системд амжилттай бүртгэлээ.</p>
                    <p>Байгууллагын бүртгэл баталгаажуулах код: <strong style="font-size: 20px; color: #e74c3c;">{code}</strong></p>
                    <p>Энэхүү код нь 10 минутын дараа хүчингүй болохыг анхаарна уу.</p>
                </body>
            </html>
            """
            
            email_sent = send_verification_email(user.email, "Байгууллагын бүртгэл баталгаажуулах", email_body)

            # 5. JWT Токен үүсгэх (Сонголтоор: бүртгүүлсэн даруйд нь токен өгч болно)
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "Байгууллага амжилттай бүртгэгдлээ. Баталгаажуулах код имэйлээр илгээв.",
                "email_status": "Sent" if email_sent else "Failed (Check server console)",
                "user": user.email,
                "organization": user.organization.name if user.organization else "N/A",
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_201_CREATED)
            
        else:
            # Алдаа гарвал терминал дээр хэвлэж харуулах (Debug хийхэд хялбар)
            print("Serializer Errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class VerifyOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "Хэрэглэгч олдсонгүй."}, status=404)

        verify_obj = VerificationCode.objects.filter(user=user, code=code).first()
        if verify_obj and not verify_obj.is_expired():
            user.is_active = True
            user.save()
            verify_obj.delete()
            return Response({"message": "Амжилттай баталгаажлаа."}, status=200)
        
        return Response({"error": "Код буруу эсвэл хугацаа дууссан."}, status=400)   


class ResendOTPView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "Имэйл хаяг шаардлагатай."}, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "Хэрэглэгч олдсонгүй."}, status=404)

        if user.is_active:
            return Response({"message": "Энэ бүртгэл хэдийн идэвхжсэн байна."}, status=400)

        # 1. Шинэ код үүсгэх
        code = get_random_string(length=6, allowed_chars='0123456789')

        # 2. Датабааз дахь кодыг шинэчлэх (эсвэл шинээр үүсгэх)
        VerificationCode.objects.update_or_create(
            user=user,
            defaults={'code': code, 'created_at': timezone.now()}
        )

        # 3. Имэйл дахин илгээх
        email_body = f"Таны шинэ баталгаажуулах код: {code}"
        send_verification_email(user.email, "Шинэ баталгаажуулах код", email_body)

        return Response({"message": "Шинэ кодыг таны имэйл рүү илгээлээ."}, status=200)
    

class CreateDisplayUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        # Зөвхөн админ хүн дисплей үүсгэх эрхтэй
        if request.user.role != 'admin':
            return Response({"error": "Зөвхөн админ дисплей үүсгэх эрхтэй"}, status=403)
        
        org = request.user.organization
        # Имэйлийг автоматаар үүсгэх (Жишээ нь: display_unitel_1@myapp.com)
        display_email = f"display_{org.id}_{get_random_string(4).lower()}@kiosk.internal"
        display_password = get_random_string(12) # Санамсаргүй нууц үг

        user = User.objects.create(
            username=display_email, # Django-д username заавал байх ёстой
            email=display_email,
            organization=org,
            role='display',
            is_active=True # Дэлгэцийн хувьд шууд True байх нь зөв
        )
        user.set_password(display_password) # Нууц үгийг Hash хийх
        user.save()
    
        return Response({
            "message": "Display амжилттай үүсгэгдлээ",
            "display_account": {
                "email": display_email,
                "password": display_password, 
                "role": "display"
            }
        }, status=201)
      
class ListDisplayUsersView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        displays = User.objects.filter(
            organization=request.user.organization, 
            role='display'
        ).values('id', 'email', 'username', 'date_joined')
        return Response(displays)

class ResetDisplayPasswordView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            display_user = User.objects.get(pk=pk, role='display', organization=request.user.organization)
            new_password = get_random_string(12)
            display_user.set_password(new_password)
            display_user.save()
            
            # Энэ JSON хариу маш чухал:
            return Response({
                "email": display_user.email,
                "new_password": new_password  
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"detail": "Олдсонгүй"}, status=404)