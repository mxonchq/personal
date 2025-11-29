import { DayBlock, DayEntry, Channel } from '../types';

const storage = new Map<string, DayEntry>();

const defaultBlocks: DayBlock[] = [
  {
    id: 'text-1',
    type: 'text',
    content: 'Планы на день и заметки по задачам.',
  },
  {
    id: 'checklist-1',
    type: 'checklist',
    items: [
      { id: 'c1', label: 'Созвон с командой', checked: false },
      { id: 'c2', label: 'Подготовить отчёт', checked: true },
    ],
  },
  {
    id: 'metrics-1',
    type: 'metrics',
    metrics: [
      { id: 'm1', label: 'Новые лиды', value: '18' },
      { id: 'm2', label: 'Время отклика', value: '1.4ч' },
    ],
  },
  {
    id: 'photo-1',
    type: 'photo',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
    caption: 'Совместная работа над доской',
  },
  {
    id: 'file-1',
    type: 'file',
    filename: 'day-plan.pdf',
    description: 'Документ с детализацией задач.',
  },
];

function key(date: string, channel: Channel) {
  return `${date}__${channel}`;
}

export async function fetchEntry(date: string, channel: Channel): Promise<DayEntry> {
  const entryKey = key(date, channel);
  if (!storage.has(entryKey)) {
    storage.set(entryKey, {
      date,
      channel,
      blocks: defaultBlocks.map((block) => ({ ...block, id: `${block.id}-${date}` })),
    });
  }

  await delay(150);
  return structuredClone(storage.get(entryKey)!);
}

export async function saveEntry(entry: DayEntry): Promise<void> {
  storage.set(key(entry.date, entry.channel), structuredClone(entry));
  await delay(120);
}

function delay(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
