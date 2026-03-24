import Phaser from 'phaser';

// W1-1: 石灯籠（縦長の矩形・直線降下）
// 仕様書「障害物1種」に対応
export class ObstacleSystem {
  private scene: Phaser.Scene;
  obstacles: Phaser.GameObjects.Container[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 8000; // ms

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  update(delta: number, elapsed: number): void {
    // 時間が経つほど頻繁に出現（最短3秒）
    this.spawnInterval = Math.max(3000, 8000 - elapsed * 8);

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnStoneLantern();
    }

    // 更新と廃棄
    this.obstacles = this.obstacles.filter((obs) => {
      if (!obs.active) return false;
      if (obs.y > 1040) {
        obs.destroy();
        return false;
      }
      return true;
    });
  }

  // W1-1: 石灯籠 - 縦長の矩形、直線降下
  private spawnStoneLantern(): void {
    const { width } = this.scene.scale;
    const x = Phaser.Math.Between(50, width - 50);
    const speed = Phaser.Math.Between(90, 140);

    // 石灯籠の外見をプログラム描画
    // 基台（下部）
    const base  = this.scene.add.rectangle(0, 20, 38, 14, 0x666655);
    // 胴体（細長い縦部分）
    const body  = this.scene.add.rectangle(0, -4, 20, 40, 0x777766);
    // 笠（上部）
    const cap   = this.scene.add.rectangle(0, -26, 36, 12, 0x555544);
    // 頂部（小さい丸）
    const top   = this.scene.add.circle(0, -36, 6, 0x666655);
    // 灯り（内側の光）
    const light = this.scene.add.rectangle(0, -4, 12, 24, 0x443322, 0.6);

    const container = this.scene.add.container(x, -60, [base, body, cap, top, light]);
    container.setDepth(6);

    this.scene.physics.add.existing(container);
    const physBody = container.body as Phaser.Physics.Arcade.Body;
    physBody.setVelocityY(speed);
    physBody.setImmovable(true);
    // 当たり判定は胴体サイズに合わせる
    physBody.setSize(38, 80);
    physBody.setOffset(-19, -40);

    this.obstacles.push(container);
  }

  getBounds(obs: Phaser.GameObjects.Container): { left: number; right: number; top: number; bottom: number } {
    return {
      left:   obs.x - 19,
      right:  obs.x + 19,
      top:    obs.y - 40,
      bottom: obs.y + 27,
    };
  }
}
