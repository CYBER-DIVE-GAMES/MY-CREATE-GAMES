// ============================================================
// WorldMapScene - ワールドマップ画面
// ============================================================
class WorldMapScene extends Phaser.Scene {
  constructor() { super({ key: 'WorldMap' }); }

  create(data) {
    this._returnData = data || {};
    const W = GameConfig.WIDTH, H = GameConfig.HEIGHT;

    // 暗いオーバーレイ
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.85);

    // タイトル
    MenuUI.createTitle(this, W / 2, 20, 'ワールドマップ');

    // エリアの位置（スクリーン座標）
    const areas = [
      { id: 'village', name: '失われた村',     x: W / 2 - 160, y: H / 2 + 80,  chapter: 0 },
      { id: 'forest',  name: '深い森',          x: W / 2,       y: H / 2 - 30,  chapter: 1 },
      { id: 'temple',  name: '古代の神殿',      x: W / 2 + 160, y: H / 2 - 140, chapter: 2 },
    ];

    // ---- 接続線 ----
    const lineGfx = this.add.graphics();
    lineGfx.lineStyle(2, 0x443322, 0.6);
    lineGfx.lineBetween(areas[0].x, areas[0].y, areas[1].x, areas[1].y);
    lineGfx.lineBetween(areas[1].x, areas[1].y, areas[2].x, areas[2].y);

    // ---- エリアノード ----
    this._areaNodes = [];
    this._selected  = 0;

    areas.forEach((area, i) => {
      const unlocked = GameState.chapter >= area.chapter;
      const isCurrent = GameState.player.currentArea === area.id;

      // ノード円
      const nodeGfx = this.add.graphics();
      const nodeColor = !unlocked ? 0x333333 : (isCurrent ? 0xdaa520 : 0x8888aa);
      nodeGfx.fillStyle(nodeColor); nodeGfx.fillCircle(0, 0, 18);
      if (isCurrent) {
        nodeGfx.lineStyle(3, 0xffd700); nodeGfx.strokeCircle(0, 0, 22);
      }
      nodeGfx.setPosition(area.x, area.y);

      // エリア名
      const nameText = this.add.text(area.x, area.y + 28, area.name,
        { ...GameConfig.FONT.SMALL, color: unlocked ? '#f0e6c8' : '#444444' }).setOrigin(0.5, 0);

      // ロックアイコン
      if (!unlocked) {
        this.add.text(area.x, area.y - 8, '🔒',
          { fontSize: '18px' }).setOrigin(0.5);
      } else if (isCurrent) {
        this.add.text(area.x, area.y - 8, '★',
          { fontSize: '14px', color: '#ffd700' }).setOrigin(0.5);
      }

      this._areaNodes.push({ ...area, unlocked, isCurrent, nodeGfx, nameText });
      if (isCurrent) this._selected = i;
    });

    // 情報パネル
    const panelW = 300, panelH = 100;
    const panelX = (W - panelW) / 2, panelY = H - panelH - 20;
    MenuUI.createPanel(this, panelX, panelY, panelW, panelH);
    this._infoName = this.add.text(panelX + panelW / 2, panelY + 16, '', GameConfig.FONT.PRIMARY).setOrigin(0.5, 0);
    this._infoDesc = this.add.text(panelX + panelW / 2, panelY + 42, '', GameConfig.FONT.TINY).setOrigin(0.5, 0);

    this._updateSelection();

    // ヒント
    this.add.text(W / 2, H - 10, '← →: 選択  Z: 移動  ESC: 閉じる',
      { ...GameConfig.FONT.TINY, color: '#666666' }).setOrigin(0.5, 1);

    // 入力
    this._keys = this.input.keyboard.addKeys({
      LEFT:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      A:     Phaser.Input.Keyboard.KeyCodes.A,
      D:     Phaser.Input.Keyboard.KeyCodes.D,
      Z:     Phaser.Input.Keyboard.KeyCodes.Z,
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
      ESC:   Phaser.Input.Keyboard.KeyCodes.ESC,
      M:     Phaser.Input.Keyboard.KeyCodes.M,
    });
    this._inputCooldown = 200;
  }

  _updateSelection() {
    const node = this._areaNodes[this._selected];
    const areaD = AreaData[node.id];

    this._infoName.setText(node.name);
    this._infoDesc.setText(node.unlocked
      ? (node.isCurrent ? '（現在地）' : 'Z で移動')
      : 'まだ訪れていない場所');

    // カーソル矢印
    if (this._cursor) this._cursor.destroy();
    this._cursor = this.add.text(node.x, node.y - 32, '▼',
      { ...GameConfig.FONT.SMALL, color: '#daa520' }).setOrigin(0.5);
    this.tweens.add({
      targets: this._cursor, y: node.y - 36,
      duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  update(time, delta) {
    this._inputCooldown = Math.max(0, this._inputCooldown - delta);
    if (this._inputCooldown > 0) return;

    if (Phaser.Input.Keyboard.JustDown(this._keys.LEFT) ||
        Phaser.Input.Keyboard.JustDown(this._keys.A)) {
      this._selected = Math.max(0, this._selected - 1);
      this._updateSelection();
      AudioManager.playSFX('menu_move');
      this._inputCooldown = 200;
    } else if (Phaser.Input.Keyboard.JustDown(this._keys.RIGHT) ||
               Phaser.Input.Keyboard.JustDown(this._keys.D)) {
      this._selected = Math.min(this._areaNodes.length - 1, this._selected + 1);
      this._updateSelection();
      AudioManager.playSFX('menu_move');
      this._inputCooldown = 200;
    } else if (Phaser.Input.Keyboard.JustDown(this._keys.Z) ||
               Phaser.Input.Keyboard.JustDown(this._keys.ENTER)) {
      const node = this._areaNodes[this._selected];
      if (node.unlocked && !node.isCurrent) {
        AudioManager.playSFX('menu_select');
        const areaD = AreaData[node.id];
        this.scene.stop();
        this.scene.stop('Field');
        this.scene.stop('HUD');
        this.scene.start('Field', { areaId: node.id, tileX: areaD.exits[0]?.targetTileX || 5, tileY: areaD.exits[0]?.targetTileY || 5 });
      }
      this._inputCooldown = 200;
    } else if (Phaser.Input.Keyboard.JustDown(this._keys.ESC) ||
               Phaser.Input.Keyboard.JustDown(this._keys.M)) {
      AudioManager.playSFX('menu_select');
      this.scene.stop();
      const fieldScene = this.scene.get('Field');
      if (fieldScene) fieldScene.setPaused(false);
      this._inputCooldown = 200;
    }
  }
}
