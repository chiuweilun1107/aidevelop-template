import chalk from 'chalk';
import { StateManager } from '../core/StateManager.js';
import { PhaseStatus } from '../core/types.js';

export async function showStatus(): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);

  if (!stateManager.isInitialized()) {
    console.error(chalk.red('❌ 项目尚未初始化'));
    console.log(chalk.gray('   请先运行: ') + chalk.cyan('specflow init'));
    process.exit(1);
  }

  try {
    await stateManager.load();
    const state = stateManager.getState();

    console.log();
    console.log(chalk.bold.blue('📊 SpecFlow 项目状态'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log();

    // 项目信息
    console.log(chalk.bold('项目信息：'));
    console.log(chalk.gray(`  名称: `) + state.projectName);
    console.log(chalk.gray(`  当前阶段: `) + chalk.cyan(state.currentPhase));
    if (state.activeAgent) {
      console.log(chalk.gray(`  活跃代理: `) + chalk.yellow(state.activeAgent));
    }
    console.log();

    // 阶段进度
    console.log(chalk.bold('阶段进度：'));
    console.log();

    const phases = [
      { key: 'requirements', name: '需求分析', agent: 'PM-Adam' },
      { key: 'blueprint', name: '技术蓝图', agent: 'SA-Leo' },
      { key: 'design', name: 'UI/UX 设计', agent: 'UI-Mia' },
      { key: 'tasks', name: '任务规划', agent: 'PM-Adam' },
      { key: 'development', name: '开发执行', agent: 'Multiple' }
    ];

    for (const phase of phases) {
      const phaseConfig = state.phases[phase.key];
      if (!phaseConfig) continue;

      const statusIcon = getStatusIcon(phaseConfig.status);
      const statusColor = getStatusColor(phaseConfig.status);

      console.log(`  ${statusIcon} ${chalk.bold(phase.name)}`);
      console.log(chalk.gray(`     状态: `) + statusColor(phaseConfig.status));
      console.log(chalk.gray(`     代理: `) + phase.agent);

      if (phaseConfig.dependencies && phaseConfig.dependencies.length > 0) {
        console.log(chalk.gray(`     依赖: `) + phaseConfig.dependencies.join(', '));
      }

      if (phaseConfig.startedAt) {
        console.log(chalk.gray(`     开始: `) + new Date(phaseConfig.startedAt).toLocaleString('zh-CN'));
      }

      if (phaseConfig.completedAt) {
        console.log(chalk.gray(`     完成: `) + new Date(phaseConfig.completedAt).toLocaleString('zh-CN'));
      }

      console.log();
    }

    // 任务统计
    const tasks = Object.entries(state.tasks);
    if (tasks.length > 0) {
      console.log(chalk.bold('任务统计：'));
      const taskStats = {
        pending: 0,
        in_progress: 0,
        completed: 0,
        blocked: 0,
        needs_rework: 0,
        decomposed: 0
      };

      for (const [_, task] of tasks) {
        taskStats[task.status]++;
      }

      console.log(chalk.gray(`  总计: `) + tasks.length);
      console.log(chalk.gray(`  待处理: `) + taskStats.pending);
      console.log(chalk.gray(`  进行中: `) + chalk.cyan(taskStats.in_progress));
      console.log(chalk.gray(`  已完成: `) + chalk.green(taskStats.completed));
      console.log(chalk.gray(`  已阻塞: `) + chalk.red(taskStats.blocked));
      console.log(chalk.gray(`  需返工: `) + chalk.yellow(taskStats.needs_rework));
      console.log();
    }

    // 下一步建议
    console.log(chalk.bold('下一步建议：'));
    const currentPhase = state.phases[state.currentPhase];

    if (currentPhase && currentPhase.status === 'pending') {
      console.log(chalk.gray(`  运行: `) + chalk.cyan(`specflow ${state.currentPhase} start`));
    } else if (currentPhase && currentPhase.status === 'in_progress') {
      console.log(chalk.gray(`  继续当前阶段的工作`));
      console.log(chalk.gray(`  完成后运行: `) + chalk.cyan(`specflow ${state.currentPhase} finalize`));
    } else if (currentPhase && currentPhase.status === 'completed') {
      const nextPhase = getNextPhase(state.currentPhase);
      if (nextPhase) {
        console.log(chalk.gray(`  运行: `) + chalk.cyan(`specflow ${nextPhase} plan`));
      } else {
        console.log(chalk.green(`  ✅ 所有阶段已完成！`));
      }
    }

    console.log();
    console.log(chalk.gray('═'.repeat(60)));
    console.log();
  } catch (error) {
    console.error(chalk.red('❌ 获取状态失败:'), error);
    throw error;
  }
}

function getStatusIcon(status: PhaseStatus): string {
  const icons = {
    pending: '⚪',
    in_progress: '🔵',
    completed: '✅',
    blocked: '🚧'
  };
  return icons[status] || '❓';
}

function getStatusColor(status: PhaseStatus): (text: string) => string {
  const colors = {
    pending: chalk.gray,
    in_progress: chalk.cyan,
    completed: chalk.green,
    blocked: chalk.red
  };
  return colors[status] || chalk.white;
}

function getNextPhase(currentPhase: string): string | null | undefined {
  const phaseOrder = ['requirements', 'blueprint', 'design', 'tasks', 'development'];
  const currentIndex = phaseOrder.indexOf(currentPhase);

  if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
    return null;
  }

  return phaseOrder[currentIndex + 1];
}
