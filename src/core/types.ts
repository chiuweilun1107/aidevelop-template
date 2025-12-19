// 核心类型定义
export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'needs_rework' | 'decomposed';

export interface PhaseConfig {
  status: PhaseStatus;
  agent: string;
  dependencies: string[];
  startedAt?: string;
  completedAt?: string;
  artifacts: Record<string, string>;
}

export interface TaskConfig {
  status: TaskStatus;
  assignee?: string;
  dependencies: string[];
  filePath?: string;
}

export interface ProjectState {
  version: string;
  projectName: string;
  currentPhase: string;
  phases: Record<string, PhaseConfig>;
  activeAgent?: string;
  tasks: Record<string, TaskConfig>;
  createdAt: string;
  updatedAt: string;
}

export interface AgentMetadata {
  name: string;
  role: string;
  description: string;
  tools?: string[];
}

export interface AgentPrompt {
  metadata: AgentMetadata;
  systemPrompt: string;
}

export interface SpecFlowConfig {
  projectName: string;
  standardsPackage: 'basic' | 'complete' | 'enterprise';
  sourceFrameworkPath?: string;
}
