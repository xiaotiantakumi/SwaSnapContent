export type RhythmSong = {
  id: string;
  title: string;
  emoji: string;
  audioSrc: string;
  beatmapSrc: string;
  durationMs: number;
};

export const DEFAULT_SONG_ID = 'shaved-ice-temperature';

export const RHYTHM_SONGS: RhythmSong[] = [
  {
    id: 'shaved-ice-temperature',
    title: 'かきごおりのうた',
    emoji: '🍧',
    audioSrc: '/sansu-100/audio/bgm/shaved-ice-temperature.mp3',
    beatmapSrc: '/sansu-100/audio/beatmaps/shaved-ice-temperature.json',
    durationMs: 176065,
  },
  {
    id: 'taiko-festival',
    title: 'おまつりだいこ',
    emoji: '🏮',
    audioSrc: '/sansu-100/audio/bgm/taiko-festival.mp3',
    beatmapSrc: '/sansu-100/audio/beatmaps/taiko-festival.json',
    durationMs: 174289,
  },
  {
    id: 'electropop-beat',
    title: 'ぴかぴかビート',
    emoji: '✨',
    audioSrc: '/sansu-100/audio/bgm/electropop-beat.mp3',
    beatmapSrc: '/sansu-100/audio/beatmaps/electropop-beat.json',
    durationMs: 175438,
  },
];

export function getSongById(id: string): RhythmSong {
  return RHYTHM_SONGS.find((s) => s.id === id) ?? RHYTHM_SONGS[0];
}
