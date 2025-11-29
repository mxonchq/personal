import { useMemo } from 'react';
import { Channel } from '../types';
import { useChannelSelection } from '../store/channelSelection';
import './ChannelList.css';

interface ChannelListProps {
  channels: Channel[];
  onAddChannel: () => void;
}

export function ChannelList({ channels, onAddChannel }: ChannelListProps) {
  const { selectedChannelId, selectChannel } = useChannelSelection();

  const sortedChannels = useMemo(
    () => [...channels].sort((a, b) => a.title.localeCompare(b.title)),
    [channels],
  );

  return (
    <section className="channel-list">
      <header className="channel-list__header">
        <h2>Каналы</h2>
        <button type="button" className="channel-list__add" aria-label="Добавить канал" onClick={onAddChannel}>
          +
        </button>
      </header>

      <ul className="channel-list__items">
        {sortedChannels.map((channel) => {
          const isSelected = channel.id === selectedChannelId;

          return (
            <li key={channel.id}>
              <button
                type="button"
                className={`channel-list__item${isSelected ? ' channel-list__item--active' : ''}`}
                onClick={() => selectChannel(channel.id)}
              >
                <div className="channel-list__title">{channel.title}</div>
                {channel.description && <p className="channel-list__description">{channel.description}</p>}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
