// ============================================================
// LevelSystem - 経験値・レベルアップ管理
// ============================================================
window.LevelSystem = (function () {

  // レベルごとの必要EXP
  function _expRequired(level) {
    return Math.floor(GameConfig.LEVEL.EXP_BASE * Math.pow(GameConfig.LEVEL.EXP_FACTOR, level - 1));
  }

  return {
    addExp(amount) {
      const p = GameState.player;
      p.exp += amount;
      EventBus.emit(EV.EXP_CHANGE, p.exp, p.expToNext, p.level);

      while (p.exp >= p.expToNext && p.level < GameConfig.LEVEL.MAX) {
        p.exp -= p.expToNext;
        this.levelUp();
      }
      if (p.level >= GameConfig.LEVEL.MAX) p.exp = 0;
      EventBus.emit(EV.EXP_CHANGE, p.exp, p.expToNext, p.level);
    },

    levelUp() {
      const p = GameState.player;
      p.level += 1;
      p.maxHp     += GameConfig.LEVEL.HP_PER_LEVEL;
      p.maxMp     += GameConfig.LEVEL.MP_PER_LEVEL;
      p.hp         = p.maxHp;
      p.mp         = p.maxMp;
      p.expToNext  = _expRequired(p.level);

      // 装備込みのATK/DEFは GameState._recalcStats() で計算
      p.atk += GameConfig.LEVEL.ATK_PER_LEVEL;
      p.def += GameConfig.LEVEL.DEF_PER_LEVEL;

      EventBus.emit(EV.HP_CHANGE, p.hp, p.maxHp);
      EventBus.emit(EV.MP_CHANGE, p.mp, p.maxMp);
      EventBus.emit(EV.LEVEL_UP, p.level);
      AudioManager.playSFX('level_up');
    },

    getExpRequired(level) { return _expRequired(level); },

    getExpTable() {
      return Array.from({ length: GameConfig.LEVEL.MAX }, (_, i) => _expRequired(i + 1));
    },
  };
})();
