from django.conf import settings


def get_eight_d_settings():
    return {
        "base_url": getattr(settings, "KG_8D_BASE_URL", "http://127.0.0.1:8000/api/v1").rstrip("/"),
        "timeout_sec": int(getattr(settings, "KG_8D_TIMEOUT_SEC", 120)),
        "upload_timeout_sec": int(getattr(settings, "KG_8D_UPLOAD_TIMEOUT_SEC", 300)),
        "jwt_secret": getattr(settings, "KG_8D_JWT_SECRET", ""),
        "jwt_algorithm": getattr(settings, "KG_8D_JWT_ALGORITHM", "HS256"),
        "jwt_ttl_sec": int(getattr(settings, "KG_8D_JWT_TTL_SEC", 3600)),
        "source_system": getattr(settings, "KG_8D_SOURCE_SYSTEM", "django-main"),
        "source_module": getattr(settings, "KG_8D_SOURCE_MODULE", "knowledge"),
        "default_sensitivity": getattr(settings, "KG_8D_DEFAULT_SENSITIVITY", "restricted"),
    }
