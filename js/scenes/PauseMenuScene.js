// ============================================================
// PauseMenuScene - ポーズメニュー（オーバーレイ）
// ============================================================
class PauseMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'PauseMenu' }); }

  create() {
    const W = GameConfig.WIDTH, H = GameConfig.HEIGHT;
    const C = GameConfig.COLORS;

    // 背景
    this._overlay = this.add.graphics();
    this._overlay.fillStyle(0x000000, 0.7);
    this._overlay.fillRect(0, 0, W, H);

    // パネル
    const pw = 560, ph = 420, px = (W - pw) / 2, py = (H - ph) / 2;
    MenuUI.createPanel(this, px, py, pw, ph, 0.95);

    // ゲームタイトル
    this.add.text(W / 2, py + 20, 'SHADOW ECHO', { ...GameConfig.FONT.LARGE, color: '#daa520' }).setOrigin(0.5, 0);

    // タブ
    this._tabs = ['ステータス', 'クエスト', 'アイテム', '設定'];
    this._currentTab  = 0;
    this._tabTexts    = [];
    this._tabContainers = [];

    this._tabs.forEach((label, i) => {
      const tx = px + 20 + i * 132, ty = py + 52;
      const t = this.add.text(tx, ty, label,
        { ...GameConfig.FONT.SMALL, color: i === 0 ? '#daa520' : '#888888' });
      this._tabTexts.push(t);
    });

    // タブ下線
    this._tabLine = this.add.graphics();
    this._tabLine.lineStyle(1, C.UI_BORDER, 0.5);
    this._tabLine.lineBetween(px + 10, py + 74, px + pw - 10, py + 74);

    // 各タブの内容コンテナ
    for (let i = 0; i < this._tabs.length; i++) {
      const c = this.add.container(0, 0);
      c.setVisible(i === 0);
      this._tabContainers.push(c);
    }

    this._buildStatusTab(px, py);
    this._buildQuestTab(px, py);
    this._buildItemTab(px, py);
    this._buildSettingsTab(px, py);

    // キャンセル
    this.add.text(W / 2, py + ph - 20, 'ESC / P: 閉じる', GameConfig.FONT.TINY).setOrigin(0.5, 1);

    // 入力
    this._keys = this.input.keyboard.addKeys({
      ESC:   Phaser.Input.Keyboard.KeyCodes.ESC,
      P:     Phaser.Input.Keyboard.KeyCodes.P,
      LEFT:  Phaser.Input.Keyboard.KeyCodes.LEFT,
      RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      A:     Phaser.Input.Keyboard.KeyCodes.A,
      D:     Phaser.Input.Keyboard.KeyCodes.D,
      Z:     Phaser.Input.Keyboard.KeyCodes.Z,
      ENTER: Phaser.Input.Keyboard.KeyCodes.ENTER,
      UP:    Phaser.Input.Keyboard.KeyCodes.UP,
      DOWN:  Phaser.Input.Keyboard.KeyCodes.DOWN,
      W:     Phaser.Input.Keyboard.KeyCodes.W,
      S:     Phaser.Input.Keyboard.KeyCodes.S,
    });

    this._itemCursor = 0;
    this._inputCooldown = 200;
  }

  _buildStatusTab(px, py) {
    const c   = this._tabContainers[0];
    const p   = GameState.player;
    const cx  = px + 20, cy = py + 90;

    const rows = [
      ['名前',   p.name],
      ['レベル', `Lv.${p.level}`],
      ['HP',     `${p.hp} / ${p.maxHp}`],
      ['MP',     `${p.mp} / ${p.maxMp}`],
      ['攻撃力', String(p.atk)],
      ['防御力', String(p.def)],
      ['速さ',   String(p.spd)],
      ['所持金', `${p.gold} G`],
      ['キル数', `${p.kills} 体`],
      ['装備（武器）', p.equipment.weapon ? (ItemData[p.equipment.weapon]?.name || '—') : '—'],
      ['装備（防具）', p.equipment.armor  ? (ItemData[p.equipment.armor ]?.name || '—') : '—'],
    ];

    rows.forEach((row, i) => {
      const lbl = this.add.text(cx, cy + i * 24, row[0], GameConfig.FONT.SMALL).setOrigin(0, 0);
      const val = this.add.text(cx + 160, cy + i * 24, row[1], { ...GameConfig.FONT.SMALL, color: '#daa520' }).setOrigin(0, 0);
      c.add(lbl); c.add(val);
    });
  }

  _buildQuestTab(px, py) {
    const c  = this._tabContainers[1];
    const cx = px + 20, cy = py + 90;

    const allQ = QuestSystem.getActiveQuests();
    if (allQ.length === 0) {
      const t = this.add.text(cx, cy, 'アクティブなクエストはありません', GameConfig.FONT.SMALL);
      c.add(t);
      return;
    }

    let oy = cy;
    allQ.forEach(q => {
      const typeColor = q.type === 'main' ? '#daa520' : '#88aa88';
      const ht = this.add.text(cx, oy, `[${q.type === 'main' ? 'メイン' : 'サブ'}] ${q.name}`,
        { ...GameConfig.FONT.SMALL, color: typeColor });
      c.add(ht);
      oy += 20;

      q.objectives.forEach(obj => {
        const done   = obj.current >= obj.required;
        const objTxt = `  ${done ? '✓' : '○'} ${obj.desc} (${obj.current}/${obj.required})`;
        const ot = this.add.text(cx + 8, oy, objTxt,
          { ...GameConfig.FONT.TINY, color: done ? '#44cc66' : '#aaaaaa' });
        c.add(ot);
        oy += 16;
      });
      oy += 8;
    });
  }

  _buildItemTab(px, py) {
    const c  = this._tabContainers[2];
    const cx = px + 20, cy = py + 90;
    const inv = GameState.player.inventory;

    if (inv.length === 0) {
      c.add(this.add.text(cx, cy, 'アイテムを持っていません', GameConfig.FONT.SMALL));
      return;
    }

    this._itemObjects = [];
    inv.forEach((slot, i) => {
      const item = ItemData[slot.id] || { name: slot.id, description: '' };
      const row  = this.add.text(cx, cy + i * 22,
        `${item.name}  ×${slot.qty}  ${item.description || ''}`,
        { ...GameConfig.FONT.SMALL, color: i === this._itemCursor ? '#daa520' : '#f0e6c8' });
      c.add(row);
      this._itemObjects.push({ row, slot, item });
    });

    const hint = this.add.text(cx, cy + inv.length * 22 + 8,
      'Z: 使用 / 装備', { ...GameConfig.FONT.TINY, color: '#888888' });
    c.add(hint);
  }

  _buildSettingsTab(px, py) {
    const c  = this._tabContainers[3];
    const cx = px + 20, cy = py + 90;

    c.add(this.add.text(cx, cy, `BGM 音量: ${Math.round(AudioManager.getBgmVol() * 100)}%`, GameConfig.FONT.SMALL));
    c.add(this.add.text(cx, cy + 28, `SE 音量:  ${Math.round(AudioManager.getSfxVol() * 100)}%`, GameConfig.FONT.SMALL));
    c.add(this.add.text(cx, cy + 70, '← / → で調整', GameConfig.FONT.TINY));

    // セーブ
    const saveBtn = MenuUI.createButton(this, cx, cy + 100, 160, 'セーブする', () => {
      SaveManager.save();
    });
  }

  _switchTab(i) {
    this._currentTab = i;
    this._tabTexts.forEach((t, idx) => t.setColor(idx === i ? '#daa520' : '#888888'));
    this._tabContainers.forEach((c, idx) => c.setVisible(idx === i));
    AudioManager.playSFX('menu_move');
  }

  update(time, delta) {
    this._inputCooldown = Math.max(0, this._inputCooldown - delta);
    if (this._inputCooldown > 0) return;

    if (Phaser.Input.Keyboard.JustDown(this._keys.ESC) ||
        Phaser.Input.Keyboard.JustDown(this._keys.P)) {
      this._close();
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this._keys.LEFT) ||
        Phaser.Input.Keyboard.JustDown(this._keys.A)) {
      this._switchTab(Math.max(0, this._currentTab - 1));
      this._inputCooldown = 200;
    } else if (Phaser.Input.Keyboard.JustDown(this._keys.RIGHT) ||
               Phaser.Input.Keyboard.JustDown(this._keys.D)) {
      this._switchTab(Math.min(this._tabs.length - 1, this._currentTab + 1));
      this._inputCooldown = 200;
    }

    // アイテムタブの操作
    if (this._currentTab === 2) {
      const inv = GameState.player.inventory;
      if (Phaser.Input.Keyboard.JustDown(this._keys.UP) ||
          Phaser.Input.Keyboard.JustDown(this._keys.W)) {
        this._itemCursor = Math.max(0, this._itemCursor - 1);
        this._refreshItemCursor();
        this._inputCooldown = 150;
      } else if (Phaser.Input.Keyboard.JustDown(this._keys.DOWN) ||
                 Phaser.Input.Keyboard.JustDown(this._keys.S)) {
        this._itemCursor = Math.min(inv.length - 1, this._itemCursor + 1);
        this._refreshItemCursor();
        this._inputCooldown = 150;
      } else if (Phaser.Input.Keyboard.JustDown(this._keys.Z) ||
                 Phaser.Input.Keyboard.JustDown(this._keys.ENTER)) {
        this._useOrEquipItem(inv[this._itemCursor]);
        this._inputCooldown = 200;
      }
    }
  }

  _refreshItemCursor() {
    if (!this._itemObjects) return;
    this._itemObjects.forEach((obj, i) => {
      obj.row.setColor(i === this._itemCursor ? '#daa520' : '#f0e6c8');
    });
  }

  _useOrEquipItem(slot) {
    if (!slot) return;
    const item = ItemData[slot.id];
    if (!item) return;
    const p = GameState.player;

    if (item.type === 'consumable' && item.subtype === 'heal') {
      if (p.hp >= p.maxHp) return;
      GameState.healHp(item.effect.hp);
      GameState.removeItem(slot.id, 1);
      AudioManager.playSFX('item_get');
      this._rebuildItemTab();
    } else if (item.type === 'consumable' && item.subtype === 'mp') {
      GameState.restoreMp(item.effect.mp);
      GameState.removeItem(slot.id, 1);
      AudioManager.playSFX('item_get');
      this._rebuildItemTab();
    } else if (item.type === 'weapon') {
      GameState.equip('weapon', slot.id);
      AudioManager.playSFX('menu_select');
    } else if (item.type === 'armor') {
      GameState.equip('armor', slot.id);
      AudioManager.playSFX('menu_select');
    }
  }

  _rebuildItemTab() {
    const c = this._tabContainers[2];
    c.removeAll(true);
    this._buildItemTab(
      (GameConfig.WIDTH - 560) / 2,
      (GameConfig.HEIGHT - 420) / 2
    );
  }

  _close() {
    AudioManager.playSFX('menu_select');
    const fieldScene = this.scene.get('Field');
    if (fieldScene) fieldScene.setPaused(false);
    this.scene.stop();
  }
}
