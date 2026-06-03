import os

from application.settings import BASE_DIR

# ================================================= #
# *************** 数据库 配置  *************** #
# ================================================= #
# 数据库 ENGINE ，默认演示使用 sqlite3 数据库，正式环境建议使用 PostgreSQL
# sqlite3 设置
# DATABASE_ENGINE = "django.db.backends.sqlite3"
# DATABASE_NAME = os.path.join(BASE_DIR, "db.sqlite3")

# PostgreSQL（docker-compose 默认）
DATABASE_ENGINE = "django.db.backends.postgresql"
DATABASE_NAME = "django_vue3_admin"

# 数据库地址 改为自己数据库地址
DATABASE_HOST = '127.0.0.1'
# # 数据库端口
DATABASE_PORT = 5432
# # 数据库用户名
DATABASE_USER = "postgres"
# # 数据库密码
DATABASE_PASSWORD = 'DVADMIN3'

# 表前缀
TABLE_PREFIX = "dvadmin_"
# ================================================= #
# ******** redis配置，无redis 可不进行配置  ******** #
# ================================================= #
REDIS_DB = 1
CELERY_BROKER_DB = 3
REDIS_PASSWORD = 'DVADMIN3'
REDIS_HOST = '127.0.0.1'
REDIS_URL = f'redis://:{REDIS_PASSWORD or ""}@{REDIS_HOST}:6379'
# ================================================= #
# ****************** 功能 启停  ******************* #
# ================================================= #
DEBUG = True
# 启动登录详细概略获取(通过调用api获取ip详细地址。如果是内网，关闭即可)
ENABLE_LOGIN_ANALYSIS_LOG = True
# 登录接口 /api/token/ 是否需要验证码认证，用于测试，正式环境建议取消
LOGIN_NO_CAPTCHA_AUTH = True
# ================================================= #
# ****************** 其他 配置  ******************* #
# ================================================= #
# MinIO 配置（Django 通过 S3 SDK 访问，不挂载 MinIO 数据卷）
MINIO_IP = '127.0.0.1'
MINIO_PORT = 9002
MINIO_CONSOLE_PORT = 9003
MINIO_ACCOUNT = 'admin'
MINIO_PASSWORD = 'admin123456'
MINIO_BUCKET = 'kg-documents'
MINIO_SECURE = False

# ================================================= #
# *************** 8D KG 接入配置 ****************** #
# ================================================= #
# 8D FastAPI 服务 Base URL（非 Django 端口）
KG_8D_BASE_URL = 'http://127.0.0.1:8000/api/v1'
# 与 8D settings.secret_key 一致，用于签发 integration facade JWT（见 kg_agent/Django token claims 对接约定.md）
KG_8D_JWT_SECRET = ''
KG_8D_JWT_ALGORITHM = 'HS256'
# 页面联调建议 3600 秒以内；失效后由 Django 按当前用户重新签发
KG_8D_JWT_TTL_SEC = 3600
KG_8D_TIMEOUT_SEC = 120
KG_8D_UPLOAD_TIMEOUT_SEC = 300
KG_8D_SOURCE_SYSTEM = 'django-main'
KG_8D_SOURCE_MODULE = 'knowledge'
KG_8D_DEFAULT_SENSITIVITY = 'restricted'

ALLOWED_HOSTS = ["*"]
# 列权限中排除App应用
COLUMN_EXCLUDE_APPS = []
