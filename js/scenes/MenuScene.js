// ============================================================
// js/scenes/MenuScene.js
// メインメニューシーン
// タイトル表示・ステージ選択・恒久強化ショップを管理します
// ============================================================

'use strict';

class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    // ============================================================
    // create()
    // ============================================================
    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // セーブデータを読み込む
        this.saveData = SaveManager.load();

        // 現在表示中の画面（'title' or 'shop'）
        this.currentView = 'title';

        // UIオブジェクトを管理するグループ（再描画時にまとめて削除）
        this.viewObjects = [];

        // 宇宙背景を描画
        this.drawBackground(W, H);

        // タイトル画面を表示
        this.showTitleView(W, H);
    }

    // ============================================================
    // drawBackground(W, H)
    // 宇宙っぽい背景を描画する（星、グリッド線）
    // ============================================================
    drawBackground(W, H) {
        const bg = this.add.graphics();

        // 暗い宇宙の背景
        bg.fillStyle(0x000011);
        bg.fillRect(0, 0, W, H);

        // グリッドライン（SF感を演出）
        bg.lineStyle(1, 0x001133, 0.4);
        for (let x = 0; x <= W; x += 40) {
            bg.beginPath(); bg.moveTo(x, 0); bg.lineTo(x, H); bg.strokePath();
        }
        for (let y = 0; y <= H; y += 40) {
            bg.beginPath(); bg.moveTo(0, y); bg.lineTo(W, y); bg.strokePath();
        }

        // 星（ランダム配置）
        bg.fillStyle(0xffffff, 0.8);
        for (let i = 0; i < 80; i++) {
            const sx = Phaser.Math.Between(0, W);
            const sy = Phaser.Math.Between(0, H);
            const sz = Math.random() < 0.2 ? 2 : 1;
            bg.fillRect(sx, sy, sz, sz);
        }

        // 遠くの星雲（大きな半透明の円）
        for (let i = 0; i < 4; i++) {
            bg.fillStyle(Phaser.Math.Between(0x002244, 0x220044), 0.06);
            bg.fillCircle(
                Phaser.Math.Between(0, W),
                Phaser.Math.Between(0, H),
                Phaser.Math.Between(60, 150)
            );
        }
    }

    // ============================================================
    // showTitleView(W, H)
    // タイトル + ステージ選択画面を表示する
    // ============================================================
    showTitleView(W, H) {
        this.clearView();

        // ---- タイトル文字 ----
        const title = this.add.text(W / 2, H * 0.12, 'CYBER DIVE', {
            fontSize: '48px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#00ffff',
            stroke: '#004466',
            strokeThickness: 5
        }).setOrigin(0.5);
        this.viewObjects.push(title);

        const subtitle = this.add.text(W / 2, H * 0.21, 'ローグライク・シューター', {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#aaffff'
        }).setOrigin(0.5);
        this.viewObjects.push(subtitle);

        // ---- コイン表示 ----
        const coinDisplay = this.add.text(W / 2, H * 0.28, `所持コイン: ${this.saveData.totalCoins} 枚`, {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffcc00'
        }).setOrigin(0.5);
        this.viewObjects.push(coinDisplay);

        // ---- ステージ選択カード ----
        const stages = [
            { id: 1, label: 'STAGE 1', diff: '低難易度', color: 0x004400, borderColor: 0x00aa44 },
            { id: 2, label: 'STAGE 2', diff: '中難易度', color: 0x443300, borderColor: 0xaaaa00 },
            { id: 3, label: 'STAGE 3', diff: '高難易度', color: 0x440000, borderColor: 0xaa2222 },
        ];

        const cardW = 180;
        const cardH = 100;
        const cardSpacing = 20;
        const totalW = stages.length * cardW + (stages.length - 1) * cardSpacing;
        const startX = W / 2 - totalW / 2;

        stages.forEach((stage, i) => {
            const cx = startX + i * (cardW + cardSpacing);
            const cy = H * 0.38;
            this.createStageCard(cx, cy, cardW, cardH, stage);
        });

        // ---- 操作説明 ----
        const helpText = [
            '操作方法:',
            'WASD / 矢印キー: 移動',
            '自動攻撃: レベルアップで強化',
            'レベルアップ時に3択から強化を選択',
        ].join('\n');

        const helpObj = this.add.text(W / 2, H * 0.70, helpText, {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#8899aa',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);
        this.viewObjects.push(helpObj);

        // ---- 恒久強化ショップボタン ----
        const shopBtn = this.createButton(W / 2, H * 0.87, 220, 44, '🏪 恒久強化ショップ', 0x112244, 0x224466, () => {
            this.showShopView(W, H);
        });
        this.viewObjects.push(...shopBtn);
    }

    // ============================================================
    // createStageCard(x, y, w, h, stage)
    // ステージ選択カードを生成する
    // ============================================================
    createStageCard(x, y, w, h, stage) {
        const isCleared = this.saveData.clearedStages.includes(stage.id);

        const bg = this.add.graphics();
        const drawNormal = () => {
            bg.clear();
            bg.fillStyle(stage.color);
            bg.fillRoundedRect(x, y, w, h, 8);
            bg.lineStyle(2, stage.borderColor);
            bg.strokeRoundedRect(x, y, w, h, 8);
        };
        const drawHover = () => {
            bg.clear();
            bg.fillStyle(stage.color);
            bg.fillRoundedRect(x, y, w, h, 8);
            bg.lineStyle(3, stage.borderColor);
            bg.strokeRoundedRect(x, y, w, h, 8);
        };
        drawNormal();
        this.viewObjects.push(bg);

        const label = this.add.text(x + w / 2, y + h * 0.28, stage.label, {
            fontSize: '20px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5);
        this.viewObjects.push(label);

        const diff = this.add.text(x + w / 2, y + h * 0.56, stage.diff, {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#cccccc'
        }).setOrigin(0.5);
        this.viewObjects.push(diff);

        // クリア表示
        if (isCleared) {
            const clearMark = this.add.text(x + w - 10, y + 8, 'CLEAR✓', {
                fontSize: '10px',
                fontFamily: 'Arial, sans-serif',
                color: '#00ff88'
            }).setOrigin(1, 0);
            this.viewObjects.push(clearMark);
        }

        const duration = this.add.text(x + w / 2, y + h * 0.80, '30分間', {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            color: '#888888'
        }).setOrigin(0.5);
        this.viewObjects.push(duration);

        // クリックエリア
        const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0)
            .setInteractive({ useHandCursor: true });
        hit.on('pointerover', drawHover);
        hit.on('pointerout', drawNormal);
        hit.on('pointerdown', () => {
            this.scene.start('GameScene', { stageId: stage.id, saveData: this.saveData });
        });
        this.viewObjects.push(hit);
    }

    // ============================================================
    // showShopView(W, H)
    // 恒久強化ショップ画面を表示する
    // ============================================================
    showShopView(W, H) {
        this.clearView();

        // ---- タイトル ----
        const title = this.add.text(W / 2, 18, '🏪 恒久強化ショップ', {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffcc00',
            stroke: '#443300',
            strokeThickness: 3
        }).setOrigin(0.5, 0);
        this.viewObjects.push(title);

        // ---- コイン表示 ----
        this.coinText = this.add.text(W - 10, 20, `💰 ${this.saveData.totalCoins}`, {
            fontSize: '18px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffcc00'
        }).setOrigin(1, 0);
        this.viewObjects.push(this.coinText);

        // ---- 各強化アイテム ----
        const cardW = W - 40;
        const cardH = 72;
        const startY = 60;

        PERMANENT_UPGRADES.forEach((upgrade, i) => {
            const cx = 20;
            const cy = startY + i * (cardH + 8);
            this.drawShopCard(upgrade, cx, cy, cardW, cardH);
        });

        // ---- 戻るボタン ----
        const backBtns = this.createButton(W / 2, H - 30, 200, 40, '← タイトルへ戻る', 0x112233, 0x223344, () => {
            this.showTitleView(W, H);
        });
        this.viewObjects.push(...backBtns);
    }

    // ============================================================
    // drawShopCard(upgrade, x, y, w, h)
    // ショップのアイテムカードを描画する
    // ============================================================
    drawShopCard(upgrade, x, y, w, h) {
        const currentLevel = this.saveData.permUpgrades[upgrade.id] || 0;
        const isMax = currentLevel >= upgrade.maxLevel;
        const cost = upgrade.cost * (currentLevel + 1);
        const canAfford = this.saveData.totalCoins >= cost;

        const bg = this.add.graphics();
        bg.fillStyle(isMax ? 0x112211 : 0x112233);
        bg.fillRoundedRect(x, y, w, h, 6);
        bg.lineStyle(1, isMax ? 0x338833 : 0x334455);
        bg.strokeRoundedRect(x, y, w, h, 6);
        this.viewObjects.push(bg);

        // 名前
        const nameObj = this.add.text(x + 12, y + 8, upgrade.name, {
            fontSize: '15px',
            fontFamily: 'Arial, sans-serif',
            color: isMax ? '#88ff88' : '#aaccff'
        });
        this.viewObjects.push(nameObj);

        // 説明
        const descObj = this.add.text(x + 12, y + 28, upgrade.description, {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            color: '#778899'
        });
        this.viewObjects.push(descObj);

        // レベルバー
        const barX = x + 12;
        const barY = y + 52;
        const barW = 120;
        const barH = 8;
        const barBg = this.add.graphics();
        barBg.fillStyle(0x001122);
        barBg.fillRect(barX, barY, barW, barH);
        this.viewObjects.push(barBg);

        const barFill = this.add.graphics();
        barFill.fillStyle(0x44aaff);
        if (currentLevel > 0) {
            barFill.fillRect(barX, barY, Math.round(barW * currentLevel / upgrade.maxLevel), barH);
        }
        this.viewObjects.push(barFill);

        const levelObj = this.add.text(barX + barW + 8, barY - 2, `Lv ${currentLevel}/${upgrade.maxLevel}`, {
            fontSize: '11px',
            fontFamily: 'Arial, sans-serif',
            color: '#aabbcc'
        });
        this.viewObjects.push(levelObj);

        // 購入ボタン（最大レベルでなければ表示）
        if (!isMax) {
            const btnX = x + w - 110;
            const btnY = y + h / 2 - 16;
            const btnW = 100;
            const btnH = 32;

            const btnBg = this.add.graphics();
            const drawBtn = (hover) => {
                btnBg.clear();
                const col = hover && canAfford ? 0x225533 : canAfford ? 0x113322 : 0x1a1a1a;
                btnBg.fillStyle(col);
                btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 5);
                btnBg.lineStyle(1, canAfford ? 0x44aa66 : 0x333333);
                btnBg.strokeRoundedRect(btnX, btnY, btnW, btnH, 5);
            };
            drawBtn(false);
            this.viewObjects.push(btnBg);

            const costObj = this.add.text(btnX + btnW / 2, btnY + btnH / 2, `💰 ${cost}`, {
                fontSize: '13px',
                fontFamily: 'Arial, sans-serif',
                color: canAfford ? '#88ff88' : '#555555'
            }).setOrigin(0.5);
            this.viewObjects.push(costObj);

            if (canAfford) {
                const hit = this.add.rectangle(btnX + btnW / 2, btnY + btnH / 2, btnW, btnH, 0, 0)
                    .setInteractive({ useHandCursor: true });
                hit.on('pointerover', () => drawBtn(true));
                hit.on('pointerout',  () => drawBtn(false));
                hit.on('pointerdown', () => {
                    const result = SaveManager.buyPermUpgrade(this.saveData, upgrade.id);
                    if (result.success) {
                        this.coinText.setText(`💰 ${this.saveData.totalCoins}`);
                        // カード内容を更新するためビュー再描画
                        this.showShopView(this.scale.width, this.scale.height);
                    }
                });
                this.viewObjects.push(hit);
            }
        } else {
            const maxObj = this.add.text(x + w - 40, y + h / 2, 'MAX', {
                fontSize: '16px',
                fontFamily: 'Arial Black, sans-serif',
                color: '#ffee44'
            }).setOrigin(0.5);
            this.viewObjects.push(maxObj);
        }
    }

    // ============================================================
    // clearView()
    // 現在のビューオブジェクトを全て削除する（画面切り替え時に使用）
    // ============================================================
    clearView() {
        for (const obj of this.viewObjects) {
            if (obj && obj.destroy) obj.destroy();
        }
        this.viewObjects = [];
    }

    // ============================================================
    // createButton(x, y, w, h, label, bgColor, hoverColor, callback)
    // 汎用ボタンを作成する
    // 戻り値: ボタンのUIオブジェクト配列
    // ============================================================
    createButton(x, y, w, h, label, bgColor, hoverColor, callback) {
        const bg = this.add.graphics();
        const draw = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? hoverColor : bgColor);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
            bg.lineStyle(2, 0x4466aa);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
        };
        draw(false);

        const txt = this.add.text(x, y, label, {
            fontSize: '16px',
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

        return [bg, txt, hit];
    }
}
