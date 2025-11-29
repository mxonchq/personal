import Dexie, { Table } from 'dexie';
import { Asset, Channel, Entry } from './types';

export class JournalDB extends Dexie {
  channels!: Table<Channel, string>;
  entries!: Table<Entry, string>;
  assets!: Table<Asset, string>;

  constructor(name = 'journal-db') {
    super(name);

    this.version(1).stores({
      channels: '&id, createdAt, updatedAt',
      entries: '&id, channelId, occurredAt, createdAt, updatedAt',
      assets: '&id, entryId, createdAt, updatedAt'
    });

    this.version(2)
      .stores({
        channels: '&id, name, createdAt, updatedAt',
        entries: '&id, channelId, occurredAt, createdAt, updatedAt, [channelId+occurredAt]',
        assets: '&id, entryId, createdAt, updatedAt, [entryId+createdAt]'
      })
      .upgrade(async (tx) => {
        await tx.table('entries').toCollection().modify((entry: Entry) => {
          entry.blocks = entry.blocks ?? [];
          entry.metrics = entry.metrics ?? [];
        });

        await tx.table('assets').toCollection().modify((asset: Asset) => {
          asset.size = asset.size ?? 0;
        });
      });

    this.version(3)
      .stores({
        channels: '&id, name, createdAt, updatedAt',
        entries: '&id, channelId, occurredAt, createdAt, updatedAt, [channelId+occurredAt], title',
        assets: '&id, entryId, createdAt, updatedAt, [entryId+createdAt], fileName'
      })
      .upgrade(async (tx) => {
        await tx.table('channels').toCollection().modify((channel: Channel) => {
          channel.description = channel.description ?? '';
        });
      });
  }
}

export const db = new JournalDB();
