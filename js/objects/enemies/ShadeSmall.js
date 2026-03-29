// ============================================================
// ShadeSmall - 小さな影（基本的な雑魚敵）
// ============================================================
class ShadeSmall extends BaseEnemy {
  constructor(scene, tileX, tileY) {
    super(scene, tileX, tileY, 'shade_small');
    this._floatTimer  = Math.random() * Math.PI * 2;
    this._baseY       = this.y;
  }

  update(delta, player) {
    super.update(delta, player);
    // 浮遊アニメーション
    this._floatTimer += delta * 0.003;
    if (this.state !== 'dead') {
      this.y = this._baseY + Math.sin(this._floatTimer) * 3;
      this._baseY = this.y - Math.sin(this._floatTimer) * 3;
    }
  }

  _patrol(delta) {
    this.state = 'idle';
    this.patrolTimer -= delta;
    if (this.patrolTimer <= 0) {
      this.patrolTimer = 800 + Math.random() * 800;
      const angle  = Math.random() * Math.PI * 2;
      const speed  = this.spd * 0.5;
      this.patrolVelX = Math.cos(angle) * speed;
      this.patrolVelY = Math.sin(angle) * speed;
    }
    this.setVelocity(this.patrolVelX, this.patrolVelY);
  }
}
