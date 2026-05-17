from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.organizations.models import Organization, Invitation, Department

User = get_user_model()

class DepartmentSerializer(serializers.ModelSerializer):
    """Хэлтсийн мэдээллийг JSON болгох"""
    class Meta:
        model = Department 
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    
    # Зургийн URL-г бүтэн болгож харуулах (Media URL-г нэмнэ)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            'id', 'username', 'first_name', 'last_name', 'email', 
            'role', 'organization', 'organization_name', 
            'department', 'department_name', 
            'phone', 'avatar'
        )
        # Эдгээр талбарыг хэрэглэгч өөрөө засаж болохгүй
        read_only_fields = ('id', 'username', 'email', 'role', 'organization', 'department')

    def update(self, instance, validated_data):
        # Хэрэв шинэ зураг ирвэл хуучин зургийг нь устгах логик энд байж болно (Сонголтоор)
        return super().update(instance, validated_data)
    
    
class OrganizationRegisterSerializer(serializers.Serializer):
    """Байгууллага + Админ хэрэглэгч хамт бүртгэх"""
    org_name = serializers.CharField(write_only=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField()
    last_name = serializers.CharField()

    def create(self, validated_data):
        with transaction.atomic():
            # 1. Байгууллага үүсгэх
            org_name = validated_data.pop('org_name')
            org = Organization.objects.create(name=org_name)
            
            # 2. Email болон Password-ийг pop хийж авна (давхардахгүй байх баталгаа)
            email = validated_data.pop('email')
            password = validated_data.pop('password')
            
            # 3. Админ хэрэглэгч үүсгэх
            user = User.objects.create_user(
                username=email, # Email-ийг username болгоно
                email=email,
                password=password,
                organization=org,
                role='admin',
                is_active=False, # OTP баталгаажуултал идэвхгүй
                **validated_data # Үлдсэн утгууд (first_name, last_name)
            )
            return user
        
class RegisterSerializer(serializers.ModelSerializer):
    """Шинэ хэрэглэгч (ажилтан) өөрөө бүртгүүлэхэд (Байгууллагагүй)"""
    repassword = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'phone', 'password', 'repassword', 'first_name', 'last_name')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True},
            'phone': {'required': True}
        }

    def validate(self, data):
        if data['password'] != data['repassword']:
            raise serializers.ValidationError({"password": "Нууц үгүүд зөрж байна."})
        
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Энэ имэйл хаяг бүртгэлтэй байна."})
            
        if User.objects.filter(phone=data['phone']).exists():
            raise serializers.ValidationError({"phone": "Энэ утасны дугаар бүртгэлтэй байна."})
            
        return data

    def create(self, validated_data):
        validated_data.pop('repassword')
        email = validated_data.get('email')
        user = User.objects.create_user(
            username=email,
            **validated_data
        )
        return user

class LoginSerializer(serializers.Serializer):
    """Нэвтрэх логик - Дэлгэцийн аккаунтыг дэмжсэн хувилбар"""
    # EmailField-ийг CharField болговол .internal хаяг дээр алдаа заахгүй
    email = serializers.CharField(required=True) 
    password = serializers.CharField(style={'input_type': 'password'}, required=True)

    def validate(self, attrs):
        email = attrs.get('email').strip().lower() # Сул зайг устгаж, жижиг үсэг болгох
        password = attrs.get('password')

        # Хэрэглэгчийг имэйл эсвэл username-ээр нь хайх (илүү найдвартай)
        from django.db.models import Q
        user = User.objects.filter(email__iexact=email).first()

        if not user:
            # Debug хийхэд зориулж консол дээр хэвлэх
            print(f"Login failed: {email} not found")
            raise serializers.ValidationError('Имэйл эсвэл нэвтрэх нэр бүртгэлгүй байна.')

        if not user.check_password(password):
            print(f"Login failed: Wrong password for {email}")
            raise serializers.ValidationError('Нууц үг буруу байна.')

        if not user.is_active:
            raise serializers.ValidationError('Таны бүртгэл идэвхжээгүй байна.')
        
        attrs['user'] = user
        return attrs
    
    
class ChangePasswordSerializer(serializers.Serializer):
    """Нууц үг солих"""
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Хуучин нууц үг буруу байна.")
        return value

class InvitationSerializer(serializers.ModelSerializer):
    """Урилгын мэдээлэл харах"""
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = Invitation
        fields = ('id', 'email', 'role', 'department', 'department_name', 'token', 'is_accepted', 'created_at')
        read_only_fields = ('token', 'is_accepted', 'created_at')

class AcceptInviteRegisterSerializer(serializers.ModelSerializer):
    """Урилгаар бүртгүүлэх (Нууц үг тохируулах хэсэг)"""
    token = serializers.CharField(write_only=True) 
    password = serializers.CharField(write_only=True, min_length=8)
    repassword = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('token', 'password', 'repassword', 'first_name', 'last_name', 'phone')

    def validate(self, data):
        token_value = data.get('token')
        print(f"DEBUG: Checking token: {token_value}") # Терминал дээр харах

        if data['password'] != data['repassword']:
            raise serializers.ValidationError({"password": "Нууц үг зөрүүтэй байна."})
        
        # Шүүлтүүрийг шалгах
        invitation = Invitation.objects.filter(token=token_value, is_accepted=False).first()
        
        if not invitation:
            # Датабаазад байгаа эсэхийг шалгах нэмэлт нөхцөл
            exists = Invitation.objects.filter(token=token_value).exists()
            if exists:
                message = "Энэ урилга аль хэдийн ашиглагдсан байна."
            else:
                message = "Урилгын токен олдсонгүй (Буруу токен)."
            raise serializers.ValidationError({"token": message})
        
        data['invitation_obj'] = invitation
        return data
        
    def create(self, validated_data):
        invite = validated_data.pop('invitation_obj')
        validated_data.pop('token')
        validated_data.pop('repassword')

        # Урилга дээрх байгууллага, хэлтэс, ролийг шууд онооно
        user = User.objects.create_user(
            username=invite.email,
            email=invite.email,
            organization=invite.organization,
            department=invite.department,
            role=invite.role,
            is_active=True,
            **validated_data
        )
        
        # Урилгыг ашигласан гэж тэмдэглэнэ
        invite.is_accepted = True
        invite.save()
        return user
    
