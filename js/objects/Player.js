// ============================================================
// js/objects/Player.js
// プレイヤークラス
// プレイヤーの移動・HP管理・ステータスを担当します
// ============================================================

'use strict';

class Player {
    // ============================================================
    // コンストラクタ
    // scene     : このプレイヤーが属するPhaser.Scene
    // x, y      : 初期座標
    // permBonus : 恒久強化から得たボーナス値のオブジェクト
    // ============================================================
    constructor(scene, x, y, permBonus = {}) {
        this.scene = scene;

        // --- 基本ステータス ---
        this.maxHp = 100 + (permBonus.maxHp || 0);
        this.hp    = this.maxHp;
        this.speed = Math.round(210 * (1 + (permBonus.speed || 0)));
        this.armor = 0;    // ダメージ軽減値（防御 - この値だけ受けるダメージを減らす）
        this.hpRegen = 0;  // 毎秒のHP自動回復量

        // --- 攻撃倍率（武器のダメージ・速度に掛ける係数）---
        this.damageMultiplier   = 1.0 * (1 + (permBonus.damage   || 0));
        this.fireRateMultiplier = 1.0 * (1 + (permBonus.fireRate || 0));

        // --- アイテム取得 ---
        this.pickupRadius   = Math.round(65 * (1 + (permBonus.pickup || 0))); // XP・コイン自動吸収半径(px)
        this.xpMultiplier   = 1.0;                                             // 経験値獲得倍率
        this.coinMultiplier = 1.0 * (1 + (permBonus.coinBonus || 0));         // コイン獲得倍率

        // --- 無敵時間（ダメージ後に無敵になる時間）---
        this.invincibleTime     = 0;   // 残り無敵時間（ms）
        this.invincibleDuration = 800; // 無敵の持続時間（ms）

        // --- HP回復用タイマー ---
        this.regenTimer = 0;

        // --- 死亡フラグ ---
        this.isDead = false;

        // ============================================================
        // Phaserスプライトの作成
        // 'player' テクスチャはBootSceneで生成済み
        // ============================================================
        this.sprite = scene.physics.add.sprite(x, y, 'player');
        this.sprite.setDepth(10); // 敵・弾より手前に表示
        this.sprite.setCollideWorldBounds(true); // 画面外に出ないよう制限

        // スプライトからプレイヤーオブジェクトを参照できるようにする（コリジョン処理用）
        this.sprite.playerRef = this;
    }

    // ============================================================
    // update(cursors, delta)
    // 毎フレーム呼ばれる更新処理
    // cursors : キーボード入力オブジェクト（A/Dキー）
    // delta   : 前フレームからの経過時間（ms）
    // ============================================================
    update(cursors, delta) {
        if (this.isDead) return;

        // --- A/D（左右のみ）で移動方向を決定 ---
        // 縦移動なし：プレイヤーは画面下部の固定Y位置で左右にのみ動く
        let vx = 0;

        if (cursors.A.isDown || cursors.LEFT.isDown)  vx = -this.speed; // 左移動
        if (cursors.D.isDown || cursors.RIGHT.isDown) vx =  this.speed; // 右移動

        this.sprite.body.setVelocity(vx, 0); // Y速度は常に0

        // --- 無敵時間の更新と点滅エフェクト ---
        if (this.invincibleTime > 0) {
            this.invincibleTime -= delta;
            // sin波で点滅：0.3〜1.0のアルファ値を繰り返す
            this.sprite.setAlpha(Math.sin(this.invincibleTime * 0.02) > 0 ? 1 : 0.3);
        } else {
            this.sprite.setAlpha(1); // 通常時は不透明
        }

        // --- HP自動回復（1秒ごとに hpRegen 分だけ回復）---
        if (this.hpRegen > 0) {
            this.regenTimer += delta;
            if (this.regenTimer >= 1000) {
                this.regenTimer -= 1000;
                this.hp = Math.min(this.hp + this.hpRegen, this.maxHp);
            }
        }
    }

    // ============================================================
    // takeDamage(amount)
    // ダメージを受ける処理
    // amount : 受けるダメージ量（防御値で軽減される）
    // ============================================================
    takeDamage(amount) {
        // 無敵中・死亡中はダメージなし
        if (this.invincibleTime > 0 || this.isDead) return;

        // 防御値でダメージを軽減（最低1ダメージは必ず受ける）
        const actualDamage = Math.max(1, amount - this.armor);
        this.hp -= actualDamage;

        // ダメージを受けたら無敵時間を開始
        this.invincibleTime = this.invincibleDuration;

        // 画面シェイクでダメージを演出
        this.scene.cameras.main.shake(120, 0.005);

        // HPが0以下になったら死亡
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
    }

    // ============================================================
    // die()
    // プレイヤー死亡処理
    // ============================================================
    die() {
        if (this.isDead) return;
        this.isDead = true;

        // 死亡エフェクト（拡大しながらフェードアウト）
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: 3,
            scaleY: 3,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                // GameSceneに死亡を通知
                this.scene.events.emit('playerDead');
            }
        });
    }

    // ============================================================
    // getHpRatio()
    // HP割合を返す（0.0〜1.0）。HPバー表示用
    // ============================================================
    getHpRatio() {
        return this.hp / this.maxHp;
    }

    // 現在の座標を返すヘルパー
    getX() { return this.sprite.x; }
    getY() { return this.sprite.y; }

    // ============================================================
    // destroy()
    // シーン終了時などにスプライトを削除する
    // ============================================================
    destroy() {
        if (this.sprite && this.sprite.active) this.sprite.destroy();
    }
}
