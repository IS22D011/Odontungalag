from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from django.db import transaction
from .models import Organization, Department, Team, Invitation
from .serializers import DepartmentSerializer, TeamSerializer, InvitationSerializer
from apps.users.utils import send_verification_email
from django.contrib.auth import get_user_model

class IsAdminOrManager(permissions.BasePermission):
    """Зөвхөн Админ эсвэл Менежер хандах эрх"""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'manager']

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Department.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class TeamViewSet(viewsets.ModelViewSet):
    serializer_class = TeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Team.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class InviteEmployeeView(views.APIView):
    permission_classes = [IsAdminOrManager]

    def post(self, request):
        serializer = InvitationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            dept = serializer.validated_data.get('department')

            # 1. Тухайн имэйлтэй хэрэглэгч системд аль хэдийн байгаа эсэхийг шалгах
            from django.contrib.auth import get_user_model
            if get_user_model().objects.filter(email=email).exists():
                return Response({"error": "Энэ ажилтан системд бүртгэлтэй байна."}, status=400)

            # 2. Сонгосон хэлтэс нь тухайн Админы байгууллагынх мөн эсэхийг шалгах
            if dept and dept.organization != request.user.organization:
                return Response({"error": "Буруу хэлтэс сонгосон байна."}, status=400)

            with transaction.atomic():
                # Өмнөх ашиглагдаагүй урилгыг устгах (давхардахгүй байх)
                Invitation.objects.filter(email=email, is_accepted=False).delete()
                
                invitation = serializer.save(organization=request.user.organization)
                
                accept_url = f"http://localhost:8081/accept-invite?token={invitation.token}"
                email_body = f"""
                <html>
                    <body style="font-family: sans-serif;">
                        <h2>Танд урилга ирлээ!</h2>
                        <p><b>{request.user.organization.name}</b>-аас таныг <b>{invitation.get_role_display()}</b> дүрээр урьж байна.</p>
                        <p>Доорх товчлуур дээр дарж бүртгэлээ дуусгана уу:</p>
                        <a href="{accept_url}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Урилга хүлээн авах</a>
                    </body>
                </html>
                """
                email_sent = send_verification_email(invitation.email, "Ажлын урилга", email_body)

                return Response({
                    "message": "Урилга амжилттай илгээгдлээ.",
                    "email_status": "Sent" if email_sent else "Failed"
                }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

User = get_user_model()
class OrganizationMemberViewSet(viewsets.ModelViewSet):
    """
    Байгууллагын гишүүдийг удирдах ViewSet (User модель ашиглана)
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Зөвхөн өөрийнхөө байгууллагын хэрэглэгчдийг харна
        user = self.request.user
        if hasattr(user, 'organization') and user.organization:
            return User.objects.filter(organization=user.organization).select_related('department')
        return User.objects.none()

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        # Энгийн жагсаалт буцаах (Serializer ашиглах эсвэл шууд map хийх)
        data = []
        for u in queryset:
            data.append({
                "id": u.id,
                "user": {
                    "first_name": u.first_name or u.email.split('@')[0],
                    "last_name": u.last_name or "",
                    "email": u.email
                },
                "role": getattr(u, 'role', 'employee'), # User дээр чинь role байгаа гэж үзлээ
                "department_name": u.department.name if u.department else "Хэлтэсгүй",
                "department": u.department.id if u.department else None
            })
        return Response(data)

    def partial_update(self, request, pk=None):
        # Хэлтэс солих үйлдэл
        user_to_edit = self.get_object()
        dept_id = request.data.get('department')
        
        if dept_id:
            try:
                dept = Department.objects.get(id=dept_id, organization=request.user.organization)
                user_to_edit.department = dept
                user_to_edit.save()
                return Response({"message": "Хэлтэс амжилттай солигдлоо"})
            except Department.DoesNotExist:
                return Response({"error": "Хэлтэс олдсонгүй"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"error": "Мэдээлэл дутуу байна"}, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, pk=None):
        # Хэрэглэгчийг байгууллагаас хасах (Устгах биш, зөвхөн org-ийг нь null болгох нь аюулгүй)
        user_to_remove = self.get_object()
        user_to_remove.organization = None
        user_to_remove.department = None
        user_to_remove.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class UpdateOrganizationView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        user = request.user
        
        # 1. Хэрэглэгчид байгууллага холбогдсон эсэхийг шалгах
        if not hasattr(user, 'organization') or not user.organization:
            return Response({"error": "Танд харьяалагдах байгууллага олдсонгүй."}, status=404)
        
        org = user.organization
        
        # 2. Фронтоос ирсэн датаг хүлээж авах
        # React Native-ээс ирж буй түлхүүр үгстэй яг ижил байх ёстой
        lat = request.data.get('latitude')
        lng = request.data.get('longitude')
        rad = request.data.get('radius')
        name = request.data.get('name')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')

        # 3. Утгуудыг оноож хадгалах
        if lat is not None:
            org.latitude = float(lat)
        if lng is not None:
            org.longitude = float(lng)
        if rad is not None:
            org.radius = int(rad)
        if name:
            org.name = name
        if start_time:
            org.start_time = start_time
        if end_time:
            org.end_time = end_time

        org.save() # Энэ мөр өгөгдлийн санд бодитоор хадгална

        return Response({
            "message": "Амжилттай хадгалагдлаа",
            "data": {
                "id": org.id,
                "name": org.name,
                "latitude": org.latitude,
                "longitude": org.longitude,
                "radius": org.radius,
                "start_time": org.start_time,
                "end_time": org.end_time
            }
        }, status=status.HTTP_200_OK)
    

class MyOrganizationView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        org = request.user.organization
        if not org:
            return Response({"error": "Байгууллага олдсонгүй"}, status=404)
        return Response({
            "id": org.id,
            "name": org.name,
            "latitude": org.latitude,
            "longitude": org.longitude,
            "radius": org.radius,
            "start_time": str(org.start_time) if org.start_time else None,
            "end_time": str(org.end_time) if org.end_time else None,
        })