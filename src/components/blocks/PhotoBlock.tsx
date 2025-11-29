import { PhotoBlock as PhotoBlockType } from '../../types';
import { BlockCard } from './BlockCard';
import './PhotoBlock.css';

interface Props {
  block: PhotoBlockType;
  onChange: (block: PhotoBlockType) => void;
}

export function PhotoBlock({ block, onChange }: Props) {
  return (
    <BlockCard title="Фото">
      <div className="photo-block">
        <div className="photo-block__preview" style={{ backgroundImage: `url(${block.url})` }} />
        <input
          className="photo-block__input"
          value={block.url}
          onChange={(event) => onChange({ ...block, url: event.target.value })}
          placeholder="Ссылка на изображение"
        />
        <input
          className="photo-block__input"
          value={block.caption ?? ''}
          onChange={(event) => onChange({ ...block, caption: event.target.value })}
          placeholder="Подпись"
        />
      </div>
    </BlockCard>
  );
}
