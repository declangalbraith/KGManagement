from django.test import SimpleTestCase

from kg_agent.auth.jwt_token import build_integration_claims, resolve_eight_d_org_id, resolve_eight_d_role


class _FakeRoleMgr:
    def __init__(self, names):
        self._names = names

    def values_list(self, field, flat=False):
        assert field == "name"
        return self._names


class _FakeDept:
    def __init__(self, *, id=1, key=None):
        self.id = id
        self.key = key


class _FakeUser:
    def __init__(self, **kwargs):
        self.id = kwargs.get("id", 10086)
        self.username = kwargs.get("username", "zhangsan")
        self.is_superuser = kwargs.get("is_superuser", False)
        self.role = kwargs.get("role", _FakeRoleMgr([]))
        self.current_role = kwargs.get("current_role", None)
        self.dept = kwargs.get("dept", _FakeDept(key="org-shenzhen-quality"))


class JwtTokenTests(SimpleTestCase):
    def test_claims_frozen_fields(self):
        user = _FakeUser()
        claims = build_integration_claims(user)
        self.assertEqual(claims["sub"], "10086")
        self.assertEqual(claims["username"], "zhangsan")
        self.assertEqual(claims["role"], "operator")
        self.assertEqual(claims["org_id"], "org-shenzhen-quality")

    def test_admin_from_superuser(self):
        user = _FakeUser(is_superuser=True)
        self.assertEqual(resolve_eight_d_role(user), "admin")

    def test_org_fallback_dept_id(self):
        user = _FakeUser(dept=_FakeDept(id=42, key=None))
        self.assertEqual(resolve_eight_d_org_id(user), "dept-42")
