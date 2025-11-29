import { useEffect, useMemo, useState } from 'react';
import { ChannelList } from './components/ChannelList';
import { RemindersBadge } from './components/RemindersBadge';
import { useChannelSelection } from './store/channelSelection';
import { Channel, Reminder } from './types';
import './styles/App.css';
import './index.css';

const initialChannels: Channel[] = [
  { id: 'ch-001', title: 'Общий канал', description: 'Все команды' },
  { id: 'ch-002', title: 'Маркетинг', description: 'Планы и анонсы' },
  { id: 'ch-003', title: 'Служба поддержки' },
];

const initialReminders: Reminder[] = [
  {
    id: 'rem-001',
    channelId: 'ch-001',
    title: 'Синк команды',
    scheduledFor: new Date().toISOString(),
  },
  {
    id: 'rem-002',
    channelId: 'ch-002',
    title: 'Публикация дайджеста',
    scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
];

function App() {
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [reminders] = useState<Reminder[]>(initialReminders);
  const { selectedChannelId, selectChannel } = useChannelSelection();

  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      selectChannel(channels[0].id);
    }
  }, [channels, selectChannel, selectedChannelId]);

  const selectedChannel = channels.find((channel) => channel.id === selectedChannelId);

  const remindersForChannel = useMemo(
    () => reminders.filter((reminder) => reminder.channelId === selectedChannelId),
    [reminders, selectedChannelId],
  );

  const handleAddChannel = () => {
    const nextIndex = channels.length + 1;
    const newChannel: Channel = {
      id: `ch-${nextIndex.toString().padStart(3, '0')}`,
      title: `Новый канал ${nextIndex}`,
    };
    setChannels((prev) => [...prev, newChannel]);
    selectChannel(newChannel.id);
  };

  return (
    <div className="app">
      <ChannelList channels={channels} onAddChannel={handleAddChannel} />

      <section className="app__content">
        <header className="app__content-header">
          <div>
            <p className="app__content-label">Выбранный канал</p>
            <h3 className="app__content-title">{selectedChannel?.title ?? 'Не выбран'}</h3>
          </div>
          <RemindersBadge reminders={remindersForChannel} />
        </header>

        <ul className="app__reminders">
          {remindersForChannel.map((reminder) => (
            <li key={reminder.id} className="app__reminder-card">
              <h4>{reminder.title}</h4>
              <p className="app__reminder-date">
                {new Date(reminder.scheduledFor).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </li>
          ))}

          {remindersForChannel.length === 0 && <p className="app__empty">Нет напоминаний для этого канала</p>}
        </ul>
      </section>
    </div>
  );
}

export default App;
