// ============================================================
// GameOverScene - ゲームオーバー画面
// ============================================================
class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOver' }); }

  create() {
    const W = GameConfig.WIDTH, H = GameConfig.HEIGHT;

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000);

    // 赤い霧
    const fogGfx = this.add.graphics();
    fogGfx.fillStyle(0x220000, 0.5);
    fogGfx.fillRect(0, 0, W, H);
    fogGfx.setAlpha(0);
    this.tweens.add({ targets: fogGfx, alpha: 1, duration: 1500 });

    // パーティクル
    for (let i = 0; i < 20; i++) {
      const g = this.add.graphics();
      g.fillStyle(0x440000, 0.6 + Math.random() * 0.4);
      g.fillCircle(0, 0, 2 + Math.random() * 4);
      g.setPosition(Math.random() * W, H + 10);
      g.setAlpha(0);
      this.tweens.add({
        targets: g, y: -10, alpha: { from: 0.5, to: 0 },
        delay: Math.random() * 3000, duration: 2000 + Math.random() * 2000,
        repeat: -1,
      });
    }

    // テキスト
    const title = this.add.text(W / 2, H / 2 - 60, 'ゲームオーバー',
      { ...GameConfig.FONT.TITLE, color: '#cc2200', fontSize: '44px', stroke: '#000000', strokeThickness: 4 }
    ).setOrigin(0.5).setAlpha(0);

    const sub = this.add.text(W / 2, H / 2 - 10, 'ヨナが待っている……', GameConfig.FONT.SUBTITLE).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: title, alpha: 1, duration: 1500, delay: 500 });
    this.tweens.add({ targets: sub,   alpha: 1, duration: 1000, delay: 1500 });

    // メニュー
    this._selected = 0;
    this._items = [
      { label: 'タイトルへ戻る', action: 'title' },
    ];
    if (SaveManager.hasSave()) {
      this._items.splice(0, 0, { label: '最後のセーブから再開', action: 'continue' });
    }

    this._menuTexts = [];
    const menuY = H / 2 + 60;
    this._items.forEach((item, i) => {
      const t = this.add.text(W / 2, menuY + i * 40, item.label,
        { ...GameConfig.FONT.MENU, color: i === 0 ? '#daa520' : '#f0e6c8' });
      t.setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, delay: 2200 + i * 150, duration: 600 });
      this._menuTexts.push(t);
    });

    this._cursor = this.add.text(W / 2 - 120, menuY, '▶',
      { ...GameConfig.FONT.MENU, color: '#daa520' }).setOrigin(0).setAlpha(0);
    this.tweens.add({ targets: this._cursor, alpha: 1, delay: 2200, duration: 600 });

    this._canInput = false;
    this.time.delayedCall(2500, () => { this._canInput = true; });

    this._keys = this.input.keyboard.addKeys({
      UP:    Phaser.Input.Keyboard.KeyCodes.UP,
      DOWN:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      Z:     Phaser.Input.Keyboard.KeyCodes.Z,
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
    });

    AudioManager.stopBGM();
    this.time.delayedCall(800, () => AudioManager.playSFX('player_hit'));
  }

  update() {
    if (!this._canInput) return;

    if (Phaser.Input.Keyboard.JustDown(this._keys.UP)) {
      this._selected = Math.max(0, this._selected - 1);
      this._refresh(); AudioManager.playSFX('menu_move');
    } else if (Phaser.Input.Keyboard.JustDown(this._keys.DOWN)) {
      this._selected = Math.min(this._items.length - 1, this._selected + 1);
      this._refresh(); AudioManager.playSFX('menu_move');
    } else if (Phaser.Input.Keyboard.JustDown(this._keys.Z) ||
               Phaser.Input.Keyboard.JustDown(this._keys.ENTER)) {
      AudioManager.playSFX('menu_select');
      const action = this._items[this._selected].action;
      if (action === 'title') {
        GameState.reset();
        QuestSystem.startQuest('main_01');
        this.scene.start('Title');
      } else if (action === 'continue' && SaveManager.hasSave()) {
        SaveManager.load();
        const p = GameState.player;
        this.scene.stop();
        this.scene.start('Field', { areaId: p.currentArea, tileX: p.spawnX, tileY: p.spawnY });
      }
    }
  }

  _refresh() {
    this._menuTexts.forEach((t, i) => {
      t.setColor(i === this._selected ? '#daa520' : '#f0e6c8');
    });
    this._cursor.setY(GameConfig.HEIGHT / 2 + 60 + this._selected * 40 - 2);
  }
}
