// ============================================================
// ShadeWarrior - 影の戦士
// ============================================================
class ShadeWarrior extends BaseEnemy {
  constructor(scene, tileX, tileY) {
    super(scene, tileX, tileY, 'shade_warrior');
    this.chargeTimer   = 0;
    this.chargeCooldown = 0;
    this.isCharging    = false;
  }

  _ai(delta, player, dx, dy, dist) {
    // チャージ攻撃管理
    this.chargeCooldown = Math.max(0, this.chargeCooldown - delta);

    // HP 30% 以下でチャージ発動
    if (this.hp / this.maxHp < 0.3 && this.chargeCooldown <= 0 && dist < 300) {
      this._startCharge(dx, dy);
      return;
    }

    if (this.isCharging) {
      this.chargeTimer -= delta;
      if (this.chargeTimer <= 0) {
        this.isCharging = false;
        this.setVelocity(0, 0);
        this.state = 'idle';
      }
      return;
    }

    super._ai(delta, player, dx, dy, dist);
  }

  _startCharge(dx, dy) {
    this.isCharging     = true;
    this.chargeTimer    = 600;
    this.chargeCooldown = EnemyData.shade_warrior.chargeCooldown;
    this.state          = 'attack';

    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const spd = EnemyData.shade_warrior.chargeSpeed;
    this.setVelocity(dx / len * spd, dy / len * spd);

    // 攻撃フラグ（チャージ中は常にダメージ判定）
    this.attackActive      = true;
    this.attackActiveTimer = 600;

    CombatSystem.hitFlash(this, 0xff8800, 300);
    AudioManager.playSFX('heavy_attack');
  }
}
