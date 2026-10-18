// BGM の楽譜：メリーゴーラウンド風のワルツ（3拍子・ハ長調・16小節でループ）
// 1小節＝3拍。メロディは [音名, 拍数]（音名 'R' は休符）、コードは小節ごと

export const TEMPO_BPM = 160;
export const BEATS_PER_BAR = 3;

export type Note = [pitch: string, beats: number];

export const MELODY: Note[][] = [
  [['E5', 2], ['G5', 1]], [['C6', 2], ['G5', 1]], [['F5', 2], ['D5', 1]], [['E5', 3]],
  [['A5', 2], ['F5', 1]], [['G5', 2], ['E5', 1]], [['D5', 1], ['E5', 1], ['F5', 1]], [['E5', 2], ['R', 1]],
  [['G5', 1], ['E5', 1], ['G5', 1]], [['A5', 2], ['C6', 1]], [['F5', 1], ['A5', 1], ['D6', 1]], [['B5', 2], ['G5', 1]],
  [['C6', 2], ['G5', 1]], [['A5', 1], ['G5', 1], ['F5', 1]], [['D5', 1], ['F5', 1], ['B5', 1]], [['C6', 2], ['R', 1]],
];

/** コード：1拍目にベース、2・3拍目に和音（ズン・チャッ・チャッ） */
export type Chord = { bass: string; tones: string[] };
const C: Chord = { bass: 'C3', tones: ['C4', 'E4', 'G4'] };
const F: Chord = { bass: 'F2', tones: ['A3', 'C4', 'F4'] };
const G7: Chord = { bass: 'G2', tones: ['B3', 'D4', 'F4'] };
const Am: Chord = { bass: 'A2', tones: ['A3', 'C4', 'E4'] };
const Dm: Chord = { bass: 'D3', tones: ['A3', 'D4', 'F4'] };

export const CHORDS: Chord[] = [C, C, G7, C, F, C, G7, C, C, Am, Dm, G7, C, F, G7, C];

/** 後半8小節はベルでメロディを1オクターブ上に重ねる */
export const BELL_FROM_BAR = 8;
