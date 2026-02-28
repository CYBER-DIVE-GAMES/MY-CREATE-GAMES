// ============================================================
// Projectile.js - 飛び道具クラス
// ============================================================

class Projectile {
    constructor(scene, x, y, target, damage, isMagic, isSiege, isEnemy) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.target = target;
        this.damage = damage;
        this.isMagic = isMagic;
        this.isSiege = isSiege;
        this.isEnemy = isEnemy;
        this.destroyed = false;

        // スピード
        this.speed = isSiege ? 280 : (isMagic ? 320 : 380);

        // グラフィック
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(15);

        this.draw();
    }

    draw() {
        const g = this.graphics;
        g.clear();

        if (this.isSiege) {
            // 岩（大きいグレー円）
            g.fillStyle(0x888888);
            g.fillCircle(0, 0, 7);
            g.fillStyle(0xaaaaaa);
            g.fillCircle(-2, -2, 3);
        } else if (this.isMagic) {
            // 魔法弾（輝く紫/青）
            const col = this.isEnemy ? 0xcc00ff : 0x8844ff;
            g.fillStyle(col, 0.5);
            g.fillCircle(0, 0, 8);
            g.fillStyle(col);
            g.fillCircle(0, 0, 5);
            g.fillStyle(0xffffff);
            g.fillCircle(-1, -1, 2);
        } else {
            // 矢（細い線 + 先端）
            const col = this.isEnemy ? 0xbbbbbb : 0xddbb44;
            g.fillStyle(col);
            g.fillRect(-8, -1, 14, 2);
            // 矢じり
            g.fillTriangle(6, -4, 6, 4, 12, 0);
            // 尾羽
            g.fillStyle(0xffffff);
            g.fillTriangle(-8, -3, -8, 3, -14, 0);
        }

        g.x = this.x;
        g.y = this.y;
    }

    update(delta) {
        if (this.destroyed) return;

        // ターゲットが死んでいたら消滅
        if (this.target && this.target.isDead) {
            this.destroy();
            return;
        }

        // ターゲット座標へ向かって移動
        let targetX, targetY;
        if (this.target) {
            targetX = this.target.x;
            targetY = this.target.y;
        } else {
            // ターゲットがなければ直進（城への攻撃の場合）
            targetX = this.isEnemy ? 80 : 720;
            targetY = this.scene.GROUND_Y - 60;
        }

        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
            // 命中
            this.onHit();
            return;
        }

        const moveX = (dx / dist) * this.speed * (delta / 1000);
        const moveY = (dy / dist) * this.speed * (delta / 1000);

        this.x += moveX;
        this.y += moveY;

        // 矢の場合は進行方向に向ける
        if (!this.isMagic && !this.isSiege) {
            this.graphics.setAngle(Math.atan2(dy, dx) * (180 / Math.PI));
        }

        this.draw();
    }

    onHit() {
        if (this.isSiege && this.target) {
            // 投石機は範囲ダメージ
            const splashRadius = 40;
            const allEnemies = this.isEnemy ? this.scene.playerUnits : this.scene.enemyUnits;
            allEnemies.forEach(unit => {
                if (!unit.isDead) {
                    const dx = unit.x - this.x;
                    const dy = unit.y - this.y;
                    if (Math.sqrt(dx * dx + dy * dy) <= splashRadius) {
                        unit.takeDamage(this.damage);
                    }
                }
            });
            // 城にもダメージ
            const castle = this.isEnemy ? this.scene.playerCastle : this.scene.enemyCastle;
            if (castle && Math.abs(this.x - castle.x) < 100) {
                castle.takeDamage(Math.floor(this.damage * 0.5));
            }
        } else if (this.isMagic && this.target && !this.target.isDead) {
            // 魔法弾は範囲ダメージ
            const splashRadius = 60;
            const allEnemies = this.isEnemy ? this.scene.playerUnits : this.scene.enemyUnits;
            allEnemies.forEach(unit => {
                if (!unit.isDead) {
                    const dx = unit.x - this.target.x;
                    const dy = unit.y - this.target.y;
                    if (Math.sqrt(dx * dx + dy * dy) <= splashRadius) {
                        unit.takeDamage(this.damage);
                    }
                }
            });
        } else if (this.target && !this.target.isDead) {
            // 通常矢は単体ダメージ
            this.target.takeDamage(this.damage);
        }

        // 命中エフェクト
        this.createHitEffect();
        this.destroy();
    }

    createHitEffect() {
        const particles = this.scene.add.graphics();
        particles.setDepth(16);

        const col = this.isMagic ? 0x8844ff : (this.isSiege ? 0x888844 : 0xffaa00);
        particles.fillStyle(col);
        for (let i = 0; i < 4; i++) {
            const px = this.x + Phaser.Math.Between(-8, 8);
            const py = this.y + Phaser.Math.Between(-8, 8);
            particles.fillCircle(px, py, Phaser.Math.Between(2, 4));
        }

        this.scene.tweens.add({
            targets: particles,
            alpha: 0,
            duration: 250,
            onComplete: () => particles.destroy()
        });
    }

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.graphics.destroy();
    }
}
