# SpecFlow CLI

[![npm version](https://img.shields.io/npm/v/@chiuweilun1107/specflow-cli.svg)](https://www.npmjs.com/package/@chiuweilun1107/specflow-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![GitHub Stars](https://img.shields.io/github/stars/chiuweilun1107/aidevelop-template.svg)](https://github.com/chiuweilun1107/aidevelop-template/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/chiuweilun1107/aidevelop-template.svg)](https://github.com/chiuweilun1107/aidevelop-template/issues)

一个专为 AI 辅助开发设计的**规范驱动开发 CLI 工具**，将提示词工作流工程化。

## 📋 项目背景

SpecFlow CLI 解决了使用提示词管理开发工作流的核心问题：

- **❌ 提示词不够可靠** - AI 可能忽略或误解提示词
- **❌ 无状态管理** - 不知道当前处于哪个开发阶段
- **❌ 无持久化** - 规范没有固定在文件系统中
- **❌ 无版本控制** - 变更历史无法追溯

SpecFlow 通过 **CLI 工具 + 文件系统结构 + 工作流验证** 强制执行规范驱动开发。

## ✨ 核心特性

### 1. 完整的开发生命周期

```
需求分析 → 技术蓝图 → UI/UX 设计 → 任务规划 → 开发执行
   ↓          ↓           ↓          ↓          ↓
PM-Adam   SA-Leo      UI-Mia     PM-Adam   开发代理
```

### 2. 强制的工作流验证

- ✅ 阶段依赖检查 - 必须完成前置阶段才能进入下一阶段
- ✅ 产出物验证 - 检查必需的文档和结构是否存在
- ✅ 状态持久化 - 所有状态保存在文件系统中

### 3. 多代理协作系统

- **PM-Adam** (项目经理) - 需求分析、任务规划
- **SA-Leo** (系统架构师) - 技术选型、架构设计
- **UI-Mia** (UI/UX 设计师) - 界面设计、线框图
- **FE-Ava** (前端工程师) - 前端开发
- **BE-Rex** (后端工程师) - 后端开发
- **QA-Sam** (QA 审查员) - 代码审查

## 🚀 快速开始

### 安装

#### 方式 1: 从 GitHub 直接安装（推荐）

```bash
# 全局安装
npm install -g git+https://github.com/chiuweilun1107/aidevelop-template.git

# 验证安装
specflow --version
```

#### 方式 2: 从源码安装（开发者）

```bash
# 克隆仓库
git clone https://github.com/chiuweilun1107/aidevelop-template.git
cd aidevelop-template

# 安装依赖并构建
npm install
npm run build

# 全局链接
npm link

# 验证安装
specflow --version
```

#### 方式 3: 本地项目安装

```bash
# 在你的项目中
npm install git+https://github.com/chiuweilun1107/aidevelop-template.git

# 使用 npx 运行
npx specflow --version
```

### 初始化项目

```bash
# 创建新项目目录
mkdir my-project && cd my-project

# 初始化 SpecFlow 项目，从你的框架目录复制代理定义
specflow init "我的项目" --source-framework "/path/to/規範驅動開發"

# 查看项目状态
specflow status
```

## 📁 项目结构

```
my-project/
├── .specflow/
│   ├── config.json           # 项目配置
│   ├── state.json            # 工作流状态
│   ├── agents/               # AI 代理定义
│   │   ├── project_manager.md
│   │   ├── system_architect.md
│   │   └── ...
│   ├── current_prompt.md     # 当前阶段的 AI 提示词
│   └── input_requirements.md # 用户提供的需求文件
│
├── specs/                    # 规范文档（单一事实来源）
│   ├── PROJECT_REQUIREMENTS.md
│   └── PROJECT_BLUEPRINT.md
│
└── docs/                     # 设计文档和任务
    ├── architecture/
    ├── frontend/
    ├── backend/
    ├── wireframes/
    ├── design_system.md
    ├── TODO.md
    └── tasks/
```

## 🛠️ 完整命令参考

### 项目初始化

```bash
specflow init [项目名称] [选项]

选项：
  -s, --source-framework <path>  源框架路径（包含 agents 目录）
  --standards <type>             开发规范套件 (basic|complete|enterprise)
```

### 查看状态

```bash
specflow status
```

### Phase 1: 需求分析

```bash
specflow requirements start [需求文件]  # 启动需求分析
specflow requirements review            # 检查需求文档
specflow requirements finalize          # 完成需求分析
```

**产出物**: `specs/PROJECT_REQUIREMENTS.md`

### Phase 2: 技术蓝图

```bash
specflow blueprint plan       # 启动技术蓝图规划
specflow blueprint review     # 检查蓝图文档
specflow blueprint finalize   # 完成技术蓝图
```

**产出物**: `specs/PROJECT_BLUEPRINT.md` + `docs/` 下的规范文档

### Phase 3: UI/UX 设计

```bash
specflow design start         # 启动 UI/UX 设计
specflow design review        # 检查设计文档
specflow design finalize      # 完成 UI/UX 设计
```

**产出物**: `docs/design_system.md` + `docs/wireframes/`

### Phase 4: 任务规划

```bash
specflow tasks plan           # 启动任务规划
specflow tasks list           # 列出所有任务
specflow tasks finalize       # 完成任务规划
specflow tasks decompose <Task-ID> "原因"  # 拆解任务
```

**产出物**: `docs/TODO.md` + `docs/tasks/`

### Phase 5: 开发执行

```bash
specflow task start <Task-ID>     # 开始执行任务
specflow task submit <Task-ID>    # 提交任务审查
specflow task complete <Task-ID>  # 完成任务
specflow task rework <Task-ID>    # 标记任务需要返工
```

## 🔄 完整工作流示例

```bash
# 1. 初始化项目
specflow init "电商平台" --source-framework "/path/to/規範驅動開發"

# 2. 需求分析
specflow requirements start requirements.md
# -> 复制 AI 提示词给 Claude
# -> 生成 specs/PROJECT_REQUIREMENTS.md
specflow requirements finalize

# 3. 技术蓝图
specflow blueprint plan
# -> 复制 AI 提示词给 Claude
# -> 生成 specs/PROJECT_BLUEPRINT.md
specflow blueprint finalize

# 4. UI/UX 设计
specflow design start
# -> 复制 AI 提示词给 Claude
# -> 生成 docs/design_system.md 和线框图
specflow design finalize

# 5. 任务规划
specflow tasks plan
# -> 复制 AI 提示词给 Claude
# -> 生成 docs/TODO.md 和任务文件
specflow tasks finalize

# 6. 查看任务列表
specflow tasks list

# 7. 开始第一个任务
specflow task start Task-FE-001
# -> 复制 AI 提示词给 Claude
# -> 完成开发

# 8. 提交审查
specflow task submit Task-FE-001
# -> 复制 QA 提示词给 Claude
# -> 审查代码

# 9. 完成任务
specflow task complete Task-FE-001

# 10. 继续下一个任务
specflow task start Task-BE-002
```

## 🎯 核心设计理念

### 1. 文件系统即状态

所有状态存储在 `.specflow/state.json` 中：

```json
{
  "version": "1.0.0",
  "projectName": "我的项目",
  "currentPhase": "requirements",
  "phases": {
    "requirements": {
      "status": "in_progress",
      "agent": "PM-Adam",
      "dependencies": []
    }
  },
  "tasks": {}
}
```

### 2. 强制的阶段依赖

```typescript
{
  "requirements": { dependencies: [] },
  "blueprint": { dependencies: ["requirements"] },
  "design": { dependencies: ["blueprint"] },
  "tasks": { dependencies: ["design"] },
  "development": { dependencies: ["tasks"] }
}
```

### 3. AI 提示词生成

每个阶段自动生成完整的 AI 提示词：

```
代理系统提示（从 agents/*.md 加载）
+
项目上下文（名称、阶段、已完成阶段）
+
阶段特定的指令
+
参考文档路径
```

## 📊 vs OpenSpec 对比

| 特性 | SpecFlow | OpenSpec |
|-----|----------|----------|
| **生命周期覆盖** | ✅ 需求→蓝图→设计→任务→开发 | ⚠️ 只有变更管理 |
| **角色分工** | ✅ 7个专业代理 | ❌ 无角色 |
| **UI/UX 设计** | ✅ 独立设计阶段 | ❌ 无 |
| **任务管理** | ✅ 依赖分析+MVP+拆解 | ⚠️ 简单列表 |
| **开发规范** | ✅ 三级套件 | ❌ 无 |
| **代码库整合** | ✅ 同化框架 | ⚠️ 简单 |
| **强制执行** | ✅ CLI + 验证 | ✅ CLI |

## 🔧 技术栈

- **语言**: TypeScript
- **CLI 框架**: Commander.js
- **文件操作**: fs-extra
- **YAML 解析**: gray-matter
- **样式**: chalk

## 📝 状态管理

SpecFlow 使用文件系统作为状态管理：

- `.specflow/state.json` - 项目状态和任务
- `.specflow/config.json` - 项目配置
- `.specflow/current_prompt.md` - 当前阶段的 AI 提示词
- `specs/` - 已确认的规范文档（单一事实来源）
- `docs/` - 设计文档和任务文件

## 🎓 使用技巧

### 1. 阶段切换

每个阶段完成后，CLI 会提示下一步命令：

```bash
✅ 需求分析阶段已完成！

下一步：
  运行: specflow blueprint plan
```

### 2. 状态检查

随时运行 `specflow status` 查看：
- 当前阶段和活跃代理
- 所有阶段的状态
- 任务统计
- 下一步建议

### 3. 任务依赖

任务会自动检查依赖：

```bash
❌ 任务 Task-FE-001 有未完成的依赖:
   • Task-BE-002 (pending)
```

### 4. 文档验证

finalize 命令会自动验证：
- 文件是否存在
- 文档结构是否正确
- 必需章节是否完整

## 🤝 贡献

这是一个实验性项目，欢迎提出建议和改进！

## 📄 许可

MIT

---

**🎉 SpecFlow CLI - 让规范驱动开发真正可靠！**
