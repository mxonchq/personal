import { ChecklistBlock as ChecklistBlockType, ChecklistItem } from '../../types';
import { BlockCard } from './BlockCard';
import './ChecklistBlock.css';

interface Props {
  block: ChecklistBlockType;
  onChange: (block: ChecklistBlockType) => void;
}

export function ChecklistBlock({ block, onChange }: Props) {
  const updateItem = (item: ChecklistItem) => {
    const items = block.items.map((entry) => (entry.id === item.id ? item : entry));
    onChange({ ...block, items });
  };

  return (
    <BlockCard title="Чеклист">
      <div className="checklist">
        {block.items.map((item) => (
          <label key={item.id} className="checklist__item">
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(event) => updateItem({ ...item, checked: event.target.checked })}
            />
            <input
              className="checklist__label"
              value={item.label}
              onChange={(event) => updateItem({ ...item, label: event.target.value })}
            />
          </label>
        ))}
      </div>
    </BlockCard>
  );
}
