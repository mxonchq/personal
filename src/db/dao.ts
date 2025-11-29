import JSZip from 'jszip';
import { db } from './database';
import {
  Asset,
  Channel,
  EncodedAsset,
  Entry,
  ExportBundle,
  ImportOptions
} from './types';

const encodeBase64 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  if (typeof btoa === 'function') {
    return btoa(binary);
  }

  return Buffer.from(binary, 'binary').toString('base64');
};

const decodeBase64 = (data: string, mimeType: string): Blob => {
  if (typeof atob === 'function') {
    const binary = atob(data);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new Blob([bytes], { type: mimeType });
  }

  const buffer = Buffer.from(data, 'base64');
  return new Blob([buffer], { type: mimeType });
};

export class JournalDao {
  async createChannel(channel: Channel): Promise<string> {
    return db.channels.add(channel);
  }

  async getChannel(id: string): Promise<Channel | undefined> {
    return db.channels.get(id);
  }

  async listChannels(): Promise<Channel[]> {
    return db.channels.orderBy('createdAt').toArray();
  }

  async updateChannel(id: string, changes: Partial<Channel>): Promise<number> {
    return db.channels.update(id, { ...changes, updatedAt: Date.now() });
  }

  async deleteChannel(id: string): Promise<void> {
    await db.transaction('rw', db.entries, db.assets, db.channels, async () => {
      const entryIds = await db.entries.where({ channelId: id }).primaryKeys();
      await db.assets.where('entryId').anyOf(entryIds).delete();
      await db.entries.where({ channelId: id }).delete();
      await db.channels.delete(id);
    });
  }

  async createEntry(entry: Entry): Promise<string> {
    return db.entries.add(entry);
  }

  async getEntry(id: string): Promise<Entry | undefined> {
    return db.entries.get(id);
  }

  async listEntries(): Promise<Entry[]> {
    return db.entries.orderBy('occurredAt').reverse().toArray();
  }

  async getEntriesByChannel(channelId: string): Promise<Entry[]> {
    return db.entries.where({ channelId }).sortBy('occurredAt');
  }

  async getEntriesByDateRange(start: number, end: number): Promise<Entry[]> {
    return db.entries.where('occurredAt').between(start, end, true, true).toArray();
  }

  async getEntriesByChannelAndDate(
    channelId: string,
    start: number,
    end: number
  ): Promise<Entry[]> {
    return db.entries
      .where('[channelId+occurredAt]')
      .between([channelId, start], [channelId, end], true, true)
      .toArray();
  }

  async updateEntry(id: string, changes: Partial<Entry>): Promise<number> {
    return db.entries.update(id, { ...changes, updatedAt: Date.now() });
  }

  async deleteEntry(id: string): Promise<void> {
    await db.transaction('rw', db.entries, db.assets, async () => {
      await db.assets.where({ entryId: id }).delete();
      await db.entries.delete(id);
    });
  }

  async createAsset(asset: Asset): Promise<string> {
    return db.assets.add(asset);
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    return db.assets.get(id);
  }

  async listAssetsByEntry(entryId: string): Promise<Asset[]> {
    return db.assets.where({ entryId }).toArray();
  }

  async updateAsset(id: string, changes: Partial<Asset>): Promise<number> {
    return db.assets.update(id, { ...changes, updatedAt: Date.now() });
  }

  async deleteAsset(id: string): Promise<void> {
    await db.assets.delete(id);
  }

  async exportToJson(): Promise<ExportBundle> {
    const [channels, entries, assets] = await Promise.all([
      db.channels.toArray(),
      db.entries.toArray(),
      db.assets.toArray()
    ]);

    const encodedAssets: EncodedAsset[] = [];

    for (const asset of assets) {
      const encoded = await encodeBase64(asset.data);
      encodedAssets.push({ ...asset, data: encoded });
    }

    return {
      exportedAt: Date.now(),
      channels,
      entries,
      assets: encodedAssets
    };
  }

  async importFromJson(bundle: ExportBundle, options: ImportOptions = {}): Promise<void> {
    const { wipeExisting = false } = options;

    await db.transaction('rw', db.channels, db.entries, db.assets, async () => {
      if (wipeExisting) {
        await Promise.all([
          db.assets.clear(),
          db.entries.clear(),
          db.channels.clear()
        ]);
      }

      if (bundle.channels?.length) {
        await db.channels.bulkPut(bundle.channels);
      }

      if (bundle.entries?.length) {
        await db.entries.bulkPut(bundle.entries);
      }

      if (bundle.assets?.length) {
        const decodedAssets: Asset[] = bundle.assets.map((asset) => ({
          ...asset,
          data: decodeBase64(asset.data, asset.mimeType)
        }));
        await db.assets.bulkPut(decodedAssets);
      }
    });
  }

  async exportToZip(): Promise<Blob> {
    const snapshot = await this.exportToJson();
    const zip = new JSZip();
    zip.file('snapshot.json', JSON.stringify(snapshot, null, 2));
    return zip.generateAsync({ type: 'blob' });
  }

  async importFromZip(blob: Blob, options: ImportOptions = {}): Promise<void> {
    const zip = await JSZip.loadAsync(blob);
    const snapshotFile = zip.file('snapshot.json');

    if (!snapshotFile) {
      throw new Error('snapshot.json not found in archive');
    }

    const snapshotText = await snapshotFile.async('text');
    const parsed: ExportBundle = JSON.parse(snapshotText);
    await this.importFromJson(parsed, options);
  }
}

export const journalDao = new JournalDao();
