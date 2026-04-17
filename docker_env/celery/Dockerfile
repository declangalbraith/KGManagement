# 与 django 镜像一致：conf/env.py 由宿主机挂载或 init.sh 提供，构建阶段不生成 env。
FROM registry.cn-zhangjiakou.aliyuncs.com/dvadmin-pro/dvadmin3-base-backend:latest
WORKDIR /backend
COPY ./backend/ .
RUN python3 -m pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ -r requirements.txt
CMD ["celery", "-A", "application", "worker", "-B", "--loglevel=info"]
