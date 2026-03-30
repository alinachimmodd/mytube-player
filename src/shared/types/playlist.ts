import type { Track } from './track';

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
}
