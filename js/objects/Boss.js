// ============================================================
// js/objects/Boss.js
// ボスキャラクタークラス
// Enemyクラスを拡張し、特殊攻撃パターンとHPバーを追加します
// ============================================================

'use strict';

class Boss extends Enemy {
    // ============================================================
    // コンストラクタ
    // scene     : 属するPhaser.Scene
    // x, y      : 生成座標
    // bossType  : ボスの種類 (ENEMY_DATAのキー: 'miniBoss', 'midBoss', 'finalBoss')
    // hpMult    : HP倍率（ステージ難易度で増加）
    // dmgMult   : ダメージ倍率
    // speedMult : 速度倍率
    // ============================================================
    constructor(scene, x, y, bossType, hpMult = 1, dmgMult = 1, speedMult = 1) {
        // 親クラス(Enemy)のコンストラクタを呼ぶ
        super(scene, x, y, bossType, hpMult, dmgMult, speedMult);

        // ボスの特殊攻撃タイマー
        this.specialAttackTimer = 0;
        this.specialAttackInterval = 3000; // 3秒ごとに特殊攻撃（弾幕強化）

        // 第2フェーズ（HP半分以下）フラグ
        this.phase2 = false;
        this.phase2Announced = false;

        // ボスは画面上部を左右にパトロールする
        // patrolDir: 1=右 / -1=左
        this.patrolDir = 1;
        this.patrolTargetX = this.scene.scale.width * 0.8;

        // HPバー（ボスのHPは画面上部に専用バーで表示）
        this.createBossHpBar();

        // 登場演出
        this.playEntryAnimation();
    }

    // ============================================================
    // update(player, delta)
    // ボス専用の更新処理（親クラスのEnemy.update()をオーバーライドし
    // 落下せず画面上部を左右にパトロールさせる）
    // ============================================================
    update(player, delta) {
        if (this.isDead) return;

        // ---- ボスの移動：上部を左右パトロール ----
        // 親クラスの update() は呼ばず、独自の移動ロジックを使う
        const W = this.scene.scale.width;
        const marginX = 60;

        // 目標X座標に向かって横移動
        const dx = this.patrolTargetX - this.sprite.x;
        if (Math.abs(dx) < 5) {
            // 目標到達したら折り返す
            this.patrolDir = -this.patrolDir;
            this.patrolTargetX = this.patrolDir > 0
                ? W - marginX
                : marginX;
        }
        this.sprite.body.setVelocity(this.patrolDir * this.speed, 0);

        // ヒットフラッシュ更新（親クラスから移植）
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= delta;
            this.sprite.setTint(this.phase2 ? 0xff8888 : 0xffffff);
        } else if (!this.phase2) {
            this.sprite.clearTint();
        }

        // 特殊攻撃タイマーを更新
        this.specialAttackTimer += delta;
        if (this.specialAttackTimer >= this.specialAttackInterval) {
            this.specialAttackTimer = 0;
            this.doSpecialAttack(player);
        }

        // フェーズ2突入チェック（HPが50%以下になったとき）
        if (!this.phase2 && this.getHpRatio() <= 0.5) {
            this.enterPhase2();
        }

        // HPバーを更新
        this.updateBossHpBar();
    }

    // ============================================================
    // doSpecialAttack(player)
    // ボスの種類に応じた特殊攻撃を実行する
    // ============================================================
    doSpecialAttack(player) {
        if (this.isDead) return;

        switch (this.type) {
            case 'miniBoss':
                // ミニボス: 5方向扇形弾 + フェーズ2では交互に全方位も発射
                if (this.phase2 && Math.random() < 0.4) {
                    this.fireRadialBullets(8);
                } else {
                    this.fireSpreadBullets(player, 5);
                }
                break;

            case 'midBoss':
                // 中ボス: 12方向全方位弾 または 狙い5方向扇形
                if (Math.random() < 0.5) {
                    this.fireRadialBullets(12);
                } else {
                    this.fireSpreadBullets(player, 5);
                }
                break;

            case 'finalBoss':
                // 最終ボス: 3択攻撃（16方向弾 / レーザー / 8方向扇形）
                const r = Math.random();
                if (r < 0.4) {
                    this.fireRadialBullets(16);
                } else if (r < 0.7) {
                    this.fireLaserBeam(player);
                } else {
                    this.fireSpreadBullets(player, 8);
                }
                break;
        }
    }

    // ============================================================
    // fireSpreadBullets(player, count)
    // プレイヤーへの方向を中心に扇状に弾を発射する
    // ============================================================
    fireSpreadBullets(player, count) {
        if (!this.scene.enemyBullets) return;

        const baseAngle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            player.getX(), player.getY()
        );
        const spreadAngle = Phaser.Math.DegToRad(20); // 広がり角度（ラジアン）
        const speed = 240;

        for (let i = 0; i < count; i++) {
            // 弾の角度を均等に振り分ける
            const angle = baseAngle + spreadAngle * (i - (count - 1) / 2);
            const bullet = this.scene.enemyBullets.get(this.sprite.x, this.sprite.y, 'bullet_enemy');
            if (!bullet) continue;

            bullet.setActive(true).setVisible(true);
            bullet.setDepth(6);
            bullet.setTint(0xff6600);
            bullet.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            bullet.damage = this.damage;
        }
    }

    // ============================================================
    // fireRadialBullets(count)
    // 全方向に均等に弾を発射する（円形弾幕）
    // ============================================================
    fireRadialBullets(count) {
        if (!this.scene.enemyBullets) return;

        const speed = 220;
        const angleStep = (Math.PI * 2) / count; // 等間隔の角度

        for (let i = 0; i < count; i++) {
            const angle = angleStep * i;
            const bullet = this.scene.enemyBullets.get(this.sprite.x, this.sprite.y, 'bullet_enemy');
            if (!bullet) continue;

            bullet.setActive(true).setVisible(true);
            bullet.setDepth(6);
            bullet.setTint(0xff0088);
            bullet.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            bullet.damage = this.damage;
        }
    }

    // ============================================================
    // fireLaserBeam(player)
    // 最終ボス専用: プレイヤーに向けてレーザービームを発射
    // ============================================================
    fireLaserBeam(player) {
        if (this.isDead) return;

        // レーザー警告表示（0.5秒後に発射）
        const warningLine = this.scene.add.graphics();
        warningLine.setDepth(9);
        warningLine.lineStyle(3, 0xff0000, 0.5);
        warningLine.beginPath();
        warningLine.moveTo(this.sprite.x, this.sprite.y);
        warningLine.lineTo(player.getX(), player.getY());
        warningLine.strokePath();

        this.scene.time.delayedCall(500, () => {
            warningLine.destroy();
            if (this.isDead) return;

            // 実際のレーザー発射（プレイヤー周囲にAoEダメージ）
            const laserGfx = this.scene.add.graphics();
            laserGfx.setDepth(9);
            laserGfx.lineStyle(12, 0xff0000, 0.9);
            laserGfx.beginPath();
            laserGfx.moveTo(this.sprite.x, this.sprite.y);
            laserGfx.lineTo(player.getX(), player.getY());
            laserGfx.strokePath();

            // プレイヤーにダメージ
            player.takeDamage(Math.round(this.damage * 1.5));

            // レーザーをフェードアウト
            this.scene.tweens.add({
                targets: laserGfx,
                alpha: 0,
                duration: 400,
                onComplete: () => laserGfx.destroy()
            });
        });
    }

    // ============================================================
    // enterPhase2()
    // ボスがHPの半分以下になったときに第2フェーズに移行する
    // ============================================================
    enterPhase2() {
        this.phase2 = true;

        // スピードと攻撃速度を大幅に上げる（フェーズ2はさらに激化）
        this.speed *= 1.5;
        this.specialAttackInterval = Math.round(this.specialAttackInterval * 0.5); // 攻撃間隔を半分に

        // フェーズ2の視覚的変化（より暗い色に変わる）
        this.sprite.setTint(0xff4444);

        // フェーズ2突入メッセージを表示
        this.scene.showBossPhase2Message(this.type);

        // 画面シェイクでフェーズ2を演出
        this.scene.cameras.main.shake(500, 0.02);
    }

    // ============================================================
    // createBossHpBar()
    // 画面上部にボスのHPバーを作成する
    // ============================================================
    createBossHpBar() {
        const W = this.scene.scale.width;

        // HPバー背景
        this.hpBarBg = this.scene.add.graphics();
        this.hpBarBg.setDepth(100);
        this.hpBarBg.setScrollFactor(0);
        this.hpBarBg.fillStyle(0x330000);
        this.hpBarBg.fillRect(50, 10, W - 100, 20);

        // HPバー本体
        this.hpBarFill = this.scene.add.graphics();
        this.hpBarFill.setDepth(101);
        this.hpBarFill.setScrollFactor(0);

        // ボス名テキスト
        const bossData = ENEMY_DATA[this.type];
        const bossNames = {
            miniBoss:  'MINI BOSS',
            midBoss:   'MID BOSS ★',
            finalBoss: '魔王 ★★★'
        };

        this.hpBarName = this.scene.add.text(W / 2, 22, bossNames[this.type] || 'BOSS', {
            fontSize: '14px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

        this.updateBossHpBar();
    }

    // ============================================================
    // updateBossHpBar()
    // HPバーの表示を現在のHPに合わせて更新する
    // ============================================================
    updateBossHpBar() {
        if (!this.hpBarFill) return;

        const W = this.scene.scale.width;
        const barWidth = W - 100;
        const ratio = this.getHpRatio();

        // HPに応じて色を変える（緑→黄→赤）
        let color = 0x00ff44; // 高HP: 緑
        if (ratio < 0.5) color = 0xffff00; // 中HP: 黄
        if (ratio < 0.25) color = 0xff4400; // 低HP: 赤

        this.hpBarFill.clear();
        this.hpBarFill.fillStyle(color);
        this.hpBarFill.fillRect(50, 10, Math.round(barWidth * ratio), 20);
    }

    // ============================================================
    // destroyHpBar()
    // ボスHPバーを削除する（ボス死亡時に呼ぶ）
    // ============================================================
    destroyHpBar() {
        if (this.hpBarBg)   this.hpBarBg.destroy();
        if (this.hpBarFill) this.hpBarFill.destroy();
        if (this.hpBarName) this.hpBarName.destroy();
    }

    // ============================================================
    // playEntryAnimation()
    // ボスの登場演出（上から降りてくるアニメーション）
    // ============================================================
    playEntryAnimation() {
        const startY = this.sprite.y;
        this.sprite.y = -100; // 画面外からスタート

        this.scene.tweens.add({
            targets: this.sprite,
            y: startY,
            duration: 1000,
            ease: 'Bounce.easeOut'
        });
    }

    // ============================================================
    // die() のオーバーライド
    // ボス死亡時はHPバーも削除し、クリア処理を実行
    // ============================================================
    die() {
        if (this.isDead) return;

        // HPバーを削除
        this.destroyHpBar();

        // 親クラスの die() を呼ぶ（XPドロップ・エフェクト等）
        super.die();

        // ボス固有の死亡通知
        this.scene.events.emit('bossDead', {
            type: this.type,
            isMidBoss: this.isMidBoss,
            isFinalBoss: this.isFinalBoss
        });
    }

    // ============================================================
    // destroy() のオーバーライド
    // HPバーも一緒に削除する
    // ============================================================
    destroy() {
        this.destroyHpBar();
        super.destroy();
    }
}
