export type Channel = 'general' | 'engineering' | 'marketing' | 'support';

export type BlockType =
  | 'text'
  | 'checklist'
  | 'metrics'
  | 'photo'
  | 'file';

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface ChecklistBlock extends BaseBlock {
  type: 'checklist';
  items: ChecklistItem[];
}

export interface MetricEntry {
  id: string;
  label: string;
  value: string;
}

export interface MetricsBlock extends BaseBlock {
  type: 'metrics';
  metrics: MetricEntry[];
}

export interface PhotoBlock extends BaseBlock {
  type: 'photo';
  url: string;
  caption?: string;
}

export interface FileBlock extends BaseBlock {
  type: 'file';
  filename: string;
  description?: string;
}

export type DayBlock =
  | TextBlock
  | ChecklistBlock
  | MetricsBlock
  | PhotoBlock
  | FileBlock;

export interface DayEntry {
  date: string;
  channel: Channel;
  blocks: DayBlock[];
}
