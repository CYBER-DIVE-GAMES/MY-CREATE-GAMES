// ============================================================
// WorldMapScene.js - ワールドマップ・ステージ選択
// ============================================================

class WorldMapScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldMapScene' });
    }

    init(data) {
        this.newlyUnlocked = data && data.newlyUnlocked;
    }

    create() {
        const { width: W, height: H } = this.scale;
        this.saveData = SaveManager.load();

        // 背景
        this.drawBackground(W, H);

        // タイトルバー
        this.add.text(W / 2, 20, 'ステージ選択', {
            fontSize: '22px',
            fill: '#ffee88',
            fontFamily: 'monospace',
            stroke: '#442200',
            strokeThickness: 3,
        }).setOrigin(0.5, 0);

        // プレイヤー情報
        const lv = this.saveData.playerLevel;
        const exp = this.saveData.playerExp;
        const expReq = SaveManager.getExpRequired(lv);
        const gold = this.saveData.gold;

        this.add.text(10, 16, `Lv.${lv}  EXP: ${exp}/${expReq}  Gold: ${gold}G`, {
            fontSize: '12px',
            fill: '#ccccaa',
            fontFamily: 'monospace',
        }).setOrigin(0, 0);

        // アップグレードボタン
        this.createUpgradeButton(W - 10, 16, W, H);

        // メニューに戻るボタン
        this.createBackButton(10, H - 30);

        // ステージグリッド描画
        this.drawStageGrid(W, H);

        // 新解放エフェクト
        if (this.newlyUnlocked !== undefined) {
            this.time.delayedCall(300, () => {
                this.showUnlockEffect(this.newlyUnlocked, W, H);
            });
        }
    }

    drawBackground(W, H) {
        const g = this.add.graphics();

        // 夜空背景
        g.fillGradientStyle(0x05051a, 0x05051a, 0x0a0a2a, 0x0a0a2a, 1);
        g.fillRect(0, 0, W, H);

        // 地面
        g.fillStyle(0x1a2a1a);
        g.fillRect(0, H - 30, W, 30);

        // 星
        g.fillStyle(0xffffff, 0.5);
        for (let i = 0; i < 60; i++) {
            g.fillRect(
                Phaser.Math.Between(0, W),
                Phaser.Math.Between(0, H * 0.6),
                Phaser.Math.Between(1, 2),
                Phaser.Math.Between(1, 2)
            );
        }

        // 月
        g.fillStyle(0xffeebb);
        g.fillCircle(W - 60, 50, 25);
        g.fillStyle(0x05051a);
        g.fillCircle(W - 50, 44, 22);
    }

    drawStageGrid(W, H) {
        // 5ワールド × 6ステージ
        // ワールドごとに行を分けて表示
        const cellW = 110, cellH = 56;
        const gapX = 8, gapY = 8;
        const cols = 6;
        const startX = (W - (cols * (cellW + gapX) - gapX)) / 2;
        const startY = 55;

        WORLD_DATA.forEach((world, worldIdx) => {
            const stagesInWorld = STAGE_DATA.filter(s => s.world === world.id);
            const rowY = startY + worldIdx * (cellH + gapY + 5);

            // ワールドラベル
            const worldLabel = this.add.text(
                startX - 5, rowY + cellH / 2,
                `W${world.id}`,
                {
                    fontSize: '11px',
                    fill: '#888899',
                    fontFamily: 'monospace',
                }
            ).setOrigin(1, 0.5);

            stagesInWorld.forEach((stage, stageIdx) => {
                const cellX = startX + stageIdx * (cellW + gapX);
                const cellY = rowY;

                this.drawStageCell(stage, cellX, cellY, cellW, cellH);
            });
        });
    }

    drawStageCell(stage, x, y, w, h) {
        const unlocked = this.saveData.unlockedStages.includes(stage.id);
        const stars = this.saveData.stageStars[stage.id] || 0;
        const cleared = this.saveData.clearedStages.includes(stage.id);
        const isBoss = stage.isBossStage || false;

        // セル背景
        const g = this.add.graphics();
        let bgColor;
        if (!unlocked) {
            bgColor = 0x111122;
        } else if (cleared) {
            bgColor = isBoss ? 0x332200 : 0x113311;
        } else {
            bgColor = isBoss ? 0x220011 : 0x112233;
        }
        g.fillStyle(bgColor);
        g.fillRoundedRect(x, y, w, h, 5);
        const borderColor = !unlocked ? 0x222233 : (isBoss ? 0xcc6600 : (cleared ? 0x33aa33 : 0x336699));
        g.lineStyle(1, borderColor);
        g.strokeRoundedRect(x, y, w, h, 5);

        if (!unlocked) {
            // ロックアイコン
            this.add.text(x + w / 2, y + h / 2 - 4, '🔒', {
                fontSize: '14px',
            }).setOrigin(0.5, 0.5);
            return;
        }

        // ステージ名
        const nameColor = isBoss ? '#ffcc44' : '#aaccff';
        const displayName = stage.name.length > 8 ? stage.name.substring(0, 8) + '..' : stage.name;
        this.add.text(x + w / 2, y + 7, displayName, {
            fontSize: '10px',
            fill: nameColor,
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0);

        // W-S表示
        this.add.text(x + 5, y + 5, `${stage.world}-${stage.stage}`, {
            fontSize: '9px',
            fill: '#666677',
            fontFamily: 'monospace',
        }).setOrigin(0, 0);

        // ★表示
        const starY = y + h - 12;
        for (let i = 0; i < 3; i++) {
            const starX = x + w / 2 - 18 + i * 14;
            const color = i < stars ? '#ffee00' : '#333344';
            this.add.text(starX, starY, '★', {
                fontSize: '11px',
                fill: color,
            }).setOrigin(0.5, 1);
        }

        // クリックで選択
        const hitArea = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0)
            .setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
            g.clear();
            // 少し明るい色でホバー表示
            const r = Math.min(0xff, ((bgColor >> 16) & 0xff) + 0x18);
            const gv = Math.min(0xff, ((bgColor >> 8) & 0xff) + 0x18);
            const b = Math.min(0xff, (bgColor & 0xff) + 0x28);
            g.fillStyle((r << 16) | (gv << 8) | b);
            g.fillRoundedRect(x, y, w, h, 5);
            g.lineStyle(2, 0xffffff);
            g.strokeRoundedRect(x, y, w, h, 5);
        });

        hitArea.on('pointerout', () => {
            g.clear();
            g.fillStyle(bgColor);
            g.fillRoundedRect(x, y, w, h, 5);
            g.lineStyle(1, borderColor);
            g.strokeRoundedRect(x, y, w, h, 5);
        });

        hitArea.on('pointerdown', () => {
            this.selectStage(stage);
        });
    }

    selectStage(stage) {
        // ステージ詳細ポップアップ（難易度選択付き）
        const { width: W, height: H } = this.scale;
        const dlgW = 320, dlgH = 270;
        const dlgX = W / 2 - dlgW / 2;
        const dlgY = H / 2 - dlgH / 2;

        const overlay = this.add.graphics().setDepth(50);
        overlay.fillStyle(0x000000, 0.75);
        overlay.fillRect(0, 0, W, H);
        overlay.fillStyle(0x111133);
        overlay.fillRoundedRect(dlgX, dlgY, dlgW, dlgH, 10);
        overlay.lineStyle(2, 0x4466aa);
        overlay.strokeRoundedRect(dlgX, dlgY, dlgW, dlgH, 10);

        const stars = this.saveData.stageStars[stage.id] || 0;
        const cleared = this.saveData.clearedStages.includes(stage.id);

        const title = this.add.text(W / 2, dlgY + 14, stage.name, {
            fontSize: '15px', fill: '#ffee88', fontFamily: 'monospace',
        }).setOrigin(0.5, 0).setDepth(51);

        const info = `世界 ${stage.world} - ${stage.stage}面  `
            + `ウェーブ: ${stage.waves.length}\n`
            + `敵城HP: ${stage.castleHp}  `
            + `報酬: ${stage.rewards.gold}G / ${stage.rewards.exp}EXP\n`
            + (cleared ? `ベスト★: ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}` : '未クリア');

        const infoText = this.add.text(W / 2, dlgY + 36, info, {
            fontSize: '11px', fill: '#aabbcc', fontFamily: 'monospace', align: 'center', lineSpacing: 3,
        }).setOrigin(0.5, 0).setDepth(51);

        // ─── 難易度（ウェーブ密度）選択 ───
        const DIFFICULTIES = [
            { label: 'やさしい', density: 0.7,  color: 0x2244aa, border: 0x4488ff, rewardLabel: '×0.8' },
            { label: 'ふつう',   density: 1.0,  color: 0x224422, border: 0x44aa44, rewardLabel: '×1.0' },
            { label: 'むずかしい', density: 1.5, color: 0x553300, border: 0xffaa00, rewardLabel: '×1.3' },
            { label: '地獄',     density: 2.0,  color: 0x440011, border: 0xff2244, rewardLabel: '×1.7' },
        ];

        let selectedDensity = 1.0;
        const diffY = dlgY + 100;
        const diffLabel = this.add.text(W / 2, diffY - 18, '── ウェーブ密度 ──', {
            fontSize: '11px', fill: '#8899bb', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5).setDepth(51);

        const btnW = 68, btnH = 40, btnGap = 6;
        const totalBtnW = DIFFICULTIES.length * btnW + (DIFFICULTIES.length - 1) * btnGap;
        const btnStartX = W / 2 - totalBtnW / 2;

        const diffBtnGraphics = [];
        const diffBtnHits = [];

        const redrawDiffButtons = () => {
            DIFFICULTIES.forEach((diff, i) => {
                const bg = diffBtnGraphics[i];
                bg.clear();
                const isSelected = diff.density === selectedDensity;
                bg.fillStyle(isSelected ? diff.border : diff.color, isSelected ? 0.9 : 0.7);
                bg.fillRoundedRect(btnStartX + i * (btnW + btnGap), diffY, btnW, btnH, 5);
                bg.lineStyle(isSelected ? 2 : 1, diff.border, isSelected ? 1 : 0.5);
                bg.strokeRoundedRect(btnStartX + i * (btnW + btnGap), diffY, btnW, btnH, 5);
            });
        };

        const diffTexts = [];
        DIFFICULTIES.forEach((diff, i) => {
            const bx = btnStartX + i * (btnW + btnGap);
            const bg = this.add.graphics().setDepth(51);
            diffBtnGraphics.push(bg);

            const nameT = this.add.text(bx + btnW / 2, diffY + 10, diff.label, {
                fontSize: '10px', fill: '#ffffff', fontFamily: 'monospace',
            }).setOrigin(0.5, 0.5).setDepth(52);

            const rewardT = this.add.text(bx + btnW / 2, diffY + 28, `報酬${diff.rewardLabel}`, {
                fontSize: '9px', fill: '#ccccaa', fontFamily: 'monospace',
            }).setOrigin(0.5, 0.5).setDepth(52);

            diffTexts.push(nameT, rewardT);

            const hit = this.add.rectangle(bx + btnW / 2, diffY + btnH / 2, btnW, btnH, 0, 0)
                .setInteractive({ useHandCursor: true }).setDepth(53);
            hit.on('pointerdown', () => {
                selectedDensity = diff.density;
                redrawDiffButtons();
            });
            diffBtnHits.push(hit);
        });
        redrawDiffButtons();

        // ─── バトル開始ボタン ───
        const startBtnY = dlgY + dlgH - 58;
        const startBg = this.add.graphics().setDepth(51);
        const drawStart = (hover) => {
            startBg.clear();
            startBg.fillStyle(hover ? 0x336633 : 0x224422);
            startBg.fillRoundedRect(W / 2 - 80, startBtnY, 160, 36, 6);
            startBg.lineStyle(1, hover ? 0x88ff88 : 0x44aa44);
            startBg.strokeRoundedRect(W / 2 - 80, startBtnY, 160, 36, 6);
        };
        drawStart(false);
        const startText = this.add.text(W / 2, startBtnY + 18, 'バトル開始！', {
            fontSize: '15px', fill: '#88ff88', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5).setDepth(52);
        const startHit = this.add.rectangle(W / 2, startBtnY + 18, 160, 36, 0, 0)
            .setInteractive({ useHandCursor: true }).setDepth(53);
        startHit.on('pointerover', () => drawStart(true));
        startHit.on('pointerout', () => drawStart(false));
        startHit.on('pointerdown', () => {
            const destroyAll = () => {
                overlay.destroy(); title.destroy(); infoText.destroy();
                diffLabel.destroy();
                diffBtnGraphics.forEach(g => g.destroy());
                diffTexts.forEach(t => t.destroy());
                diffBtnHits.forEach(h => h.destroy());
                startBg.destroy(); startText.destroy(); startHit.destroy();
                closeBg.destroy(); closeText.destroy(); closeHit.destroy();
            };
            destroyAll();
            this.scene.start('GameScene', {
                stageId: stage.id,
                saveData: this.saveData,
                waveDensity: selectedDensity,
            });
        });

        // ─── 閉じるボタン ───
        const closeBg = this.add.graphics().setDepth(51);
        const drawClose = (hover) => {
            closeBg.clear();
            closeBg.fillStyle(hover ? 0x553333 : 0x331111);
            closeBg.fillRoundedRect(W / 2 - 40, dlgY + dlgH - 18, 80, 24, 4);
        };
        drawClose(false);
        const closeText = this.add.text(W / 2, dlgY + dlgH - 6, '閉じる', {
            fontSize: '12px', fill: '#cc8888', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5).setDepth(52);
        const closeHit = this.add.rectangle(W / 2, dlgY + dlgH - 6, 80, 24, 0, 0)
            .setInteractive({ useHandCursor: true }).setDepth(53);
        closeHit.on('pointerover', () => drawClose(true));
        closeHit.on('pointerout', () => drawClose(false));
        closeHit.on('pointerdown', () => {
            overlay.destroy(); title.destroy(); infoText.destroy();
            diffLabel.destroy();
            diffBtnGraphics.forEach(g => g.destroy());
            diffTexts.forEach(t => t.destroy());
            diffBtnHits.forEach(h => h.destroy());
            startBg.destroy(); startText.destroy(); startHit.destroy();
            closeBg.destroy(); closeText.destroy(); closeHit.destroy();
        });
    }

    createUpgradeButton(x, y, W, H) {
        const bg = this.add.graphics();
        const draw = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? 0x775522 : 0x553311);
            bg.fillRoundedRect(x - 95, y, 90, 28, 5);
            bg.lineStyle(1, hover ? 0xffcc44 : 0xaa8833);
            bg.strokeRoundedRect(x - 95, y, 90, 28, 5);
        };
        draw(false);
        const txt = this.add.text(x - 50, y + 14, '🔨 アップグレード', {
            fontSize: '10px', fill: '#ffcc44', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        const hit = this.add.rectangle(x - 50, y + 14, 90, 28, 0, 0)
            .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout', () => draw(false));
        hit.on('pointerdown', () => {
            this.scene.start('UpgradeScene');
        });
    }

    createBackButton(x, y) {
        const bg = this.add.graphics();
        const draw = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? 0x333355 : 0x222233);
            bg.fillRoundedRect(x, y - 14, 80, 28, 5);
        };
        draw(false);
        const txt = this.add.text(x + 40, y, '← メニュー', {
            fontSize: '11px', fill: '#8888aa', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        const hit = this.add.rectangle(x + 40, y, 80, 28, 0, 0)
            .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout', () => draw(false));
        hit.on('pointerdown', () => { this.scene.start('MenuScene'); });
    }

    showUnlockEffect(stageId, W, H) {
        const txt = this.add.text(W / 2, H / 2 - 20, `🔓 新しいステージ解放！\n「${STAGE_DATA[stageId]?.name}」`, {
            fontSize: '18px',
            fill: '#ffee44',
            fontFamily: 'monospace',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 3,
        }).setOrigin(0.5, 0.5).setDepth(60);

        this.tweens.add({
            targets: txt,
            y: H / 2 - 50,
            alpha: 0,
            duration: 2500,
            delay: 1000,
            onComplete: () => txt.destroy()
        });
    }
}
