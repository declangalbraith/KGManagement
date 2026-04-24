#!/bin/bash
set -euo pipefail

# local_prod：前后端分步部署。
#   1) ./init.sh backend [--deps] — Postgres/Redis 就绪后先 restart django，再 makemigrations / migrate / init
#      --deps：已改 requirements.txt 或 Dockerfile 时先 docker compose build django 再 up
#   2) ./init.sh frontend — 清理 web/dist（若存在）、pnpm run build:local，再构建并启动 Nginx 前端镜像

ENV_FILE=".env"

usage() {
    echo "用法: $0 backend [--deps] | frontend"
    echo "  backend [--deps]  部署后端：可选 --deps 表示先构建 Django+Celery 镜像（依赖或 Dockerfile 有变更），再 up；"
    echo "                      Postgres/Redis 就绪后先 restart django，migrate/init 后再 restart celery（Worker 加载新任务）"
    echo "  frontend            删除 web/dist（若存在）后 pnpm install && pnpm run build:local，再构建并启动 butler-service-web"
}

require_repo_root() {
    if [ ! -f docker-compose.yml ]; then
        echo "请在仓库根目录执行（需要 docker-compose.yml）。"
        exit 1
    fi
}

compose() {
    if docker compose version >/dev/null 2>&1; then
        docker compose "$@"
    else
        docker-compose "$@"
    fi
}

compose_has_service() {
    compose config --services 2>/dev/null | grep -qx "$1"
}

ensure_env_secrets() {
    if [ -f "$ENV_FILE" ]; then
        echo "$ENV_FILE 已存在，沿用其中 POSTGRES_PASSWORD / REDIS_PASSWORD。"
        return 0
    fi
    POSTGRES_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 18)
    REDIS_PASSWORD=$(head /dev/urandom | tr -dc A-Za-z0-9 | head -c 12)
    {
        echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
        echo "REDIS_PASSWORD=$REDIS_PASSWORD"
    } >> "$ENV_FILE"
    echo "已生成随机密码并写入 $ENV_FILE"
}

load_env_passwords() {
    POSTGRES_PASSWORD=$(grep -E '^POSTGRES_PASSWORD=' "$ENV_FILE" | sed 's/^POSTGRES_PASSWORD=//' | tail -1) || true
    REDIS_PASSWORD=$(grep -E '^REDIS_PASSWORD=' "$ENV_FILE" | sed 's/^REDIS_PASSWORD=//' | tail -1) || true
    if [ -z "${POSTGRES_PASSWORD:-}" ] || [ -z "${REDIS_PASSWORD:-}" ]; then
        echo "$ENV_FILE 缺少 POSTGRES_PASSWORD 或 REDIS_PASSWORD，请补全后重试。"
        exit 1
    fi
}

apply_backend_env() {
    cp -f ./backend/conf/env.local_prod.py ./backend/conf/env.py
    _sed_in_place() {
        if sed --version >/dev/null 2>&1; then
            sed -i "$1" ./backend/conf/env.py
        else
            sed -i '' "$1" ./backend/conf/env.py
        fi
    }
    _sed_in_place "s|__INIT_POSTGRES_PASSWORD__|${POSTGRES_PASSWORD}|g"
    _sed_in_place "s|__INIT_REDIS_PASSWORD__|${REDIS_PASSWORD}|g"
}

# 容器内通过服务名访问：butler-service-postgres:5432、butler-service-redis:6379
wait_postgres_redis_ready() {
    if docker exec butler-service-postgres pg_isready -U admin -d 'butler-service-db-local-prod' >/dev/null 2>&1 \
        && docker exec butler-service-redis redis-cli -a "${REDIS_PASSWORD}" ping 2>/dev/null | grep -q PONG; then
        echo "PostgreSQL 与 Redis（butler-service-postgres:5432 / butler-service-redis:6379）已就绪。"
        return 0
    fi
    return 1
}

ensure_runtime_dirs() {
    mkdir -p docker_env/postgres/pgdata logs/log docker_env/redis/data
}

# compose up 后重启 Django，使进程加载挂载目录中的最新代码，再执行 migrate/init。
# Celery worker 同样是长驻进程：若不随部署重启，队列里新任务名（如 async_import_data）会在 consumer 侧 KeyError。
wait_django_exec_ready() {
    local i=1
    while [ $i -le 30 ]; do
        if docker exec butler-service-django true 2>/dev/null; then
            return 0
        fi
        sleep 1
        i=$((i + 1))
    done
    return 1
}

cmd_backend() {
    local with_deps="${1:-false}"

    require_repo_root
    ensure_runtime_dirs
    ensure_env_secrets
    load_env_passwords
    apply_backend_env

    if [ "$with_deps" = "true" ]; then
        echo "正在构建后端镜像（requirements.txt 或 Dockerfile 有变更时请先使用 --deps）..."
        if compose_has_service butler-service-celery; then
            compose build butler-service-django butler-service-celery || {
                echo "docker compose build（django/celery）执行失败！"
                exit 1
            }
        else
            compose build butler-service-django || {
                echo "docker compose build butler-service-django 执行失败！"
                exit 1
            }
        fi
    fi

    echo "正在启动后端容器（PostgreSQL、Redis、Django；若 compose 含 Celery 则一并启动）..."
    _backend_up=(butler-service-postgres butler-service-redis butler-service-django)
    compose_has_service butler-service-celery && _backend_up+=(butler-service-celery)
    compose up -d "${_backend_up[@]}" || {
        echo "docker compose up -d（后端服务）执行失败！"
        exit 1
    }

    i=1
    while [ $i -le 30 ]; do
        if wait_postgres_redis_ready; then
            echo "正在重启 butler-service-django，使运行中进程与挂载代码一致后再执行迁移..."
            docker restart butler-service-django
            if ! wait_django_exec_ready; then
                echo "等待 butler-service-django 可执行命令超时。"
                exit 1
            fi
            echo "正在根据模型生成迁移文件（makemigrations）..."
            docker exec butler-service-django python3 manage.py makemigrations
            echo "正在应用数据库迁移（migrate）..."
            docker exec butler-service-django python3 manage.py migrate
            echo "正在初始化数据..."
            docker exec butler-service-django python3 manage.py init
            if docker ps -a --format '{{.Names}}' | grep -qx 'butler-service-celery'; then
                echo "正在重启 butler-service-celery，使 Worker 重新加载任务模块（与挂载代码一致）..."
                docker restart butler-service-celery
            fi
            echo "后端部署完成（local_prod）。"
            echo "API：http://<服务器IP>:8004"
            echo "请在本仓库根目录执行: ./init.sh frontend 以构建 dist 并部署 Nginx 前端。"
            echo "如访问不到，请检查防火墙是否放行 8004、5434、6374 等端口。"
            exit 0
        fi
        echo "第 $i 次尝试：PostgreSQL 或 Redis 未就绪，2 秒后重试..."
        sleep 2
        i=$((i + 1))
    done

    echo "等待超时：PostgreSQL 或 Redis 仍未就绪。"
    exit 1
}

cmd_frontend() {
    require_repo_root

    if [ -e web/dist ]; then
        echo "检测到 web/dist，正在删除..."
        rm -rf web/dist
    fi

    echo "正在安装依赖并以 local_prod 模式构建前端（web/dist）..."
    (cd web && pnpm install && pnpm run build:local)

    echo "正在构建并启动前端镜像（butler-service-web）..."
    compose build butler-service-web || {
        echo "docker compose build butler-service-web 执行失败！"
        exit 1
    }
    compose up -d butler-service-web || {
        echo "docker compose up -d butler-service-web 执行失败！"
        exit 1
    }

    echo "前端部署完成。"
    echo "登录地址：http://<服务器IP>:8084"
    echo "如访问不到，请检查防火墙是否放行 8084。"
}

SUBCOMMAND="${1:-}"
case "$SUBCOMMAND" in
    backend)
        if [ -n "${2:-}" ] && [ "$2" != "--deps" ]; then
            echo "未知参数: $2"
            usage
            exit 1
        fi
        _deps_flag=false
        [ "${2:-}" = "--deps" ] && _deps_flag=true
        cmd_backend "$_deps_flag"
        ;;
    frontend)
        cmd_frontend
        ;;
    *)
        usage
        exit 1
        ;;
esac
