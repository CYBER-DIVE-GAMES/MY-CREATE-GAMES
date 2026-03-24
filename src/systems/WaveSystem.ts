import Phaser from 'phaser';
import { Enemy, ENEMY_CONFIGS, EnemyConfig } from '../entities/Enemy';
import { BulletPool } from '../utils/BulletPool';

export type WaveEnemyDef = {
  key: keyof typeof ENEMY_CONFIGS;
  x: number;
  y?: number;               // 省略時 -50
  overrides?: Partial<EnemyConfig>;
};

export type WaveEvent =
  | { type: 'wave'; enemies: WaveEnemyDef[] }
  | { type: 'miniboss'; id: string }
  | { type: 'midboss';  id: string }
  | { type: 'boss';     id: string };

// ステージ1 ウェーブスケジュール（秒単位）
// 仕様: 0〜5分 通常ウェーブ → [5分=300秒] ミニボス① → ... → [30分=1800秒] ラスボス
// フェーズ1 MVP: 0〜300秒（5分）の完全実装 + 300秒時点でミニボス
const STAGE1_SCHEDULE: Array<{ time: number; event: WaveEvent }> = [
  // ─── 0〜60秒 導入フェーズ ───
  { time: 5,  event: { type: 'wave', enemies: [
    { key: 'foxfire', x: 100 }, { key: 'foxfire', x: 220 },
    { key: 'foxfire', x: 340 }, { key: 'foxfire', x: 460 },
  ]}},
  { time: 14, event: { type: 'wave', enemies: [
    { key: 'foxfire', x: 160 }, { key: 'foxfire', x: 380 },
  ]}},
  { time: 22, event: { type: 'wave', enemies: [
    { key: 'ghost_warrior', x: 150 }, { key: 'ghost_warrior', x: 390 },
  ]}},
  { time: 32, event: { type: 'wave', enemies: [
    { key: 'foxfire', x: 80  }, { key: 'ghost_warrior', x: 270 }, { key: 'foxfire', x: 460 },
  ]}},
  { time: 42, event: { type: 'wave', enemies: [
    { key: 'ghost_warrior', x: 100 }, { key: 'ghost_warrior', x: 200 },
    { key: 'ghost_warrior', x: 340 }, { key: 'ghost_warrior', x: 440 },
  ]}},
  { time: 52, event: { type: 'wave', enemies: [
    { key: 'foxfire', x: 80  }, { key: 'foxfire', x: 160 }, { key: 'foxfire', x: 270 },
    { key: 'foxfire', x: 380 }, { key: 'foxfire', x: 460 },
  ]}},

  // ─── 60〜120秒 桜・灯籠登場 ───
  { time: 62, event: { type: 'wave', enemies: [
    { key: 'cherry_spirit', x: 160 }, { key: 'cherry_spirit', x: 380 },
  ]}},
  { time: 74, event: { type: 'wave', enemies: [
    { key: 'skull_lantern', x: 270 },
    { key: 'foxfire', x: 100 }, { key: 'foxfire', x: 440 },
  ]}},
  { time: 85, event: { type: 'wave', enemies: [
    { key: 'ghost_warrior', x: 150 }, { key: 'cherry_spirit', x: 270 },
    { key: 'ghost_warrior', x: 390 },
  ]}},
  { time: 96, event: { type: 'wave', enemies: [
    { key: 'skull_lantern', x: 130 }, { key: 'skull_lantern', x: 410 },
    { key: 'foxfire', x: 270 },
  ]}},
  { time: 108, event: { type: 'wave', enemies: [
    { key: 'cherry_spirit', x: 100 }, { key: 'cherry_spirit', x: 220 },
    { key: 'cherry_spirit', x: 340 }, { key: 'cherry_spirit', x: 460 },
  ]}},

  // ─── 120〜180秒 大蛇・夜叉登場 ───
  { time: 120, event: { type: 'wave', enemies: [
    { key: 'fire_serpent', x: 270 },
  ]}},
  { time: 132, event: { type: 'wave', enemies: [
    { key: 'yaksha_eye', x: 20, overrides: { movePattern: 'edge_bounce' } },
    { key: 'foxfire', x: 200 }, { key: 'foxfire', x: 340 },
  ]}},
  { time: 143, event: { type: 'wave', enemies: [
    { key: 'ghost_warrior', x: 120 }, { key: 'skull_lantern', x: 270 },
    { key: 'ghost_warrior', x: 420 },
  ]}},
  { time: 155, event: { type: 'wave', enemies: [
    { key: 'fire_serpent', x: 150 }, { key: 'fire_serpent', x: 390 },
  ]}},
  { time: 166, event: { type: 'wave', enemies: [
    { key: 'yaksha_eye', x: 520 },
    { key: 'cherry_spirit', x: 160 }, { key: 'cherry_spirit', x: 380 },
  ]}},
  { time: 178, event: { type: 'wave', enemies: [
    { key: 'skull_lantern', x: 100 }, { key: 'skull_lantern', x: 270 },
    { key: 'skull_lantern', x: 440 },
  ]}},

  // ─── 180〜240秒 踊り人形・影蜘蛛登場 ───
  { time: 182, event: { type: 'wave', enemies: [
    { key: 'dancing_doll', x: 100 }, { key: 'dancing_doll', x: 220 },
    { key: 'dancing_doll', x: 340 }, { key: 'dancing_doll', x: 460 },
  ]}},
  { time: 194, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 300 },   // 左から横断
  ]}},
  { time: 205, event: { type: 'wave', enemies: [
    { key: 'fire_serpent', x: 270 },
    { key: 'foxfire', x: 100 }, { key: 'foxfire', x: 440 },
  ]}},
  { time: 216, event: { type: 'wave', enemies: [
    { key: 'dancing_doll', x: 150 }, { key: 'skull_lantern', x: 270 },
    { key: 'dancing_doll', x: 390 },
  ]}},
  { time: 228, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: 590, y: 400, overrides: { speed: 170 } }, // 右から横断
  ]}},
  { time: 238, event: { type: 'wave', enemies: [
    { key: 'yaksha_eye', x: 20 }, { key: 'yaksha_eye', x: 520 },
    { key: 'ghost_warrior', x: 270 },
  ]}},

  // ─── 240〜300秒 血桜・冥界門番登場・ボス前圧力 ───
  { time: 243, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 170 }, { key: 'blood_cherry', x: 370 },  // V字2体
  ]}},
  { time: 254, event: { type: 'wave', enemies: [
    { key: 'gate_guardian', x: 270, y: -60 },
  ]}},
  { time: 264, event: { type: 'wave', enemies: [
    { key: 'fire_serpent', x: 150 }, { key: 'dancing_doll', x: 270 },
    { key: 'fire_serpent', x: 390 },
  ]}},
  { time: 274, event: { type: 'wave', enemies: [
    { key: 'cherry_spirit', x: 80 }, { key: 'cherry_spirit', x: 160 },
    { key: 'cherry_spirit', x: 270 }, { key: 'cherry_spirit', x: 380 },
    { key: 'cherry_spirit', x: 460 },
  ]}},
  { time: 284, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 350 },
    { key: 'yaksha_eye', x: 270 },
    { key: 'shadow_spider', x: 590, y: 450 },
  ]}},
  { time: 294, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 100 }, { key: 'skull_lantern', x: 270 },
    { key: 'blood_cherry', x: 440 },
  ]}},

  // ─── 300秒（5分）ミニボス① 骸の剣鬼 ───
  { time: 300, event: { type: 'miniboss', id: 'miniboss1' }},

  // ─── 300〜360秒 ミニボス後・難度UP ───
  { time: 315, event: { type: 'wave', enemies: [
    { key: 'foxfire',      x: 100 }, { key: 'foxfire',      x: 200 },
    { key: 'foxfire',      x: 300 }, { key: 'foxfire',      x: 400 },
    { key: 'foxfire',      x: 500 },
  ]}},
  { time: 325, event: { type: 'wave', enemies: [
    { key: 'ghost_warrior', x: 100 }, { key: 'ghost_warrior', x: 270 },
    { key: 'ghost_warrior', x: 440 },
  ]}},
  { time: 338, event: { type: 'wave', enemies: [
    { key: 'fire_serpent',  x: 150 }, { key: 'fire_serpent', x: 390 },
  ]}},
  { time: 350, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 200 }, { key: 'gate_guardian', x: 270, y: -60 },
    { key: 'blood_cherry', x: 340 },
  ]}},
];

export class WaveSystem {
  private scene: Phaser.Scene;
  private pool: BulletPool;
  private schedule: Array<{ time: number; event: WaveEvent }>;
  private elapsed: number = 0; // 秒
  private nextIndex: number = 0;
  private onBoss: (id: string, type: 'miniboss' | 'midboss' | 'boss') => void;

  enemies: Enemy[] = [];

  constructor(
    scene: Phaser.Scene,
    pool: BulletPool,
    onBoss: (id: string, type: 'miniboss' | 'midboss' | 'boss') => void
  ) {
    this.scene = scene;
    this.pool  = pool;
    this.schedule = STAGE1_SCHEDULE;
    this.onBoss   = onBoss;
  }

  update(delta: number): void {
    this.elapsed += delta / 1000;

    // スケジュール消化
    while (
      this.nextIndex < this.schedule.length &&
      this.elapsed >= this.schedule[this.nextIndex].time
    ) {
      this.triggerEvent(this.schedule[this.nextIndex].event);
      this.nextIndex++;
    }

    // 死亡済みの敵を除去して更新
    this.enemies = this.enemies.filter((e) => e.isAlive);
    for (const e of this.enemies) {
      e.update(delta);
    }
  }

  private triggerEvent(event: WaveEvent): void {
    if (event.type === 'wave') {
      for (const def of event.enemies) {
        const base = ENEMY_CONFIGS[def.key];
        const cfg: EnemyConfig = {
          ...base,
          ...(def.overrides ?? {}),
          x: def.x,
          y: def.y ?? -50,
        };
        const enemy = new Enemy(this.scene, cfg, this.pool);
        this.enemies.push(enemy);
      }
    } else if (event.type === 'miniboss') {
      this.onBoss(event.id, 'miniboss');
    } else if (event.type === 'midboss') {
      this.onBoss(event.id, 'midboss');
    } else if (event.type === 'boss') {
      this.onBoss(event.id, 'boss');
    }
  }

  getElapsed(): number { return this.elapsed; }
}
