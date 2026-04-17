# Runtime 使用 ./backend:/backend 挂载时，以宿主机上的 conf/env.py 为准（由 init.sh 从 env.local_prod 生成）。
# 镜像构建阶段不再复制/ sed env，避免与 init.sh 重复且与 PostgreSQL 配置不一致。
FROM registry.cn-zhangjiakou.aliyuncs.com/dvadmin-pro/dvadmin3-base-backend:latest
WORKDIR /backend
COPY ./backend/ .
RUN python3 -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ -r requirements.txt
CMD ["sh","docker_start.sh"]
