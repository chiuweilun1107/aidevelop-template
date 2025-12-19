#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { initProject } from './commands/init.js';
import { startRequirements, finalizeRequirements, reviewRequirements } from './commands/requirements.js';
import { planBlueprint, finalizeBlueprint, reviewBlueprint } from './commands/blueprint.js';
import { startDesign, finalizeDesign, reviewDesign } from './commands/design.js';
import { planTasks, finalizeTasks, listTasks, decomposeTask } from './commands/tasks.js';
import { startTask, submitTask, completeTask, reworkTask } from './commands/task.js';
import { showStatus } from './commands/status.js';

const program = new Command();

program
  .name('specflow')
  .description('规范驱动开发 CLI 工具')
  .version('1.0.0');

// init 命令
program
  .command('init [project-name]')
  .description('初始化 SpecFlow 项目')
  .option('-s, --source-framework <path>', '源框架路径（包含 agents 目录）')
  .option('--standards <type>', '开发规范套件 (basic|complete|enterprise)', 'complete')
  .action(async (projectName, options) => {
    try {
      await initProject(projectName, {
        sourceFramework: options.sourceFramework,
        standards: options.standards
      });
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

// status 命令
program
  .command('status')
  .description('显示项目当前状态')
  .action(async () => {
    try {
      await showStatus();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

// requirements 命令组
const requirementsCmd = program
  .command('requirements')
  .description('需求分析阶段命令');

requirementsCmd
  .command('start [requirement-file]')
  .description('启动需求分析阶段')
  .action(async (requirementFile) => {
    try {
      await startRequirements(requirementFile);
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

requirementsCmd
  .command('review')
  .description('检查需求文档')
  .action(async () => {
    try {
      await reviewRequirements();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

requirementsCmd
  .command('finalize')
  .description('完成需求分析阶段')
  .action(async () => {
    try {
      await finalizeRequirements();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

// blueprint 命令组
const blueprintCmd = program
  .command('blueprint')
  .description('技术蓝图阶段命令');

blueprintCmd
  .command('plan')
  .description('启动技术蓝图规划')
  .action(async () => {
    try {
      await planBlueprint();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

blueprintCmd
  .command('review')
  .description('检查蓝图文档')
  .action(async () => {
    try {
      await reviewBlueprint();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

blueprintCmd
  .command('finalize')
  .description('完成技术蓝图阶段')
  .action(async () => {
    try {
      await finalizeBlueprint();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

// design 命令组
const designCmd = program
  .command('design')
  .description('UI/UX 设计阶段命令');

designCmd
  .command('start')
  .description('启动 UI/UX 设计阶段')
  .action(async () => {
    try {
      await startDesign();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

designCmd
  .command('review')
  .description('检查设计文档')
  .action(async () => {
    try {
      await reviewDesign();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

designCmd
  .command('finalize')
  .description('完成 UI/UX 设计阶段')
  .action(async () => {
    try {
      await finalizeDesign();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

// tasks 命令组
const tasksCmd = program
  .command('tasks')
  .description('任务规划阶段命令');

tasksCmd
  .command('plan')
  .description('启动任务规划')
  .action(async () => {
    try {
      await planTasks();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

tasksCmd
  .command('finalize')
  .description('完成任务规划阶段')
  .action(async () => {
    try {
      await finalizeTasks();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

tasksCmd
  .command('list')
  .description('列出所有任务')
  .action(async () => {
    try {
      await listTasks();
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

tasksCmd
  .command('decompose <task-id> <reason>')
  .description('拆解任务')
  .action(async (taskId, reason) => {
    try {
      await decomposeTask(taskId, reason);
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

// task 命令组
const taskCmd = program
  .command('task')
  .description('任务执行命令');

taskCmd
  .command('start <task-id>')
  .description('开始执行任务')
  .action(async (taskId) => {
    try {
      await startTask(taskId);
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

taskCmd
  .command('submit <task-id>')
  .description('提交任务审查')
  .action(async (taskId) => {
    try {
      await submitTask(taskId);
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

taskCmd
  .command('complete <task-id>')
  .description('完成任务')
  .action(async (taskId) => {
    try {
      await completeTask(taskId);
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

taskCmd
  .command('rework <task-id>')
  .description('标记任务需要返工')
  .action(async (taskId) => {
    try {
      await reworkTask(taskId);
    } catch (error) {
      console.error(chalk.red('命令执行失败:'), error);
      process.exit(1);
    }
  });

// 解析命令
program.parse(process.argv);

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
