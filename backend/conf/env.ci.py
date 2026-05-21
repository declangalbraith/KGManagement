import os

from application.settings import BASE_DIR

# GitHub Actions: SQLite + local Redis (see playwright-i18n workflow services)
DATABASE_ENGINE = "django.db.backends.sqlite3"
DATABASE_NAME = os.path.join(BASE_DIR, "db.ci.sqlite3")

TABLE_PREFIX = "dvadmin_"

REDIS_DB = 1
CELERY_BROKER_DB = 3
REDIS_PASSWORD = ""
REDIS_HOST = "127.0.0.1"
REDIS_URL = "redis://127.0.0.1:6379"

DEBUG = True
ENABLE_LOGIN_ANALYSIS_LOG = False
LOGIN_NO_CAPTCHA_AUTH = True

ALLOWED_HOSTS = ["*"]
COLUMN_EXCLUDE_APPS = []
