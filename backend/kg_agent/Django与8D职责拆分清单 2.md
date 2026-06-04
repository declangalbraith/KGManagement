# Django 与 8D-kg 职责拆分清单

## 1. 文档目的

本文档用于明确在“Django 主项目 + 8D-kg 子系统”集成方案下，双方分别需要完成什么工作，避免出现边界不清、重复建设、互相等待或集成后返工。

适用场景：

- 作为实施前的分工底稿
- 作为联调前的检查清单
- 作为一期上线前的验收依据

---

## 2. 总体原则

### 2.1 Django 端负责什么

Django 端负责“主系统能力”，包括：

- 统一登录
- 主导航与入口
- 主项目上下文
- 权限前置
- 主项目业务对象与 8D 功能的挂接
- 主系统视角下的回查、跳转和展示整合

### 2.2 8D-kg 端负责什么

8D-kg 端负责“8D 能力闭环”，包括：

- 上传
- 抽取
- 异步任务编排
- 候选图生成
- 审核后入图
- 查询
- 图谱展示
- 子系统内部审计与状态管理

### 2.3 不应出现的情况

- Django 直接调用 8D 内部散装接口
- Django 直接依赖 8D 内部数据库结构
- Django 直接操作 Neo4j、MinIO、Celery 内部实现
- 8D-kg 单独维护一套与 Django 平行的用户体系
- 两边都各自实现一部分权限逻辑，导致边界撕裂

### 2.4 当前阶段判断

基于当前仓库改造进度，这份清单应按“`Skill-first + integration facade`”模式来执行，而不是按“Django 直接接 8D 内部接口”来执行。

当前已经形成的稳定方向是：

- Django 只接 `integration facade`
- 8D 内部抽取采用 `Skill-first`
- runtime 只保留 schema、白名单、兼容修复、去重闭合、写图治理等硬约束

这意味着：

- 这套方案已经具备较高复用性，适合跨项目复用 Skill Pack 与 facade DTO
- 后续新增抽取规则时，应优先改 Skill，而不是继续堆 runtime 业务推断
- Django 侧应保持“接入层稳定”，不要重新绑定内部 extraction 聚合结构

截至当前阶段，可认为“接入面收口”和“Skill-first 主方向”已经成立；`integration facade` 的 Bearer JWT 校验、基础用户映射和写入链路贯通已经落地，但“token claims 协议冻结 + Django 视角完整联调”仍是待收口项。

### 2.5 多知识类型演进原则

后续新增其他知识文档类型时，双方应沿用“Schema-first + Draft/Publish + Codex-assisted”模式，而不是让 Django 直接操作 8D 内部图谱实现。

基本分工如下：

- Django 负责文档类型管理入口、ontology / schema 草稿管理、审核发布入口、主项目权限和业务上下文
- 8D-kg 负责 schema 校验、extraction profile 校验、dry-run、发布固化、pipeline 执行、写图治理和 facade DTO 稳定
- Codex 负责辅助生成、解释、检查和修复草稿，不负责直接发布或直接写生产图谱

当前 8D 报告应被视为第一套已落地的 `document_type_code=8d_report`，后续其他知识类型应复用同一套生命周期。详细方案见根目录 `多知识类型Ontology与Codex辅助入图方案.md`。

---

## 3. Django 端需要做什么

## 3.1 入口与导航

### 必做项

- 在 Django 主项目中增加 8D 子功能入口
- 确定菜单位置、名称、权限可见性
- 确定从哪些业务页面可以跳入 8D 子系统
- 确定进入 8D 后的返回链路

### 需要产出

- 菜单配置
- 页面入口配置
- 回跳规则说明

### 验收标准

- 登录用户可以从主项目稳定进入 8D 子功能
- 从主项目业务对象页面可以正确跳入 8D 对应场景
- 用户使用完成后可以回到主项目原上下文

---

## 3.2 统一认证

### 必做项

- 提供 Django 登录态到 8D-kg 的身份传递方案
- 定义并签发短时内部访问 token 或等价凭证
- 明确 token 刷新、过期和失效策略
- 明确用户、角色、组织、项目范围等字段

### 建议传递字段

- `sub`
- `username`
- `role`
- `org_id`
- `exp`

当前推荐以以下字段作为一期冻结协议：

- 必填：`sub`、`username`、`role`、`org_id`、`exp`
- 选填：`preferred_username`、`name`、`user_id`、`uid`、`org_code`、`tenant_id`

补充约束：

- Django 应以 `sub` 作为当前用户的稳定主标识；8D 当前为了兼容迁移，仍接受 `user_id` / `uid` / `username` 作为回退读取字段，但这不应作为长期正式协议
- Django 应以 `org_id` 作为组织隔离主字段；`org_code` / `tenant_id` 仅作为兼容别名
- `project_scope`、`display_name`、`source_system` 可以继续保留在 Django 内部上下文中，但当前 8D 认证逻辑未将其作为凭证校验主字段
- `operator_id`、`requested_by` 不再应被 Django 视为身份真值来源；若仍随请求体传入，只能作为冗余字段，并且必须与 token 主体一致

当前状态：

- 已完成：8D integration facade 已要求 `Authorization: Bearer <token>`，并使用共享密钥 + 约定算法做 JWT 校验
- 已完成：8D 已可从 token 解析用户、角色、组织，并用于 integration API 的身份识别与组织级访问限制
- 已完成：8D 配置层已兼容 `KG_8D_JWT_SECRET / KG_8D_JWT_ALGORITHM / KG_8D_JWT_TTL_SEC`，可以与 Django 侧直接对齐配置名
- 待补充：token 过期、刷新、吊销策略仍需在 Django 与 8D 的联调文档中明确冻结

当前推荐双方统一使用的配置名：

- `KG_8D_JWT_SECRET`
- `KG_8D_JWT_ALGORITHM`
- `KG_8D_JWT_TTL_SEC`

### 需要产出

- Django 到 8D 的认证协议说明
- token 签发与校验规则
- 用户身份字段定义

### 验收标准

- 用户进入 8D 时无需二次登录
- 8D 能识别当前 Django 用户身份
- 用户身份、角色、组织范围在 8D 内可被正确解析

---

## 3.3 主项目业务上下文传递

### 必做项

- 明确哪些主项目业务对象需要挂接 8D 功能
- 定义外部业务键传入方式
- 明确哪些上下文字段在进入 8D 时需要自动带入

### 推荐上下文字段

- `source_system`
- `source_module`
- `source_record_id`
- `source_record_type`
- `project_id`
- `org_id`
- `operator_id`

### 需要产出

- 主项目到 8D 的上下文映射表
- 各入口页面的上下文传参规则

### 验收标准

- 8D 可以识别文档或任务来自哪个业务对象
- 主项目可以根据业务单据回查 8D 文档、任务和结果

补充约束：

- Django 在结果展示时，必须优先使用 8D 返回的显式 `relationships`
- Django 不应根据 `owner_name`、`reporter_name`、`supplier_name` 等原始字段自行脑补业务边

---

## 3.4 权限前置与业务可见性控制

### 必做项

- 明确哪些角色可进入 8D 子功能
- 明确哪些角色可以上传、查看、删除、重试任务
- 明确组织级、项目级、管理员级的权限前置策略
- 对主项目无权用户做入口拦截或隐藏

### 需要产出

- Django 侧权限矩阵
- 页面级权限说明
- 入口控制策略

### 验收标准

- 无权用户无法从主项目进入不应访问的 8D 页面
- 管理员与普通用户的入口、操作权限符合预期

---

## 3.5 网关与路径接入

### 必做项

- 配置子路径代理，例如 `/quality/8d/`
- 配置 API 代理，例如 `/quality/8d/api/`
- 配置 WebSocket 代理，例如 `/quality/8d/ws/`
- 确保 SPA 刷新、静态资源、深链接访问正常

### 需要产出

- Django/Nginx/网关配置
- 路由转发说明
- 子路径接入说明

### 验收标准

- 8D 前端在子路径下正常访问
- API 请求路径正常
- WebSocket 可连接
- 页面刷新不 404

---

## 3.6 主项目侧业务整合

### 必做项

- 决定主项目哪些页面需要显示 8D 处理状态
- 决定主项目是否展示 8D 任务摘要、图谱入口或结果链接
- 决定任务完成后主项目是否要联动业务状态

### 可选项

- 在工单详情中展示“8D 分析中/已完成/失败”
- 在项目页中增加 8D 文档统计入口
- 在通知中心展示 8D 任务完成提醒

### 验收标准

- 主项目用户可以在核心业务页面看到与 8D 相关的必要信息
- 跳转逻辑和上下文挂接一致

---

## 3.7 Django 端测试与验收

### 必做项

- 验证登录态传递
- 验证入口跳转
- 验证业务上下文传参
- 验证权限前置
- 验证子路径集成后的页面访问与刷新

### 验收标准

- 至少有一条 Django 视角的联调通过记录
- 至少有一条主项目入口到 8D 结果页的完整验证链路

---

## 3.8 多知识类型管理入口

### 必做项

二期以后，如果 Django 需要支持 8D 之外的其他知识文档入图，Django 端应提供以下管理入口：

- 文档类型列表与详情
- ontology / schema 草稿创建、编辑、复制、废弃
- extraction profile 草稿创建、编辑、复制、废弃
- 样例文档上传与 dry-run 验证入口
- 草稿审核、发布、回滚入口
- 文档类型与主项目业务对象的映射配置

### 需要产出

- `document_type_code` 命名规则
- Django 侧权限矩阵：谁能创建草稿、谁能审核、谁能发布、谁能废弃
- 草稿状态机：`draft / validating / ready_for_review / published / deprecated / rejected`
- 发布审计字段：发布人、发布时间、版本号、变更说明

### 验收标准

- Django 可以管理 schema / ontology 草稿，但不能绕过 8D-kg 校验直接进入生产执行
- 草稿必须通过 validate、dry-run 和人工审核后才能发布
- Django 页面能按 `document_type_code` 发起上传、筛选任务和展示结果
- Django 仍通过 facade DTO 消费结果，不直接依赖内部 extraction DTO 或 Neo4j 结构

---

## 3.9 抽取结果人工审核

与 Django 合并后的推荐主流程为：

```text
抽取 -> 生成候选图 Draft -> 返回 Django 审核 -> Django 修改/确认 -> 8D-kg 入图 -> 审计留痕
```

### 必做项

- Django 展示 8D-kg 返回的 `GraphDraft` 候选图
- Django 支持人工查看、修改、确认或驳回候选实体和关系
- Django 支持保存审核草稿，提交审核结果
- Django 提交时携带 `draft_id`、`base_version`、审核人、审核意见和修改后的 `entities[] / relationships[]`
- Django 不直接操作 Neo4j，不直接调用内部 writer，不把审核 JSON 当作生产图写入指令

### 建议一期审核界面

- 实体表：查看、修改、新增、删除候选实体
- 关系表：查看、修改、新增、删除候选关系
- 证据区：只读展示 supporting chunks 和原文片段
- 校验区：展示 8D-kg 返回的结构化错误，并定位到实体或关系行

### 需要产出

- Django 审核页面或审核 API client
- 审核草稿保存策略
- 审核提交 JSON 契约
- 审核人、审核意见、审核时间字段
- 校验失败后的修正与重新提交交互

### 验收标准

- Django 可以拉取候选图并展示实体、关系、证据
- Django 可以提交未修改或已修改的审核结果
- Django 提交后不直接入图，必须等待 8D-kg 校验和 commit
- 多人审核时不会覆盖他人的修改，至少支持 `base_version` 乐观锁

---

## 4. 8D-kg 端需要做什么

## 4.1 提供稳定接入面

### 必做项

- 新增主项目专用 integration API 或等价接入门面
- 不让 Django 直接依赖内部散装业务接口
- 收敛最小能力集

### 推荐能力集

- 上传文档
- 查询文档
- 触发抽取
- 查询任务状态
- 重试/取消任务
- 获取抽取结果
- 获取图谱数据
- 删除文档

### 需要产出

- integration API 清单
- 请求/响应定义
- 错误码说明
- 状态机说明
- 面向 Django 的稳定结果 DTO 定义
- “显式关系优先”返回语义说明

一期建议至少冻结以下 DTO：

- `IntegrationDocumentCreateRequest`
- `IntegrationDocumentCreateResponse`
- `IntegrationPipelineStartRequest`
- `IntegrationPipelineStatusResponse`
- `IntegrationResultResponse`
- `IntegrationGraphResponse`

### 验收标准

- Django 只依赖接入门面即可完成业务闭环
- 接口文档与真实实现一致
- Django 不需要通过读取内部 extraction 聚合结构或源码来猜关系含义

当前状态：

- 已完成：`/api/v1/integration/8d/*` facade 首版已落地
- 已完成：稳定 DTO 已落地到代码层，Django 不再需要依赖内部 extraction 聚合 DTO
- 已完成：文档上传、任务触发/轮询、结果摘要、图谱视图四类 facade 已具备最小闭环
- 已完成：来源字段与 `idempotency_key` 已落库并完成数据库迁移
- 已完成：integration facade 已接入 Bearer JWT 校验与基础身份映射
- 待补充：面向 Django 的 token claims 冻结文档、失败/重试/取消类接入面仍需继续收口

补充约束：

- DTO 中必须稳定包含 `doc_id`、`run_id`、`trace_id`、`source_record_id`
- `IntegrationResultResponse` 必须以 `entities[] + relationships[] + stats` 作为对外结果主结构
- `IntegrationGraphResponse` 必须以 `nodes[] + edges[] + meta` 作为对外图结构

---

## 4.2 统一身份接入

### 必做项

- 支持校验 Django 签发的内部凭证
- 将 Django 用户身份映射到 8D 的 owner、operator、audit 字段
- 去除系统占位用户写入逻辑
- 明确 8D 内部权限判断与 Django 传入角色的对应关系

### 需要产出

- 凭证校验逻辑
- 用户映射逻辑
- 角色映射表

### 验收标准

- 8D 处理记录中可以看到真实 Django 用户身份
- 8D 不再依赖独立登录作为主路径

当前状态：

- 已完成：integration facade 已支持 Bearer JWT 校验，当前按共享 `secret_key + jwt_algorithm` 解析内部 token
- 已完成：上传、任务触发、文档访问已优先使用 token claims，而不是把请求体中的 `operator_id` 作为唯一真值来源
- 已完成：`upload_user_id`、pipeline `request_user_id`、图节点默认 `owner_id`、`audit_log.user_id` 已打通到真实 Django 用户链路
- 已完成：8D 内部不再要求独立登录作为主路径，而是通过 integration facade 接收 Django 内部凭证
- 待冻结：Django 正式 claims 协议、角色映射表和过期/刷新策略仍需文档化并与 Django 团队确认

当前一期建议冻结的 claims 语义：

- `sub`：当前用户稳定主标识；若本身是 UUID，则直接作为本地用户主键来源；若不是 UUID，则 8D 侧按确定性规则映射为本地 UUID
- `username`：Django 传给 8D 的稳定用户名；8D 当前用于本地轻量用户同步和审计展示
- `role`：当前仅冻结 `admin` / `operator` 两档；8D 当前策略为 `admin` 映射管理员，其余值默认按 `operator` 处理
- `org_id`：组织隔离主字段；若文档本身已有 `org_id`，则后续访问会按该字段做基础可见性限制
- `exp`：JWT 过期时间；Django 必须签发短时 token，8D 仅做标准过期校验，不负责刷新

---

## 4.3 支持主项目业务键与幂等

### 必做项

- 支持记录主项目来源字段
- 支持按来源字段查询文档和任务
- 支持同源请求幂等
- 明确重复上传、重复触发的处理规则

### 推荐字段

- `source_system`
- `source_module`
- `source_record_id`
- `source_record_type`
- `operator_id`
- `org_id`

### 需要产出

- 外部来源字段设计
- 幂等规则说明
- 重复请求语义说明

### 验收标准

- 主项目可以用业务单据号回查 8D 数据
- 重复请求不会导致不可控重复任务或脏数据

当前状态：

- 已完成：`source_system`、`source_module`、`source_record_id`、`source_record_type`、`operator_id`、`org_id` 已支持落库
- 已完成：`idempotency_key` 已支持并已收敛为“同源请求幂等”，当前按 `source_system + source_module + source_record_id + source_record_type + org_id + idempotency_key` 组合约束去重
- 已完成：facade 文档查询已具备按来源字段过滤的最小能力
- 已完成：重复上传语义已明确，同源且 `idempotency_key` 相同的请求会直接返回已有文档，而不是新建重复文档
- 已完成：重复触发语义已明确，当最新 run 仍处于 `pending/running` 且 `force=false` 时，facade 会直接返回现有 run，避免重复排队

---

## 4.4 任务状态机与失败恢复

### 必做项

- 明确任务状态机
- 明确 pending、running、succeeded、failed、cancelled、retryable 的定义
- 明确失败信息返回格式
- 明确重试和取消逻辑

### 需要产出

- 状态机文档
- 任务状态接口
- 错误结构定义

### 验收标准

- Django 可以稳定轮询任务状态
- 失败任务有明确错误信息和后续动作

当前状态：

- 已完成：integration facade 的任务状态响应已补齐基础状态机语义，当前对外统一暴露 `not_started / pending / running / succeeded / failed / cancelled`
- 已完成：内部“用户取消”仍落库为 `failed + error_detail.cancelled=true`，但 facade 对 Django 已归一为 `cancelled`，避免主项目再自行解释失败明细
- 已完成：任务状态接口已补齐 `cancellable`、`retryable` 和标准 `error` 结构，Django 轮询时不再需要靠裸 `error_detail` 猜动作
- 已完成：integration facade 已支持取消与重试接口，分别覆盖活动 run 取消和失败 run 重试
- 已完成：取消与重试的最小契约测试已补充，覆盖状态归一化、取消动作、失败后重试动作
- 待补充：Django 视角失败恢复联调、是否需要对外补“取消后重新触发”和“pending 卡住重排队”的页面提示文案，仍可继续细化

当前对外状态语义：

- `not_started`：文档尚未触发 pipeline
- `pending`：已创建 run，等待 worker 执行
- `running`：worker 已拾取任务并开始执行
- `succeeded`：流程已执行完成
- `failed`：流程失败，且不是用户取消
- `cancelled`：用户主动取消；对外视为独立状态，不要求 Django 再通过错误字段自行二次判断

当前失败信息约定：

- `error.code`：当前至少区分 `pipeline_failed` 和 `cancelled`
- `error.message`：面向联调展示的可读错误信息
- `error.cancelled`：是否为用户取消
- `error.retryable`：当前失败是否允许重试
- `error.detail`：保留底层错误细节，供排障使用

当前 facade 动作接口：

- `POST /api/v1/integration/8d/documents/{doc_id}/pipeline/cancel`
- `POST /api/v1/integration/8d/documents/{doc_id}/pipeline/retry`

补充约束：

- `success` 表示流程执行成功，不表示所有业务边都已抽出
- 缺少某条业务关系时，优先视为“未显式抽出/证据不足”，不是默认系统失败

---

## 4.5 前端子路径适配

### 必做项

- 支持在主项目子路径下运行
- 调整前端 base path、API 路径、WebSocket 路径
- 确保刷新、深链接、静态资源加载正常
- 支持主项目统一主题或头部接入策略

### 需要产出

- 子路径部署说明
- 前端环境变量或配置项说明

### 验收标准

- 8D 前端在 `/quality/8d/` 之类的子路径下稳定运行

### 当前状态

- 已完成：前端已支持通过 `VITE_APP_BASE_PATH` 构建到主项目子路径下运行
- 已完成：前端默认 API 基址跟随同一子路径前缀，可通过 `VITE_API_BASE_URL` 显式覆盖
- 已完成：`deploy` 前端容器已支持通过 `KG_FRONTEND_BASE_PATH` 生成子路径静态资源与 `/api` 代理规则
- 已完成：NeoVis 保持为当前正式图谱渲染路径，前端已支持通过 `VITE_NEO4J_BROWSER_*` 使用“浏览器可直连”的 Neo4j Bolt 配置
- 已完成：已在当前远端部署环境实测通过，`/quality/8d/graph` 页面可正常打开并显示图谱，说明当前访问环境下 NeoVis 直连可用
- 已完成：已补充子路径部署说明与环境变量说明
- 说明：上述 NeoVis 可用性的前提是访问浏览器到配置中的 Bolt 端点可达；若 Django 部署在其他网络环境，仍需按浏览器网络重新验收
- 说明：当前前端无实际 WebSocket 客户端接入代码，`/ws/` 路径仍为后续预留项

---

## 4.6 文档与契约对齐

### 必做项

- 对齐 API 文档与真实实现
- 输出主项目接入说明
- 输出认证说明
- 输出错误码、状态码、任务状态说明
- 输出结果解释说明，明确哪些字段是原始线索，哪些字段是可直接消费的正式关系

### 验收标准

- Django 团队可以仅依赖文档完成联调
- 联调过程中不需要通过读源码猜接口

当前状态：

- 已完成：`docs/API.md` 已补齐 integration facade 的真实路由、认证口径、同源幂等、状态归一与 DTO 摘要
- 已完成：`Django主项目集成方案.md` 已补齐 `/api/v1/integration/8d/*` 的当前接入说明、cancel/retry、分页与状态语义
- 已完成：`Django token claims 对接约定.md` 已与当前 `KG_8D_JWT_*` 配置名和 Bearer claims 约定对齐

---

## 4.7 8D-kg 端测试与硬化

### 必做项

- 增加 integration API 契约测试
- 增加认证映射测试
- 增加幂等测试
- 增加失败与重试测试
- 增加主项目接入视角的端到端验证

### 验收标准

- 至少存在一条从接入接口到任务完成的稳定测试或联调记录
- 关键接口变更有测试保护

当前状态：

- 已完成：integration facade API 契约测试已补充
- 已完成：认证映射的最小契约测试已补充，覆盖 Bearer token 驱动的上传与任务触发主链路
- 已完成：非 integration 回归已验证 facade 接入没有带来明显结果或性能回退
- 待完成：失败重试测试、Django 视角 e2e、子路径联调验证仍需补齐

---

## 4.8 多知识类型 runtime 支撑

### 必做项

二期以后，8D-kg 端需要把当前 8D 专用流程逐步抽象为可复用 runtime：

- 把当前 8D 抽象成第一套 `ontology spec + extraction profile`
- 支持 `document_type_code` 与已发布 `ontology_version / extraction_profile_version`
- 提供 schema / ontology 草稿校验接口
- 提供 extraction profile 草稿校验接口
- 提供 dry-run 执行能力，避免草稿直接污染生产图谱
- 提供 Codex 辅助生成、检查、修复草稿的受控接口
- 发布后固化不可变版本，生产 pipeline 只执行已发布版本
- 写图前继续执行节点/关系白名单、端点合法性、溯源字段、幂等和审计约束

### 需要产出

- `ontology spec` 格式定义
- `extraction profile` 格式定义
- 草稿校验错误结构
- dry-run 结果 DTO
- Codex 辅助生成接口的输入/输出约束
- 发布、废弃、回滚规则

### 验收标准

- 当前 `8d_report` 行为不被破坏
- 至少一类新知识文档可以完成草稿创建、校验、dry-run 和发布前审核
- Codex 结果只能进入草稿流程，不能直接发布或写生产图谱
- facade 继续稳定返回 `entities[] + relationships[] + stats`，并补充文档类型和版本信息

---

## 4.9 GraphDraft 与审核后入图

8D-kg 端应把“抽取”和“入图”拆成两个阶段：先生成可审核候选图，再在 Django 审核后执行校验和入图。

### 必做项

- 抽取完成后生成 `GraphDraft`，而不是直接写生产图谱
- 保存原始抽取 draft snapshot
- 提供 `GraphDraft` 查询、保存审核稿、提交审核稿、commit 入图接口
- 接收 Django 返回的 reviewed graph JSON
- 在入图前重新执行 schema、ontology、端点、溯源、权限和幂等校验
- 生成 `GraphCommitPlan`，再执行 Neo4j 幂等写入
- 保存审核后 draft snapshot、commit snapshot、diff 和 audit log
- 更新 document / run / draft 状态

### 建议最小接口

- `GET /api/v1/integration/8d/documents/{doc_id}/graph-draft`
- `POST /api/v1/integration/8d/documents/{doc_id}/graph-draft/save`
- `POST /api/v1/integration/8d/documents/{doc_id}/graph-draft/submit`
- `POST /api/v1/integration/8d/documents/{doc_id}/graph-draft/commit`

### 建议状态机

主线状态：

```text
extracting -> draft_created -> pending_review -> review_submitted -> validating -> ready_to_commit -> committing -> committed
```

旁路状态：

```text
rejected / validation_failed / superseded / commit_failed
```

### 入图前校验

8D-kg 必须至少校验：

- `base_version` 是否匹配，避免覆盖其他审核人的修改
- `entity_type`、`rel_type` 是否在当前 ontology 白名单内
- 关系两端实体是否存在，端点类型是否合法
- 必填属性、业务键、置信度、review action 是否合法
- `supporting_chunks` 是否属于当前文档
- 溯源字段是否完整，且未被 Django 侧伪造或跨文档引用
- 当前用户是否具备 submit / commit 权限
- 是否存在重复实体、重复边或破坏幂等写图的修改

### 审计留痕

每次审核入图至少保留：

- 原始抽取 draft snapshot
- Django 保存或提交的 reviewed draft snapshot
- 最终 commit snapshot
- diff：新增、删除、修改的实体和关系
- reviewer / submitter / committer
- review comment
- trace_id、doc_id、run_id、draft_id
- schema_version、extraction_version、ontology_version、profile_version

### 验收标准

- 抽取完成后可以不入图，只生成候选图
- Django 审核后返回的 JSON 不能绕过 8D-kg 校验
- 校验失败时返回结构化错误，Django 可以定位到具体实体或关系
- 校验通过后由 8D-kg 幂等写图并完整写审计日志

---

## 5. 双方共同完成的事项

## 5.1 联调协议

双方需要共同确认：

- 路径前缀
- token 格式
- 用户字段
- 业务来源字段
- 错误码
- 任务状态语义
- 回调或轮询方案
- 结果 DTO 结构
- 显式关系优先的解释规则

建议直接冻结以下字段级协议：

- 文档创建返回 `doc_id / status / duplicate_of_doc_id / source_ref / created_at`
- 任务状态返回 `doc_id / run_id / status / current_stage / started_at / finished_at / trace_id / error`
- 结果摘要返回 `doc_id / run_id / schema_version / extraction_version / stats / entities / relationships`
- 图谱视图返回 `doc_id / nodes / edges / meta`
- 候选图审核返回 `draft_id / doc_id / run_id / draft_version / status / entities / relationships / evidence / warnings`

建议同步冻结以下 token claims 协议：

- 请求头统一使用 `Authorization: Bearer <jwt>`
- Django 一期正式 claims 使用 `sub / username / role / org_id / exp`
- 兼容别名 `user_id / uid / preferred_username / name / org_code / tenant_id` 仅作为迁移期兼容，不作为长期契约基线
- 如果请求体仍传 `operator_id` 或 `requested_by`，其值必须与 token 主体一致；否则 8D 应返回 400
- `role` 当前只冻结 `admin / operator` 两档；超出范围的值在 8D 当前实现中按 `operator` 处理，Django 不应依赖隐式降级语义长期存在
- `exp` 由 Django 控制签发时效；8D 负责校验，不负责刷新和续签

---

## 5.2 统一验收口径

双方需要共同确认：

- 什么叫“已接入”
- 什么叫“可上线”
- 什么叫“失败可恢复”
- 什么叫“权限正确”

---

## 5.3 统一排障口径

双方需要共同确认：

- trace_id 如何贯通
- task_id 如何回查
- source_record_id 如何定位业务来源
- 出问题先查 Django 还是先查 8D

补充约束：

- 联调前先做 PostgreSQL / Neo4j / MinIO 连接与凭证预检
- 环境认证失败与抽取/契约错误要分开归类

---

## 5.4 当前推荐工作流

这部分用于把当前方案真正执行成“高可复用、偏 Skill 驱动”的工作流。

### A. 接入工作流

- Django 只调用 `integration facade`
- Django 不直接调用内部 `/documents`、`/extract`、`/graph` 等散装接口
- Django 页面只消费 facade DTO，不自行推断隐式业务边

### B. 抽取工作流

- 新需求先判断属于 Skill 还是 runtime
- 如果是章节判断、关系判定、角色归因、保守抽取策略，优先改 Skill
- 如果是 schema、白名单、端点合法性、去重闭合、写图库治理，才改 runtime

### C. 变更工作流

- 改 Skill 时同步修改 Skill 模板、fixture、回归测试
- 改 facade 时同步修改 DTO 文档、契约测试、Django 类型定义
- 改 runtime 时保持最小化，不把业务语义重新塞回 Python 推断代码

### D. 联调工作流

- 先校验环境端口和凭证，再联调接口
- 先打通上传 → pipeline → result/graph 最小闭环，再挂主项目页面
- 认证问题、契约问题、抽取问题、基础设施问题分开定位

### E. 复用工作流

- 跨项目优先复用 Skill Pack 和 facade DTO
- 不优先复制 pipeline 代码到新项目
- Django 或其他主系统只复用接入门面，不直接复用内部实现细节

---

## 5.5 当前是否可以交给 Django 同事直接开发

结论：

- 可以开始并行开发
- 但还不能把它视为“拿到文档后即可独立完成全量联调”

更准确地说：

- Django 同事已经可以基于当前文档和 facade DTO 开始做入口、代理、页面、类型定义、上下文传参、结果展示，以及内部 token 签发接入
- Django 同事仍不适合在没有最终冻结 claims 协议和联调验证的情况下独立宣告“全量集成完成”，因为失败恢复、子路径最终收口和 Django 视角 e2e 仍需双方汇合验证

### A. Django 同事现在就可以开工的内容

- 菜单入口、页面路由、回跳链路
- 子路径代理方案设计与接入
- 基于 facade DTO 的前端类型定义和 API client
- 上传页、任务状态页、结果页、图谱入口页的页面骨架
- 主项目业务上下文到 `source_* / project_id / org_id / operator_id` 的映射
- 结果展示层按显式 `relationships` 消费数据，不再依赖内部 extraction 聚合结构

### B. 当前还不能完全交给 Django 同事独立收口的内容

- token claims 的最终冻结版本与错误语义对齐
- 完整的失败/重试/取消联调闭环
- Django 视角端到端联调验收
- 前端子路径、静态资源、WebSocket 路径的最终收口验证

### C. 建议交给 Django 同事的交接包

- `Django主项目集成方案.md`
- `Django与8D职责拆分清单.md`
- `多知识类型Ontology与Codex辅助入图方案.md`
- `docs/API.md`
- facade DTO 示例请求/响应
- 当前已冻结的路径与语义约束

### D. 交接时必须口头或书面强调的限制

- Django 只能接 `integration facade`，不能直接接内部散装接口
- Django 页面只能按显式 `relationships` 解释业务关系
- 当前认证主链路已在 8D-kg 落地，Django 侧不要自行发明第二套用户映射逻辑或绕开 Bearer token 协议
- 如果 Django 需要开始联调，必须先和 8D-kg 团队冻结 token claims、路径前缀、错误码和状态语义

### E. 当前最实际的协作方式

- Django 同事先按当前文档并行开发主项目接入层和内部 token 签发逻辑
- 8D-kg 侧补 claims 协议文档、失败恢复测试和 Django 视角联调收口
- 两边在 facade 不变的前提下汇合联调

这意味着：

- 现在可以交给 Django 同事开工
- 但交付口径应是“可并行开发”，不是“Django 侧可单独完成全部接入收口”

---

## 5.6 多知识类型联合工作流

当新增 8D 之外的知识文档类型时，双方应按以下顺序推进：

### A. 先把当前 8D 固化为第一套规范

- 8D-kg 侧整理 `8d_report` 的 ontology spec、extraction profile 和 Skill Pack 边界
- Django 侧把当前 8D 入口视为 `document_type_code=8d_report`
- 双方确认现有 facade DTO 如何补充文档类型和版本字段

### B. 再做 Django 草稿管理

- Django 负责草稿页面、权限、审核发布入口和业务映射
- 8D-kg 负责草稿存储、校验、dry-run 和发布固化
- 未发布草稿不得进入生产 pipeline

### C. 然后接入 Codex 辅助

- Codex 根据业务说明、样例文档和已有 schema 生成草稿建议
- Codex 根据校验错误生成修复建议
- 人工决定采纳、修改或拒绝
- 发布仍由平台校验和授权用户完成

### D. 最后进入多类型生产闭环

- 上传时传入或选择 `document_type_code`
- pipeline 按已发布 profile 执行
- result / graph facade 返回文档类型、ontology 版本、profile 版本
- Django 按文档类型选择展示模板，但继续只消费稳定 facade DTO

---

## 5.7 入图前审核联合工作流

双方应把入图前人工审核作为 Django 合并后的标准生产流程。

### A. 8D-kg 生成候选图

- pipeline 完成抽取后生成 `GraphDraft`
- `GraphDraft` 包含候选实体、候选关系、证据、置信度、schema/profile 版本和 warnings
- 此时不写生产 Neo4j

### B. Django 审核和修改

- Django 拉取 `GraphDraft`
- 审核人可以确认、修改、新增、删除候选实体和关系
- Django 保存或提交时必须带 `draft_id` 与 `base_version`
- Django 不直接写图

### C. 8D-kg 校验和入图

- 8D-kg 接收 reviewed graph
- 校验 schema、ontology、端点、溯源、权限、幂等和版本
- 校验通过后生成 `GraphCommitPlan`
- 8D-kg 使用 `MERGE` 幂等写 Neo4j，并写审计日志

### D. 失败与重提

- 校验失败时，8D-kg 返回结构化错误
- Django 根据错误定位到实体或关系行，允许审核人修正后重新提交
- commit 失败时，8D-kg 保留失败原因、trace_id 和可重试状态

### E. 一期收口建议

- 一期先做表格式审核，不强制实现图形化编辑器
- 一期先支持单文档单 active draft
- 一期必须支持 `base_version` 乐观锁、校验错误返回、审计快照和幂等入图
- 二期再增强多人锁、批注、差异对比、图形化编辑和批量审核

---

## 6. 推荐的一期分工

## 6.1 Django 端一期建议

- 完成菜单入口
- 完成子路径代理
- 完成统一 token 签发
- 完成业务上下文传递
- 完成页面跳转和回跳
- 完成主项目联调验证
- 按冻结后的 facade DTO 生成或维护主项目侧类型定义
- 页面展示仅消费显式 `relationships`，不在 Django 侧重建隐式业务边
- 提供候选图审核页面，支持实体/关系表格式修改与确认

## 6.2 8D-kg 端一期建议

- 完成 integration API
- 完成 token 校验
- 完成用户映射
- 完成来源键落库与查询
- 完成前端子路径适配
- 完成接口文档和状态机文档
- 完成关键契约测试
- 输出 facade DTO 示例请求/响应
- 保证 facade 内部适配 extraction 变化，不把内部 DTO 变更直接外抛给 Django
- 将抽取结果先落为 `GraphDraft`，审核通过后再执行入图与审计

当前拆分建议：

- 已完成：integration API、来源键落库与查询、facade DTO、基础契约测试、token 校验、基础用户映射
- 进行中：claims 协议冻结、Django 视角联调收口
- 待推进：Django 视角端到端联调、前端子路径最终收口

---

## 7. 推荐的二期分工

## 7.1 Django 端二期建议

- 将 8D 状态摘要挂到主业务页面
- 增加任务完成后的业务联动
- 增加通知或消息中心整合

## 7.2 8D-kg 端二期建议

- 增强失败恢复与补偿逻辑
- 增强监控和链路追踪
- 冻结接入契约
- 逐步抽离领域内核

---

## 8. 一期上线前检查清单

### Django 端检查

- 入口可访问
- 登录态可传递
- 权限前置正常
- 子路径代理正常
- 业务上下文传递正常

### 8D-kg 端检查

- integration API 可用
- 认证校验可用
- 文档上传可用
- 抽取任务可触发
- 候选图 Draft 可生成
- Django 审核结果可校验
- 审核通过后可入图
- 任务状态可查询
- 图谱结果可查看
- 错误信息可返回
- 结果 DTO 与“显式关系优先”语义说明已提供给 Django 团队
- 集成环境数据库与图存储凭证验证通过

### 联合检查

- 至少一条完整链路联调通过
- 至少一条失败链路验证通过
- 至少一条按业务单据回查验证通过

---

## 9. 最终判断标准

如果满足以下条件，可以认为 Django 与 8D-kg 的一期集成基本完成：

- Django 用户可以无感进入 8D 子功能
- 主项目可以把业务上下文传给 8D
- 8D 可以完成上传、抽取、入图、结果展示闭环
- 主项目可以按业务来源回查 8D 数据
- 双方边界清晰，没有 Django 直接依赖 8D 内部实现
- 出现失败时有清晰的定位和重试路径

如果以上任一关键项未闭环，不建议认为集成已经完成。