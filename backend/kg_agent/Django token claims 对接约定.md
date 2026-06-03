# Django token claims 对接约定

## 1. 文档目的

本文档只用于冻结 Django 主项目与 8D-kg `integration facade` 之间的内部 Bearer token 协议。

它是联调单页文档，目标是让 Django 同事不用翻整份集成方案，也不用读 8D 源码，就能正确签发 token 并发起请求。

本文档只覆盖：

- token 放在哪里
- claims 应该长什么样
- 8D 当前如何解释这些 claims
- 哪些字段是必填
- 请求体字段与 token 字段冲突时怎么处理
- 当前一期不做什么

不覆盖：

- Django 菜单、路由、页面接入
- 8D facade 全量 DTO
- 子路径、静态资源、WebSocket 部署细节
- 失败重试和任务补偿策略

---

## 2. 适用范围

适用接口前缀：

- `/api/v1/integration/8d/*`

当前适用场景：

- Django 为当前登录用户签发内部短时 JWT
- Django 使用该 JWT 调用 8D integration facade
- 8D 根据 JWT 识别用户、角色、组织范围

---

## 3. 传输方式

所有 integration facade 请求统一使用：

- 请求头：`Authorization: Bearer <jwt>`

不支持：

- query string 传 token
- cookie 作为 8D 主认证入口
- 请求体里单独传“身份真值”替代 token

---

## 4. 一期冻结 claims

## 4.1 必填 claims

一期正式冻结以下 5 个 claims：

- `sub`
- `username`
- `role`
- `org_id`
- `exp`

推荐最小 payload：

```json
{
  "sub": "u-10086",
  "username": "zhangsan",
  "role": "operator",
  "org_id": "org-shenzhen-quality",
  "exp": 1780406400
}
```

---

## 4.2 兼容别名

8D 当前为了兼容迁移，仍可回退读取以下别名：

- 用户主标识别名：`user_id`、`uid`
- 用户名别名：`preferred_username`、`name`
- 组织别名：`org_code`、`tenant_id`

但这些别名只用于迁移兼容，不应作为长期协议基线。

也就是说：

- Django 新实现应优先发送 `sub`
- Django 新实现应优先发送 `username`
- Django 新实现应优先发送 `org_id`

---

## 5. claims 语义

## 5.1 `sub`

语义：当前登录用户的稳定主标识。

约束：

- 必须稳定
- 不应复用可变展示名
- 不应用邮箱、昵称之类高变字段替代

8D 当前解释方式：

- 如果 `sub` 本身是 UUID，则直接作为本地用户主键来源
- 如果 `sub` 不是 UUID，则 8D 按确定性规则映射为本地 UUID
- Django 不应依赖这个映射算法本身，只需要保证同一用户长期输出同一个 `sub`

---

## 5.2 `username`

语义：传给 8D 的稳定用户名。

用途：

- 本地轻量用户同步
- 审计展示
- 调试排障

约束：

- 应稳定
- 不建议直接传展示名
- 可以是 Django 内部用户名或工号编码后的稳定字符串

---

## 5.3 `role`

一期只冻结两档：

- `admin`
- `operator`

8D 当前处理规则：

- `admin` 映射管理员
- 其他值当前默认按 `operator` 处理

注意：

- Django 不应依赖“未知角色会自动降级为 operator”这一行为长期存在
- Django 应在签发前就把角色收敛到协议内取值

---

## 5.4 `org_id`

语义：组织隔离主字段。

用途：

- 上传时写入文档组织信息
- 文档访问时做基础组织可见性限制

约束：

- 应使用稳定组织编码
- 不应使用展示名称替代
- 同一组织在 Django 和 8D 联调期间应保持唯一一致的编码值

---

## 5.5 `exp`

语义：JWT 过期时间。

约束：

- Django 必须签发短时 token
- 8D 负责校验是否过期
- 8D 不负责刷新和续签

建议：

- 用于页面联调的 token 保持较短生命周期
- 失效后由 Django 重新签发，不在 8D 侧做 refresh token 逻辑

---

## 6. 当前 8D 侧映射行为

当前 integration facade 已实现以下行为：

- 强制要求 Bearer token
- 解析用户、角色、组织信息
- 上传时优先使用 token claims 作为真实身份来源
- 触发 pipeline 时优先使用 token claims 作为真实请求人来源
- 把身份映射到文档上传用户、pipeline 请求用户、审计用户和图节点默认 owner

当前本地同步结果可理解为：

- `upload_user_id` 使用 token 主体映射出的本地用户
- `operator_id` 优先取 token 主体
- `org_id` 优先取 token 组织
- `audit_log.user_id` 使用同一用户映射结果
- 图节点默认 `owner_id` 使用同一用户映射结果

---

## 7. 请求体字段与 token 的关系

以下字段不应再被 Django 当作身份真值来源：

- `operator_id`
- `requested_by`

当前协议要求：

- 如果 Django 不传这两个字段，8D 会优先从 token 填充
- 如果 Django 仍传这两个字段，则它们只能作为冗余字段
- 如果冗余字段和 token 主体不一致，8D 应返回 `400`

这意味着：

- Django 不要维护第二套“请求体身份逻辑”
- Django 的真正身份来源必须是 Bearer token

---

## 8. 签名与校验约束

当前 8D 使用以下配置校验 JWT：

- 密钥：与 8D `settings.secret_key` 对齐的共享内部密钥
- 算法：与 8D `settings.jwt_algorithm` 对齐

联调前必须确认：

- Django 签名密钥与 8D 校验密钥一致
- Django 使用的算法与 8D 配置一致
- 双方时间同步正常，避免 `exp` 误判

如果未来要切到独立 integration secret 或独立 issuer 规则，应单独升级本文档，不要默认沿用当前实现细节。

---

## 9. 错误语义

一期联调时，至少按下面理解：

- 未带 Bearer token：返回 `401`
- token 非法或签名不通过：返回 `401`
- token 缺少主体字段：返回 `401`
- 请求体身份字段与 token 不一致：返回 `400`
- 用户组织与目标文档组织不匹配：按“资源不存在”处理，返回 `404`

注意：

- `401` 优先归类为认证问题
- `400` 优先归类为调用协议问题
- `404` 在 integration facade 下不一定表示真实不存在，也可能是组织隔离导致不可见

---

## 10. Django 侧建议实现

建议 Django 侧统一做以下约束：

- 登录后由 Django 后端签发内部短时 JWT
- 所有调用 8D facade 的服务端请求统一注入 Bearer token
- 不在前端保存长期有效 token
- 不让前端自行拼 claims
- 不让页面代码自己维护 `operator_id` 和 `requested_by` 真值

推荐做法：

- Django 后端封装统一的 8D API client
- client 自动附带 Bearer token
- 页面层只传业务上下文，如 `source_*`、`project_id`

---

## 11. 请求示例

## 11.1 文档上传

```http
POST /api/v1/integration/8d/documents HTTP/1.1
Authorization: Bearer <jwt>
Content-Type: multipart/form-data

source_system=django-main
source_module=quality_issue
source_record_id=QI-2026-001
source_record_type=quality_issue
project_id=proj-sz-01
file=<binary>
```

说明：

- `operator_id` 可以不传
- `org_id` 可以不传
- 这两个字段由 token 兜底，除非为了兼容旧调用方临时冗余传递

## 11.2 任务触发

```http
POST /api/v1/integration/8d/documents/{doc_id}/pipeline HTTP/1.1
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "force": false
}
```

说明：

- `requested_by` 可以不传
- 如果传，则必须与 token 主体一致

---

## 12. 一期不做什么

当前一期明确不在本文档内冻结以下能力：

- refresh token 协议
- 单独的 SSO / OAuth 对接
- 多级组织树授权语义
- 项目级细粒度权限 claims
- 前端直连 8D 的浏览器 token 协议
- 独立 issuer / audience / jwks 发现机制

如果后续要引入这些能力，应新增版本化协议，不要在当前单页文档上模糊追加。

---

## 13. 当前联调结论

当前可以认为：

- 8D Bearer JWT 主链路已打通
- Django 可以按本文档开始签发和联调 token
- 双方下一步重点不是再发明认证方案，而是冻结 claims、补齐 Django 视角 e2e 和失败恢复联调

如果 Django 严格按本文档发送 token，当前 integration facade 已具备进入联调的最小条件。