import { FileBlock as FileBlockType } from '../../types';
import { BlockCard } from './BlockCard';
import './FileBlock.css';

interface Props {
  block: FileBlockType;
  onChange: (block: FileBlockType) => void;
}

export function FileBlock({ block, onChange }: Props) {
  return (
    <BlockCard title="Файл">
      <div className="file-block">
        <input
          className="file-block__input"
          value={block.filename}
          onChange={(event) => onChange({ ...block, filename: event.target.value })}
          placeholder="Имя файла"
        />
        <textarea
          className="file-block__textarea"
          value={block.description ?? ''}
          onChange={(event) => onChange({ ...block, description: event.target.value })}
          placeholder="Описание или ссылка"
          rows={2}
        />
      </div>
    </BlockCard>
  );
}
