import { SkillDef } from './SkillBase';

export const BULLET_SKILLS: SkillDef[] = [
  {
    id: 'C1_side_gun',
    name: 'サイドガン',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['左右に追加弾（各1本）', '各2本', '各3本+角度自動調整'][lv - 1],
    apply: (stats, lv) => { stats.sideGunCount = lv; },
  },
  {
    id: 'C3_orbital',
    name: 'オービタル',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['周回する弾を4つ展開', '6つ', '8つ+弾速上昇'][lv - 1],
    apply: (stats, lv) => { stats.orbitalCount = [4, 6, 8][lv - 1]; },
  },
  {
    id: 'C4_discharge',
    name: '蓄積放電',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['0.5秒ごとに電撃補助攻撃', '範囲拡大', '連鎖電撃（最大3体）'][lv - 1],
    apply: (stats, lv) => { stats.dischargeLevel = lv; },
  },
  {
    id: 'C5_homing',
    name: 'ホーミング',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['3秒ごとに追尾弾1発', '2発', '3発+着弾爆発'][lv - 1],
    apply: (stats, lv) => { stats.homingLevel = lv; },
  },
  {
    id: 'C7_laser',
    name: 'レーザーチャージ',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['5秒ごとに太いレーザー', 'CD 4秒', 'CD 3秒+レーザー幅2倍'][lv - 1],
    apply: (stats, lv) => { stats.laserLevel = lv; },
  },
  {
    id: 'C9_bullet_speed',
    name: '弾速上昇',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['弾速 +20%', '弾速 +40%', '弾速 +70%+貫通付与'][lv - 1],
    apply: (stats, lv) => {
      stats.bulletSpeed = [480, 560, 680][lv - 1];
      if (lv >= 3) { stats.piercing = true; stats.pierceLimit = Math.max(stats.pierceLimit, 1); }
    },
  },
  {
    id: 'C10_scatter',
    name: '散弾拡散',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['弾が扇状に3本に分岐', '5本', '7本+中央弾がクリ確定'][lv - 1],
    apply: (stats, lv) => { stats.scatterCount = [3, 5, 7][lv - 1]; },
  },
];
