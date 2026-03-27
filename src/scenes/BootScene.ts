import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // プログレスバー
    const bar = this.add.graphics();
    const progress = this.add.graphics();

    this.load.on('progress', (value: number) => {
      progress.clear();
      progress.fillStyle(0xffffff, 1);
      progress.fillRect(170, 465, 200 * value, 30);
    });

    this.load.on('complete', () => {
      progress.destroy();
      bar.destroy();
    });

    bar.fillStyle(0x222222, 1);
    bar.fillRect(160, 460, 220, 40);
    this.add.text(270, 420, 'Loading...', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // プレイヤースプライトシート（48x48 × 3列4行 = 12フレーム）
    this.load.spritesheet('player', 'assets/images/player.png', {
      frameWidth: 48,
      frameHeight: 48,
    });
    // ステージ背景
    this.load.image('haikei', 'assets/images/haikei.png');

    // 敵スプライトシート（4フレーム × 48×48px）
    const enemyFrame = { frameWidth: 48, frameHeight: 48 };
    this.load.spritesheet('kitunebi_sheet', 'assets/images/kitunebi_sheet.png', enemyFrame);
    this.load.spritesheet('musha_sheet',    'assets/images/musha_sheet.png',    enemyFrame);
    this.load.spritesheet('otome_sheet',    'assets/images/otome_sheet.png',    enemyFrame);
  }

  create(): void {
    this.scene.start('TitleScene');
  }
}
