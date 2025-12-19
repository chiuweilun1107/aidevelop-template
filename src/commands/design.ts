import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { StateManager } from '../core/StateManager.js';
import { WorkflowValidator } from '../core/WorkflowValidator.js';
import { AgentLoader } from '../core/AgentLoader.js';

export async function startDesign(): Promise<void> {
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

    // 检查是否可以进入设计阶段
    const canProceed = await validator.canProceedToPhase('design');
    if (!canProceed.canProceed) {
      console.error(chalk.red('❌ ') + canProceed.reason);
      process.exit(1);
    }

    console.log(chalk.blue('🎨 启动 UI/UX 设计阶段'));
    console.log(chalk.gray('   代理: UI-Mia'));
    console.log();

    // 更新阶段状态
    await stateManager.updatePhaseStatus('design', 'in_progress');

    // 生成 AI 提示词
    const prompt = await agentLoader.generatePrompt('design');

    // 保存提示词到文件
    const promptPath = path.join(projectRoot, '.specflow', 'current_prompt.md');
    await fs.writeFile(promptPath, prompt, 'utf-8');

    console.log(chalk.yellow('📝 UI-Mia 代理已准备就绪'));
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
    console.log(chalk.gray('  2. 与 AI 协作完成设计系统和线框图'));
    console.log(chalk.gray('  3. 确保生成 docs/design_system.md 和 docs/wireframes/'));
    console.log(chalk.gray('  4. 完成后运行: ') + chalk.cyan('specflow design finalize'));
  } catch (error) {
    console.error(chalk.red('❌ 启动失败:'), error);
    throw error;
  }
}

export async function finalizeDesign(): Promise<void> {
  const projectRoot = process.cwd();
  const stateManager = new StateManager(projectRoot);
  const validator = new WorkflowValidator(projectRoot);

  try {
    await stateManager.load();
    const state = stateManager.getState();
    const designPhase = state.phases.design;

    if (!designPhase || designPhase.status !== 'in_progress') {
      console.error(chalk.red('❌ 设计阶段未在进行中'));
      console.log(chalk.gray('   当前状态: ') + (designPhase?.status || 'unknown'));
      process.exit(1);
    }

    console.log(chalk.blue('🔍 验证设计文档...'));

    // 验证产出物
    const validation = await validator.validatePhaseArtifacts('design');

    if (!validation.valid) {
      console.error(chalk.red('❌ 验证失败：'));
      for (const error of validation.errors) {
        console.error(chalk.red(`   • ${error}`));
      }
      console.log();
      console.log(chalk.yellow('💡 提示：'));
      console.log(chalk.gray('   确保已生成 docs/design_system.md'));
      console.log(chalk.gray('   以及 docs/wireframes/ 下的线框图文件'));
      process.exit(1);
    }

    // 标记阶段完成
    await stateManager.updatePhaseStatus('design', 'completed');

    console.log(chalk.green('✅ UI/UX 设计阶段已完成！'));
    console.log();
    console.log(chalk.bold('产出物：'));
    const designSystem = state.phases.design?.artifacts.design_system;
    const wireframes = state.phases.design?.artifacts.wireframes;
    if (designSystem) {
      console.log(chalk.gray(`   ✓ ${designSystem}`));
    }
    if (wireframes) {
      console.log(chalk.gray(`   ✓ ${wireframes}`));
    }
    console.log();

    // 获取下一阶段
    const nextPhase = await validator.getNextPhase();
    if (nextPhase) {
      console.log(chalk.bold('下一步：'));
      console.log(chalk.gray('   运行: ') + chalk.cyan(`specflow ${nextPhase} plan`));
    }
  } catch (error) {
    console.error(chalk.red('❌ 完成失败:'), error);
    throw error;
  }
}

export async function reviewDesign(): Promise<void> {
  const projectRoot = process.cwd();

  try {
    console.log(chalk.blue('🔍 检查设计文档...'));

    const designSystemPath = path.join(projectRoot, 'docs', 'design_system.md');
    const wireframesPath = path.join(projectRoot, 'docs', 'wireframes');

    const designSystemExists = await fs.pathExists(designSystemPath);
    const wireframesExists = await fs.pathExists(wireframesPath);

    let allValid = true;

    if (!designSystemExists) {
      console.log(chalk.yellow('   ⚠️  缺少 docs/design_system.md'));
      allValid = false;
    } else {
      console.log(chalk.green('   ✓ docs/design_system.md'));
    }

    if (!wireframesExists) {
      console.log(chalk.yellow('   ⚠️  缺少 docs/wireframes/ 目录'));
      allValid = false;
    } else {
      const wireframeFiles = await fs.readdir(wireframesPath);
      if (wireframeFiles.length === 0) {
        console.log(chalk.yellow('   ⚠️  docs/wireframes/ 目录为空'));
        allValid = false;
      } else {
        console.log(chalk.green(`   ✓ docs/wireframes/ (${wireframeFiles.length} 个文件)`));
      }
    }

    console.log();
    if (allValid) {
      console.log(chalk.green('✅ 设计文档结构正确'));
      console.log();
      console.log(chalk.gray('如果内容已确认，请运行: ') + chalk.cyan('specflow design finalize'));
    } else {
      console.log(chalk.yellow('⚠️  请补充缺失的设计文档'));
    }
  } catch (error) {
    console.error(chalk.red('❌ 检查失败:'), error);
    throw error;
  }
}
