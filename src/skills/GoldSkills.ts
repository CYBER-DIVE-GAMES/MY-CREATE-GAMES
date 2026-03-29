import { SkillDef } from './SkillBase';

export const GOLD_SKILLS: SkillDef[] = [
  {
    id: 'G1_bullet_prodigy',
    name: '弾幕の申し子',
    category: 'G', color: 0xffcc00, maxLevel: 1,
    description: (_lv) => '全弾幕スキル効果+30%、自弾サイズ1.5倍',
    apply: (stats, _lv) => {
      stats.damage = Math.floor(stats.damage * 1.3);
      stats.sideGunCount = Math.max(1, stats.sideGunCount);
    },
  },
  {
    id: 'G2_undying_heart',
    name: '不死の心臓',
    category: 'G', color: 0xffcc00, maxLevel: 1,
    description: (_lv) => '蘇生2回/ラン、蘇生後HP50%回復',
    apply: (stats, _lv) => {
      stats.deathPreventLevel = Math.max(stats.deathPreventLevel, 3);
      stats.maxHp = Math.floor(stats.maxHp * 1.2);
    },
  },
  {
    id: 'G3_chaos_engine',
    name: 'カオスエンジン',
    category: 'G', color: 0xffcc00, maxLevel: 1,
    description: (_lv) => '攻撃のたびにランダムな属性効果を付与',
    apply: (stats, _lv) => {
      stats.poisonLevel = Math.max(stats.poisonLevel, 1);
      stats.burnLevel   = Math.max(stats.burnLevel, 1);
      stats.iceLevel    = Math.max(stats.iceLevel, 1);
    },
  },
  {
    id: 'G4_overload',
    name: '過負荷放電',
    category: 'G', color: 0xffcc00, maxLevel: 1,
    description: (_lv) => 'HP30%以下で全スキルCD0・ダメ2倍10秒（5分CD）',
    apply: (stats, _lv) => {
      stats.dischargeLevel = Math.max(stats.dischargeLevel, 3);
    },
    isUnlocked: (a) => a.has('A9_crit_rate') && a.has('C4_discharge'),
  },
];
