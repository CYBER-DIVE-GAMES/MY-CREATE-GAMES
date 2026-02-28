// ============================================================
// UpgradeScene.js - アップグレード画面
// ============================================================

class UpgradeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeScene' });
    }

    create() {
        const { width: W, height: H } = this.scale;
        this.saveData = SaveManager.load();
        this.currentTab = 'units'; // 'units', 'castle', 'skills'

        this.drawBackground(W, H);
        this.drawHeader(W, H);
        this.createTabs(W, H);
        this.createBackButton(W, H);

        this.showTab(this.currentTab, W, H);
    }

    drawBackground(W, H) {
        const g = this.add.graphics();
        g.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x080818, 0x080818, 1);
        g.fillRect(0, 0, W, H);
    }

    drawHeader(W, H) {
        const lv = this.saveData.playerLevel;
        const gold = this.saveData.gold;
        const exp = this.saveData.playerExp;
        const expReq = SaveManager.getExpRequired(lv);

        this.add.text(W / 2, 14, 'アップグレード', {
            fontSize: '22px', fill: '#ffee88', fontFamily: 'monospace',
            stroke: '#442200', strokeThickness: 3,
        }).setOrigin(0.5, 0);

        this.goldText = this.add.text(10, 14, `Gold: ${gold}G`, {
            fontSize: '14px', fill: '#ffcc44', fontFamily: 'monospace',
        }).setOrigin(0, 0);

        this.add.text(W - 10, 14, `Lv.${lv}  EXP: ${exp}/${expReq}`, {
            fontSize: '12px', fill: '#ccccaa', fontFamily: 'monospace',
        }).setOrigin(1, 0);
    }

    createTabs(W, H) {
        const tabs = [
            { key: 'units',  label: 'ユニット' },
            { key: 'castle', label: '城' },
            { key: 'skills', label: 'スキル' },
        ];
        const tabW = 100, tabH = 28;
        const tabStartX = W / 2 - (tabs.length * (tabW + 4)) / 2;
        const tabY = 44;

        this.tabBgs = {};
        tabs.forEach((tab, i) => {
            const tx = tabStartX + i * (tabW + 4);
            const bg = this.add.graphics();
            const isActive = tab.key === this.currentTab;
            bg.fillStyle(isActive ? 0x334466 : 0x112233);
            bg.fillRoundedRect(tx, tabY, tabW, tabH, 5);
            bg.lineStyle(1, isActive ? 0x88aaff : 0x334455);
            bg.strokeRoundedRect(tx, tabY, tabW, tabH, 5);
            this.tabBgs[tab.key] = { bg, tx, tabY, tabW, tabH };

            this.add.text(tx + tabW / 2, tabY + tabH / 2, tab.label, {
                fontSize: '13px', fill: isActive ? '#ffffff' : '#888899',
                fontFamily: 'monospace',
            }).setOrigin(0.5, 0.5).setDepth(1);

            const hit = this.add.rectangle(tx + tabW / 2, tabY + tabH / 2, tabW, tabH, 0, 0)
                .setInteractive({ useHandCursor: true }).setDepth(2);
            hit.on('pointerdown', () => {
                this.scene.restart(); // タブ変更はシーンリスタートが簡単
                // より洗練した実装のために直接再描画する方法もあるが、シンプルに
            });
            hit.on('pointerdown', () => {
                this.clearContent();
                this.currentTab = tab.key;
                this.showTab(tab.key, W, H);
                // タブの見た目更新
                Object.entries(this.tabBgs).forEach(([k, info]) => {
                    info.bg.clear();
                    const isAct = k === this.currentTab;
                    info.bg.fillStyle(isAct ? 0x334466 : 0x112233);
                    info.bg.fillRoundedRect(info.tx, info.tabY, info.tabW, info.tabH, 5);
                    info.bg.lineStyle(1, isAct ? 0x88aaff : 0x334455);
                    info.bg.strokeRoundedRect(info.tx, info.tabY, info.tabW, info.tabH, 5);
                });
            });
        });
    }

    clearContent() {
        if (this.contentGroup) {
            this.contentGroup.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
        }
        this.contentGroup = [];
    }

    showTab(tabKey, W, H) {
        this.clearContent();
        this.contentGroup = [];
        const contentY = 80;

        if (tabKey === 'units') {
            this.showUnitsTab(W, H, contentY);
        } else if (tabKey === 'castle') {
            this.showCastleTab(W, H, contentY);
        } else if (tabKey === 'skills') {
            this.showSkillsTab(W, H, contentY);
        }
    }

    showUnitsTab(W, H, startY) {
        const units = ['soldier', 'archer', 'knight', 'mage', 'catapult', 'dragon'];
        const colW = (W - 20) / 2;
        const rowH = 95;

        units.forEach((unitKey, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = 10 + col * colW;
            const y = startY + row * (rowH + 6);
            this.drawUnitUpgradeCard(unitKey, x, y, colW - 8, rowH);
        });
    }

    drawUnitUpgradeCard(unitKey, x, y, w, h) {
        const config = UNIT_DATA[unitKey];
        const upgrades = this.saveData.upgrades[unitKey];
        const isUnlocked = this.saveData.playerLevel >= UNIT_UNLOCK_LEVEL[unitKey];

        const g = this.add.graphics();
        g.fillStyle(isUnlocked ? 0x112233 : 0x0a0a1a);
        g.fillRoundedRect(x, y, w, h, 6);
        g.lineStyle(1, isUnlocked ? 0x334466 : 0x1a1a2a);
        g.strokeRoundedRect(x, y, w, h, 6);
        this.contentGroup.push(g);

        // ユニット名
        const nameText = this.add.text(x + 8, y + 6, config.name, {
            fontSize: '13px', fill: isUnlocked ? '#aaccff' : '#444455', fontFamily: 'monospace',
        }).setDepth(2);
        this.contentGroup.push(nameText);

        if (!isUnlocked) {
            const lockT = this.add.text(x + w / 2, y + h / 2, `Lv${UNIT_UNLOCK_LEVEL[unitKey]}で解放`, {
                fontSize: '11px', fill: '#666677', fontFamily: 'monospace',
            }).setOrigin(0.5, 0.5).setDepth(2);
            this.contentGroup.push(lockT);
            return;
        }

        // 3種のアップグレードバー（HP/攻撃/速度）
        const stats = ['hp', 'attack', 'speed'];
        const statLabels = ['HP', '攻撃', '速度'];
        const statColors = [0xff4444, 0xff8800, 0x44ff44];

        stats.forEach((stat, si) => {
            const level = upgrades[stat] || 0;
            const maxLevel = 5;
            const barY = y + 24 + si * 20;
            const barX = x + 35;
            const barW = w - 45 - 60;

            const slbl = this.add.text(x + 8, barY + 1, statLabels[si], {
                fontSize: '10px', fill: '#8899aa', fontFamily: 'monospace',
            }).setDepth(2);
            this.contentGroup.push(slbl);

            // バー背景
            const barBg = this.add.graphics().setDepth(2);
            barBg.fillStyle(0x112244);
            barBg.fillRect(barX, barY, barW, 12);
            this.contentGroup.push(barBg);

            // バーfill
            const barFill = this.add.graphics().setDepth(3);
            barFill.fillStyle(statColors[si]);
            barFill.fillRect(barX + 1, barY + 1, Math.floor((barW - 2) * level / maxLevel), 10);
            this.contentGroup.push(barFill);

            // レベル表示
            const lvTxt = this.add.text(barX + barW + 4, barY + 1, `${level}/${maxLevel}`, {
                fontSize: '10px', fill: '#aabbcc', fontFamily: 'monospace',
            }).setDepth(2);
            this.contentGroup.push(lvTxt);

            // 強化ボタン
            if (level < maxLevel) {
                const cost = SaveManager.getUpgradeCost(unitKey, stat, level);
                const canAfford = this.saveData.gold >= cost;
                const btnX = x + w - 58;
                const btnBg = this.add.graphics().setDepth(3);
                const drawBtn = (hover) => {
                    btnBg.clear();
                    btnBg.fillStyle(hover && canAfford ? 0x225533 : canAfford ? 0x113322 : 0x1a1a1a);
                    btnBg.fillRoundedRect(btnX, barY - 1, 55, 14, 3);
                    btnBg.lineStyle(1, canAfford ? 0x44aa66 : 0x333333);
                    btnBg.strokeRoundedRect(btnX, barY - 1, 55, 14, 3);
                };
                drawBtn(false);
                this.contentGroup.push(btnBg);

                const costTxt = this.add.text(btnX + 28, barY + 6, `${cost}G`, {
                    fontSize: '9px', fill: canAfford ? '#88ff88' : '#444444', fontFamily: 'monospace',
                }).setOrigin(0.5, 0.5).setDepth(4);
                this.contentGroup.push(costTxt);

                if (canAfford) {
                    const hit = this.add.rectangle(btnX + 28, barY + 6, 55, 14, 0, 0)
                        .setInteractive({ useHandCursor: true }).setDepth(5);
                    this.contentGroup.push(hit);
                    hit.on('pointerover', () => drawBtn(true));
                    hit.on('pointerout', () => drawBtn(false));
                    hit.on('pointerdown', () => {
                        const result = SaveManager.applyUpgrade(this.saveData, unitKey, stat);
                        if (result.success) {
                            SaveManager.save(this.saveData);
                            this.goldText.setText(`Gold: ${this.saveData.gold}G`);
                            this.clearContent();
                            this.showTab('units', this.scale.width, this.scale.height);
                        }
                    });
                }
            }
        });
    }

    showCastleTab(W, H, startY) {
        const stats = ['hp', 'defense', 'manaRegen'];
        const labels = ['城壁強化', '防御強化', 'マナ回復'];
        const descs  = ['最大HP +20%', '被ダメージ -15%', 'マナ回復 +20%'];
        const colors = [0xff4444, 0x8888ff, 0x44aaff];

        const cardW = W - 40;
        const cardH = 80;

        stats.forEach((stat, i) => {
            const cx = 20;
            const cy = startY + i * (cardH + 10);
            const level = this.saveData.upgrades.castle[stat] || 0;
            const maxLevel = 5;

            const g = this.add.graphics();
            g.fillStyle(0x111122);
            g.fillRoundedRect(cx, cy, cardW, cardH, 7);
            g.lineStyle(1, 0x334455);
            g.strokeRoundedRect(cx, cy, cardW, cardH, 7);
            this.contentGroup.push(g);

            this.contentGroup.push(this.add.text(cx + 10, cy + 8, labels[i], {
                fontSize: '14px', fill: '#aaccff', fontFamily: 'monospace',
            }).setDepth(2));

            this.contentGroup.push(this.add.text(cx + 10, cy + 28, descs[i], {
                fontSize: '11px', fill: '#778899', fontFamily: 'monospace',
            }).setDepth(2));

            // レベルバー
            const barX = cx + 10;
            const barY = cy + 50;
            const barW = cardW - 100;
            const barBg = this.add.graphics().setDepth(2);
            barBg.fillStyle(0x112244);
            barBg.fillRect(barX, barY, barW, 14);
            this.contentGroup.push(barBg);

            const barFill = this.add.graphics().setDepth(3);
            barFill.fillStyle(colors[i]);
            barFill.fillRect(barX + 1, barY + 1, Math.floor((barW - 2) * level / maxLevel), 12);
            this.contentGroup.push(barFill);

            this.contentGroup.push(this.add.text(barX + barW + 6, barY + 2, `Lv.${level}/${maxLevel}`, {
                fontSize: '11px', fill: '#aabbcc', fontFamily: 'monospace',
            }).setDepth(2));

            if (level < maxLevel) {
                const cost = SaveManager.getUpgradeCost('castle', stat, level);
                const canAfford = this.saveData.gold >= cost;
                const btnX = cx + cardW - 80;
                const btnY = cy + 12;

                const btnBg = this.add.graphics().setDepth(3);
                const drawBtn = (hover) => {
                    btnBg.clear();
                    btnBg.fillStyle(hover && canAfford ? 0x335533 : canAfford ? 0x223322 : 0x1a1a1a);
                    btnBg.fillRoundedRect(btnX, btnY, 70, 28, 5);
                    btnBg.lineStyle(1, canAfford ? 0x55aa55 : 0x333333);
                    btnBg.strokeRoundedRect(btnX, btnY, 70, 28, 5);
                };
                drawBtn(false);
                this.contentGroup.push(btnBg);

                this.contentGroup.push(this.add.text(btnX + 35, btnY + 14, `${cost}G`, {
                    fontSize: '13px', fill: canAfford ? '#88ff88' : '#444444', fontFamily: 'monospace',
                }).setOrigin(0.5, 0.5).setDepth(4));

                if (canAfford) {
                    const hit = this.add.rectangle(btnX + 35, btnY + 14, 70, 28, 0, 0)
                        .setInteractive({ useHandCursor: true }).setDepth(5);
                    this.contentGroup.push(hit);
                    hit.on('pointerover', () => drawBtn(true));
                    hit.on('pointerout', () => drawBtn(false));
                    hit.on('pointerdown', () => {
                        const result = SaveManager.applyUpgrade(this.saveData, 'castle', stat);
                        if (result.success) {
                            SaveManager.save(this.saveData);
                            this.goldText.setText(`Gold: ${this.saveData.gold}G`);
                            this.clearContent();
                            this.showTab('castle', this.scale.width, this.scale.height);
                        }
                    });
                }
            } else {
                this.contentGroup.push(this.add.text(cx + cardW - 60, cy + cardH / 2, 'MAX', {
                    fontSize: '16px', fill: '#ffee44', fontFamily: 'monospace',
                }).setOrigin(0.5, 0.5).setDepth(2));
            }
        });
    }

    showSkillsTab(W, H, startY) {
        const skills = ['fireBolt', 'shieldWall', 'arrowRain'];
        const skillInfo = {
            fireBolt:   { name: '🔥 火炎弾', desc: '敵範囲にダメージ\nCD: 15秒', color: 0xcc4400 },
            shieldWall: { name: '🛡 鉄壁',   desc: '城防御2倍 (5秒間)\nCD: 20秒', color: 0x4444cc },
            arrowRain:  { name: '🏹 矢雨',   desc: '全敵にダメージ\nCD: 18秒', color: 0x44aa44 },
        };

        const cardW = W - 40;
        const cardH = 105;

        skills.forEach((skillName, i) => {
            const info = skillInfo[skillName];
            const skillSave = this.saveData.skills[skillName];
            const isUnlocked = skillSave && skillSave.unlocked;
            const unlockCost = UPGRADE_DATA.skills[skillName].unlock.cost;

            const cx = 20;
            const cy = startY + i * (cardH + 10);

            const g = this.add.graphics();
            g.fillStyle(isUnlocked ? 0x1a1100 : 0x110a00);
            g.fillRoundedRect(cx, cy, cardW, cardH, 7);
            g.lineStyle(1, isUnlocked ? 0x886633 : 0x443311);
            g.strokeRoundedRect(cx, cy, cardW, cardH, 7);
            this.contentGroup.push(g);

            this.contentGroup.push(this.add.text(cx + 10, cy + 8, info.name, {
                fontSize: '15px', fill: isUnlocked ? '#ffcc44' : '#886633', fontFamily: 'monospace',
            }).setDepth(2));

            this.contentGroup.push(this.add.text(cx + 10, cy + 30, info.desc, {
                fontSize: '11px', fill: '#998877', fontFamily: 'monospace', lineSpacing: 3,
            }).setDepth(2));

            if (!isUnlocked) {
                const canAfford = this.saveData.gold >= unlockCost;
                const btnX = cx + cardW - 100;
                const btnY = cy + cardH / 2 - 18;

                const btnBg = this.add.graphics().setDepth(3);
                const drawBtn = (hover) => {
                    btnBg.clear();
                    btnBg.fillStyle(hover && canAfford ? 0x553300 : canAfford ? 0x331100 : 0x1a1a1a);
                    btnBg.fillRoundedRect(btnX, btnY, 88, 36, 6);
                    btnBg.lineStyle(1, canAfford ? 0xcc8833 : 0x333333);
                    btnBg.strokeRoundedRect(btnX, btnY, 88, 36, 6);
                };
                drawBtn(false);
                this.contentGroup.push(btnBg);

                this.contentGroup.push(this.add.text(btnX + 44, btnY + 10, '解放', {
                    fontSize: '13px', fill: canAfford ? '#ffaa44' : '#555555', fontFamily: 'monospace',
                }).setOrigin(0.5, 0).setDepth(4));
                this.contentGroup.push(this.add.text(btnX + 44, btnY + 25, `${unlockCost}G`, {
                    fontSize: '11px', fill: canAfford ? '#ffcc88' : '#444444', fontFamily: 'monospace',
                }).setOrigin(0.5, 0).setDepth(4));

                if (canAfford) {
                    const hit = this.add.rectangle(btnX + 44, btnY + 18, 88, 36, 0, 0)
                        .setInteractive({ useHandCursor: true }).setDepth(5);
                    this.contentGroup.push(hit);
                    hit.on('pointerover', () => drawBtn(true));
                    hit.on('pointerout', () => drawBtn(false));
                    hit.on('pointerdown', () => {
                        const result = SaveManager.unlockSkill(this.saveData, skillName);
                        if (result.success) {
                            SaveManager.save(this.saveData);
                            this.goldText.setText(`Gold: ${this.saveData.gold}G`);
                            this.clearContent();
                            this.showTab('skills', this.scale.width, this.scale.height);
                        }
                    });
                }
            } else {
                // スキル解放済み - レベルアップ表示
                this.contentGroup.push(this.add.text(cx + 10, cy + 58, '解放済み ✓', {
                    fontSize: '12px', fill: '#88ff88', fontFamily: 'monospace',
                }).setDepth(2));
            }
        });
    }

    createBackButton(W, H) {
        const bg = this.add.graphics();
        const draw = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? 0x333355 : 0x222233);
            bg.fillRoundedRect(10, H - 38, 120, 28, 5);
        };
        draw(false);
        this.add.text(70, H - 24, '← ステージ選択', {
            fontSize: '11px', fill: '#8888aa', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5).setDepth(2);

        const hit = this.add.rectangle(70, H - 24, 120, 28, 0, 0)
            .setInteractive({ useHandCursor: true }).setDepth(3);
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout', () => draw(false));
        hit.on('pointerdown', () => { this.scene.start('WorldMapScene'); });
    }
}
