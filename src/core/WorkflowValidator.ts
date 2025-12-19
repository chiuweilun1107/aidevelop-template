import fs from 'fs-extra';
import path from 'path';
import { StateManager } from './StateManager.js';
import { PhaseConfig } from './types.js';

export class WorkflowValidator {
  private stateManager: StateManager;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.stateManager = new StateManager(projectRoot);
  }

  /**
   * 检查是否可以进入指定阶段
   */
  async canProceedToPhase(targetPhase: string): Promise<{ canProceed: boolean; reason?: string }> {
    const state = await this.stateManager.load();
    const phase = state.phases[targetPhase];

    if (!phase) {
      return {
        canProceed: false,
        reason: `未知的阶段: ${targetPhase}`
      };
    }

    // 检查依赖的阶段是否完成
    for (const dep of phase.dependencies) {
      const depPhase = state.phases[dep];
      if (!depPhase || depPhase.status !== 'completed') {
        return {
          canProceed: false,
          reason: `无法进入 ${targetPhase}：依赖的 ${dep} 阶段尚未完成（当前状态: ${depPhase?.status || 'unknown'}）`
        };
      }
    }

    return { canProceed: true };
  }

  /**
   * 验证需求文档结构
   */
  async validateRequirementsDoc(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const fullPath = path.join(this.projectRoot, filePath);
    const errors: string[] = [];

    if (!await fs.pathExists(fullPath)) {
      errors.push(`文件不存在: ${filePath}`);
      return { valid: false, errors };
    }

    const content = await fs.readFile(fullPath, 'utf-8');

    // 检查必需的章节
    const requiredSections = [
      '專案總覽',
      '使用者角色',
      '資訊架構與頁面規劃',
      '功能史詩與使用者故事',
      '非功能性需求',
      '資料模型',
      'API 規格'
    ];

    for (const section of requiredSections) {
      if (!content.includes(section)) {
        errors.push(`缺少必需的章节: ${section}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证蓝图文档结构
   */
  async validateBlueprintDoc(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const fullPath = path.join(this.projectRoot, filePath);
    const errors: string[] = [];

    if (!await fs.pathExists(fullPath)) {
      errors.push(`文件不存在: ${filePath}`);
      return { valid: false, errors };
    }

    const content = await fs.readFile(fullPath, 'utf-8');

    // 检查必需的章节
    const requiredSections = [
      '技術選型',
      '架構設計',
      '開發規範',
      '部署策略',
      '任務執行階段準則'
    ];

    for (const section of requiredSections) {
      if (!content.includes(section)) {
        errors.push(`缺少必需的章节: ${section}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证阶段的所有产出物
   */
  async validatePhaseArtifacts(phase: string): Promise<{ valid: boolean; errors: string[] }> {
    const state = await this.stateManager.load();
    const phaseConfig = state.phases[phase];

    if (!phaseConfig) {
      return {
        valid: false,
        errors: [`未知的阶段: ${phase}`]
      };
    }

    const errors: string[] = [];

    // 检查所有产出物是否存在
    for (const [name, artifactPath] of Object.entries(phaseConfig.artifacts)) {
      const fullPath = path.join(this.projectRoot, artifactPath);
      const exists = await fs.pathExists(fullPath);

      if (!exists) {
        errors.push(`缺少产出物: ${name} (${artifactPath})`);
      }
    }

    // 针对特定阶段进行结构验证
    if (errors.length === 0) {
      switch (phase) {
        case 'requirements':
          const reqDoc = phaseConfig.artifacts.requirements_doc;
          if (reqDoc) {
            const reqValidation = await this.validateRequirementsDoc(reqDoc);
            errors.push(...reqValidation.errors);
          }
          break;
        case 'blueprint':
          const blueprintDoc = phaseConfig.artifacts.blueprint_doc;
          if (blueprintDoc) {
            const blueprintValidation = await this.validateBlueprintDoc(blueprintDoc);
            errors.push(...blueprintValidation.errors);
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 获取下一个推荐阶段
   */
  async getNextPhase(): Promise<string | null | undefined> {
    const state = await this.stateManager.load();
    const currentPhase = state.currentPhase;
    const currentPhaseConfig = state.phases[currentPhase];

    // 如果当前阶段未完成，返回 null
    if (!currentPhaseConfig || currentPhaseConfig.status !== 'completed') {
      return null;
    }

    // 按顺序查找下一个未完成的阶段
    const phaseOrder = ['requirements', 'blueprint', 'design', 'tasks', 'development'];
    const currentIndex = phaseOrder.indexOf(currentPhase);

    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
      return null;
    }

    return phaseOrder[currentIndex + 1];
  }
}
