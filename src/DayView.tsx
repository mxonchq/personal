import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { DayBlock, DayEntry, Channel } from './types';
import { fetchEntry, saveEntry } from './dao/entriesDao';
import { useDebouncedEffect } from './hooks/useDebouncedEffect';
import { SortableBlock } from './components/blocks/SortableBlock';
import { TextBlock } from './components/blocks/TextBlock';
import { ChecklistBlock } from './components/blocks/ChecklistBlock';
import { MetricsBlock } from './components/blocks/MetricsBlock';
import { PhotoBlock } from './components/blocks/PhotoBlock';
import { FileBlock } from './components/blocks/FileBlock';
import './styles/day-view.css';

const channels: { value: Channel; label: string }[] = [
  { value: 'general', label: 'Общий' },
  { value: 'engineering', label: 'Инженеры' },
  { value: 'marketing', label: 'Маркетинг' },
  { value: 'support', label: 'Поддержка' },
];

export function DayView() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [channel, setChannel] = useState<Channel>('general');
  const [entry, setEntry] = useState<DayEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchEntry(selectedDate, channel)
      .then((data) => {
        if (active) {
          setEntry(data);
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [selectedDate, channel]);

  useDebouncedEffect(
    () => {
      if (!entry || loading) return;
      setSaving(true);
      saveEntry(entry)
        .then(() => setLastSavedAt(new Date()))
        .finally(() => setSaving(false));
    },
    [entry, loading],
    800
  );

  const handleBlockChange = (updated: DayBlock) => {
    setEntry((current) =>
      current
        ? { ...current, blocks: current.blocks.map((block) => (block.id === updated.id ? updated : block)) }
        : current
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    setEntry((current) => {
      if (!current) return current;
      const oldIndex = current.blocks.findIndex((block) => block.id === active.id);
      const newIndex = current.blocks.findIndex((block) => block.id === over.id);
      const blocks = arrayMove(current.blocks, oldIndex, newIndex);
      return { ...current, blocks };
    });
  };

  const renderBlock = (block: DayBlock) => {
    switch (block.type) {
      case 'text':
        return <TextBlock block={block} onChange={handleBlockChange} />;
      case 'checklist':
        return <ChecklistBlock block={block} onChange={handleBlockChange} />;
      case 'metrics':
        return <MetricsBlock block={block} onChange={handleBlockChange} />;
      case 'photo':
        return <PhotoBlock block={block} onChange={handleBlockChange} />;
      case 'file':
        return <FileBlock block={block} onChange={handleBlockChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="day-view">
      <header className="day-view__header">
        <div>
          <p className="day-view__eyebrow">Дневной обзор</p>
          <h1 className="day-view__title">Каналы и блоки</h1>
          <p className="day-view__subtitle">Выберите дату и канал, чтобы увидеть записи.</p>
        </div>
        <div className="day-view__controls">
          <label className="control">
            <span>Дата</span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </label>
          <label className="control">
            <span>Канал</span>
            <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)}>
              {channels.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <section className="day-view__content">
        <div className="day-view__status">
          {loading ? 'Загрузка из DAO...' : 'Записи загружены'}
          {saving && !loading ? ' · автосохранение...' : ''}
          {lastSavedAt && !saving ? ` · сохранено ${lastSavedAt.toLocaleTimeString()}` : ''}
        </div>

        {entry && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext items={entry.blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
              <div className="blocks-list">
                {entry.blocks.map((block) => (
                  <SortableBlock key={block.id} id={block.id} label={block.type}>
                    {renderBlock(block)}
                  </SortableBlock>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>
    </div>
  );
}
