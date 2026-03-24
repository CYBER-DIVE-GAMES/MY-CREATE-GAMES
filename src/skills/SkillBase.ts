import { PlayerStats } from '../entities/Player';

export interface SkillDef {
  id: string;
  name: string;
  category: 'A' | 'B' | 'C' | 'D' | 'G' | 'K';
  color: number;
  maxLevel: number;
  description: (level: number) => string;
  /** 取得時にPlayerStatsを書き換える */
  apply: (stats: PlayerStats, level: number) => void;
  /** 解放条件（省略時は常に出現可） */
  isUnlocked?: (acquired: Map<string, number>) => boolean;
}
