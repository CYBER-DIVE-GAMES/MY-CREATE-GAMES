// ============================================================
// UIManager.js - HUD・ボタン管理
// ============================================================

const DEPLOY_UNITS = ['soldier', 'archer', 'knight', 'mage', 'catapult', 'dragon'];
const UNIT_UNLOCK_LEVEL = { soldier: 1, archer: 1, knight: 3, mage: 5, catapult: 8, dragon: 12 };
const SKILL_NAMES = ['fireBolt', 'shieldWall', 'arrowRain'];
const SKILL_LABELS = { fireBolt: '🔥火炎弾', shieldWall: '🛡鉄壁', arrowRain: '🏹矢雨' };

class UIManager {
    constructor(scene, saveData) {
        this.scene = scene;
        this.saveData = saveData;
        this.playerLevel = saveData.playerLevel;

        // HUD定数
        this.HUD_Y = scene.HUD_Y;
        this.GW = scene.GW;

        // ユニットボタン
        this.unitButtons = [];
        this.skillButtons = [];
        this.cooldownTimers = {};

        // マナバー
        this.manaBarBg = null;
        this.manaBarFill = null;
        this.manaText = null;

        // ウェーブテキスト
        this.waveText = null;

        // ステータステキスト
        this.playerHpText = null;
        this.enemyHpText = null;

        this.createHUD();
    }

    createHUD() {
        const scene = this.scene;
        const HY = this.HUD_Y;
        const GW = this.GW;

        // ============ HUD背景 ============
        const hudBg = scene.add.graphics();
        hudBg.setDepth(18);
        hudBg.fillStyle(0x111122, 0.92);
        hudBg.fillRect(0, HY, GW, scene.GH - HY);
        hudBg.lineStyle(2, 0x444466);
        hudBg.strokeRect(0, HY, GW, scene.GH - HY);

        // ============ マナバー ============
        const manaLabelX = 10;
        const manaBarX = 60;
        const manaBarW = GW - 70;
        const manaBarY = HY + 10;
        const manaBarH = 14;

        scene.add.text(manaLabelX, manaBarY + 1, 'MP:', {
            fontSize: '12px', fill: '#88aaff', fontFamily: 'monospace'
        }).setDepth(20).setOrigin(0, 0);

        this.manaBarBg = scene.add.graphics().setDepth(19);
        this.manaBarBg.fillStyle(0x112244);
        this.manaBarBg.fillRect(manaBarX, manaBarY, manaBarW, manaBarH);
        this.manaBarBg.lineStyle(1, 0x334466);
        this.manaBarBg.strokeRect(manaBarX, manaBarY, manaBarW, manaBarH);

        this.manaBarFill = scene.add.graphics().setDepth(20);
        this.manaBarFillX = manaBarX;
        this.manaBarFillY = manaBarY;
        this.manaBarFillW = manaBarW;
        this.manaBarFillH = manaBarH;

        this.manaText = scene.add.text(GW / 2, manaBarY + manaBarH / 2, '', {
            fontSize: '10px', fill: '#ffffff', fontFamily: 'monospace'
        }).setDepth(21).setOrigin(0.5, 0.5);

        // ============ ウェーブ情報 ============
        this.waveText = scene.add.text(GW - 10, HY + 12, '', {
            fontSize: '11px', fill: '#ffcc44', fontFamily: 'monospace'
        }).setDepth(20).setOrigin(1, 0);

        // ============ 難易度（ウェーブ密度）表示 ============
        const density = scene.waveDensity || 1.0;
        const diffLabel = density <= 0.7 ? 'やさしい' : density <= 1.0 ? 'ふつう' : density <= 1.5 ? 'むずかしい' : '地獄';
        const diffColor = density <= 0.7 ? '#4488ff' : density <= 1.0 ? '#44cc44' : density <= 1.5 ? '#ffaa00' : '#ff2244';
        scene.add.text(10, HY + 12, `密度: ${diffLabel}`, {
            fontSize: '10px', fill: diffColor, fontFamily: 'monospace',
        }).setDepth(20).setOrigin(0, 0);

        // ============ ユニットデプロイボタン ============
        const btnW = 105, btnH = 62;
        const btnStartX = 10;
        const btnStartY = HY + 30;
        const btnGapX = 4;
        const btnGapY = 4;

        DEPLOY_UNITS.forEach((unitKey, i) => {
            const col = i % 4;
            const row = Math.floor(i / 4);
            const bx = btnStartX + col * (btnW + btnGapX);
            const by = btnStartY + row * (btnH + btnGapY);

            const btn = this.createUnitButton(unitKey, bx, by, btnW, btnH);
            this.unitButtons.push(btn);
        });

        // ============ スキルボタン ============
        const skillBtnW = 100;
        const skillBtnH = 36;
        const skillStartX = btnStartX + 4 * (btnW + btnGapX) + 10;
        const skillStartY = btnStartY;

        SKILL_NAMES.forEach((skillName, i) => {
            const bx = skillStartX;
            const by = skillStartY + i * (skillBtnH + 6);
            const btn = this.createSkillButton(skillName, bx, by, skillBtnW, skillBtnH);
            this.skillButtons.push(btn);
        });
    }

    createUnitButton(unitKey, x, y, w, h) {
        const scene = this.scene;
        const config = UNIT_DATA[unitKey];
        const unlockLv = UNIT_UNLOCK_LEVEL[unitKey];
        const isLocked = this.playerLevel < unlockLv;

        const container = scene.add.container(0, 0).setDepth(20);

        // ボタン背景
        const bgColor = isLocked ? 0x222233 : 0x223355;
        const bgGraphics = scene.add.graphics();
        bgGraphics.fillStyle(bgColor);
        bgGraphics.fillRoundedRect(x, y, w, h, 5);
        bgGraphics.lineStyle(1, isLocked ? 0x333344 : 0x4466aa);
        bgGraphics.strokeRoundedRect(x, y, w, h, 5);
        bgGraphics.setDepth(20);

        // ユニット名
        const nameText = scene.add.text(x + w / 2, y + 8, config.name, {
            fontSize: '11px',
            fill: isLocked ? '#666677' : '#aaccff',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0).setDepth(21);

        // コスト表示
        const costText = scene.add.text(x + w / 2, y + h - 10, `${config.cost}MP`, {
            fontSize: '10px',
            fill: isLocked ? '#555566' : '#88aaff',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 1).setDepth(21);

        // ロック表示
        let lockText = null;
        if (isLocked) {
            lockText = scene.add.text(x + w / 2, y + h / 2, `Lv${unlockLv}解放`, {
                fontSize: '10px',
                fill: '#886644',
                fontFamily: 'monospace',
            }).setOrigin(0.5, 0.5).setDepth(21);
        }

        // クールダウンオーバーレイ
        const cdOverlay = scene.add.graphics().setDepth(25);

        // ミニスプライト表示（小さいピクセルアート）
        const miniGraphics = this.createMiniSprite(unitKey, x + w / 2 - 12, y + 20, isLocked);

        // ボタン当たり判定用の透明矩形
        if (!isLocked) {
            const hitArea = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0)
                .setInteractive({ useHandCursor: true })
                .setDepth(22);

            hitArea.on('pointerdown', () => {
                scene.deployUnit(unitKey);
                this.flashButton(bgGraphics, x, y, w, h, 5);
            });

            hitArea.on('pointerover', () => {
                bgGraphics.clear();
                bgGraphics.fillStyle(0x334466);
                bgGraphics.fillRoundedRect(x, y, w, h, 5);
                bgGraphics.lineStyle(1, 0x6688cc);
                bgGraphics.strokeRoundedRect(x, y, w, h, 5);
            });

            hitArea.on('pointerout', () => {
                bgGraphics.clear();
                bgGraphics.fillStyle(0x223355);
                bgGraphics.fillRoundedRect(x, y, w, h, 5);
                bgGraphics.lineStyle(1, 0x4466aa);
                bgGraphics.strokeRoundedRect(x, y, w, h, 5);
            });
        }

        return {
            unitKey,
            bgGraphics,
            nameText,
            costText,
            lockText,
            cdOverlay,
            miniGraphics,
            isLocked,
            x, y, w, h,
        };
    }

    createMiniSprite(unitKey, x, y, isLocked) {
        const scene = this.scene;
        const pixels = UNIT_PIXELS[unitKey];
        if (!pixels) return null;

        const g = scene.add.graphics().setDepth(21);
        const ps = 2;
        const cols = pixels[0].length;
        const rows = pixels.length;

        for (let row = 0; row < rows && row < 12; row++) {
            for (let col = 0; col < cols; col++) {
                const ch = pixels[row][col];
                let color = PC[ch];
                if (color === null || color === undefined) continue;
                if (isLocked) {
                    // ロック中はグレーアウト
                    const r = Math.floor(((color >> 16) & 0xff) * 0.25);
                    const g2 = Math.floor(((color >> 8) & 0xff) * 0.25);
                    const b = Math.floor((color & 0xff) * 0.25);
                    color = (r << 16) | (g2 << 8) | b;
                }
                g.fillStyle(color);
                g.fillRect(x + col * ps, y + row * ps, ps, ps);
            }
        }
        return g;
    }

    createSkillButton(skillName, x, y, w, h) {
        const scene = this.scene;
        const skill = this.saveData.skills[skillName];
        const isUnlocked = skill && skill.unlocked;
        const label = SKILL_LABELS[skillName] || skillName;

        const bgGraphics = scene.add.graphics().setDepth(20);
        const bgColor = isUnlocked ? 0x442200 : 0x222222;
        bgGraphics.fillStyle(bgColor);
        bgGraphics.fillRoundedRect(x, y, w, h, 4);
        bgGraphics.lineStyle(1, isUnlocked ? 0xcc6600 : 0x333333);
        bgGraphics.strokeRoundedRect(x, y, w, h, 4);

        const labelText = scene.add.text(x + w / 2, y + h / 2 - 6, label, {
            fontSize: '11px',
            fill: isUnlocked ? '#ffcc44' : '#555555',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5).setDepth(21);

        const cdText = scene.add.text(x + w / 2, y + h - 8, isUnlocked ? '準備完了' : '未解放', {
            fontSize: '9px',
            fill: isUnlocked ? '#88ff88' : '#444444',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 1).setDepth(21);

        const cdOverlay = scene.add.graphics().setDepth(25);

        if (isUnlocked) {
            const hitArea = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xffffff, 0)
                .setInteractive({ useHandCursor: true })
                .setDepth(22);

            hitArea.on('pointerdown', () => {
                scene.useSkill(skillName);
            });

            hitArea.on('pointerover', () => {
                bgGraphics.clear();
                bgGraphics.fillStyle(0x663300);
                bgGraphics.fillRoundedRect(x, y, w, h, 4);
                bgGraphics.lineStyle(1, 0xee8800);
                bgGraphics.strokeRoundedRect(x, y, w, h, 4);
            });

            hitArea.on('pointerout', () => {
                bgGraphics.clear();
                bgGraphics.fillStyle(0x442200);
                bgGraphics.fillRoundedRect(x, y, w, h, 4);
                bgGraphics.lineStyle(1, 0xcc6600);
                bgGraphics.strokeRoundedRect(x, y, w, h, 4);
            });
        }

        this.cooldownTimers[skillName] = {
            ready: true,
            cdText,
            cdOverlay,
            x, y, w, h,
        };

        return { skillName, bgGraphics, labelText, cdText, cdOverlay, isUnlocked, x, y, w, h };
    }

    flashButton(bg, x, y, w, h, r) {
        // ボタン押下フラッシュ
        bg.clear();
        bg.fillStyle(0x5577cc);
        bg.fillRoundedRect(x, y, w, h, r);
        bg.lineStyle(2, 0x88aaff);
        bg.strokeRoundedRect(x, y, w, h, r);

        this.scene.time.delayedCall(120, () => {
            bg.clear();
            bg.fillStyle(0x223355);
            bg.fillRoundedRect(x, y, w, h, r);
            bg.lineStyle(1, 0x4466aa);
            bg.strokeRoundedRect(x, y, w, h, r);
        });
    }

    update(time) {
        const scene = this.scene;
        const mana = scene.mana;
        const maxMana = scene.maxMana;

        // マナバー更新
        this.manaBarFill.clear();
        const ratio = mana / maxMana;
        const col = ratio > 0.6 ? 0x4488ff : ratio > 0.3 ? 0x2266cc : 0x114488;
        this.manaBarFill.fillStyle(col);
        this.manaBarFill.fillRect(
            this.manaBarFillX + 1,
            this.manaBarFillY + 1,
            Math.floor((this.manaBarFillW - 2) * ratio),
            this.manaBarFillH - 2
        );
        this.manaText.setText(`${Math.floor(mana)} / ${maxMana}`);

        // ユニットボタン: マナ不足時グレーアウト
        this.unitButtons.forEach(btn => {
            if (btn.isLocked) return;
            const cost = UNIT_DATA[btn.unitKey].cost;
            const canAfford = mana >= cost;
            btn.costText.setStyle({
                fill: canAfford ? '#88aaff' : '#556677',
                fontFamily: 'monospace',
                fontSize: '10px',
            });
        });

        // スキルクールダウン表示
        SKILL_NAMES.forEach(skillName => {
            const cdInfo = this.cooldownTimers[skillName];
            if (!cdInfo) return;
            const skillState = scene.skills[skillName];
            if (!skillState) return;

            if (skillState.ready) {
                cdInfo.cdText.setText('準備完了').setStyle({ fill: '#88ff88', fontFamily: 'monospace', fontSize: '9px' });
                cdInfo.cdOverlay.clear();
            } else {
                const remaining = skillState.cooldown - (time - skillState.lastUsed);
                const remainSec = Math.ceil(remaining / 1000);
                cdInfo.cdText.setText(`${remainSec}s`).setStyle({ fill: '#ffaa44', fontFamily: 'monospace', fontSize: '9px' });

                // クールダウンオーバーレイ
                const progress = 1 - remaining / skillState.cooldown;
                cdInfo.cdOverlay.clear();
                cdInfo.cdOverlay.fillStyle(0x000000, 0.5);
                cdInfo.cdOverlay.fillRect(cdInfo.x, cdInfo.y, cdInfo.w, cdInfo.h * (1 - progress));
            }
        });

        // ウェーブ情報更新
        if (scene.waveManager) {
            const allDone = scene.waveManager.isComplete();
            const remaining = scene.enemyUnits.filter(u => !u.isDead).length;
            if (allDone) {
                this.waveText.setText(`残敵: ${remaining}`);
            } else {
                const prog = Math.floor(scene.waveManager.getProgress() * 100);
                this.waveText.setText(`ウェーブ: ${prog}%`);
            }
        }
    }

    showMessage(text, duration = 2000, color = '#ffffff') {
        const scene = this.scene;
        const msg = scene.add.text(scene.GW / 2, scene.GH / 2 - 50, text, {
            fontSize: '24px',
            fill: color,
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 4,
            backgroundColor: '#00000088',
            padding: { x: 16, y: 8 },
        }).setOrigin(0.5, 0.5).setDepth(50);

        scene.tweens.add({
            targets: msg,
            y: scene.GH / 2 - 80,
            alpha: 0,
            duration: duration,
            onComplete: () => msg.destroy()
        });
    }
}
