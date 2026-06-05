# Django 主项目集成方案

## 1. 目标

当前 8D 知识图谱平台需要并入 Django 主项目，作为一个子功能对外提供统一体验，同时保留现有核心能力闭环：

- 文件上传
- 文档解析与抽取
- 图谱写入
- 结果查询与图谱展示

本方案的目标不是简单把代码放进同一个仓库，而是在保证工程可用、边界清晰、后续可演进的前提下完成集成。

当前运行时 schema / ontology 的英文单页说明见 `docs/django-current-runtime.schema`，Django 端联调、字段映射与下游类型对接应优先以该文件为准。

---

## 2. 推荐方案

推荐采用“更强的折中方案”：

- 用户体验一体化
- 运行时能力独立
- 代码层逐步抽内核

### 2.1 一句话定义

Django 负责统一入口、认证、权限前置和业务上下文；8D 子系统保持独立服务运行，提供上传、抽取、入图、查询、展示的完整能力；同时在 8D 服务内部新增主项目专用接入门面，避免 Django 直接依赖内部实现细节。

### 2.2 为什么不建议直接代码嵌入

当前 8D 项目不是一个轻量模块，而是完整业务域服务，包含：

- FastAPI 应用层
- Celery 异步任务
- Redis
- Neo4j
- MinIO
- PostgreSQL
- LLM 调用链路

如果直接嵌入 Django 主项目，会带来以下问题：

- 主项目需要吸收整套运行时依赖与配置体系
- 发布节奏耦合，主项目小改动也可能影响抽取链路
- 异步任务、图数据库、对象存储等故障会放大到主系统
- 认证、权限、审计和用户归属边界容易混乱
- 后续若再拆出独立能力，成本更高

### 2.3 为什么不建议只做最弱的服务集成

如果只是把前端页面挂进去、后端接口直接开放给 Django 调用，短期可行，但后续会出现：

- 接口边界失控
- 文档与实现漂移带来的集成风险
- 权限和身份传递不稳定
- Django 逐步侵入 8D 内部实现

因此，推荐不是“简单独立服务”，而是“独立服务 + 接入门面 + 逐步抽离领域内核”。

### 2.4 当前阶段判断

基于当前仓库进展，这个方案已经从“架构建议”进入“部分落地”阶段。

当前已经成立的事实：

- `integration facade` 首版已落地，Django 不再需要直接接 8D 内部散装接口
- `Skill-first` 已成为抽取主方向，runtime 进一步收缩为结构治理层
- 来源键、幂等键、稳定 DTO、结果/图谱对外收敛模型已形成第一版实现

因此，这份方案当前更应被理解为：

- 主方向已经确定，不建议再回退到“Django 直接对接内部接口”
- 一期重点不在重新选架构，而在补齐认证映射、联调闭环和部署收口

当前尚未收口的关键项：

- Django 内部凭证校验
- Django 用户到 8D `owner/operator/audit` 的真实身份映射
- Django 视角的端到端联调闭环

### 2.5 面向多知识类型的演进判断

后续 Django 主项目合并后，不应把当前系统限制为“只能处理 8D 报告”。更稳妥的演进方式是把当前 8D 能力视为第一套已落地的知识类型：

- `document_type_code=8d_report`
- 一套 8D ontology / schema
- 一套 8D extraction profile
- 一套 8D Skill Pack
- 一套稳定 facade DTO

新增其他知识文档类型时，不建议复制一套新的 8D pipeline，也不建议让 Django 直接写 Neo4j 或生产 schema。推荐采用“Schema-first + Draft/Publish + Codex-assisted”模式：

- Django 负责文档类型、schema / ontology 草稿、审核发布入口和业务权限前置
- 8D-kg 负责 schema 校验、profile 校验、dry-run、发布固化、pipeline 执行和写图治理
- Codex 负责辅助生成草稿、解释差异、检查风险和修复验证错误，但不直接发布生产 schema

详细落地方案见根目录 `多知识类型Ontology与Codex辅助入图方案.md`。后续 Django 联调时，应把该文档与本文、`Django与8D职责拆分清单.md` 一起作为对接基线。

---

## 3. 最终架构建议

### 3.1 运行架构

```text
用户
  -> Django 主项目
     -> 菜单、权限前置、业务上下文、统一导航
     -> 反向代理 /quality/8d/
        -> 8D Frontend
        -> 8D API
        -> 8D WebSocket

8D Backend
  -> FastAPI
  -> Celery Worker
  -> PostgreSQL
  -> Neo4j
  -> Redis
  -> MinIO
  -> LLM Gateway
```

### 3.2 职责边界

#### Django 主项目负责

- 统一登录
- 主导航与菜单入口
- 模块权限前置
- 主项目业务上下文传递
- 统一组织、用户、角色来源
- 必要的页面跳转与回链

#### 8D 子系统负责

- 文档上传
- 去重与存储
- 异步抽取任务编排
- 候选图生成、审核后图谱写入与回查
- 图谱展示
- 抽取结果详情
- 子系统内部审计与运行状态

#### 接入门面负责

- 为 Django 提供稳定、收敛的能力接口
- 屏蔽 8D 内部实现细节
- 统一身份解析与上下文映射
- 统一外部业务键

---

## 4. 推荐接入方式

### 4.1 前端集成方式

推荐使用子路径集成，不推荐 iframe。

示例路径：

- `/quality/8d/` -> 8D 前端
- `/quality/8d/api/` -> 8D 后端接口
- `/quality/8d/ws/` -> 8D WebSocket

当前实现说明：

- 前端已支持通过 `VITE_APP_BASE_PATH` 构建到主项目子路径下运行；未显式设置时默认根路径 `/`
- 前端 API 默认跟随同一子路径前缀，例如 `VITE_APP_BASE_PATH=/quality/8d` 时，默认 API 基址为 `/quality/8d/api/v1`
- 如主项目网关需要把 API 转发到其他前缀或独立域名，可额外显式设置 `VITE_API_BASE_URL`
- NeoVis 作为当前正式图谱渲染路径；直连 Neo4j 时，若 Django 前端入口与 8D 服务不在同一主机，前端应优先使用 `VITE_NEO4J_BROWSER_URI / VITE_NEO4J_BROWSER_USER / VITE_NEO4J_BROWSER_PASSWORD / VITE_NEO4J_BROWSER_DATABASE` 指向“浏览器可直连”的 Bolt 端点，而不是复用后端/容器侧地址
- 当前前端运行时代码未建立 WebSocket 连接，`/quality/8d/ws/` 仍作为后续接入预留路径，不是本次改造的实际依赖

当前验证结论：

- 已在当前远端部署环境完成实测：`/quality/8d/graph` 页面可正常打开并加载图谱，NeoVis 已按浏览器专用 Bolt 配置生效
- 当前前端生产构建已确认包含 `VITE_NEO4J_BROWSER_*` 对应的浏览器侧 Neo4j 连接配置
- 该结论的前提是“访问页面的浏览器本身可以连通配置中的 Bolt 端点”；因此 Django 若部署在其他网络环境，仍需以浏览器到 Bolt 的真实可达性作为最终准入条件

这样可以做到：

- 用户感知为主项目一个菜单功能
- URL 结构统一
- 主题、头部、返回链路可保持一致
- 不破坏当前前端 SPA 结构

### 4.2 后端集成方式

推荐 Django 通过内部 API 或网关调用 8D 子系统，不直接 import 8D 应用代码。

不建议：

- Django 直接复用 FastAPI 路由层代码
- Django 直接操作 8D 内部模型或服务对象
- Django 直接接入 Neo4j、MinIO、Celery 内部实现

---

## 5. 认证与权限方案

这是整个集成里最优先要收口的事情。

### 5.1 推荐方案

Django 登录后，为 8D 子系统签发短时内部访问凭证，8D 服务只信任 Django 的身份。

凭证建议包含：

- `user_id`
- `username`
- `display_name`
- `role`
- `org_id`
- `project_scope`
- `source_system`
- `exp`

### 5.2 目标状态

- 用户只登录一次
- 8D 不再维护独立登录页与独立账号闭环
- 8D 内部 owner、operator、audit 字段统一使用 Django 用户身份

### 5.3 需要收口的问题

- 去掉系统用户占位写入逻辑
- 统一 owner_id 来源
- 明确管理员、普通用户、项目管理员等角色映射
- 明确跨组织、跨项目的数据访问边界
- 审计日志统一记录主项目用户身份

### 5.4 当前状态

- 方案已明确：不新增平行登录体系，而是在 integration facade 上接 Django 内部凭证
- 已完成：`upload_user_id`、节点默认 `owner_id`、`audit_log.user_id` 已收敛到 Bearer token 映射出的真实 Django 用户
- 已完成：facade 当前以 Bearer claims 为主身份源；`operator_id`、`org_id`、`requested_by` 只作为兼容性冗余字段保留，并要求与 token 一致

---

## 6. 接口边界建议

不要让 Django 直接调用当前所有内部接口，当前已冻结的主项目接入入口统一为：

- `/api/v1/integration/8d/documents`
- `/api/v1/integration/8d/documents/{doc_id}`
- `/api/v1/integration/8d/documents/{doc_id}/pipeline`
- `/api/v1/integration/8d/documents/{doc_id}/pipeline/cancel`
- `/api/v1/integration/8d/documents/{doc_id}/pipeline/retry`
- `/api/v1/integration/8d/documents/{doc_id}/result`
- `/api/v1/integration/8d/documents/{doc_id}/graph`

### 6.1 Django 需要对接的最小能力接口

#### 文档能力

- 创建上传任务
- 查询文档列表
- 查询文档详情
- 删除文档

#### 任务能力

- 触发抽取
- 查询任务状态
- 重试任务
- 取消任务

#### 结果能力

- 获取抽取结果摘要
- 获取实体明细
- 获取子图数据
- 获取原文片段回溯

### 6.2 外部业务键要求

所有文档和任务都应支持以下外部追踪字段：

- `source_system`
- `source_module`
- `source_record_id`
- `source_record_type`
- `operator_id`
- `tenant_id` 或 `org_id`

目的：

- 支持主项目回查
- 支持幂等重试
- 支持按业务来源过滤
- 支持问题排查与审计

---

## 6.3 Django 接入契约补充

这部分是基于当前 Skill-first 改造后的新增约束。

结论先说：

- Django 不应直接依赖当前内部 `/documents/{doc_id}/extraction` 聚合 DTO 作为长期契约
- Django 只依赖 integration facade 返回的稳定结果模型
- Django 不应再假设 runtime 会根据 `owner_name`、`reporter_name`、单一候选实体自动补业务边

### 6.3.1 调用契约

推荐 Django 侧只调用以下 facade：

- `POST /api/v1/integration/8d/documents`
- `GET /api/v1/integration/8d/documents`
- `GET /api/v1/integration/8d/documents/{doc_id}`
- `POST /api/v1/integration/8d/documents/{doc_id}/pipeline`
- `GET /api/v1/integration/8d/documents/{doc_id}/pipeline`
- `POST /api/v1/integration/8d/documents/{doc_id}/pipeline/cancel`
- `POST /api/v1/integration/8d/documents/{doc_id}/pipeline/retry`
- `GET /api/v1/integration/8d/documents/{doc_id}/result`
- `GET /api/v1/integration/8d/documents/{doc_id}/graph`

其中：

- `documents` 负责上传、来源键、幂等和主项目回查
- `pipeline` 负责任务触发和状态轮询
- `result` 负责抽取结果只读视图
- `graph` 负责图谱展示所需子图

### 6.3.2 Django 发起请求时必须携带的字段

除认证 token 外，上传时至少应带：

- `source_system`
- `source_module`
- `source_record_id`
- `source_record_type`

身份字段当前以 token 为主：

- `operator_id` 可不传；若传则必须与 token 主体一致
- `org_id` 可不传；若传则必须与 token 中的组织一致
- `requested_by` 可不传；若在触发任务时传入，则必须与 token 主体一致

如主项目需要项目域隔离，再附加：

- `project_id`
- `project_scope`

这些字段应被视为 integration facade 的强约束，而不是可有可无的透传字段。

列表接口当前查询参数为：

- `source_system`
- `source_module`
- `source_record_id`
- `source_record_type`
- `offset`
- `limit`

当前不是 `page` / `page_size` 分页。

### 6.3.3 Django 对返回结果的解释约束

Skill-first 改造后，Django 侧必须按以下方式解释结果：

- `relationships` 中出现的边，才视为已经被系统确认的业务关系
- 某条边不存在，应解释为“未显式抽出或证据不足”，而不是“8D 后端稍后会自动补齐”
- `owner_name`、`reporter_name`、`supplier_name` 这类原始字段只能视为原文线索，不能替代正式关系
- `ActionItem -> RESPONSIBLE_ORG -> Organization` 必须依赖显式关系，不再根据 `owner_name` 自动生成
- `EightDReport -> RESPONSIBLE_ORG -> Organization` 也应以显式关系为准，不能把封面公司、抬头公司默认当责任主体
- `ProductEvent -> RELATED_FAILURE_MODE -> FailureMode`、`CauseItem -> RELATED_FAILURE_MODE -> FailureMode`、`PartSerial -> SUPPLIED_BY -> Organization`、`PartSerial -> INSTALLED_ON -> ProductInstance`、`ActionItem -> VERIFIES_CAUSE -> CauseItem` 都必须以显式关系为准
- `ROOT_CAUSE` 只在关系明确存在，或节点具备稳定根因信号时才可视为闭环，不应对所有 `CauseItem` 默认上升为根因

### 6.3.4 Django 最好消费的返回模型

对 Django 来说，结果页和状态页最稳定的消费模型应拆成三层：

1. 文档层：`doc_id`、来源键、上传状态、最近一次 `run_id`
2. 任务层：`status`、`current_stage`、`finished_at`、`error`、`trace_id`
3. 结果层：`entities`、`relationships`、`stats`、`schema_version`、`extraction_version`

其中结果层建议由 integration facade 再做一次外部收敛：

- 对 Django 固定返回 `entities[] + relationships[] + stats`
- 不要求 Django 识别内部所有节点列表分桶细节
- 不要求 Django 根据裸字段自行重建图关系

### 6.3.5 任务成功的含义

`pipeline.status=succeeded` 仅表示处理流程成功完成，不等于“所有业务关系都已抽全”。

Django 侧应区分：

- `not_started`：当前文档还没有 run
- `pending` / `running`：任务已排队或处理中
- `succeeded`：任务完成，但结果仍可能是保守抽取
- `failed`：任务失败，读取 `error` 与 `trace_id`
- `cancelled`：用户主动取消；当前对外单独暴露，不再混同于普通失败

状态接口同时返回：

- `cancellable`：是否允许调用 cancel
- `retryable`：是否允许调用 retry
- `error`：标准错误对象，包含 `code`、`message`、`cancelled`、`retryable`、`detail`

不要把“缺少某条关系”直接当成系统故障。

### 6.3.6 integration facade DTO 草案

为了避免 Django 直接绑定内部 extraction 聚合结构，建议 facade 对外只暴露一套稳定 DTO。

#### A. 上传文档

请求：`POST /api/v1/integration/8d/documents`

```json
{
  "source_system": "django-main",
  "source_module": "quality_issue",
  "source_record_id": "QI-2026-000123",
  "source_record_type": "quality_issue",
  "operator_id": "u-1001",
  "org_id": "org-suzhou",
  "project_id": "proj-ep2002",
  "idempotency_key": "django-main:quality_issue:QI-2026-000123:8d-upload:v1",
  "file_name": "8D报告.docx",
  "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}
```

响应：

```json
{
  "doc_id": "8b4c1b4f-8d31-44f2-bc1d-09f47a3d4f82",
  "status": "uploaded",
  "duplicate_of_doc_id": null,
  "source_ref": {
    "source_system": "django-main",
    "source_module": "quality_issue",
    "source_record_id": "QI-2026-000123",
    "source_record_type": "quality_issue"
  },
  "created_at": "2026-06-02T06:30:00Z"
}
```

补充语义：

- 如果 `idempotency_key` 与 `source_system + source_module + source_record_id + source_record_type + org_id` 同时命中已有文档，接口会直接返回已有 `doc_id`，HTTP 200
- 如果文件 `sha256` 已存在，也会直接返回已有文档，HTTP 200
- 同源幂等不是全局 `idempotency_key` 去重，Django 不应跨来源复用同一个 key 期待命中同一文档

#### B. 触发任务

请求：`POST /api/v1/integration/8d/documents/{doc_id}/pipeline`

```json
{
  "force": false,
  "requested_by": "u-1001"
}
```

响应：

```json
{
  "run_id": "c2b709a6-9155-4a4c-b1b0-8e6fa0c7fb36",
  "doc_id": "8b4c1b4f-8d31-44f2-bc1d-09f47a3d4f82",
  "status": "queued",
  "accepted_at": "2026-06-02T06:31:00Z"
}
```

补充语义：

- 若最近一次任务仍处于 `pending` / `running` 且 `force=false`，接口会直接复用已有 `run_id`，不会重复排队
- 正常新排队时，返回 `status="queued"`

#### C. 任务状态

响应：`GET /api/v1/integration/8d/documents/{doc_id}/pipeline`

```json
{
  "doc_id": "8b4c1b4f-8d31-44f2-bc1d-09f47a3d4f82",
  "run_id": "c2b709a6-9155-4a4c-b1b0-8e6fa0c7fb36",
  "status": "running",
  "current_stage": "llm_extracting",
  "started_at": "2026-06-02T06:31:01Z",
  "finished_at": null,
  "trace_id": "92a2bf4d-0e8c-4d19-8fc1-1521d95ce5b5",
  "cancellable": true,
  "retryable": false,
  "error": null
}
```

#### D. 取消任务

请求：`POST /api/v1/integration/8d/documents/{doc_id}/pipeline/cancel`

响应：

```json
{
  "run_id": "c2b709a6-9155-4a4c-b1b0-8e6fa0c7fb36",
  "doc_id": "8b4c1b4f-8d31-44f2-bc1d-09f47a3d4f82",
  "status": "cancelled",
  "accepted_at": "2026-06-02T06:35:00Z",
  "message": "pipeline cancelled"
}
```

#### E. 重试任务

请求：`POST /api/v1/integration/8d/documents/{doc_id}/pipeline/retry`

响应：

```json
{
  "run_id": "d6d33b5d-59ad-48e7-84d9-5b3c4e65a2b0",
  "doc_id": "8b4c1b4f-8d31-44f2-bc1d-09f47a3d4f82",
  "status": "queued",
  "accepted_at": "2026-06-02T06:36:00Z",
  "message": "pipeline retry queued"
}
```

#### F. 结果摘要

响应：`GET /api/v1/integration/8d/documents/{doc_id}/result`

```json
{
  "doc_id": "8b4c1b4f-8d31-44f2-bc1d-09f47a3d4f82",
  "run_id": "c2b709a6-9155-4a4c-b1b0-8e6fa0c7fb36",
  "schema_version": "v0.1.0",
  "extraction_version": "pipeline-v0.1.0",
  "stats": {
    "entity_count": 15,
    "relationship_count": 15,
    "low_confidence_count": 0
  },
  "entities": [
    {
      "entity_id": "FS-2024-001",
      "entity_type": "EightDReport",
      "title": "EP2002 阀门出厂测试密封面泄漏",
      "business_key": "FS-2024-001",
      "confidence": 0.98,
      "supporting_chunks": ["FS-2024-001#full_document#0"],
      "attributes": {
        "report_no": "FS-2024-001",
        "issue_title": "EP2002 阀门出厂测试密封面泄漏"
      }
    }
  ],
  "relationships": [
    {
      "from_id": "FS-2024-001",
      "from_type": "EightDReport",
      "rel_type": "ROOT_CAUSE",
      "to_id": "CAU-FS-2024-001-1",
      "to_type": "CauseItem"
    }
  ]
}
```

这里的关键约束是：

- facade 只返回显式关系，不为 Django 额外脑补隐式边
- `attributes` 可以承载原始字段，但这些字段不替代 `relationships`
- Django 若需要展示“责任组织 / 供应商 / 根因 / 验证措施”，必须以 `relationships` 为准

#### G. 图谱视图

响应：`GET /api/v1/integration/8d/documents/{doc_id}/graph`

```json
{
  "doc_id": "8b4c1b4f-8d31-44f2-bc1d-09f47a3d4f82",
  "nodes": [
    {
      "id": "FS-2024-001",
      "label": "EightDReport",
      "title": "EP2002 阀门出厂测试密封面泄漏"
    }
  ],
  "edges": [
    {
      "source": "FS-2024-001",
      "type": "ROOT_CAUSE",
      "target": "CAU-FS-2024-001-1"
    }
  ],
  "meta": {
    "truncated": false,
    "node_count": 15,
    "edge_count": 15
  }
}
```

#### H. 设计原则

- DTO 必须稳定、扁平、可直接由 Django 序列化后转给页面
- facade 对外暴露的 `entity_type` / `rel_type` 应与图展示一致，但不要求 Django 理解内部所有 schema 子类型
- `trace_id`、`doc_id`、`run_id`、`source_record_id` 必须能在 Django 与 8D 两侧串起来
- 若未来内部 extraction DTO 调整，优先在 facade 内部适配，不要把变更直接抛给 Django

### 6.3.7 入图前人工审核流程

与 Django 合并后，推荐把当前“抽取后直接入图”的链路调整为“抽取后生成候选图，人工审核后再入图”。正式流程应为：

```text
抽取 -> 生成候选图 Draft -> 返回 Django 审核 -> Django 修改/确认 -> 8D-kg 入图 -> 审计留痕
```

这里的候选图建议命名为 `GraphDraft` 或 `ExtractionReviewDraft`。它是抽取结果的可审核结构化快照，不是生产图谱写入指令。

关键边界：

- Django 负责展示、审核、修改、确认候选实体和关系
- Django 返回的是审核后的候选图 JSON，不直接写 Neo4j
- 8D-kg 负责接收审核结果、重新校验、生成 commit plan、幂等写图和审计留痕
- 所有入图仍必须满足 schema / ontology、关系端点、溯源字段、权限和幂等约束

建议状态机：

```text
extracting
  -> draft_created
  -> pending_review
  -> review_submitted
  -> validating
  -> ready_to_commit
  -> committing
  -> committed
```

旁路状态：

```text
rejected
validation_failed
superseded
commit_failed
```

一期建议最小 review facade：

- `GET /api/v1/integration/8d/documents/{doc_id}/graph-draft`
- `POST /api/v1/integration/8d/documents/{doc_id}/graph-draft/save`
- `POST /api/v1/integration/8d/documents/{doc_id}/graph-draft/submit`
- `POST /api/v1/integration/8d/documents/{doc_id}/graph-draft/commit`

建议 `GraphDraft` 至少包含：

```json
{
  "draft_id": "uuid",
  "doc_id": "uuid",
  "run_id": "uuid",
  "status": "pending_review",
  "draft_version": 1,
  "schema_version": "v0.1.0",
  "extraction_version": "pipeline-v0.1.0",
  "entities": [],
  "relationships": [],
  "evidence": [],
  "warnings": []
}
```

Django 提交审核结果时，应带 `draft_id`、`base_version`、`review_decision`、`review_comment`、`entities[]`、`relationships[]`。`base_version` 用于乐观锁，避免多人审核互相覆盖。

8D-kg 在 commit 前必须重新校验：

- `base_version` 是否匹配
- `entity_type` / `rel_type` 是否在 ontology 白名单
- 关系两端实体是否存在，端点类型是否合法
- 必填属性、业务键、置信度、review action 是否合法
- `supporting_chunks` 是否属于当前文档
- 溯源字段是否完整且未被伪造
- 当前用户是否具备 submit / commit 权限
- 是否存在重复实体、重复边或破坏幂等写图的修改

校验通过后，8D-kg 不应直接把 Django JSON 写入图数据库，而应先生成 `GraphCommitPlan`，再执行：

1. 计算原始 draft、审核后 draft、最终 commit plan 的 diff
2. 写入 review snapshot、commit snapshot 和 audit log
3. 使用 `MERGE` 幂等写 Neo4j
4. 写入 `MENTIONED_IN` 双向溯源边
5. 更新 document / run / draft 状态为 `committed`

一期 UI 可以先由 Django 做表格式审核，不必一开始实现复杂图编辑器：实体表、关系表、证据片段只读展示、校验错误定位到行即可满足联调闭环。

### 6.4 当前状态

- 已完成：`/api/v1/integration/8d/documents`
- 已完成：`/api/v1/integration/8d/documents/{doc_id}/pipeline`
- 已完成：`/api/v1/integration/8d/documents/{doc_id}/pipeline/cancel`
- 已完成：`/api/v1/integration/8d/documents/{doc_id}/pipeline/retry`
- 已完成：`/api/v1/integration/8d/documents/{doc_id}`
- 已完成：`/api/v1/integration/8d/documents/{doc_id}/result`
- 已完成：`/api/v1/integration/8d/documents/{doc_id}/graph`
- 已完成：稳定 DTO 与契约测试已落地
- 已完成：认证映射、同源幂等、失败/取消/重试状态语义已对齐到 facade
- 已完成：来源键与 `idempotency_key` 已完成数据库落库与迁移
- 待完成：Django 视角 e2e 仍需补齐

---

## 7. 更强折中的核心实现方向

### 7.1 第一层：运行时独立

保持当前 8D 子系统为独立服务，不并入 Django 进程。

价值：

- 故障域隔离
- 资源隔离
- 异步任务与图存储不污染主项目
- 可单独扩容和发布

### 7.2 第二层：接入门面独立

在 8D 服务内部新增主项目接入层，对 Django 暴露稳定接口，不让主项目直接穿透内部路由。

价值：

- 对外契约稳定
- 内部实现可继续演进
- 主项目升级成本可控

### 7.3 第三层：逐步抽领域内核

将 8D 内部真正可复用的能力逐步抽为稳定领域层，例如：

- 文档处理编排
- 抽取流程 orchestration
- 图谱写入协调
- 查询拼装
- 业务规则与 schema 归一

未来即便要更深度融合，也应共享这一层，而不是共享 FastAPI 入口、ORM 细节或 Celery 任务实现。

---

## 8. 当前后端是否足够强壮

### 8.1 当前已有基础

当前后端已经具备以下基础能力：

- 独立 FastAPI 入口
- 生命周期初始化与依赖探活
- 异步任务触发与状态记录
- 图谱查询接口
- 基础健康检查
- 上传、抽取、图写入相关测试覆盖

这说明它可以作为“内部能力服务”存在。

### 8.2 当前仍然不足的地方

如果要成为 Django 主项目长期依赖的子系统，还需要补足以下工程能力：

- 认证与用户身份统一
- 对外契约收敛与冻结
- 面向主项目的幂等键设计
- 任务状态机标准化
- 失败恢复与补偿机制清晰化
- 集成契约测试补齐
- 接口文档与实际实现对齐

### 8.3 结论

当前状态：

- 作为内部子服务，可接入
- 作为主项目强依赖能力，必须先硬化

换句话说，现在不是不能接，而是不能“原样接入后长期放养”。

### 8.4 基于当前仓库的工程判断

结合现有实现，当前后端已经具备“可被主项目接入”的基础，但还没有达到“可以直接作为平台级稳定能力长期绑定”的状态。

当前可作为正向依据的点：

- 已有独立 FastAPI 应用入口、生命周期管理和依赖探活
- 已有 PostgreSQL、Neo4j、Redis、MinIO 的健康检查
- 已有抽取任务异步触发与状态记录
- 已有上传接口、查询接口、图接口和基础错误返回
- 已有上传、任务、图写入、真实链路相关测试

当前需要重点加固的点：

- 认证体系仍未与 Django 用户体系打通
- 外部接口尚未收敛为“主项目接入面”
- 文档契约与真实接口需要进一步对齐
- 主项目视角的幂等键和来源键尚未统一设计
- 任务完成后的主项目协同机制还未明确
- 集成契约测试仍偏少，更多是子系统自测

### 8.5 对“更强折中”的可行性判断

“更强折中”是可行的，但建议按以下原则推进：

- 先做运行时隔离，再做代码层抽离，不要反过来
- 先冻结接入契约，再逐步抽内核，不要一边集成一边改接口
- 先统一身份和业务键，再谈主项目深度编排
- 先保证主项目可用，再追求内部结构完美

如果不按这个顺序推进，常见后果是：

- Django 先接了很多内部接口，后续一改就牵一片
- 用户和权限逻辑在两个系统里各做一半
- 失败重试和主项目业务状态回写逻辑越来越乱
- 最终既没有真正独立服务，也没有真正统一平台

### 8.6 基于当前阶段的结论

当前可以给出更明确的工程判断：

- 这套方案已经具备“高可复用、可持续迁移”的基础
- 复用的主要对象应是 `Skill Pack + integration facade DTO`，而不是 HTTP 内部实现细节
- 后续如果有新的主项目接入，应优先复制这套 workflow，而不是重新设计一版集成策略

---

## 9. 必须完成的收口事项

以下事项建议作为一期硬性收口项。

### 9.1 认证与身份收口

- 接入 Django 统一身份
- 去除系统占位用户逻辑
- 统一 owner_id、operator_id、audit_user_id 的来源
- 明确角色映射与权限边界

### 9.2 接口收口

- 新增主项目专用 integration API
- 禁止 Django 直接依赖内部业务路由
- 统一错误码、状态码、响应结构
- 冻结最小可用接口集
- 冻结外部结果 DTO，避免 Django 直接绑定内部 extraction 聚合结构
- 明确“显式关系优先”语义，禁止主项目依赖 runtime 自动补边

### 9.3 任务模型收口

- 明确任务状态机：pending、running、succeeded、failed、cancelled、retryable
- 明确每个状态的前端展示语义
- 明确重试、取消、补偿逻辑
- 明确 Django 是否需要回调机制

### 9.4 幂等与业务键收口

- 支持主项目业务来源键
- 支持同源请求幂等识别
- 支持重复上传与重复触发的外部语义定义
- 支持按主项目单据回查 8D 文档与任务

### 9.5 文档与契约收口

- 对齐 API 文档与真实实现
- 补充主项目接入说明
- 补充鉴权与权限约定
- 补充错误处理与回调说明

### 9.6 测试收口

- 新增 integration API 契约测试
- 新增认证映射测试
- 新增幂等测试
- 新增任务失败与重试测试
- 新增 Django 视角的端到端测试

### 9.7 前端与接入体验收口

- 统一子路径 base path
- 统一静态资源路径和刷新路由行为
- 统一 WebSocket 接入路径
- 统一页面头部、返回链路、面包屑与主题
- 明确哪些页面由 Django 承担，哪些页面由 8D SPA 承担

### 9.8 运维与发布收口

- 明确 Django 与 8D 的部署边界
- 明确网关或 Nginx 的反向代理规则
- 明确两个系统的发布顺序与回滚策略
- 明确配置项归属：谁维护 token、网关、回调地址、外部来源映射
- 明确故障排查入口：日志、trace_id、任务 ID、业务单据号如何串联
- 联调前完成 PostgreSQL / Neo4j / MinIO 凭证预检，避免把环境认证失败误判为接口故障

---

## 10. 可后补但应规划的事项

这些不是一期阻塞项，但建议纳入后续规划。

### 10.1 观测性增强

- 统一 trace_id 贯通 Django 与 8D 子系统
- 增加任务队列监控
- 增加 LLM 调用监控与报警
- 增加 Neo4j/Redis/MinIO 慢查询或异常统计

### 10.2 回调或事件机制

如果主项目需要在任务完成后自动更新业务状态，可增加：

- HTTP 回调
- 事件总线
- 主项目轮询适配器

### 10.3 领域内核抽离

未来可将以下能力逐步收敛为内部稳定领域层：

- pipeline orchestration
- entity normalization
- graph write service
- query assembly

### 10.4 Django 侧增强能力

未来如主项目需要更深度融合，可逐步增加：

- 主项目发起任务后的业务状态联动
- 抽取完成后的业务对象自动挂接
- 基于主项目项目/客户/工单上下文的默认过滤
- 统一消息中心或站内通知
- 统一审计平台或统一操作日志查询入口

### 10.5 多知识类型与 ontology 管理

未来如果主项目需要把设备手册、工艺规范、故障案例、检验记录等其他知识文档也纳入知识图谱，应提前规划以下能力：

- 文档类型管理：用 `document_type_code` 区分 8D 报告和其他知识文档
- ontology / schema 版本管理：节点、关系、属性、业务键和溯源字段必须版本化
- extraction profile 管理：每类文档对应 reader、splitter、table extractor、Skill Pack、字段归一化和写图校验配置
- Draft / Publish 流程：草稿必须经过 validate、dry-run、人工审核后才能发布
- Codex 辅助建模：Codex 可以生成和修复草稿，但不能直接改生产图谱或绕过审核发布
- facade 兼容：Django 仍只消费稳定 `entities[] + relationships[] + stats` 结果，不直接绑定内部 extraction DTO

建议把这部分规划作为二期到三期之间的独立工作包推进，不要和一期 Django 接入收口混在同一个发布目标中。

---

## 11. 分阶段落地建议

### 阶段一：可用接入

目标：在不破坏现有功能的前提下接入 Django 主项目。

建议完成：

- Django 菜单与入口打通
- 子路径反向代理
- Django 到 8D 的内部鉴权
- integration API 最小集
- 文档上传、任务查看、结果查看、图谱查看全链路打通
- 用户身份、组织信息、业务来源键可以传入 8D
- 日志中至少能用 trace_id 或 task_id 串联主项目与 8D 请求
- integration facade 已明确“显式关系优先”的返回语义，Django 不依赖 runtime 补边
- 抽取后先形成 `GraphDraft` 候选图，Django 审核确认后再由 8D-kg 校验并入图

### 阶段二：工程硬化

目标：让 8D 真正成为主项目可依赖的稳定子能力。

建议完成：

- 统一业务键与幂等策略
- 接口契约冻结
- 失败恢复与补偿机制完善
- 契约测试补齐
- 监控、日志、链路追踪补齐
- 形成明确的状态机文档和回调/轮询策略文档
- 形成可演练的异常处理手册
- 完善 GraphDraft 审核状态机、版本锁、校验错误结构、commit snapshot 和审计留痕

### 阶段三：代码层增强折中

目标：为未来更深层复用做准备，但不破坏运行时隔离。

建议完成：

- 抽离领域内核
- 降低 HTTP 层与业务层耦合
- 形成内部 SDK 或稳定 service facade
- 评估是否有必要将部分同步查询能力提供给 Django 以 SDK 方式复用

### 11.4 阶段四：多知识类型平台化

目标：把当前 8D 专用能力升级为可承载多类知识文档的 schema-first 入图平台。

建议按以下顺序推进：

1. 先把当前 8D 能力整理成第一套 `ontology spec + extraction profile`，不改变现有业务行为。
2. 再增加 Django 侧 Draft / Publish 管理入口，让 Django 可以创建和审核文档类型、ontology、extraction profile 草稿。
3. 然后接入 Codex 辅助生成、检查和修复草稿，但所有结果必须进入草稿和审核流程。
4. 最后让生产 pipeline 按 `document_type_code + published_profile_version` 执行，并保持 facade DTO 对 Django 稳定。

验收标准：

- `8d_report` 作为第一种文档类型继续稳定运行
- 新文档类型可以先 dry-run，再发布进入生产执行
- Django 不直接操作 Neo4j、内部 extraction DTO 或生产 schema
- 每次 schema / ontology 变更都有版本、发布人、发布时间、验证记录和回滚策略

### 11.5 当前推荐工作流

结合当前落地情况，建议后续严格按下面的工作流推进。

#### A. 接入工作流

- Django 只接 `integration facade`
- Django 不直接调用内部 `/documents`、`/extract`、`/graph` 等散装接口
- Django 页面只消费 facade DTO，不根据原始字段重建隐式关系

#### B. 抽取工作流

- 抽取新需求优先判断是否属于 Skill 变更
- 章节判断、关系判定、角色归因、保守策略优先改 Skill
- schema、白名单、兼容修复、去重闭合、写图治理才改 runtime

#### C. 变更工作流

- 改 Skill：同步改 skill 模板、fixture、回归测试
- 改 facade：同步改 DTO 文档、契约测试、主项目类型定义
- 改 runtime：保持最小化，避免把业务判断重新塞回 Python 推断层

#### D. 联调工作流

- 先做环境端口与凭证预检，再联调接口
- 先打通上传 → pipeline → result/graph 最小闭环，再挂主项目页面
- 认证问题、契约问题、抽取问题、基础设施问题分开定位

#### E. 复用工作流

- 跨项目优先复用 Skill Pack 与 facade DTO
- 不优先复制 pipeline 代码到新项目
- 新主项目应复用接入门面，而不是复用内部实现细节

---

## 12. 一期必须完成清单（P0）

以下事项未完成前，不建议将其定义为“已完成主项目接入”：

- Django 登录态能够无缝进入 8D 子功能，无二次登录
- 8D 能识别并记录 Django 用户身份
- 能通过主项目业务键创建、查询和回查 8D 文档/任务
- 上传、抽取、入图、结果展示链路在集成环境中至少成功一次
- 失败任务可定位、可重试、可查看错误信息
- integration API 形成最小稳定集合并有文档
- 网关、静态资源、WebSocket 子路径全部验证通过
- 至少存在一条 Django 视角的联调或端到端验证记录

---

## 13. 最终建议

推荐路线如下：

1. 不直接把 8D 项目代码嵌入 Django 进程。
2. 采用“Django 统一入口 + 8D 独立服务 + integration API 接入门面”的方案。
3. 一期先完成可用接入和关键收口。
4. 二期完成工程硬化。
5. 三期再做领域内核抽离，形成更强的长期折中形态。

这是当前最稳、最快、后续返工最少的方案。

---

## 14. 一期交付清单

建议按以下清单作为一期是否可上线的判断标准：

- Django 菜单入口可访问 8D 子功能
- 用户无需二次登录
- 文档上传成功
- 抽取任务可触发并可查看状态
- 图谱结果可回看
- 错误能回传到主项目或统一日志体系
- 主项目可以根据业务单据回查 8D 处理结果
- 接口文档、认证方式、错误码说明齐全
- 至少有一条主项目接入视角的端到端测试通过

如果以上没有完成，不建议认为“已经完成主项目集成”。

---

## 15. 收口完成定义

为了避免“看起来接上了，但后面长期返工”，建议把收口完成定义明确下来。

### 15.1 业务层完成定义

- 主项目用户可以从固定入口进入 8D 子功能
- 上传、抽取、结果查看、图谱查看均可使用
- 主项目业务单据可以关联 8D 文档和任务
- 失败时主项目侧可以知道失败原因或至少知道去哪里查

### 15.2 技术层完成定义

- 认证方式固定，不存在双登录或双用户来源
- 接入接口固定，主项目不调用 8D 内部散装接口
- 子路径、静态资源、WebSocket、回跳路径全部稳定
- 接口文档、错误码、状态机说明一致
- 至少具备一套稳定的日志与 trace 串联方式

### 15.3 工程层完成定义

- 发布方案明确，知道谁先发、谁后发、谁回滚
- 故障排查路径明确，知道查 Django、8D API、Celery、Neo4j 还是 MinIO
- 验证方案明确，知道上线前跑什么测试、联调检查哪些点
- 接入边界明确，知道未来新增需求由 Django 做还是由 8D 做

只有业务层、技术层、工程层三层都闭环，才算真正完成“更强折中”的收口。

---

## 16. Django 侧知识库图谱构建重构实施清单

> 本节为 **Django 工程师落地清单**，与第一次对齐会冻结项一一对应。  
> BFF 路由与 facade 字段对照见同目录 [`API 1.md`](API%201.md) **§2.2**。  
> 职责分工见 [`Django与8D职责拆分清单 2.md`](Django%E4%B8%8E8D%E8%81%8C%E8%B4%A3%E6%8B%86%E5%88%86%E6%B8%85%E5%8D%95%202.md)。

### 16.1 第一次对齐会议程 — 覆盖矩阵

**结论：议程项均已纳入本节实施清单，但绝大多数尚未「完成」；仅少数在仓库中已有初版实现。**

| 议程项 | 本节章节 | 仓库现状 | 目标状态 |
|--------|----------|----------|----------|
| **冻结接入路径** `/quality/8d/`、`/api/`、`/ws/` 预留 | §16.4.8 | `docker_env/nginx` 未配置；Django 无该路由 | 待实施 `nginx-quality-8d` |
| **冻结认证** JWT claims + `KG_8D_JWT_*` | §16.4.1 | `kg_agent/auth/jwt_token.py` + settings 已有 | 联调验收；补 README 最小联调脚本 |
| **冻结来源字段**（含 `org_id`、`project_id`、`idempotency_key`） | §16.4.3 | `KgBuildJob` 部分字段；上传未接业务键；缺 `project_id` | 待 `SourceContext` + `build_job` 重构 |
| **冻结 facade** 仅 `/integration/8d/*` | 全文 | `EightDIntegrationClient` 已走 facade；KAG QA 仍独立 | 保持；禁止新增内部路由调用 |
| **冻结人审流程** GraphDraft → Django 审 → 8D 入图 | §16.5 | 无 BFF/UI | 待 `graph-draft-bff` + `graph-draft-ui` |
| **菜单 + 子路径代理** | §16.4.8、§16.4.8.1 | `/knowledge` 有；无 `/quality/8d` 菜单与代理 | 待 `menu-nav-8d` |
| **内部 JWT 签发** | §16.4.1 | 已实现 | 联调验收即可 |
| **业务页跳转** 8D 上传/任务/结果/图谱 | §16.4.8.1 | `onViewReport`/`onCreate8d` 仍为 toast | 待 `business-deep-links` |
| **facade DTO + API client/类型** | §16.4.2、§16.4.7 | `kgAgent.ts` 部分类型；无 `eightDIntegration.ts` | 待 `facade-dto-types` |
| **业务对象 → source_* 映射** | §16.4.3 | 默认 `knowledge:upload:{uuid}` | 待 issue/8d 入口接入 |
| **任务状态页** 五态展示 | §16.4.4、§16.4.7、§16.4.8.2 | Builder 内嵌；枚举未对齐 facade | 待 `task-status-page` |
| **GraphDraft 审核原型** | §16.5.2 | 无 | 待阶段二 |

### 16.2 仓库现状与主要缺口

Django 侧已有 app `backend/kg_agent`：

- HTTP 客户端：[`client/eight_d.py`](client/eight_d.py) → `/api/v1/integration/8d/*`
- JWT：[`auth/jwt_token.py`](auth/jwt_token.py)
- 本地影子表：[`models.py`](models.py) `KgBuildJob`
- BFF：[`views.py`](views.py) → `/api/kg-agent/build/*`、`/api/kg-agent/graph/*`

前端构建页：[`web/src/views/system/knowledge/components/KnowledgeGraphBuilder.vue`](../../web/src/views/system/knowledge/components/KnowledgeGraphBuilder.vue) + [`web/src/api/business/kgAgent.ts`](../../web/src/api/business/kgAgent.ts)。

| 缺口项 | 当前状态 |
|--------|----------|
| JWT + `KG_8D_JWT_*` | 已实现 |
| 来源字段 + `idempotency_key` | 模型有；上传默认随机键；缺 `project_id`、业务映射 |
| 任务状态 `pending/running/succeeded/failed/cancelled` | 本地为 `queued/success`；未透传 `cancellable`/`retryable` |
| 按 `source_record_id` 回查 | `list_documents` 误用 `page/page_size`（应为 `offset/limit`） |
| cancel / retry | 未实现 |
| GraphDraft | 未实现 |
| `/quality/8d/` | nginx 未配置 |
| `KgBuildJob` 迁移 | `migrations/` 仅 `__init__.py` |

```text
用户 → Django /api/kg-agent/* (BFF)
         → Bearer JWT → 8D /api/v1/integration/8d/*
前端构建/图谱 → kgAgent.ts → Django BFF（不直连 8D 内部 /documents、/extraction）
/quality/8d/*  → nginx 反代 8D SPA/API（与 Django BFF 并行）
```

### 16.3 实施待办（Checklist）

- [ ] **client-facade-fix** — 修复 `eight_d.py`（`offset/limit`、`get_document`、cancel/retry、`project_id`）；新增 `SourceContext`；重构 `build_job` 上传（`org_id` 来自 JWT 写入 job/幂等键）
- [ ] **status-model-migration** — `KgBuildJob` 状态对齐 facade；`makemigrations kg_agent`；`map_pipeline_status` + `BuildStatusView` 透传 `cancellable`/`retryable`/`error`
- [ ] **bff-endpoints** — `build/lookup/`、`build/by-source/`、`build/<pk>/cancel/`、`build/<pk>/retry/`、`build/<pk>/document/`
- [ ] **facade-dto-types** — `web/src/types/eightDIntegration.ts` 覆盖 facade DTO；`kgAgent`/`kgGraphDraft` 禁止引用 8D 内部 extraction 类型
- [ ] **menu-nav-8d** — 菜单：知识图谱构建 `/knowledge`、8D 子系统 `/quality/8d/`；不手改 `fixtures/` 除非授权，输出管理台配置说明
- [ ] **business-deep-links** — `web/src/utils/eightDNavigation.ts`；issue/8d-reports/knowledge 深链；替换 `KnowledgeGraph` 中 toast 占位
- [ ] **task-status-page** — 知识库「任务」Tab 或 `/knowledge/tasks/:jobId`；五态 + 取消/重试 + `build/lookup` 回查
- [ ] **frontend-build-phase1** — `KnowledgeGraphBuilder`：来源 query、五态、取消/重试
- [ ] **nginx-quality-8d** — `docker_env/nginx` 配置 `/quality/8d/`、`/api/`、`/ws/`
- [ ] **graph-draft-bff** — GraphDraft client/views/serializers + `KgBuildJob` 审核字段
- [ ] **graph-draft-ui** — 审核 Tab：实体表/关系表/证据/校验区
- [ ] **tests-docs-e2e** — 单元/集成测试 + Django 视角 E2E 联调记录

**实施顺序**：`client-facade-fix` → 状态/迁移 → BFF 端点 → 前端构建页 → 第一轮验收 → GraphDraft → 审核 UI。`nginx-quality-8d` 可与第一轮验收并行。

### 16.4 阶段一：第一轮联调闭环（P0）

#### 16.4.1 配置与 JWT

- 核对 `backend/conf/env.py`、`application/settings.py` 中 `KG_8D_BASE_URL`、`KG_8D_JWT_SECRET`、`KG_8D_JWT_ALGORITHM`、`KG_8D_JWT_TTL_SEC`。
- `kg_agent/README.md` 补充最小联调：JWT → health → upload → pipeline → poll → result/graph → `GET documents?source_record_id=`。

#### 16.4.2 8D Client（facade 契约）

文件：`client/eight_d.py`

- 修复 `list_documents`：`offset` / `limit`，支持 `source_record_type`。
- 新增：`get_document`、`cancel_pipeline`、`retry_pipeline`。
- 上传 multipart 可选 `project_id`；`operator_id` 不传。`org_id` 由 JWT 写入 `KgBuildJob` 并参与同源幂等键；若联调要求表单带 `org_id` 且与 token 一致再冗余透传（见 `Django token claims 对接约定 1.md`）。

#### 16.4.3 来源上下文与幂等键

新建 `services/source_context.py`：

| 场景 | source_module | source_record_type | source_record_id |
|------|---------------|-------------------|------------------|
| 知识库构建页 | `knowledge` | `knowledge_upload` | 请求传入或 `knowledge:upload:{uuid}` |
| 质量问题单 `/issues/:id` | `quality_issue` | `quality_issue` | 业务主键 |
| 8D 报告页 | `quality_8d` | `8d_report` | 报告 ID |

幂等键：`{source_system}:{source_module}:{source_record_id}:8d-upload:v1`

`create_build_job_from_upload` 从请求读取 `source_*`、`project_id`、`idempotency_key`；`KgBuildJob` 增加 `project_id`。

#### 16.4.4 任务状态机

- `KgBuildJob.Status`：`not_started`、`pending`、`running`、`succeeded`、`failed`、`cancelled`。
- 新增：`cancellable`、`retryable`、`error_detail`（JSON）。
- `BuildStatusView` 透传 facade 标准 `error` 对象。

#### 16.4.5 Django BFF 端点扩展

`urls.py` 在现有 `/api/kg-agent/` 下扩展（详见 `API 1.md` §2.2）：

| 方法 | 路径 | 作用 |
|------|------|------|
| GET | `build/lookup/` | 按 `source_*` 查 8D 文档 + 合并本地 job |
| GET | `build/by-source/` | 单业务键快捷回查 |
| POST | `build/<pk>/cancel/` | 代理 cancel |
| POST | `build/<pk>/retry/` | 代理 retry |
| GET | `build/<pk>/document/` | 代理文档详情 |

#### 16.4.6 数据库迁移

- 修改 `models.py` 后本地执行 `python manage.py makemigrations kg_agent` / `migrate`（禁止手改 `migrations/*.py`）。
- 旧状态映射：`queued→pending`、`success→succeeded`。

#### 16.4.7 前端（保持 `web/src/views/system/knowledge`）

- `kgAgent.ts`：来源字段、cancel/retry/lookup、五态轮询（含 `cancelled`、`succeeded`）。
- `KnowledgeGraphBuilder.vue`：状态区、取消/重试、路由 query 注入 `source_*`。
- `KnowledgeGraph/index.vue`：文档下拉展示 `source_record_id`；图谱仅走 `kg-agent`。
- i18n：`web/src/i18n/pages/knowledge/*.ts` 五态与操作文案。

#### 16.4.8 部署：`/quality/8d/` 子路径

`docker_env/nginx/` 增加：

- `/quality/8d/` → 8D 前端 SPA
- `/quality/8d/api/` → 8D API
- `/quality/8d/ws/` → WebSocket（预留）

Django BFF 仍为 `/api/kg-agent/`。

##### 16.4.8.1 菜单与业务页深链（`menu-nav-8d`、`business-deep-links`）

**菜单**（后台配置，不默认手改 fixtures）：

- 「知识图谱构建」→ `/knowledge`（Tab：构建 / 图谱 / 任务 / 审核）
- 「8D 知识库」→ `/quality/8d/`（8D SPA，经 nginx）

**深链**（拟建 `web/src/utils/eightDNavigation.ts`）：

| 场景 | Django 内链 | 8D SPA（子路径） |
|------|-------------|------------------|
| 上传 | `/knowledge?tab=builder&source_*=...` | `/quality/8d/upload?...` |
| 任务状态 | `/knowledge?tab=tasks&job_id=` | `/quality/8d/documents/{doc_id}` |
| 抽取结果 | BFF `build/{id}/result/` 驱动 UI | `/quality/8d/.../result` |
| 图谱 | `/knowledge?tab=graph&doc_id=` | `/quality/8d/graph?doc_id=` |

接入页：`report8d/index.vue`、`issues/*`、`KnowledgeGraph/index.vue`（`onViewReport` / `onCreate8d`）。

##### 16.4.8.2 任务状态页（`task-status-page`）

不单靠 Builder 内嵌进度：

- **方案 A（推荐）**：`knowledge/index.vue` 增加「任务」Tab，`kgBuildList` + 五态 + 跳转结果/图谱/审核。
- **方案 B**：独立路由 `/knowledge/tasks/:jobId`。
- 共用 `build/lookup` 按业务单据聚合。

#### 16.4.9 阶段一验收

1. 上传带完整 `source_*` + `idempotency_key`。
2. pipeline 轮询至 `succeeded` / `failed` / `cancelled`。
3. 获取 `result`（`entities`+`relationships`）与 `graph`（`nodes`+`edges`）。
4. `GET build/lookup?source_record_id=...` 回查成功。
5. `trace_id` 在 Django 与 8D 可串联。

### 16.5 阶段二：GraphDraft 人审链路

依赖 8D facade：`GET/POST .../graph-draft`（save / submit / commit）。

#### 16.5.1 后端 BFF

- `client/graph_draft.py`、`views/graph_draft.py`、`serializers/graph_draft.py`
- 路由：`build/<pk>/graph-draft/`、`.../save/`、`.../submit/`、`.../commit/`
- `KgBuildJob` 或 `KgGraphDraftReview` 记录 `draft_id`、`draft_version`、`review_status`、`committed_at`

#### 16.5.2 前端审核原型（`graph-draft-ui`）

组件 `KnowledgeGraphDraftReview.vue`（知识库 Tab）：

- 实体表、关系表、证据区（只读）、校验错误区
- 流程：save → submit → commit；`succeeded` 后引导进入审核

API：`web/src/api/business/kgGraphDraft.ts` + `web/src/types/eightDIntegration.ts`。

#### 16.5.3 阶段二验收

1. `succeeded` 后出现待审 draft。
2. Django 修改后 save/submit 成功。
3. 校验失败可定位；commit 后图谱可见。
4. 本地审计记录操作人。

### 16.6 明确不做

- Django 不 import 8D 进程代码、不直连 Neo4j/MinIO/Celery。
- 不以 KAG `build/extract/commit` 为主构建路径。
- 不手改 `migrations/*.py`、不默认手改 `fixtures/`。
- `schema_manager` 多知识类型平台化与本节解耦。

### 16.7 风险与依赖

- GraphDraft 完整验收依赖 8D `graph-draft` facade 就绪。
- 构建/预览用 8D facade；KAG QA 仍可能走 Neo4j，UI 需区分「构建图谱」与「问答子图」。
- 前端继续在 `web/src/views/system/**`（已授权改框架知识库页）。