from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.apps import apps

User = get_user_model()

@receiver(post_save)
def auto_handle_chat_logic(sender, instance, created, **kwargs):
    # 1. Хэлтэс (Department) шинээр үүсэх үед:
    # Тухайн хэлтэст аль хэдийн бүртгэгдсэн хүмүүс байвал тэднийг шууд нэмнэ.
    if sender.__name__ == 'Department':
        from apps.chat.models import ChatRoom
        room_name = f"{instance.name} ({instance.organization.name})"
        room, _ = ChatRoom.objects.get_or_create(name=room_name)
        
        # Тухайн хэлтэст хамааралтай бүх ажилчдыг олох
        dept_users = User.objects.filter(department=instance)
        if dept_users.exists():
            room.users.add(*dept_users) # "*" ашиглан жагсаалтаар нь бөөнд нь нэмнэ

    # 2. Хэрэглэгч (User) шинээр үүсэх эсвэл хэлтэс нь солигдох үед:
    if isinstance(instance, User):
        if hasattr(instance, 'department') and instance.department:
            from apps.chat.models import ChatRoom
            dept = instance.department
            room_name = f"{dept.name} ({dept.organization.name})"
            room, _ = ChatRoom.objects.get_or_create(name=room_name)
            
            # Тухайн хэрэглэгчийг группт нэмэх
            if instance not in room.users.all():
                room.users.add(instance)


@receiver(post_save, sender='organizations.Department') # 'hr' биш 'organizations'
def create_department_chat(sender, instance, created, **kwargs):
    if created:
        from apps.chat.models import ChatRoom
        room_name = f"{instance.name} ({instance.organization.name})"
        ChatRoom.objects.get_or_create(name=room_name)

@receiver(post_save, sender=User)
def add_user_to_dept_chat(sender, instance, **kwargs):
    # Хэрэглэгчийн хэлтсийг шалгах
    if hasattr(instance, 'department') and instance.department:
        from apps.chat.models import ChatRoom
        dept = instance.department
        room_name = f"{dept.name} ({dept.organization.name})"
        room, _ = ChatRoom.objects.get_or_create(name=room_name)
        
        if instance not in room.users.all():
            room.users.add(instance)


@receiver(post_save, sender='organizations.Department')
def handle_department_chat(sender, instance, created, **kwargs):
    from apps.chat.models import ChatRoom
    # Хэлтэс үүсэхэд чат өрөөг нь хамт үүсгэнэ
    if created:
        room_name = f"{instance.name} Групп"
        ChatRoom.objects.create(
            name=room_name,
            department=instance,
            is_group=True
        )

@receiver(post_save, sender=User)
def sync_user_to_dept_chat(sender, instance, created, **kwargs):
    from apps.chat.models import ChatRoom
    if instance.department:
        # Тухайн хэлтсийн ганц чат өрөөг олж авна
        room = ChatRoom.objects.filter(department=instance.department).first()
        if room:
            room.users.add(instance)
            # Хэрэв менежер бол админаар нэмж болно
            if instance.role in ['admin', 'manager']: # Таны User модел дээрх role-оос хамаарна
                room.admins.add(instance)