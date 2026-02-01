import type { Asset } from '../home/types';

export interface Api extends Asset {
  service: string;
  authType: 'api_key' | 'oauth' | 'basic' | 'bearer';
  endpoints?: string[];
  baseUrl?: string;
}

export interface ApiListItem {
  id: string;
  name: string;
  service: string;
  authType: string;
  project: string;
}

export interface ApiDetail extends Api {
  credentials: {
    key: string; // Always masked: "sk-...xxxx"
  };
}
