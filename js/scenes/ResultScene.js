// ============================================================
// ResultScene.js - 勝敗結果画面
// ============================================================

class ResultScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ResultScene' });
    }

    init(data) {
        this.stageId    = data.stageId;
        this.isVictory  = data.isVictory;
        this.hpRatio    = data.hpRatio || 0;
        this.expGained  = data.expGained || 0;
        this.goldGained = data.goldGained || 0;
        this.leveledUp  = data.leveledUp || false;
    }

    create() {
        const { width: W, height: H } = this.scale;
        this.saveData = SaveManager.load();

        // 背景
        this.drawBackground(W, H);

        if (this.isVictory) {
            this.showVictory(W, H);
        } else {
            this.showDefeat(W, H);
        }
    }

    drawBackground(W, H) {
        const g = this.add.graphics();
        if (this.isVictory) {
            g.fillGradientStyle(0x0a1a0a, 0x0a1a0a, 0x0a2a0a, 0x0a2a0a, 1);
        } else {
            g.fillGradientStyle(0x1a0a0a, 0x1a0a0a, 0x2a0a0a, 0x2a0a0a, 1);
        }
        g.fillRect(0, 0, W, H);

        // パーティクル（勝利時）
        if (this.isVictory) {
            for (let i = 0; i < 30; i++) {
                const col = Phaser.Math.Between(0xffcc00, 0xffee88);
                g.fillStyle(col, 0.5);
                g.fillRect(
                    Phaser.Math.Between(0, W),
                    Phaser.Math.Between(0, H),
                    Phaser.Math.Between(2, 5),
                    Phaser.Math.Between(2, 5)
                );
            }
        }
    }

    showVictory(W, H) {
        const stage = STAGE_DATA[this.stageId];

        // タイトル
        const titleText = this.add.text(W / 2, H * 0.14, '勝利！', {
            fontSize: '52px',
            fill: '#ffee44',
            fontFamily: 'monospace',
            stroke: '#884400',
            strokeThickness: 6,
        }).setOrigin(0.5, 0.5).setAlpha(0);

        this.tweens.add({
            targets: titleText,
            alpha: 1,
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 500,
            yoyo: true,
            repeat: 1,
        });

        // ★評価を計算
        const stars = this.hpRatio >= 0.66 ? 3 : this.hpRatio >= 0.33 ? 2 : 1;
        const prevStars = this.saveData.stageStars[this.stageId] || 0;
        const newRecord = stars > prevStars;

        // ステージ名
        this.add.text(W / 2, H * 0.23, stage ? stage.name : '', {
            fontSize: '16px',
            fill: '#ccddff',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        // ★表示
        const starY = H * 0.33;
        for (let i = 0; i < 3; i++) {
            const starX = W / 2 - 50 + i * 50;
            const filled = i < stars;
            const star = this.add.text(starX, starY, '★', {
                fontSize: filled ? '40px' : '36px',
                fill: filled ? '#ffee00' : '#333344',
                stroke: filled ? '#aa8800' : '#111122',
                strokeThickness: 2,
            }).setOrigin(0.5, 0.5).setAlpha(0);

            this.time.delayedCall(300 + i * 250, () => {
                this.tweens.add({
                    targets: star,
                    alpha: 1,
                    scaleX: 1.3,
                    scaleY: 1.3,
                    duration: 300,
                    yoyo: true,
                    onComplete: () => star.setAlpha(1).setScale(1)
                });
            });
        }

        if (newRecord) {
            this.add.text(W / 2, starY + 38, '★ 新記録！', {
                fontSize: '14px',
                fill: '#ffcc44',
                fontFamily: 'monospace',
            }).setOrigin(0.5, 0.5);
        }

        // 報酬表示
        const rewardY = H * 0.52;
        this.add.text(W / 2, rewardY, '報酬', {
            fontSize: '18px',
            fill: '#88aaff',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        this.add.text(W / 2, rewardY + 30, `EXP: +${this.expGained}  Gold: +${this.goldGained}G`, {
            fontSize: '16px',
            fill: '#ffcc44',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        // レベルアップ表示
        if (this.leveledUp) {
            const lvupText = this.add.text(W / 2, rewardY + 60, `🎉 Lv.${this.saveData.playerLevel} にレベルアップ！`, {
                fontSize: '16px',
                fill: '#88ff88',
                fontFamily: 'monospace',
                stroke: '#004400',
                strokeThickness: 3,
            }).setOrigin(0.5, 0.5);

            this.tweens.add({
                targets: lvupText,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 600,
                yoyo: true,
                repeat: 3,
            });
        }

        // HP残量
        this.add.text(W / 2, rewardY + 85, `城HP残: ${Math.floor(this.hpRatio * 100)}%`, {
            fontSize: '13px',
            fill: '#aabbcc',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        // ボタン類
        this.createVictoryButtons(W, H);
    }

    showDefeat(W, H) {
        // タイトル
        this.add.text(W / 2, H * 0.2, '敗北...', {
            fontSize: '48px',
            fill: '#ff4444',
            fontFamily: 'monospace',
            stroke: '#440000',
            strokeThickness: 6,
        }).setOrigin(0.5, 0.5);

        this.add.text(W / 2, H * 0.35, '城が落とされてしまった...', {
            fontSize: '16px',
            fill: '#cc8888',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        this.add.text(W / 2, H * 0.46, 'ユニットをアップグレードして\n再挑戦しよう！', {
            fontSize: '14px',
            fill: '#aa8888',
            fontFamily: 'monospace',
            align: 'center',
            lineSpacing: 6,
        }).setOrigin(0.5, 0.5);

        this.createDefeatButtons(W, H);
    }

    createVictoryButtons(W, H) {
        const btnY = H * 0.80;

        // 次のステージ（あれば）
        const nextStageId = this.stageId + 1;
        const hasNext = nextStageId < STAGE_DATA.length &&
            this.saveData.unlockedStages.includes(nextStageId);

        if (hasNext) {
            this.createButton(W / 2 - 90, btnY, 160, 44, '次のステージ', 0x1a4422, 0x2a6633, () => {
                this.scene.start('GameScene', {
                    stageId: nextStageId,
                    saveData: this.saveData,
                });
            });
        }

        // アップグレード
        this.createButton(hasNext ? W / 2 + 90 : W / 2 - 90, btnY, 160, 44, 'アップグレード', 0x443311, 0x665522, () => {
            this.scene.start('UpgradeScene');
        });

        // ステージ選択
        this.createButton(W / 2, btnY + 55, 160, 38, 'ステージ選択', 0x222244, 0x333366, () => {
            this.scene.start('WorldMapScene');
        });
    }

    createDefeatButtons(W, H) {
        const btnY = H * 0.65;

        // リトライ
        this.createButton(W / 2 - 90, btnY, 150, 44, 'リトライ', 0x442200, 0x663300, () => {
            const freshSave = SaveManager.load();
            this.scene.start('GameScene', {
                stageId: this.stageId,
                saveData: freshSave,
            });
        });

        // アップグレードして強化
        this.createButton(W / 2 + 90, btnY, 150, 44, 'アップグレード', 0x443311, 0x665522, () => {
            this.scene.start('UpgradeScene');
        });

        // ステージ選択
        this.createButton(W / 2, btnY + 55, 150, 38, 'ステージ選択', 0x222244, 0x333366, () => {
            this.scene.start('WorldMapScene');
        });
    }

    createButton(x, y, w, h, label, bgColor, hoverColor, callback) {
        const bg = this.add.graphics();
        const draw = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? hoverColor : bgColor);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 7);
            bg.lineStyle(1, hover ? 0xffffff : 0x888899);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 7);
        };
        draw(false);
        this.add.text(x, y, label, {
            fontSize: '14px', fill: '#ffffff', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(0.5, 0.5).setDepth(2);

        const hit = this.add.rectangle(x, y, w, h, 0, 0).setInteractive({ useHandCursor: true }).setDepth(3);
        hit.on('pointerdown', callback);
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout', () => draw(false));
        return bg;
    }
}
