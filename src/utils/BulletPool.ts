import Phaser from 'phaser';

export interface BulletData {
  vx: number;
  vy: number;
  damage: number;
  owner: 'player' | 'enemy';
}

export class BulletPool {
  private group: Phaser.Physics.Arcade.Group;
  // プレイヤー弾の斬撃ビジュアル: Arc → Image
  private visualMap = new Map<Phaser.GameObjects.Arc, Phaser.GameObjects.Image>();

  constructor(scene: Phaser.Scene) {
    this.group = scene.physics.add.group({
      maxSize: 500,
      runChildUpdate: false,
    });
  }

  get physicsGroup(): Phaser.Physics.Arcade.Group {
    return this.group;
  }

  fire(
    scene: Phaser.Scene,
    x: number,
    y: number,
    vx: number,
    vy: number,
    damage: number,
    owner: 'player' | 'enemy',
    color: number = 0xffffff,
    radius: number = 5,
    useZangeki: boolean = false
  ): Phaser.GameObjects.Arc | null {
    // 既存の非アクティブな弾を再利用
    let bullet = this.group.getFirstDead(false) as Phaser.GameObjects.Arc | null;

    if (!bullet) {
      bullet = scene.add.circle(x, y, radius, color);
      this.group.add(bullet, true);
    } else {
      bullet.setActive(true).setPosition(x, y);
      bullet.setRadius(radius);
      bullet.setFillStyle(color);
    }

    // プレイヤー主弾は透明にして斬撃ビジュアルを重ねる
    if (useZangeki && scene.textures.exists('zangeki')) {
      bullet.setAlpha(0);
      let img = this.visualMap.get(bullet);
      if (!img) {
        img = scene.add.image(x, y, 'zangeki').setDepth(9);
        this.visualMap.set(bullet, img);
      } else {
        img.setActive(true).setVisible(true).setPosition(x, y);
      }
      // 飛翔角度に合わせて回転（上方向がデフォルト = -90°）
      img.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
      img.setScale(1.0);
    } else {
      bullet.setAlpha(1);
      // 既存のビジュアルがあれば非表示
      const existing = this.visualMap.get(bullet);
      if (existing) existing.setVisible(false).setActive(false);
    }

    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.reset(x, y);
    body.setVelocity(vx, vy);
    body.enable = true;

    bullet.setData('damage', damage);
    bullet.setData('owner', owner);
    bullet.setData('pierceCount', null);
    bullet.setData('reflectsLeft', null);
    bullet.setData('onHitExplosion', null);

    return bullet;
  }

  killBullet(bullet: Phaser.GameObjects.Arc): void {
    bullet.setActive(false).setVisible(false);
    const body = bullet.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.enable = false;
    // 斬撃ビジュアルも非表示
    const img = this.visualMap.get(bullet);
    if (img) img.setVisible(false).setActive(false);
  }

  killAllBullets(): void {
    this.group.getChildren().forEach((b) => {
      this.killBullet(b as Phaser.GameObjects.Arc);
    });
  }

  update(): void {
    this.group.getChildren().forEach((b) => {
      const bullet = b as Phaser.GameObjects.Arc;
      if (!bullet.active) return;
      const { x, y } = bullet;
      if (x < -50 || x > 590 || y < -50 || y > 1010) {
        this.killBullet(bullet);
        return;
      }
      // 斬撃ビジュアルを弾に追従
      const img = this.visualMap.get(bullet);
      if (img?.active) img.setPosition(x, y);
    });
  }
}
