import Phaser from 'phaser';
import { Enemy, ENEMY_CONFIGS, EnemyConfig } from '../entities/Enemy';
import { BulletPool } from '../utils/BulletPool';

export type WaveEnemyDef = {
  key: keyof typeof ENEMY_CONFIGS;
  x: number;
  y?: number;
  overrides?: Partial<EnemyConfig>;
};

export type WaveEvent =
  | { type: 'wave'; enemies: WaveEnemyDef[] }
  | { type: 'miniboss'; id: string }
  | { type: 'midboss';  id: string }
  | { type: 'boss';     id: string };

type EnemyKey = keyof typeof ENEMY_CONFIGS;

const ENEMY_COST: Record<EnemyKey, number> = {
  foxfire:       1,
  cherry_spirit: 1,
  dancing_doll:  1,
  ghost_warrior: 2,
  skull_lantern: 2,
  yaksha_eye:    2,
  fire_serpent:  3,
  blood_cherry:  3,
  shadow_spider: 3,
  gate_guardian: 5,
};

const ENEMY_MIN_TIME: Record<EnemyKey, number> = {
  foxfire:       0,
  ghost_warrior: 20,
  cherry_spirit: 60,
  skull_lantern: 60,
  yaksha_eye:    130,
  fire_serpent:  120,
  dancing_doll:  180,
  shadow_spider: 190,
  blood_cherry:  240,
  gate_guardian: 250,
};

const ALL_ENEMY_KEYS = Object.keys(ENEMY_COST) as EnemyKey[];

export class WaveSystem {
  private scene: Phaser.Scene;
  private pool: BulletPool;
  private elapsed: number = 0;
  private onBoss: (id: string, type: 'miniboss' | 'midboss' | 'boss') => void;
  private onEnemyKilledCb?: (x: number, y: number, xp: number, youkakuDrop: number, youkakuChance: number) => void;
  private onDotDamageCb?: (x: number, y: number, amount: number) => void;

  private waveTimer: number = 0;
  private nextWaveInterval: number = 8;
  private nextBossIndex: number = 0;
  private bossSchedule = [
    { time: 300,  id: 'miniboss1', type: 'miniboss' as const },
    { time: 600,  id: 'miniboss2', type: 'miniboss' as const },
    { time: 900,  id: 'miniboss3', type: 'miniboss' as const },
    { time: 1200, id: 'midboss',   type: 'midboss'  as const },
    { time: 1500, id: 'miniboss4', type: 'miniboss' as const },
    { time: 1800, id: 'boss',      type: 'boss'     as const },
  ];

  enemies: Enemy[] = [];

  constructor(
    scene: Phaser.Scene,
    pool: BulletPool,
    onBoss: (id: string, type: 'miniboss' | 'midboss' | 'boss') => void,
    onEnemyKilled?: (x: number, y: number, xp: number, youkakuDrop: number, youkakuChance: number) => void,
    onDotDamage?: (x: number, y: number, amount: number) => void,
  ) {
    this.scene = scene;
    this.pool  = pool;
    this.onBoss   = onBoss;
    this.onEnemyKilledCb = onEnemyKilled;
    this.onDotDamageCb   = onDotDamage;
  }

  update(delta: number): void {
    this.elapsed += delta / 1000;
    this.waveTimer += delta / 1000;

    // ボス固定スケジュールチェック
    while (
      this.nextBossIndex < this.bossSchedule.length &&
      this.elapsed >= this.bossSchedule[this.nextBossIndex].time
    ) {
      const boss = this.bossSchedule[this.nextBossIndex];
      this.onBoss(boss.id, boss.type);
      this.nextBossIndex++;
    }

    // ウェーブタイマーで定期スポーン
    if (this.waveTimer >= this.nextWaveInterval) {
      this.waveTimer = 0;
      this.nextWaveInterval = 7 + Math.random() * 5; // 7〜12秒
      this.spawnRandomWave();
    }

    // 死亡済みの敵を除去して更新
    this.enemies = this.enemies.filter((e) => e.isAlive);
    for (const e of this.enemies) {
      const px = e.sprite.active ? e.sprite.x : 0;
      const py = e.sprite.active ? e.sprite.y : 0;
      e.update(delta);
      if (!e.isAlive && this.onEnemyKilledCb) {
        this.onEnemyKilledCb(px, py, e.config.xp, e.config.youkakuDrop, e.config.youkakuChance);
      }
    }
  }

  private spawnRandomWave(): void {
    const baseBudget = 5 + Math.floor(this.elapsed / 300) * 2.5;
    let budget = Math.min(baseBudget + Math.random() * 3, 22);

    const available = ALL_ENEMY_KEYS.filter(k => this.elapsed >= ENEMY_MIN_TIME[k]);
    if (available.length === 0) return;

    const defs: WaveEnemyDef[] = [];

    while (budget > 0) {
      const affordable = available.filter(k => ENEMY_COST[k] <= budget);
      if (affordable.length === 0) break;

      const key = affordable[Math.floor(Math.random() * affordable.length)];
      budget -= ENEMY_COST[key];

      const { x, y } = this.getSpawnPos(key);
      const def: WaveEnemyDef = { key, x };
      if (y !== undefined) def.y = y;
      defs.push(def);
    }

    if (defs.length === 0) return;

    const scale = this.getScaleFactor();
    for (const def of defs) {
      const base = ENEMY_CONFIGS[def.key];
      const cfg: EnemyConfig = {
        ...base,
        ...(def.overrides ?? {}),
        x: def.x,
        y: def.y ?? -50,
        hp: Math.floor(base.hp * scale),
        speed: Math.floor(base.speed * Math.sqrt(scale)),
        bulletDamage: Math.floor(base.bulletDamage * scale),
      };
      const enemy = new Enemy(this.scene, cfg, this.pool);
      if (this.onDotDamageCb) enemy.onDotDamage = this.onDotDamageCb;
      this.enemies.push(enemy);
    }
  }

  private getSpawnPos(key: EnemyKey): { x: number; y?: number } {
    if (key === 'shadow_spider') {
      const fromLeft = Math.random() < 0.5;
      return {
        x: fromLeft ? -50 : 590,
        y: 250 + Math.random() * 200,
      };
    }
    if (key === 'gate_guardian') {
      return {
        x: 60 + Math.random() * 420,
        y: -60,
      };
    }
    // 通常敵: 画面幅内にランダム配置
    return { x: 60 + Math.random() * 420 };
  }

  private getScaleFactor(): number {
    return Math.min(1.0 + (this.elapsed / 300) * 0.35, 4.0);
  }

  getElapsed(): number { return this.elapsed; }
}
