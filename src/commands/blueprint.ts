import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { StateManager } from '../core/StateManager.js';
import { WorkflowValidator } from '../core/WorkflowValidator.js';
import { AgentLoader } from '../core/AgentLoader.js';

export async function planBlueprint(): Promise<void> {
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

    // 检查是否可以进入蓝图阶段
    const canProceed = await validator.canProceedToPhase('blueprint');
    if (!canProceed.canProceed) {
      console.error(chalk.red('❌ ') + canProceed.reason);
      process.exit(1);
    }

    console.log(chalk.blue('🏗️  启动技术蓝图规划阶段'));
    console.log(chalk.gray('   代理: SA-Leo'));
    console.log();

    // 更新阶段状态
    await stateManager.updatePhaseStatus('blueprint', 'in_progress');

    // 生成 AI 提示词
    const prompt = await agentLoader.generatePrompt('blueprint');

    // 保存提示词到文件
    const promptPath = path.join(projectRoot, '.specflow', 'current_prompt.md');
    await fs.writeFile(promptPath, prompt, 'utf-8');

    console.log(chalk.yellow('📝 SA-Leo 代理已准备就绪'));
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
    console.log(chalk.gray('  2. 与 AI 协作完成技术蓝图'));
    console.log(chalk.gray('  3. 确保生成 specs/PROJECT_BLUEPRINT.md'));
    console.log(chalk.gray('  4. 完成后运行: ') + chalk.cyan('specflow blueprint finalize'));
  } catch (error) {
    console.error(chalk.red('❌ 启动失败:'), error);
    throw error;
  }
}

export async function finalizeBlueprint(): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);
  const validator = new WorkflowValidator(projectRoot);

  try {
    await stateManager.load();
    const state = stateManager.getState();
    const blueprintPhase = state.phases.blueprint;

    if (!blueprintPhase || blueprintPhase.status !== 'in_progress') {
      console.error(chalk.red('❌ 蓝图阶段未在进行中'));
      console.log(chalk.gray('   当前状态: ') + (blueprintPhase?.status || 'unknown'));
      process.exit(1);
    }

    console.log(chalk.blue('🔍 验证蓝图文档...'));

    // 验证产出物
    const validation = await validator.validatePhaseArtifacts('blueprint');

    if (!validation.valid) {
      console.error(chalk.red('❌ 验证失败：'));
      for (const error of validation.errors) {
        console.error(chalk.red(`   • ${error}`));
      }
      console.log();
      console.log(chalk.yellow('💡 提示：'));
      console.log(chalk.gray('   确保已生成 specs/PROJECT_BLUEPRINT.md'));
      console.log(chalk.gray('   并且包含所有必需的章节'));
      process.exit(1);
    }

    // 标记阶段完成
    await stateManager.updatePhaseStatus('blueprint', 'completed');

    console.log(chalk.green('✅ 技术蓝图规划阶段已完成！'));
    console.log();
    console.log(chalk.bold('产出物：'));
    const blueprintArtifact = state.phases.blueprint?.artifacts.blueprint_doc;
    if (blueprintArtifact) {
      console.log(chalk.gray(`   ✓ ${blueprintArtifact}`));
    }
    console.log();

    // 获取下一阶段
    const nextPhase = await validator.getNextPhase();
    if (nextPhase) {
      console.log(chalk.bold('下一步：'));
      console.log(chalk.gray('   运行: ') + chalk.cyan(`specflow ${nextPhase} start`));
    }
  } catch (error) {
    console.error(chalk.red('❌ 完成失败:'), error);
    throw error;
  }
}

export async function reviewBlueprint(): Promise<void> {
  const projectRoot = process.cwd();
  const validator = new WorkflowValidator(projectRoot);

  try {
    console.log(chalk.blue('🔍 检查蓝图文档...'));

    const blueprintPath = 'specs/PROJECT_BLUEPRINT.md';
    const validation = await validator.validateBlueprintDoc(blueprintPath);

    if (validation.valid) {
      console.log(chalk.green('✅ 蓝图文档结构正确'));
      console.log();
      console.log(chalk.gray('如果内容已确认，请运行: ') + chalk.cyan('specflow blueprint finalize'));
    } else {
      console.log(chalk.yellow('⚠️  发现以下问题：'));
      for (const error of validation.errors) {
        console.log(chalk.yellow(`   • ${error}`));
      }
    }
  } catch (error) {
    console.error(chalk.red('❌ 检查失败:'), error);
    throw error;
  }
}
