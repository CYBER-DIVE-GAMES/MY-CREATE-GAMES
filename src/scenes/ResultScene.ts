import Phaser from 'phaser';

export interface ResultData {
  stage: number;
  youkakuEarned: number;   // 今ランで獲得した妖核（クリアボーナス込み）
  level: number;
  elapsed: number;          // クリアタイム（秒）
}

export class ResultScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ResultScene' });
  }

  create(data: ResultData): void {
    const { width, height } = this.scale;
    const { stage, youkakuEarned, level, elapsed } = data;

    // 背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x050510);

    // 星
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 2), 0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.7));
    }

    // STAGE CLEAR テキスト（アニメ付き）
    const clearText = this.add.text(width / 2, 180, `STAGE ${stage} CLEAR!`, {
      fontSize: '42px',
      color: '#ffd700',
      stroke: '#ff8800',
      strokeThickness: 4,
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: clearText,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 600,
      ease: 'Back.Out',
    });

    // 区切り線
    this.add.rectangle(width / 2, 260, 400, 2, 0x443322).setOrigin(0.5).setAlpha(0.6);

    // 結果表示（順番に表示）
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = Math.floor(elapsed % 60).toString().padStart(2, '0');

    const rows: Array<{ label: string; value: string; color: string }> = [
      { label: 'クリアタイム',   value: `${m}:${s}`,                color: '#ffffff' },
      { label: '到達レベル',     value: `Lv. ${level}`,             color: '#88ffaa' },
      { label: '獲得妖核',       value: `${youkakuEarned} 個`,      color: '#cc88ff' },
    ];

    rows.forEach((row, i) => {
      const y = 320 + i * 70;
      const delay = 400 + i * 200;

      const label = this.add.text(120, y, row.label, {
        fontSize: '20px',
        color: '#aaaaaa',
      }).setOrigin(0, 0.5).setAlpha(0);

      const value = this.add.text(width - 100, y, row.value, {
        fontSize: '24px',
        color: row.color,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5).setAlpha(0);

      this.tweens.add({ targets: [label, value], alpha: 1, duration: 300, delay });
    });

    // 区切り線
    this.add.rectangle(width / 2, 545, 400, 2, 0x443322).setOrigin(0.5).setAlpha(0.6);

    // 次へのボタン
    this.time.delayedCall(1400, () => {
      const nextBtn = this.add.text(width / 2, 640, '【 次のステージへ 】', {
        fontSize: '26px',
        color: '#ffd700',
        backgroundColor: '#332200',
        padding: { x: 20, y: 12 },
      }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

      const titleBtn = this.add.text(width / 2, 720, '[ タイトルへ戻る ]', {
        fontSize: '20px',
        color: '#888888',
      }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

      this.tweens.add({ targets: [nextBtn, titleBtn], alpha: 1, duration: 400 });

      nextBtn.on('pointerover', () => nextBtn.setStyle({ color: '#ffffff' }));
      nextBtn.on('pointerout',  () => nextBtn.setStyle({ color: '#ffd700' }));
      nextBtn.on('pointerdown', () => {
        // フェーズ1ではステージ1のみ実装済み
        this.scene.start('StageScene', { stage: Math.min(stage + 1, 1) });
      });

      titleBtn.on('pointerover', () => titleBtn.setStyle({ color: '#ffffff' }));
      titleBtn.on('pointerout',  () => titleBtn.setStyle({ color: '#888888' }));
      titleBtn.on('pointerdown', () => this.scene.start('TitleScene'));
    });

    // 打ち上げ花火演出
    this.time.addEvent({
      delay: 300,
      repeat: 6,
      callback: () => {
        const fx = Phaser.Math.Between(80, width - 80);
        const fy = Phaser.Math.Between(80, 200);
        const col = Phaser.Math.Between(0, 0xffffff);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const spark = this.add.circle(fx, fy, 4, col);
          this.tweens.add({
            targets: spark,
            x: fx + Math.cos(angle) * 60,
            y: fy + Math.sin(angle) * 60,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => spark.destroy(),
          });
        }
      },
    });
  }
}
