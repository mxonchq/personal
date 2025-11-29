import { TextBlock as TextBlockType } from '../../types';
import { BlockCard } from './BlockCard';

interface Props {
  block: TextBlockType;
  onChange: (block: TextBlockType) => void;
}

export function TextBlock({ block, onChange }: Props) {
  return (
    <BlockCard title="Текст">
      <textarea
        value={block.content}
        onChange={(event) => onChange({ ...block, content: event.target.value })}
        rows={4}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          resize: 'vertical',
          font: 'inherit',
          color: '#0f172a',
          background: '#f8fafc',
        }}
        placeholder="Добавьте заметки..."
      />
    </BlockCard>
  );
}
