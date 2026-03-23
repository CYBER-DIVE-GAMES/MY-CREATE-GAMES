// ============================================================
// js/objects/Bullet.js
// 弾クラス
// 各種武器の弾（直線弾・拡散弾・追尾弾・レールガン・ミサイル）を管理します
// ============================================================

'use strict';

// ============================================================
// Bullet クラス
// Phaser の Physics Group から取り出したスプライトに動きを追加する
// ============================================================
class Bullet {
    // ============================================================
    // コンストラクタ
    // scene    : 属するPhaser.Scene
    // sprite   : Phaser の physics.add.group() から取り出したスプライト
    // weaponType : 武器の種類（WeaponDataのtype）
    // stats    : 武器の現在レベルのステータス
    // dmgMult  : プレイヤーのダメージ倍率
    // ============================================================
    constructor(scene, sprite, weaponType, stats, dmgMult = 1) {
        this.scene      = scene;
        this.sprite     = sprite;
        this.weaponType = weaponType;
        this.damage     = Math.round(stats.damage * dmgMult);
        this.speed      = stats.speed || 500;
        this.pierceLeft = stats.pierce || 0; // 貫通回数（レールガン）
        this.turnRate   = stats.turnRate || 0; // 旋回速度（追尾弾・ミサイル）
        this.radius     = stats.radius || 0;   // 爆発半径（ミサイル）
        this.isExploding= false; // 爆発処理済みフラグ

        // スプライトからこの Bullet オブジェクトを参照できるようにする
        sprite.bulletRef = this;
    }

    // ============================================================
    // update(delta, enemies)
    // 毎フレーム呼ばれる更新処理
    // delta   : 前フレームからの経過時間（ms）
    // enemies : 敵オブジェクトの配列（追尾弾・ミサイルのターゲット用）
    // ============================================================
    update(delta, enemies) {
        if (!this.sprite.active) return;

        switch (this.weaponType) {
            case 'homing':
                // 追尾弾：最も近い敵に向かって旋回しながら移動する
                this.updateHoming(delta, enemies);
                break;

            case 'missileStorm':
                // ミサイルストーム：追尾+爆発の組み合わせ
                this.updateHoming(delta, enemies);
                break;

            default:
                // 直線弾・拡散弾・レールガン：直進するだけなので更新不要
                break;
        }

        // 画面外に出たら非アクティブ化
        const W = this.scene.scale.width;
        const H = this.scene.scale.height;
        const x = this.sprite.x;
        const y = this.sprite.y;

        if (x < -50 || x > W + 50 || y < -50 || y > H + 50) {
            this.deactivate();
        }
    }

    // ============================================================
    // updateHoming(delta, enemies)
    // 追尾弾の旋回処理
    // 最も近い敵に向かって少しずつ方向を変える
    // ============================================================
    updateHoming(delta, enemies) {
        // 最も近い生きている敵を探す
        let nearestEnemy = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (!enemy || enemy.isDead || !enemy.sprite.active) continue;
            const dx = enemy.getX() - this.sprite.x;
            const dy = enemy.getY() - this.sprite.y;
            const dist = dx * dx + dy * dy; // sqrt不要（比較だけ）
            if (dist < minDist) {
                minDist = dist;
                nearestEnemy = enemy;
            }
        }

        if (!nearestEnemy) return; // 敵がいなければ直進のまま

        // 現在の速度方向（角度）を取得
        const currentAngle = Math.atan2(
            this.sprite.body.velocity.y,
            this.sprite.body.velocity.x
        );

        // 目標方向（最も近い敵への角度）を取得
        const targetAngle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            nearestEnemy.getX(), nearestEnemy.getY()
        );

        // 角度を turnRate に従ってゆっくり変化させる（最短ルートで旋回）
        const angleDiff = Phaser.Math.Angle.Wrap(targetAngle - currentAngle);
        const maxTurn = this.turnRate * (delta / 1000); // 1秒あたりの最大旋回量（ラジアン）
        const turn = Phaser.Math.Clamp(angleDiff, -maxTurn, maxTurn);

        const newAngle = currentAngle + turn;

        // 新しい方向に速度をセット
        this.sprite.body.setVelocity(
            Math.cos(newAngle) * this.speed,
            Math.sin(newAngle) * this.speed
        );
    }

    // ============================================================
    // onHitEnemy(enemy)
    // 敵に命中したときの処理
    // enemy : 命中した Enemy オブジェクト
    // 戻り値 : true = 弾を消す / false = 貫通して続ける
    // ============================================================
    onHitEnemy(enemy) {
        // 爆発タイプならAoE処理
        if (this.weaponType === 'missileStorm' && this.radius > 0) {
            this.explode(this.sprite.x, this.sprite.y);
            return true; // 命中後に消える
        }

        // レールガンや貫通弾は貫通カウントを減らす
        if (this.pierceLeft > 0) {
            this.pierceLeft--;
            return false; // まだ飛び続ける
        }

        return true; // 消える
    }

    // ============================================================
    // explode(x, y)
    // 爆発処理：爆発エフェクトを表示し、範囲内の全敵にダメージを与える
    // ============================================================
    explode(x, y) {
        if (this.isExploding) return;
        this.isExploding = true;

        // 爆発エフェクトを生成
        const gfx = this.scene.add.graphics();
        gfx.setDepth(15);
        gfx.fillStyle(0xff8800, 0.8);
        gfx.fillCircle(0, 0, this.radius);
        gfx.x = x;
        gfx.y = y;

        // 拡大しながらフェードアウト
        this.scene.tweens.add({
            targets: gfx,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0,
            duration: 350,
            ease: 'Power2',
            onComplete: () => gfx.destroy()
        });

        // 爆発範囲内の全ての敵にダメージを与える
        const allEnemies = this.scene.allEnemies;
        if (allEnemies) {
            for (const enemy of allEnemies) {
                if (!enemy || enemy.isDead || !enemy.sprite.active) continue;
                const dx = enemy.getX() - x;
                const dy = enemy.getY() - y;
                if (Math.sqrt(dx * dx + dy * dy) <= this.radius) {
                    enemy.takeDamage(this.damage);
                }
            }
        }
    }

    // ============================================================
    // deactivate()
    // 弾を非アクティブ化（グループにプールされ再利用される）
    // ============================================================
    deactivate() {
        if (!this.sprite.active) return;
        this.sprite.setActive(false).setVisible(false);
        this.sprite.body.setVelocity(0, 0);
    }
}

// ============================================================
// BulletFactory - 弾の生成ファクトリクラス
// WeaponManagerから呼ばれ、武器の種類に応じた弾を生成する
// ============================================================
class BulletFactory {

    // ============================================================
    // createBullets(scene, weaponId, stats, player, enemies, dmgMult, frMult)
    // 武器の種類に応じた弾を生成し、発射する
    // ============================================================
    static createBullets(scene, weaponId, stats, player, enemies, dmgMult = 1, frMult = 1) {
        const weaponData = WEAPON_DATA[weaponId];
        if (!weaponData) return;

        const px = player.getX();
        const py = player.getY();

        switch (weaponData.type) {

            // 直線弾：真上に向かって発射
            case 'bullet':
            case 'railgun':
                BulletFactory.fireStraight(scene, px, py, stats, weaponData, dmgMult);
                break;

            // 拡散弾：扇状に複数発射
            case 'spread':
                BulletFactory.fireSpread(scene, px, py, stats, weaponData, dmgMult);
                break;

            // 追尾弾：敵を追いかける弾を発射
            case 'homing':
            case 'missileStorm':
                BulletFactory.fireHoming(scene, px, py, stats, weaponData, enemies, dmgMult);
                break;

            // 爆発：プレイヤー周囲にAoEダメージ
            case 'explosion':
                BulletFactory.fireExplosion(scene, px, py, stats, weaponData, enemies, dmgMult);
                break;

            // レーザー：GameSceneで直接処理するため、ここでは何もしない
            case 'laser':
                // レーザーはWeaponManager.updateLaser()で処理
                break;
        }
    }

    // ============================================================
    // fireStraight: 直線弾・レールガンの発射
    // ============================================================
    static fireStraight(scene, px, py, stats, weaponData, dmgMult) {
        const count = stats.count || 1;
        const spacing = 20; // 弾の横間隔（px）

        for (let i = 0; i < count; i++) {
            const offsetX = (i - (count - 1) / 2) * spacing;
            const bullet = scene.bullets.get(px + offsetX, py, 'bullet_' + weaponData.type);

            if (!bullet) continue;
            bullet.setActive(true).setVisible(true);
            bullet.setDepth(8);
            bullet.setTint(weaponData.color);

            // 真上に発射
            bullet.body.setVelocity(0, -stats.speed);

            // Bullet オブジェクトを初期化
            bullet.bulletRef = new Bullet(scene, bullet, weaponData.type, stats, dmgMult);
        }
    }

    // ============================================================
    // fireSpread: 拡散弾の発射
    // ============================================================
    static fireSpread(scene, px, py, stats, weaponData, dmgMult) {
        const count       = stats.count || 3;
        const spreadAngle = stats.spreadAngle || 30; // 広がり角度（度）

        for (let i = 0; i < count; i++) {
            // -spreadAngle/2 〜 +spreadAngle/2 の範囲で均等に角度を割り当てる
            const angleDeg = (count === 1) ? -90 :
                -90 - spreadAngle / 2 + (spreadAngle / (count - 1)) * i;
            const angleRad = Phaser.Math.DegToRad(angleDeg);

            const bullet = scene.bullets.get(px, py, 'bullet_spread');
            if (!bullet) continue;

            bullet.setActive(true).setVisible(true);
            bullet.setDepth(8);
            bullet.setTint(weaponData.color);

            bullet.body.setVelocity(
                Math.cos(angleRad) * stats.speed,
                Math.sin(angleRad) * stats.speed
            );

            bullet.bulletRef = new Bullet(scene, bullet, weaponData.type, stats, dmgMult);
        }
    }

    // ============================================================
    // fireHoming: 追尾弾・ミサイルストームの発射
    // ============================================================
    static fireHoming(scene, px, py, stats, weaponData, enemies, dmgMult) {
        const count = stats.count || 1;

        // 最も近い敵を探して最初のターゲットにする
        let nearestEnemy = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            if (!enemy || enemy.isDead || !enemy.sprite.active) continue;
            const dx = enemy.getX() - px;
            const dy = enemy.getY() - py;
            const dist = dx * dx + dy * dy;
            if (dist < minDist) { minDist = dist; nearestEnemy = enemy; }
        }

        // 発射方向：敵がいれば敵の方向、いなければ真上
        let baseAngle = -Math.PI / 2; // デフォルト: 真上
        if (nearestEnemy) {
            baseAngle = Phaser.Math.Angle.Between(px, py, nearestEnemy.getX(), nearestEnemy.getY());
        }

        for (let i = 0; i < count; i++) {
            // 複数発射のとき少しランダムに角度をばらかす
            const angleOffset = count > 1 ? Phaser.Math.FloatBetween(-0.4, 0.4) : 0;
            const angle = baseAngle + angleOffset;

            const bullet = scene.bullets.get(px, py, 'bullet_homing');
            if (!bullet) continue;

            bullet.setActive(true).setVisible(true);
            bullet.setDepth(8);
            bullet.setTint(weaponData.color);

            bullet.body.setVelocity(
                Math.cos(angle) * stats.speed,
                Math.sin(angle) * stats.speed
            );

            bullet.bulletRef = new Bullet(scene, bullet, weaponData.type, stats, dmgMult);
        }
    }

    // ============================================================
    // fireExplosion: 爆発武器の処理
    // 弾を飛ばさず、敵のいる場所に直接爆発を起こす
    // ============================================================
    static fireExplosion(scene, px, py, stats, weaponData, enemies, dmgMult) {
        const count = stats.count || 1;
        const radius = stats.radius || 80;
        const damage = Math.round(stats.damage * dmgMult);

        for (let c = 0; c < count; c++) {
            // 生きている敵の中からランダムに1体選んで爆発させる
            const livingEnemies = enemies.filter(e => e && !e.isDead && e.sprite.active);

            let explodeX, explodeY;
            if (livingEnemies.length > 0) {
                const target = livingEnemies[Math.floor(Math.random() * livingEnemies.length)];
                explodeX = target.getX() + Phaser.Math.Between(-30, 30);
                explodeY = target.getY() + Phaser.Math.Between(-30, 30);
            } else {
                // 敵がいなければプレイヤー周囲にランダム爆発
                explodeX = px + Phaser.Math.Between(-100, 100);
                explodeY = py + Phaser.Math.Between(-100, 100);
            }

            // 爆発エフェクト
            BulletFactory.createExplosionEffect(scene, explodeX, explodeY, radius, damage, weaponData.color);
        }
    }

    // ============================================================
    // createExplosionEffect: 爆発のビジュアルエフェクトとダメージ処理
    // ============================================================
    static createExplosionEffect(scene, x, y, radius, damage, color) {
        // 爆発エフェクト（輪が広がる）
        const outer = scene.add.graphics();
        outer.setDepth(15);
        outer.lineStyle(4, color, 0.9);
        outer.strokeCircle(0, 0, radius * 0.5);
        outer.x = x;
        outer.y = y;

        const inner = scene.add.graphics();
        inner.setDepth(15);
        inner.fillStyle(color, 0.5);
        inner.fillCircle(0, 0, radius * 0.4);
        inner.x = x;
        inner.y = y;

        scene.tweens.add({
            targets: [outer, inner],
            scaleX: 2, scaleY: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => { outer.destroy(); inner.destroy(); }
        });

        // 爆発範囲内の全ての敵にダメージ
        const allEnemies = scene.allEnemies;
        if (allEnemies) {
            for (const enemy of allEnemies) {
                if (!enemy || enemy.isDead || !enemy.sprite.active) continue;
                const dx = enemy.getX() - x;
                const dy = enemy.getY() - y;
                if (Math.sqrt(dx * dx + dy * dy) <= radius) {
                    enemy.takeDamage(damage);
                }
            }
        }
    }
}
