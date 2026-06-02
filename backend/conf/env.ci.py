import os

from application.settings import BASE_DIR

# GitHub Actions: SQLite + local Redis (see playwright-i18n workflow services)
DATABASE_ENGINE = "django.db.backends.sqlite3"
DATABASE_NAME = os.path.join(BASE_DIR, "db.ci.sqlite3")
# settings.py always passes these keys; SQLite ignores them
DATABASE_HOST = ""
DATABASE_PORT = ""
DATABASE_USER = ""
DATABASE_PASSWORD = ""

TABLE_PREFIX = "dvadmin_"

REDIS_DB = 1
CELERY_BROKER_DB = 3
REDIS_PASSWORD = ""
REDIS_HOST = "127.0.0.1"
REDIS_URL = "redis://127.0.0.1:6379"

DEBUG = True
ENABLE_LOGIN_ANALYSIS_LOG = False
LOGIN_NO_CAPTCHA_AUTH = True

MINIO_IP = "127.0.0.1"
MINIO_PORT = 9002
MINIO_CONSOLE_PORT = 9003
MINIO_ACCOUNT = "admin"
MINIO_PASSWORD = "admin123456"
MINIO_BUCKET = "kg-documents"
MINIO_SECURE = False

ALLOWED_HOSTS = ["*"]
COLUMN_EXCLUDE_APPS = []
