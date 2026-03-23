// ============================================================
// js/scenes/GameScene.js
// メインゲームシーン
// ゲームプレイの全処理（プレイヤー・敵・武器・UI・タイマー）を統括します
// ============================================================

'use strict';

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    // ============================================================
    // init(data)
    // 前シーンから受け取ったデータを初期化する
    // data.stageId  : 選択されたステージ番号（1/2/3）
    // data.saveData : セーブデータ
    // ============================================================
    init(data) {
        this.stageId  = data.stageId  || 1;
        this.saveData = data.saveData || SaveManager.load();
    }

    // ============================================================
    // create()
    // シーン作成・全ゲームオブジェクトの初期化
    // ============================================================
    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ステージ設定を取得
        this.stageConfig = STAGE_CONFIG[this.stageId] || STAGE_CONFIG[1];

        // ============================================================
        // ゲーム状態の初期化
        // ============================================================
        this.gameTimeSec   = 0;   // ゲーム経過時間（秒）
        this.score         = 0;   // スコア
        this.coinCount     = 0;   // 今回のランで取得したコイン枚数
        this.isGameOver    = false;
        this.isPaused      = false;
        this.midBossDefeated = false;

        // 全ての敵を管理する配列（Enemy・Bossクラスのインスタンス）
        this.allEnemies = [];

        // ============================================================
        // 背景の描画
        // ============================================================
        this.drawBackground(W, H);

        // ============================================================
        // Phaser の物理グループを作成
        // bullets       : プレイヤーの弾
        // enemyBullets  : 敵の弾（スナイパーなど）
        // xpOrbs        : 経験値オーブ
        // coins         : コイン
        // ============================================================
        this.bullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 200,  // 最大200発まで同時存在できる
            runChildUpdate: false
        });

        this.enemyBullets = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 50,
            runChildUpdate: false
        });

        this.xpOrbs = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 300,
            runChildUpdate: false
        });

        this.coinGroup = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Sprite,
            maxSize: 100,
            runChildUpdate: false
        });

        // ============================================================
        // プレイヤーの作成
        // 恒久強化のボーナスを反映する
        // ============================================================
        const permBonus = SaveManager.getPermBonus(this.saveData);
        this.player = new Player(this, W / 2, H - 80, permBonus);

        // ============================================================
        // 各マネージャーの作成
        // ============================================================
        // 武器管理
        this.weaponManager = new WeaponManager(this, this.player);
        // 最初から「直線弾」を1つ装備
        this.weaponManager.addWeapon('straightShot');

        // 経験値・レベルシステム
        this.levelSystem = new LevelSystem(this, this.player, this.weaponManager);

        // 敵スポーン管理
        this.enemySpawner = new EnemySpawner(this, this.stageConfig);

        // ============================================================
        // キーボード入力の設定（WASD + 矢印キー）
        // ============================================================
        this.cursors = this.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            UP:    Phaser.Input.Keyboard.KeyCodes.UP,
            DOWN:  Phaser.Input.Keyboard.KeyCodes.DOWN,
            LEFT:  Phaser.Input.Keyboard.KeyCodes.LEFT,
            RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
        });

        // ============================================================
        // コリジョン（当たり判定）の設定
        // ============================================================
        this.setupCollisions();

        // ============================================================
        // HUD（ゲーム画面UI）の作成
        // ============================================================
        this.createHUD(W, H);

        // ============================================================
        // ゲームイベントのリスナー設定
        // ============================================================
        this.setupEventListeners();

        // ============================================================
        // ポーズボタン
        // ============================================================
        this.createPauseButton(W);

        // ============================================================
        // ステージ名を一時的に表示
        // ============================================================
        this.showStageName(this.stageConfig.name, W, H);

        // ============================================================
        // BGM開始
        // 最初のキー入力 or クリックで AudioContext を解除してBGM再生
        // ============================================================
        this.input.once('pointerdown', () => { SOUND.resume(); SOUND.startBGM(); });
        this.input.keyboard.once('keydown', () => { SOUND.resume(); SOUND.startBGM(); });
    }

    // ============================================================
    // drawBackground(W, H)
    // ステージに応じた背景を描画する
    // ============================================================
    drawBackground(W, H) {
        const g = this.add.graphics();
        const bgColor = this.stageConfig.bgColor || 0x0a0a1a;

        // ベース背景
        g.fillStyle(bgColor);
        g.fillRect(0, 0, W, H);

        // 縦方向のグラデーション感（上の方を暗く）
        g.fillStyle(0x000000, 0.3);
        g.fillRect(0, 0, W, H * 0.3);

        // グリッドライン（SF感）
        g.lineStyle(1, 0x002222, 0.2);
        for (let x = 0; x <= W; x += 50) {
            g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.strokePath();
        }
        for (let y = 0; y <= H; y += 50) {
            g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokePath();
        }

        // 星（ランダム配置）
        g.fillStyle(0xffffff, 0.6);
        for (let i = 0; i < 60; i++) {
            const sz = Math.random() < 0.15 ? 2 : 1;
            g.fillRect(Phaser.Math.Between(0, W), Phaser.Math.Between(0, H * 0.8), sz, sz);
        }
    }

    // ============================================================
    // setupCollisions()
    // 各オブジェクト間の当たり判定を設定する
    // ============================================================
    setupCollisions() {
        // プレイヤーの弾と敵オブジェクトの当たり判定は
        // update() 内で手動チェックする（物理グループが敵を含まないため）

        // 敵の弾とプレイヤーの当たり判定
        this.physics.add.overlap(
            this.player.sprite,
            this.enemyBullets,
            (playerSprite, bulletSprite) => {
                const dmg = bulletSprite.damage || 10;
                this.player.takeDamage(dmg);
                bulletSprite.setActive(false).setVisible(false);
                bulletSprite.body.setVelocity(0, 0);
            },
            null, this
        );

        // プレイヤーとXPオーブのオーバーラップ
        this.physics.add.overlap(
            this.player.sprite,
            this.xpOrbs,
            (playerSprite, orbSprite) => {
                if (!orbSprite.active) return;
                this.levelSystem.addXp(orbSprite.xpValue || 10);
                orbSprite.setActive(false).setVisible(false);
                SOUND.playXpPickup();
            },
            null, this
        );

        // プレイヤーとコインのオーバーラップ
        this.physics.add.overlap(
            this.player.sprite,
            this.coinGroup,
            (playerSprite, coinSprite) => {
                if (!coinSprite.active) return;
                const earned = Math.round((coinSprite.coinValue || 1) * this.player.coinMultiplier);
                this.coinCount += earned;
                this.updateCoinHUD();
                coinSprite.setActive(false).setVisible(false);
                SOUND.playCoin();
            },
            null, this
        );
    }

    // ============================================================
    // setupEventListeners()
    // ゲームイベントのリスナーを設定する
    // ============================================================
    setupEventListeners() {
        // プレイヤー死亡イベント
        this.events.on('playerDead', () => {
            this.onGameOver(false);
        });

        // 敵撃破イベント（スコア加算）
        this.events.on('enemyKilled', (data) => {
            this.score += data.score;
            this.allEnemies = this.allEnemies.filter(e => !e.isDead);
        });

        // ボス死亡イベント
        this.events.on('bossDead', (data) => {
            SOUND.playBossDie();
            this.enemySpawner.onBossDefeated(data.type);
            if (data.isMidBoss) this.midBossDefeated = true;
            if (data.isFinalBoss) {
                // 最終ボスを倒したらステージクリア
                this.time.delayedCall(1500, () => this.onGameOver(true));
            }
        });

        // レベルアップイベント
        this.events.on('levelUp', (data) => {
            SOUND.playLevelUp();
            this.onLevelUp(data);
        });

        // UpgradeSceneから選択結果を受け取る
        this.events.on('upgradeChosen', (choice) => {
            this.levelSystem.applyChoice(choice);
            this.isPaused = false;
            this.physics.resume();
        });
    }

    // ============================================================
    // createHUD(W, H)
    // HPバー・XPバー・タイマー・コイン・レベルなどのHUDを作成する
    // 縦長（ポートレート）レイアウト向けに調整済み
    // ============================================================
    createHUD(W, H) {
        // HUD の底部パネル背景
        const hudBg = this.add.graphics().setScrollFactor(0).setDepth(89);
        hudBg.fillStyle(0x000000, 0.55);
        hudBg.fillRect(0, H - 60, W, 60);

        // --- HPバー（画面下部・横幅広め）---
        const hpBarX = 8;
        const hpBarY = H - 50;
        const hpBarW = W - 16;
        const hpBarH = 14;

        this.hpBarBg = this.add.graphics().setScrollFactor(0).setDepth(90);
        this.hpBarBg.fillStyle(0x330000);
        this.hpBarBg.fillRoundedRect(hpBarX, hpBarY, hpBarW, hpBarH, 4);

        this.hpBarFill = this.add.graphics().setScrollFactor(0).setDepth(91);

        this.hpLabel = this.add.text(hpBarX + 4, hpBarY + 1, 'HP', {
            fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ff8888'
        }).setScrollFactor(0).setDepth(92);

        this.hpText = this.add.text(W - 8, hpBarY + 1, '100/100', {
            fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#ffaaaa'
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(92);

        // --- XPバー（HPバーの下）---
        const xpBarX = 8;
        const xpBarY = H - 32;
        const xpBarW = W - 16;
        const xpBarH = 10;

        this.xpBarBg = this.add.graphics().setScrollFactor(0).setDepth(90);
        this.xpBarBg.fillStyle(0x001133);
        this.xpBarBg.fillRoundedRect(xpBarX, xpBarY, xpBarW, xpBarH, 3);

        this.xpBarFill = this.add.graphics().setScrollFactor(0).setDepth(91);

        this.xpLabel = this.add.text(xpBarX + 4, xpBarY + 1, 'XP', {
            fontSize: '9px', fontFamily: 'Arial, sans-serif', color: '#44ff88'
        }).setScrollFactor(0).setDepth(92);

        // --- 最下段テキスト（レベル・スコア）---
        this.levelText = this.add.text(W / 2, H - 18, 'Lv.1', {
            fontSize: '13px', fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff', stroke: '#000000', strokeThickness: 2
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(92);

        this.scoreText = this.add.text(W - 8, H - 18, 'Score: 0', {
            fontSize: '11px', fontFamily: 'Arial, sans-serif',
            color: '#aaaacc', stroke: '#000000', strokeThickness: 1
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(92);

        // --- タイマー（画面上部中央）---
        this.timerText = this.add.text(W / 2, 8, '00:00', {
            fontSize: '22px', fontFamily: 'Arial, sans-serif',
            color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(92);

        // --- コイン（タイマー右）---
        this.coinText = this.add.text(W - 8, 10, '💰 0', {
            fontSize: '14px', fontFamily: 'Arial, sans-serif',
            color: '#ffcc00', stroke: '#443300', strokeThickness: 2
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(92);

        // --- 武器一覧（画面左上）---
        this.weaponListText = this.add.text(8, 36, '', {
            fontSize: '11px', fontFamily: 'Arial, sans-serif',
            color: '#aaccff', lineSpacing: 2
        }).setScrollFactor(0).setDepth(92);

        // 初回更新
        this.updateHPBar();
        this.updateXPBar();
        this.updateWeaponList();
    }

    // ============================================================
    // createPauseButton(W)
    // 画面右上にポーズボタンを作成する
    // ============================================================
    createPauseButton(W) {
        const bg = this.add.graphics().setScrollFactor(0).setDepth(95);
        const drawBtn = (hover) => {
            bg.clear();
            bg.fillStyle(hover ? 0x334455 : 0x112233, 0.85);
            bg.fillRoundedRect(W - 56, 6, 48, 26, 5);
        };
        drawBtn(false);

        this.add.text(W - 32, 19, '⏸ 停止', {
            fontSize: '11px', fontFamily: 'Arial, sans-serif', color: '#aabbcc'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(96);

        const hit = this.add.rectangle(W - 32, 19, 48, 26, 0, 0)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0).setDepth(97);
        hit.on('pointerover', () => drawBtn(true));
        hit.on('pointerout',  () => drawBtn(false));
        hit.on('pointerdown', () => this.showPauseMenu());
    }

    // ============================================================
    // showStageName(name, W, H)
    // ステージ開始時にステージ名を一時的に表示する
    // ============================================================
    showStageName(name, W, H) {
        const txt = this.add.text(W / 2, H / 2, name, {
            fontSize: '28px',
            fontFamily: 'Arial, sans-serif',
            color: '#00ffff',
            stroke: '#004444',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: txt,
            alpha: 0,
            y: H / 2 - 50,
            delay: 1500,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    // ============================================================
    // update(time, delta)
    // 毎フレーム呼ばれるメインゲームループ
    // ============================================================
    update(time, delta) {
        if (this.isGameOver || this.isPaused) return;

        // ゲーム経過時間を更新（ms → 秒に変換）
        this.gameTimeSec += delta / 1000;

        // ============================================================
        // プレイヤーの更新（移動・無敵時間・HP回復）
        // ============================================================
        this.player.update(this.cursors, delta);

        // ============================================================
        // 武器の自動発射（WeaponManagerが管理）
        // ============================================================
        this.weaponManager.update(time, delta);

        // ============================================================
        // 敵のスポーンと更新
        // ============================================================
        this.enemySpawner.update(time, this.gameTimeSec, delta);

        // 全ての敵を更新（移動・攻撃パターン）
        for (const enemy of this.allEnemies) {
            if (!enemy.isDead && enemy.sprite.active) {
                enemy.update(this.player, delta);
            }
        }

        // ============================================================
        // プレイヤーの弾と敵の当たり判定（手動チェック）
        // ============================================================
        this.checkBulletEnemyCollisions();

        // ============================================================
        // 敵とプレイヤーの接触ダメージ
        // ============================================================
        this.checkEnemyPlayerCollisions();

        // ============================================================
        // 敵が画面下端に到達したときのダメージ処理
        // ============================================================
        this.checkEnemiesReachedBottom();

        // ============================================================
        // XPオーブ・コインの自動吸収（磁力エフェクト）
        // ============================================================
        this.updateItemAttraction(delta);

        // ============================================================
        // 追尾弾・ミサイルの更新（弾ごとに独自の動きがある）
        // ============================================================
        this.updateBullets(delta);

        // ============================================================
        // 死んでいる敵を配列から除去（毎フレームでなく定期的に）
        // ============================================================
        if (Math.random() < 0.05) { // 5% の確率で実行（毎フレームはコスト高）
            this.allEnemies = this.allEnemies.filter(e => !e.isDead);
        }

        // ============================================================
        // HUDの更新
        // ============================================================
        this.updateHUD();
    }

    // ============================================================
    // checkBulletEnemyCollisions()
    // プレイヤーの弾と敵の当たり判定を手動でチェックする
    // ============================================================
    checkBulletEnemyCollisions() {
        this.bullets.children.iterate(bulletSprite => {
            if (!bulletSprite || !bulletSprite.active) return;

            for (const enemy of this.allEnemies) {
                if (enemy.isDead || !enemy.sprite.active) continue;

                // 簡易当たり判定（矩形の距離チェック）
                const dx = bulletSprite.x - enemy.getX();
                const dy = bulletSprite.y - enemy.getY();
                const hitDist = (enemy.size || 20) * 0.6 + 4;

                if (Math.abs(dx) < hitDist && Math.abs(dy) < hitDist) {
                    // 弾のダメージを取得
                    const bulletRef = bulletSprite.bulletRef;
                    const dmg = bulletRef ? bulletRef.damage : 10;

                    // 敵にダメージ
                    const died = enemy.takeDamage(dmg);

                    // ヒットエフェクト + SE
                    this.createHitEffect(bulletSprite.x, bulletSprite.y, bulletSprite.tintTopLeft || 0xffffff);
                    const bulletRef2 = bulletSprite.bulletRef;
                    SOUND.playHitEffect(bulletRef2 ? bulletRef2.weaponType : 'default');

                    // 弾の処理（貫通するかどうか）
                    let removeBullet = true;
                    if (bulletRef) {
                        removeBullet = bulletRef.onHitEnemy(enemy);
                    }

                    if (removeBullet) {
                        bulletSprite.setActive(false).setVisible(false);
                        if (bulletSprite.body) bulletSprite.body.setVelocity(0, 0);
                        return; // この弾のチェックを終了
                    }
                }
            }
        });
    }

    // ============================================================
    // checkEnemyPlayerCollisions()
    // 敵がプレイヤーに触れたときのダメージ処理
    // ============================================================
    checkEnemyPlayerCollisions() {
        const px = this.player.getX();
        const py = this.player.getY();
        const playerHitRadius = 14;

        for (const enemy of this.allEnemies) {
            if (enemy.isDead || !enemy.sprite.active) continue;

            const dx = enemy.getX() - px;
            const dy = enemy.getY() - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const hitDist = playerHitRadius + (enemy.size || 20) * 0.4;

            if (dist < hitDist) {
                this.player.takeDamage(enemy.damage);
                SOUND.playPlayerHit();
            }
        }
    }

    // ============================================================
    // checkEnemiesReachedBottom()
    // 敵が画面下端に到達したらプレイヤーにダメージを与えて消す
    // ============================================================
    checkEnemiesReachedBottom() {
        const H = this.scale.height;
        const bottomY = H + 20; // 画面下から少し外

        for (const enemy of this.allEnemies) {
            if (enemy.isDead || !enemy.sprite.active) continue;
            if (enemy.isBoss) continue; // ボスは除外（別ロジック）
            if (enemy.sprite.y > bottomY) {
                // 画面下端に到達した敵はダメージなしで消去（ダメージは弾・接触のみ）
                enemy.isDead = true;
                enemy.sprite.setActive(false).setVisible(false);
                enemy.sprite.destroy();
            }
        }
    }

    // ============================================================
    // updateItemAttraction(delta)
    // アイテムの処理:
    //   通常 → 真下に一定速度で落下
    //   吸収範囲内 → プレイヤーに向かって引き寄せ
    //   画面下端を超えた → 非アクティブ化（回収できなかった）
    // ============================================================
    updateItemAttraction(delta) {
        const px = this.player.getX();
        const py = this.player.getY();
        const pickupR = this.player.pickupRadius;
        const pickupRSq = pickupR * pickupR;
        const attractSpeed = 340;
        const fallSpeed = 70;
        const H = this.scale.height;

        // XPオーブ
        this.xpOrbs.children.iterate(orb => {
            if (!orb || !orb.active) return;
            // 画面外に落ちたら消す
            if (orb.y > H + 20) {
                orb.setActive(false).setVisible(false);
                return;
            }
            const dx = px - orb.x;
            const dy = py - orb.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < pickupRSq) {
                // 吸収範囲内: プレイヤーへ引き寄せ
                const dist = Math.sqrt(distSq);
                orb.body.setVelocity(
                    (dx / dist) * attractSpeed,
                    (dy / dist) * attractSpeed
                );
            } else {
                // 通常: 真下に落下
                orb.body.setVelocity(0, fallSpeed);
            }
        });

        // コイン
        this.coinGroup.children.iterate(coin => {
            if (!coin || !coin.active) return;
            if (coin.y > H + 20) {
                coin.setActive(false).setVisible(false);
                return;
            }
            const dx = px - coin.x;
            const dy = py - coin.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < pickupRSq) {
                const dist = Math.sqrt(distSq);
                coin.body.setVelocity(
                    (dx / dist) * attractSpeed,
                    (dy / dist) * attractSpeed
                );
            } else {
                coin.body.setVelocity(0, 60);
            }
        });
    }

    // ============================================================
    // updateBullets(delta)
    // 追尾弾・ミサイルストーム弾の更新処理
    // ============================================================
    updateBullets(delta) {
        this.bullets.children.iterate(bulletSprite => {
            if (!bulletSprite || !bulletSprite.active) return;
            const ref = bulletSprite.bulletRef;
            if (ref) ref.update(delta, this.allEnemies);
        });
    }

    // ============================================================
    // updateHUD()
    // 毎フレームHUDを最新の状態に更新する
    // ============================================================
    updateHUD() {
        this.updateHPBar();
        this.updateXPBar();

        // タイマー（mm:ss 形式）
        const totalSec = Math.floor(this.gameTimeSec);
        const min = Math.floor(totalSec / 60);
        const sec = totalSec % 60;
        this.timerText.setText(
            `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
        );

        // レベル表示
        this.levelText.setText(`Lv.${this.levelSystem.level}`);

        // スコア表示
        this.scoreText.setText(`Score: ${this.score}`);
    }

    // ============================================================
    // updateHPBar()
    // HPバーの色とサイズを更新する
    // ============================================================
    updateHPBar() {
        const W = this.scale.width;
        const H = this.scale.height;
        const hpRatio = this.player.getHpRatio();
        const barW = W - 16;
        const barH = 14;
        const barX = 8;
        const barY = H - 50;

        let color = 0x00ff44;
        if (hpRatio < 0.5) color = 0xffff00;
        if (hpRatio < 0.25) color = 0xff2200;

        this.hpBarFill.clear();
        this.hpBarFill.fillStyle(color);
        this.hpBarFill.fillRoundedRect(barX, barY, Math.max(2, Math.round(barW * hpRatio)), barH, 4);

        this.hpText.setText(`${this.player.hp}/${this.player.maxHp}`);
    }

    // ============================================================
    // updateXPBar()
    // XPバーのサイズを更新する
    // ============================================================
    updateXPBar() {
        const W = this.scale.width;
        const H = this.scale.height;
        const xpRatio = this.levelSystem.getXpRatio();
        const barW = W - 16;
        const barH = 10;
        const barX = 8;
        const barY = H - 32;

        this.xpBarFill.clear();
        this.xpBarFill.fillStyle(0x00ff88);
        this.xpBarFill.fillRoundedRect(barX, barY, Math.max(1, Math.round(barW * xpRatio)), barH, 3);
    }

    // ============================================================
    // updateCoinHUD()
    // コイン数表示を更新する
    // ============================================================
    updateCoinHUD() {
        this.coinText.setText(`💰 ${this.coinCount}`);
    }

    // ============================================================
    // updateWeaponList()
    // 所持武器一覧をHUDに表示する
    // ============================================================
    updateWeaponList() {
        const weapons = this.weaponManager.getWeaponList();
        const lines = weapons.map(w => {
            const star = w.isUltimate ? '★' : '・';
            return `${star}${w.name} Lv${w.level}`;
        });
        this.weaponListText.setText(lines.join('\n') || '武器なし');
    }

    // ============================================================
    // onLevelUp(data)
    // レベルアップ時の処理
    // GameSceneを停止してUpgradeSceneを起動する
    // ============================================================
    onLevelUp(data) {
        if (this.isPaused || this.isGameOver) return;

        this.isPaused = true;
        this.physics.pause(); // 物理エンジンを停止（弾・敵が止まる）

        // レベルアップエフェクト
        this.showLevelUpEffect(data.level);

        // 少し待ってからUpgradeSceneを起動する（演出のため）
        this.time.delayedCall(400, () => {
            // UpgradeScene をこのシーンの上に起動（GameSceneは一時停止のまま）
            this.scene.launch('UpgradeScene', {
                choices: data.choices,
                level:   data.level
            });
        });
    }

    // ============================================================
    // showLevelUpEffect(level)
    // レベルアップ時のエフェクト表示
    // ============================================================
    showLevelUpEffect(level) {
        const W = this.scale.width;
        const H = this.scale.height;

        const txt = this.add.text(W / 2, H / 2, `LEVEL UP! Lv.${level}`, {
            fontSize: '30px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffff00',
            stroke: '#886600',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: txt,
            y: H / 2 - 60,
            alpha: 0,
            duration: 400,
            delay: 100,
            onComplete: () => txt.destroy()
        });

        // 画面フラッシュ
        const flash = this.add.graphics().setDepth(49);
        flash.fillStyle(0xffff00, 0.15);
        flash.fillRect(0, 0, W, H);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 400,
            onComplete: () => flash.destroy()
        });
    }

    // ============================================================
    // dropXpOrb(x, y, xpValue)
    // XPオーブをドロップする（Enemy.dieから呼ばれる）
    // ============================================================
    dropXpOrb(x, y, xpValue) {
        const orb = this.xpOrbs.get(x, y, 'xp_orb');
        if (!orb) return;

        orb.setActive(true).setVisible(true);
        orb.setDepth(3);
        orb.xpValue = xpValue;

        // 真下にゆっくり落下する（プレイヤーが横移動して取りに行く）
        orb.body.setVelocity(0, 70);
        orb.body.setDrag(0, 0); // ドラッグなし：一定速度で落下
    }

    // ============================================================
    // dropCoin(x, y, amount)
    // コインをドロップする（Enemy.dieから呼ばれる）
    // ============================================================
    dropCoin(x, y, amount) {
        const coin = this.coinGroup.get(x, y, 'coin');
        if (!coin) return;

        coin.setActive(true).setVisible(true);
        coin.setDepth(3);
        coin.coinValue = amount;

        // 真下にゆっくり落下する
        coin.body.setVelocity(0, 60);
        coin.body.setDrag(0, 0);
    }

    // ============================================================
    // createHitEffect(x, y, color)
    // 弾が敵に当たったときのヒットエフェクトを表示する
    // ============================================================
    createHitEffect(x, y, color) {
        const g = this.add.graphics();
        g.setDepth(18);
        g.fillStyle(color, 0.8);
        g.fillCircle(0, 0, 5);
        g.x = x;
        g.y = y;

        this.tweens.add({
            targets: g,
            scaleX: 2, scaleY: 2,
            alpha: 0,
            duration: 200,
            onComplete: () => g.destroy()
        });
    }

    // ============================================================
    // showBossAlert(bossType)
    // ボス出現時の警告メッセージを表示する
    // ============================================================
    showBossAlert(bossType) {
        SOUND.playBossAppear();
        if (bossType !== 'miniBoss') SOUND.startBossBGM();
        const W = this.scale.width;
        const H = this.scale.height;

        const messages = {
            miniBoss:  'BOSS INCOMING!',
            midBoss:   '★ 中ボス出現！ ★',
            finalBoss: '★★★ 魔王降臨！ ★★★'
        };

        const colors = {
            miniBoss:  '#ff8800',
            midBoss:   '#ff4488',
            finalBoss: '#ff0000'
        };

        const txt = this.add.text(W / 2, H * 0.35, messages[bossType] || 'BOSS!', {
            fontSize: bossType === 'finalBoss' ? '34px' : '28px',
            fontFamily: 'Arial Black, sans-serif',
            color: colors[bossType] || '#ff0000',
            stroke: '#000000',
            strokeThickness: 5
        }).setOrigin(0.5).setDepth(50);

        // 点滅→消える
        this.tweens.add({
            targets: txt,
            alpha: { from: 1, to: 0.2 },
            duration: 200,
            yoyo: true,
            repeat: 4,
            onComplete: () => {
                this.tweens.add({
                    targets: txt,
                    alpha: 0,
                    y: H * 0.25,
                    duration: 500,
                    onComplete: () => txt.destroy()
                });
            }
        });

        // 画面シェイク
        this.cameras.main.shake(600, bossType === 'finalBoss' ? 0.02 : 0.01);
    }

    // ============================================================
    // showBossPhase2Message(bossType)
    // ボスが第2フェーズに移行したときのメッセージ
    // ============================================================
    showBossPhase2Message(bossType) {
        const W = this.scale.width;
        const H = this.scale.height;

        const txt = this.add.text(W / 2, H * 0.40, '⚠ PHASE 2 ⚠', {
            fontSize: '26px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ff4400',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: txt,
            alpha: 0,
            y: H * 0.30,
            delay: 1000,
            duration: 600,
            onComplete: () => txt.destroy()
        });
    }

    // ============================================================
    // showMidBossDefeatedMessage()
    // 中ボス撃破後に難易度上昇を通知するメッセージ
    // ============================================================
    showMidBossDefeatedMessage() {
        const W = this.scale.width;
        const H = this.scale.height;

        const txt = this.add.text(W / 2, H * 0.4,
            '⚠ 難易度が大幅に上昇！ ⚠', {
            fontSize: '22px',
            fontFamily: 'Arial, sans-serif',
            color: '#ffaa00',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(50);

        this.tweens.add({
            targets: txt,
            alpha: 0,
            y: H * 0.30,
            delay: 2000,
            duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    // ============================================================
    // showPauseMenu()
    // ポーズメニューを表示する
    // ============================================================
    showPauseMenu() {
        if (this.isGameOver) return;
        this.isPaused = true;
        this.physics.pause();

        const W = this.scale.width;
        const H = this.scale.height;

        // 暗転オーバーレイ
        const overlay = this.add.graphics().setDepth(80).setScrollFactor(0);
        overlay.fillStyle(0x000000, 0.65);
        overlay.fillRect(0, 0, W, H);

        const dlgW = 280;
        const dlgH = 200;
        overlay.fillStyle(0x0a1a2a);
        overlay.fillRoundedRect(W / 2 - dlgW / 2, H / 2 - dlgH / 2, dlgW, dlgH, 10);
        overlay.lineStyle(2, 0x4488aa);
        overlay.strokeRoundedRect(W / 2 - dlgW / 2, H / 2 - dlgH / 2, dlgW, dlgH, 10);

        const title = this.add.text(W / 2, H / 2 - 72, 'PAUSED', {
            fontSize: '26px', fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(81).setScrollFactor(0);

        // --- 再開ボタン ---
        const resumeObjs = this._createPauseBtn(W / 2, H / 2 - 15, 180, 38, '▶ ゲーム再開', 0x113322, 0x225533, () => {
            overlay.destroy();
            title.destroy();
            resumeObjs.forEach(o => o.destroy());
            retireObjs.forEach(o => o.destroy());
            this.isPaused = false;
            this.physics.resume();
        });

        // --- リタイアボタン ---
        const retireObjs = this._createPauseBtn(W / 2, H / 2 + 38, 180, 38, '✕ リタイア', 0x331111, 0x662222, () => {
            // コインを保存してメニューへ
            SaveManager.addCoins(this.saveData, this.coinCount);
            this.scene.start('GameOverScene', {
                isVictory: false,
                retired:   true,
                coinCount: this.coinCount,
                score:     this.score,
                level:     this.levelSystem.level,
                timeSec:   Math.floor(this.gameTimeSec),
                stageId:   this.stageId,
                saveData:  this.saveData
            });
        });
    }

    // ============================================================
    // _createPauseBtn(x, y, w, h, label, bg, hover, callback)
    // ポーズメニュー内のボタンを作成するヘルパー
    // ============================================================
    _createPauseBtn(x, y, w, h, label, bgColor, hoverColor, callback) {
        const btnBg = this.add.graphics().setDepth(82).setScrollFactor(0);
        const draw = (isHover) => {
            btnBg.clear();
            btnBg.fillStyle(isHover ? hoverColor : bgColor);
            btnBg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 6);
            btnBg.lineStyle(1, 0x4488aa);
            btnBg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 6);
        };
        draw(false);

        const txt = this.add.text(x, y, label, {
            fontSize: '15px', fontFamily: 'Arial, sans-serif', color: '#ffffff'
        }).setOrigin(0.5).setDepth(83).setScrollFactor(0);

        const hit = this.add.rectangle(x, y, w, h, 0, 0)
            .setInteractive({ useHandCursor: true }).setDepth(84).setScrollFactor(0);
        hit.on('pointerover', () => draw(true));
        hit.on('pointerout',  () => draw(false));
        hit.on('pointerdown', callback);

        return [btnBg, txt, hit];
    }

    // ============================================================
    // onGameOver(isVictory)
    // ゲーム終了処理（クリアまたはゲームオーバー）
    // ============================================================
    onGameOver(isVictory) {
        if (this.isGameOver) return;
        this.isGameOver = true;

        this.physics.pause();
        SOUND.stopBGM();
        if (isVictory) SOUND.playStageClear();
        else           SOUND.playGameOver();

        // コインをセーブデータに追加
        SaveManager.addCoins(this.saveData, this.coinCount);

        // クリアステージを記録
        if (isVictory) {
            if (!this.saveData.clearedStages.includes(this.stageId)) {
                this.saveData.clearedStages.push(this.stageId);
                SaveManager.save(this.saveData);
            }
        }

        const W = this.scale.width;
        const H = this.scale.height;

        // エフェクト（勝利: 金色 / 敗北: 赤）
        const color = isVictory ? 0xffee00 : 0xff0000;
        const flash = this.add.graphics().setDepth(45);
        flash.fillStyle(color, 0.3);
        flash.fillRect(0, 0, W, H);
        this.tweens.add({ targets: flash, alpha: 0, duration: 600 });

        const msg = isVictory ? 'STAGE CLEAR!\n魔王を倒した！' : 'GAME OVER';
        const msgColor = isVictory ? '#ffee44' : '#ff4444';

        const txt = this.add.text(W / 2, H / 2, msg, {
            fontSize: '38px',
            fontFamily: 'Arial Black, sans-serif',
            color: msgColor,
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5).setDepth(46);

        // GameOverSceneへ遷移
        this.time.delayedCall(2000, () => {
            this.scene.start('GameOverScene', {
                isVictory: isVictory,
                retired:   false,
                coinCount: this.coinCount,
                score:     this.score,
                level:     this.levelSystem.level,
                timeSec:   Math.floor(this.gameTimeSec),
                stageId:   this.stageId,
                saveData:  this.saveData
            });
        });
    }

    // ============================================================
    // shutdown()
    // シーン終了時のクリーンアップ処理
    // ============================================================
    shutdown() {
        SOUND.stopBGM();
        // レーザーグラフィックスなどのリソースを解放
        if (this.weaponManager) this.weaponManager.destroy();

        // 全ての敵を削除
        for (const enemy of this.allEnemies) {
            if (enemy && !enemy.isDead) enemy.destroy();
        }

        // イベントリスナーを削除
        this.events.off('playerDead');
        this.events.off('enemyKilled');
        this.events.off('bossDead');
        this.events.off('levelUp');
        this.events.off('upgradeChosen');
    }
}
