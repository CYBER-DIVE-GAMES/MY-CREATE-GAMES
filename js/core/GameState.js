// ============================================================
// GameState - ゲーム状態の管理
// ============================================================
window.GameState = (function () {

  function _defaultPlayer() {
    return {
      name:      'ニーア',
      level:     1,
      hp:        GameConfig.PLAYER.BASE_HP,
      maxHp:     GameConfig.PLAYER.BASE_HP,
      mp:        GameConfig.PLAYER.BASE_MP,
      maxMp:     GameConfig.PLAYER.BASE_MP,
      exp:       0,
      expToNext: 100,
      atk:       GameConfig.PLAYER.BASE_ATK,
      def:       GameConfig.PLAYER.BASE_DEF,
      spd:       GameConfig.PLAYER.BASE_SPD,
      gold:      0,
      inventory: [],
      equipment: { weapon: null, armor: null },
      currentArea: 'village',
      spawnX:    5,
      spawnY:    8,
      storyFlags:       {},
      completedQuests:  [],
      kills:            0,
      playtime:         0,
    };
  }

  const state = {
    player:       _defaultPlayer(),
    activeQuests: [],
    chapter:      0,
    choiceHistory: [],
  };

  return {
    // -------- アクセサ --------
    get player()       { return state.player; },
    get activeQuests() { return state.activeQuests; },
    get chapter()      { return state.chapter; },
    set chapter(v)     { state.chapter = v; },

    // -------- セーブ・リセット --------
    reset() {
      state.player       = _defaultPlayer();
      state.activeQuests = [];
      state.chapter      = 0;
      state.choiceHistory = [];
    },

    serialize() {
      return JSON.parse(JSON.stringify(state));
    },

    deserialize(data) {
      Object.assign(state.player,  data.player || {});
      state.activeQuests  = data.activeQuests  || [];
      state.chapter       = data.chapter        || 0;
      state.choiceHistory = data.choiceHistory  || [];
    },

    // -------- フラグ --------
    setFlag(key, value) {
      state.player.storyFlags[key] = value;
      EventBus.emit(EV.FLAG_SET, key, value);
    },
    getFlag(key) {
      return state.player.storyFlags[key];
    },
    hasFlag(key) {
      return state.player.storyFlags[key] !== undefined && state.player.storyFlags[key] !== false;
    },

    // -------- インベントリ --------
    hasItem(id) {
      return state.player.inventory.some(s => s.id === id);
    },
    getItemCount(id) {
      const slot = state.player.inventory.find(s => s.id === id);
      return slot ? slot.qty : 0;
    },
    addItem(id, qty = 1) {
      const slot = state.player.inventory.find(s => s.id === id);
      if (slot) {
        slot.qty += qty;
      } else {
        state.player.inventory.push({ id, qty });
      }
      const item = ItemData ? ItemData[id] : null;
      EventBus.emit(EV.ITEM_GET, item || { id, qty });
    },
    removeItem(id, qty = 1) {
      const slot = state.player.inventory.find(s => s.id === id);
      if (!slot) return false;
      slot.qty -= qty;
      if (slot.qty <= 0) {
        state.player.inventory = state.player.inventory.filter(s => s.id !== id);
      }
      return true;
    },

    // -------- 装備 --------
    equip(slot, itemId) {
      state.player.equipment[slot] = itemId;
      this._recalcStats();
    },
    unequip(slot) {
      state.player.equipment[slot] = null;
      this._recalcStats();
    },
    getEquipped(slot) {
      return state.player.equipment[slot];
    },

    _recalcStats() {
      const base = {
        atk: GameConfig.PLAYER.BASE_ATK,
        def: GameConfig.PLAYER.BASE_DEF,
      };
      const lvBonus = state.player.level - 1;
      base.atk += lvBonus * GameConfig.LEVEL.ATK_PER_LEVEL;
      base.def += lvBonus * GameConfig.LEVEL.DEF_PER_LEVEL;

      Object.values(state.player.equipment).forEach(id => {
        if (!id || !ItemData || !ItemData[id]) return;
        const it = ItemData[id];
        if (it.atk) base.atk += it.atk;
        if (it.def) base.def += it.def;
      });

      state.player.atk = base.atk;
      state.player.def = base.def;
    },

    // -------- HP / MP --------
    setHp(v) {
      state.player.hp = Math.max(0, Math.min(v, state.player.maxHp));
      EventBus.emit(EV.HP_CHANGE, state.player.hp, state.player.maxHp);
      if (state.player.hp <= 0) EventBus.emit(EV.GAME_OVER);
    },
    setMp(v) {
      state.player.mp = Math.max(0, Math.min(v, state.player.maxMp));
      EventBus.emit(EV.MP_CHANGE, state.player.mp, state.player.maxMp);
    },
    healHp(v) { this.setHp(state.player.hp + v); },
    useMp(v)  { this.setMp(state.player.mp - v); return state.player.mp >= 0; },
    restoreMp(v) { this.setMp(state.player.mp + v); },

    // -------- ゴールド --------
    addGold(v) {
      state.player.gold += v;
      EventBus.emit(EV.GOLD_CHANGE, state.player.gold);
    },
    spendGold(v) {
      if (state.player.gold < v) return false;
      state.player.gold -= v;
      EventBus.emit(EV.GOLD_CHANGE, state.player.gold);
      return true;
    },

    // -------- 位置 --------
    setPosition(areaId, tileX, tileY) {
      state.player.currentArea = areaId;
      state.player.spawnX      = tileX;
      state.player.spawnY      = tileY;
    },
  };
})();
