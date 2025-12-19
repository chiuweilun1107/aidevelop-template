import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { StateManager } from '../core/StateManager.js';
import { AgentLoader } from '../core/AgentLoader.js';

export async function startTask(taskId: string): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);
  const agentLoader = new AgentLoader(projectRoot);

  if (!stateManager.isInitialized()) {
    console.error(chalk.red('❌ 项目尚未初始化'));
    process.exit(1);
  }

  try {
    await stateManager.load();
    const state = stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) {
      console.error(chalk.red(`❌ 找不到任务: ${taskId}`));
      console.log();
      console.log(chalk.gray('运行 ') + chalk.cyan('specflow tasks list') + chalk.gray(' 查看所有任务'));
      process.exit(1);
    }

    // 检查任务状态
    if (task.status === 'completed') {
      console.log(chalk.yellow(`⚠️  任务 ${taskId} 已完成`));
      process.exit(1);
    }

    if (task.status === 'in_progress') {
      console.log(chalk.yellow(`⚠️  任务 ${taskId} 已在进行中`));
      process.exit(1);
    }

    // 检查依赖任务是否完成
    if (task.dependencies && task.dependencies.length > 0) {
      const unfinishedDeps = task.dependencies.filter(depId => {
        const depTask = state.tasks[depId];
        return depTask && depTask.status !== 'completed';
      });

      if (unfinishedDeps.length > 0) {
        console.error(chalk.red(`❌ 任务 ${taskId} 有未完成的依赖:`));
        for (const depId of unfinishedDeps) {
          const depTask = state.tasks[depId];
          console.error(chalk.red(`   • ${depId} (${depTask?.status || 'unknown'})`));
        }
        process.exit(1);
      }
    }

    console.log(chalk.blue(`🚀 开始执行任务: ${taskId}`));
    console.log();

    // 确定代理类型（根据任务 ID 前缀）
    let agentRole = 'Frontend Engineer';
    if (taskId.startsWith('Task-BE-') || taskId.startsWith('Task-DB-')) {
      agentRole = 'Backend Engineer';
    } else if (taskId.startsWith('Task-FE-')) {
      agentRole = 'Frontend Engineer';
    } else if (taskId.startsWith('Task-DevOps-')) {
      agentRole = 'DevOps';
    }

    console.log(chalk.gray(`   代理: ${agentRole}`));
    console.log();

    // 更新任务状态
    await stateManager.updateTaskStatus(taskId, 'in_progress');

    // 读取任务文件
    const taskFilePath = task.filePath || path.join(projectRoot, 'docs', 'tasks', `${taskId}.md`);
    let taskContent = '';
    if (await fs.pathExists(taskFilePath)) {
      taskContent = await fs.readFile(taskFilePath, 'utf-8');
    }

    // 生成 AI 提示词
    const agentPrompt = await agentLoader.loadAgent(agentRole);
    const prompt = `${agentPrompt.systemPrompt}

# 当前任务: ${taskId}

${taskContent}

# 你的任务
1. 严格按照任务文件中的 "开发待办清单" 进行开发
2. 遵循 PROJECT_BLUEPRINT.md 中的所有规范
3. 确保通过所有 "验收标准"
4. 完成后，通知用户运行: specflow task submit ${taskId}

# 注意事项
- 仔细阅读任务文件中的 "参考规范" 部分
- 如遇到难点，参考任务文件中的 "难点说明"
- 所有代码必须符合项目规范
`;

    // 保存提示词到文件
    const promptPath = path.join(projectRoot, '.specflow', 'current_prompt.md');
    await fs.writeFile(promptPath, prompt, 'utf-8');

    console.log(chalk.yellow(`📝 ${agentRole} 代理已准备就绪`));
    console.log();
    console.log(chalk.bold('请将以下提示词提供给 AI 助手（例如 Claude）：'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log();
    console.log(prompt);
    console.log();
    console.log(chalk.gray('─'.repeat(60)));
    console.log();
    console.log(chalk.gray('提示词已保存到: ') + chalk.cyan(promptPath));
    console.log();
    console.log(chalk.bold('工作流程：'));
    console.log(chalk.gray('  1. 将上述提示词复制给 AI 助手'));
    console.log(chalk.gray('  2. 与 AI 协作完成任务开发'));
    console.log(chalk.gray('  3. 完成后运行: ') + chalk.cyan(`specflow task submit ${taskId}`));
  } catch (error) {
    console.error(chalk.red('❌ 启动任务失败:'), error);
    throw error;
  }
}

export async function submitTask(taskId: string): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);
  const agentLoader = new AgentLoader(projectRoot);

  if (!stateManager.isInitialized()) {
    console.error(chalk.red('❌ 项目尚未初始化'));
    process.exit(1);
  }

  try {
    await stateManager.load();
    const state = stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) {
      console.error(chalk.red(`❌ 找不到任务: ${taskId}`));
      process.exit(1);
    }

    if (task.status !== 'in_progress') {
      console.error(chalk.red(`❌ 任务 ${taskId} 未在进行中`));
      console.log(chalk.gray(`   当前状态: ${task.status}`));
      process.exit(1);
    }

    console.log(chalk.blue(`📤 提交任务: ${taskId}`));
    console.log(chalk.gray('   代理: QA-Sam'));
    console.log();

    // 生成 QA 审查提示词
    const qaAgent = await agentLoader.loadAgent('QA Reviewer');
    const taskFilePath = task.filePath || path.join(projectRoot, 'docs', 'tasks', `${taskId}.md`);
    let taskContent = '';
    if (await fs.pathExists(taskFilePath)) {
      taskContent = await fs.readFile(taskFilePath, 'utf-8');
    }

    const prompt = `${qaAgent.systemPrompt}

# 待审查任务: ${taskId}

${taskContent}

# 你的任务
1. 审查任务相关的所有代码变更
2. 检查是否符合 PROJECT_BLUEPRINT.md 中的规范
3. 验证所有 "验收标准" 是否通过
4. 提供审查报告

# 审查通过后
用户应运行: specflow task complete ${taskId}

# 审查失败时
用户应运行: specflow task rework ${taskId}
`;

    // 保存提示词到文件
    const promptPath = path.join(projectRoot, '.specflow', 'current_prompt.md');
    await fs.writeFile(promptPath, prompt, 'utf-8');

    console.log(chalk.yellow('📝 QA-Sam 代理已准备就绪'));
    console.log();
    console.log(chalk.bold('请将以下提示词提供给 AI 助手进行审查：'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log();
    console.log(prompt);
    console.log();
    console.log(chalk.gray('─'.repeat(60)));
    console.log();
    console.log(chalk.gray('提示词已保存到: ') + chalk.cyan(promptPath));
    console.log();
    console.log(chalk.bold('审查结果：'));
    console.log(chalk.gray('  审查通过: ') + chalk.cyan(`specflow task complete ${taskId}`));
    console.log(chalk.gray('  需要返工: ') + chalk.cyan(`specflow task rework ${taskId}`));
  } catch (error) {
    console.error(chalk.red('❌ 提交失败:'), error);
    throw error;
  }
}

export async function completeTask(taskId: string): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);

  if (!stateManager.isInitialized()) {
    console.error(chalk.red('❌ 项目尚未初始化'));
    process.exit(1);
  }

  try {
    await stateManager.load();
    const state = stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) {
      console.error(chalk.red(`❌ 找不到任务: ${taskId}`));
      process.exit(1);
    }

    // 更新任务状态为已完成
    await stateManager.updateTaskStatus(taskId, 'completed');

    console.log(chalk.green(`✅ 任务 ${taskId} 已完成！`));
    console.log();

    // 更新 TODO.md 文件
    const todoPath = path.join(projectRoot, 'docs', 'TODO.md');
    if (await fs.pathExists(todoPath)) {
      let content = await fs.readFile(todoPath, 'utf-8');
      // 将任务行的状态图标更新为 ✅
      const taskPattern = new RegExp(`\\|\\s*[⚪🔵🚧🔗🔴]\\s*\\|(.*)\\|\\s*\`?${taskId}\`?\\s*\\|`, 'g');
      content = content.replace(taskPattern, '| ✅ |$1| `' + taskId + '` |');
      await fs.writeFile(todoPath, content, 'utf-8');
      console.log(chalk.gray('   ✓ 已更新 docs/TODO.md'));
    }

    // 查找下一个可执行的任务
    const nextTask = findNextAvailableTask(state);
    if (nextTask) {
      console.log();
      console.log(chalk.bold('下一个任务：'));
      console.log(chalk.gray('  运行: ') + chalk.cyan(`specflow task start ${nextTask}`));
    } else {
      console.log();
      console.log(chalk.green('🎉 所有任务已完成！'));
    }
  } catch (error) {
    console.error(chalk.red('❌ 完成失败:'), error);
    throw error;
  }
}

export async function reworkTask(taskId: string): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);

  if (!stateManager.isInitialized()) {
    console.error(chalk.red('❌ 项目尚未初始化'));
    process.exit(1);
  }

  try {
    await stateManager.load();
    const state = stateManager.getState();
    const task = state.tasks[taskId];

    if (!task) {
      console.error(chalk.red(`❌ 找不到任务: ${taskId}`));
      process.exit(1);
    }

    // 更新任务状态为需要返工
    await stateManager.updateTaskStatus(taskId, 'needs_rework');

    console.log(chalk.yellow(`🔴 任务 ${taskId} 需要返工`));
    console.log();

    // 更新 TODO.md 文件
    const todoPath = path.join(projectRoot, 'docs', 'TODO.md');
    if (await fs.pathExists(todoPath)) {
      let content = await fs.readFile(todoPath, 'utf-8');
      const taskPattern = new RegExp(`\\|\\s*[⚪🔵✅🚧🔗]\\s*\\|(.*)\\|\\s*\`?${taskId}\`?\\s*\\|`, 'g');
      content = content.replace(taskPattern, '| 🔴 |$1| `' + taskId + '` |');
      await fs.writeFile(todoPath, content, 'utf-8');
      console.log(chalk.gray('   ✓ 已更新 docs/TODO.md'));
    }

    console.log();
    console.log(chalk.bold('下一步：'));
    console.log(chalk.gray('  修复问题后重新开始: ') + chalk.cyan(`specflow task start ${taskId}`));
  } catch (error) {
    console.error(chalk.red('❌ 标记失败:'), error);
    throw error;
  }
}

/**
 * 查找下一个可执行的任务
 */
function findNextAvailableTask(state: any): string | null {
  for (const [taskId, task] of Object.entries(state.tasks) as Array<[string, any]>) {
    if (task.status === 'pending') {
      // 检查依赖是否都完成
      if (!task.dependencies || task.dependencies.length === 0) {
        return taskId;
      }

      const allDepsCompleted = task.dependencies.every((depId: string) => {
        const depTask = state.tasks[depId];
        return depTask && depTask.status === 'completed';
      });

      if (allDepsCompleted) {
        return taskId;
      }
    }
  }
  return null;
}
