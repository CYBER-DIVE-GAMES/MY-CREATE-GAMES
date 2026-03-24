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
    id: 'C2_rear_gun',
    name: '後方砲撃',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['真後ろに弾を発射', '斜め後ろ2本追加', '後方弾が自動追尾'][lv - 1],
    apply: (stats, _lv) => { stats.hasRearGun = true; },
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
    id: 'C6_reflect',
    name: '反射弾',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['壁/障害物に弾が1回反射', '2回', '3回+反射後ダメ+30%'][lv - 1],
    apply: (stats, lv) => { stats.reflectCount = lv; },
  },
  {
    id: 'C7_laser',
    name: 'レーザーチャージ',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['5秒ごとに太いレーザー', 'CD 4秒', 'CD 3秒+レーザー幅2倍'][lv - 1],
    apply: (stats, lv) => { stats.laserLevel = lv; },
  },
  {
    id: 'C8_turret',
    name: '自動砲台',
    category: 'C', color: 0xff8800, maxLevel: 3,
    description: (lv) => ['5秒ごとに砲台設置（10秒持続）', '15秒持続', '20秒持続+砲台が移動'][lv - 1],
    apply: (stats, lv) => { stats.turretLevel = lv; },
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
