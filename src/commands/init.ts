import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { StateManager } from '../core/StateManager.js';
import { SpecFlowConfig } from '../core/types.js';

export async function initProject(
  projectName?: string,
  options: {
    sourceFramework?: string;
    standards?: 'basic' | 'complete' | 'enterprise';
  } = {}
): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);

  // 检查是否已初始化
  if (stateManager.isInitialized()) {
    console.log(chalk.yellow('⚠️  项目已经初始化。'));
    console.log(chalk.gray(`   状态文件: ${path.join(projectRoot, '.specflow', 'state.json')}`));
    return;
  }

  // 确定项目名称
  const finalProjectName = projectName || path.basename(projectRoot);

  console.log(chalk.blue('🚀 初始化 SpecFlow 项目...'));
  console.log(chalk.gray(`   项目名称: ${finalProjectName}`));
  console.log(chalk.gray(`   项目路径: ${projectRoot}`));
  console.log();

  try {
    // 1. 创建基本目录结构
    console.log(chalk.cyan('📁 创建项目结构...'));
    await createDirectoryStructure(projectRoot);

    // 2. 复制代理定义文件
    console.log(chalk.cyan('🤖 复制代理定义...'));
    await copyAgents(projectRoot, options.sourceFramework);

    // 3. 创建配置文件
    console.log(chalk.cyan('⚙️  创建配置文件...'));
    await createConfig(projectRoot, {
      projectName: finalProjectName,
      standardsPackage: options.standards || 'complete',
      sourceFrameworkPath: options.sourceFramework
    });

    // 4. 初始化状态
    console.log(chalk.cyan('💾 初始化项目状态...'));
    await stateManager.initialize(finalProjectName);

    // 5. 创建模板文件
    console.log(chalk.cyan('📄 创建文档模板...'));
    await createTemplates(projectRoot);

    console.log();
    console.log(chalk.green('✅ SpecFlow 项目初始化完成！'));
    console.log();
    console.log(chalk.bold('下一步：'));
    console.log(chalk.gray('  1. 准备你的需求文件（例如：requirements.md）'));
    console.log(chalk.gray('  2. 运行: ') + chalk.cyan('specflow requirements start <需求文件路径>'));
    console.log();
    console.log(chalk.gray('查看项目状态: ') + chalk.cyan('specflow status'));
  } catch (error) {
    console.error(chalk.red('❌ 初始化失败:'), error);
    throw error;
  }
}

async function createDirectoryStructure(projectRoot: string): Promise<void> {
  const dirs = [
    '.specflow',
    '.specflow/agents',
    '.specflow/templates',
    'specs',
    'docs',
    'docs/architecture',
    'docs/frontend',
    'docs/backend',
    'docs/database',
    'docs/security',
    'docs/wireframes',
    'docs/tasks'
  ];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectRoot, dir));
  }
}

async function copyAgents(
  projectRoot: string,
  sourceFrameworkPath?: string
): Promise<void> {
  const targetAgentsPath = path.join(projectRoot, '.specflow', 'agents');

  // 如果用户提供了源框架路径，从那里复制
  if (sourceFrameworkPath) {
    const sourceAgentsPath = path.join(sourceFrameworkPath, 'agents');
    if (await fs.pathExists(sourceAgentsPath)) {
      await fs.copy(sourceAgentsPath, targetAgentsPath);
      console.log(chalk.gray(`   ✓ 从 ${sourceAgentsPath} 复制代理定义`));
      return;
    }
  }

  // 否则，创建基本的代理模板
  await createDefaultAgents(targetAgentsPath);
}

async function createDefaultAgents(agentsPath: string): Promise<void> {
  const agents = [
    {
      file: 'project_manager.md',
      content: `---
name: "PM-Adam"
role: "Project Manager"
description: "负责需求分析和项目规划的 AI 代理"
tools:
  - "read_file"
  - "edit_file"
---

# Agent System Prompt

你是专案经理 Adam，负责将使用者需求转化为具体的开发计划。

## 核心职责
1. 需求探询与澄清
2. 文档分析与生成
3. 资讯架构提炼
4. 风险识别

请严格遵循 \`02_RequirementsSpec_Template.md\` 的结构生成需求文档。
`
    },
    {
      file: 'system_architect.md',
      content: `---
name: "SA-Leo"
role: "System Architect"
description: "负责技术架构设计的 AI 代理"
tools:
  - "read_file"
  - "edit_file"
---

# Agent System Prompt

你是系统架构师 Leo，负责技术选型和架构设计。

## 核心职责
1. 技术栈选型
2. 架构设计
3. 开发规范定义
4. 部署策略规划

请严格遵循 \`03_Blueprint_Guide.md\` 的流程生成蓝图文档。
`
    }
  ];

  for (const agent of agents) {
    await fs.writeFile(
      path.join(agentsPath, agent.file),
      agent.content,
      'utf-8'
    );
  }

  console.log(chalk.gray(`   ✓ 创建默认代理定义`));
}

async function createConfig(
  projectRoot: string,
  config: SpecFlowConfig
): Promise<void> {
  const configPath = path.join(projectRoot, '.specflow', 'config.json');
  await fs.writeJson(configPath, config, { spaces: 2 });
}

async function createTemplates(projectRoot: string): Promise<void> {
  const templatesPath = path.join(projectRoot, '.specflow', 'templates');

  // 创建 .gitignore
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (!await fs.pathExists(gitignorePath)) {
    await fs.writeFile(
      gitignorePath,
      `# SpecFlow
.specflow/state.json

# Dependencies
node_modules/
dist/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
`,
      'utf-8'
    );
  }

  // 创建 README
  const readmePath = path.join(projectRoot, 'SPECFLOW_README.md');
  await fs.writeFile(
    readmePath,
    `# SpecFlow 项目

本项目使用 SpecFlow 进行规范驱动开发。

## 工作流程

1. **需求分析** - 由 PM-Adam 代理处理
   \`\`\`bash
   specflow requirements start <需求文件>
   \`\`\`

2. **技术蓝图** - 由 SA-Leo 代理处理
   \`\`\`bash
   specflow blueprint plan
   \`\`\`

3. **UI/UX 设计** - 由 UI-Mia 代理处理
   \`\`\`bash
   specflow design start
   \`\`\`

4. **任务规划** - 由 PM-Adam 代理处理
   \`\`\`bash
   specflow tasks plan
   \`\`\`

5. **开发执行**
   \`\`\`bash
   specflow task start <Task-ID>
   \`\`\`

## 查看状态

\`\`\`bash
specflow status
\`\`\`

## 项目结构

- \`.specflow/\` - SpecFlow 配置和状态
- \`specs/\` - 规范文档（需求、蓝图）
- \`docs/\` - 设计文档、任务文件
`,
    'utf-8'
  );
}
