// ============================================================
// SaveManager - セーブ・ロード管理
// ============================================================
window.SaveManager = (function () {
  const SAVE_KEY = 'shadow_echo_v1';

  return {
    init() {
      setInterval(() => { if (this.hasSave()) this.save(); }, 3 * 60 * 1000);
    },

    save() {
      try {
        const data = { ...GameState.serialize(), savedAt: Date.now(), version: 1 };
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        EventBus.emit(EV.SAVE_DONE);
        return true;
      } catch (e) {
        console.warn('[SaveManager] save failed:', e);
        return false;
      }
    },

    load() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        GameState.deserialize(JSON.parse(raw));
        return true;
      } catch (e) {
        console.warn('[SaveManager] load failed:', e);
        return false;
      }
    },

    hasSave() { return !!localStorage.getItem(SAVE_KEY); },
    deleteSave() { localStorage.removeItem(SAVE_KEY); },

    getSaveInfo() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        const d = JSON.parse(raw);
        return {
          playerName: d.player?.name    || 'ニーア',
          level:      d.player?.level   || 1,
          area:       d.player?.currentArea || 'village',
          chapter:    d.chapter         || 0,
          savedAt:    d.savedAt         || 0,
          playtime:   d.player?.playtime || 0,
        };
      } catch (e) { return null; }
    },
  };
})();
