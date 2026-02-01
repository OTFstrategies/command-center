import type { Asset } from '../home/types';

export interface Skill extends Asset {
  files: string[];
  fileCount: number;
  dependencies?: string[];
  skillMdPreview?: string;
}

export interface SkillListItem {
  id: string;
  name: string;
  fileCount: number;
  project: string;
}
