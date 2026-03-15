// ============================================================
// js/managers/WeaponManager.js
// 武器管理マネージャー
// プレイヤーが所持する武器の管理・自動発射・レーザー処理を担当します
// ============================================================

'use strict';

class WeaponManager {
    // ============================================================
    // コンストラクタ
    // scene  : 属するPhaser.Scene
    // player : プレイヤーオブジェクト
    // ============================================================
    constructor(scene, player) {
        this.scene  = scene;
        this.player = player;

        // 所持武器リスト
        // 形式: { id: 'straightShot', level: 1, lastFired: 0, ... }
        this.weapons = [];

        // 武器最大所持数（通常5枠）
        this.maxWeapons = 5;

        // ============================================================
        // レーザー専用のグラフィックスオブジェクト
        // レーザーは弾を飛ばさず、毎フレーム線を描画する特殊武器
        // ============================================================
        this.laserGraphics  = scene.add.graphics();
        this.laserGraphics.setDepth(12);
        this.laserGraphics.setVisible(false);
        this.laserLastDmgTime = 0; // 最後にダメージを与えた時刻
    }

    // ============================================================
    // addWeapon(weaponId)
    // 武器を追加する（すでに持っている場合はレベルアップ）
    // 戻り値: 'added' / 'upgraded' / 'max' / 'full' / 'evolved'
    // ============================================================
    addWeapon(weaponId) {
        const weaponData = WEAPON_DATA[weaponId];
        if (!weaponData) return 'error';

        // 奥義武器の特殊処理
        if (weaponData.isUltimate) {
            return this.addUltimateWeapon(weaponId, weaponData);
        }

        // 既に所持しているか確認
        const existing = this.weapons.find(w => w.id === weaponId);

        if (existing) {
            // レベルアップ
            if (existing.level < weaponData.maxLevel) {
                existing.level++;
                return 'upgraded';
            }
            return 'max'; // 最大レベルなので変化なし
        } else {
            // 新規追加（武器スロットが空いているか確認）
            if (this.weapons.length >= this.maxWeapons) return 'full';
            this.weapons.push(this._makeWeaponEntry(weaponId));
            return 'added';
        }
    }

    // ============================================================
    // _makeWeaponEntry(weaponId)
    // 武器エントリオブジェクトを作成するヘルパー
    // ============================================================
    _makeWeaponEntry(weaponId) {
        return {
            id:          weaponId,
            level:       1,
            lastFired:   0,
            // レーザー専用状態管理
            laserState:  'cooldown', // 'cooldown' or 'firing'
            laserTimer:  0           // 現在の状態の経過時間(ms)
        };
    }

    // ============================================================
    // addUltimateWeapon(weaponId, weaponData)
    // 奥義武器を追加：requires の武器を削除して奥義に置き換える
    // ============================================================
    addUltimateWeapon(weaponId, weaponData) {
        // requires の武器をリストから削除
        for (const reqId of weaponData.requires) {
            const idx = this.weapons.findIndex(w => w.id === reqId);
            if (idx !== -1) this.weapons.splice(idx, 1);
        }
        // 奥義武器を追加
        this.weapons.push(this._makeWeaponEntry(weaponId));
        return 'evolved';
    }

    // ============================================================
    // update(time, delta)
    // 毎フレーム呼ばれる更新処理（全武器の自動発射を管理）
    // time  : Phaser の現在時刻（ms）
    // delta : 前フレームからの経過時間（ms）
    // ============================================================
    update(time, delta) {
        if (this.player.isDead) {
            // 死亡時はレーザーを消す
            this.laserGraphics.setVisible(false);
            return;
        }

        const enemies = this.scene.allEnemies;

        for (const weapon of this.weapons) {
            const weaponData = WEAPON_DATA[weapon.id];
            if (!weaponData) continue;

            const stats = weaponData.stats[weapon.level - 1]; // 現在レベルのステータス

            if (weaponData.type === 'laser') {
                // レーザーは専用更新処理へ
                this.updateLaser(weapon, stats, delta, time);
                continue;
            }

            // 発射速度に fireRateMultiplier を適用（高いほど早く撃てる）
            const adjustedRate = stats.fireRate / this.player.fireRateMultiplier;

            if (time - weapon.lastFired >= adjustedRate) {
                weapon.lastFired = time;
                SOUND.playWeaponShot(weapon.id);
                BulletFactory.createBullets(
                    this.scene,
                    weapon.id,
                    stats,
                    this.player,
                    enemies,
                    this.player.damageMultiplier,
                    this.player.fireRateMultiplier
                );
            }
        }
    }

    // ============================================================
    // updateLaser(weapon, stats, delta, time)
    // レーザー武器の状態機械（ステートマシン）
    // クールダウン → 発射 → クールダウン ... を繰り返す
    // ============================================================
    updateLaser(weapon, stats, delta, time) {
        const adjustedCooldown = stats.cooldown / this.player.fireRateMultiplier;
        weapon.laserTimer += delta;

        if (weapon.laserState === 'cooldown') {
            // クールダウン中：レーザーを非表示にして待つ
            this.laserGraphics.setVisible(false);
            if (weapon.laserTimer >= adjustedCooldown) {
                weapon.laserTimer = 0;
                weapon.laserState = 'firing';
                SOUND.playLaserStart();
            }

        } else if (weapon.laserState === 'firing') {
            // 発射中：レーザーを描画してダメージを与える
            this.drawLaser(stats);

            // fireRate 間隔でダメージを与える（毎フレームにしない）
            if (time - this.laserLastDmgTime >= stats.fireRate) {
                this.laserLastDmgTime = time;
                this.applyLaserDamage(stats);
            }

            // 発射時間が経過したらクールダウンへ
            if (weapon.laserTimer >= stats.duration) {
                weapon.laserTimer = 0;
                weapon.laserState = 'cooldown';
                this.laserGraphics.setVisible(false);
            }
        }
    }

    // ============================================================
    // drawLaser(stats)
    // プレイヤーの上方向にレーザービームを描画する
    // ============================================================
    drawLaser(stats) {
        const px = this.player.getX();
        const py = this.player.getY();

        this.laserGraphics.clear();
        this.laserGraphics.setVisible(true);

        // コアビーム（細い高輝度）
        this.laserGraphics.lineStyle(stats.width, 0xff88bb, 1.0);
        this.laserGraphics.beginPath();
        this.laserGraphics.moveTo(px, py);
        this.laserGraphics.lineTo(px, 0);
        this.laserGraphics.strokePath();

        // グロー（外側の光彩）
        this.laserGraphics.lineStyle(stats.width * 3, 0xff0055, 0.25);
        this.laserGraphics.beginPath();
        this.laserGraphics.moveTo(px, py);
        this.laserGraphics.lineTo(px, 0);
        this.laserGraphics.strokePath();
    }

    // ============================================================
    // applyLaserDamage(stats)
    // レーザーの X 座標付近にいる敵にダメージを与える
    // ============================================================
    applyLaserDamage(stats) {
        const px  = this.player.getX();
        const py  = this.player.getY();
        const hitW = stats.width * 2 + 12; // 当たり判定の横幅
        const dmg = Math.round(stats.damage * this.player.damageMultiplier);

        for (const enemy of this.scene.allEnemies) {
            if (!enemy || enemy.isDead || !enemy.sprite.active) continue;
            // プレイヤーより上にいて、X 軸が一致する敵がターゲット
            if (Math.abs(enemy.getX() - px) <= hitW && enemy.getY() < py) {
                enemy.takeDamage(dmg);
            }
        }
    }

    // ============================================================
    // checkEvolution()
    // 進化可能な奥義武器があるか確認する
    // 戻り値: 進化可能な武器IDの配列
    // ============================================================
    checkEvolution() {
        const evolvable = [];
        for (const [id, data] of Object.entries(WEAPON_DATA)) {
            if (!data.isUltimate) continue;
            if (this.hasWeapon(id)) continue; // 既に持っている

            // requires の武器が全てLv3以上あるか確認
            const canEvolve = data.requires.every(reqId => {
                const w = this.weapons.find(w => w.id === reqId);
                return w && w.level >= 3;
            });

            if (canEvolve) evolvable.push(id);
        }
        return evolvable;
    }

    // ============================================================
    // hasWeapon(weaponId) : 指定武器を所持しているか確認
    // ============================================================
    hasWeapon(weaponId) {
        return this.weapons.some(w => w.id === weaponId);
    }

    // ============================================================
    // getWeaponList() : UI表示用の武器一覧を返す
    // ============================================================
    getWeaponList() {
        return this.weapons.map(w => {
            const d = WEAPON_DATA[w.id];
            return {
                id: w.id,
                level: w.level,
                name: d ? d.name : w.id,
                isUltimate: d ? (d.isUltimate || false) : false
            };
        });
    }

    // ============================================================
    // destroy() : シーン終了時のクリーンアップ
    // ============================================================
    destroy() {
        if (this.laserGraphics) this.laserGraphics.destroy();
    }
}
