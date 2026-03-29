// ============================================================
// DialogBox - ダイアログ表示コンポーネント
// ============================================================
class DialogBox {

  constructor(scene) {
    this.scene = scene;
    this._visible    = false;
    this._typeTimer  = 0;
    this._typeDelay  = 28;  // ms per character
    this._charIndex  = 0;
    this._fullText   = '';
    this._typing     = false;

    const W = GameConfig.WIDTH;
    const H = GameConfig.HEIGHT;
    const bx = 80, by = H - 160, bw = W - 160, bh = 140;

    // 背景パネル
    this._bg = scene.add.graphics();
    this._bg.setDepth(GameConfig.DEPTH.DIALOG);
    this._bg.setScrollFactor(0);
    this._drawBg(bx, by, bw, bh);

    // スピーカー名プレート
    this._speakerBg = scene.add.graphics();
    this._speakerBg.setDepth(GameConfig.DEPTH.DIALOG);
    this._speakerBg.setScrollFactor(0);

    this._speakerText = scene.add.text(bx + 20, by - 22, '', GameConfig.FONT.DIALOG_SPEAKER);
    this._speakerText.setDepth(GameConfig.DEPTH.DIALOG + 1);
    this._speakerText.setScrollFactor(0);

    // 本文
    this._bodyText = scene.add.text(bx + 20, by + 16, '', GameConfig.FONT.DIALOG);
    this._bodyText.setDepth(GameConfig.DEPTH.DIALOG + 1);
    this._bodyText.setScrollFactor(0);

    // 次へ▼インジケーター
    this._arrow = scene.add.text(bx + bw - 20, by + bh - 16, '▼',
      { ...GameConfig.FONT.SMALL, color: '#daa520' });
    this._arrow.setOrigin(1, 1);
    this._arrow.setDepth(GameConfig.DEPTH.DIALOG + 1);
    this._arrow.setScrollFactor(0);
    this._arrow.setAlpha(0);

    // 選択肢
    this._choiceTexts = [];

    // 定数保存
    this._bx = bx; this._by = by; this._bw = bw; this._bh = bh;

    this.hide();

    // 矢印ぼわぼわ
    scene.tweens.add({
      targets: this._arrow, alpha: { from: 0, to: 1 },
      duration: 600, yoyo: true, repeat: -1,
    });
  }

  _drawBg(bx, by, bw, bh) {
    this._bg.clear();
    // 黒半透明
    this._bg.fillStyle(GameConfig.COLORS.UI_BG, 0.88);
    this._bg.fillRoundedRect(bx, by, bw, bh, 8);
    // 金枠
    this._bg.lineStyle(2, GameConfig.COLORS.UI_BORDER, 1);
    this._bg.strokeRoundedRect(bx, by, bw, bh, 8);
  }

  show(line) {
    this._visible = true;
    this._bg.setVisible(true);
    this._speakerText.setVisible(true);
    this._bodyText.setVisible(true);
    this._arrow.setAlpha(0);

    // スピーカー
    if (line.speaker) {
      this._speakerText.setText(line.speaker);
      this._speakerBg.clear();
      this._speakerBg.fillStyle(GameConfig.COLORS.UI_BG, 0.9);
      const sw = this._speakerText.width + 20;
      this._speakerBg.fillRoundedRect(this._bx + 10, this._by - 28, sw, 24, 4);
      this._speakerBg.lineStyle(1, GameConfig.COLORS.UI_BORDER);
      this._speakerBg.strokeRoundedRect(this._bx + 10, this._by - 28, sw, 24, 4);
      this._speakerBg.setVisible(true);
    } else {
      this._speakerText.setText('');
      this._speakerBg.clear();
      this._speakerBg.setVisible(false);
    }

    // タイプライター開始
    this._fullText  = line.text || '';
    this._charIndex = 0;
    this._typing    = true;
    this._typeTimer = 0;
    this._bodyText.setText('');
    this._choices   = line.choices || null;
    this._clearChoices();
  }

  hide() {
    this._visible = false;
    this._bg.setVisible(false);
    this._speakerBg.setVisible(false);
    this._speakerText.setVisible(false);
    this._bodyText.setVisible(false);
    this._arrow.setAlpha(0);
    this._clearChoices();
  }

  update(delta) {
    if (!this._visible || !this._typing) return;

    this._typeTimer += delta;
    while (this._typeTimer >= this._typeDelay && this._charIndex < this._fullText.length) {
      this._typeTimer -= this._typeDelay;
      this._charIndex++;
      this._bodyText.setText(this._fullText.substring(0, this._charIndex));
    }

    if (this._charIndex >= this._fullText.length) {
      this._typing = false;
      if (!this._choices) this._arrow.setAlpha(1);
      else this._showChoices(this._choices);
    }
  }

  isTyping() { return this._typing; }

  skipTyping() {
    if (!this._typing) return;
    this._typing    = false;
    this._charIndex = this._fullText.length;
    this._bodyText.setText(this._fullText);
    if (!this._choices) this._arrow.setAlpha(1);
    else this._showChoices(this._choices);
  }

  _showChoices(choices) {
    this._clearChoices();
    const bx = this._bx, by = this._by, bw = this._bw, bh = this._bh;
    this._selectedChoice = 0;
    this._choiceCount    = choices.length;
    choices.forEach((c, i) => {
      const t = this.scene.add.text(
        bx + 20, by + bh - 22 - (choices.length - i - 1) * 22,
        `${i === this._selectedChoice ? '▶ ' : '  '}${c.text}`,
        { ...GameConfig.FONT.SMALL, color: i === 0 ? '#daa520' : '#f0e6c8' }
      );
      t.setDepth(GameConfig.DEPTH.DIALOG + 2);
      t.setScrollFactor(0);
      this._choiceTexts.push(t);
    });
  }

  moveChoice(dir) {
    if (!this._choiceTexts.length) return;
    const prev = this._selectedChoice;
    this._selectedChoice = (this._selectedChoice + dir + this._choiceCount) % this._choiceCount;
    this._choiceTexts.forEach((t, i) => {
      const txt = t.text.replace(/^[▶ ]{2}/, '');
      t.setText(i === this._selectedChoice ? `▶ ${txt}` : `  ${txt}`);
      t.setColor(i === this._selectedChoice ? '#daa520' : '#f0e6c8');
    });
    AudioManager.playSFX('menu_move');
  }

  getSelectedChoice() { return this._selectedChoice; }
  hasChoices() { return this._choiceTexts.length > 0; }

  _clearChoices() {
    this._choiceTexts.forEach(t => t.destroy());
    this._choiceTexts = [];
    this._selectedChoice = 0;
    this._choiceCount    = 0;
  }

  destroy() {
    this._bg.destroy();
    this._speakerBg.destroy();
    this._speakerText.destroy();
    this._bodyText.destroy();
    this._arrow.destroy();
    this._clearChoices();
  }
}
