// ============================================================
// Projectile - 魔法弾・投射物
// ============================================================
class Projectile extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y, type, direction, owner, damage) {
    const textureKey = type === 'magic' ? 'proj_magic'
      : type === 'enemy_boss'           ? 'proj_enemy_boss'
      :                                   'proj_enemy';
    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(GameConfig.DEPTH.PROJECTILES);

    this.projType  = type;
    this.owner     = owner;
    this.damage    = damage;
    this.lifetime  = 0;
    this.maxLife   = 2800;

    const speed = type === 'magic' ? 340 : type === 'enemy_boss' ? 210 : 240;
    const len   = Math.sqrt(direction.x * direction.x + direction.y * direction.y) || 1;
    this.setVelocity(direction.x / len * speed, direction.y / len * speed);

    // 軌跡エフェクト
    this._trailTimer = 0;
  }

  update(delta) {
    this.lifetime += delta;
    if (this.lifetime >= this.maxLife) {
      this.destroy();
      return;
    }

    // 軌跡パーティクル
    this._trailTimer += delta;
    if (this._trailTimer >= 50) {
      this._trailTimer = 0;
      this._emitTrail();
    }
  }

  _emitTrail() {
    if (!this.scene || !this.active) return;
    const color = this.projType === 'magic' ? 0x4444ff : 0xff2020;
    const gfx   = this.scene.add.graphics();
    gfx.fillStyle(color, 0.6);
    gfx.fillCircle(0, 0, 4);
    gfx.setPosition(this.x, this.y);
    gfx.setDepth(GameConfig.DEPTH.EFFECTS);

    this.scene.tweens.add({
      targets:  gfx,
      alpha:    0,
      scaleX:   0.2,
      scaleY:   0.2,
      duration: 250,
      onComplete: () => gfx.destroy(),
    });
  }

  onHitWall() {
    const color = this.projType === 'magic' ? 0x4444ff : 0xff2020;
    CombatSystem.deathEffect(this.scene, this.x, this.y, 'small');
    this.destroy();
  }
}
