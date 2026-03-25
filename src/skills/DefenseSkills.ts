import { SkillDef } from './SkillBase';

export const DEFENSE_SKILLS: SkillDef[] = [
  {
    id: 'B1_hp_up',
    name: 'HP増加',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['最大HP +20%', '最大HP +40%', '最大HP +70%'][lv - 1],
    apply: (stats, lv) => {
      const mult = [1.2, 1.4, 1.7][lv - 1];
      stats.maxHp = Math.floor(100 * mult);
      stats.hp = Math.min(stats.hp, stats.maxHp);
    },
  },
  {
    id: 'B2_regen',
    name: '再生の流れ',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['HP 毎秒 1% 回復', 'HP 毎秒 2% 回復', 'HP 毎秒 4% 回復'][lv - 1],
    apply: (_stats, _lv) => { /* StageScene側のregenLevelで管理 */ },
  },
  {
    id: 'B3_dash',
    name: '緊急回避',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['HP30%以下でダッシュ可（無敵あり）', 'ダッシュ無敵時間延長', 'HP50%以下で発動'][lv - 1],
    apply: (stats, lv) => {
      // 移動速度ボーナスで代替（ダッシュはUI実装省略）
      stats.speed = 200 + lv * 20;
    },
  },
  {
    id: 'B4_shield',
    name: 'シールド再生',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['5秒無被弾でHP5%シールド', '10%シールド', '20%シールド+反射ダメ'][lv - 1],
    apply: (stats, lv) => { stats.shieldLevel = lv; },
  },
  {
    id: 'B5_lifesteal',
    name: '吸血弾',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['与ダメの 1% をHP回復', '2% 回復', '3%+過回復分をシールドへ'][lv - 1],
    apply: (stats, lv) => { stats.lifeStealRate = [0.01, 0.02, 0.03][lv - 1]; },
  },
  {
    id: 'B6_small_hitbox',
    name: '当たり判定縮小',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['判定 -10%', '判定 -20%', '判定 -35%'][lv - 1],
    apply: (stats, lv) => { stats.hitboxScale = [0.9, 0.8, 0.65][lv - 1]; },
  },
  {
    id: 'B7_convert',
    name: '受難変換',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['被ダメ20%をゲージに変換', '30%変換', '50%+MAX時に無敵1秒'][lv - 1],
    apply: (stats, lv) => {
      // 被ダメ軽減として実装
      stats.maxSingleHitRatio = [0.8, 0.7, 0.5][lv - 1];
    },
  },
  {
    id: 'B8_last_stand',
    name: '死の間際',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['HP1以下で1度生存（60秒CD）', 'CD 45秒', 'CD 30秒+生存時HP10%回復'][lv - 1],
    apply: (stats, lv) => { stats.deathPreventLevel = lv; },
  },
  {
    id: 'B9_barrier',
    name: '磁力バリア',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['敵弾10%確率で吸収', '20%で吸収', '30%+吸収弾をHPに変換'][lv - 1],
    apply: (stats, lv) => { stats.barrierLevel = lv; },
  },
  {
    id: 'B10_no_instakill',
    name: '即死耐性',
    category: 'B', color: 0x4488ff, maxLevel: 3,
    description: (lv) => ['一撃死ダメを最大HP50%に制限', '70%制限', '80%制限+被ダメ軽減'][lv - 1],
    apply: (stats, lv) => { stats.maxSingleHitRatio = [0.5, 0.7, 0.8][lv - 1]; },
  },
];
