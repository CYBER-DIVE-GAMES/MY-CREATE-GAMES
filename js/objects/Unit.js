// ============================================================
// Unit.js - ユニット基底クラス
// ============================================================

const UNIT_STATE = {
    WALKING:  'walking',
    FIGHTING: 'fighting',
    DEAD:     'dead',
};

// ユニットのピクセルアート定義（20x28, pixelSize=2 → 40x56）
// カラーパレット
const PC = {
    _: null,         // 透明
    S: 0xffcc88,     // 肌
    B: 0x3355ff,     // 青（剣士ボディ）
    G: 0x338833,     // 緑（弓兵ボディ）
    W: 0xeeeeee,     // 白/銀（騎士）
    P: 0x8833cc,     // 紫（魔法使い）
    T: 0x886633,     // 茶（投石機/木）
    R: 0xff2200,     // 赤（ドラゴン）
    K: 0x333333,     // 黒
    Y: 0xffee00,     // 黄
    A: 0x7799aa,     // 青灰（鎧）
    N: 0x997755,     // 肌暗め
    D: 0x222222,     // 暗い
    H: 0x555555,     // グレー（ヘルメット）
    O: 0x885522,     // オーク色
    E: 0xdddddd,     // 骨白
    M: 0x660066,     // ダークメイジ
    F: 0xff6600,     // 炎オレンジ
};

// ユニットスプライト用ピクセルデータ（12x16 グリッド）
const UNIT_PIXELS = {
    soldier: [
        '____HHHH____',
        '___HSSSH____',
        '___HSSSH____',
        '____HHHH____',
        '__BBBBBBBW__',
        '_ABBBBBBBBW_',
        '_ABBBBBBBWW_',
        '_ABBBBBBBBW_',
        '_ABBBBBBBBW_',
        '__BBBBBBBW__',
        '___BB__BB___',
        '___BB__BB___',
        '___BB__BB___',
        '___BB__BB___',
        '___BB__BB___',
        '____________',
    ],
    archer: [
        '____GGGG____',
        '___GSSSG____',
        '___GSSSG____',
        '____GGGG____',
        '__GGGGGGG___',
        '_TGGGGGGG___',
        '_TGGGGGGG___',
        '_TGGGGGGG___',
        '_TGGGGGGG___',
        '__GGGGGGG___',
        '___GG__GG___',
        '___GG__GG___',
        '___GG__GG___',
        '___GG__GG___',
        '___GG__GG___',
        '____________',
    ],
    knight: [
        '___HHHHHH___',
        '__HHSSSSHH__',
        '__HHSSSSHH__',
        '___HHHHHH___',
        '_WWWWWWWWWW_',
        'AWWWWWWWWWWA',
        'AWWWWWWWWWWA',
        'AWWWWWWWWWWA',
        'AWWWWWWWWWWA',
        '_WWWWWWWWWW_',
        '__WWW__WWW__',
        '__AWW__WWA__',
        '__AWW__WWA__',
        '__AWW__WWA__',
        '__AWW__WWA__',
        '____________',
    ],
    mage: [
        '___PPPPPP___',
        '__PPSSSSPP__',
        '__PPSSSSPP__',
        '___PPPPPP___',
        '__PPPPPPPP__',
        '_YPPPPPPPYY_',
        '_YPPPPPPPYY_',
        '__PPPPPPPP__',
        '__PPPPPPPP__',
        '__PPPPPPPP__',
        '___PP__PP___',
        '___PP__PP___',
        '___PP__PP___',
        '___PP__PP___',
        '___PP__PP___',
        '____________',
    ],
    catapult: [
        '____________',
        '____________',
        '__TTTTTTTT__',
        '_TTTTTTTTTT_',
        '__TTTT_TTT__',
        '____T___T___',
        '___TT___TT__',
        '__TTT___TTT_',
        'TTTTT___TTTT',
        'DDDDDDDDDDDD',
        '___YYYY_____',
        '__YYYYYY____',
        '___YYYY_____',
        '____________',
        '____________',
        '____________',
    ],
    dragon: [
        '___RRRRRR___',
        '__RRRSSRRR__',
        '_RRRSSSSRRR_',
        '__RRRRRRR___',
        'RRRRRRRRRRRR',
        'RRRRRRRRRRRR',
        '_RRRRRRRRRRR',
        '__RRRRRRRRR_',
        '___RRRRRRRR_',
        '____RRRRRRR_',
        '___RRFRRRR__',
        '__RRFFRRR___',
        '_RRRFRRR____',
        '__RRRRRR____',
        '___RRRR_____',
        '____________',
    ],
    goblin: [
        '____GGGG____',
        '___GNNNG____',
        '___GNNNG____',
        '____GGGG____',
        '__GGGGGGG___',
        '_GGGGGGGGG__',
        '_GGGGGGGGG__',
        '_GGGGGGGGG__',
        '__GGGGGGG___',
        '__GG___GG___',
        '__GG___GG___',
        '__GG___GG___',
        '____________',
        '____________',
        '____________',
        '____________',
    ],
    orc: [
        '___OOOOOO___',
        '__OOSSSOO___',
        '__OOSSSOO___',
        '___OOOOOO___',
        '_OOOOOOOOOO_',
        'OOOOOOOOOOOO',
        'OOOOOOOOOOOO',
        'OOOOOOOOOOOO',
        '_OOOOOOOOOO_',
        '__OOO__OOO__',
        '__OOO__OOO__',
        '__OOO__OOO__',
        '__OOO__OOO__',
        '__OOO__OOO__',
        '____________',
        '____________',
    ],
    skeleton_archer: [
        '____EEEE____',
        '___EEEEE____',
        '___EEEEE____',
        '____EEEE____',
        '__EEEEEEE___',
        'TEEEEEEEE___',
        'TEEEEEEEE___',
        'TEEEEEEEE___',
        '__EEEEEEE___',
        '___EE__EE___',
        '___EE__EE___',
        '___EE__EE___',
        '____________',
        '____________',
        '____________',
        '____________',
    ],
    troll: [
        '__DDDDDDDD__',
        '_DDSSSSSDD__',
        '_DDSSSSSDD__',
        '__DDDDDDDD__',
        'DDDDDDDDDDDD',
        'DDDDDDDDDDDD',
        'DDDDDDDDDDDD',
        'DDDDDDDDDDDD',
        'DDDDDDDDDDDD',
        '_DDDDDDDDD__',
        '__DD___DD___',
        '__DD___DD___',
        '__DD___DD___',
        '__DD___DD___',
        '__DD___DD___',
        '____________',
    ],
    dark_mage: [
        '___MMMMMM___',
        '__MMSSSMMM__',
        '__MMSSSMMM__',
        '___MMMMMM___',
        '__MMMMMMMM__',
        '_YPMMMMMMYY_',
        '_YPMMMMMMYY_',
        '__MMMMMMMM__',
        '__MMMMMMMM__',
        '__MMMMMMMM__',
        '___MM__MM___',
        '___MM__MM___',
        '___MM__MM___',
        '___MM__MM___',
        '___MM__MM___',
        '____________',
    ],
    enemy_dragon: [
        '___RRRRRR___',
        '__RRRSSRRR__',
        '_RRRSSSSRRR_',
        '__RRRRRRR___',
        'RRRRRRRRRRRR',
        'RRRRRRRRRRRR',
        '_RRRRRRRRRRR',
        '__RRRRRRRRR_',
        '___RRRRRRRRR',
        '____RRRRRRRR',
        '___RRFRRRRR_',
        '__RRRFFRRR__',
        '_RRRFRRR____',
        '__RRRRR_____',
        '___RRR______',
        '____________',
    ],
    boss_ogre: [
        '__DDDDDDDDDD',
        '_DDDSSSSSDDD',
        '_DDDSSSSSDDD',
        '__DDDDDDDDDD',
        'DDDDDDDDDDDD',
        'DDDDDDDDDDDD',
        'DDDDDDDDDDDD',
        'DDDDDDDDDDDD',
        'DDDDDDDDDDDD',
        'DDDDDDDDDDDD',
        '_DDDDDDDDDDD',
        '__DDDD__DDDD',
        '__DDDD__DDDD',
        '__DDDD__DDDD',
        '__DDDD__DDDD',
        '____________',
    ],
    boss_lich: [
        '___MMMMMM___',
        '__MMDDDMMM__',
        '__MMDDDMMM__',
        '___MMMMMM___',
        '__MMMMMMMM__',
        '_YPMMMMMYY__',
        '_YPMMMMMYY__',
        '__MMMMMMMM__',
        '__MMMMMMMM__',
        '__MMMMMMMM__',
        '___MM__MM___',
        '___MM__MM___',
        '___MM__MM___',
        '___MM__MM___',
        '___MM__MM___',
        '____________',
    ],
    boss_dragon: [
        '__RRRRRRRRRR',
        '_RRRSSSSRRRR',
        'RRRRSSSSRRRR',
        '_RRRRRRRRRRR',
        'RRRRRRRRRRRR',
        'RRRRRRRRRRRR',
        'RRRRRRRRRRRR',
        'RRRRRRRRRRRR',
        'RRRRRRRRRRR_',
        'RRRRRRRRRR__',
        'RRRRFRRRR___',
        'RRRFFFRRR___',
        'RRFFFRR_____',
        'RRRRRR______',
        'RRRR________',
        '____________',
    ],
};

class Unit {
    constructor(scene, x, y, config, isEnemy, upgrades) {
        this.scene = scene;
        this.isEnemy = isEnemy;
        this.config = config;

        // アップグレード済みステータス
        const upg = upgrades || {};
        this.maxHp     = Math.floor(config.hp * (1 + (upg.hp || 0) * 0.15));
        this.hp        = this.maxHp;
        this.attack    = Math.floor(config.attack * (1 + (upg.attack || 0) * 0.15));
        this.defense   = config.defense;
        this.speed     = Math.floor(config.speed * (1 + (upg.speed || 0) * 0.10));
        this.range     = config.range || 0;
        this.attackInterval = config.attackInterval || 1200;
        this.isRanged  = config.isRanged || false;
        this.isFlying  = config.isFlying || false;
        this.isMagic   = config.isMagic || false;
        this.isSiege   = config.isSiege || false;
        this.isBoss    = config.isBoss || false;
        this.splashRadius = config.splashRadius || 0;

        // 位置
        this.x = x;
        this.baseY = y; // 地上ユニットの標準Y
        this.y = this.isFlying ? y - 60 : y;

        // 状態
        this.state = UNIT_STATE.WALKING;
        this.target = null;
        this.lastAttackTime = 0;
        this.isDead = false;
        this.deadTimer = 0;

        // グラフィック
        this.pixelSize = this.isBoss ? 3 : 2;
        this.spriteKey = config.key;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(10);

        // ボスは少し大きめ
        if (this.isBoss) {
            this.maxHp = Math.floor(this.maxHp);
        }

        // HPバー
        this.hpBarBg = scene.add.graphics();
        this.hpBarBg.setDepth(11);
        this.hpBar = scene.add.graphics();
        this.hpBar.setDepth(12);

        // ダメージテキスト（一時表示）
        this.damageTexts = [];

        this.draw();
        this.drawHpBar();
    }

    draw() {
        const g = this.graphics;
        g.clear();

        const pixels = UNIT_PIXELS[this.spriteKey];
        if (!pixels) return;

        const ps = this.pixelSize;
        const cols = pixels[0].length;
        const rows = pixels.length;
        const offsetX = -Math.floor(cols * ps / 2);
        const offsetY = -Math.floor(rows * ps);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const ch = pixels[row][col];
                const color = PC[ch];
                if (color === null || color === undefined) continue;

                g.fillStyle(color);
                // 敵は左右反転
                let drawCol = this.isEnemy ? (cols - 1 - col) : col;
                g.fillRect(
                    this.x + offsetX + drawCol * ps,
                    this.y + offsetY + row * ps,
                    ps, ps
                );
            }
        }
    }

    drawHpBar() {
        const barW = this.isBoss ? 60 : 30;
        const barH = this.isBoss ? 6 : 4;
        const bx = this.x - barW / 2;
        const by = this.y - (this.isBoss ? 55 : 38);
        const ratio = Math.max(0, this.hp / this.maxHp);

        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x220000);
        this.hpBarBg.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

        this.hpBar.clear();
        const col = ratio > 0.5 ? 0x22cc22 : ratio > 0.25 ? 0xffaa00 : 0xff2222;
        this.hpBar.fillStyle(col);
        this.hpBar.fillRect(bx, by, Math.max(0, Math.floor(barW * ratio)), barH);
    }

    update(time, delta) {
        if (this.isDead) return;

        // ターゲットを探す
        this.target = this.findTarget();

        if (this.isRanged) {
            this.updateRanged(time, delta);
        } else {
            this.updateMelee(time, delta);
        }

        // 城に到達したかチェック
        this.checkCastleContact();

        // グラフィック更新
        this.draw();
        this.drawHpBar();
    }

    updateMelee(time, delta) {
        if (this.target && !this.target.isDead) {
            const dist = Math.abs(this.x - this.target.x);
            const meleeRange = 40;

            if (dist <= meleeRange) {
                // 戦闘
                this.state = UNIT_STATE.FIGHTING;
                if (time - this.lastAttackTime >= this.attackInterval) {
                    this.attackTarget(this.target, time);
                    this.lastAttackTime = time;
                }
            } else {
                // ターゲットに向かって歩く
                this.state = UNIT_STATE.WALKING;
                this.moveForward(delta);
            }
        } else {
            // ターゲットなし → 前進
            this.state = UNIT_STATE.WALKING;
            this.moveForward(delta);
        }
    }

    updateRanged(time, delta) {
        if (this.target && !this.target.isDead) {
            const dist = Math.abs(this.x - this.target.x);

            if (dist <= this.range) {
                // 射程内 → 攻撃
                this.state = UNIT_STATE.FIGHTING;
                if (time - this.lastAttackTime >= this.attackInterval) {
                    this.attackTarget(this.target, time);
                    this.lastAttackTime = time;
                }
            } else {
                // 射程外 → 前進
                this.state = UNIT_STATE.WALKING;
                this.moveForward(delta);
            }
        } else {
            this.state = UNIT_STATE.WALKING;
            this.moveForward(delta);
        }
    }

    moveForward(delta) {
        const dir = this.isEnemy ? -1 : 1;
        this.x += dir * this.speed * (delta / 1000);
    }

    checkCastleContact() {
        if (this.isEnemy) {
            // 自城（プレイヤー城）に到達
            if (this.x <= 110) {
                const dmg = this.scene.playerCastle.takeDamage(this.attack * 2);
                this.showDamageNumber(dmg, this.x, this.scene.GROUND_Y - 80, 0xff4444);
                this.die();
            }
        } else {
            // 敵城に到達
            if (this.x >= 690) {
                const dmg = this.scene.enemyCastle.takeDamage(this.attack * 2);
                this.showDamageNumber(dmg, this.x, this.scene.GROUND_Y - 80, 0xffaa44);
                this.die();
            }
        }
    }

    findTarget() {
        // 敵ユニット一覧を取得
        const enemies = this.isEnemy ? this.scene.playerUnits : this.scene.enemyUnits;

        let closest = null;
        let minDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.isDead) continue;
            // 自分と反対側にいる敵を優先（前にいる敵）
            const dist = Math.abs(this.x - enemy.x);
            const isAhead = this.isEnemy ? enemy.x > this.x : enemy.x < this.x;

            if (isAhead && dist < minDist) {
                // 前方の敵を優先
                minDist = dist;
                closest = enemy;
            }
        }

        if (!closest) {
            // 前方にいなければ全体で最も近い敵を探す
            for (const enemy of enemies) {
                if (enemy.isDead) continue;
                const dist = Math.abs(this.x - enemy.x);
                if (dist < minDist) {
                    minDist = dist;
                    closest = enemy;
                }
            }
        }

        return closest;
    }

    attackTarget(target, time) {
        if (this.isRanged) {
            // 飛び道具生成
            const proj = new Projectile(
                this.scene, this.x, this.y,
                target,
                Math.max(1, this.attack - target.defense + Phaser.Math.Between(-2, 2)),
                this.isMagic,
                this.isSiege,
                this.isEnemy
            );
            this.scene.projectiles.push(proj);
        } else {
            // 近接ダメージ
            const dmg = Math.max(1, this.attack - target.defense + Phaser.Math.Between(-2, 2));
            target.takeDamage(dmg);
            this.showDamageNumber(dmg, target.x, target.y - 20, this.isEnemy ? 0xff4444 : 0xffaa00);
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;
        const actualDmg = Math.max(1, amount - this.defense);
        this.hp -= actualDmg;

        // フラッシュ
        this.scene.tweens.add({
            targets: this.graphics,
            alpha: 0.2,
            duration: 80,
            yoyo: true,
            onComplete: () => { if (!this.isDead) this.graphics.alpha = 1; }
        });

        if (this.hp <= 0) {
            this.die();
        }
        return actualDmg;
    }

    showDamageNumber(dmg, x, y, color) {
        const txt = this.scene.add.text(x, y, `-${dmg}`, {
            fontSize: this.isBoss ? '14px' : '11px',
            fill: '#' + color.toString(16).padStart(6, '0'),
            fontFamily: 'monospace',
            stroke: '#000000',
            strokeThickness: 2,
        }).setDepth(30).setOrigin(0.5, 1);

        this.scene.tweens.add({
            targets: txt,
            y: y - 25,
            alpha: 0,
            duration: 700,
            onComplete: () => txt.destroy()
        });
    }

    die() {
        if (this.isDead) return;
        this.isDead = true;

        // 死亡アニメーション
        this.scene.tweens.add({
            targets: this.graphics,
            alpha: 0,
            y: this.y + 10,
            duration: 300,
            onComplete: () => {
                this.graphics.destroy();
                this.hpBarBg.destroy();
                this.hpBar.destroy();
            }
        });

        this.hpBarBg.destroy();
        this.hpBar.destroy();

        // 死亡時の小パーティクル
        this.createDeathEffect();
    }

    createDeathEffect() {
        const p = this.scene.add.graphics();
        p.setDepth(16);
        const col = this.isEnemy ? 0xff4400 : 0x4444ff;
        for (let i = 0; i < 5; i++) {
            p.fillStyle(col, 0.9);
            p.fillCircle(
                this.x + Phaser.Math.Between(-12, 12),
                this.y + Phaser.Math.Between(-8, 8),
                Phaser.Math.Between(2, 5)
            );
        }
        this.scene.tweens.add({
            targets: p,
            alpha: 0,
            duration: 400,
            onComplete: () => p.destroy()
        });
    }
}
