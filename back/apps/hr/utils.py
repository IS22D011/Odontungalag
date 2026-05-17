# utils.py  (attendance app-д нэмнэ)
import json
import time
from django.conf import settings

QR_EXPIRY_SECONDS = 30

def generate_qr_payload(organization_id: int, mode: str) -> str:
    """
    mode: 'IN' эсвэл 'OUT'
    Буцаах утга: JSON string — клиент QR болгон харуулна
    """
    now_ts = time.time()
    payload = {
        "o": organization_id,       # organization id
        "m": mode,                  # IN / OUT
        "exp": now_ts + QR_EXPIRY_SECONDS,  # expiry timestamp (seconds)
    }
    return json.dumps(payload, separators=(",", ":"))