// ============================================================
// FieldScene - メインゲームプレイシーン（探索・戦闘）
// ============================================================
class FieldScene extends Phaser.Scene {
  constructor() { super({ key: 'Field' }); }

  init(data) {
    this._initData = data || {};
  }

  create() {
    const d = this._initData;
    const areaId = d.areaId || GameState.player.currentArea || 'village';
    this.areaData = AreaData[areaId];
    if (!this.areaData) { console.error('AreaData not found:', areaId); return; }

    this._paused    = false;
    this._transitioning = false;
    this._killCountForQuest = {};

    const TS = GameConfig.TILE_SIZE;
    const mapW = this.areaData.width  * TS;
    const mapH = this.areaData.height * TS;

    // ---- タイルマップ描画 ----
    this._renderTilemap(TS);

    // ---- 壁コリジョン（StaticGroup） ----
    this.wallLayer = this.physics.add.staticGroup();
    this.areaData.tiles.forEach((row, ty) => {
      row.forEach((tileId, tx) => {
        if (tileId === 1) { // 壁
          const wx = tx * TS + TS / 2;
          const wy = ty * TS + TS / 2;
          const wall = this.add.rectangle(wx, wy, TS, TS, 0x000000, 0);
          this.physics.add.existing(wall, true);
          this.wallLayer.add(wall);
        }
        // 水はダメージとしてではなく速度低下として扱う（今回は通行止め）
        if (tileId === 3) {
          const wx = tx * TS + TS / 2;
          const wy = ty * TS + TS / 2;
          const wall = this.add.rectangle(wx, wy, TS, TS, 0x000000, 0);
          this.physics.add.existing(wall, true);
          this.wallLayer.add(wall);
        }
      });
    });

    // ---- プレイヤー生成 ----
    const spawnTileX = d.tileX !== undefined ? d.tileX : GameState.player.spawnX;
    const spawnTileY = d.tileY !== undefined ? d.tileY : GameState.player.spawnY;
    const spawnX     = (spawnTileX + 0.5) * TS;
    const spawnY     = (spawnTileY + 0.5) * TS;

    this.player = new Player(this, spawnX, spawnY);
    this.player.syncFromGameState();

    // ---- NPC 生成 ----
    this.npcs = [];
    (this.areaData.npcSpawns || []).forEach(npcData => {
      const npc = new NPC(this, npcData.tileX, npcData.tileY, npcData);
      this.npcs.push(npc);
    });

    // ---- 敵グループ ----
    this.enemies         = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.playerProjectiles = this.physics.add.group();

    (this.areaData.enemySpawns || []).forEach(spawn => {
      this._spawnEnemy(spawn.type, spawn.tileX, spawn.tileY);
    });

    // ---- ボス生成 ----
    if (this.areaData.bossSpawn && !GameState.getFlag('boss_defeated')) {
      const bs = this.areaData.bossSpawn;
      this.boss = new AncientBoss(this, bs.tileX, bs.tileY);
      this.enemies.add(this.boss);
    }

    // ---- セーブポイント ----
    this.saveZones = this.physics.add.staticGroup();
    (this.areaData.savePoints || []).forEach(sp => {
      const sz = this.add.sprite((sp.tileX + 0.5) * TS, (sp.tileY + 0.5) * TS, 'save_point');
      sz.setDepth(GameConfig.DEPTH.GROUND + 1);
      sz.setAlpha(0.8);
      this.physics.add.existing(sz, true);
      this.saveZones.add(sz);

      // 輝くアニメーション
      this.tweens.add({
        targets: sz, alpha: { from: 0.4, to: 0.9 },
        duration: 1200, yoyo: true, repeat: -1,
      });
    });

    // ---- 出口ゾーン ----
    this.exitZones = [];
    (this.areaData.exits || []).forEach(exit => {
      const ezone = this.add.zone(
        (exit.tileX + 0.5) * TS, (exit.tileY + 0.5) * TS,
        TS * 2, TS * 2
      );
      this.physics.add.existing(ezone, true);
      ezone.exitData = exit;
      this.exitZones.push(ezone);
    });

    // ---- ストーリートリガーゾーン ----
    this._storyTriggers = (this.areaData.storyTriggers || []).map(t => ({
      ...t,
      triggered: GameState.getFlag(`_trig_${t.flag}`) || false,
      zone: new Phaser.Geom.Rectangle(
        (t.tileX) * TS, (t.tileY) * TS, TS * 2, TS * 2
      ),
    }));

    // ---- 物理コリジョン ----
    this.physics.add.collider(this.player, this.wallLayer);
    this.physics.add.collider(this.enemies, this.wallLayer);
    this.physics.add.collider(this.enemies, this.enemies);

    // 敵弾 vs 壁
    this.physics.add.collider(this.enemyProjectiles, this.wallLayer, (proj) => {
      if (proj.onHitWall) proj.onHitWall();
    });
    this.physics.add.collider(this.playerProjectiles, this.wallLayer, (proj) => {
      if (proj.onHitWall) proj.onHitWall();
    });

    // ---- カメラ ----
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(this.player, true, GameConfig.CAMERA.LERP, GameConfig.CAMERA.LERP);
    this.cameras.main.setBackgroundColor(this.areaData.bgColor || GameConfig.COLORS.BG);

    // ---- 入力 ----
    this._cursors = this.input.keyboard.createCursorKeys();
    this._keys    = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      Z: Phaser.Input.Keyboard.KeyCodes.Z,
      X: Phaser.Input.Keyboard.KeyCodes.X,
      C: Phaser.Input.Keyboard.KeyCodes.C,
      E: Phaser.Input.Keyboard.KeyCodes.E,
      M: Phaser.Input.Keyboard.KeyCodes.M,
      P:     Phaser.Input.Keyboard.KeyCodes.P,
      ESC:   Phaser.Input.Keyboard.KeyCodes.ESC,
      SHIFT: Phaser.Input.Keyboard.KeyCodes.SHIFT,
    });

    // ---- HUD シーン起動 ----
    if (!this.scene.isActive('HUD')) this.scene.launch('HUD');
    if (!this.scene.isActive('Dialog')) this.scene.launch('Dialog');

    // ---- エリアBGM ----
    AudioManager.playBGM(this.areaData.bgm || 'village');

    // エリア名通知
    GameState.setPosition(areaId, spawnTileX, spawnTileY);
    EventBus.emit(EV.AREA_CHANGE, areaId);
    GameState.chapter = Math.max(GameState.chapter, this.areaData.chapter || 0);

    // ゲームオーバー・クリアリスナー
    EventBus.on(EV.GAME_OVER,  () => this._onGameOver(),  this);
    EventBus.on(EV.GAME_CLEAR, (id) => this._onGameClear(id), this);

    // フェードイン
    this.cameras.main.fadeIn(400);

    // イントロダイアログ（初回）
    if (!GameState.getFlag('intro_shown') && areaId === 'village') {
      GameState.setFlag('intro_shown', true);
      this.time.delayedCall(800, () => this._startDialog('intro_weiss'));
    }
  }

  // ---- タイルマップ描画 ----
  _renderTilemap(TS) {
    const tileKeys = ['tile_floor', 'tile_wall', 'tile_grass', 'tile_water', 'tile_stone', 'tile_sand'];
    const rt = this.add.renderTexture(0, 0, this.areaData.width * TS, this.areaData.height * TS);
    rt.setDepth(GameConfig.DEPTH.GROUND);

    this.areaData.tiles.forEach((row, ty) => {
      row.forEach((tileId, tx) => {
        const key = tileKeys[tileId] || 'tile_floor';
        rt.draw(key, tx * TS, ty * TS);
      });
    });
  }

  // ---- 敵スポーン ----
  _spawnEnemy(type, tileX, tileY) {
    let enemy;
    switch (type) {
      case 'shade_small':   enemy = new ShadeSmall(this, tileX, tileY);   break;
      case 'shade_warrior': enemy = new ShadeWarrior(this, tileX, tileY); break;
      case 'shade_mage':    enemy = new ShadeMage ? new ShadeMage(this, tileX, tileY) : new ShadeWarrior(this, tileX, tileY); break;
      default:              enemy = new ShadeSmall(this, tileX, tileY);
    }
    this.enemies.add(enemy);
    return enemy;
  }

  // ---- 更新ループ ----
  update(time, delta) {
    if (this._paused || this._transitioning) return;
    if (!this.player || !this.player.active) return;

    // プレイヤー更新
    this.player.update(this._cursors, this._keys, delta);

    // 敵更新
    this.enemies.getChildren().forEach(e => {
      if (e.active && e.state !== 'dead') e.update(delta, this.player);
    });

    // プレイヤー弾更新
    this.playerProjectiles.getChildren().forEach(p => {
      if (p.active) p.update(delta);
    });
    this.enemyProjectiles.getChildren().forEach(p => {
      if (p.active) p.update(delta);
    });

    // NPC 更新
    this.npcs.forEach(npc => {
      if (npc.active) npc.update(delta, this.player.x, this.player.y);
    });

    // ----- 攻撃ヒット判定 -----
    this._checkPlayerAttackHits();
    this._checkEnemyAttackHits(delta);
    this._checkProjectileHits();

    // ----- インタラクション -----
    if (Phaser.Input.Keyboard.JustDown(this._keys.E)) {
      this._checkNpcInteract();
    }

    // ----- 出口チェック -----
    this._checkExits();

    // ----- セーブポイントチェック -----
    this._checkSavePoints();

    // ----- ストーリートリガー -----
    this._checkStoryTriggers();

    // ----- ボスアクティベーション -----
    if (this.boss && !this.boss._activated && this.boss.active) {
      const dx = this.boss.x - this.player.x;
      const dy = this.boss.y - this.player.y;
      if (dx * dx + dy * dy < 300 * 300) {
        this.boss.activate(this);
      }
    }

    // ----- メニュー -----
    if (Phaser.Input.Keyboard.JustDown(this._keys.ESC) ||
        Phaser.Input.Keyboard.JustDown(this._keys.P)) {
      this._openPauseMenu();
    }

    // ----- ワールドマップ -----
    if (Phaser.Input.Keyboard.JustDown(this._keys.M)) {
      this._openWorldMap();
    }
  }

  // ---- プレイヤー攻撃 → 敵ヒット ----
  _checkPlayerAttackHits() {
    if (!this.player.attackHitActive) return;

    const attackId = this.player.comboCount * 1000 + (this.player.isHeavyAttack ? 500 : 0) + (this.player.isMagicAttack ? 250 : 0);

    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.state === 'dead') return;
      if (enemy._lastHitAttackId === attackId) return;

      if (this.player.isHitting(enemy.x, enemy.y)) {
        enemy._lastHitAttackId = attackId;
        const { damage, crit } = this.player.isMagicAttack
          ? { damage: CombatSystem.calcMagicDamage(GameState.player.atk), crit: false }
          : CombatSystem.playerAttackDamage(this.player.attackComboIdx, this.player.isHeavyAttack, false);

        CombatSystem.showDamageNumber(this, enemy.x, enemy.y - enemy.displayHeight / 2, damage, crit ? 'crit' : 'damage');
        enemy.takeDamage(damage);

        // コンボ加算
        const comboIdx = this.player.attackComboIdx;
        if (comboIdx === 2) EventBus.emit(EV.COMBO, 3);
      }
    });
  }

  // ---- 敵攻撃 → プレイヤーヒット ----
  _checkEnemyAttackHits(delta) {
    if (this.player.invincible || this.player.state === 'dead') return;

    this.enemies.getChildren().forEach(enemy => {
      if (!enemy.active || enemy.state === 'dead') return;
      if (!enemy.attackActive) return;

      const dx = enemy.x - this.player.x;
      const dy = enemy.y - this.player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < (enemy.data_.attackRange || 50) + 24) {
        const dmg = CombatSystem.enemyAttackDamage(enemy.atk);
        this.player.takeDamage(dmg);
        enemy.attackActive = false; // ヒット後クールダウン
      }
    });
  }

  // ---- 弾ヒット判定 ----
  _checkProjectileHits() {
    // プレイヤー弾 → 敵
    this.playerProjectiles.getChildren().forEach(proj => {
      if (!proj.active) return;
      this.enemies.getChildren().forEach(enemy => {
        if (!enemy.active || enemy.state === 'dead') return;
        const dx = proj.x - enemy.x, dy = proj.y - enemy.y;
        if (dx * dx + dy * dy < 32 * 32) {
          const dmg = Math.floor(proj.damage);
          CombatSystem.showDamageNumber(this, enemy.x, enemy.y - 20, dmg, 'magic');
          enemy.takeDamage(dmg);
          proj.destroy();
        }
      });
    });

    // 敵弾 → プレイヤー
    if (!this.player.invincible) {
      this.enemyProjectiles.getChildren().forEach(proj => {
        if (!proj.active) return;
        const dx = proj.x - this.player.x, dy = proj.y - this.player.y;
        if (dx * dx + dy * dy < 24 * 24) {
          const dmg = Math.max(1, Math.floor(proj.damage) - Math.floor(GameState.player.def * 0.3));
          this.player.takeDamage(dmg);
          proj.destroy();
        }
      });
    }
  }

  // ---- NPC インタラクション ----
  _checkNpcInteract() {
    if (DialogSystem.isActive()) return;
    for (const npc of this.npcs) {
      if (!npc.active) continue;
      if (npc.isPlayerNear(this.player.x, this.player.y)) {
        const dialogId = npc.getEffectiveDialogId();
        if (dialogId) this._startDialog(dialogId);
        return;
      }
    }
  }

  // ---- 出口チェック ----
  _checkExits() {
    if (this._transitioning) return;
    for (const ezone of this.exitZones) {
      const ex = ezone.exitData;
      if (!ex) continue;
      const dx = ezone.x - this.player.x, dy = ezone.y - this.player.y;
      if (dx * dx + dy * dy < 50 * 50) {
        // ロックチェック
        if (ex.requireFlag && !GameState.getFlag(ex.requireFlag)) {
          // 既に通知済みなら何もしない
          if (!this._lastLockMsg || this._lastLockMsg !== ex.requireFlag) {
            this._lastLockMsg = ex.requireFlag;
            this._showAreaMessage(ex.lockedMsg || 'まだここには行けない');
          }
          return;
        }
        this._lastLockMsg = null;
        this._changeArea(ex.targetArea, ex.targetTileX, ex.targetTileY);
        return;
      }
    }
    this._lastLockMsg = null;
  }

  // ---- セーブポイントチェック ----
  _checkSavePoints() {
    this.saveZones.getChildren().forEach(sz => {
      const dx = sz.x - this.player.x, dy = sz.y - this.player.y;
      if (dx * dx + dy * dy < 40 * 40) {
        if (!this._saveCooldown || Date.now() - this._saveCooldown > 5000) {
          this._saveCooldown = Date.now();
          this._startDialog('save_point');
        }
      }
    });
  }

  // ---- ストーリートリガーチェック ----
  _checkStoryTriggers() {
    this._storyTriggers.forEach(trigger => {
      if (trigger.triggered) return;
      if (trigger.requireFlag && !GameState.getFlag(trigger.requireFlag)) return;

      // killCount チェック
      if (trigger.requireKill) {
        const cnt = (this._killCountForQuest[trigger.requireKill.type] || 0);
        if (cnt < trigger.requireKill.count) return;
      }

      if (trigger.zone.contains(this.player.x, this.player.y)) {
        trigger.triggered = true;
        if (trigger.once) GameState.setFlag(`_trig_${trigger.flag}`, true);

        const doTrigger = () => {
          if (trigger.giveItem) GameState.addItem(trigger.giveItem);
          if (trigger.dialogId) this._startDialog(trigger.dialogId);
        };
        doTrigger();
      }
    });
  }

  // ---- エリア移動 ----
  _changeArea(targetAreaId, targetTileX, targetTileY) {
    if (this._transitioning) return;
    this._transitioning = true;

    this.cameras.main.fade(400, 0, 0, 0, false, (cam, prog) => {
      if (prog >= 1) {
        GameState.setPosition(targetAreaId, targetTileX, targetTileY);
        this.scene.restart({ areaId: targetAreaId, tileX: targetTileX, tileY: targetTileY });
      }
    });
  }

  // ---- ダイアログ起動 ----
  _startDialog(dialogId) {
    if (DialogSystem.isActive()) return;
    const dialogScene = this.scene.get('Dialog');
    if (dialogScene && dialogScene.startDialog) {
      dialogScene.startDialog(dialogId, () => {
        // ダイアログ完了後のチェック
        this._checkQuestCompletion();
      });
    }
  }

  // ---- クエスト完了チェック ----
  _checkQuestCompletion() {
    const main = QuestSystem.getMainQuest();
    if (main && QuestSystem._allObjectivesMet && QuestSystem._allObjectivesMet(main)) {
      QuestSystem.completeQuest(main.id);
    }
  }

  // ---- ゲームオーバー ----
  _onGameOver() {
    if (this._transitioning) return;
    this._transitioning = true;
    EventBus.off(EV.GAME_OVER, null, this);
    EventBus.off(EV.GAME_CLEAR, null, this);

    this.time.delayedCall(1200, () => {
      this.scene.stop('HUD');
      this.scene.stop('Dialog');
      this.scene.start('GameOver');
    });
  }

  // ---- ゲームクリア ----
  _onGameClear(endingId) {
    if (this._transitioning) return;
    this._transitioning = true;
    EventBus.off(EV.GAME_OVER, null, this);
    EventBus.off(EV.GAME_CLEAR, null, this);

    // エンディングダイアログ
    this._startDialog('ending_begin');
    this.time.delayedCall(3000, () => {
      SaveManager.save();
      this.cameras.main.fade(1000, 0, 0, 0, false, (cam, prog) => {
        if (prog >= 1) {
          this.scene.stop('HUD');
          this.scene.stop('Dialog');
          this.scene.start('Ending', { endingId: endingId || 'normal' });
        }
      });
    });
  }

  // ---- ポーズメニュー ----
  _openPauseMenu() {
    if (DialogSystem.isActive()) return;
    this.setPaused(true);
    if (!this.scene.isActive('PauseMenu')) {
      this.scene.launch('PauseMenu');
    }
    AudioManager.playSFX('menu_select');
  }

  // ---- ワールドマップ ----
  _openWorldMap() {
    if (DialogSystem.isActive()) return;
    this.setPaused(true);
    if (!this.scene.isActive('WorldMap')) {
      this.scene.launch('WorldMap');
    }
    AudioManager.playSFX('menu_select');
  }

  // ---- 一時停止制御 ----
  setPaused(paused) {
    this._paused = paused;
    if (paused) {
      this.player.setVelocity(0, 0);
    }
  }

  // ---- メッセージ表示 ----
  _showAreaMessage(text) {
    if (this._msgText) { this._msgText.destroy(); this._msgText = null; }
    this._msgText = this.add.text(
      GameConfig.WIDTH / 2, GameConfig.HEIGHT / 2 - 40, text,
      { ...GameConfig.FONT.PRIMARY, stroke: '#000000', strokeThickness: 3 }
    );
    this._msgText.setOrigin(0.5).setScrollFactor(0).setDepth(GameConfig.DEPTH.OVERLAY);
    this.tweens.add({
      targets: this._msgText, alpha: 0, y: GameConfig.HEIGHT / 2 - 70,
      delay: 1500, duration: 800,
      onComplete: () => { if (this._msgText) { this._msgText.destroy(); this._msgText = null; } },
    });
  }

  shutdown() {
    EventBus.off(EV.GAME_OVER, null, this);
    EventBus.off(EV.GAME_CLEAR, null, this);
  }
}

// shade_mage の簡易実装（ShadeWarrior ベース、遠距離攻撃付き）
class ShadeMage extends BaseEnemy {
  constructor(scene, tileX, tileY) {
    super(scene, tileX, tileY, 'shade_mage');
    this.projectileTimer = 0;
  }

  _ai(delta, player, dx, dy, dist) {
    this.projectileTimer = Math.max(0, this.projectileTimer - delta);

    // 近づきすぎたら逃げる
    if (dist < EnemyData.shade_mage.fleeRange) {
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.setVelocity(-dx / len * this.spd, -dy / len * this.spd);
      this.state = 'chase';
      return;
    }

    if (dist < this.data_.detectionRange) {
      this.state = 'attack';
      this.setVelocity(0, 0);

      if (this.attackCooldownTimer <= 0 && dist < this.data_.attackRange) {
        this.attackCooldownTimer = this.data_.attackCooldown;
        this._fireProjectile(player, dx, dy);
      }
    } else {
      super._patrol(delta);
    }
  }

  _fireProjectile(player, dx, dy) {
    if (!this.scene.enemyProjectiles) return;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const proj = new Projectile(
      this.scene, this.x, this.y, 'enemy',
      { x: dx / len, y: dy / len },
      'enemy',
      EnemyData.shade_mage.atk
    );
    this.scene.enemyProjectiles.add(proj);
    AudioManager.playSFX('magic');
  }
}
