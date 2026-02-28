// ============================================================
// MenuScene.js - メインメニュー
// ============================================================

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create() {
        const { width: W, height: H } = this.scale;
        this.saveData = SaveManager.load();

        // ============ 背景 ============
        this.drawBackground(W, H);

        // ============ タイトル ============
        this.add.text(W / 2, H * 0.18, '城砦の守護者', {
            fontSize: '42px',
            fill: '#ffee88',
            fontFamily: 'monospace',
            stroke: '#884400',
            strokeThickness: 5,
        }).setOrigin(0.5, 0.5);

        this.add.text(W / 2, H * 0.27, 'Castle Defender', {
            fontSize: '18px',
            fill: '#bbaa66',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        // ============ ボタン ============
        const hasSave = SaveManager.hasSave();

        // ゲームスタートボタン
        const startLabel = hasSave ? '続きから' : 'はじめる';
        this.createButton(W / 2, H * 0.46, 220, 52, startLabel, 0x1144aa, 0x3366cc, () => {
            this.scene.start('WorldMapScene');
        });

        // 新規ゲームボタン（セーブがある時だけ表示）
        if (hasSave) {
            this.createButton(W / 2, H * 0.57, 220, 44, '最初から', 0x443300, 0x775522, () => {
                this.confirmNewGame(W, H);
            });
        }

        // ============ プレイヤー情報 ============
        if (hasSave) {
            const lv = this.saveData.playerLevel;
            const gold = this.saveData.gold;
            const cleared = this.saveData.clearedStages.length;
            this.add.text(W / 2, H * 0.74, `Lv.${lv}  Gold: ${gold}  クリア: ${cleared}/30`, {
                fontSize: '13px',
                fill: '#aaaacc',
                fontFamily: 'monospace',
            }).setOrigin(0.5, 0.5);
        }

        // ============ 装飾ユニット ============
        this.drawDecorativeUnits(W, H);

        // ============ バージョン ============
        this.add.text(W - 8, H - 6, 'v1.0', {
            fontSize: '10px',
            fill: '#555566',
            fontFamily: 'monospace',
        }).setOrigin(1, 1);
    }

    drawBackground(W, H) {
        const g = this.add.graphics();

        // 空グラデーション（簡易）
        g.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x1a1a4a, 0x1a1a4a, 1);
        g.fillRect(0, 0, W, H);

        // 地面
        g.fillStyle(0x223322);
        g.fillRect(0, H * 0.7, W, H * 0.3);

        // 草のライン
        g.fillStyle(0x334433);
        g.fillRect(0, H * 0.7, W, 4);

        // 星（装飾）
        g.fillStyle(0xffffff, 0.6);
        for (let i = 0; i < 40; i++) {
            const sx = Phaser.Math.Between(0, W);
            const sy = Phaser.Math.Between(0, H * 0.6);
            g.fillRect(sx, sy, 1, 1);
        }

        // 山（シルエット）
        g.fillStyle(0x111133);
        g.fillTriangle(80, H * 0.7, 200, H * 0.4, 320, H * 0.7);
        g.fillTriangle(550, H * 0.7, 680, H * 0.38, 800, H * 0.7);
        g.fillStyle(0x0d0d22);
        g.fillTriangle(150, H * 0.7, 250, H * 0.45, 370, H * 0.7);
        g.fillTriangle(480, H * 0.7, 610, H * 0.42, 740, H * 0.7);

        // 城シルエット（左）
        this.drawCastleSilhouette(g, 60, H * 0.7, 0x112233);
        // 城シルエット（右）
        this.drawCastleSilhouette(g, W - 60, H * 0.7, 0x221111);
    }

    drawCastleSilhouette(g, cx, groundY, color) {
        g.fillStyle(color);
        const w = 50, h = 80;
        g.fillRect(cx - w / 2, groundY - h, w, h);
        // 塔
        g.fillRect(cx - w / 2 - 8, groundY - h - 20, 14, h + 20);
        g.fillRect(cx + w / 2 - 6, groundY - h - 20, 14, h + 20);
        // 城壁の凸凹
        for (let i = 0; i < 4; i++) {
            g.fillRect(cx - w / 2 + i * 14, groundY - h - 8, 8, 8);
        }
    }

    createButton(x, y, w, h, label, bgColor, hoverColor, callback) {
        const bg = this.add.graphics();
        const drawNormal = () => {
            bg.clear();
            bg.fillStyle(bgColor);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            bg.lineStyle(2, 0x88aaff);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        };
        const drawHover = () => {
            bg.clear();
            bg.fillStyle(hoverColor);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            bg.lineStyle(2, 0xbbddff);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        };
        drawNormal();

        this.add.text(x, y, label, {
            fontSize: '18px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 2,
        }).setOrigin(0.5, 0.5).setDepth(2);

        const hitArea = this.add.rectangle(x, y, w, h, 0xffffff, 0)
            .setInteractive({ useHandCursor: true });
        hitArea.on('pointerdown', () => { callback(); });
        hitArea.on('pointerover', drawHover);
        hitArea.on('pointerout', drawNormal);

        return bg;
    }

    confirmNewGame(W, H) {
        // 確認ダイアログ
        const overlay = this.add.graphics().setDepth(30);
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, W, H);

        const dlgW = 320, dlgH = 150;
        const dlgX = W / 2 - dlgW / 2;
        const dlgY = H / 2 - dlgH / 2;

        overlay.fillStyle(0x111133);
        overlay.fillRoundedRect(dlgX, dlgY, dlgW, dlgH, 8);
        overlay.lineStyle(2, 0x4466aa);
        overlay.strokeRoundedRect(dlgX, dlgY, dlgW, dlgH, 8);

        const msg = this.add.text(W / 2, H / 2 - 30, 'セーブデータを消去して\n最初からやり直しますか？', {
            fontSize: '14px',
            fill: '#ffaaaa',
            fontFamily: 'monospace',
            align: 'center',
        }).setOrigin(0.5, 0.5).setDepth(31);

        const yesBtn = this.createButton(W / 2 - 60, H / 2 + 40, 100, 36, 'はい', 0x882222, 0xaa3333, () => {
            SaveManager.reset();
            overlay.destroy();
            msg.destroy();
            yesBtn.destroy();
            noBtn.destroy();
            this.scene.start('WorldMapScene');
        });
        yesBtn.setDepth(31);

        const noBtn = this.createButton(W / 2 + 60, H / 2 + 40, 100, 36, 'いいえ', 0x224422, 0x336633, () => {
            overlay.destroy();
            msg.destroy();
            yesBtn.destroy();
            noBtn.destroy();
        });
        noBtn.setDepth(31);
    }

    drawDecorativeUnits(W, H) {
        // 装飾用のユニットシルエット（タイトル画面用）
        const g = this.add.graphics().setDepth(3);
        const groundY = H * 0.7;

        // 左側：プレイヤーユニットシルエット（青）
        const playerUnits = ['soldier', 'archer', 'knight'];
        playerUnits.forEach((key, i) => {
            const px = 100 + i * 60;
            const py = groundY - 5;
            this.drawUnitSilhouette(g, key, px, py, 0x3355aa);
        });

        // 右側：敵ユニットシルエット（赤）
        const enemyUnits = ['orc', 'goblin', 'troll'];
        enemyUnits.forEach((key, i) => {
            const px = W - 100 - i * 60;
            const py = groundY - 5;
            this.drawUnitSilhouette(g, key, px, py, 0xaa3322, true);
        });
    }

    drawUnitSilhouette(g, unitKey, x, y, color, flip = false) {
        const pixels = UNIT_PIXELS[unitKey];
        if (!pixels) return;
        const ps = 2;
        const cols = pixels[0].length;
        const rows = pixels.length;
        const offsetX = -Math.floor(cols * ps / 2);
        const offsetY = -rows * ps;

        g.fillStyle(color, 0.6);
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const ch = pixels[row][col];
                if (ch === '_') continue;
                const drawCol = flip ? (cols - 1 - col) : col;
                g.fillRect(x + offsetX + drawCol * ps, y + offsetY + row * ps, ps, ps);
            }
        }
    }
}
