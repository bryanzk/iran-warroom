# Warroom Iran Incident 页面实现待办

## 任务拆解
1. 初始化项目结构与依赖，建立 TypeScript + Next.js + Tailwind + Vitest 基础。
2. 落地数据模型（JSON Schema）与初始数据（seed + source registry）。
3. 实现数据层：校验、过滤、可信来源检查、内容安全检查。
4. 实现 API 路由（events/infrastructure/statements/factcheck/sources）。
5. 实现 UI 组件与页面信息架构（更新时间、筛选、时间线、地图点位、状态卡、声明对照、核查、媒体、FAQ）。
6. 实现测试：schema、API 过滤、UI 安全约束、E2E 占位。
7. 执行验证（测试 + 构建），记录结果。
8. 增加 API `lang=zh|en` 双语响应能力。
9. 增加实时消息获取（服务端轮询 + SSE + 前端实时面板）。
10. 扩展“可信来源”能力到社交媒体白名单账号，并将其单独展示在页面侧栏。

## 依赖关系
- 2 依赖 1。
- 3 依赖 2。
- 4 依赖 3。
- 5 依赖 2/3。
- 6 依赖 3/4/5。
- 7 依赖全部前置任务。
- 8 依赖 2/3/4。
- 9 依赖 8。
- 10 依赖 2/3/8/9。

## 验收标准
- Schema 校验通过，非法记录被拒绝。
- API 支持 from/to/region/category/min_confidence/verification_status/q 查询。
- UI 默认不自动播放媒体；未验证内容显示【未验证】。
- 每条信息可追溯至来源链接与发布时间。
- `npm test` 通过，`npm run build` 通过。
- `/api/*` 支持 `lang=zh|en`，同一条数据可返回双语文本。
- 页面能在 1 次打开后持续接收实时消息推送（SSE 心跳 + 更新事件）。
- 页面侧边栏新增“可信社媒来源监控”区，且仅展示 `sources.registry.json` 白名单域下的社媒条目。
- `querySocialMediaSources()` 与实时轮询路径包含社媒来源并在测试中有覆盖。
