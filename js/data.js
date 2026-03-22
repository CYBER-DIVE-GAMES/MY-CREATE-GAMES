// ===== 敵データ =====
const ENEMIES = [
  {
    name: 'スライム',
    sprite: '🟢',
    hp: 30,
    atk: 8,
    def: 2,
    exp: 10,
    gold: 5,
  },
  {
    name: 'コウモリ',
    sprite: '🦇',
    hp: 45,
    atk: 12,
    def: 3,
    exp: 18,
    gold: 8,
  },
  {
    name: 'ゴブリン',
    sprite: '👺',
    hp: 60,
    atk: 16,
    def: 5,
    exp: 28,
    gold: 12,
  },
  {
    name: 'スケルトン',
    sprite: '💀',
    hp: 80,
    atk: 20,
    def: 8,
    exp: 40,
    gold: 18,
  },
  {
    name: 'オーク',
    sprite: '👹',
    hp: 110,
    atk: 26,
    def: 12,
    exp: 60,
    gold: 25,
  },
];

// ===== ボスデータ =====
const BOSS = {
  name: '魔王ダークロード',
  sprite: '😈',
  hp: 300,
  atk: 40,
  def: 20,
  exp: 500,
  gold: 100,
};

// ===== 魔法データ =====
const SPELLS = {
  fire: {
    name: 'ファイア',
    cost: 5,
    damage: (mag) => Math.floor(mag * 2.5 + 10),
    message: '🔥 炎が敵を焼き尽くす！',
  },
  thunder: {
    name: 'サンダー',
    cost: 8,
    damage: (mag) => Math.floor(mag * 3.5 + 15),
    message: '⚡ 雷が敵を貫く！',
  },
  heal: {
    name: 'ヒール',
    cost: 4,
    heal: (mag) => Math.floor(mag * 2 + 20),
    message: '💚 傷が癒えていく...',
  },
};

// ===== レベルアップ経験値テーブル =====
// LEVEL_EXP[i] = レベル i+1 になるための総経験値
const LEVEL_EXP = [0, 30, 80, 160, 280, 450, 680, 980, 1360, 1840, 9999];

// ===== レベルアップ時ステータス増加 =====
function getLevelStats(lv) {
  return {
    maxHp:  50 + (lv - 1) * 15,
    maxMp:  20 + (lv - 1) * 5,
    atk:    10 + (lv - 1) * 4,
    mag:    8  + (lv - 1) * 3,
    def:    5  + (lv - 1) * 3,
  };
}
