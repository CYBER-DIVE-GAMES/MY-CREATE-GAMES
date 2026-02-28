// ============================================================
// Entity.js - エンティティ基底クラス (デスク・ウォーズ)
// ============================================================

/**
 * ユニットの状態マシン
 * IDLE:   待機
 * WALK:   移動中
 * ATTACK: 攻撃中
 * DEAD:   死亡
 */
const ENTITY_STATE = {
    IDLE:   'IDLE',
    WALK:   'WALK',
    ATTACK: 'ATTACK',
    DEAD:   'DEAD'
};

/**
 * Entity - 全ゲームオブジェクトの基底クラス
 *
 * 設計方針:
 *  - x, y は中心座標
 *  - AABB (軸平行境界ボックス) による当たり判定
 *  - ステートマシンで状態管理 (IDLE / WALK / ATTACK / DEAD)
 *  - drawShape() をオーバーライドすることで見た目のカスタマイズが可能
 *  - this.image に HTMLImageElement をセットすれば後から画像差し替え可能
 */
class Entity {
    /**
     * @param {number} x       - 中心X座標
     * @param {number} y       - 中心Y座標
     * @param {number} width   - 幅
     * @param {number} height  - 高さ
     * @param {Object} cfg     - ステータス設定
     */
    constructor(x, y, width, height, cfg = {}) {
        // ── 位置・サイズ ────────────────────────────────────────
        this.x      = x;
        this.y      = y;
        this.width  = width;
        this.height = height;

        // ── 基本ステータス ──────────────────────────────────────
        this.hp             = cfg.hp             ?? 100;
        this.maxHp          = this.hp;
        this.attack         = cfg.attack         ?? 10;
        this.defense        = cfg.defense        ?? 0;
        this.speed          = cfg.speed          ?? 50;   // ピクセル/秒
        this.range          = cfg.range          ?? 50;   // 攻撃射程 (px)
        this.attackInterval = cfg.attackInterval ?? 1000; // 攻撃間隔 (ms)

        // ── 状態管理 ────────────────────────────────────────────
        this.state  = ENTITY_STATE.IDLE;
        this.isDead = false;
        this.alpha  = 1.0;

        // ── ビジュアル ──────────────────────────────────────────
        this.color      = cfg.color ?? '#888888';
        this.flashTimer = 0; // ダメージフラッシュの残り時間 (ms)

        // 画像サポート:
        //   this.image に HTMLImageElement をセットすると画像描画に切り替わる
        //   this.imageKey で画像の種類を識別 (将来のアセット管理用)
        this.image    = null;
        this.imageKey = cfg.imageKey ?? null;

        // ── 戦闘 ────────────────────────────────────────────────
        this.lastAttackTime = 0;   // 最後に攻撃した時刻 (performance.now の ms)
        this.target         = null;

        // ── フラグ ──────────────────────────────────────────────
        this.isEnemy      = cfg.isEnemy      ?? false;
        this.isRanged     = cfg.isRanged     ?? false;
        this.isBoss       = cfg.isBoss       ?? false;
        this.isSplash     = cfg.isSplash     ?? false;
        this.splashRadius = cfg.splashRadius ?? 0;
    }

    // ── AABB 当たり判定 ─────────────────────────────────────────

    /** 矩形境界ボックスを返す */
    getBounds() {
        const hw = this.width  * 0.5;
        const hh = this.height * 0.5;
        return {
            left:   this.x - hw,
            top:    this.y - hh,
            right:  this.x + hw,
            bottom: this.y + hh
        };
    }

    /** 他エンティティと重なっているか (AABB) */
    intersects(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return (a.left   < b.right  &&
                a.right  > b.left   &&
                a.top    < b.bottom &&
                a.bottom > b.top);
    }

    /** 他エンティティへの水平距離 (px) */
    distanceTo(other) {
        return Math.abs(this.x - other.x);
    }

    // ── 戦闘 ────────────────────────────────────────────────────

    /**
     * ダメージを受ける
     * @param {number} amount - ダメージ量 (防御力適用前)
     * @returns {number}       実際に受けたダメージ量
     */
    takeDamage(amount) {
        if (this.isDead) return 0;
        const dmg = Math.max(1, Math.round(amount - this.defense));
        this.hp -= dmg;
        this.flashTimer = 120; // 120ms 白フラッシュ
        if (this.hp <= 0) {
            this.hp = 0;
            this.die();
        }
        return dmg;
    }

    /** 死亡処理 */
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.state  = ENTITY_STATE.DEAD;
    }

    // ── 描画 ────────────────────────────────────────────────────

    /** HPバーを頭上に描画する */
    drawHpBar(ctx) {
        if (this.isDead) return;
        const bw = this.isBoss ? 80 : Math.max(this.width, 24);
        const bh = this.isBoss ? 8  : 4;
        const bx = this.x - bw * 0.5;
        const by = this.y - this.height * 0.5 - bh - 4;
        const r  = Math.max(0, this.hp / this.maxHp);

        // 背景
        ctx.fillStyle = '#222';
        ctx.fillRect(bx - 1, by - 1, bw + 2, bh + 2);

        // HP ゲージ
        ctx.fillStyle = r > 0.5 ? '#2d2' : r > 0.25 ? '#fa0' : '#f33';
        ctx.fillRect(bx, by, bw * r, bh);

        // ボスは HP 数値も表示
        if (this.isBoss) {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.font      = 'bold 9px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(this.hp), this.x, by - 1);
            ctx.restore();
        }
    }

    /**
     * エンティティを描画する
     *   - this.image が設定されていれば画像を描画 (敵は左右反転)
     *   - そうでなければ drawShape() でカラー矩形を描画
     */
    draw(ctx) {
        if (this.alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha *= this.alpha;

        if (this.image) {
            // ── 画像モード ──────────────────────────────────────
            ctx.save();
            if (this.isEnemy) {
                // 敵は左右反転して描画
                ctx.translate(this.x, 0);
                ctx.scale(-1, 1);
                ctx.translate(-this.x, 0);
            }
            ctx.drawImage(
                this.image,
                this.x - this.width  * 0.5,
                this.y - this.height * 0.5,
                this.width,
                this.height
            );
            ctx.restore();
        } else {
            // ── シェイプモード ─────────────────────────────────
            this.drawShape(ctx);
        }

        ctx.restore();
        this.drawHpBar(ctx);
    }

    /**
     * カスタム形状を描画する。
     * サブクラスでオーバーライドして独自の形状を実装できる。
     * デフォルト: カラー矩形 (ダメージ時は白くフラッシュ)
     */
    drawShape(ctx) {
        ctx.fillStyle = this.flashTimer > 0 ? '#ffffff' : this.color;
        ctx.fillRect(
            this.x - this.width  * 0.5,
            this.y - this.height * 0.5,
            this.width,
            this.height
        );
    }

    /**
     * フラッシュタイマーを更新する。毎フレーム呼ぶこと。
     * @param {number} deltaMs - 前フレームからの経過時間 (ms)
     */
    updateFlash(deltaMs) {
        if (this.flashTimer > 0) {
            this.flashTimer = Math.max(0, this.flashTimer - deltaMs);
        }
    }
}
