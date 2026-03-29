// ============================================================
// QuestSystem - クエスト管理システム
// ============================================================
window.QuestSystem = (function () {

  function _clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function _findActive(questId) {
    return GameState.activeQuests.find(q => q.id === questId);
  }

  return {
    startQuest(questId) {
      if (!QuestData[questId])           return false;
      if (this.hasStarted(questId))      return false;
      if (this.isComplete(questId))      return false;

      const template = QuestData[questId];
      const quest = {
        id:          template.id,
        name:        template.name,
        description: template.description,
        type:        template.type,
        objectives:  _clone(template.objectives),
        rewards:     _clone(template.rewards),
        nextQuest:   template.nextQuest   || null,
        completionDialog: template.completionDialog || null,
        completionFlag:   template.completionFlag   || null,
        started:     true,
        done:        false,
      };
      GameState.activeQuests.push(quest);
      EventBus.emit(EV.QUEST_UPDATE, quest);
      return true;
    },

    hasStarted(questId) {
      return !!_findActive(questId) || GameState.player.completedQuests.includes(questId);
    },

    isComplete(questId) {
      return GameState.player.completedQuests.includes(questId);
    },

    // type: 'kill', 'item', 'flag'
    updateObjective(questId, objId, amount = 1) {
      const quest = _findActive(questId);
      if (!quest || quest.done) return;

      const obj = quest.objectives.find(o => o.id === objId);
      if (!obj) return;

      obj.current = Math.min(obj.current + amount, obj.required);
      EventBus.emit(EV.QUEST_UPDATE, quest);

      if (this._allObjectivesMet(quest)) this.completeQuest(questId);
    },

    updateByKill(enemyType) {
      GameState.activeQuests.forEach(q => {
        if (q.done) return;
        q.objectives.forEach(obj => {
          if (obj.type === 'kill' && obj.target === enemyType && obj.current < obj.required) {
            obj.current++;
            EventBus.emit(EV.QUEST_UPDATE, q);
          }
        });
        if (this._allObjectivesMet(q)) this.completeQuest(q.id);
      });
    },

    updateByItem(itemId) {
      GameState.activeQuests.forEach(q => {
        if (q.done) return;
        q.objectives.forEach(obj => {
          if (obj.type === 'item' && obj.target === itemId) {
            obj.current = GameState.getItemCount(itemId);
            EventBus.emit(EV.QUEST_UPDATE, q);
          }
        });
        if (this._allObjectivesMet(q)) this.completeQuest(q.id);
      });
    },

    updateByFlag(flagKey) {
      GameState.activeQuests.forEach(q => {
        if (q.done) return;
        q.objectives.forEach(obj => {
          if (obj.type === 'flag' && obj.target === flagKey && obj.current < obj.required) {
            obj.current = 1;
            EventBus.emit(EV.QUEST_UPDATE, q);
          }
        });
        if (this._allObjectivesMet(q)) this.completeQuest(q.id);
      });
    },

    _allObjectivesMet(quest) {
      return quest.objectives.every(o => o.current >= o.required);
    },

    completeQuest(questId) {
      const quest = _findActive(questId);
      if (!quest) return;

      quest.done = true;

      // 報酬付与
      const r = quest.rewards;
      if (r.xp)    LevelSystem.addExp(r.xp);
      if (r.gold)  GameState.addGold(r.gold);
      if (r.items) r.items.forEach(id => GameState.addItem(id));

      if (quest.completionFlag) GameState.setFlag(quest.completionFlag, true);

      GameState.activeQuests = GameState.activeQuests.filter(q => q.id !== questId);
      GameState.player.completedQuests.push(questId);
      EventBus.emit(EV.QUEST_DONE, questId);

      // 次のメインクエストを自動開始
      if (quest.nextQuest && QuestData[quest.nextQuest]) {
        const next = QuestData[quest.nextQuest];
        if (next.autoStart !== false) this.startQuest(quest.nextQuest);
      }
    },

    getActiveQuests()  { return GameState.activeQuests.filter(q => !q.done); },
    getMainQuest()     { return GameState.activeQuests.find(q => q.type === 'main' && !q.done) || null; },

    // EventBus 経由でフラグ・キル・アイテム更新をフック
    hookEvents() {
      EventBus.on(EV.FLAG_SET, (key) => this.updateByFlag(key));
      EventBus.on(EV.ENEMY_KILL, (data) => { if (data?.id) this.updateByKill(data.id); });
      EventBus.on(EV.ITEM_GET, (item) => { if (item?.id) this.updateByItem(item.id); });
    },
  };
})();
