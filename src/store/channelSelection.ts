import { create } from 'zustand';

interface ChannelSelectionState {
  selectedChannelId?: string;
  selectChannel: (channelId: string) => void;
  clearChannel: () => void;
}

export const useChannelSelection = create<ChannelSelectionState>((set) => ({
  selectedChannelId: undefined,
  selectChannel: (channelId: string) => set({ selectedChannelId: channelId }),
  clearChannel: () => set({ selectedChannelId: undefined }),
}));
