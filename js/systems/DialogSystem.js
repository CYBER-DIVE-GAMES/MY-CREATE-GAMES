// ============================================================
// DialogSystem - ダイアログ管理システム
// ============================================================
window.DialogSystem = (function () {
  let _active     = false;
  let _lines      = [];
  let _lineIndex  = 0;
  let _onComplete = null;
  let _dialogId   = null;
  let _scene      = null;
  let _pendingActions = [];

  function _resolveLines(dialogId) {
    const dialog = StoryData.dialogs[dialogId];
    if (!dialog) {
      console.warn('[DialogSystem] dialog not found:', dialogId);
      return [];
    }
    return dialog.lines || [];
  }

  function _applyLineActions(line) {
    // ダイアログ行に付随するゲームアクションを実行
    if (line.setFlag)  GameState.setFlag(line.setFlag, line.value !== undefined ? line.value : true);
    if (line.giveItem) GameState.addItem(line.giveItem);
    if (line.startQuest && QuestSystem) QuestSystem.startQuest(line.startQuest);
  }

  function _applyDialogActions(dialogId) {
    const dialog = StoryData.dialogs[dialogId];
    if (!dialog) return;
    if (dialog.onComplete) {
      dialog.onComplete.forEach(a => {
        if (a.setFlag !== undefined) GameState.setFlag(a.setFlag, a.value !== undefined ? a.value : true);
      });
    }
    if (dialog.giveItem)   GameState.addItem(dialog.giveItem);
    if (dialog.startQuest && QuestSystem) QuestSystem.startQuest(dialog.startQuest);
  }

  return {
    isActive() { return _active; },

    start(dialogId, scene, onComplete) {
      if (_active) return;
      const lines = _resolveLines(dialogId);
      if (!lines.length) {
        if (onComplete) onComplete();
        return;
      }

      _active     = true;
      _lines      = lines;
      _lineIndex  = 0;
      _onComplete = onComplete || null;
      _dialogId   = dialogId;
      _scene      = scene;

      EventBus.emit(EV.DIALOG_START, dialogId);
    },

    getCurrentLine() {
      return _lines[_lineIndex] || null;
    },

    // 次の行へ（choiceなしの場合）
    next() {
      if (!_active) return false;
      const line = this.getCurrentLine();
      if (!line) { this.end(); return false; }

      _applyLineActions(line);
      _lineIndex++;

      if (_lineIndex >= _lines.length) {
        this.end();
        return false;
      }
      return true; // 次の行あり
    },

    // 選択肢を選んだ場合
    choose(index) {
      if (!_active) return;
      const line = this.getCurrentLine();
      if (!line || !line.choices) return;

      const choice = line.choices[index];
      if (!choice) return;

      if (choice.flag) GameState.setFlag(choice.flag.key, choice.flag.value);
      GameState.choiceHistory.push({ dialog: _dialogId, choice: index, text: choice.text });

      // 特殊遷移
      if (choice.next === '_save_yes') {
        SaveManager.save();
        AudioManager.playSFX('save');
        this.end();
        return;
      }
      if (choice.next === '_save_no') {
        this.end();
        return;
      }

      // 別のダイアログに分岐
      if (choice.next && StoryData.dialogs[choice.next]) {
        const newLines = _resolveLines(choice.next);
        _lines = newLines;
        _lineIndex = 0;
        return;
      }

      // 次の行へ
      _lineIndex++;
      if (_lineIndex >= _lines.length) this.end();
    },

    end() {
      if (!_active) return;
      _applyDialogActions(_dialogId);
      _active    = false;
      const cb   = _onComplete;
      _onComplete = null;
      EventBus.emit(EV.DIALOG_END);
      if (cb) cb();
    },

    skip() {
      this.end();
    },

    getDialogId() { return _dialogId; },
  };
})();
