import Phaser from 'phaser';
import { BulletPool } from '../utils/BulletPool';

export type MovePattern =
  | 'straight'         // 直線降下
  | 'zigzag'           // ジグザグ移動
  | 'wave'             // 蛇行しながら降下
  | 'wave_slow'        // ゆっくり蛇行降下
  | 'edge_bounce'      // 画面端を往復しながら降下
  | 'cross_horizontal' // 画面中央を横切る（降下しながら）
  | 'horizontal_top';  // 画面上部を横移動のみ（降下なし）

export type FirePattern =
  | 'none'
  | 'forward3'         // 前方3方向
  | 'radial8'          // 全方向8方向
  | 'aimed1'           // プレイヤー狙い撃ち
  | 'fan5_alt'         // 扇形5弾を左右交互
  | 'forward_stream'   // 進行方向に連続弾
  | 'aimed_fast'       // 高速単発プレイヤー狙い
  | 'rapid3'           // 正面に3発連続
  | 'radial8_rot'      // 8方向（回転しながら）
  | 'fan9_down'        // 扇形9弾を下方向
  | 'large3';          // 大型弾×3を下方向

export interface EnemyConfig {
  x: number;
  y: number;
  hp: number;
  speed: number;
  xp: number;
  youkakuDrop: number;
  youkakuChance: number;
  color: number;
  size: number;
  movePattern: MovePattern;
  firePattern: FirePattern;
  fireInterval: number; // ms
  bulletDamage: number;
}

// ステージ1 全10種の敵パラメータ
export const ENEMY_CONFIGS: Record<string, Omit<EnemyConfig, 'x' | 'y'>> = {
  // E1-1: 青白狐火 — 蛇行直線降下、接触型
  foxfire: {
    hp: 60, speed: 120, xp: 5, youkakuDrop: 1, youkakuChance: 0.2,
    color: 0x88aaff, size: 14,
    movePattern: 'wave', firePattern: 'none', fireInterval: 9999, bulletDamage: 0,
  },
  // E1-2: 武者幽霊 — 直線降下、前方3方向弾
  ghost_warrior: {
    hp: 180, speed: 90, xp: 15, youkakuDrop: 1, youkakuChance: 0.4,
    color: 0xaaaadd, size: 18,
    movePattern: 'straight', firePattern: 'forward3', fireInterval: 2000, bulletDamage: 8,
  },
  // E1-3: 桜乙女霊 — ゆっくり蛇行降下、全方向花びら弾8方向
  cherry_spirit: {
    hp: 80, speed: 55, xp: 10, youkakuDrop: 1, youkakuChance: 0.3,
    color: 0xffbbcc, size: 16,
    movePattern: 'wave_slow', firePattern: 'radial8', fireInterval: 2500, bulletDamage: 6,
  },
  // E1-4: 骸骨灯籠 — 静止しながらゆっくり降下、扇形5弾を左右交互
  skull_lantern: {
    hp: 200, speed: 45, xp: 20, youkakuDrop: 1, youkakuChance: 0.5,
    color: 0xffffaa, size: 20,
    movePattern: 'straight', firePattern: 'fan5_alt', fireInterval: 1800, bulletDamage: 7,
  },
  // E1-5: 鬼火大蛇 — 横に揺れながら降下、進行方向に連続弾
  fire_serpent: {
    hp: 400, speed: 75, xp: 40, youkakuDrop: 2, youkakuChance: 0.5,
    color: 0xff8800, size: 24,
    movePattern: 'wave', firePattern: 'forward_stream', fireInterval: 500, bulletDamage: 10,
  },
  // E1-6: 夜叉の眼 — 画面端を往復しながら降下、高速単発プレイヤー狙い
  yaksha_eye: {
    hp: 200, speed: 80, xp: 20, youkakuDrop: 1, youkakuChance: 0.4,
    color: 0xff2222, size: 16,
    movePattern: 'edge_bounce', firePattern: 'aimed_fast', fireInterval: 1500, bulletDamage: 12,
  },
  // E1-7: 踊り人形 — ジグザグ移動、正面に3発連続発射
  dancing_doll: {
    hp: 100, speed: 100, xp: 10, youkakuDrop: 1, youkakuChance: 0.3,
    color: 0xff88ff, size: 14,
    movePattern: 'zigzag', firePattern: 'rapid3', fireInterval: 900, bulletDamage: 5,
  },
  // E1-8: 影蜘蛛 — 画面中央を横切る軌道、8方向に糸弾（回転しながら）
  shadow_spider: {
    hp: 350, speed: 160, xp: 35, youkakuDrop: 2, youkakuChance: 0.5,
    color: 0x442266, size: 22,
    movePattern: 'cross_horizontal', firePattern: 'radial8_rot', fireInterval: 900, bulletDamage: 7,
  },
  // E1-9: 血桜の精 — V字型に2体で降下、扇形9弾を下方向
  blood_cherry: {
    hp: 300, speed: 70, xp: 30, youkakuDrop: 2, youkakuChance: 0.5,
    color: 0xff4488, size: 20,
    movePattern: 'straight', firePattern: 'fan9_down', fireInterval: 2000, bulletDamage: 8,
  },
  // E1-10: 冥界門番 — 画面上部を横移動（降下しない）、下方向に大型弾×3を周期的に
  gate_guardian: {
    hp: 800, speed: 110, xp: 100, youkakuDrop: 3, youkakuChance: 1.0,
    color: 0x664422, size: 32,
    movePattern: 'horizontal_top', firePattern: 'large3', fireInterval: 2800, bulletDamage: 15,
  },
};

export class Enemy {
  readonly scene: Phaser.Scene;
  readonly sprite: Phaser.GameObjects.Arc;
  private pool: BulletPool;
  readonly config: EnemyConfig;

  hp: number;
  private timeSinceFire: number = 0;
  private waveOffset: number = 0;
  private zigzagTimer: number = 0;
  private zigzagDir: number = 1;
  private edgeMoveDir: number = 1;
  private rotationAngle: number = 0;
  private fanAltState: boolean = false;
  private horizontalDir: number = 1;
  private settledY: boolean = false;  // horizontal_top が定位置に達したか
  private readonly sceneWidth: number;

  isAlive: boolean = true;

  constructor(scene: Phaser.Scene, config: EnemyConfig, pool: BulletPool) {
    this.scene = scene;
    this.config = config;
    this.pool = pool;
    this.hp = config.hp;
    this.sceneWidth = scene.scale.width;

    this.sprite = scene.add.circle(config.x, config.y, config.size, config.color);
    scene.physics.add.existing(this.sprite);
    this.sprite.setDepth(5);

    // edge_bounce の初期方向をランダムに
    this.edgeMoveDir = Math.random() < 0.5 ? 1 : -1;
    // 回転オフセットをランダムに（radial8_rot の分散）
    this.rotationAngle = Math.random() * Math.PI * 2;
    // cross_horizontal: 初期X位置から横断方向を自動決定
    if (config.movePattern === 'cross_horizontal') {
      this.horizontalDir = config.x < this.sceneWidth / 2 ? 1 : -1;
    }
  }

  update(delta: number): void {
    if (!this.isAlive) return;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    this.updateMove(body, delta);
    this.updateFire(delta);

    // 画面外に出たら消滅（horizontal_top を除く）
    if (this.config.movePattern !== 'horizontal_top') {
      if (this.sprite.y > 1020 || this.sprite.x < -100 || this.sprite.x > this.sceneWidth + 100) {
        this.kill();
      }
    } else {
      // gate_guardian は画面外X で消滅
      if (this.sprite.x < -80 || this.sprite.x > this.sceneWidth + 80) {
        this.kill();
      }
    }
  }

  private updateMove(body: Phaser.Physics.Arcade.Body, delta: number): void {
    const spd = this.config.speed;

    switch (this.config.movePattern) {
      case 'straight':
        body.setVelocity(0, spd);
        break;

      case 'wave':
        this.waveOffset += delta * 0.002;
        body.setVelocityX(Math.sin(this.waveOffset) * spd);
        body.setVelocityY(spd * 0.6);
        break;

      case 'wave_slow':
        this.waveOffset += delta * 0.0012;
        body.setVelocityX(Math.sin(this.waveOffset) * spd * 0.6);
        body.setVelocityY(spd * 0.5);
        break;

      case 'zigzag':
        this.zigzagTimer += delta;
        if (this.zigzagTimer > 700) {
          this.zigzagTimer = 0;
          this.zigzagDir *= -1;
        }
        body.setVelocityX(spd * this.zigzagDir);
        body.setVelocityY(spd * 0.65);
        break;

      case 'edge_bounce': {
        const x = this.sprite.x;
        if (x <= this.config.size + 10) this.edgeMoveDir = 1;
        if (x >= this.sceneWidth - this.config.size - 10) this.edgeMoveDir = -1;
        body.setVelocityX(spd * this.edgeMoveDir);
        body.setVelocityY(spd * 0.4);
        break;
      }

      case 'cross_horizontal':
        // 画面を横断しながら緩やかに降下
        body.setVelocityX(spd * this.horizontalDir);
        body.setVelocityY(spd * 0.25);
        break;

      case 'horizontal_top':
        // 定位置（Y=130）に向かい、そこで横移動のみ
        if (!this.settledY) {
          if (this.sprite.y < 130) {
            body.setVelocityY(spd * 0.5);
          } else {
            this.settledY = true;
            body.setVelocityY(0);
          }
        } else {
          // 画面端で折り返し
          const x = this.sprite.x;
          if (x <= this.config.size + 10) this.horizontalDir = 1;
          if (x >= this.sceneWidth - this.config.size - 10) this.horizontalDir = -1;
          body.setVelocityX(spd * this.horizontalDir);
          body.setVelocityY(0);
        }
        break;
    }
  }

  private updateFire(delta: number): void {
    if (this.config.firePattern === 'none') return;
    this.timeSinceFire += delta;
    if (this.timeSinceFire >= this.config.fireInterval) {
      this.fireBullets();
      this.timeSinceFire = 0;
    }
  }

  private fireBullets(): void {
    const x   = this.sprite.x;
    const y   = this.sprite.y;
    const spd = 190;
    const dmg = this.config.bulletDamage;

    switch (this.config.firePattern) {
      case 'forward3':
        // 前方3方向（下向き扇）
        for (let i = -1; i <= 1; i++) {
          const angle = Math.PI / 2 + i * 0.35;
          this.pool.fire(this.scene, x, y,
            Math.cos(angle) * spd, Math.sin(angle) * spd, dmg, 'enemy', 0xff4444, 6);
        }
        break;

      case 'radial8':
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          this.pool.fire(this.scene, x, y,
            Math.cos(angle) * spd, Math.sin(angle) * spd, dmg, 'enemy', 0xff88cc, 5);
        }
        break;

      case 'aimed1':
      case 'aimed_fast': {
        const mult = this.config.firePattern === 'aimed_fast' ? 1.8 : 1.0;
        const target = this.findPlayer();
        if (target) {
          const angle = Math.atan2(target.y - y, target.x - x);
          const radius = this.config.firePattern === 'aimed_fast' ? 8 : 6;
          this.pool.fire(this.scene, x, y,
            Math.cos(angle) * spd * mult, Math.sin(angle) * spd * mult,
            dmg, 'enemy', 0xff2222, radius);
        }
        break;
      }

      case 'fan5_alt': {
        // 左右交互に扇形5発
        const baseAngle = Math.PI / 2 + (this.fanAltState ? -0.5 : 0.5);
        this.fanAltState = !this.fanAltState;
        for (let i = -2; i <= 2; i++) {
          const angle = baseAngle + i * 0.22;
          this.pool.fire(this.scene, x, y,
            Math.cos(angle) * spd, Math.sin(angle) * spd, dmg, 'enemy', 0xffff44, 6);
        }
        break;
      }

      case 'forward_stream':
        // 進行方向（真下）に単発
        this.pool.fire(this.scene, x, y, 0, spd * 1.1, dmg, 'enemy', 0xff8800, 5);
        break;

      case 'rapid3':
        // 正面に3発同時（わずかに広がる）
        for (let i = -1; i <= 1; i++) {
          const angle = Math.PI / 2 + i * 0.18;
          this.pool.fire(this.scene, x, y,
            Math.cos(angle) * spd * 0.9, Math.sin(angle) * spd * 0.9,
            dmg, 'enemy', 0xff88ff, 5);
        }
        break;

      case 'radial8_rot':
        // 回転しながら8方向
        this.rotationAngle += 0.4;
        for (let i = 0; i < 8; i++) {
          const angle = this.rotationAngle + (i / 8) * Math.PI * 2;
          this.pool.fire(this.scene, x, y,
            Math.cos(angle) * spd * 0.85, Math.sin(angle) * spd * 0.85,
            dmg, 'enemy', 0xaa44ff, 5);
        }
        break;

      case 'fan9_down':
        // 下方向に扇形9発
        for (let i = -4; i <= 4; i++) {
          const angle = Math.PI / 2 + i * 0.2;
          this.pool.fire(this.scene, x, y,
            Math.cos(angle) * spd, Math.sin(angle) * spd, dmg, 'enemy', 0xff4488, 6);
        }
        break;

      case 'large3':
        // 下方向に大型弾×3
        for (let i = -1; i <= 1; i++) {
          this.pool.fire(this.scene, x + i * 60, y,
            0, spd * 0.7, dmg, 'enemy', 0xff6600, 12);
        }
        break;
    }
  }

  private findPlayer(): { x: number; y: number } | null {
    const objs = this.scene.children.list.filter(
      (c) => (c as Phaser.GameObjects.GameObject).getData &&
              (c as Phaser.GameObjects.GameObject).getData('isPlayer')
    );
    if (objs.length > 0) {
      const container = objs[0] as Phaser.GameObjects.Container;
      return { x: container.x, y: container.y };
    }
    return null;
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.3, to: 1 },
      duration: 80,
    });
    if (this.hp <= 0) this.kill();
  }

  kill(): void {
    if (!this.isAlive) return;
    this.isAlive = false;

    const burst = this.scene.add.circle(
      this.sprite.x, this.sprite.y,
      this.config.size * 1.5, this.config.color, 0.8
    );
    this.scene.tweens.add({
      targets: burst,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 300,
      onComplete: () => burst.destroy(),
    });
    this.sprite.destroy();
  }
}
