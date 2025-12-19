import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { StateManager } from '../core/StateManager.js';
import { WorkflowValidator } from '../core/WorkflowValidator.js';
import { AgentLoader } from '../core/AgentLoader.js';

export async function planTasks(): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);
  const validator = new WorkflowValidator(projectRoot);
  const agentLoader = new AgentLoader(projectRoot);

  // 检查项目是否已初始化
  if (!stateManager.isInitialized()) {
    console.error(chalk.red('❌ 项目尚未初始化'));
    console.log(chalk.gray('   请先运行: ') + chalk.cyan('specflow init'));
    process.exit(1);
  }

  try {
    await stateManager.load();

    // 检查是否可以进入任务规划阶段
    const canProceed = await validator.canProceedToPhase('tasks');
    if (!canProceed.canProceed) {
      console.error(chalk.red('❌ ') + canProceed.reason);
      process.exit(1);
    }

    console.log(chalk.blue('📋 启动任务规划阶段'));
    console.log(chalk.gray('   代理: PM-Adam'));
    console.log();

    // 更新阶段状态
    await stateManager.updatePhaseStatus('tasks', 'in_progress');

    // 生成 AI 提示词
    const prompt = await agentLoader.generatePrompt('tasks');

    // 保存提示词到文件
    const promptPath = path.join(projectRoot, '.specflow', 'current_prompt.md');
    await fs.writeFile(promptPath, prompt, 'utf-8');

    console.log(chalk.yellow('📝 PM-Adam 代理已准备就绪'));
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
    console.log(chalk.gray('  2. 与 AI 协作完成任务分解'));
    console.log(chalk.gray('  3. 确保生成 docs/TODO.md 和 docs/tasks/'));
    console.log(chalk.gray('  4. 完成后运行: ') + chalk.cyan('specflow tasks finalize'));
  } catch (error) {
    console.error(chalk.red('❌ 启动失败:'), error);
    throw error;
  }
}

export async function finalizeTasks(): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);
  const validator = new WorkflowValidator(projectRoot);

  try {
    await stateManager.load();
    const state = stateManager.getState();
    const tasksPhase = state.phases.tasks;

    if (!tasksPhase || tasksPhase.status !== 'in_progress') {
      console.error(chalk.red('❌ 任务规划阶段未在进行中'));
      console.log(chalk.gray('   当前状态: ') + (tasksPhase?.status || 'unknown'));
      process.exit(1);
    }

    console.log(chalk.blue('🔍 验证任务文档...'));

    // 验证产出物
    const validation = await validator.validatePhaseArtifacts('tasks');

    if (!validation.valid) {
      console.error(chalk.red('❌ 验证失败：'));
      for (const error of validation.errors) {
        console.error(chalk.red(`   • ${error}`));
      }
      console.log();
      console.log(chalk.yellow('💡 提示：'));
      console.log(chalk.gray('   确保已生成 docs/TODO.md'));
      console.log(chalk.gray('   以及 docs/tasks/ 下的任务文件'));
      process.exit(1);
    }

    // 解析 TODO.md 并加载任务到状态中
    await loadTasksFromTodoFile(projectRoot, stateManager);

    // 标记阶段完成
    await stateManager.updatePhaseStatus('tasks', 'completed');

    console.log(chalk.green('✅ 任务规划阶段已完成！'));
    console.log();
    console.log(chalk.bold('产出物：'));
    const todoDoc = state.phases.tasks?.artifacts.todo;
    const tasksDir = state.phases.tasks?.artifacts.tasks_dir;
    if (todoDoc) {
      console.log(chalk.gray(`   ✓ ${todoDoc}`));
    }
    if (tasksDir) {
      console.log(chalk.gray(`   ✓ ${tasksDir}`));
    }
    console.log();

    // 显示任务统计
    const taskCount = Object.keys(state.tasks).length;
    console.log(chalk.bold(`任务总数: ${taskCount}`));
    console.log();

    console.log(chalk.bold('下一步：'));
    console.log(chalk.gray('  查看任务列表: ') + chalk.cyan('specflow tasks list'));
    console.log(chalk.gray('  开始执行任务: ') + chalk.cyan('specflow task start <Task-ID>'));
  } catch (error) {
    console.error(chalk.red('❌ 完成失败:'), error);
    throw error;
  }
}

export async function listTasks(): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);

  if (!stateManager.isInitialized()) {
    console.error(chalk.red('❌ 项目尚未初始化'));
    process.exit(1);
  }

  try {
    await stateManager.load();
    const state = stateManager.getState();

    console.log();
    console.log(chalk.bold.blue('📋 任务列表'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log();

    const tasks = Object.entries(state.tasks);

    if (tasks.length === 0) {
      console.log(chalk.yellow('暂无任务'));
      console.log();
      console.log(chalk.gray('运行 ') + chalk.cyan('specflow tasks plan') + chalk.gray(' 创建任务'));
      return;
    }

    // 按状态分组
    const tasksByStatus = {
      in_progress: [] as Array<[string, any]>,
      pending: [] as Array<[string, any]>,
      blocked: [] as Array<[string, any]>,
      completed: [] as Array<[string, any]>,
      needs_rework: [] as Array<[string, any]>,
      decomposed: [] as Array<[string, any]>
    };

    for (const [id, task] of tasks) {
      if (tasksByStatus[task.status]) {
        tasksByStatus[task.status].push([id, task]);
      }
    }

    // 显示各状态的任务
    const statusConfig = [
      { key: 'in_progress', label: '进行中', icon: '🔵', color: chalk.cyan },
      { key: 'pending', label: '待处理', icon: '⚪', color: chalk.gray },
      { key: 'blocked', label: '已阻塞', icon: '🚧', color: chalk.red },
      { key: 'needs_rework', label: '需返工', icon: '🔴', color: chalk.yellow },
      { key: 'decomposed', label: '已拆解', icon: '🔗', color: chalk.blue },
      { key: 'completed', label: '已完成', icon: '✅', color: chalk.green }
    ];

    for (const status of statusConfig) {
      const tasks = tasksByStatus[status.key as keyof typeof tasksByStatus];
      if (tasks.length > 0) {
        console.log(status.color(chalk.bold(`${status.icon} ${status.label} (${tasks.length})`)));
        for (const [id, task] of tasks) {
          console.log(chalk.gray(`   • ${id}`));
          if (task.dependencies && task.dependencies.length > 0) {
            console.log(chalk.gray(`     依赖: ${task.dependencies.join(', ')}`));
          }
        }
        console.log();
      }
    }

    console.log(chalk.gray('═'.repeat(60)));
    console.log();
    console.log(chalk.gray('查看详细信息: ') + chalk.cyan('cat docs/TODO.md'));
    console.log(chalk.gray('开始任务: ') + chalk.cyan('specflow task start <Task-ID>'));
    console.log();
  } catch (error) {
    console.error(chalk.red('❌ 获取任务列表失败:'), error);
    throw error;
  }
}

export async function decomposeTask(taskId: string, reason: string): Promise<void> {
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

    console.log(chalk.blue(`🔨 拆解任务: ${taskId}`));
    console.log(chalk.gray(`   原因: ${reason}`));
    console.log();

    // 生成提示词
    const prompt = await agentLoader.generatePrompt('tasks',
      `用户请求拆解任务 ${taskId}，原因: ${reason}\n请读取 docs/tasks/${taskId}.md 并与用户协作拆解此任务。`
    );

    // 保存提示词到文件
    const promptPath = path.join(projectRoot, '.specflow', 'current_prompt.md');
    await fs.writeFile(promptPath, prompt, 'utf-8');

    console.log(chalk.yellow('📝 PM-Adam 代理已准备就绪'));
    console.log();
    console.log(chalk.bold('请将以下提示词提供给 AI 助手：'));
    console.log(chalk.gray('─'.repeat(60)));
    console.log();
    console.log(prompt);
    console.log();
    console.log(chalk.gray('─'.repeat(60)));
    console.log();
    console.log(chalk.gray('提示词已保存到: ') + chalk.cyan(promptPath));
  } catch (error) {
    console.error(chalk.red('❌ 拆解失败:'), error);
    throw error;
  }
}

/**
 * 从 TODO.md 文件加载任务到状态中
 */
async function loadTasksFromTodoFile(
  projectRoot: string,
  stateManager: StateManager
): Promise<void> {
  const todoPath = path.join(projectRoot, 'docs', 'TODO.md');

  if (!await fs.pathExists(todoPath)) {
    return;
  }

  const content = await fs.readFile(todoPath, 'utf-8');
  const lines = content.split('\n');

  // 简单的表格解析（假设格式为 | status | priority | Task-ID | ... |）
  for (const line of lines) {
    const match = line.match(/\|\s*([⚪🔵✅🚧🔗🔴])\s*\|.*?\|\s*(`?Task-[A-Z]+-\d+`?)\s*\|/);
    if (match && match[1] && match[2]) {
      const statusIcon = match[1];
      const taskId = match[2].replace(/`/g, '');

      const statusMap: Record<string, any> = {
        '⚪': 'pending',
        '🔵': 'in_progress',
        '✅': 'completed',
        '🚧': 'blocked',
        '🔗': 'decomposed',
        '🔴': 'needs_rework'
      };

      const taskFilePath = path.join(projectRoot, 'docs', 'tasks', `${taskId}.md`);
      const status = statusIcon ? (statusMap[statusIcon] || 'pending') : 'pending';

      await stateManager.addTask(taskId, {
        status: status,
        dependencies: [],
        filePath: taskFilePath
      });
    }
  }
}
