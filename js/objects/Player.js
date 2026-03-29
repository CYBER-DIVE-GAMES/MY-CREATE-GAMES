// ============================================================
// Player - プレイヤーキャラクタークラス
// ============================================================
class Player extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(GameConfig.DEPTH.PLAYER);
    this.setCollideWorldBounds(true);

    const C = GameConfig.PLAYER;
    const p = GameState.player;

    this.hp    = p.hp;
    this.maxHp = p.maxHp;
    this.mp    = p.mp;
    this.maxMp = p.maxMp;
    this.atk   = p.atk;
    this.def   = p.def;
    this.spd   = p.spd;

    // 状態管理
    this.state        = 'idle';  // idle/moving/attacking/rolling/casting/hit/dead
    this.facing       = { x: 1, y: 0 };
    this.comboCount   = 0;
    this.comboTimer   = 0;
    this.invincible   = false;
    this.invincTimer  = 0;
    this.attackCooldownTimer = 0;
    this.heavyCooldownTimer  = 0;
    this.magicCooldownTimer  = 0;
    this.rollCooldownTimer   = 0;
    this.hitStunTimer  = 0;

    // ロール
    this.rollVelX = 0;
    this.rollVelY = 0;
    this.rollTimer = 0;

    // 攻撃ヒットボックス (内部管理)
    this.attackHitbox  = null;
    this.attackHitActive = false;
    this.attackHitTimer  = 0;

    // MP自動回復タイマー
    this.mpRegenTimer = 0;

    // 経験値通知用
    this._lastLevel = p.level;

    // 物理ボディのサイズ調整
    this.setBodySize(22, 30, true);
  }

  update(cursors, keys, delta) {
    if (this.state === 'dead') return;
    if (!delta) delta = 16;

    // タイマー更新
    this.attackCooldownTimer  = Math.max(0, this.attackCooldownTimer  - delta);
    this.heavyCooldownTimer   = Math.max(0, this.heavyCooldownTimer   - delta);
    this.magicCooldownTimer   = Math.max(0, this.magicCooldownTimer   - delta);
    this.rollCooldownTimer    = Math.max(0, this.rollCooldownTimer    - delta);
    this.hitStunTimer         = Math.max(0, this.hitStunTimer         - delta);
    this.attackHitTimer       = Math.max(0, this.attackHitTimer       - delta);
    this.comboTimer           = Math.max(0, this.comboTimer           - delta);
    if (this.comboTimer <= 0) this.comboCount = 0;

    if (this.invincible) {
      this.invincTimer -= delta;
      if (this.invincTimer <= 0) { this.invincible = false; this.clearTint(); }
      else this.setAlpha(Math.sin(this.invincTimer * 0.04) > 0 ? 1 : 0.4);
    }

    // 攻撃ヒットボックス管理
    if (this.attackHitActive && this.attackHitTimer <= 0) {
      this.attackHitActive = false;
    }

    // MP自動回復（毎秒2）
    this.mpRegenTimer += delta;
    if (this.mpRegenTimer >= 500) {
      this.mpRegenTimer = 0;
      if (GameState.player.mp < GameState.player.maxMp) {
        GameState.setMp(GameState.player.mp + 1);
      }
    }

    // ヒットスタン中は移動のみ受け付けない
    if (this.hitStunTimer > 0) return;

    // ロール中
    if (this.state === 'rolling') {
      this.rollTimer -= delta;
      this.setVelocity(this.rollVelX, this.rollVelY);
      if (this.rollTimer <= 0) {
        this.state = 'idle';
        this.setVelocity(0, 0);
      }
      return;
    }

    // 攻撃・キャスト中は移動制限
    if (this.state === 'attacking' || this.state === 'heavy_attacking' || this.state === 'casting') return;

    this._handleMovement(cursors, keys, delta);
    this._handleActions(keys, delta);
  }

  _handleMovement(cursors, keys, delta) {
    let vx = 0, vy = 0;
    const spd = this.spd;

    if (cursors.left.isDown  || keys.A.isDown) vx -= spd;
    if (cursors.right.isDown || keys.D.isDown) vx += spd;
    if (cursors.up.isDown    || keys.W.isDown) vy -= spd;
    if (cursors.down.isDown  || keys.S.isDown) vy += spd;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.state = 'moving';
      if (vx !== 0 || vy !== 0) {
        this.facing.x = vx !== 0 ? Math.sign(vx) : this.facing.x;
        this.facing.y = vy !== 0 ? Math.sign(vy) : this.facing.y;
      }
      this.setFlipX(this.facing.x < 0);
    } else {
      this.state = 'idle';
    }
  }

  _handleActions(keys, delta) {
    // ロール (Shift)
    if (Phaser.Input.Keyboard.JustDown(keys.SHIFT) && this.rollCooldownTimer <= 0) {
      this._doRoll();
      return;
    }

    // 魔法 (C)
    if (Phaser.Input.Keyboard.JustDown(keys.C) && this.magicCooldownTimer <= 0) {
      if (GameState.player.mp >= GameConfig.PLAYER.MAGIC_COST) this._castMagic();
    }

    // 強攻撃 (X)
    if (Phaser.Input.Keyboard.JustDown(keys.X) && this.heavyCooldownTimer <= 0) {
      this._heavyAttack();
      return;
    }

    // 通常攻撃 (Z)
    if (Phaser.Input.Keyboard.JustDown(keys.Z) && this.attackCooldownTimer <= 0) {
      this._lightAttack();
      return;
    }
  }

  _lightAttack() {
    this.state = 'attacking';
    this.setVelocity(0, 0);

    const comboIdx = this.comboCount % 3;
    this.comboCount++;
    this.comboTimer = GameConfig.PLAYER.COMBO_WINDOW;

    // ヒットボックスを前方に生成
    const range  = GameConfig.PLAYER.ATTACK_RANGE;
    this.attackHitboxX = this.x + this.facing.x * range;
    this.attackHitboxY = this.y + this.facing.y * range;
    this.attackHitRadius = 36;
    this.attackHitActive = true;
    this.attackHitTimer  = 200;
    this.attackComboIdx  = comboIdx;
    this.isHeavyAttack   = false;
    this.isMagicAttack   = false;

    const cooldown = GameConfig.PLAYER.ATTACK_COOLDOWN;
    this.attackCooldownTimer = cooldown;

    // 攻撃モーション終了
    this.scene.time.delayedCall(180, () => {
      if (this.state === 'attacking') this.state = 'idle';
    });

    // 視覚フィードバック: 短い前方ダッシュ
    this.scene.tweens.add({
      targets:  this,
      x:        this.x + this.facing.x * 8,
      y:        this.y + this.facing.y * 8,
      duration: 60,
      yoyo:     true,
    });

    AudioManager.playSFX('attack');

    // コンボフラッシュ
    if (comboIdx === 2) {
      AudioManager.playSFX('combo');
      this.attackHitRadius = 60;
    }
  }

  _heavyAttack() {
    this.state = 'heavy_attacking';
    this.setVelocity(0, 0);
    this.attackHitboxX = this.x + this.facing.x * GameConfig.PLAYER.HEAVY_RANGE;
    this.attackHitboxY = this.y + this.facing.y * GameConfig.PLAYER.HEAVY_RANGE;
    this.attackHitRadius = 52;
    this.attackHitActive = true;
    this.attackHitTimer  = 350;
    this.isHeavyAttack   = true;
    this.isMagicAttack   = false;

    this.heavyCooldownTimer  = GameConfig.PLAYER.HEAVY_COOLDOWN;
    this.attackCooldownTimer = GameConfig.PLAYER.HEAVY_COOLDOWN;

    // 前方ダッシュ
    this.scene.tweens.add({
      targets:  this,
      x:        this.x + this.facing.x * 20,
      y:        this.y + this.facing.y * 20,
      duration: 120,
      yoyo:     true,
    });

    this.scene.time.delayedCall(380, () => {
      if (this.state === 'heavy_attacking') this.state = 'idle';
    });

    AudioManager.playSFX('heavy_attack');
    this.setTintFill(0xffcc00);
    this.scene.time.delayedCall(180, () => { if (this.active) this.clearTint(); });
  }

  _castMagic() {
    this.state = 'casting';
    this.setVelocity(0, 0);
    GameState.useMp(GameConfig.PLAYER.MAGIC_COST);

    this.attackHitboxX  = this.x + this.facing.x * 40;
    this.attackHitboxY  = this.y + this.facing.y * 40;
    this.attackHitRadius = 28;
    this.attackHitActive = true;
    this.attackHitTimer  = 600;
    this.isHeavyAttack   = false;
    this.isMagicAttack   = true;

    this.magicCooldownTimer  = GameConfig.PLAYER.MAGIC_COOLDOWN;
    this.attackCooldownTimer = GameConfig.PLAYER.MAGIC_COOLDOWN;

    // 魔法弾を生成
    const proj = new Projectile(this.scene, this.x, this.y, 'magic',
      { x: this.facing.x, y: this.facing.y }, 'player',
      GameState.player.atk * GameConfig.PLAYER.MAGIC_DAMAGE_MULTIPLIER);
    this.scene.playerProjectiles.add(proj);

    this.scene.time.delayedCall(320, () => {
      if (this.state === 'casting') this.state = 'idle';
    });

    AudioManager.playSFX('magic');
    this.setTintFill(0x8888ff);
    this.scene.time.delayedCall(200, () => { if (this.active) this.clearTint(); });
  }

  _doRoll() {
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    let dx = vx !== 0 ? Math.sign(vx) : this.facing.x;
    let dy = vy !== 0 ? Math.sign(vy) : this.facing.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len; dy /= len;

    this.state        = 'rolling';
    this.rollVelX     = dx * GameConfig.PLAYER.ROLL_SPEED;
    this.rollVelY     = dy * GameConfig.PLAYER.ROLL_SPEED;
    this.rollTimer    = GameConfig.PLAYER.ROLL_DURATION;
    this.invincible   = true;
    this.invincTimer  = GameConfig.PLAYER.INV_FRAMES;
    this.rollCooldownTimer = GameConfig.PLAYER.ROLL_COOLDOWN;

    AudioManager.playSFX('dodge');
    this.setTintFill(0xaaaaff);
    this.scene.time.delayedCall(200, () => { if (this.active) this.clearTint(); });
  }

  takeDamage(amount) {
    if (this.invincible || this.state === 'dead' || this.state === 'rolling') return;
    const actual = Math.max(1, amount);
    GameState.setHp(GameState.player.hp - actual);
    this.hp = GameState.player.hp;

    CombatSystem.hitFlash(this, 0xff2222, 200);
    this.hitStunTimer = GameConfig.PLAYER.HIT_STUN;
    this.invincible   = true;
    this.invincTimer  = GameConfig.PLAYER.INV_FRAMES;
    this.state        = 'hit';

    this.scene.time.delayedCall(GameConfig.PLAYER.HIT_STUN, () => {
      if (this.active && this.state === 'hit') this.state = 'idle';
    });

    // 画面揺れ
    this.scene.cameras.main.shake(150, 0.008);
    AudioManager.playSFX('player_hit');

    if (GameState.player.hp <= 0) this._die();
  }

  _die() {
    this.state = 'dead';
    this.setVelocity(0, 0);
    this.setTintFill(0xff0000);

    this.scene.tweens.add({
      targets:  this,
      alpha:    0,
      duration: 1200,
      onComplete: () => {
        EventBus.emit(EV.GAME_OVER);
      },
    });
  }

  // 攻撃ヒットボックスが特定座標に当たっているか
  isHitting(targetX, targetY) {
    if (!this.attackHitActive) return false;
    const dx = this.attackHitboxX - targetX;
    const dy = this.attackHitboxY - targetY;
    return (dx * dx + dy * dy) < this.attackHitRadius * this.attackHitRadius;
  }

  syncFromGameState() {
    const p = GameState.player;
    this.hp    = p.hp;
    this.maxHp = p.maxHp;
    this.mp    = p.mp;
    this.maxMp = p.maxMp;
    this.atk   = p.atk;
    this.def   = p.def;
  }
}
