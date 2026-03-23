// ============================================================
// js/scenes/GameOverScene.js
// ゲームオーバー / ステージクリア 結果画面
// 取得したコイン・スコア・レベルなどのリザルトを表示します
// ============================================================

'use strict';

class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }

    // ============================================================
    // init(data)
    // GameSceneから渡された結果データを受け取る
    // ============================================================
    init(data) {
        this.isVictory = data.isVictory || false;
        this.retired   = data.retired   || false;
        this.coinCount = data.coinCount || 0;
        this.score     = data.score     || 0;
        this.level     = data.level     || 1;
        this.timeSec   = data.timeSec   || 0;
        this.stageId   = data.stageId   || 1;
        this.saveData  = data.saveData  || SaveManager.load();
    }

    // ============================================================
    // create()
    // リザルト画面のUIを作成する
    // ============================================================
    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ---- 背景 ----
        this.drawBackground(W, H);

        // ---- 結果タイトル ----
        if (this.retired) {
            this.showTitle(W, H, 'RETIRE', '#888888');
        } else if (this.isVictory) {
            this.showTitle(W, H, 'STAGE CLEAR!', '#ffee44');
        } else {
            this.showTitle(W, H, 'GAME OVER', '#ff4444');
        }

        // ---- 経過時間 ----
        const min = Math.floor(this.timeSec / 60);
        const sec = this.timeSec % 60;
        const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

        // ---- リザルトカード ----
        const cardX = W / 2 - 160;
        const cardY = H * 0.28;
        const cardW = 320;
        const cardH = 220;

        const cardBg = this.add.graphics();
        cardBg.fillStyle(0x0a1a2a, 0.95);
        cardBg.fillRoundedRect(cardX, cardY, cardW, cardH, 10);
        cardBg.lineStyle(2, this.isVictory ? 0xffcc00 : 0x334455);
        cardBg.strokeRoundedRect(cardX, cardY, cardW, cardH, 10);

        // ---- 各ステータス行 ----
        const rows = [
            { label: '到達レベル',  value: `Lv.${this.level}`,    color: '#ffffff' },
            { label: '生存時間',    value: timeStr,                 color: '#aaccff' },
            { label: 'スコア',      value: this.score.toLocaleString(), color: '#ffcc44' },
            { label: 'ステージ',    value: `Stage ${this.stageId}`,color: '#aaaacc' },
        ];

        const rowStartY = cardY + 20;
        const rowH      = 38;

        rows.forEach((row, i) => {
            const ry = rowStartY + i * rowH;

            this.add.text(cardX + 20, ry, row.label, {
                fontSize: '15px',
                fontFamily: 'Arial, sans-serif',
                color: '#778899'
            });

            this.add.text(cardX + cardW - 20, ry, row.value, {
                fontSize: '16px',
                fontFamily: 'Arial Black, sans-serif',
                color: row.color
            }).setOrigin(1, 0);

            // 区切り線
            if (i < rows.length - 1) {
                const divLine = this.add.graphics();
                divLine.lineStyle(1, 0x223344, 0.6);
                divLine.beginPath();
                divLine.moveTo(cardX + 10, ry + rowH - 3);
                divLine.lineTo(cardX + cardW - 10, ry + rowH - 3);
                divLine.strokePath();
            }
        });

        // ---- コイン取得表示（大きく目立たせる）----
        const coinCardX = W / 2 - 160;
        const coinCardY = H * 0.64;
        const coinCardW = 320;
        const coinCardH = 70;

        const coinBg = this.add.graphics();
        coinBg.fillStyle(0x221100, 0.95);
        coinBg.fillRoundedRect(coinCardX, coinCardY, coinCardW, coinCardH, 8);
        coinBg.lineStyle(2, 0xffaa00);
        coinBg.strokeRoundedRect(coinCardX, coinCardY, coinCardW, coinCardH, 8);

        this.add.text(coinCardX + coinCardW / 2, coinCardY + 12,
            'コイン取得', {
            fontSize: '13px',
            fontFamily: 'Arial, sans-serif',
            color: '#aa8800'
        }).setOrigin(0.5, 0);

        this.add.text(coinCardX + coinCardW / 2, coinCardY + 32,
            `💰 +${this.coinCount} 枚   (所持: ${this.saveData.totalCoins} 枚)`, {
            fontSize: '18px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffcc00'
        }).setOrigin(0.5, 0);

        // ---- ボタン群 ----
        // もう一度プレイ
        this.createButton(W / 2 - 105, H * 0.83, 190, 44,
            '↺ もう一度プレイ', 0x113322, 0x224433, () => {
            this.scene.start('GameScene', {
                stageId:  this.stageId,
                saveData: SaveManager.load() // 最新セーブデータを使う
            });
        });

        // メニューへ
        this.createButton(W / 2 + 105, H * 0.83, 190, 44,
            '⌂ メニューへ戻る', 0x112233, 0x223344, () => {
            this.scene.start('MenuScene');
        });

        // ---- クリア時の特別演出 ----
        if (this.isVictory) {
            this.showVictoryStars(W, H);
        }
    }

    // ============================================================
    // drawBackground(W, H)
    // 背景を描画する
    // ============================================================
    drawBackground(W, H) {
        const g = this.add.graphics();
        g.fillStyle(0x000011);
        g.fillRect(0, 0, W, H);

        // グリッドライン
        g.lineStyle(1, 0x001133, 0.3);
        for (let x = 0; x <= W; x += 40) {
            g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.strokePath();
        }
        for (let y = 0; y <= H; y += 40) {
            g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath();
        }

        // 星
        g.fillStyle(0xffffff, 0.5);
        for (let i = 0; i < 50; i++) {
            g.fillRect(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H), 1, 1);
        }
    }

    // ============================================================
    // showTitle(W, H, text, color)
    // 結果タイトルテキストを表示する（演出つき）
    // ============================================================
    showTitle(W, H, text, color) {
        const title = this.add.text(W / 2, H * 0.13, text, {
            fontSize: '44px',
            fontFamily: 'Arial Black, sans-serif',
            color: color,
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setAlpha(0).setScale(1.5);

        // スケールダウン + フェードインで登場
        this.tweens.add({
            targets: title,
            alpha:   1,
            scaleX:  1,
            scaleY:  1,
            duration: 600,
            ease: 'Back.easeOut'
        });
    }

    // ============================================================
    // showVictoryStars(W, H)
    // クリア時に星が飛び散る演出を追加する
    // ============================================================
    showVictoryStars(W, H) {
        for (let i = 0; i < 20; i++) {
            this.time.delayedCall(i * 100, () => {
                const star = this.add.text(
                    Phaser.Math.Between(50, W - 50),
                    Phaser.Math.Between(50, H - 50),
                    '★',
                    {
                        fontSize: `${Phaser.Math.Between(16, 32)}px`,
                        color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`
                    }
                ).setDepth(5);

                this.tweens.add({
                    targets: star,
                    y: star.y - Phaser.Math.Between(30, 80),
                    alpha: 0,
                    duration: Phaser.Math.Between(600, 1200),
                    onComplete: () => star.destroy()
                });
            });
        }
    }

    // ============================================================
    // createButton(x, y, w, h, label, bgColor, hoverColor, callback)
    // ボタンを作成するヘルパー（中心座標で指定）
    // ============================================================
    createButton(x, y, w, h, label, bgColor, hoverColor, callback) {
        const bg = this.add.graphics();
        const draw = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? hoverColor : bgColor);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            bg.lineStyle(2, 0x4488aa);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        };
        draw(false);

        this.add.text(x, y, label, {
            fontSize: '15px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(2);

        const hit = this.add.rectangle(x, y, w, h, 0, 0)
            .setInteractive({ useHandCursor: true }).setDepth(3);
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout',  () => draw(false));
        hit.on('pointerdown', callback);
    }
}
