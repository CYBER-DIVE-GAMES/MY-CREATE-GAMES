// ============================================================
// AncientBoss - 古代の守護者（ボス）
// ============================================================
class AncientBoss extends BaseEnemy {
  constructor(scene, tileX, tileY) {
    super(scene, tileX, tileY, 'ancient_boss');
    this.phase           = 1;
    this.summonTimer     = 0;
    this.bulletTimer     = 0;
    this.roarTimer       = 0;
    this._phaseTriggered = false;
    this._activated      = false;

    // ボス用大型 HP バー（上部に固定）
    this._bossHpBar = null;
    this._bossHpText = null;
  }

  activate(scene) {
    this._activated = true;
    this._showBossHpBar(scene);
    scene.cameras.main.shake(600, 0.02);
    AudioManager.playBGM('boss');
  }

  _ai(delta, player, dx, dy, dist) {
    if (!this._activated) return;

    this.summonTimer  = Math.max(0, this.summonTimer  - delta);
    this.bulletTimer  = Math.max(0, this.bulletTimer  - delta);
    this.roarTimer    = Math.max(0, this.roarTimer    - delta);

    // フェーズ2移行
    if (!this._phaseTriggered && this.hp / this.maxHp < 0.5) {
      this._enterPhase2();
    }

    if (this.phase === 1) this._phase1Ai(delta, player, dx, dy, dist);
    else                  this._phase2Ai(delta, player, dx, dy, dist);

    this._updateBossHpBar();
  }

  _phase1Ai(delta, player, dx, dy, dist) {
    // ゆっくり追いかけて近距離攻撃
    if (dist < this.data_.attackRange) {
      this.state = 'attack';
      this.setVelocity(0, 0);
      if (this.attackCooldownTimer <= 0) {
        this.attackCooldownTimer = this.data_.attackCooldown;
        this.attackActive        = true;
        this.attackActiveTimer   = this.data_.attackDuration;
      }
    } else if (dist < this.data_.detectionRange) {
      this.state = 'chase';
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      this.setVelocity(dx / len * this.spd, dy / len * this.spd);
      this.setFlipX(dx < 0);
    }

    // 定期的にザコ召喚
    if (this.summonTimer <= 0) {
      this.summonTimer = EnemyData.ancient_boss.summonCooldown;
      this._summonMinions();
    }
  }

  _phase2Ai(delta, player, dx, dy, dist) {
    // 速くなり、弾を撃つ
    this.spd = EnemyData.ancient_boss.spd * 1.6;

    if (dist < this.data_.attackRange) {
      this.state = 'attack';
      this.setVelocity(0, 0);
      if (this.attackCooldownTimer <= 0) {
        this.attackCooldownTimer = this.data_.attackCooldown * 0.7;
        this.attackActive        = true;
        this.attackActiveTimer   = this.data_.attackDuration;
      }
    } else if (dist < this.data_.detectionRange) {
      this._chasePlayer(dx, dy);
    }

    // 4方向弾
    if (this.bulletTimer <= 0) {
      this.bulletTimer = 3200;
      this._fireBullets();
    }
  }

  _enterPhase2() {
    this._phaseTriggered = true;
    this.phase           = 2;
    this.scene.cameras.main.shake(400, 0.015);
    CombatSystem.hitFlash(this, 0xff0000, 500);
    EventBus.emit(EV.BOSS_PHASE, 2);

    // フェーズ2視覚変化
    this.scene.tweens.add({
      targets:  this,
      scaleX:   1.2,
      scaleY:   1.2,
      duration: 400,
      yoyo:     true,
    });
  }

  _summonMinions() {
    if (!this.scene || !this.scene.enemies) return;
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r     = 80;
      const sx    = Math.floor((this.x + Math.cos(angle) * r) / GameConfig.TILE_SIZE);
      const sy    = Math.floor((this.y + Math.sin(angle) * r) / GameConfig.TILE_SIZE);
      const minion = new ShadeSmall(this.scene, sx, sy);
      this.scene.enemies.add(minion);
      this.scene.physics.add.collider(minion, this.scene.wallLayer);
    }
  }

  _fireBullets() {
    if (!this.scene || !this.scene.enemyProjectiles) return;
    const dirs = [
      { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
      { x: 0.707, y: 0.707 }, { x: -0.707, y: 0.707 },
      { x: 0.707, y: -0.707 }, { x: -0.707, y: -0.707 },
    ];
    dirs.forEach(d => {
      const proj = new Projectile(
        this.scene, this.x, this.y, 'enemy_boss', d, 'boss',
        Math.floor(EnemyData.ancient_boss.atk * 0.6)
      );
      this.scene.enemyProjectiles.add(proj);
    });
    AudioManager.playSFX('magic');
  }

  die() {
    AudioManager.playSFX('boss_die');
    this._destroyBossHpBar();
    super.die();
    GameState.setFlag('boss_defeated', true);

    // エンディングトリガーは FieldScene 側で処理
    this.scene.time.delayedCall(2000, () => {
      EventBus.emit(EV.GAME_CLEAR, 'normal');
    });
  }

  // ---- ボス用HPバー ----
  _showBossHpBar(scene) {
    const W = GameConfig.WIDTH, barW = 400, barH = 16;
    const bx = (W - barW) / 2, by = GameConfig.HEIGHT - 50;

    const cam    = scene.cameras.main;
    const sceneW = cam.width;
    const sceneH = cam.height;

    // HUD シーンの方がいいが、ここでは FieldScene の UI として描画
    this._bossHpBg = scene.add.graphics();
    this._bossHpBg.fillStyle(0x000000, 0.7);
    this._bossHpBg.fillRoundedRect(-barW / 2 - 2, -2, barW + 4, barH + 4, 4);
    this._bossHpBg.setScrollFactor(0);
    this._bossHpBg.setDepth(GameConfig.DEPTH.OVERLAY);
    this._bossHpBg.setPosition(W / 2, sceneH - 48);

    this._bossHpBar = scene.add.graphics();
    this._bossHpBar.setScrollFactor(0);
    this._bossHpBar.setDepth(GameConfig.DEPTH.OVERLAY + 1);
    this._bossHpBar.setPosition(W / 2, sceneH - 48);

    this._bossNameText = scene.add.text(W / 2, sceneH - 70,
      `${EnemyData.ancient_boss.name}`,
      { ...GameConfig.FONT.LARGE, color: '#cc6644', stroke: '#000000', strokeThickness: 3 }
    );
    this._bossNameText.setOrigin(0.5, 0.5);
    this._bossNameText.setScrollFactor(0);
    this._bossNameText.setDepth(GameConfig.DEPTH.OVERLAY + 1);

    this._bossBarsW = barW;
    this._bossBarsH = barH;
    this._updateBossHpBar();
  }

  _updateBossHpBar() {
    if (!this._bossHpBar) return;
    const barW = this._bossBarsW;
    const barH = this._bossBarsH;
    const pct  = Math.max(0, this.hp / this.maxHp);
    this._bossHpBar.clear();
    const col  = pct > 0.5 ? 0xcc3300 : (pct > 0.25 ? 0xff6600 : 0xff0000);
    this._bossHpBar.fillStyle(col);
    this._bossHpBar.fillRoundedRect(-barW / 2, -barH / 2, barW * pct, barH, 3);
  }

  _destroyBossHpBar() {
    if (this._bossHpBg)    { this._bossHpBg.destroy();    this._bossHpBg    = null; }
    if (this._bossHpBar)   { this._bossHpBar.destroy();   this._bossHpBar   = null; }
    if (this._bossNameText){ this._bossNameText.destroy(); this._bossNameText = null; }
  }

  destroy(fromScene) {
    this._destroyBossHpBar();
    super.destroy(fromScene);
  }
}
