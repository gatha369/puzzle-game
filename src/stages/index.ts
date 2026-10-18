import stagesJson from './stages.json' with { type: 'json' };

/** 新アイテムの初登場ステージで、最初の1手まで出す紹介 */
export type Intro = 'rainbow' | 'honey' | 'both';

export type Stage = {
  id: string;
  name: string;
  /** ボックス層：`.` 空き、`#` 壁、`R G B Y P` ボックス、`*` レインボー */
  grid: string[];
  /** 床層：`.` 普通、`h` はちみつ（省略時はすべて普通の床） */
  floor?: string[];
  intro?: Intro;
  /** お手本（最短）手数。手書きせず npm run verify-stages で書き込む */
  par: number;
  silverMargin: number;
};

export const STAGES: readonly Stage[] = stagesJson as Stage[];
