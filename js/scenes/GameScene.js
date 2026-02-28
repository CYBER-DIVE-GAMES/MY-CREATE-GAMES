// ============================================================
// GameScene.js - メインゲームプレイシーン
// ============================================================

const GAME_CONSTANTS = {
    GROUND_Y: 310,
    HUD_Y: 330,
    PLAYER_CASTLE_X: 80,
    ENEMY_CASTLE_X: 720,
};

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init(data) {
        this.stageId  = data.stageId !== undefined ? data.stageId : 0;
        this.saveData = data.saveData || SaveManager.load();
    }

    create() {
        const { width: W, height: H } = this.scale;
        this.GW = W;
        this.GH = H;
        this.GROUND_Y = GAME_CONSTANTS.GROUND_Y;
        this.HUD_Y    = GAME_CONSTANTS.HUD_Y;

        // ゲーム状態
        this.playerUnits = [];
        this.enemyUnits  = [];
        this.projectiles = [];
        this.gameOver    = false;
        this.paused      = false;
        this.victoryProcessed = false;
        this.defeatProcessed  = false;
        this.battleStartTime  = null;

        // マナ
        const castleStats = SaveManager.getCastleStats(this.saveData);
        this.mana     = 50;
        this.maxMana  = 100;
        this.manaRegen = castleStats.manaRegen; // per second

        // スキル状態
        this.skills = this.initSkills();

        // 背景
        const stageData = STAGE_DATA[this.stageId] || STAGE_DATA[0];
        this.drawBackground(W, H, stageData);

        // 城
        this.playerCastle = new Castle(
            this, GAME_CONSTANTS.PLAYER_CASTLE_X, true, castleStats
        );
        this.enemyCastle = new Castle(
            this, GAME_CONSTANTS.ENEMY_CASTLE_X, false, { maxHp: stageData.castleHp, defense: 0 }
        );

        // WaveManager
        this.waveManager = new WaveManager(this, stageData, this.saveData.upgrades);

        // UIManager
        this.uiManager = new UIManager(this, this.saveData);

        // ポーズボタン
        this.createPauseButton(W);

        // カウントダウン開始
        this.startCountdown(W, H);
    }

    initSkills() {
        const skillNames = ['fireBolt', 'shieldWall', 'arrowRain'];
        const skills = {};
        skillNames.forEach(name => {
            const stats = SaveManager.getSkillStats(this.saveData, name);
            skills[name] = {
                ready: true,
                lastUsed: -999999,
                cooldown: stats ? stats.cooldown : 15000,
                stats: stats,
                active: false,
            };
        });
        return skills;
    }

    drawBackground(W, H, stageData) {
        const g = this.add.graphics();

        // 空
        const skyColor = stageData.bgColor || 0x4a8f3f;
        const skyDark = Phaser.Display.Color.IntegerToColor(skyColor);
        g.fillGradientStyle(0x0a0a1a, 0x0a0a1a, skyColor, skyColor, 1);
        g.fillRect(0, 0, W, H * 0.7);

        // 地面
        const groundColor = this.blendColor(skyColor, 0x1a1a0a, 0.5);
        g.fillStyle(groundColor);
        g.fillRect(0, this.GROUND_Y - 5, W, H - this.GROUND_Y + 5);

        // 地面のライン
        g.fillStyle(0x334433);
        g.fillRect(0, this.GROUND_Y - 5, W, 3);

        // 遠景（山・木など）
        this.drawFarBackground(g, W, H, stageData.world || 1);

        // 星（夜のワールドは濃く）
        g.fillStyle(0xffffff, 0.3);
        for (let i = 0; i < 25; i++) {
            g.fillRect(Phaser.Math.Between(0, W), Phaser.Math.Between(0, this.GROUND_Y * 0.7), 1, 1);
        }
    }

    drawFarBackground(g, W, H, world) {
        const groundY = this.GROUND_Y;

        if (world === 1) {
            // 草原: 緑の丘
            g.fillStyle(0x2a4a1a);
            g.fillEllipse(120, groundY - 20, 200, 80);
            g.fillEllipse(600, groundY - 15, 180, 60);
            g.fillStyle(0x1a3a0a);
            g.fillEllipse(320, groundY - 30, 240, 100);
        } else if (world === 2) {
            // 砂漠: 砂丘
            g.fillStyle(0x7a5a1a);
            g.fillEllipse(150, groundY - 10, 250, 60);
            g.fillEllipse(600, groundY - 15, 200, 55);
            g.fillEllipse(380, groundY - 25, 280, 80);
        } else if (world === 3) {
            // 雪山: 白い山
            g.fillStyle(0xaabbcc);
            g.fillTriangle(80, groundY - 5, 200, groundY - 100, 320, groundY - 5);
            g.fillTriangle(500, groundY - 5, 640, groundY - 120, 780, groundY - 5);
            g.fillStyle(0xeeeeff);
            g.fillTriangle(130, groundY - 60, 200, groundY - 100, 270, groundY - 60);
            g.fillTriangle(560, groundY - 70, 640, groundY - 120, 720, groundY - 70);
        } else if (world === 4) {
            // 魔の森: 暗い木々
            for (let i = 0; i < 6; i++) {
                const tx = 80 + i * 110;
                g.fillStyle(0x0a1a0a);
                g.fillTriangle(tx, groundY - 5, tx + 15, groundY - 70, tx + 30, groundY - 5);
                g.fillRect(tx + 11, groundY - 20, 8, 25);
            }
        } else {
            // 竜の巣: 岩と炎
            g.fillStyle(0x2a0a00);
            g.fillRect(0, groundY - 30, W, 30);
            g.fillStyle(0x3a0a00);
            for (let i = 0; i < 5; i++) {
                const rx = 80 + i * 140;
                g.fillRect(rx, groundY - 70, 30, 65);
            }
            // 炎のエフェクト
            g.fillStyle(0xff4400, 0.4);
            g.fillRect(0, groundY - 10, W, 10);
        }
    }

    blendColor(c1, c2, t) {
        const r1 = (c1 >> 16) & 0xff, g1 = (c1 >> 8) & 0xff, b1 = c1 & 0xff;
        const r2 = (c2 >> 16) & 0xff, g2 = (c2 >> 8) & 0xff, b2 = c2 & 0xff;
        const r = Math.floor(r1 + (r2 - r1) * t);
        const g = Math.floor(g1 + (g2 - g1) * t);
        const b = Math.floor(b1 + (b2 - b1) * t);
        return (r << 16) | (g << 8) | b;
    }

    startCountdown(W, H) {
        let count = 3;
        const cText = this.add.text(W / 2, H * 0.45, `${count}`, {
            fontSize: '72px',
            fill: '#ffffff',
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 6,
        }).setOrigin(0.5, 0.5).setDepth(60);

        const countdown = () => {
            this.tweens.add({
                targets: cText,
                scaleX: 1.4,
                scaleY: 1.4,
                alpha: 0,
                duration: 900,
                onComplete: () => {
                    count--;
                    if (count > 0) {
                        cText.setText(`${count}`).setAlpha(1).setScale(1);
                        countdown();
                    } else {
                        cText.setText('開始！').setAlpha(1).setScale(1)
                            .setStyle({ fill: '#88ff88', fontSize: '48px' });
                        this.tweens.add({
                            targets: cText,
                            scaleX: 1.5,
                            scaleY: 1.5,
                            alpha: 0,
                            duration: 800,
                            onComplete: () => cText.destroy()
                        });
                        // バトル開始
                        this.battleStartTime = this.time.now;
                        this.waveManager.start(this.time.now);
                    }
                }
            });
        };
        countdown();
    }

    createPauseButton(W) {
        const bg = this.add.graphics().setDepth(30);
        const draw = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? 0x334455 : 0x223344, 0.8);
            bg.fillRoundedRect(W - 42, 4, 38, 24, 5);
        };
        draw(false);
        this.add.text(W - 23, 16, '⏸', {
            fontSize: '14px', fill: '#aabbcc',
        }).setOrigin(0.5, 0.5).setDepth(31);

        const hit = this.add.rectangle(W - 23, 16, 38, 24, 0, 0)
            .setInteractive({ useHandCursor: true }).setDepth(32);
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout', () => draw(false));
        hit.on('pointerdown', () => this.togglePause());

        this.pauseButton = { bg, hit, draw };
    }

    togglePause() {
        this.paused = !this.paused;
        if (this.paused) {
            this.showPauseMenu();
        }
    }

    showPauseMenu() {
        const { width: W, height: H } = this.scale;
        const overlay = this.add.graphics().setDepth(70);
        overlay.fillStyle(0x000000, 0.6);
        overlay.fillRect(0, 0, W, H);

        const dlgW = 260, dlgH = 180;
        overlay.fillStyle(0x111133);
        overlay.fillRoundedRect(W / 2 - dlgW / 2, H / 2 - dlgH / 2, dlgW, dlgH, 10);
        overlay.lineStyle(2, 0x4466aa);
        overlay.strokeRoundedRect(W / 2 - dlgW / 2, H / 2 - dlgH / 2, dlgW, dlgH, 10);

        const title = this.add.text(W / 2, H / 2 - 60, 'ポーズ中', {
            fontSize: '22px', fill: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5).setDepth(71);

        const resumeBtn = this.createPauseMenuButton(W / 2, H / 2 - 15, 160, 36, '再開', 0x224422, 0x336633, () => {
            overlay.destroy(); title.destroy(); resumeBtn.destroy(); retireBtn.destroy();
            this.paused = false;
        });

        const retireBtn = this.createPauseMenuButton(W / 2, H / 2 + 35, 160, 36, 'リタイア', 0x441111, 0x662222, () => {
            this.scene.start('WorldMapScene');
        });
    }

    createPauseMenuButton(x, y, w, h, label, bgColor, hoverColor, callback) {
        const container = this.add.container(0, 0).setDepth(72);
        const bg = this.add.graphics().setDepth(72);
        const draw = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? hoverColor : bgColor);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
            bg.lineStyle(1, 0x8899aa);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        };
        draw(false);
        const txt = this.add.text(x, y, label, {
            fontSize: '15px', fill: '#ffffff', fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5).setDepth(73);

        const hit = this.add.rectangle(x, y, w, h, 0, 0)
            .setInteractive({ useHandCursor: true }).setDepth(74);
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout', () => draw(false));
        hit.on('pointerdown', callback);

        return { destroy: () => { bg.destroy(); txt.destroy(); hit.destroy(); } };
    }

    update(time, delta) {
        if (this.gameOver) return;
        if (this.paused) return;
        if (this.battleStartTime === null) return; // カウントダウン中

        // マナ回復
        this.mana = Math.min(this.maxMana, this.mana + this.manaRegen * (delta / 1000));

        // ウェーブ更新
        this.waveManager.update(time);

        // ユニット更新（死亡済みをフィルタ）
        this.playerUnits = this.playerUnits.filter(u => !u.isDead);
        this.enemyUnits  = this.enemyUnits.filter(u => !u.isDead);

        this.playerUnits.forEach(u => u.update(time, delta));
        this.enemyUnits.forEach(u => u.update(time, delta));

        // 射撃物更新
        this.projectiles = this.projectiles.filter(p => !p.destroyed);
        this.projectiles.forEach(p => p.update(delta));

        // 勝利条件チェック
        if (this.enemyCastle.isDestroyed() && !this.victoryProcessed) {
            this.victoryProcessed = true;
            this.time.delayedCall(600, () => this.onVictory());
        }

        // 敗北条件チェック
        if (this.playerCastle.isDestroyed() && !this.defeatProcessed) {
            this.defeatProcessed = true;
            this.time.delayedCall(600, () => this.onDefeat());
        }

        // 全ウェーブ終了 & 敵が全滅 → 勝利
        if (
            this.waveManager.isComplete() &&
            this.enemyUnits.length === 0 &&
            !this.victoryProcessed &&
            !this.defeatProcessed &&
            !this.enemyCastle.isDestroyed()
        ) {
            // ウェーブ全完了＆敵全滅 → 続行（敵城を攻めるだけ）
        }

        // スキルクールダウン
        this.updateSkillCooldowns(time);

        // HUD更新
        this.uiManager.update(time);
    }

    updateSkillCooldowns(time) {
        Object.keys(this.skills).forEach(name => {
            const skill = this.skills[name];
            if (!skill.ready) {
                if (time - skill.lastUsed >= skill.cooldown) {
                    skill.ready = true;
                }
            }
        });
    }

    // ============================================================
    // ユニットデプロイ
    // ============================================================
    deployUnit(unitKey) {
        if (this.gameOver || this.paused || this.battleStartTime === null) return;

        const config = UNIT_DATA[unitKey];
        if (!config) return;

        // マナチェック
        if (this.mana < config.cost) {
            this.uiManager.showMessage('マナが足りない！', 800, '#ff8844');
            return;
        }

        // レベルチェック
        const reqLv = UNIT_UNLOCK_LEVEL[unitKey] || 1;
        if (this.saveData.playerLevel < reqLv) {
            this.uiManager.showMessage(`Lv${reqLv}で解放されます`, 1000, '#ffaa44');
            return;
        }

        this.mana -= config.cost;

        // アップグレード済みステータス取得
        const unitUpgrades = this.saveData.upgrades[unitKey] || {};
        const spawnX = GAME_CONSTANTS.PLAYER_CASTLE_X + 60;
        const groundY = this.GROUND_Y;
        const spawnY = config.isFlying ? groundY - 30 : groundY - 10;

        const unit = new Unit(this, spawnX, spawnY, config, false, unitUpgrades);
        this.playerUnits.push(unit);

        // スポーンエフェクト
        this.createSpawnEffect(spawnX, spawnY, true);
    }

    createSpawnEffect(x, y, isPlayer) {
        const p = this.add.graphics().setDepth(16);
        const col = isPlayer ? 0x4488ff : 0xff4400;
        p.lineStyle(2, col, 1);
        p.strokeCircle(x, y, 8);
        this.tweens.add({
            targets: p,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 400,
            onComplete: () => p.destroy()
        });
    }

    // ============================================================
    // スキル
    // ============================================================
    useSkill(skillName) {
        if (this.gameOver || this.paused || this.battleStartTime === null) return;

        const skill = this.skills[skillName];
        if (!skill || !skill.stats) {
            this.uiManager.showMessage('スキルが未解放です', 1000, '#ff8844');
            return;
        }
        if (!skill.ready) {
            this.uiManager.showMessage('クールダウン中...', 600, '#ff8844');
            return;
        }

        skill.ready = false;
        skill.lastUsed = this.time.now;

        switch (skillName) {
            case 'fireBolt':   this.fireFireBolt(skill.stats); break;
            case 'shieldWall': this.activateShieldWall(skill.stats); break;
            case 'arrowRain':  this.fireArrowRain(skill.stats); break;
        }

        this.uiManager.showMessage(
            { fireBolt: '🔥 火炎弾！', shieldWall: '🛡 鉄壁！', arrowRain: '🏹 矢雨！' }[skillName],
            1200, '#ffee44'
        );
    }

    fireFireBolt(stats) {
        // 最も前にいる敵グループに範囲ダメージ
        const { width: W } = this.scale;
        const targetX = this.findFurthestEnemy();

        // エフェクト
        const fireG = this.add.graphics().setDepth(40);
        fireG.fillStyle(0xff4400, 0.8);
        fireG.fillCircle(targetX, this.GROUND_Y - 30, stats.radius);
        fireG.fillStyle(0xff8800, 0.6);
        fireG.fillCircle(targetX, this.GROUND_Y - 30, stats.radius * 0.6);
        fireG.fillStyle(0xffee00, 0.9);
        fireG.fillCircle(targetX, this.GROUND_Y - 30, stats.radius * 0.3);

        this.tweens.add({
            targets: fireG,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 500,
            onComplete: () => fireG.destroy()
        });

        // ダメージ
        this.enemyUnits.forEach(unit => {
            if (!unit.isDead) {
                const dx = unit.x - targetX;
                const dy = unit.y - this.GROUND_Y;
                if (Math.sqrt(dx * dx + dy * dy) <= stats.radius) {
                    unit.takeDamage(stats.damage);
                }
            }
        });

        // カメラシェイク
        this.cameras.main.shake(200, 0.01);
    }

    activateShieldWall(stats) {
        this.playerCastle.activateShield();
        const originalDefense = this.playerCastle.defense;
        this.playerCastle.defense += 30;

        // エフェクト
        const shieldG = this.add.graphics().setDepth(40);
        shieldG.lineStyle(3, 0x44aaff, 0.9);
        shieldG.strokeRect(20, 150, 120, 180);

        this.time.delayedCall(stats.duration, () => {
            this.playerCastle.deactivateShield();
            this.playerCastle.defense = originalDefense;
            shieldG.destroy();
        });

        this.tweens.add({
            targets: shieldG,
            alpha: 0.3,
            duration: stats.duration / 2,
            yoyo: true,
        });
    }

    fireArrowRain(stats) {
        // 全敵にダメージ
        this.enemyUnits.forEach(unit => {
            if (!unit.isDead) {
                unit.takeDamage(stats.damage);
            }
        });

        // 矢雨エフェクト
        const { width: W } = this.scale;
        for (let i = 0; i < 12; i++) {
            const delay = i * 60;
            const ax = Phaser.Math.Between(120, W - 120);
            this.time.delayedCall(delay, () => {
                const arrowG = this.add.graphics().setDepth(40);
                arrowG.fillStyle(0xddbb44);
                arrowG.fillRect(ax - 1, 0, 2, 50);
                arrowG.fillTriangle(ax - 4, 50, ax + 4, 50, ax, 60);
                this.tweens.add({
                    targets: arrowG,
                    y: this.GROUND_Y - 10,
                    duration: 300,
                    onComplete: () => arrowG.destroy()
                });
            });
        }
    }

    findFurthestEnemy() {
        // 最も前方（自城に近い）の敵の位置を返す
        let minX = GAME_CONSTANTS.ENEMY_CASTLE_X;
        this.enemyUnits.forEach(unit => {
            if (!unit.isDead && unit.x < minX) {
                minX = unit.x;
            }
        });
        return Math.max(200, Math.min(minX, GAME_CONSTANTS.ENEMY_CASTLE_X - 50));
    }

    // ============================================================
    // 勝利・敗北
    // ============================================================
    onVictory() {
        if (this.gameOver) return;
        this.gameOver = true;

        // カメラエフェクト
        this.cameras.main.shake(300, 0.015);

        // 全ユニットを止める
        this.playerUnits.forEach(u => u.isDead = true);
        this.enemyUnits.forEach(u => u.isDead = true);

        // スコア計算
        const hpRatio = this.playerCastle.hp / this.playerCastle.maxHp;
        const stars = hpRatio >= 0.66 ? 3 : hpRatio >= 0.33 ? 2 : 1;
        const stage = STAGE_DATA[this.stageId];
        const baseExp  = stage ? stage.rewards.exp : 50;
        const baseGold = stage ? stage.rewards.gold : 100;

        // 星ボーナス（3★で1.5倍、2★で1.2倍）
        const starMulti = stars === 3 ? 1.5 : stars === 2 ? 1.2 : 1.0;
        const expGained  = Math.floor(baseExp * starMulti);
        const goldGained = Math.floor(baseGold * starMulti);

        // セーブデータ更新
        this.saveData.gold += goldGained;
        const leveledUp = SaveManager.addExp(this.saveData, expGained);
        SaveManager.onStageClear(this.saveData, this.stageId, stars);
        SaveManager.save(this.saveData);

        // 勝利エフェクト
        this.showVictoryEffect(() => {
            this.scene.start('ResultScene', {
                stageId:    this.stageId,
                isVictory:  true,
                hpRatio,
                expGained,
                goldGained,
                leveledUp,
            });
        });
    }

    onDefeat() {
        if (this.gameOver) return;
        this.gameOver = true;

        // カメラエフェクト
        this.cameras.main.shake(400, 0.02);

        // 敗北エフェクト
        this.showDefeatEffect(() => {
            this.scene.start('ResultScene', {
                stageId:    this.stageId,
                isVictory:  false,
                hpRatio:    0,
                expGained:  0,
                goldGained: 0,
                leveledUp:  false,
            });
        });
    }

    showVictoryEffect(callback) {
        const { width: W, height: H } = this.scale;

        // 金色フラッシュ
        const flash = this.add.graphics().setDepth(50);
        flash.fillStyle(0xffee00, 0.3);
        flash.fillRect(0, 0, W, H);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 500,
        });

        // 勝利テキスト
        const txt = this.add.text(W / 2, H * 0.4, '勝利！', {
            fontSize: '64px',
            fill: '#ffee44',
            fontFamily: 'monospace',
            stroke: '#884400',
            strokeThickness: 6,
        }).setOrigin(0.5, 0.5).setDepth(51).setAlpha(0);

        this.tweens.add({
            targets: txt,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 400,
            yoyo: true,
            repeat: 1,
        });

        this.time.delayedCall(1500, callback);
    }

    showDefeatEffect(callback) {
        const { width: W, height: H } = this.scale;

        // 赤いフラッシュ
        const flash = this.add.graphics().setDepth(50);
        flash.fillStyle(0xff0000, 0.4);
        flash.fillRect(0, 0, W, H);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 800,
        });

        // 敗北テキスト
        const txt = this.add.text(W / 2, H * 0.4, '敗北...', {
            fontSize: '56px',
            fill: '#ff4444',
            fontFamily: 'monospace',
            stroke: '#440000',
            strokeThickness: 6,
        }).setOrigin(0.5, 0.5).setDepth(51).setAlpha(0);

        this.tweens.add({
            targets: txt,
            alpha: 1,
            duration: 600,
        });

        this.time.delayedCall(1800, callback);
    }
}
