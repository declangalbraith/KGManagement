# ================================================= #
# *************** 数据库 配置  *************** #
# ================================================= #
# PostgreSQL。Docker Compose 下使用服务名 + 端口（容器内 5432）。
# init.sh 仅替换密码占位；联调远程库时可直接改 DATABASE_*。
DATABASE_ENGINE = "django.db.backends.postgresql"
DATABASE_NAME = "butler-service-db-local-prod"

DATABASE_HOST = "butler-service-postgres"
DATABASE_PORT = 5432
DATABASE_USER = "admin"
DATABASE_PASSWORD = "__INIT_POSTGRES_PASSWORD__"

# 表前缀
TABLE_PREFIX = "butler_service_"
# ================================================= #
# ******** redis配置，无redis 可不进行配置  ******** #
# ================================================= #
REDIS_DB = 1
CELERY_BROKER_DB = 3
REDIS_PASSWORD = "__INIT_REDIS_PASSWORD__"
REDIS_HOST = "butler-service-redis"
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

ALLOWED_HOSTS = ["*"]
COLUMN_EXCLUDE_APPS = []
