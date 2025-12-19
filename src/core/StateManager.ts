import fs from 'fs-extra';
import path from 'path';
import { ProjectState, PhaseConfig, TaskConfig, PhaseStatus } from './types.js';

export class StateManager {
  private statePath: string;
  private state: ProjectState | null = null;

  constructor(projectRoot: string = process.cwd()) {
    this.statePath = path.join(projectRoot, '.specflow', 'state.json');
  }

  /**
   * 检查项目是否已初始化
   */
  isInitialized(): boolean {
    return fs.existsSync(this.statePath);
  }

  /**
   * 初始化项目状态
   */
  async initialize(projectName: string): Promise<void> {
    const initialState: ProjectState = {
      version: '1.0.0',
      projectName,
      currentPhase: 'requirements',
      phases: {
        requirements: {
          status: 'pending',
          agent: 'PM-Adam',
          dependencies: [],
          artifacts: {
            requirements_doc: 'specs/PROJECT_REQUIREMENTS.md'
          }
        },
        blueprint: {
          status: 'pending',
          agent: 'SA-Leo',
          dependencies: ['requirements'],
          artifacts: {
            blueprint_doc: 'specs/PROJECT_BLUEPRINT.md'
          }
        },
        design: {
          status: 'pending',
          agent: 'UI-Mia',
          dependencies: ['blueprint'],
          artifacts: {
            design_system: 'docs/design_system.md',
            wireframes: 'docs/wireframes/'
          }
        },
        tasks: {
          status: 'pending',
          agent: 'PM-Adam',
          dependencies: ['design'],
          artifacts: {
            todo: 'docs/TODO.md',
            tasks_dir: 'docs/tasks/'
          }
        },
        development: {
          status: 'pending',
          agent: 'Multiple',
          dependencies: ['tasks'],
          artifacts: {}
        }
      },
      tasks: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await fs.ensureDir(path.dirname(this.statePath));
    await fs.writeJson(this.statePath, initialState, { spaces: 2 });
    this.state = initialState;
  }

  /**
   * 加载当前状态
   */
  async load(): Promise<ProjectState> {
    if (!this.isInitialized()) {
      throw new Error('项目尚未初始化。请先运行 specflow init');
    }

    this.state = await fs.readJson(this.statePath);
    return this.state!;
  }

  /**
   * 保存状态
   */
  async save(): Promise<void> {
    if (!this.state) {
      throw new Error('没有可保存的状态');
    }

    this.state.updatedAt = new Date().toISOString();
    await fs.writeJson(this.statePath, this.state, { spaces: 2 });
  }

  /**
   * 获取当前阶段
   */
  getCurrentPhase(): string {
    if (!this.state) {
      throw new Error('状态未加载');
    }
    return this.state.currentPhase;
  }

  /**
   * 更新阶段状态
   */
  async updatePhaseStatus(phase: string, status: PhaseStatus): Promise<void> {
    if (!this.state) {
      await this.load();
    }

    if (!this.state!.phases[phase]) {
      throw new Error(`未知的阶段: ${phase}`);
    }

    this.state!.phases[phase].status = status;

    if (status === 'in_progress' && !this.state!.phases[phase].startedAt) {
      this.state!.phases[phase].startedAt = new Date().toISOString();
      this.state!.currentPhase = phase;
      this.state!.activeAgent = this.state!.phases[phase].agent;
    }

    if (status === 'completed') {
      this.state!.phases[phase].completedAt = new Date().toISOString();
    }

    await this.save();
  }

  /**
   * 添加任务
   */
  async addTask(taskId: string, config: TaskConfig): Promise<void> {
    if (!this.state) {
      await this.load();
    }

    this.state!.tasks[taskId] = config;
    await this.save();
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId: string, status: import('./types').TaskStatus): Promise<void> {
    if (!this.state) {
      await this.load();
    }

    if (!this.state!.tasks[taskId]) {
      throw new Error(`未知的任务: ${taskId}`);
    }

    this.state!.tasks[taskId].status = status;
    await this.save();
  }

  /**
   * 获取所有已完成的阶段
   */
  getCompletedPhases(): string[] {
    if (!this.state) {
      throw new Error('状态未加载');
    }

    return Object.entries(this.state.phases)
      .filter(([_, config]) => config.status === 'completed')
      .map(([name]) => name);
  }

  /**
   * 获取当前状态的只读副本
   */
  getState(): Readonly<ProjectState> {
    if (!this.state) {
      throw new Error('状态未加载');
    }
    return { ...this.state };
  }
}
