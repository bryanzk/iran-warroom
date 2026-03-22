<!-- generated-by: manage_agents.py -->
# WarRoom

## Purpose
- WarRoom 仓库。
- 本文件只描述当前仓库的导航信息；通用 Codex 规则由上层环境提供。

## Read First
- 仓库根目录没有 README；先从源码、脚本和测试入口逆向理解。

## Repo Map
- `app/`: 应用入口与页面目录
- `lib/`: 共享逻辑与工具库
- `scripts/`: 脚本与运维入口
- `tests/`: 回归测试与 fixture
- `tasks/`: 任务与运行记录

## Source Of Truth
- `package.json`

## Common Workflows
- `npm run dev`
- `npm run build`
- `npm run test`
- `npm run start`
- `npm run preview`
- `npm run deploy`

## Verification
- 优先运行 `npm run test`。
- 修改文档或配置时，确认引用路径、脚本入口和说明一致。

## High-Risk Areas
- `scripts/`: 脚本可能触发批量操作或写入

## Change Rules
- 不要在本文件复制通用 Codex 规则；只保留仓库特有约束。
- 变更入口命令、目录结构或对外接口时，同步更新 README、docs 和相关测试。
- 若任务仅落在某个局部目录，先阅读该目录下的 `AGENTS.md` 再修改。

## When To Ask
- 需要改变公开接口、部署方式、配置默认值或数据格式时。
- 需要删除目录、重命名关键文件或绕过现有验证入口时。

## Subdirectory AGENTS
- 当前仓库没有额外的局部 `AGENTS.md`。
