// ============================================================
// EventBus - ゲーム全体のイベント通信
// ============================================================
(function () {
  const _listeners = {};

  window.EventBus = {
    on(event, fn, context) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push({ fn, context });
      return this;
    },
    once(event, fn, context) {
      const wrapper = (...args) => {
        fn.apply(context, args);
        this.off(event, wrapper);
      };
      return this.on(event, wrapper, context);
    },
    off(event, fn) {
      if (!_listeners[event]) return this;
      if (!fn) {
        _listeners[event] = [];
      } else {
        _listeners[event] = _listeners[event].filter(l => l.fn !== fn);
      }
      return this;
    },
    emit(event, ...args) {
      if (!_listeners[event]) return;
      [..._listeners[event]].forEach(l => l.fn.apply(l.context, args));
    },
    removeAllListeners(event) {
      if (event) {
        _listeners[event] = [];
      } else {
        Object.keys(_listeners).forEach(k => { _listeners[k] = []; });
      }
    },
  };
})();

// イベント名定数
window.EV = {
  HP_CHANGE:    'hp-change',       // (hp, maxHp)
  MP_CHANGE:    'mp-change',       // (mp, maxMp)
  EXP_CHANGE:   'exp-change',      // (exp, expToNext, level)
  LEVEL_UP:     'level-up',        // (level)
  GOLD_CHANGE:  'gold-change',     // (gold)
  QUEST_UPDATE: 'quest-update',    // (quest)
  QUEST_DONE:   'quest-done',      // (questId)
  ITEM_GET:     'item-get',        // (item)
  ENEMY_KILL:   'enemy-kill',      // (enemyData)
  FLAG_SET:     'flag-set',        // (key, value)
  DIALOG_START: 'dialog-start',    // (dialogId)
  DIALOG_END:   'dialog-end',      // ()
  AREA_CHANGE:  'area-change',     // (areaId)
  SAVE_DONE:    'save-done',       // ()
  GAME_OVER:    'game-over',       // ()
  GAME_CLEAR:   'game-clear',      // (endingId)
  BOSS_PHASE:   'boss-phase',      // (phase)
  COMBO:        'combo',           // (count)
};
