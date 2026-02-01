export type AssetType = 'api' | 'prompt' | 'skill' | 'agent' | 'command' | 'instruction';
export type EventType = 'created' | 'used';
export type PeriodFilter = 'today' | 'week' | 'month' | 'all';

export interface ActivityEntry {
  id: string;
  type: AssetType;
  assetId: string;
  assetName: string;
  event: EventType;
  timestamp: string;
  relativeTime: string;
  project: string;
}

export interface ActivityFilters {
  type: AssetType | 'all';
  period: PeriodFilter;
  project: string | 'all';
}

export interface ActivityData {
  entries: ActivityEntry[];
  hasMore: boolean;
  filters: ActivityFilters;
}
