import type { Asset } from '../home/types';

export type PromptType = 'system' | 'project' | 'template';

export interface Prompt extends Asset {
  type: PromptType;
  content: string;
  variables?: string[];
  preview: string; // First 2 lines
}

export interface PromptListItem {
  id: string;
  name: string;
  type: PromptType;
  preview: string;
  project: string;
}
