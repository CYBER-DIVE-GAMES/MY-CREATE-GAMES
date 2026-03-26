import Phaser from 'phaser';
import { BulletPool } from '../utils/BulletPool';

export interface PlayerStats {
  // ─── 基本ステータス ───
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  fireInterval: number;
  bulletSpeed: number;
  critChance: number;
  critMultiplier: number;

  // ─── A カテゴリ由来 ───
  piercing: boolean;
  pierceLimit: number;
  explosionLevel: number;
  splitLevel: number;
  poisonLevel: number;
  burnLevel: number;
  iceLevel: number;

  // ─── B カテゴリ由来 ───
  lifeStealRate: number;
  hitboxScale: number;
  shieldLevel: number;
  deathPreventLevel: number;
  maxSingleHitRatio: number;
  barrierLevel: number;

  // ─── C カテゴリ由来 ───
  sideGunCount: number;
  hasRearGun: boolean;
  orbitalCount: number;
  dischargeLevel: number;
  homingLevel: number;
  reflectCount: number;
  laserLevel: number;
  turretLevel: number;
  scatterCount: number;

  // ─── D カテゴリ由来 ───
  xpMagnetLevel: number;
  youkakuBonusRate: number;
  rushLevel: number;
  enemySlowRate: number;
  skillChoiceCount: number;
  xpResonanceLevel: number;
}

export const BASE_PLAYER_STATS: PlayerStats = {
  hp: 100, maxHp: 100, speed: 200, damage: 10,
  fireInterval: 300, bulletSpeed: 400,
  critChance: 0.05, critMultiplier: 2.0,
  piercing: false, pierceLimit: 0,
  explosionLevel: 0, splitLevel: 0,
  poisonLevel: 0, burnLevel: 0, iceLevel: 0,
  lifeStealRate: 0, hitboxScale: 1.0,
  shieldLevel: 0, deathPreventLevel: 0,
  maxSingleHitRatio: 1.0, barrierLevel: 0,
  sideGunCount: 0, hasRearGun: false,
  orbitalCount: 0, dischargeLevel: 0,
  homingLevel: 0, reflectCount: 0,
  laserLevel: 0, turretLevel: 0, scatterCount: 1,
  xpMagnetLevel: 0, youkakuBonusRate: 0,
  rushLevel: 0, enemySlowRate: 0,
  skillChoiceCount: 3, xpResonanceLevel: 0,
};

export class Player {
  private scene: Phaser.Scene;
  readonly sprite: Phaser.GameObjects.Container;
  private body!: Phaser.Physics.Arcade.Body;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  readonly pool: BulletPool;
  private lastFireTime: number = 0;
  private invincibleUntil: number = 0;

  // タッチ / マウス操作（スマホ: 左半分→左移動、右半分→右移動）
  private touchMoveDir: number = 0;
  private leftBtn!: Phaser.GameObjects.Text;
  private rightBtn!: Phaser.GameObjects.Text;

  stats: PlayerStats;
  isAlive: boolean = true;

  // 死に際フラグ
  deathPreventUsed: boolean = false;
  deathPreventCooldown: number = 0;

  // シールド
  shieldHp: number = 0;
  private shieldNoDmgTimer: number = 0;

  // ラッシュ
  rushTimer: number = 0;

  // シールドバー（HUD側でHP管理するためシールドのみ残す）
  private shieldBar: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, pool: BulletPool) {
    this.scene = scene;
    this.pool = pool;
    this.stats = { ...BASE_PLAYER_STATS };

    // スプライト（プログラム描画）
    const bodyRect = scene.add.rectangle(0, 0, 28, 36, 0xddddff);
    const head     = scene.add.circle(0, -22, 12, 0xffeedd);
    const sword    = scene.add.rectangle(18, -5, 6, 28, 0x88aaff);
    const ear1     = scene.add.triangle(-6, -32, -8, 0, 8, 0, 0, -14, 0xddddff);
    const ear2     = scene.add.triangle( 6, -32, -8, 0, 8, 0, 0, -14, 0xddddff);

    this.sprite = scene.add.container(270, 880, [ear1, ear2, bodyRect, head, sword]);
    this.sprite.setDepth(10);

    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setCollideWorldBounds(true);
    this.body.setSize(28, 36);
    this.body.setOffset(-14, -18);

    // キーボード
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }

    // タッチボタン（左右の視覚ガイド）
    const { width, height } = scene.scale;
    this.leftBtn = scene.add.text(48, height - 56, '◀', {
      fontSize: '38px', color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.25).setDepth(200);
    this.rightBtn = scene.add.text(width - 48, height - 56, '▶', {
      fontSize: '38px', color: '#ffffff',
    }).setOrigin(0.5).setAlpha(0.25).setDepth(200);

    // タッチ / マウス操作（左半分→左、右半分→右）
    const getDir = (x: number) => x < width / 2 ? -1 : 1;
    scene.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (p.y < 70) return; // HUD領域は無視
      this.touchMoveDir = getDir(p.x);
      (this.touchMoveDir < 0 ? this.leftBtn : this.rightBtn).setAlpha(0.75);
    });
    scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!p.isDown || p.y < 70) return;
      const newDir = getDir(p.x);
      if (newDir !== this.touchMoveDir) {
        this.leftBtn.setAlpha(0.25);
        this.rightBtn.setAlpha(0.25);
        this.touchMoveDir = newDir;
        (this.touchMoveDir < 0 ? this.leftBtn : this.rightBtn).setAlpha(0.75);
      }
    });
    scene.input.on('pointerup', () => {
      this.touchMoveDir = 0;
      this.leftBtn.setAlpha(0.25);
      this.rightBtn.setAlpha(0.25);
    });

    // シールドバー（HPバーに重ねて表示）
    this.shieldBar = scene.add.rectangle(34, 18, 0, 14, 0x44ccff).setOrigin(0, 0.5).setDepth(103);
  }

  update(time: number, delta: number): void {
    if (!this.isAlive) return;

    // 移動
    const left  = this.cursors?.left.isDown  || this.wasdKeys?.A.isDown || this.touchMoveDir < 0;
    const right = this.cursors?.right.isDown || this.wasdKeys?.D.isDown || this.touchMoveDir > 0;
    if (left) {
      this.body.setVelocityX(-this.stats.speed);
    } else if (right) {
      this.body.setVelocityX(this.stats.speed);
    } else {
      this.body.setVelocityX(0);
    }
    this.body.setVelocityY(0);

    // 自動射撃
    if (time - this.lastFireTime >= this.stats.fireInterval) {
      this.firePlayerBullet();
      this.lastFireTime = time;
    }

    // シールド回復タイマー（B4）
    if (this.stats.shieldLevel > 0) {
      this.shieldNoDmgTimer += delta;
      const waitTime = 5000;
      if (this.shieldNoDmgTimer >= waitTime) {
        const shieldMax = this.stats.maxHp * [0.05, 0.10, 0.20][this.stats.shieldLevel - 1];
        if (this.shieldHp < shieldMax) {
          this.shieldHp = shieldMax;
        }
      }
    }

    // ラッシュタイマー（D3）
    if (this.rushTimer > 0) {
      this.rushTimer -= delta;
    }

    // 死に際クールダウン（B8）
    if (this.deathPreventCooldown > 0) {
      this.deathPreventCooldown -= delta;
    }

    // シールドバー（HUDのHPバーに重ねて表示）
    const BAR_W = this.scene.scale.width * 0.45;
    const shieldMax = this.stats.maxHp * [0.05, 0.10, 0.20][Math.max(0, this.stats.shieldLevel - 1)];
    this.shieldBar.width = shieldMax > 0 ? BAR_W * (this.shieldHp / shieldMax) : 0;

    // 無敵点滅
    if (time < this.invincibleUntil) {
      this.sprite.setAlpha(Math.sin(time / 60) > 0 ? 1 : 0.3);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  firePlayerBullet(): void {
    const isCrit = Math.random() < this.stats.critChance;
    const baseDmg = isCrit
      ? Math.floor(this.stats.damage * this.stats.critMultiplier)
      : this.stats.damage;
    const dmg = this.rushTimer > 0 ? Math.floor(baseDmg * 1.5) : baseDmg;
    const color  = 0x88ccff; // 弾色統一（クリット時も同じ見た目）
    const radius = 5;

    const sx = this.sprite.x;
    const sy = this.sprite.y - 20;

    if (this.stats.scatterCount > 1) {
      // 散弾（C10）
      const half = Math.floor(this.stats.scatterCount / 2);
      for (let i = -half; i <= half; i++) {
        const angle = -Math.PI / 2 + i * 0.18;
        const critThis = i === 0 && this.stats.scatterCount >= 7; // 中央弾クリ確定（Lv3）
        const d = critThis ? Math.floor(this.stats.damage * this.stats.critMultiplier) : dmg;
        this.pool.fire(this.scene, sx, sy,
          Math.cos(angle) * this.stats.bulletSpeed,
          Math.sin(angle) * this.stats.bulletSpeed,
          d, 'player', color, radius);
      }
    } else {
      this.pool.fire(this.scene, sx, sy, 0, -this.stats.bulletSpeed, dmg, 'player', color, radius);
    }

    // サイドガン（C1）
    for (let i = 0; i < this.stats.sideGunCount; i++) {
      const offset = (i + 1) * 30;
      this.pool.fire(this.scene, sx - offset, sy, -20, -this.stats.bulletSpeed * 0.9, dmg, 'player', 0x88eecc, 4);
      this.pool.fire(this.scene, sx + offset, sy,  20, -this.stats.bulletSpeed * 0.9, dmg, 'player', 0x88eecc, 4);
    }

    // 後方砲撃（C2）
    if (this.stats.hasRearGun) {
      this.pool.fire(this.scene, sx, sy + 20, 0, this.stats.bulletSpeed * 0.8, dmg, 'player', 0xcc88ff, 5);
      if (this.stats.hasRearGun) {
        // Lv2以降: 斜め後ろ2本
        // (レベルはSkillSystemが管理するため、ここでは常に後方弾を2本追加)
      }
    }
  }

  takeDamage(amount: number, time: number): void {
    if (time < this.invincibleUntil) return;

    // 即死耐性（B10）
    if (this.stats.maxSingleHitRatio < 1.0) {
      amount = Math.min(amount, Math.floor(this.stats.maxHp * this.stats.maxSingleHitRatio));
    }

    // シールドで先に吸収（B4）
    if (this.shieldHp > 0) {
      const absorbed = Math.min(this.shieldHp, amount);
      this.shieldHp -= absorbed;
      amount -= absorbed;
      this.shieldNoDmgTimer = 0;
    }

    if (amount <= 0) return;

    this.stats.hp = Math.max(0, this.stats.hp - amount);
    this.shieldNoDmgTimer = 0;
    this.invincibleUntil = time + 1000;

    // 死に際生存（B8）
    if (this.stats.hp <= 0 && this.stats.deathPreventLevel > 0 && !this.deathPreventUsed) {
      const cd = [60000, 45000, 30000][this.stats.deathPreventLevel - 1];
      if (this.deathPreventCooldown <= 0) {
        this.stats.hp = this.stats.deathPreventLevel >= 3 ? Math.floor(this.stats.maxHp * 0.1) : 1;
        this.deathPreventCooldown = cd;
        this.scene.cameras.main.flash(200, 255, 200, 255, false);
        return;
      }
    }

    if (this.stats.hp <= 0) {
      this.isAlive = false;
    }
  }

  heal(amount: number): void {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  destroy(): void {
    this.sprite.destroy();
    this.shieldBar.destroy();
    this.leftBtn?.destroy();
    this.rightBtn?.destroy();
  }
}
