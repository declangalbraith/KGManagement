# kg_agent · Django 对接 8D KG

本 app 为 dvadmin 主项目与 8D 知识图谱子系统的 **integration facade** 接入层，用于替换原 `kag` 同步构建（`build/extract`、`build/commit`）与 Neo4j 子图查询（`graph/subgraph`）。

## 环境配置

在 `backend/conf/env.py` 中配置（可参考 `conf/env.example.py`）：

| 变量 | 说明 |
|------|------|
| `KG_8D_BASE_URL` | 8D API 根路径，如 `http://127.0.0.1:8000/api/v1` |
| `KG_8D_JWT_SECRET` | **必填**，与 8D `settings.secret_key` 一致 |
| `KG_8D_JWT_ALGORITHM` | 与 8D `settings.jwt_algorithm` 一致，默认 `HS256` |
| `KG_8D_JWT_TTL_SEC` | 短时 JWT 有效期（秒），默认 `3600` |
| `KG_8D_TIMEOUT_SEC` | 普通请求超时（秒） |
| `KG_8D_UPLOAD_TIMEOUT_SEC` | 上传超时（秒） |
| `KG_8D_SOURCE_SYSTEM` | 默认 `django-main` |
| `KG_8D_SOURCE_MODULE` | 默认 `knowledge` |

认证协议详见 [Django token claims 对接约定.md](./Django%20token%20claims%20%E5%AF%B9%E6%8E%A5%E7%BA%A6%E5%AE%9A.md)：Django 按当前登录用户签发 claims `sub`、`username`、`role`（`admin`/`operator`）、`org_id`、`exp`，**不要**在请求体传 `operator_id` / `requested_by` 作为身份真值。

## 数据库

```bash
cd backend
python manage.py makemigrations kg_agent
python manage.py migrate
```

## API（均需 JWT 登录）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/kg-agent/build/upload/` | 上传文件或文本，触发 8D pipeline |
| GET | `/api/kg-agent/build/` | 构建任务列表 |
| GET | `/api/kg-agent/build/{id}/status/` | 轮询 pipeline 状态 |
| GET | `/api/kg-agent/build/{id}/result/` | 只读抽取结果（entities + relationships） |
| GET | `/api/kg-agent/graph/overview/` | 8D 多文档子图合并总览（构建页 / 问答页默认） |
| GET | `/api/kg-agent/graph/?doc_id=` | 单文档 8D 子图（`doc_id` 或 `job_id`） |

Django **仅**调用 8D `/api/v1/integration/8d/*`，不直连内部 extraction 接口。

## 联调检查

1. 8D 服务健康：`GET {KG_8D_BASE_URL}/health`
2. PostgreSQL / Neo4j / MinIO（8D 侧）凭证正确
3. 上传 docx → 轮询 `status` 至 `success` → `result` / `graph` 有数据
4. 前端知识库「图谱构建」「知识图谱」页可走通

## 文档

- [API.md](./API.md) — 8D REST 契约
- [Django主项目集成方案.md](./Django主项目集成方案.md)
- [Django与8D职责拆分清单 1.md](./Django与8D职责拆分清单%201.md)

## 保留的 KAG 能力

`/api/kag/qa/` 等问答接口一期仍走本地 KAG Solver，未迁移 8D。
