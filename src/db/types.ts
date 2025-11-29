export interface Channel {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Block {
  id: string;
  type: string;
  content: unknown;
}

export interface Metric {
  key: string;
  value: number;
  unit?: string;
  recordedAt?: number;
}

export interface Entry {
  id: string;
  channelId: string;
  title: string;
  summary?: string;
  blocks: Block[];
  metrics: Metric[];
  occurredAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface Asset {
  id: string;
  entryId: string;
  fileName: string;
  mimeType: string;
  size: number;
  data: Blob;
  createdAt: number;
  updatedAt: number;
}

export interface EncodedAsset extends Omit<Asset, 'data'> {
  data: string;
}

export interface ExportBundle {
  exportedAt: number;
  channels: Channel[];
  entries: Entry[];
  assets: EncodedAsset[];
}

export interface ImportOptions {
  wipeExisting?: boolean;
}
