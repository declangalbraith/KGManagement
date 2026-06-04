# 多知识类型 Ontology 与 Codex 辅助入图方案

## 1. 文档目的

本文档用于承接当前 8D 知识图谱能力向“多知识类型知识库 / 知识图谱平台”演进的方案设计，供后续开发、Django 主项目工程师对接和双方联调使用。

本方案只描述落地顺序、职责边界和接口约束，不代表当前代码已经实现这些能力。

---

## 2. 总体结论

推荐采用“Schema-first + Draft/Publish + Codex-assisted”的路线。

核心判断：

- 8D 不应继续被理解为唯一文档类型，而应成为第一套已落地的 `document_type + ontology_spec + extraction_profile` 示例
- Django 端可以提供 schema / ontology 的管理入口，但不应直接写生产图谱结构
- Codex 可以辅助生成、检查、修复草稿，但不能绕过审核、兼容性检查、测试和发布流程直接改生产 schema
- 8D-kg 端应把当前 8D pipeline 逐步抽象成可复用运行时，而不是为每一种新知识类型复制一套 pipeline

一句话：

> Django 管草稿与业务入口，Codex 辅助生成和审查，8D-kg 管运行时约束、验证、发布和入图执行。

---

## 3. 目标能力分层

未来平台应至少抽象出四层能力。

### 3.1 文档类型层

用于描述“这是一类什么文档”。

建议字段：

- `document_type_code`：稳定编码，例如 `8d_report`、`equipment_manual`、`process_spec`
- `display_name`：展示名
- `description`：用途说明
- `accepted_file_types`：允许上传的文件类型
- `owner_org_id`：归属组织
- `status`：`draft / published / deprecated`

### 3.2 Ontology / Schema 层

用于描述可入图的节点、边、属性和约束。

建议包含：

- 节点类型定义
- 关系类型定义
- 节点业务键规则
- 必填属性、可选属性、枚举值
- 溯源字段要求
- 敏感级别与可见性策略
- schema 版本号

### 3.3 Extraction Profile 层

用于描述“如何从这种文档里抽出这种 schema”。

建议包含：

- reader 规则
- splitter 规则
- section router 规则
- table extractor 规则
- Skill / prompt pack
- 字段归一化规则
- 置信度阈值
- 占位符过滤规则
- 写图前校验规则

### 3.4 Runtime 执行层

用于真正完成上传、解析、抽取、校验、写图和查询。

Runtime 不应随意接受草稿 schema，而应只执行已发布版本。

---

## 4. Draft / Publish 生命周期

所有 schema / ontology / extraction profile 变更都应走草稿发布流程。

### 4.1 Draft

由 Django 页面或管理接口创建草稿。

草稿可以来自：

- 人工填写
- 复制已有文档类型后修改
- Codex 根据样例文档和业务说明生成
- Codex 根据现有 schema 做增删改建议

### 4.2 Validate

发布前必须验证：

- schema JSON/YAML 结构合法
- 节点、关系、属性命名合法
- 关系端点存在且方向明确
- 必填溯源字段完整
- 与当前已发布版本兼容或附带迁移说明
- 不包含未授权的敏感字段或越权查询配置
- extraction profile 引用的 Skill / prompt / parser 存在

### 4.3 Test

草稿发布前应至少跑一组样例文档。

建议测试内容：

- 可解析
- 可抽取
- 可通过 schema 校验
- 可写入隔离测试图或 dry-run 结果
- facade DTO 可以稳定返回 `entities[] + relationships[] + stats`
- Django 页面可以按文档类型展示基本结果

### 4.4 Review

必须由具备权限的业务或平台管理员确认。

Codex 的角色是“生成建议、解释影响、辅助修复”，不是最终审批者。

### 4.5 Publish

发布后生成不可变版本：

- `ontology_version`
- `extraction_profile_version`
- `published_at`
- `published_by`

生产 pipeline 只能引用已发布版本。

### 4.6 Deprecate / Rollback

已发布版本不能直接删除，只能废弃。

如果新版本出现问题，应回滚到上一已发布版本，并保留已产生数据的版本标记。

---

## 5. Codex 的合理边界

Codex 可以承担以下工作：

- 根据业务说明和样例文档生成 ontology 草稿
- 根据已发布 schema 生成差异化修改建议
- 生成 extraction profile 草稿
- 生成 Skill / prompt 初稿
- 检查 schema 命名、关系端点、字段类型、溯源字段是否完整
- 根据验证错误给出修复建议
- 生成样例 fixture 和测试建议

Codex 不应承担以下工作：

- 直接修改生产 ontology
- 直接写 Neo4j 生产图谱
- 跳过人工审核发布 schema
- 自动删除历史版本
- 在没有迁移计划时重命名或删除已发布节点/关系类型
- 绕过 integration facade 给 Django 暴露内部 DTO

---

## 6. 与 Django 的接口边界

### 6.1 Django 侧建议负责

- 文档类型管理页面
- ontology / schema 草稿编辑页面
- extraction profile 草稿编辑页面
- 样例文档上传与验证入口
- 草稿审核、发布、废弃操作入口
- 业务对象与 `document_type_code` 的映射
- 主项目权限前置和操作审计入口

### 6.2 8D-kg 侧建议负责

- schema / ontology 结构校验
- extraction profile 校验
- Codex 辅助生成、审查、修复接口
- 草稿 dry-run 执行
- 发布版本固化
- pipeline 按已发布版本执行
- 写图前白名单、端点、溯源、幂等和审计约束
- 对 Django 继续提供稳定 facade DTO

### 6.3 双方共同冻结的最小字段

新增多知识类型后，现有 facade 应逐步扩展但保持兼容。

建议新增或明确以下字段：

- `document_type_code`
- `ontology_version`
- `extraction_profile_version`
- `schema_version`
- `source_system`
- `source_module`
- `source_record_id`
- `source_record_type`
- `org_id`
- `trace_id`

结果仍应保持：

- `entities[]`
- `relationships[]`
- `stats`

Django 页面可以根据 `document_type_code` 选择不同展示模板，但不应直接依赖内部 extraction 聚合结构。

---

## 7. 建议落地顺序

### 阶段 1：把当前 8D 抽象成第一套规范

目标：不改变现有业务行为，先把 8D 当前能力表达成可版本化配置。

建议完成：

- 梳理 `8d_report` 的 ontology spec
- 梳理 `8d_report` 的 extraction profile
- 固化当前 schema version、extraction version、Skill Pack 版本
- 明确哪些规则属于 runtime 硬约束，哪些属于 Skill / profile
- 在文档和 facade 中补齐 `document_type_code` 的长期语义

验收口径：

- 当前 8D 流程仍可正常运行
- 文档层面已经可以把 8D 解释为第一种文档类型
- Django 工程师可以理解后续其他文档类型会复用同一套生命周期

### 阶段 2：增加 Django 侧 Draft / Publish 管理能力

目标：让 Django 可以管理草稿，但生产执行仍只吃已发布版本。

建议完成：

- Django 增加文档类型列表、详情、草稿编辑、审核发布入口
- 8D-kg 增加草稿保存、校验、dry-run、发布接口
- 增加权限矩阵：谁能创建草稿、谁能发布、谁能废弃
- 增加版本列表与发布记录
- 增加样例文档验证记录

验收口径：

- Django 能创建一个新文档类型草稿
- 草稿不能直接进入生产 pipeline
- 只有通过校验、测试和审核后才能发布

### 阶段 3：接入 Codex 辅助生成与修复

目标：提高 schema / ontology 建模效率，但不削弱发布治理。

建议完成：

- Codex 根据业务说明生成 ontology 草稿
- Codex 根据样例文档生成 extraction profile 草稿
- Codex 根据 validate 错误生成修复建议
- Codex 输出变更摘要和兼容性风险说明
- 所有 Codex 结果都进入草稿，不直接发布

验收口径：

- Codex 可以生成可读、可校验的草稿
- 人工可以查看 diff、采纳或拒绝建议
- 发布仍依赖平台校验和人工审核

### 阶段 4：多文档类型运行时接入

目标：生产 pipeline 可以按文档类型选择已发布 profile 执行。

建议完成：

- 上传时传入或选择 `document_type_code`
- pipeline 根据 `document_type_code + profile_version` 选择规则
- result / graph facade 返回文档类型与版本信息
- 前端按文档类型展示通用结果视图或专用视图
- 回归测试覆盖至少两个文档类型

验收口径：

- 8D 作为 `8d_report` 继续稳定运行
- 至少一个新文档类型可以完成 dry-run 或最小生产闭环
- Django 不需要改内部 pipeline 代码即可接入新文档类型

### 阶段 5：迁移与兼容治理

目标：支持长期演进，而不是只支持新增。

建议完成：

- schema diff 与兼容性判断
- 已发布版本废弃策略
- 图谱历史数据版本标记
- 重抽取 / 回填计划
- 破坏性变更的审批与回滚机制

---

## 8. 一期不要做的事

为避免范围失控，一期不建议做：

- 让 Django 直接编辑 Neo4j 生产结构
- 让 Codex 自动发布 ontology
- 为每个新文档类型复制一套独立 pipeline
- 在没有版本治理前允许删除已发布节点或关系类型
- 让 Django 页面直接消费不同文档类型的内部 extraction DTO
- 把自然语言问答、Text-to-Cypher、多租户 ontology 编辑一次性塞入一期

---

## 9. 给 Django 工程师的对接重点

Django 工程师当前可以先按以下方向设计主项目能力：

- 把 8D 当前入口视为 `document_type_code=8d_report` 的第一个知识类型入口
- 后续新增知识类型时，主项目只新增业务入口、权限、文档类型选择和展示模板，不直接改 8D 内部 pipeline
- schema / ontology 管理页面只管理草稿和发布动作，不直接操作生产图谱
- 所有抽取结果仍通过 facade DTO 消费，优先使用显式 `relationships`
- 对接时预留 `document_type_code`、`ontology_version`、`extraction_profile_version` 展示和筛选能力

---

## 10. 与现有文档的关系

- `Django主项目集成方案.md`：描述主项目集成总路线，并引用本文作为多知识类型演进方案
- `Django与8D职责拆分清单.md`：描述 Django 与 8D-kg 在该演进路线中的职责边界
- `docs/django-current-runtime.schema`：描述当前已落地的 8D runtime schema，对接时仍以它作为现阶段字段准绳
- `docs/v0.3-target-ontology.md`：可作为后续整理目标 ontology 的参考材料

---

## 11. 当前状态标记

截至本文创建时：

- 当前已落地的是 8D 文档入图闭环
- 多知识类型 schema / ontology 管理尚未实现
- 本文是后续开发和 Django 联调的方案约束，不是已完成能力清单
- 下一步建议先做阶段 1：把当前 8D 能力整理成第一套 `ontology spec + extraction profile`