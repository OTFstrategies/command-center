// Base Asset type
export interface Asset {
  id: string;
  name: string;
  path: string;
  description: string;
  created: string;
  project: string;
  tags: string[];
}

// Statistics for dashboard
export interface AssetStats {
  apis: number;
  prompts: number;
  skills: number;
  agents: number;
  commands: number;
  instructions: number;
}

// Activity item for recent feed
export interface ActivityItem {
  id: string;
  type: 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction';
  assetId: string;
  assetName: string;
  event: 'created' | 'used';
  timestamp: string;
  relativeTime: string;
  project: string;
}

// Home dashboard data
export interface HomeData {
  stats: AssetStats;
  recentActivity: ActivityItem[];
}
