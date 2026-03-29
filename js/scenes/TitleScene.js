// ============================================================
// TitleScene - タイトル画面
// ============================================================
class TitleScene extends Phaser.Scene {
  constructor() { super({ key: 'Title' }); }

  create() {
    AudioManager.init();
    AudioManager.playBGM('title');

    const W = GameConfig.WIDTH, H = GameConfig.HEIGHT;
    const C = GameConfig.COLORS;

    // ---- 背景 ----
    this.add.rectangle(W / 2, H / 2, W, H, C.BG);

    // パーティクル（星・塵）
    this._particles = [];
    for (let i = 0; i < 60; i++) {
      const star = this.add.graphics();
      const sz   = Math.random() < 0.3 ? 2 : 1;
      star.fillStyle(0xffffff, 0.3 + Math.random() * 0.4);
      star.fillCircle(0, 0, sz);
      star.setPosition(Math.random() * W, Math.random() * H);
      this._particles.push({ gfx: star, spd: 0.1 + Math.random() * 0.3, vy: -0.3 });
    }

    // 背景の光の筋
    const fogGfx = this.add.graphics();
    fogGfx.fillStyle(0x1a1040, 0.3);
    fogGfx.fillRect(0, H * 0.3, W, H * 0.4);

    // ---- タイトルロゴ ----
    // 英タイトル
    const title = this.add.text(W / 2, H / 2 - 90, 'SHADOW ECHO', GameConfig.FONT.TITLE);
    title.setOrigin(0.5);
    title.setAlpha(0);

    // 日本語サブタイトル
    const sub = this.add.text(W / 2, H / 2 - 28, 'シャドウエコー — 失われた魂の物語', GameConfig.FONT.SUBTITLE);
    sub.setOrigin(0.5);
    sub.setAlpha(0);

    // 区切り線
    const line = this.add.graphics();
    line.lineStyle(1, C.UI_BORDER, 0.6);
    line.lineBetween(W / 2 - 180, H / 2 + 8, W / 2 + 180, H / 2 + 8);
    line.setAlpha(0);

    // ---- フェードイン ----
    this.tweens.add({ targets: title, alpha: 1, duration: 1600, ease: 'Power2' });
    this.tweens.add({ targets: sub,   alpha: 1, duration: 1600, delay: 400, ease: 'Power2' });
    this.tweens.add({ targets: line,  alpha: 1, duration: 800,  delay: 600 });

    // タイトルグロウ
    this.tweens.add({
      targets: title, alpha: { from: 0.85, to: 1 },
      duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 2000,
    });

    // ---- メニュー ----
    const hasSave = SaveManager.hasSave();
    this._menuItems = [
      { label: 'ゲームを始める', action: 'new_game' },
      { label: hasSave ? '続きから'   : '続きから',  action: 'continue', disabled: !hasSave },
      { label: '操作方法',            action: 'controls' },
    ];
    this._selected  = 0;
    this._menuTexts = [];
    this._menuObjs  = [];

    const menuY = H / 2 + 40;
    this._menuItems.forEach((item, i) => {
      const isDisabled = item.disabled;
      const color      = isDisabled ? '#444444' : (i === 0 ? '#daa520' : '#f0e6c8');
      const t = this.add.text(W / 2, menuY + i * 34, item.label,
        { ...GameConfig.FONT.MENU, color });
      t.setOrigin(0.5).setAlpha(0);
      this.tweens.add({ targets: t, alpha: isDisabled ? 0.4 : 1, delay: 1200 + i * 120, duration: 600 });
      this._menuTexts.push(t);
    });

    // カーソル
    this._cursor = this.add.text(W / 2 - 110, menuY, '▶',
      { ...GameConfig.FONT.MENU, color: '#daa520' }).setOrigin(0, 0).setAlpha(0);
    this.tweens.add({ targets: this._cursor, alpha: 1, delay: 1200, duration: 600 });

    // バージョン
    this.add.text(W - 8, H - 8, 'v1.0  ©SHADOW ECHO',
      { ...GameConfig.FONT.TINY }).setOrigin(1, 1);

    // ---- 入力 ----
    this._cursors = this.input.keyboard.createCursorKeys();
    this._keys    = this.input.keyboard.addKeys({ Z: Phaser.Input.Keyboard.KeyCodes.Z,
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
      ESC:   Phaser.Input.Keyboard.KeyCodes.ESC });

    this._canInput = false;
    this.time.delayedCall(1400, () => { this._canInput = true; });

    this._controlsVisible = false;
    this._controlsPanel   = null;

    this._menuY = menuY;

    // マウスクリックでオーディオ有効化
    this.input.once('pointerup', () => AudioManager.resumeContext());
  }

  update() {
    if (!this._canInput) return;

    // パーティクル更新
    this._particles.forEach(p => {
      p.gfx.y += p.vy;
      if (p.gfx.y < -5) p.gfx.y = GameConfig.HEIGHT + 5;
    });

    if (this._controlsVisible) {
      if (Phaser.Input.Keyboard.JustDown(this._keys.Z) ||
          Phaser.Input.Keyboard.JustDown(this._keys.ENTER) ||
          Phaser.Input.Keyboard.JustDown(this._keys.ESC)) {
        this._hideControls();
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this._cursors.up)) {
      this._moveMenu(-1);
    } else if (Phaser.Input.Keyboard.JustDown(this._cursors.down)) {
      this._moveMenu(1);
    } else if (Phaser.Input.Keyboard.JustDown(this._keys.Z) ||
               Phaser.Input.Keyboard.JustDown(this._keys.ENTER)) {
      this._selectMenu();
    }
  }

  _moveMenu(dir) {
    AudioManager.playSFX('menu_move');
    let next = this._selected;
    do {
      next = (next + dir + this._menuItems.length) % this._menuItems.length;
    } while (this._menuItems[next].disabled && next !== this._selected);
    this._selected = next;
    this._refreshMenu();
  }

  _refreshMenu() {
    const menuY = this._menuY;
    this._menuTexts.forEach((t, i) => {
      const isSelected = i === this._selected;
      const isDisabled = this._menuItems[i].disabled;
      t.setColor(isDisabled ? '#444444' : (isSelected ? '#daa520' : '#f0e6c8'));
      t.setFontSize(isSelected ? '22px' : '20px');
    });
    this._cursor.setY(menuY + this._selected * 34 - 2);
  }

  _selectMenu() {
    const item = this._menuItems[this._selected];
    if (item.disabled) return;
    AudioManager.playSFX('menu_select');

    if (item.action === 'controls') { this._showControls(); return; }

    this.cameras.main.fade(600, 0, 0, 0, false, (cam, prog) => {
      if (prog >= 1) {
        if (item.action === 'new_game') {
          GameState.reset();
          QuestSystem.startQuest('main_01');
          this.scene.start('Field', { areaId: 'village', tileX: 5, tileY: 8 });
        } else if (item.action === 'continue') {
          if (SaveManager.load()) {
            const p = GameState.player;
            this.scene.start('Field', { areaId: p.currentArea, tileX: p.spawnX, tileY: p.spawnY });
          }
        }
      }
    });
  }

  _showControls() {
    if (this._controlsPanel) return;
    const W = GameConfig.WIDTH, H = GameConfig.HEIGHT;
    this._controlsVisible = true;

    this._controlsPanel = this.add.container(0, 0);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85); bg.fillRect(0, 0, W, H);
    this._controlsPanel.add(bg);

    const lines = [
      '── 操作方法 ──',
      '',
      'WASD / 矢印キー  …  移動',
      'Z キー           …  攻撃（連打でコンボ）',
      'X キー           …  強攻撃',
      'C キー           …  魔法（MP消費）',
      'Shift キー       …  ロール回避（無敵時間あり）',
      'E キー           …  NPC に話しかける',
      'ESC キー         …  メニューを開く',
      'M キー           …  ワールドマップ',
      '',
      '── Z / Enter で閉じる ──',
    ];
    lines.forEach((l, i) => {
      const t = this.add.text(W / 2, H / 2 - 150 + i * 24, l,
        i === 0 ? { ...GameConfig.FONT.LARGE, color: '#daa520' }
                : GameConfig.FONT.PRIMARY);
      t.setOrigin(0.5, 0);
      this._controlsPanel.add(t);
    });
  }

  _hideControls() {
    if (this._controlsPanel) { this._controlsPanel.destroy(); this._controlsPanel = null; }
    this._controlsVisible = false;
  }
}
