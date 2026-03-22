// ===== プレイヤー管理 =====

const player = {
  name: '勇者',
  lv: 1,
  exp: 0,
  hp: 0,
  mp: 0,
  maxHp: 0,
  maxMp: 0,
  atk: 0,
  mag: 0,
  def: 0,
  potions: 3,

  init() {
    const stats = getLevelStats(1);
    this.lv = 1;
    this.exp = 0;
    Object.assign(this, stats);
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.potions = 3;
  },

  // 経験値取得 → レベルアップ判定
  gainExp(amount) {
    this.exp += amount;
    const messages = [];
    while (this.lv < LEVEL_EXP.length && this.exp >= LEVEL_EXP[this.lv]) {
      this.lv++;
      const stats = getLevelStats(this.lv);
      const hpDiff = stats.maxHp - this.maxHp;
      const mpDiff = stats.maxMp - this.maxMp;
      Object.assign(this, stats);
      this.hp = Math.min(this.hp + hpDiff, this.maxHp);
      this.mp = Math.min(this.mp + mpDiff, this.maxMp);
      messages.push(`レベルアップ！ Lv ${this.lv} になった！`);
    }
    return messages;
  },

  // ポーション使用
  usePotion() {
    if (this.potions <= 0) return false;
    this.potions--;
    const heal = 50;
    this.hp = Math.min(this.hp + heal, this.maxHp);
    return heal;
  },

  // 休む（フィールド）
  rest() {
    this.hp = this.maxHp;
    this.mp = this.maxMp;
    this.potions = Math.min(this.potions + 1, 5);
  },

  isDead() {
    return this.hp <= 0;
  },

  // 次のレベルまでの経験値
  nextExp() {
    if (this.lv >= LEVEL_EXP.length) return 0;
    return LEVEL_EXP[this.lv] - this.exp;
  },
};
