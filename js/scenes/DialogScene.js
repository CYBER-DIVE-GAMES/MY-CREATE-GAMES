// ============================================================
// DialogScene - ダイアログオーバーレイシーン
// ============================================================
class DialogScene extends Phaser.Scene {
  constructor() { super({ key: 'Dialog' }); }

  create() {
    this._box = new DialogBox(this);
    this._keys = this.input.keyboard.addKeys({
      Z:     Phaser.Input.Keyboard.KeyCodes.Z,
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      UP:    Phaser.Input.Keyboard.KeyCodes.UP,
      DOWN:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      W:     Phaser.Input.Keyboard.KeyCodes.W,
      S:     Phaser.Input.Keyboard.KeyCodes.S,
    });
    this._active = false;
    this._inputCooldown = 0;

    // EventBus で Field から呼び出す
    EventBus.on(EV.DIALOG_START, (dialogId) => {
      // Field シーンから _onDialogStart 経由で制御される
    }, this);
  }

  startDialog(dialogId, onComplete) {
    if (this._active) return;
    this._active    = true;
    this._onComplete = onComplete || null;
    this._inputCooldown = 300;

    // フィールドシーンを一時停止
    const fieldScene = this.scene.get('Field');
    if (fieldScene) fieldScene.setPaused(true);

    DialogSystem.start(dialogId, this, () => this._endDialog());
    this._showCurrentLine();
  }

  _showCurrentLine() {
    const line = DialogSystem.getCurrentLine();
    if (!line) { this._endDialog(); return; }
    this._box.show(line);
  }

  update(time, delta) {
    if (!this._active) return;
    this._box.update(delta);
    this._inputCooldown = Math.max(0, this._inputCooldown - delta);
    if (this._inputCooldown > 0) return;

    const confirm = Phaser.Input.Keyboard.JustDown(this._keys.Z)    ||
                    Phaser.Input.Keyboard.JustDown(this._keys.ENTER) ||
                    Phaser.Input.Keyboard.JustDown(this._keys.SPACE);
    const up      = Phaser.Input.Keyboard.JustDown(this._keys.UP)   ||
                    Phaser.Input.Keyboard.JustDown(this._keys.W);
    const down    = Phaser.Input.Keyboard.JustDown(this._keys.DOWN) ||
                    Phaser.Input.Keyboard.JustDown(this._keys.S);

    if (up   && this._box.hasChoices()) { this._box.moveChoice(-1); return; }
    if (down && this._box.hasChoices()) { this._box.moveChoice(1);  return; }

    if (confirm) {
      AudioManager.playSFX('menu_select');
      this._inputCooldown = 150;

      if (this._box.isTyping()) {
        this._box.skipTyping();
        return;
      }
      if (this._box.hasChoices()) {
        DialogSystem.choose(this._box.getSelectedChoice());
        const line = DialogSystem.getCurrentLine();
        if (line) this._showCurrentLine();
        else this._endDialog();
        return;
      }
      // 次の行へ
      const hasNext = DialogSystem.next();
      if (hasNext) this._showCurrentLine();
      else this._endDialog();
    }
  }

  _endDialog() {
    if (!this._active) return;
    this._active = false;
    this._box.hide();

    // フィールドシーン再開
    const fieldScene = this.scene.get('Field');
    if (fieldScene) fieldScene.setPaused(false);

    const cb = this._onComplete;
    this._onComplete = null;
    if (cb) cb();
  }

  shutdown() {
    EventBus.off(EV.DIALOG_START, null, this);
    if (this._box) this._box.destroy();
  }
}
