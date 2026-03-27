import Phaser from 'phaser';
import { BulletPool } from '../utils/BulletPool';

export type MovePattern =
  | 'straight' | 'zigzag' | 'wave' | 'wave_slow'
  | 'edge_bounce' | 'cross_horizontal' | 'horizontal_top';

export type FirePattern =
  | 'none' | 'forward3' | 'radial8' | 'aimed1' | 'aimed_fast'
  | 'fan5_alt' | 'forward_stream' | 'rapid3'
  | 'radial8_rot' | 'fan9_down' | 'large3';

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
  fireInterval: number;
  bulletDamage: number;
  textureKey?: string;   // スプライト画像キー（省略時はプログラム描画）
  spriteScale?: number;  // スプライト表示スケール
}

export const ENEMY_CONFIGS: Record<string, Omit<EnemyConfig, 'x' | 'y'>> = {
  foxfire:      { hp: 60,  speed: 120, xp: 5,   youkakuDrop: 1, youkakuChance: 0.35, color: 0x88aaff, size: 14, movePattern: 'straight',         firePattern: 'none',         fireInterval: 9999, bulletDamage: 0,  textureKey: 'kitunebi_sheet', spriteScale: 1.2 },
  ghost_warrior:{ hp: 180, speed: 90,  xp: 15,  youkakuDrop: 1, youkakuChance: 0.5,  color: 0xaaaadd, size: 18, movePattern: 'straight',          firePattern: 'forward3',     fireInterval: 2000, bulletDamage: 8,  textureKey: 'musha_sheet',    spriteScale: 1.6 },
  cherry_spirit:{ hp: 80,  speed: 55,  xp: 10,  youkakuDrop: 1, youkakuChance: 0.4,  color: 0xffbbcc, size: 16, movePattern: 'wave_slow',         firePattern: 'radial8',      fireInterval: 2500, bulletDamage: 6,  textureKey: 'otome_sheet',    spriteScale: 1.4 },
  skull_lantern:{ hp: 200, speed: 45,  xp: 20,  youkakuDrop: 1, youkakuChance: 0.6,  color: 0xffffaa, size: 20, movePattern: 'straight',          firePattern: 'fan5_alt',     fireInterval: 1800, bulletDamage: 7,  textureKey: 'tourou_sheet',      spriteScale: 1.7 },
  fire_serpent: { hp: 400, speed: 75,  xp: 40,  youkakuDrop: 2, youkakuChance: 0.5, color: 0xff8800, size: 24, movePattern: 'wave',              firePattern: 'forward_stream',fireInterval: 500,  bulletDamage: 10, textureKey: 'orochi_sheet',      spriteScale: 2.0 },
  yaksha_eye:   { hp: 200, speed: 80,  xp: 20,  youkakuDrop: 1, youkakuChance: 0.4, color: 0xff2222, size: 16, movePattern: 'edge_bounce',       firePattern: 'aimed_fast',   fireInterval: 1500, bulletDamage: 12, textureKey: 'me_sheet',          spriteScale: 1.3 },
  dancing_doll: { hp: 100, speed: 100, xp: 10,  youkakuDrop: 1, youkakuChance: 0.3, color: 0xff88ff, size: 14, movePattern: 'zigzag',            firePattern: 'rapid3',       fireInterval: 900,  bulletDamage: 5,  textureKey: 'odoriningyou_sheet', spriteScale: 1.2 },
  shadow_spider:{ hp: 350, speed: 160, xp: 35,  youkakuDrop: 2, youkakuChance: 0.5, color: 0x442266, size: 22, movePattern: 'cross_horizontal',  firePattern: 'radial8_rot',  fireInterval: 900,  bulletDamage: 7,  textureKey: 'kagekumo_sheet',    spriteScale: 1.8 },
  blood_cherry: { hp: 300, speed: 70,  xp: 30,  youkakuDrop: 2, youkakuChance: 0.5, color: 0xff4488, size: 20, movePattern: 'straight',          firePattern: 'fan9_down',    fireInterval: 2000, bulletDamage: 8,  textureKey: 'chizakura_sheet',   spriteScale: 1.7 },
  gate_guardian:{ hp: 800, speed: 110, xp: 100, youkakuDrop: 3, youkakuChance: 1.0, color: 0x664422, size: 32, movePattern: 'horizontal_top',    firePattern: 'large3',       fireInterval: 2800, bulletDamage: 15, textureKey: 'monban_sheet',      spriteScale: 2.7 },
};

// ステータス異常
export interface StatusEffect {
  type: 'poison' | 'burn' | 'slow' | 'freeze';
  duration: number;  // 残りms
  level: number;
}

export class Enemy {
  readonly scene: Phaser.Scene;
  readonly sprite: Phaser.GameObjects.Arc;
  private visualSprite?: Phaser.GameObjects.Sprite;
  private pool: BulletPool;
  readonly config: EnemyConfig;

  hp: number;
  readonly baseSpeed: number;
  private timeSinceFire: number = 0;
  private waveOffset: number = 0;
  private zigzagTimer: number = 0;
  private zigzagDir: number = 1;
  private edgeMoveDir: number = 1;
  private rotationAngle: number = 0;
  private fanAltState: boolean = false;
  private horizontalDir: number = 1;
  private settledY: boolean = false;
  private readonly sceneWidth: number;

  // ステータス異常
  statusEffects: StatusEffect[] = [];
  private dotTimer: number = 0;  // DoT（毒/燃焼）タイマー

  isAlive: boolean = true;

  constructor(scene: Phaser.Scene, config: EnemyConfig, pool: BulletPool) {
    this.scene = scene;
    this.config = config;
    this.pool = pool;
    this.hp = config.hp;
    this.baseSpeed = config.speed;
    this.sceneWidth = scene.scale.width;

    this.sprite = scene.add.circle(config.x, config.y, config.size, config.color);
    scene.physics.add.existing(this.sprite);
    this.sprite.setDepth(5);

    // スプライト画像がある場合はビジュアルスプライトを作成（物理は Arc が担当）
    if (config.textureKey && scene.textures.exists(config.textureKey)) {
      this.sprite.setAlpha(0); // 物理用 Arc を非表示
      this.visualSprite = scene.add.sprite(config.x, config.y, config.textureKey)
        .setDepth(5).setScale(config.spriteScale ?? 1.0);
      const animKey = `${config.textureKey}_move`;
      if (!scene.anims.exists(animKey)) {
        scene.anims.create({
          key: animKey,
          frames: scene.anims.generateFrameNumbers(config.textureKey, { start: 0, end: 3 }),
          frameRate: 8,
          repeat: -1,
        });
      }
      this.visualSprite.play(animKey);
    }

    this.edgeMoveDir = Math.random() < 0.5 ? 1 : -1;
    this.rotationAngle = Math.random() * Math.PI * 2;

    if (config.movePattern === 'cross_horizontal') {
      this.horizontalDir = config.x < this.sceneWidth / 2 ? 1 : -1;
    }
  }

  update(delta: number): void {
    if (!this.isAlive) return;
    // ビジュアルスプライトを物理ボディに追従
    if (this.visualSprite) {
      this.visualSprite.setPosition(this.sprite.x, this.sprite.y);
    }
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // ステータス異常の更新
    this.updateStatus(delta);

    // 凍結中は動かない
    if (this.isFrozen()) {
      body.setVelocity(0, 0);
    } else {
      this.updateMove(body, delta);
    }

    this.updateFire(delta);

    // 画面外で消滅
    if (this.config.movePattern !== 'horizontal_top') {
      if (this.sprite.y > 1020 || this.sprite.x < -100 || this.sprite.x > this.sceneWidth + 100) {
        this.kill();
      }
    } else {
      if (this.sprite.x < -80 || this.sprite.x > this.sceneWidth + 80) this.kill();
    }
  }

  private updateStatus(delta: number): void {
    let hasPoison = false;
    let hasBurn   = false;

    this.statusEffects = this.statusEffects.filter((s) => {
      s.duration -= delta;
      if (s.type === 'poison') hasPoison = true;
      if (s.type === 'burn')   hasBurn   = true;
      return s.duration > 0;
    });

    // DoT（毒/燃焼）ダメージ：1秒ごと
    if (hasPoison || hasBurn) {
      this.dotTimer += delta;
      if (this.dotTimer >= 1000) {
        this.dotTimer = 0;
        if (hasPoison) {
          const lv = this.getStatusLevel('poison');
          this.takeDamage([3, 6, 10][lv - 1] ?? 3, true);
        }
        if (hasBurn) {
          const lv = this.getStatusLevel('burn');
          this.takeDamage([4, 7, 12][lv - 1] ?? 4, true);
        }
      }
    } else {
      this.dotTimer = 0;
    }

    // スロー中は色を変える
    const slowed = this.isSlowed();
    if (slowed && this.sprite.active) {
      this.sprite.setFillStyle(0x8888ff);
      this.visualSprite?.setTint(0x8888ff);
    }
  }

  private getStatusLevel(type: StatusEffect['type']): number {
    return this.statusEffects.find((s) => s.type === type)?.level ?? 0;
  }

  isFrozen(): boolean { return this.statusEffects.some((s) => s.type === 'freeze'); }
  isSlowed(): boolean { return this.statusEffects.some((s) => s.type === 'slow'); }
  hasPoison(): boolean { return this.statusEffects.some((s) => s.type === 'poison'); }

  applyStatus(type: StatusEffect['type'], duration: number, level: number): void {
    const existing = this.statusEffects.find((s) => s.type === type);
    if (existing) {
      existing.duration = Math.max(existing.duration, duration);
      existing.level    = Math.max(existing.level, level);
    } else {
      this.statusEffects.push({ type, duration, level });
    }
    // 氷結時は青く
    if ((type === 'freeze' || type === 'slow') && this.sprite.active) {
      this.sprite.setFillStyle(0x88ccff);
      this.visualSprite?.setTint(0x88ccff);
    }
    if (type === 'poison' && this.sprite.active) { this.sprite.setFillStyle(0x88ff44); this.visualSprite?.setTint(0x88ff44); }
    if (type === 'burn'   && this.sprite.active) { this.sprite.setFillStyle(0xff6600); this.visualSprite?.setTint(0xff6600); }
  }

  private updateMove(body: Phaser.Physics.Arcade.Body, delta: number): void {
    const slow = this.isSlowed() ? 0.5 : 1.0;
    const spd  = this.config.speed * slow;

    switch (this.config.movePattern) {
      case 'straight':
        body.setVelocity(0, spd); break;
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
        if (this.zigzagTimer > 700) { this.zigzagTimer = 0; this.zigzagDir *= -1; }
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
        body.setVelocityX(spd * this.horizontalDir);
        body.setVelocityY(spd * 0.25);
        break;
      case 'horizontal_top':
        if (!this.settledY) {
          if (this.sprite.y < 130) { body.setVelocityY(spd * 0.5); }
          else { this.settledY = true; body.setVelocityY(0); }
        } else {
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
    if (this.config.firePattern === 'none' || this.isFrozen()) return;
    this.timeSinceFire += delta;
    if (this.timeSinceFire >= this.config.fireInterval) {
      this.fireBullets();
      this.timeSinceFire = 0;
    }
  }

  private fireBullets(): void {
    const x = this.sprite.x, y = this.sprite.y;
    const spd = 190, dmg = this.config.bulletDamage;

    switch (this.config.firePattern) {
      case 'forward3':
        for (let i = -1; i <= 1; i++) {
          const a = Math.PI / 2 + i * 0.35;
          this.pool.fire(this.scene, x, y, Math.cos(a)*spd, Math.sin(a)*spd, dmg, 'enemy', 0xff4444, 6);
        }
        break;
      case 'radial8':
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          this.pool.fire(this.scene, x, y, Math.cos(a)*spd, Math.sin(a)*spd, dmg, 'enemy', 0xff88cc, 5);
        }
        break;
      case 'aimed1':
      case 'aimed_fast': {
        const mult = this.config.firePattern === 'aimed_fast' ? 1.8 : 1.0;
        const t = this.findPlayer();
        if (t) {
          const a = Math.atan2(t.y - y, t.x - x);
          this.pool.fire(this.scene, x, y, Math.cos(a)*spd*mult, Math.sin(a)*spd*mult, dmg, 'enemy', 0xff2222, 8);
        }
        break;
      }
      case 'fan5_alt': {
        const base = Math.PI / 2 + (this.fanAltState ? -0.5 : 0.5);
        this.fanAltState = !this.fanAltState;
        for (let i = -2; i <= 2; i++) {
          const a = base + i * 0.22;
          this.pool.fire(this.scene, x, y, Math.cos(a)*spd, Math.sin(a)*spd, dmg, 'enemy', 0xffff44, 6);
        }
        break;
      }
      case 'forward_stream':
        this.pool.fire(this.scene, x, y, 0, spd * 1.1, dmg, 'enemy', 0xff8800, 5); break;
      case 'rapid3':
        for (let i = -1; i <= 1; i++) {
          const a = Math.PI / 2 + i * 0.18;
          this.pool.fire(this.scene, x, y, Math.cos(a)*spd*0.9, Math.sin(a)*spd*0.9, dmg, 'enemy', 0xff88ff, 5);
        }
        break;
      case 'radial8_rot':
        this.rotationAngle += 0.4;
        for (let i = 0; i < 8; i++) {
          const a = this.rotationAngle + (i / 8) * Math.PI * 2;
          this.pool.fire(this.scene, x, y, Math.cos(a)*spd*0.85, Math.sin(a)*spd*0.85, dmg, 'enemy', 0xaa44ff, 5);
        }
        break;
      case 'fan9_down':
        for (let i = -4; i <= 4; i++) {
          const a = Math.PI / 2 + i * 0.2;
          this.pool.fire(this.scene, x, y, Math.cos(a)*spd, Math.sin(a)*spd, dmg, 'enemy', 0xff4488, 6);
        }
        break;
      case 'large3':
        for (let i = -1; i <= 1; i++) {
          this.pool.fire(this.scene, x + i*60, y, 0, spd*0.7, dmg, 'enemy', 0xff6600, 12);
        }
        break;
    }
  }

  private findPlayer(): { x: number; y: number } | null {
    // シーンデータに登録されたプレイヤースプライトを直接参照（O(1)）
    const ps = this.scene.data?.get('playerSprite') as Phaser.GameObjects.Sprite | undefined;
    if (ps?.active) return { x: ps.x, y: ps.y };
    return null;
  }

  takeDamage(amount: number, fromDot: boolean = false): void {
    this.hp -= amount;
    if (!fromDot && this.sprite.active) {
      const target = this.visualSprite ?? this.sprite;
      this.scene.tweens.add({
        targets: target,
        alpha: { from: 0.3, to: 1 },
        duration: 80,
      });
    }
    if (this.hp <= 0) this.kill();
  }

  kill(): void {
    if (!this.isAlive) return;
    this.isAlive = false;
    const burst = this.scene.add.circle(
      this.sprite.x, this.sprite.y, this.config.size * 1.5, this.config.color, 0.8
    );
    this.scene.tweens.add({
      targets: burst, alpha: 0, scaleX: 3, scaleY: 3, duration: 300,
      onComplete: () => burst.destroy(),
    });
    this.visualSprite?.destroy();
    this.sprite.destroy();
  }
}
