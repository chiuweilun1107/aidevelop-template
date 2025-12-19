import fs from 'fs-extra';
import path from 'path';
import matter from 'gray-matter';
import { AgentPrompt, AgentMetadata } from './types.js';
import { StateManager } from './StateManager.js';

export class AgentLoader {
  private agentsPath: string;
  private stateManager: StateManager;

  constructor(projectRoot: string = process.cwd()) {
    this.agentsPath = path.join(projectRoot, '.specflow', 'agents');
    this.stateManager = new StateManager(projectRoot);
  }

  /**
   * 将角色名转换为文件名
   */
  private roleToFileName(role: string): string {
    const roleMap: Record<string, string> = {
      'PM-Adam': 'project_manager',
      'Project Manager': 'project_manager',
      'SA-Leo': 'system_architect',
      'System Architect': 'system_architect',
      'UI-Mia': 'ui_ux_designer',
      'UI/UX Designer': 'ui_ux_designer',
      'FE-Ava': 'frontend_engineer',
      'Frontend Engineer': 'frontend_engineer',
      'BE-Rex': 'backend_engineer',
      'Backend Engineer': 'backend_engineer',
      'DevOps': 'devops_engineer',
      'QA-Sam': 'qa_reviewer',
      'QA Reviewer': 'qa_reviewer'
    };

    return roleMap[role] || role.toLowerCase().replace(/\s+/g, '_');
  }

  /**
   * 加载指定角色的代理
   */
  async loadAgent(role: string): Promise<AgentPrompt> {
    const fileName = this.roleToFileName(role);
    const agentFile = path.join(this.agentsPath, `${fileName}.md`);

    if (!await fs.pathExists(agentFile)) {
      throw new Error(`找不到代理文件: ${agentFile}`);
    }

    const content = await fs.readFile(agentFile, 'utf-8');
    const parsed = matter(content);

    const metadata: AgentMetadata = {
      name: parsed.data.name || role,
      role: parsed.data.role || role,
      description: parsed.data.description || '',
      tools: parsed.data.tools || []
    };

    return {
      metadata,
      systemPrompt: parsed.content.trim()
    };
  }

  /**
   * 生成给 AI 的完整提示词
   */
  async generatePrompt(phase: string, additionalContext?: string): Promise<string> {
    const state = await this.stateManager.load();
    const phaseConfig = state.phases[phase];

    if (!phaseConfig) {
      throw new Error(`未知的阶段: ${phase}`);
    }

    const agent = await this.loadAgent(phaseConfig.agent);
    const completedPhases = this.stateManager.getCompletedPhases();

    let prompt = `${agent.systemPrompt}

# 当前项目上下文
项目名称: ${state.projectName}
当前阶段: ${phase}
已完成阶段: ${completedPhases.join(', ') || '无'}
活跃代理: ${agent.metadata.name} (${agent.metadata.role})

`;

    // 添加阶段特定的指令
    prompt += this.getPhaseInstructions(phase);

    if (additionalContext) {
      prompt += `\n# 额外上下文\n${additionalContext}\n`;
    }

    return prompt;
  }

  /**
   * 获取阶段特定的指令
   */
  private getPhaseInstructions(phase: string): string {
    const instructions: Record<string, string> = {
      requirements: `
# 你的任务
1. 分析用户提供的需求文件
2. 主动识别需求中的 URL 并进行探索
3. 向用户提出澄清问题
4. 生成符合 02_RequirementsSpec_Template.md 结构的 PROJECT_REQUIREMENTS.md
5. 与用户迭代修改，直到需求确认

完成后，提示用户运行: specflow blueprint plan
`,
      blueprint: `
# 你的任务
1. 基于 PROJECT_REQUIREMENTS.md 进行技术选型
2. 与用户确认架构、技术栈、开发规范
3. 生成 PROJECT_BLUEPRINT.md 和相关规范文档
4. 确保所有技术决策有据可依

完成后，提示用户运行: specflow design start
`,
      design: `
# 你的任务
1. 基于需求和蓝图创建设计系统
2. 生成 design_system.md
3. 创建核心页面的线框图文件
4. 确保设计与品牌和技术选型一致

完成后，提示用户运行: specflow tasks plan
`,
      tasks: `
# 你的任务
1. 将需求分解为可执行的技术任务
2. 分析任务依赖关系
3. 与用户确认 MVP 范围
4. 生成 TODO.md 和 docs/tasks/ 下的所有任务文件

完成后，提示用户可以开始开发: specflow task start <Task-ID>
`,
      development: `
# 你的任务
根据任务文件 (docs/tasks/<Task-ID>.md) 进行开发：
1. 严格遵循 PROJECT_BLUEPRINT.md 的规范
2. 完成开发待办清单中的所有项目
3. 确保通过验收标准
4. 提交代码供审查

完成后，运行: specflow task submit <Task-ID>
`
    };

    return instructions[phase] || '';
  }

  /**
   * 获取所有可用的代理
   */
  async listAgents(): Promise<AgentMetadata[]> {
    const agentFiles = await fs.readdir(this.agentsPath);
    const agents: AgentMetadata[] = [];

    for (const file of agentFiles) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(
          path.join(this.agentsPath, file),
          'utf-8'
        );
        const parsed = matter(content);

        agents.push({
          name: parsed.data.name || file.replace('.md', ''),
          role: parsed.data.role || '',
          description: parsed.data.description || '',
          tools: parsed.data.tools || []
        });
      }
    }

    return agents;
  }
}
