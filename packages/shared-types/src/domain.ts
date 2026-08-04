import { SessionStatus, PromptDifficulty } from './enums';
import { DiagramData } from './interfaces';

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export interface ReferenceEdge {
  from: string;
  to: string;
  required: boolean;
}

export interface IllegalEdge {
  from: string;
  to: string;
  reason: string;
}

export interface EvaluationTemplate {
  referenceEdges: ReferenceEdge[];
  illegalEdges: IllegalEdge[];
  availableNodeTypes: string[];
  distractorNodeTypes: string[];
  componentRoles: Record<string, string>;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  difficulty: PromptDifficulty;
  expectedPatterns: string[];
  evaluationTemplate: EvaluationTemplate;
}

export interface InterviewSession {
  id: string;
  userId: string;
  promptId: string;
  currentStage: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Diagram {
  id: string;
  sessionId: string;
  data: DiagramData;
  version: number;
  updatedAt: Date;
}

export interface EvaluationResult {
  id: string;
  sessionId: string;
  warnings: EvaluationWarning[];
  strengths: EvaluationStrength[];
  score: number;
  generatedAt: Date;
}

export interface EvaluationWarning {
  code: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface EvaluationStrength {
  code: string;
  message: string;
}
