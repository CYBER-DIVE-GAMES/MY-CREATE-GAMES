// ============================================================
// NPC - NPCキャラクタークラス
// ============================================================
class NPC extends Phaser.GameObjects.Sprite {

  constructor(scene, tileX, tileY, npcData) {
    const ts = GameConfig.TILE_SIZE;
    const tx = npcData.id === 'weiss' ? 'npc_weiss'
      : npcData.id === 'yonah'        ? 'npc_yonah'
      : npcData.id === 'popola'       ? 'npc_popola'
      :                                 'npc_villager';

    super(scene, (tileX + 0.5) * ts, (tileY + 0.5) * ts, tx);
    scene.add.existing(this);
    this.setDepth(GameConfig.DEPTH.NPCS);

    this.npcId    = npcData.id;
    this.dialogId = npcData.dialogId;
    this.questGiver = npcData.questGiver || [];

    // インタラクション表示
    this._promptText  = null;
    this._promptTimer = 0;
    this._showingPrompt = false;
    this._bobOffset = 0;
    this._bobDir    = 1;
    this._bobTimer  = 0;

    this._baseY = (tileY + 0.5) * ts;
  }

  update(delta, playerX, playerY) {
    // ボブアニメーション
    this._bobTimer += delta;
    if (this._bobTimer >= 30) {
      this._bobTimer = 0;
      this._bobOffset += this._bobDir * 0.3;
      if (Math.abs(this._bobOffset) >= 3) this._bobDir *= -1;
      this.y = this._baseY + this._bobOffset;
    }

    // プレイヤーとの距離チェック
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const inRange = dist < GameConfig.PLAYER.INTERACT_RANGE;

    if (inRange && !this._showingPrompt) this._showPrompt();
    else if (!inRange && this._showingPrompt) this._hidePrompt();
  }

  _showPrompt() {
    if (this._showingPrompt) return;
    this._showingPrompt = true;
    this._promptText = this.scene.add.text(
      this.x, this.y - 42, '[ E ]',
      { ...GameConfig.FONT.SMALL, color: '#daa520', stroke: '#000000', strokeThickness: 2 }
    );
    this._promptText.setOrigin(0.5, 1);
    this._promptText.setDepth(GameConfig.DEPTH.UI);
    this.scene.tweens.add({
      targets: this._promptText, alpha: { from: 0, to: 1 }, duration: 200,
    });
  }

  _hidePrompt() {
    this._showingPrompt = false;
    if (this._promptText) {
      this._promptText.destroy();
      this._promptText = null;
    }
  }

  isPlayerNear(playerX, playerY) {
    const dx = this.x - playerX;
    const dy = this.y - playerY;
    return (dx * dx + dy * dy) < GameConfig.PLAYER.INTERACT_RANGE * GameConfig.PLAYER.INTERACT_RANGE;
  }

  getEffectiveDialogId() {
    // クエストの状態によってダイアログを切り替え
    if (this.npcId === 'yonah') {
      if (GameState.hasItem('letter_for_yonah') && !GameState.getFlag('letter_delivered')) return 'yonah_letter';
      return this.dialogId;
    }
    if (this.npcId === 'popola') {
      if (!GameState.getFlag('talked_popola'))                 return 'popola_first';
      if (!QuestSystem.hasStarted('side_01'))                  return 'popola_quest_side01';
      if (!QuestSystem.hasStarted('side_02'))                  return 'popola_quest_side02';
      if (QuestSystem.isComplete('main_01') && !GameState.getFlag('popola_m1_done')) {
        GameState.setFlag('popola_m1_done', true);
        return 'main_01_complete';
      }
      return 'popola_first';
    }
    if (this.npcId === 'villager' && !QuestSystem.hasStarted('side_03')) {
      return this.dialogId;
    }
    return this.dialogId;
  }

  destroy(fromScene) {
    this._hidePrompt();
    super.destroy(fromScene);
  }
}
