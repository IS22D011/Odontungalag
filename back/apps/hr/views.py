import json
import calendar
from math import radians, cos, sin, asin, sqrt
from datetime import datetime

from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

from rest_framework import views, status, generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action

from .models import Attendance, LeaveRequest
from .serializers import AttendanceSerializer, AttendanceCheckInSerializer, LeaveRequestSerializer
from apps.organizations.models import Department, Organization
from apps.tasks.models import Project, Task
from apps.notifications.models import Notification

User = get_user_model()

QR_EXPIRY_SECONDS = 30  # QR хугацаа (секунд)


def get_distance(lat1, lon1, lat2, lon2):
    """Хоёр цэгийн хоорондох зайг метрээр тооцоолох (Haversine formula)"""
    if any(v is None for v in [lat1, lon1, lat2, lon2]):
        return 999999
    try:
        R = 6371000  # Дэлхийн радиус метрээр
        lat1_r, lat2_r = radians(float(lat1)), radians(float(lat2))
        dLat = radians(float(lat2) - float(lat1))
        dLon = radians(float(lon2) - float(lon1))
        a = sin(dLat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(dLon / 2) ** 2
        c = 2 * asin(sqrt(a))
        return R * c
    except Exception:
        return 999999


class CheckInView(views.APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        org = user.organization

        if not org:
            return Response(
                {"error": "Та ямар нэг байгууллагад харьяалагдаагүй байна."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AttendanceCheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        method = validated.get("method", "gps")
        user_lat = validated.get("lat")
        user_lng = validated.get("lng")
        attendance_status = validated.get("status")
        current_time = timezone.localtime(timezone.now())

        # ── QR LOGIC ──────────────────────────────────────────────────────────
        if method == "qr":
            qr_payload_raw = validated.get("qr_payload")
            if not qr_payload_raw:
                return Response(
                    {"error": "QR дата дутуу байна."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                payload = json.loads(qr_payload_raw)
            except (json.JSONDecodeError, TypeError):
                return Response(
                    {"error": "QR код уншихад алдаа гарлаа."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Байгууллага таарч буй эсэх
            if str(payload.get("o")) != str(org.id):
                return Response(
                    {"error": "Энэ байгууллагын QR код биш байна."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Хугацаа шалгах — exp (expiry) талбар ашиглах
            exp = payload.get("exp")
            if exp is None:
                return Response(
                    {"error": "QR кодын формат буруу байна (exp дутуу)."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if timezone.now().timestamp() > exp:
                return Response(
                    {"error": f"QR кодын хугацаа дууссан байна ({QR_EXPIRY_SECONDS} секунд). Шинээр үүсгэнэ үү."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Status QR-с авах (хэрэв client илгээгээгүй бол)
            if not attendance_status:
                attendance_status = payload.get("m")

        # ── GPS LOGIC ──────────────────────────────────────────────────────────
        elif method == "gps":
            if user_lat is None or user_lng is None:
                return Response(
                    {"error": "GPS координат шаардлагатай."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not org.latitude or not org.longitude:
                return Response(
                    {"error": "Байгууллагын байршил тохируулаагүй байна."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            dist = get_distance(user_lat, user_lng, org.latitude, org.longitude)
            if dist > org.radius:
                return Response(
                    {
                        "error": f"Оффисын радиусаас хол байна. Одоогийн зай: {int(dist)}м, зөвшөөрөгдсөн: {org.radius}м",
                        "distance": int(dist),
                        "allowed_radius": org.radius,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not attendance_status:
            return Response(
                {"error": "Ирцийн төрөл (IN/OUT) тодорхойгүй байна."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── ДАВХАР БҮРТГЭЛЭЭС СЭРГИЙЛЭХ ──────────────────────────────────────
        already_exists = Attendance.objects.filter(
            user=user,
            status=attendance_status,
            check_in__date=current_time.date(),
        ).exists()

        if already_exists:
            status_text = "орсон" if attendance_status == "IN" else "гарсан"
            return Response(
                {"error": f"Таны өнөөдрийн '{status_text}' ирц аль хэдийн бүртгэгдсэн байна."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── ХАДГАЛАХ ──────────────────────────────────────────────────────────
        try:
            attendance = Attendance.objects.create(
                user=user,
                organization=org,
                status=attendance_status,
                lat=user_lat,
                lng=user_lng,
            )
            return Response(AttendanceSerializer(attendance).data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Серверт алдаа гарлаа: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class MyAttendanceListView(generics.ListAPIView):
    """Ажилтан өөрийн ирцийн түүхийг харах"""
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Attendance.objects.filter(user=self.request.user).order_by("-check_in")


class AttendanceListView(views.APIView):
    """Байгууллагын бүх ирцийн жагсаалт (Админд)"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        attendances = (
            Attendance.objects.filter(organization=request.user.organization)
            .exclude(user__role="display")
            .select_related("user")
            .order_by("-check_in")
        )

        data = []
        for a in attendances:
            local_ts = timezone.localtime(a.check_in)
            data.append(
                {
                    "id": a.id,
                    "user_name": (
                        f"{a.user.first_name} {a.user.last_name}".strip()
                        if a.user.first_name
                        else a.user.email
                    ),
                    "date": local_ts.strftime("%Y-%m-%d"),
                    "check_in": local_ts.strftime("%H:%M"),
                    "status": a.status,
                }
            )
        return Response(data)


class DetailedAttendanceListView(views.APIView):
    """Админ: өдрөөр ажилчдын ирсэн/гарсан цагийг харах"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.user.organization
        date_str = request.query_params.get("date")

        try:
            target_date = (
                datetime.strptime(date_str, "%Y-%m-%d").date()
                if date_str
                else timezone.localtime(timezone.now()).date()
            )
        except ValueError:
            return Response({"error": "Огноо буруу (YYYY-MM-DD)"}, status=400)

        employees = User.objects.filter(organization=org).exclude(role="display")
        attendances = Attendance.objects.filter(organization=org, check_in__date=target_date)

        data = []
        for emp in employees:
            emp_atts = attendances.filter(user=emp)
            first_in = emp_atts.filter(status="IN").order_by("check_in").first()
            last_out = emp_atts.filter(status="OUT").order_by("-check_in").first()

            check_in_str = timezone.localtime(first_in.check_in).strftime("%H:%M") if first_in else "--:--"
            check_out_str = timezone.localtime(last_out.check_in).strftime("%H:%M") if last_out else "--:--"

            total_h = 0.0
            if first_in and last_out:
                diff = last_out.check_in - first_in.check_in
                total_h = round(diff.total_seconds() / 3600, 1)

            if first_in:
                is_late = org.start_time and timezone.localtime(first_in.check_in).time() > org.start_time
                status_val = "late" if is_late else "present"
            else:
                status_val = "absent"

            data.append(
                {
                    "id": emp.id,
                    "user_name": f"{emp.first_name} {emp.last_name}".strip() if emp.first_name else emp.email,
                    "check_in": check_in_str,
                    "check_out": check_out_str,
                    "total_hours": total_h,
                    "status": status_val,
                    "date": target_date.isoformat(),
                }
            )
        return Response(data)


class OrganizationReportView(views.APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.user.organization
        if not org:
            return Response({"error": "Байгууллага олдсонгүй"}, status=404)

        period = request.query_params.get("period", "day")
        now = timezone.localtime(timezone.now())

        try:
            target_year = int(request.query_params.get("year", now.year))
            target_month = int(request.query_params.get("month", now.month))
        except ValueError:
            target_year, target_month = now.year, now.month

        if period == "month":
            last_day = calendar.monthrange(target_year, target_month)[1]
            start_date = now.replace(year=target_year, month=target_month, day=1).date()
            end_date = now.replace(year=target_year, month=target_month, day=last_day).date()
            days_count = last_day
        elif period == "week":
            end_date = now.date()
            start_date = end_date - timezone.timedelta(days=6)
            days_count = 7
        else:  # day
            start_date = end_date = now.date()
            days_count = 1

        all_staff = User.objects.filter(organization=org).exclude(role="display")
        total_staff_count = all_staff.count()

        attendance_qs = Attendance.objects.filter(
            organization=org,
            status="IN",
            check_in__date__range=[start_date, end_date],
        )

        total_presents = attendance_qs.count()
        total_late_count = sum(
            1
            for att in attendance_qs
            if org.start_time and att.check_in and timezone.localtime(att.check_in).time() > org.start_time
        )

        total_possible = total_staff_count * days_count
        attendance_rate = min(int((total_presents / total_possible) * 100), 100) if total_possible > 0 else 0

        # Хэлтсүүдийн явц
        dept_data = []
        for d in Department.objects.filter(organization=org):
            d_staff = User.objects.filter(department=d)
            d_tasks = Task.objects.filter(
                assigned_to__in=d_staff, created_at__date__range=[start_date, end_date]
            ).distinct()
            t_total = d_tasks.count()
            t_done = d_tasks.filter(status="done").count()
            dept_data.append(
                {
                    "name": d.name,
                    "staff_count": d_staff.count(),
                    "value": int((t_done / t_total * 100)) if t_total > 0 else 0,
                }
            )

        # Төслүүдийн явц
        projects_data = []
        for p in Project.objects.filter(owner__organization=org):
            p_tasks = p.tasks.all()
            total_t = p_tasks.count()
            done_t = p_tasks.filter(status="done").count()
            projects_data.append(
                {
                    "name": p.name,
                    "percent": int((done_t / total_t * 100)) if total_t > 0 else 0,
                    "stats": {
                        "done": done_t,
                        "doing": p_tasks.filter(status="doing").count(),
                    },
                }
            )

        # Trend график (сүүлийн 7 өдөр)
        chart_days = 7
        trend = []
        for i in range(chart_days):
            d = end_date - timezone.timedelta(days=(chart_days - 1 - i))
            count = Attendance.objects.filter(organization=org, status="IN", check_in__date=d).count()
            trend.append({"day": d.strftime("%m/%d"), "count": count, "max": total_staff_count})

        today_count = (
            attendance_qs.filter(check_in__date=end_date).count() if period != "day" else total_presents
        )

        return Response(
            {
                "summary": {
                    "attendance_rate": attendance_rate,
                    "present_today": today_count,
                    "absent_today": max(0, total_staff_count - today_count),
                    "total_staff": total_staff_count,
                },
                "late_count": total_late_count,
                "department_progress": dept_data,
                "weekly_trend": trend,
                "projects": projects_data,
            }
        )


class AttendanceWorkLogView(views.APIView):
    """Ажилчдын ажилласан цагийн нэгтгэл"""
    permission_classes = [IsAuthenticated]  # ← дутуу байсан, нэмэгдлээ

    def get(self, request):
        date_str = request.query_params.get("date", timezone.now().date().isoformat())
        attendances = Attendance.objects.filter(check_in__date=date_str).select_related("user")

        user_logs = {}
        for att in attendances:
            u_id = att.user.id
            if u_id not in user_logs:
                user_logs[u_id] = {"name": att.user.first_name or att.user.email, "first_in": None, "last_out": None}

            if att.status == "IN":
                if not user_logs[u_id]["first_in"] or att.check_in < user_logs[u_id]["first_in"]:
                    user_logs[u_id]["first_in"] = att.check_in
            elif att.status == "OUT":
                if not user_logs[u_id]["last_out"] or att.check_in > user_logs[u_id]["last_out"]:
                    user_logs[u_id]["last_out"] = att.check_in

        final_data = []
        for u_id, log in user_logs.items():
            work_hours = 0.0
            if log["first_in"] and log["last_out"]:
                diff = log["last_out"] - log["first_in"]
                work_hours = round(diff.total_seconds() / 3600, 1)

            final_data.append(
                {
                    "id": u_id,
                    "name": log["name"],
                    "first_in": timezone.localtime(log["first_in"]).strftime("%H:%M") if log["first_in"] else "--:--",
                    "last_out": timezone.localtime(log["last_out"]).strftime("%H:%M") if log["last_out"] else "--:--",
                    "total_hours": work_hours,
                }
            )
        return Response(final_data)
    

class MyStatsView(views.APIView):
    """Ажилтан өөрийн ирцийн статистик харах"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        org = user.organization
        now = timezone.localtime(timezone.now())
        current_month_start = now.replace(day=1).date()
        today = now.date()

        # Энэ сарын бүх ирц
        month_attendances = Attendance.objects.filter(
            user=user,
            check_in__date__range=[current_month_start, today],
        )

        # Ирсэн өдрүүд (IN бүртгэлтэй өдрүүд)
        present_days = month_attendances.filter(
            status="IN"
        ).dates("check_in", "day").count()

        # Хоцорсон өдрүүд
        late_days = 0
        if org and org.start_time:
            for att in month_attendances.filter(status="IN"):
                local_time = timezone.localtime(att.check_in).time()
                if local_time > org.start_time:
                    late_days += 1

        # Чөлөөний мэдээлэл (LeaveRequest model байгаа бол)
        total_leave_days = getattr(user, "annual_leave_days", 15) or 15
        used_leave_days = 0
        try:
            from apps.hr.models import LeaveRequest
            used_leave_days = LeaveRequest.objects.filter(
                user=user,
                status="approved",
                start_date__year=now.year,
            ).count()
        except Exception:
            pass

        return Response({
            "presentDays": present_days,
            "lateDays": late_days,
            "totalLeaveDays": total_leave_days,
            "usedLeaveDays": used_leave_days,
        })
    
class LeaveRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        user = self.request.user
        # Хэрэв админ эсвэл менежер бол өөрийн байгууллага/хэлтсийн хүсэлтүүдийг харна
        if user.role in ['admin', 'manager']:
            qs = LeaveRequest.objects.filter(user__organization=user.organization)
            if user.role == 'manager' and user.department:
                qs = qs.filter(user__department=user.department)
            return qs.order_by('-created_at') # Хамгийн сүүлийнх нь дээрээ
        
        # Жирийн ажилтан бол зөвхөн өөрийнхөө хүсэлтийг харна
        return LeaveRequest.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # Менежер хүсэлтийг батлах/цуцлах функц
    @action(detail=True, methods=['post'], url_path='approve')
    def approve_leave(self, request, pk=None):
        leave = self.get_object()
        user = self.request.user # Шийдвэр гаргаж буй менежер

        if user.role not in ['admin', 'manager']:
            return Response({"error": "Танд эрх байхгүй."}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({"error": "Буруу төлөв."}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Хүсэлтийн төлөвийг шинэчлэх
        leave.status = new_status
        leave.approver = user
        leave.save()

        # 2. Ажилтанд мэдэгдэл (Notification) үүсгэх
        status_text = "зөвшөөрөгдсөн" if new_status == 'approved' else "татгалзсан"
        
        Notification.objects.create(
            user=leave.user, # Хүсэлт гаргасан ажилтан
            title="Чөлөөний хүсэлт шийдвэрлэгдлээ",
            message=f"Таны {leave.start_date}-аас {leave.end_date} хүртэлх чөлөөний хүсэлтийг Менежер {status_text}."
        )

        return Response({
            "message": f"Амжилттай {new_status} төлөвт шилжлээ.",
            "notification": "Ажилтанд мэдэгдэл илгээгдлээ"
        })