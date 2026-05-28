import os

from application.settings import BASE_DIR

# ================================================= #
# *************** 数据库 配置  *************** #
# ================================================= #
# PostgreSQL（开发环境）
DATABASE_ENGINE = "django.db.backends.postgresql"
DATABASE_NAME = "kg-management-db-dev"

DATABASE_HOST = '117.62.232.51'
DATABASE_PORT = 5433
DATABASE_USER = "admin"
DATABASE_PASSWORD = 'admin123456'

# 表前缀
TABLE_PREFIX = "kg_management_"
# ================================================= #
# ******** redis配置  ******** #
# ================================================= #
REDIS_DB = 2
CELERY_BROKER_DB = 4
REDIS_PASSWORD = 'bVxfkWdklfI0'
REDIS_HOST = '117.62.232.51'
REDIS_URL = f'redis://:{REDIS_PASSWORD or ""}@{REDIS_HOST}:6379'
# ================================================= #
# ****************** 功能 启停  ******************* #
# ================================================= #
DEBUG = True
ENABLE_LOGIN_ANALYSIS_LOG = True
LOGIN_NO_CAPTCHA_AUTH = True
# ================================================= #
# ****************** 其他 配置  ******************* #
# ================================================= #

ALLOWED_HOSTS = ["*"]
COLUMN_EXCLUDE_APPS = []

# ================================================= #
# ****************** KAG 配置  ******************* #
# ================================================= #
KAG_PROJECT_ROOT = os.path.join(BASE_DIR, "kag", "kag_projects")

# ================================================= #
# *************** Schema 初始文件  *************** #
# ================================================= #
SCHEMA_INIT_FILE = os.path.join(KAG_PROJECT_ROOT, "KGtestV2", "schema", "KGtestV2.schema")

# LLM SiliconFlow API
KAG_LLM_OPENIE_BASE_URL = "https://api.siliconflow.cn/v1"
KAG_LLM_OPENIE_API_KEY = "sk-yrwobvrcxtpyxaqecbqqkqoacxcxpexeiteyywznyiebavng"
KAG_LLM_OPENIE_MODEL = "Qwen/Qwen2.5-72B-Instruct"

KAG_LLM_CHAT_BASE_URL = "https://api.siliconflow.cn/v1"
KAG_LLM_CHAT_API_KEY = "sk-yrwobvrcxtpyxaqecbqqkqoacxcxpexeiteyywznyiebavng"
KAG_LLM_CHAT_MODEL = "deepseek-ai/DeepSeek-V3.2"

# Embedding BGE-M3
KAG_EMBEDDING_BASE_URL = "https://api.siliconflow.cn/v1"
KAG_EMBEDDING_API_KEY = "sk-yrwobvrcxtpyxaqecbqqkqoacxcxpexeiteyywznyiebavng"
KAG_EMBEDDING_MODEL = "BAAI/bge-m3"
KAG_EMBEDDING_DIMENSIONS = 1024

# Neo4j
KAG_NEO4J_URI = "bolt://117.62.232.51:17688"
KAG_NEO4J_USER = "neo4j"
KAG_NEO4J_PASSWORD = "neo4j@openspg"
KAG_NEO4J_DATABASE = "kgtestv2"

# OpenSPG
KAG_OPENSPG_HOST = "http://117.62.232.51:18887"
