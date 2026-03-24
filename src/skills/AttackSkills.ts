import { SkillDef } from './SkillBase';

export const ATTACK_SKILLS: SkillDef[] = [
  {
    id: 'A1_pierce',
    name: '貫通弾',
    category: 'A', color: 0xff4444, maxLevel: 3,
    description: (lv) => ['敵を貫通', '最大3体貫通', '無制限貫通'][lv - 1],
    apply: (stats, lv) => {
      stats.piercing = true;
      stats.pierceLimit = [1, 3, 999][lv - 1];
    },
  },
  {
    id: 'A2_explosion',
    name: '爆裂弾',
    category: 'A', color: 0xff4444, maxLevel: 3,
    description: (lv) => ['着弾時に小爆発', '爆発範囲 1.5倍', '爆発が連鎖することがある'][lv - 1],
    apply: (stats, lv) => { stats.explosionLevel = lv; },
  },
  {
    id: 'A3_rapid_fire',
    name: '急速連射',
    category: 'A', color: 0xff4444, maxLevel: 3,
    description: (lv) => ['攻撃速度 +30%', '攻撃速度 +60%', '攻撃速度 +100%'][lv - 1],
    apply: (stats, lv) => {
      const bonus = [0.3, 0.6, 1.0][lv - 1];
      stats.fireInterval = 500 / (1 + bonus);
    },
  },
  {
    id: 'A4_gravity',
    name: '重力弾',
    category: 'A', color: 0xff4444, maxLevel: 3,
    description: (lv) => ['弾が放物線・着弾で広範囲', '引力発生・敵を引き寄せ', '引き寄せた敵にもダメージ'][lv - 1],
    apply: (stats, lv) => {
      // 爆発範囲を代替として使用（引力は未来実装）
      stats.explosionLevel = Math.max(stats.explosionLevel, lv);
    },
  },
  {
    id: 'A5_split',
    name: '分裂弾',
    category: 'A', color: 0xff4444, maxLevel: 3,
    description: (lv) => ['着弾時に4方向に小弾', '8方向に', '小弾も分裂可能'][lv - 1],
    apply: (stats, lv) => { stats.splitLevel = lv; },
  },
  {
    id: 'A6_poison',
    name: '毒弾',
    category: 'A', color: 0xff4444, maxLevel: 3,
    description: (lv) => ['命中時に毒（3秒/秒ダメ）', '毒ダメージ 2倍', '毒が周囲に伝染'][lv - 1],
    apply: (stats, lv) => { stats.poisonLevel = lv; },
  },
  {
    id: 'A7_burn',
    name: '炎弾',
    category: 'A', color: 0xff4444, maxLevel: 3,
    description: (lv) => ['命中時に燃焼付与', '燃焼範囲拡大', '炎弾が爆裂弾を誘発'][lv - 1],
    apply: (stats, lv) => { stats.burnLevel = lv; },
  },
  {
    id: 'A8_ice',
    name: '氷結弾',
    category: 'A', color: 0xff4444, maxLevel: 3,
    description: (lv) => ['命中時に減速 50%', '凍結 1秒停止', '凍結後の攻撃ダメ +50%'][lv - 1],
    apply: (stats, lv) => { stats.iceLevel = lv; },
  },
  {
    id: 'A9_crit_rate',
    name: 'クリ率上昇',
    category: 'A', color: 0xff6622, maxLevel: 3,
    description: (lv) => [`クリ率 +10%（計${lv * 10}%）`, `クリ率 +20%（計${lv * 10}%）`, 'クリ率 +35%'][lv - 1],
    apply: (stats, lv) => { stats.critChance = [0.10, 0.20, 0.35][lv - 1]; },
  },
  {
    id: 'A10_crit_dmg',
    name: 'クリダメ強化',
    category: 'A', color: 0xff6622, maxLevel: 3,
    description: (lv) => ['クリダメ +50%', 'クリダメ +100%', 'クリダメ +200%'][lv - 1],
    apply: (stats, lv) => { stats.critMultiplier = [2.5, 3.0, 4.0][lv - 1]; },
  },
];
