import stagesJson from './stages.json' with { type: 'json' };

export type Stage = {
  id: string;
  name: string;
  /** `.` 空き、`#` 壁、`R G B Y P` ボックス */
  grid: string[];
  /** お手本（最短）手数。手書きせず npm run verify-stages で書き込む */
  par: number;
  silverMargin: number;
};

export const STAGES: readonly Stage[] = stagesJson;
