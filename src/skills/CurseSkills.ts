import { SkillDef } from './SkillBase';

export const CURSE_SKILLS: SkillDef[] = [
  {
    id: 'K1_blood_price',
    name: '血の代償',
    category: 'K', color: 0x8800cc, maxLevel: 1,
    description: (_lv) => 'ダメージ+100% / スキル取得ごとに最大HP-5%',
    apply: (stats, _lv) => {
      stats.damage = Math.floor(stats.damage * 2.0);
      stats.maxHp  = Math.max(10, Math.floor(stats.maxHp * 0.95));
      stats.hp     = Math.min(stats.hp, stats.maxHp);
    },
  },
  {
    id: 'K3_time_offering',
    name: '時の贄',
    category: 'K', color: 0x8800cc, maxLevel: 1,
    description: (_lv) => 'XP取得量3倍 / 移動速度-30%',
    apply: (stats, _lv) => {
      stats.xpResonanceLevel = Math.max(stats.xpResonanceLevel, 3);
      stats.speed = Math.floor(stats.speed * 0.7);
    },
  },
  {
    id: 'K4_resonance_collapse',
    name: '共鳴崩壊',
    category: 'K', color: 0x8800cc, maxLevel: 1,
    description: (_lv) => '既存スキル効果全て+50% / 最後に取得したスキルが消去される',
    apply: (stats, _lv) => {
      // ダメージ・弾速を+50%で表現
      stats.damage      = Math.floor(stats.damage * 1.5);
      stats.bulletSpeed = Math.floor(stats.bulletSpeed * 1.5);
    },
  },
  {
    id: 'K5_abyss_eye',
    name: '深淵の目',
    category: 'K', color: 0x8800cc, maxLevel: 1,
    description: (_lv) => '敵の弾速-50% / 敵の出現数2倍',
    apply: (stats, _lv) => {
      stats.enemySlowRate = Math.max(stats.enemySlowRate, 0.5);
    },
  },
];
