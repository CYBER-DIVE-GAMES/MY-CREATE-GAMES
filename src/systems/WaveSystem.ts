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
  { time: 370, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 300 }, { key: 'yaksha_eye', x: 270 },
    { key: 'shadow_spider', x: 590, y: 400 },
  ]}},
  { time: 390, event: { type: 'wave', enemies: [
    { key: 'fire_serpent', x: 120 }, { key: 'skull_lantern', x: 270 }, { key: 'fire_serpent', x: 420 },
  ]}},

  // ─── 400〜590秒 ウェーブ継続（間を埋める）───
  { time: 405, event: { type: 'wave', enemies: [
    { key: 'foxfire', x: 100 }, { key: 'foxfire', x: 200 },
    { key: 'ghost_warrior', x: 300 }, { key: 'foxfire', x: 440 },
  ]}},
  { time: 420, event: { type: 'wave', enemies: [
    { key: 'fire_serpent', x: 150 }, { key: 'dancing_doll', x: 270 }, { key: 'fire_serpent', x: 390 },
  ]}},
  { time: 438, event: { type: 'wave', enemies: [
    { key: 'skull_lantern', x: 100 }, { key: 'yaksha_eye', x: 270 }, { key: 'skull_lantern', x: 440 },
  ]}},
  { time: 455, event: { type: 'wave', enemies: [
    { key: 'cherry_spirit', x: 80  }, { key: 'cherry_spirit', x: 200 },
    { key: 'blood_cherry', x: 330  }, { key: 'cherry_spirit', x: 460 },
  ]}},
  { time: 472, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 300 }, { key: 'gate_guardian', x: 270, y: -60 },
    { key: 'shadow_spider', x: 590, y: 400 },
  ]}},
  { time: 490, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 100 }, { key: 'fire_serpent', x: 270 }, { key: 'blood_cherry', x: 440 },
  ]}},
  { time: 508, event: { type: 'wave', enemies: [
    { key: 'yaksha_eye', x: 80  }, { key: 'dancing_doll', x: 200 },
    { key: 'dancing_doll', x: 340 }, { key: 'yaksha_eye', x: 460 },
  ]}},
  { time: 526, event: { type: 'wave', enemies: [
    { key: 'skull_lantern', x: 130 }, { key: 'blood_cherry', x: 270 }, { key: 'skull_lantern', x: 410 },
    { key: 'ghost_warrior', x: 80  }, { key: 'ghost_warrior', x: 460 },
  ]}},
  { time: 545, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 350 }, { key: 'fire_serpent', x: 160 },
    { key: 'gate_guardian', x: 380, y: -60 }, { key: 'shadow_spider', x: 590, y: 450 },
  ]}},
  { time: 565, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 80  }, { key: 'yaksha_eye', x: 200 },
    { key: 'skull_lantern', x: 270 }, { key: 'yaksha_eye', x: 340 },
    { key: 'blood_cherry', x: 460 },
  ]}},
  { time: 583, event: { type: 'wave', enemies: [
    { key: 'gate_guardian', x: 150, y: -60 }, { key: 'fire_serpent', x: 270 },
    { key: 'gate_guardian', x: 390, y: -60 },
  ]}},

  // ─── 600秒（10分）ミニボス② 双子の狐精 ───
  { time: 600, event: { type: 'miniboss', id: 'miniboss2' }},

  // ─── 600〜900秒 10〜15分帯ウェーブ ───
  { time: 615, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 100 }, { key: 'blood_cherry', x: 270 }, { key: 'blood_cherry', x: 440 },
  ]}},
  { time: 630, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 350 }, { key: 'gate_guardian', x: 270, y: -60 },
    { key: 'shadow_spider', x: 590, y: 450 },
  ]}},
  { time: 660, event: { type: 'wave', enemies: [
    { key: 'fire_serpent', x: 80  }, { key: 'yaksha_eye', x: 200 },
    { key: 'yaksha_eye',   x: 340 }, { key: 'fire_serpent', x: 460 },
  ]}},
  { time: 690, event: { type: 'wave', enemies: [
    { key: 'skull_lantern', x: 100 }, { key: 'skull_lantern', x: 270 }, { key: 'skull_lantern', x: 440 },
    { key: 'foxfire', x: 160 }, { key: 'foxfire', x: 380 },
  ]}},
  { time: 720, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 150 }, { key: 'gate_guardian', x: 270, y: -60 }, { key: 'blood_cherry', x: 390 },
  ]}},
  { time: 760, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 300 }, { key: 'dancing_doll', x: 150 },
    { key: 'dancing_doll', x: 270 }, { key: 'dancing_doll', x: 390 },
    { key: 'shadow_spider', x: 590, y: 400 },
  ]}},
  { time: 800, event: { type: 'wave', enemies: [
    { key: 'fire_serpent', x: 100 }, { key: 'blood_cherry', x: 200 }, { key: 'gate_guardian', x: 270, y: -60 },
    { key: 'blood_cherry', x: 340 }, { key: 'fire_serpent', x: 440 },
  ]}},
  { time: 850, event: { type: 'wave', enemies: [
    { key: 'yaksha_eye', x: 20 }, { key: 'skull_lantern', x: 160 }, { key: 'skull_lantern', x: 380 },
    { key: 'yaksha_eye', x: 520 },
  ]}},

  // ─── 900秒（15分）ミニボス③ 呪縛の般若 ───
  { time: 900, event: { type: 'miniboss', id: 'miniboss3' }},

  // ─── 900〜1200秒 15〜20分帯ウェーブ ───
  { time: 920, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 100 }, { key: 'shadow_spider', x: -50, y: 300 },
    { key: 'blood_cherry', x: 440 }, { key: 'shadow_spider', x: 590, y: 400 },
  ]}},
  { time: 950, event: { type: 'wave', enemies: [
    { key: 'gate_guardian', x: 270, y: -60 }, { key: 'fire_serpent', x: 100 },
    { key: 'fire_serpent', x: 440 }, { key: 'yaksha_eye', x: 270 },
  ]}},
  { time: 990, event: { type: 'wave', enemies: [
    { key: 'skull_lantern', x: 80 }, { key: 'skull_lantern', x: 200 }, { key: 'skull_lantern', x: 340 },
    { key: 'skull_lantern', x: 460 }, { key: 'blood_cherry', x: 270 },
  ]}},
  { time: 1040, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 350 }, { key: 'gate_guardian', x: 160, y: -60 },
    { key: 'gate_guardian', x: 380, y: -60 }, { key: 'shadow_spider', x: 590, y: 450 },
  ]}},
  { time: 1090, event: { type: 'wave', enemies: [
    { key: 'fire_serpent', x: 80 }, { key: 'blood_cherry', x: 160 }, { key: 'yaksha_eye', x: 270 },
    { key: 'blood_cherry', x: 380 }, { key: 'fire_serpent', x: 460 },
  ]}},
  { time: 1140, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 300 }, { key: 'skull_lantern', x: 160 },
    { key: 'gate_guardian', x: 270, y: -60 }, { key: 'skull_lantern', x: 380 },
    { key: 'shadow_spider', x: 590, y: 400 },
  ]}},

  // ─── 1200秒（20分）中ボス 冥府の狐女王 朱禍 ───
  { time: 1200, event: { type: 'midboss', id: 'midboss' }},

  // ─── 1200〜1500秒 20〜25分帯ウェーブ ───
  { time: 1220, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 100 }, { key: 'blood_cherry', x: 270 }, { key: 'blood_cherry', x: 440 },
    { key: 'shadow_spider', x: -50, y: 350 },
  ]}},
  { time: 1260, event: { type: 'wave', enemies: [
    { key: 'gate_guardian', x: 160, y: -60 }, { key: 'gate_guardian', x: 380, y: -60 },
    { key: 'fire_serpent', x: 270 }, { key: 'yaksha_eye', x: 80 }, { key: 'yaksha_eye', x: 460 },
  ]}},
  { time: 1310, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 300 }, { key: 'blood_cherry', x: 160 },
    { key: 'skull_lantern', x: 270 }, { key: 'blood_cherry', x: 380 },
    { key: 'shadow_spider', x: 590, y: 400 },
  ]}},
  { time: 1370, event: { type: 'wave', enemies: [
    { key: 'gate_guardian', x: 80,  y: -60 }, { key: 'gate_guardian', x: 270, y: -60 },
    { key: 'gate_guardian', x: 460, y: -60 }, { key: 'fire_serpent', x: 160 },
    { key: 'fire_serpent', x: 380 },
  ]}},
  { time: 1430, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 350 }, { key: 'blood_cherry', x: 100 },
    { key: 'yaksha_eye', x: 200 }, { key: 'yaksha_eye', x: 340 }, { key: 'blood_cherry', x: 440 },
    { key: 'shadow_spider', x: 590, y: 450 },
  ]}},

  // ─── 1500秒（25分）ミニボス④ 桜樹の怨念 ───
  { time: 1500, event: { type: 'miniboss', id: 'miniboss4' }},

  // ─── 1500〜1800秒 25〜30分帯ウェーブ（難度MAX）───
  { time: 1520, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 80 }, { key: 'gate_guardian', x: 160, y: -60 },
    { key: 'shadow_spider', x: -50, y: 300 }, { key: 'blood_cherry', x: 380 },
    { key: 'gate_guardian', x: 460, y: -60 },
  ]}},
  { time: 1560, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: 590, y: 350 }, { key: 'yaksha_eye', x: 80 },
    { key: 'skull_lantern', x: 160 }, { key: 'skull_lantern', x: 270 }, { key: 'skull_lantern', x: 380 },
    { key: 'yaksha_eye', x: 460 }, { key: 'shadow_spider', x: -50, y: 450 },
  ]}},
  { time: 1610, event: { type: 'wave', enemies: [
    { key: 'gate_guardian', x: 160, y: -60 }, { key: 'gate_guardian', x: 380, y: -60 },
    { key: 'fire_serpent', x: 80 }, { key: 'blood_cherry', x: 270 }, { key: 'fire_serpent', x: 460 },
  ]}},
  { time: 1660, event: { type: 'wave', enemies: [
    { key: 'shadow_spider', x: -50, y: 300 }, { key: 'blood_cherry', x: 100 },
    { key: 'gate_guardian', x: 270, y: -60 }, { key: 'blood_cherry', x: 440 },
    { key: 'shadow_spider', x: 590, y: 400 },
  ]}},
  { time: 1720, event: { type: 'wave', enemies: [
    { key: 'gate_guardian', x: 80,  y: -60 }, { key: 'yaksha_eye', x: 160 },
    { key: 'shadow_spider', x: -50, y: 350 }, { key: 'yaksha_eye', x: 380 },
    { key: 'gate_guardian', x: 460, y: -60 }, { key: 'shadow_spider', x: 590, y: 450 },
  ]}},
  { time: 1770, event: { type: 'wave', enemies: [
    { key: 'blood_cherry', x: 80 }, { key: 'blood_cherry', x: 160 },
    { key: 'blood_cherry', x: 270 }, { key: 'blood_cherry', x: 380 }, { key: 'blood_cherry', x: 460 },
    { key: 'gate_guardian', x: 270, y: -60 },
  ]}},

  // ─── 1800秒（30分）ラスボス 九尾の大妖怪 夜叫 ───
  { time: 1800, event: { type: 'boss', id: 'boss' }},
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

  private getScaleFactor(): number {
    // 5分ごとに35%強化、最大4倍
    return Math.min(1.0 + (this.elapsed / 300) * 0.35, 4.0);
  }

  private triggerEvent(event: WaveEvent): void {
    if (event.type === 'wave') {
      const scale = this.getScaleFactor();
      for (const def of event.enemies) {
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
