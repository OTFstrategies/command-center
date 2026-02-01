import type { Asset } from '../home/types';

export type InstructionScope = 'workflow' | 'project';

export interface Instruction extends Asset {
  scope: InstructionScope;
  content: string;
}

export interface InstructionListItem {
  id: string;
  name: string;
  scope: InstructionScope;
  project: string;
}
