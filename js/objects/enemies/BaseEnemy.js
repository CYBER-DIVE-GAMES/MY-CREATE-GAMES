// ============================================================
// BaseEnemy - 敵の基底クラス
// ============================================================
class BaseEnemy extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, tileX, tileY, enemyType) {
    const data = EnemyData[enemyType];
    const ts   = GameConfig.TILE_SIZE;
    super(scene, (tileX + 0.5) * ts, (tileY + 0.5) * ts, data.textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(GameConfig.DEPTH.ENEMIES);
    this.setScale(data.scale || 1);

    this.enemyType  = enemyType;
    this.data_      = data;
    this.hp         = data.hp;
    this.maxHp      = data.hp;
    this.atk        = data.atk;
    this.def        = data.def;
    this.spd        = data.spd;
    this.xp         = data.xp;
    this.gold       = data.gold;
    this.state      = 'idle';

    this.attackCooldownTimer = 0;
    this.attackActive        = false;
    this.attackActiveTimer   = 0;
    this.hitStunTimer        = 0;
    this.patrolTimer         = 0;
    this.patrolVelX          = 0;
    this.patrolVelY          = 0;
    this.patrolDir           = Math.random() * Math.PI * 2;

    // HPバー
    this._hpBarBg  = null;
    this._hpBarFg  = null;
    this._hpBarVisible = false;
    this._hpBarTimer   = 0;

    // ヒット管理（プレイヤーの単一攻撃で複数回当たらないように）
    this._lastHitAttackId = -1;

    this.setBodySize(
      Math.floor(this.width * 0.7),
      Math.floor(this.height * 0.7),
      true
    );
  }

  update(delta, player) {
    if (this.state === 'dead') return;
    if (!player || !player.active) return;

    this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - delta);
    this.hitStunTimer        = Math.max(0, this.hitStunTimer        - delta);
    this.attackActiveTimer   = Math.max(0, this.attackActiveTimer   - delta);
    if (this.attackActiveTimer <= 0) this.attackActive = false;

    this._updateHpBar();

    if (this.hitStunTimer > 0) return;

    const dx   = player.x - this.x;
    const dy   = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    this._ai(delta, player, dx, dy, dist);
  }

  _ai(delta, player, dx, dy, dist) {
    if (dist < this.data_.detectionRange) {
      if (dist < this.data_.attackRange) {
        this._doAttack(player, dx, dy);
      } else {
        this._chasePlayer(dx, dy);
      }
    } else {
      this._patrol(delta);
    }
  }

  _chasePlayer(dx, dy) {
    this.state = 'chase';
    const len  = Math.sqrt(dx * dx + dy * dy) || 1;
    this.setVelocity(dx / len * this.spd, dy / len * this.spd);
    this.setFlipX(dx < 0);
  }

  _doAttack(player, dx, dy) {
    this.state = 'attack';
    this.setVelocity(0, 0);

    if (this.attackCooldownTimer > 0) return;

    this.attackCooldownTimer = this.data_.attackCooldown;
    this.attackActive        = true;
    this.attackActiveTimer   = this.data_.attackDuration || 300;

    // ヒットチェックは FieldScene 側で行う
  }

  _patrol(delta) {
    this.state = 'idle';
    this.patrolTimer -= delta;
    if (this.patrolTimer <= 0) {
      this.patrolTimer = 1500 + Math.random() * 1500;
      const angle      = Math.random() * Math.PI * 2;
      const speed      = this.spd * 0.35;
      this.patrolVelX  = Math.cos(angle) * speed;
      this.patrolVelY  = Math.sin(angle) * speed;
      // 40%の確率で停止
      if (Math.random() < 0.4) { this.patrolVelX = 0; this.patrolVelY = 0; }
    }
    this.setVelocity(this.patrolVelX, this.patrolVelY);
  }

  onHit() {
    this.hitStunTimer = this.data_.hitStun || 200;
    CombatSystem.hitFlash(this, 0xff4444, 150);
    this._showHpBar();
  }

  takeDamage(amount) {
    if (this.state === 'dead') return 0;
    const actual = Math.max(1, amount);
    this.hp = Math.max(0, this.hp - actual);
    this._showHpBar();
    CombatSystem.hitFlash(this, 0xff4444, 150);
    if (this.hp <= 0) { this.die(); return actual; }
    this.onHit();
    return actual;
  }

  die() {
    if (this.state === 'dead') return;
    this.state = 'dead';
    this.setVelocity(0, 0);
    this.disableBody(true, false);

    // 報酬
    GameState.addGold(this.gold);
    LevelSystem.addExp(this.xp);
    GameState.player.kills++;

    // ドロップ
    if (this.data_.drops) {
      this.data_.drops.forEach(drop => {
        if (Math.random() < drop.chance) GameState.addItem(drop.id);
      });
    }

    EventBus.emit(EV.ENEMY_KILL, this.data_);

    // 死亡エフェクト
    CombatSystem.deathEffect(this.scene, this.x, this.y, this.data_.deathEffect || 'small');
    AudioManager.playSFX('enemy_die');

    // HPバー削除
    this._destroyHpBar();

    // フェードアウト
    this.scene.tweens.add({
      targets:  this,
      alpha:    0,
      scaleX:   1.5,
      scaleY:   1.5,
      duration: 500,
      onComplete: () => this.destroy(),
    });
  }

  // ---- HPバー ----
  _showHpBar() {
    this._hpBarVisible = true;
    this._hpBarTimer   = 3000;
    if (!this._hpBarBg) {
      const w = 40, h = 5;
      this._hpBarBg = this.scene.add.graphics();
      this._hpBarBg.fillStyle(GameConfig.COLORS.HP_BAR_BG);
      this._hpBarBg.fillRect(-w / 2, -this.displayHeight / 2 - 10, w, h);
      this._hpBarBg.setDepth(GameConfig.DEPTH.UI);

      this._hpBarFg = this.scene.add.graphics();
      this._hpBarFg.setDepth(GameConfig.DEPTH.UI + 1);
    }
    this._updateHpBarGraphic();
  }

  _updateHpBar() {
    if (!this._hpBarVisible) return;
    this._hpBarTimer -= 16;
    if (this._hpBarTimer <= 0) {
      this._destroyHpBar();
      return;
    }
    if (this._hpBarBg) {
      this._hpBarBg.x = this.x;
      this._hpBarBg.y = this.y;
    }
    if (this._hpBarFg) {
      this._hpBarFg.x = this.x;
      this._hpBarFg.y = this.y;
      this._updateHpBarGraphic();
    }
  }

  _updateHpBarGraphic() {
    if (!this._hpBarFg) return;
    const w   = 40, h = 5;
    const pct = this.hp / this.maxHp;
    this._hpBarFg.clear();
    this._hpBarFg.fillStyle(
      pct > 0.5 ? GameConfig.COLORS.HP_BAR : (pct > 0.25 ? 0xff8800 : 0xff0000)
    );
    this._hpBarFg.fillRect(-w / 2, -this.displayHeight / 2 - 10, w * pct, h);
  }

  _destroyHpBar() {
    this._hpBarVisible = false;
    if (this._hpBarBg) { this._hpBarBg.destroy(); this._hpBarBg = null; }
    if (this._hpBarFg) { this._hpBarFg.destroy(); this._hpBarFg = null; }
  }

  destroy(fromScene) {
    this._destroyHpBar();
    super.destroy(fromScene);
  }
}
