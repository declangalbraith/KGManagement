"""Issue short-lived JWT for 8D integration facade (see Django token claims 对接约定.md)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import jwt

from kg_agent.conf import get_eight_d_settings


def resolve_eight_d_role(user: Any) -> str:
    """Map dvadmin user to frozen facade role: admin | operator."""
    if getattr(user, "is_superuser", False):
        return "admin"
    role_mgr = getattr(user, "role", None)
    if role_mgr is not None:
        try:
            for name in role_mgr.values_list("name", flat=True):
                if not name:
                    continue
                lowered = str(name).lower()
                if "管理员" in str(name) or lowered in ("admin", "administrator"):
                    return "admin"
        except Exception:
            pass
    current = getattr(user, "current_role", None)
    if current is not None:
        name = getattr(current, "name", "") or ""
        if "管理员" in name or str(name).lower() in ("admin", "administrator"):
            return "admin"
    return "operator"


def resolve_eight_d_org_id(user: Any) -> str:
    """Stable org code for 8D org_id claim."""
    dept = getattr(user, "dept", None)
    if dept is None:
        return "org-default"
    key = getattr(dept, "key", None)
    if key:
        return str(key)
    return f"dept-{dept.id}"


def build_integration_claims(user: Any) -> dict:
    """Frozen claims: sub, username, role, org_id (+ exp set at encode time)."""
    return {
        "sub": str(getattr(user, "id", "") or ""),
        "username": str(getattr(user, "username", "") or ""),
        "role": resolve_eight_d_role(user),
        "org_id": resolve_eight_d_org_id(user),
    }


def issue_integration_token(user: Any) -> str:
    cfg = get_eight_d_settings()
    secret = (cfg.get("jwt_secret") or "").strip()
    if not secret:
        raise ValueError(
            "KG_8D_JWT_SECRET 未配置：须与 8D settings.secret_key 一致，见 kg_agent/Django token claims 对接约定.md"
        )
    if not getattr(user, "id", None):
        raise ValueError("无法为匿名用户签发 8D integration token")

    now = datetime.now(timezone.utc)
    payload = {
        **build_integration_claims(user),
        "iat": now,
        "exp": now + timedelta(seconds=int(cfg.get("jwt_ttl_sec") or 3600)),
    }
    token = jwt.encode(
        payload,
        secret,
        algorithm=cfg.get("jwt_algorithm") or "HS256",
    )
    return token if isinstance(token, str) else token.decode("utf-8")
