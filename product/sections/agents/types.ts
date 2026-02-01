import type { Asset } from '../home/types';

export interface Agent extends Asset {
  tools: string[];
  toolCount: number;
  parent?: string;
  config?: Record<string, unknown>;
}

export interface AgentListItem {
  id: string;
  name: string;
  toolCount: number;
  parent?: string;
  project: string;
}
