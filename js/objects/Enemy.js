// ============================================================
// js/objects/Enemy.js
// 敵キャラクタークラス
// 通常敵の移動・HP・ドロップ処理を担当します
// ============================================================

'use strict';

class Enemy {
    // ============================================================
    // コンストラクタ
    // scene      : 属するPhaser.Scene
    // x, y       : 生成座標
    // enemyType  : 敵の種類 (ENEMY_DATAのキー: 'grunt', 'speeder' 等)
    // hpMult     : HP倍率（時間経過・ステージ難易度で増加）
    // dmgMult    : ダメージ倍率
    // speedMult  : 速度倍率
    // ============================================================
    constructor(scene, x, y, enemyType, hpMult = 1, dmgMult = 1, speedMult = 1) {
        this.scene = scene;

        // EnemyDataから基本ステータスを取得
        const data = ENEMY_DATA[enemyType];
        if (!data) {
            console.error('Unknown enemy type:', enemyType);
            return;
        }

        this.type       = enemyType;
        this.isBoss     = data.isBoss || false;
        this.isMidBoss  = data.isMidBoss || false;
        this.isFinalBoss= data.isFinalBoss || false;

        // 倍率を適用してステータスを計算
        this.maxHp      = Math.round(data.hp    * hpMult);
        this.hp         = this.maxHp;
        this.damage     = Math.round(data.damage * dmgMult);
        this.speed      = data.speed * speedMult;
        this.xpValue    = data.xpValue;
        this.coinChance = data.coinChance;
        this.coinAmount = data.coinAmount || [1, 2];
        this.scoreValue = data.scoreValue;
        this.size       = data.size;
        this.color      = data.color;
        this.shootsBack = data.shootsBack || false; // スナイパー専用

        // ダメージを受けた直後の無敵時間（点滅用）
        this.hitFlashTime = 0;

        // 死亡フラグ
        this.isDead = false;

        // スナイパーの射撃タイマー
        this.shootTimer = Phaser.Math.Between(2000, 4000);

        // ============================================================
        // Phaserスプライトを生成
        // テクスチャはBootSceneで生成されたものを使用
        // ============================================================
        const texKey = 'enemy_' + enemyType;
        this.sprite = scene.physics.add.sprite(x, y, texKey);
        this.sprite.setDepth(5);

        // スプライトからこのEnemyオブジェクトへの参照を持たせる
        this.sprite.enemyRef = this;
    }

    // ============================================================
    // update(player, delta)
    // 毎フレーム呼ばれる更新処理
    // player : プレイヤーオブジェクト（移動目標）
    // delta  : 前フレームからの経過時間（ms）
    // ============================================================
    update(player, delta) {
        if (this.isDead || !this.sprite.active) return;

        const px = player.getX();
        const py = player.getY();
        const ex = this.sprite.x;
        const ey = this.sprite.y;

        // プレイヤーに向かって移動する
        const dx = px - ex;
        const dy = py - ey;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5) {
            // 方向を正規化して速度を掛ける
            this.sprite.body.setVelocity(
                (dx / dist) * this.speed,
                (dy / dist) * this.speed
            );
        } else {
            this.sprite.body.setVelocity(0, 0);
        }

        // スナイパーは定期的に弾を発射する
        if (this.shootsBack) {
            this.shootTimer -= delta;
            if (this.shootTimer <= 0) {
                this.shootTimer = Phaser.Math.Between(2500, 4500);
                this.fireAtPlayer(player);
            }
        }

        // ヒットフラッシュ（ダメージを受けたとき一瞬白くなる）
        if (this.hitFlashTime > 0) {
            this.hitFlashTime -= delta;
            this.sprite.setTint(0xffffff); // 白くする
        } else {
            this.sprite.clearTint(); // 元の色に戻す
        }
    }

    // ============================================================
    // fireAtPlayer(player)
    // スナイパーがプレイヤーへ向けて弾を撃つ
    // ============================================================
    fireAtPlayer(player) {
        if (!this.scene.enemyBullets) return;

        const bullet = this.scene.enemyBullets.get(this.sprite.x, this.sprite.y, 'bullet_enemy');
        if (!bullet) return;

        bullet.setActive(true).setVisible(true);
        bullet.setDepth(6);
        bullet.setTint(0xaa44ff);

        const dx = player.getX() - this.sprite.x;
        const dy = player.getY() - this.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = 250;

        bullet.body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
        bullet.damage = Math.round(this.damage * 0.6); // 弾のダメージは接触の60%
    }

    // ============================================================
    // takeDamage(amount)
    // ダメージを受ける処理
    // amount : 受けるダメージ量
    // 戻り値 : true なら死亡
    // ============================================================
    takeDamage(amount) {
        if (this.isDead) return false;

        this.hp -= amount;

        // ダメージを受けたときに点滅させる（50msだけ白くなる）
        this.hitFlashTime = 50;

        // HP が 0 以下になったら死亡
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
            return true; // 死亡を返す
        }

        return false;
    }

    // ============================================================
    // die()
    // 死亡処理：XP・コインをドロップしてスプライトを削除
    // ============================================================
    die() {
        if (this.isDead) return;
        this.isDead = true;

        const x = this.sprite.x;
        const y = this.sprite.y;

        // 爆発エフェクト（小さい円が広がる）
        this.createDeathEffect(x, y);

        // XP オーブをドロップ
        this.scene.dropXpOrb(x, y, this.xpValue);

        // コインをドロップ（確率に基づいて）
        if (Math.random() < this.coinChance) {
            const coinCount = Phaser.Math.Between(this.coinAmount[0], this.coinAmount[1]);
            this.scene.dropCoin(x, y, coinCount);
        }

        // スプライトを非表示→削除
        this.sprite.setActive(false).setVisible(false);
        this.sprite.destroy();

        // ゲームシーンに死亡を通知（スコア加算など）
        this.scene.events.emit('enemyKilled', {
            type: this.type,
            score: this.scoreValue,
            isBoss: this.isBoss
        });
    }

    // ============================================================
    // createDeathEffect(x, y)
    // 死亡時の爆発エフェクトを生成する
    // ============================================================
    createDeathEffect(x, y) {
        const g = this.scene.add.graphics();
        g.setDepth(20);
        g.fillStyle(this.color, 0.8);
        g.fillCircle(0, 0, this.size * 0.8);
        g.x = x;
        g.y = y;

        // 拡大しながらフェードアウト
        this.scene.tweens.add({
            targets: g,
            scaleX: 2.5,
            scaleY: 2.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => g.destroy()
        });
    }

    // ============================================================
    // getHpRatio()
    // HP割合を返す（0.0〜1.0）。ボスのHPバー表示用
    // ============================================================
    getHpRatio() {
        return this.hp / this.maxHp;
    }

    // 現在の座標を返すヘルパー
    getX() { return this.sprite.x; }
    getY() { return this.sprite.y; }

    // ============================================================
    // destroy()
    // 強制削除（シーン終了時など）
    // ============================================================
    destroy() {
        this.isDead = true;
        if (this.sprite && this.sprite.active) this.sprite.destroy();
    }
}
