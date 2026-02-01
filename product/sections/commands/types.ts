import type { Asset } from '../home/types';

export interface Command extends Asset {
  category: string;
  subcommands?: string[];
  hasSubcommands: boolean;
}

export interface CommandCategory {
  name: string;
  commands: CommandListItem[];
  isExpanded: boolean;
}

export interface CommandListItem {
  id: string;
  name: string;
  description: string;
  hasSubcommands: boolean;
  subcommandCount?: number;
}
