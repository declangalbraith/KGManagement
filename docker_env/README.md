# docker 镜像打包

### 打包web基础Build包

~~~sh
# 编译打包到本地
docker build -f ./docker_env/web/DockerfileBuild -t registry.cn-zhangjiakou.aliyuncs.com/dvadmin-pro/dvadmin3-base-web:16.19-alpine .
# 上传到阿里云仓库
docker push registry.cn-zhangjiakou.aliyuncs.com/dvadmin-pro/dvadmin3-base-web:16.19-alpine

~~~

### 打包Backend基础Build包

~~~sh
# 编译打包到本地
docker build -f ./docker_env/django/DockerfileBuild -t registry.cn-zhangjiakou.aliyuncs.com/dvadmin-pro/dvadmin3-base-backend:latest .
# 上传到阿里云仓库
docker push registry.cn-zhangjiakou.aliyuncs.com/dvadmin-pro/dvadmin3-base-backend:latest
~~~

### 运行前端（local_prod 构建）

当前 [web/Dockerfile](web/Dockerfile) 使用 `yarn build:local`（Vite `local_prod` 模式）。

~~~
docker build -f ./docker_env/web/Dockerfile -t butler-service-web .
~~~

### 运行后端

~~~
docker build -f ./docker_env/django/Dockerfile -t butler-service-django .
~~~

### 运行celery（可选）

Compose 中默认已注释；需要时取消 [docker-compose.yml](../docker-compose.yml) 内 `butler-service-celery` 段后再构建：

~~~
docker build -f ./docker_env/celery/Dockerfile -t butler-service-celery .
~~~

## docker-compose 运行（local_prod）

数据库为 **PostgreSQL 16**，服务名 **butler-service-***。一键部署请在仓库根目录执行：

~~~
./init.sh local_prod
~~~

或手动：

~~~
docker compose up -d
docker exec -it butler-service-django bash
python manage.py migrate
python manage.py init
exit
~~~

前端：http://127.0.0.1:**8084**  
直连 Django：http://127.0.0.1:**8004**（调试时）

账号：superadmin 密码：admin123456

~~~
docker compose down
docker compose restart
docker compose up -d --build
~~~
