import { Reminder } from '../types';
import './RemindersBadge.css';

interface RemindersBadgeProps {
  reminders: Reminder[];
}

function isToday(date: Date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

export function RemindersBadge({ reminders }: RemindersBadgeProps) {
  const hasTodayReminders = reminders.some((reminder) => isToday(new Date(reminder.scheduledFor)));

  if (hasTodayReminders) {
    return null;
  }

  return <span className="reminders-badge">Сегодня без записи</span>;
}
