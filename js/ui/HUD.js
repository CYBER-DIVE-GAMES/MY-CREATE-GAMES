// ============================================================
// HUD - ゲーム内ヘッドアップディスプレイ (オーバーレイシーン)
// ============================================================
class HUDScene extends Phaser.Scene {
  constructor() { super({ key: 'HUD' }); }

  create() {
    const p = GameState.player;
    const C = GameConfig.COLORS;
    const H = GameConfig.HEIGHT;
    const W = GameConfig.WIDTH;

    // ---- 左上: HP/MP/EXP バー ----
    const bx = 16, by = 16, barW = 160, barH = 10;

    // HP背景
    this._hpBg = this.add.graphics();
    this._hpBg.fillStyle(C.HP_BAR_BG); this._hpBg.fillRoundedRect(0, 0, barW, barH, 4);
    this._hpBg.setPosition(bx + 28, by);

    // HPバー
    this._hpFg = this.add.graphics();
    this._hpFg.setPosition(bx + 28, by);

    // MP背景
    this._mpBg = this.add.graphics();
    this._mpBg.fillStyle(C.MP_BAR_BG); this._mpBg.fillRoundedRect(0, 0, barW, barH, 4);
    this._mpBg.setPosition(bx + 28, by + 16);

    this._mpFg = this.add.graphics();
    this._mpFg.setPosition(bx + 28, by + 16);

    // EXP背景
    this._expBg = this.add.graphics();
    this._expBg.fillStyle(C.EXP_BAR_BG); this._expBg.fillRoundedRect(0, 0, barW, barH, 4);
    this._expBg.setPosition(bx + 28, by + 32);

    this._expFg = this.add.graphics();
    this._expFg.setPosition(bx + 28, by + 32);

    // ラベル
    this._hpLabel  = this.add.text(bx, by,      'HP', { ...GameConfig.FONT.SMALL, color: '#ff6644' });
    this._mpLabel  = this.add.text(bx, by + 16,  'MP', { ...GameConfig.FONT.SMALL, color: '#4488ff' });
    this._expLabel = this.add.text(bx, by + 32, 'EX', { ...GameConfig.FONT.SMALL, color: '#44cc66' });

    // レベル表示
    this._levelText = this.add.text(bx + barW + 36, by, `Lv.${p.level}`,
      { ...GameConfig.FONT.LEVEL });
    this._levelText.setOrigin(0, 0);

    // ゴールド
    this._goldText = this.add.text(W - 16, H - 16, `G: ${p.gold}`,
      { ...GameConfig.FONT.GOLD }).setOrigin(1, 1);

    // エリア名（左下）
    this._areaText = this.add.text(16, H - 16, '',
      { ...GameConfig.FONT.AREA }).setOrigin(0, 1).setAlpha(0);

    // 右上: クエストトラッカー
    this._questPanel = this.add.graphics();
    this._questTitle = this.add.text(W - 16, 16, '', { ...GameConfig.FONT.SMALL, color: '#daa520' }).setOrigin(1, 0);
    this._questObj   = this.add.text(W - 16, 34, '', { ...GameConfig.FONT.TINY  }).setOrigin(1, 0);

    // 操作ヒント
    this._hintText = this.add.text(W / 2, H - 16, 'Z:攻撃  X:強攻撃  C:魔法  Shift:回避  E:会話  ESC:メニュー',
      { ...GameConfig.FONT.TINY }).setOrigin(0.5, 1).setAlpha(0.5);

    // レベルアップフラッシュ
    this._levelUpText = this.add.text(W / 2, H / 2 - 60, 'LEVEL UP!',
      { ...GameConfig.FONT.XLARGE, color: '#ffff44', stroke: '#000000', strokeThickness: 4 }
    ).setOrigin(0.5).setAlpha(0).setDepth(50);

    // セーブ通知
    this._saveText = this.add.text(W - 16, H - 40, 'セーブ完了',
      { ...GameConfig.FONT.SMALL, color: '#88ff88' }).setOrigin(1, 1).setAlpha(0);

    this._drawBars(p);
    this._updateQuestTracker();

    // ---- EventBus リスナー ----
    EventBus.on(EV.HP_CHANGE,    (hp, maxHp) => this._onHpChange(hp, maxHp),   this);
    EventBus.on(EV.MP_CHANGE,    (mp, maxMp) => this._onMpChange(mp, maxMp),   this);
    EventBus.on(EV.EXP_CHANGE,   (exp, next) => this._onExpChange(exp, next),  this);
    EventBus.on(EV.LEVEL_UP,     (lv)        => this._onLevelUp(lv),           this);
    EventBus.on(EV.GOLD_CHANGE,  (g)         => this._onGoldChange(g),         this);
    EventBus.on(EV.QUEST_UPDATE, ()          => this._updateQuestTracker(),    this);
    EventBus.on(EV.QUEST_DONE,   ()          => this._updateQuestTracker(),    this);
    EventBus.on(EV.AREA_CHANGE,  (areaId)    => this._showAreaName(areaId),    this);
    EventBus.on(EV.SAVE_DONE,    ()          => this._showSaveNotice(),        this);
  }

  _drawBars(p) {
    const barW = 160, barH = 10;

    this._hpFg.clear();
    const hpPct = p.hp / p.maxHp;
    this._hpFg.fillStyle(hpPct > 0.5 ? GameConfig.COLORS.HP_BAR : (hpPct > 0.25 ? 0xff8800 : 0xff2200));
    this._hpFg.fillRoundedRect(0, 0, barW * hpPct, barH, 4);

    this._mpFg.clear();
    this._mpFg.fillStyle(GameConfig.COLORS.MP_BAR);
    this._mpFg.fillRoundedRect(0, 0, barW * (p.mp / p.maxMp), barH, 4);

    this._expFg.clear();
    this._expFg.fillStyle(GameConfig.COLORS.EXP_BAR);
    this._expFg.fillRoundedRect(0, 0, barW * (p.exp / p.expToNext), barH, 4);
  }

  _onHpChange(hp, maxHp) {
    const p = GameState.player; p.hp = hp; p.maxHp = maxHp;
    this._drawBars(p);
  }
  _onMpChange(mp, maxMp) {
    const p = GameState.player; p.mp = mp; p.maxMp = maxMp;
    this._drawBars(p);
  }
  _onExpChange(exp, next) {
    const p = GameState.player; p.exp = exp; p.expToNext = next;
    this._drawBars(p);
  }
  _onLevelUp(lv) {
    const p = GameState.player; p.level = lv;
    this._levelText.setText(`Lv.${lv}`);
    this._drawBars(p);

    this._levelUpText.setAlpha(1);
    this.tweens.add({
      targets: this._levelUpText, alpha: 0, y: GameConfig.HEIGHT / 2 - 100,
      duration: 2000, ease: 'Power2',
      onComplete: () => { this._levelUpText.setAlpha(0).setY(GameConfig.HEIGHT / 2 - 60); },
    });
  }
  _onGoldChange(g) {
    this._goldText.setText(`G: ${g}`);
  }

  _updateQuestTracker() {
    const quest = QuestSystem.getMainQuest();
    if (!quest) {
      this._questTitle.setText('');
      this._questObj.setText('');
      return;
    }
    this._questTitle.setText(`◆ ${quest.name}`);
    const obj = quest.objectives.find(o => o.current < o.required);
    if (obj) {
      this._questObj.setText(`${obj.desc}\n(${obj.current}/${obj.required})`);
    } else {
      this._questObj.setText('達成！');
    }
  }

  _showAreaName(areaId) {
    const area = AreaData[areaId];
    if (!area) return;
    this._areaText.setText(area.name).setAlpha(1);
    this.tweens.add({
      targets: this._areaText, alpha: 0, delay: 2500, duration: 1000,
    });
  }

  _showSaveNotice() {
    this._saveText.setAlpha(1);
    this.tweens.add({
      targets: this._saveText, alpha: 0, delay: 1500, duration: 800,
    });
  }

  shutdown() {
    EventBus.off(EV.HP_CHANGE);
    EventBus.off(EV.MP_CHANGE);
    EventBus.off(EV.EXP_CHANGE);
    EventBus.off(EV.LEVEL_UP);
    EventBus.off(EV.GOLD_CHANGE);
    EventBus.off(EV.QUEST_UPDATE);
    EventBus.off(EV.QUEST_DONE);
    EventBus.off(EV.AREA_CHANGE);
    EventBus.off(EV.SAVE_DONE);
  }
}
