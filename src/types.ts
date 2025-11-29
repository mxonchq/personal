export interface Channel {
  id: string;
  title: string;
  description?: string;
}

export interface Reminder {
  id: string;
  channelId: string;
  title: string;
  scheduledFor: string; // ISO string for date
}
