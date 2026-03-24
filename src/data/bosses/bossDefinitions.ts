import { BossPhaseConfig } from '../../entities/Boss';

export interface BossDef {
  id: string;
  name: string;
  maxHp: number;
  xpReward: number;
  youkakuReward: number;
  phases: BossPhaseConfig[];
}

// ステージ1 全6ボス定義
export const STAGE1_BOSSES: Record<string, BossDef> = {

  // ─── 5分 ミニボス① 骸の剣鬼 ───
  miniboss1: {
    id: 'miniboss1', name: '骸の剣鬼',
    maxHp: 800, xpReward: 500, youkakuReward: 12,
    phases: [
      { hpThreshold: 1.0, color: 0x887766, firePattern: 'spread5',  fireInterval: 2000, bulletSpeed: 200, moveSpeed: 80  },
      { hpThreshold: 0.5, color: 0xff6644, firePattern: 'radial12', fireInterval: 1500, bulletSpeed: 240, moveSpeed: 120 },
    ],
  },

  // ─── 10分 ミニボス② 双子の狐精 ───
  miniboss2: {
    id: 'miniboss2', name: '双子の狐精',
    maxHp: 1200, xpReward: 500, youkakuReward: 14,
    phases: [
      { hpThreshold: 1.0, color: 0xffaacc, firePattern: 'spread5',  fireInterval: 1800, bulletSpeed: 210, moveSpeed: 100 },
      { hpThreshold: 0.6, color: 0xff55aa, firePattern: 'spiral',   fireInterval: 800,  bulletSpeed: 230, moveSpeed: 130 },
      { hpThreshold: 0.3, color: 0xff0066, firePattern: 'radial12', fireInterval: 1200, bulletSpeed: 260, moveSpeed: 150 },
    ],
  },

  // ─── 15分 ミニボス③ 呪縛の般若 ───
  miniboss3: {
    id: 'miniboss3', name: '呪縛の般若',
    maxHp: 1600, xpReward: 500, youkakuReward: 16,
    phases: [
      { hpThreshold: 1.0, color: 0xaa4444, firePattern: 'wall',     fireInterval: 2200, bulletSpeed: 220, moveSpeed: 60  },
      { hpThreshold: 0.5, color: 0xff2222, firePattern: 'spiral',   fireInterval: 700,  bulletSpeed: 240, moveSpeed: 100 },
      { hpThreshold: 0.25,color: 0xff0000, firePattern: 'radial12', fireInterval: 1000, bulletSpeed: 280, moveSpeed: 140 },
    ],
  },

  // ─── 20分 中ボス 冥府の狐女王 朱禍 ───
  midboss: {
    id: 'midboss', name: '冥府の狐女王 朱禍',
    maxHp: 4000, xpReward: 1000, youkakuReward: 25,
    phases: [
      { hpThreshold: 1.0,  color: 0xff6688, firePattern: 'spread5',  fireInterval: 1800, bulletSpeed: 220, moveSpeed: 90  },
      { hpThreshold: 0.75, color: 0xff3366, firePattern: 'radial12', fireInterval: 1400, bulletSpeed: 240, moveSpeed: 110 },
      { hpThreshold: 0.5,  color: 0xff0044, firePattern: 'spiral',   fireInterval: 700,  bulletSpeed: 260, moveSpeed: 130 },
      { hpThreshold: 0.25, color: 0xdd0000, firePattern: 'wall',     fireInterval: 1800, bulletSpeed: 290, moveSpeed: 160 },
    ],
  },

  // ─── 25分 ミニボス④ 桜樹の怨念 ───
  miniboss4: {
    id: 'miniboss4', name: '桜樹の怨念',
    maxHp: 2000, xpReward: 500, youkakuReward: 18,
    phases: [
      { hpThreshold: 1.0, color: 0xffaacc, firePattern: 'spiral',   fireInterval: 900,  bulletSpeed: 230, moveSpeed: 80  },
      { hpThreshold: 0.5, color: 0xff66aa, firePattern: 'radial12', fireInterval: 1200, bulletSpeed: 260, moveSpeed: 120 },
      { hpThreshold: 0.2, color: 0xff2288, firePattern: 'wall',     fireInterval: 1500, bulletSpeed: 300, moveSpeed: 160 },
    ],
  },

  // ─── 30分 ラスボス 九尾の大妖怪 夜叫 ───
  boss: {
    id: 'boss', name: '九尾の大妖怪 夜叫',
    maxHp: 8000, xpReward: 2000, youkakuReward: 30,
    phases: [
      { hpThreshold: 1.0,  color: 0xffffaa, firePattern: 'spread5',  fireInterval: 1600, bulletSpeed: 230, moveSpeed: 100 },
      { hpThreshold: 0.8,  color: 0xffdd44, firePattern: 'spiral',   fireInterval: 700,  bulletSpeed: 250, moveSpeed: 120 },
      { hpThreshold: 0.6,  color: 0xff8800, firePattern: 'radial12', fireInterval: 1200, bulletSpeed: 270, moveSpeed: 140 },
      { hpThreshold: 0.4,  color: 0xff4400, firePattern: 'wall',     fireInterval: 1500, bulletSpeed: 290, moveSpeed: 150 },
      { hpThreshold: 0.2,  color: 0xff0000, firePattern: 'spiral',   fireInterval: 500,  bulletSpeed: 320, moveSpeed: 180 },
    ],
  },
};
