import { SkillDef } from './SkillBase';

export const UTILITY_SKILLS: SkillDef[] = [
  {
    id: 'D1_magnet',
    name: 'XP磁石',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['XP吸収範囲 2倍', '3倍', '全画面自動回収'][lv - 1],
    apply: (stats, lv) => { stats.xpMagnetLevel = lv; },
  },
  {
    id: 'D2_youkaku_up',
    name: '妖核増加',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['妖核ドロップ +20%', '+40%', '+70%+レア妖核UP'][lv - 1],
    apply: (stats, lv) => { stats.youkakuBonusRate = [0.2, 0.4, 0.7][lv - 1]; },
  },
  {
    id: 'D3_rush',
    name: 'ラッシュ',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['LvUP直後3秒間ダメ+50%', '5秒間', '7秒間+移動速度+30%'][lv - 1],
    apply: (stats, lv) => { stats.rushLevel = lv; },
  },
  {
    id: 'D4_slow_time',
    name: '時間加速',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['敵の移動速度 -10%', '-20%', '-30%+弾速も-15%'][lv - 1],
    apply: (stats, lv) => { stats.enemySlowRate = [0.1, 0.2, 0.3][lv - 1]; },
  },
  {
    id: 'D5_more_choices',
    name: '覚醒の秘宝',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['次のスキル選択が4択に', '選択肢5択', '毎回4択固定'][lv - 1],
    apply: (stats, lv) => { stats.skillChoiceCount = [4, 5, 4][lv - 1]; },
  },
  {
    id: 'D6_duplicate',
    name: 'スキル複製',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['取得済みスキルの効果を30秒2倍（1分CD）', 'CD 45秒', 'CD 30秒+2スキルに適用'][lv - 1],
    apply: (_stats, _lv) => { /* UI/アクティブスキルとして未来実装 */ },
  },
  {
    id: 'D7_lucky_bell',
    name: '幸運の鈴',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['LvUP時に低確率でゴールドカード出現', '確率2倍', '確率3倍+効果1.5倍'][lv - 1],
    apply: (_stats, _lv) => { /* SkillSystem側でluckyBellLevelを管理 */ },
  },
  {
    id: 'D8_xp_resonance',
    name: '経験値共鳴',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['敵撃破でHP0.1%回復', '0.2%', '0.3%+XP取得量+10%'][lv - 1],
    apply: (stats, lv) => { stats.xpResonanceLevel = lv; },
  },
  {
    id: 'D9_break_obstacle',
    name: '障害物砲撃',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['落下障害物を破壊可能に', '破壊時に周囲に爆発', '破壊時に妖核もドロップ'][lv - 1],
    apply: (_stats, _lv) => { /* ObstacleSystem側で管理 */ },
  },
  {
    id: 'D10_multi_bonus',
    name: 'マルチボーナス',
    category: 'D', color: 0x44cc44, maxLevel: 3,
    description: (lv) => ['同一スキル3つ目取得時にボーナス効果', '2つ目から適用', '追加効果の強度1.5倍'][lv - 1],
    apply: (_stats, _lv) => { /* SkillSystem側で管理 */ },
  },
];
