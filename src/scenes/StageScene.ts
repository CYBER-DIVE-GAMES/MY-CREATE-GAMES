import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { Boss } from '../entities/Boss';
import { BulletPool } from '../utils/BulletPool';
import { WaveSystem } from '../systems/WaveSystem';
import { XPSystem } from '../systems/XPSystem';
import { SkillSystem } from '../systems/SkillSystem';
import { ObstacleSystem } from '../systems/ObstacleSystem';
import { SaveSystem } from '../utils/SaveSystem';
import { SynergyCalculator, ActiveSynergy } from '../utils/SynergyCalculator';
import { STAGE1_BOSSES } from '../data/bosses/bossDefinitions';

export class StageScene extends Phaser.Scene {
  private player!: Player;
  private playerPool!: BulletPool;
  private enemyPool!: BulletPool;
  private waveSystem!: WaveSystem;
  private xpSystem!: XPSystem;
  private skillSystem!: SkillSystem;
  private obstacleSystem!: ObstacleSystem;
  private boss: Boss | null = null;

  // HUD
  private hpBar!: Phaser.GameObjects.Rectangle;
  private hpText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private xpLabel!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private youkakuText!: Phaser.GameObjects.Text;
  private synergyTexts: Phaser.GameObjects.Text[] = [];

  // ゲーム状態
  private paused: boolean = false;
  private regenTimer: number = 0;
  private youkakuThisRun: number = 0;
  private stageCleared: boolean = false;

  // ランタイムスキルオブジェクト
  private orbitalBullets: Phaser.GameObjects.Arc[] = [];
  private orbitalAngle: number = 0;
  private dischargeTimer: number = 0;
  private homingTimer: number = 0;
  private laserTimer: number = 0;
  private laserCooldown: number = 5000;
  private activeLaser: Phaser.GameObjects.Rectangle | null = null;

  // XP ジェム
  private xpGems: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super({ key: 'StageScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // リトライ時のリセット
    this.paused = false;
    this.stageCleared = false;
    this.youkakuThisRun = 0;
    this.regenTimer = 0;
    this.orbitalAngle = 0;
    this.dischargeTimer = 0;
    this.homingTimer = 0;
    this.laserTimer = 0;
    this.laserCooldown = 5000;
    this.activeLaser = null;
    this.orbitalBullets = [];
    this.xpGems = [];
    this.synergyTexts = [];

    // 背景
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x050510, 0x050510, 0x0a0520, 0x0a0520, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 2), 0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.6));
    }

    this.playerPool = new BulletPool(this);
    this.enemyPool  = new BulletPool(this);

    this.player = new Player(this, this.playerPool);
    this.player.sprite.setData('isPlayer', true);

    this.skillSystem  = new SkillSystem();
    this.xpSystem     = new XPSystem((level) => this.onLevelUp(level));
    this.waveSystem   = new WaveSystem(this, this.enemyPool, (id, type) => this.onBossSpawn(id, type));
    this.obstacleSystem = new ObstacleSystem(this);

    this.buildHUD();
  }

  // ─── HUD ─────────────────────────────────────────────
  private buildHUD(): void {
    const { width, height } = this.scale;
    const BAR_W = width * 0.50;
    const LEFT  = 10;
    const DEPTH = 100;

    // ── HUDパネル背景（グラデーション風） ──
    const panel = this.add.graphics().setDepth(DEPTH);
    panel.fillStyle(0x000000, 0.6);
    panel.fillRect(0, 0, width, 68);
    // 下線
    panel.lineStyle(1, 0x334466, 0.8);
    panel.strokeRect(0, 0, width, 68);

    // ── HPラベル ──
    this.add.text(LEFT, 16, 'HP', {
      fontSize: '12px', color: '#ff8888', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(DEPTH + 2);

    // HPバー背景（角丸風）
    const hpBg = this.add.graphics().setDepth(DEPTH + 1);
    hpBg.fillStyle(0x1a0000, 1);
    hpBg.fillRoundedRect(LEFT + 24, 9, BAR_W, 14, 4);
    hpBg.lineStyle(1, 0x660000, 1);
    hpBg.strokeRoundedRect(LEFT + 24, 9, BAR_W, 14, 4);

    // HPバー本体（Rectangleで幅を動的変更）
    this.hpBar = this.add.rectangle(LEFT + 24, 16, BAR_W, 12, 0xdd2222)
      .setOrigin(0, 0.5).setDepth(DEPTH + 2);

    this.hpText = this.add.text(LEFT + 24 + BAR_W / 2, 16, '100/100', {
      fontSize: '11px', color: '#ffffff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH + 3);

    // ── XPラベル ──
    this.add.text(LEFT, 36, 'XP', {
      fontSize: '12px', color: '#88aaff', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(DEPTH + 2);

    // XPバー背景
    const xpBg = this.add.graphics().setDepth(DEPTH + 1);
    xpBg.fillStyle(0x000b22, 1);
    xpBg.fillRoundedRect(LEFT + 24, 30, BAR_W, 10, 3);
    xpBg.lineStyle(1, 0x224488, 1);
    xpBg.strokeRoundedRect(LEFT + 24, 30, BAR_W, 10, 3);

    this.xpBar = this.add.rectangle(LEFT + 24, 35, 0, 8, 0x4488ff)
      .setOrigin(0, 0.5).setDepth(DEPTH + 2);

    this.xpLabel = this.add.text(LEFT, 52, 'Lv1 → 2: 0/100', {
      fontSize: '11px', color: '#99bbff',
    }).setOrigin(0, 0.5).setDepth(DEPTH + 2);

    // ── レベル（中央・枠付き） ──
    const lvBg = this.add.graphics().setDepth(DEPTH + 1);
    lvBg.fillStyle(0x111133, 0.85);
    lvBg.fillRoundedRect(width / 2 - 30, 6, 60, 30, 6);
    lvBg.lineStyle(1, 0x4455aa, 1);
    lvBg.strokeRoundedRect(width / 2 - 30, 6, 60, 30, 6);

    this.levelText = this.add.text(width / 2, 21, 'Lv1', {
      fontSize: '20px', color: '#ffffff',
      stroke: '#000022', strokeThickness: 3, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH + 2);

    // ── タイマー（右上・枠付き） ──
    const timBg = this.add.graphics().setDepth(DEPTH + 1);
    timBg.fillStyle(0x111111, 0.8);
    timBg.fillRoundedRect(width - 76, 6, 70, 30, 6);
    timBg.lineStyle(1, 0x445566, 1);
    timBg.strokeRoundedRect(width - 76, 6, 70, 30, 6);

    this.timerText = this.add.text(width - 41, 21, '00:00', {
      fontSize: '18px', color: '#eeeeff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH + 2);

    // ── 妖核カウンター（左下・半透明背景） ──
    const ykBg = this.add.graphics().setDepth(DEPTH);
    ykBg.fillStyle(0x110022, 0.7);
    ykBg.fillRoundedRect(4, height - 28, 100, 22, 4);

    this.youkakuText = this.add.text(12, height - 17, '妖核: 0', {
      fontSize: '13px', color: '#cc88ff',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0, 0.5).setDepth(DEPTH + 2);
  }

  // ─── メインループ ─────────────────────────────────────
  update(time: number, delta: number): void {
    if (this.paused || this.stageCleared) return;
    if (!this.player.isAlive) { this.onGameOver(); return; }

    this.player.update(time, delta);
    this.playerPool.update();
    this.enemyPool.update();
    this.waveSystem.update(delta);
    // obstacleSystem は無効化中
    // this.obstacleSystem.update(delta, this.waveSystem.getElapsed());
    this.boss?.update(delta);

    this.handleRegen(delta);
    this.handleRuntimeSkills(time, delta);
    this.handleCollisions(time);
    this.handleXPMagnet();
    this.updateHUD();
    this.updateSynergyHUD();
  }

  // ─── HP再生 ──────────────────────────────────────────
  private handleRegen(delta: number): void {
    const regenLv = this.skillSystem.getSkillLevel('B2_regen');
    if (regenLv === 0) return;
    this.regenTimer += delta;
    if (this.regenTimer >= 1000) {
      this.regenTimer = 0;
      const rate = [0.01, 0.02, 0.04][regenLv - 1];
      this.player.heal(Math.floor(this.player.stats.maxHp * rate));
    }
  }

  // ─── ランタイムスキル処理 ──────────────────────────────
  private handleRuntimeSkills(_time: number, delta: number): void {
    const stats = this.player.stats;

    // C3 オービタル
    this.updateOrbitals(delta);

    // C4 蓄積放電
    if (stats.dischargeLevel > 0) {
      this.dischargeTimer += delta;
      const interval = 500;
      if (this.dischargeTimer >= interval) {
        this.dischargeTimer = 0;
        this.doDischarge();
      }
    }

    // C5 ホーミング
    if (stats.homingLevel > 0) {
      this.homingTimer += delta;
      const interval = 3000;
      if (this.homingTimer >= interval) {
        this.homingTimer = 0;
        this.fireHomingMissiles();
      }
    }

    // C7 レーザー
    if (stats.laserLevel > 0) {
      this.laserCooldown = [5000, 4000, 3000][stats.laserLevel - 1];
      this.laserTimer += delta;
      if (this.laserTimer >= this.laserCooldown && !this.activeLaser) {
        this.laserTimer = 0;
        this.fireLaser();
      }
    }
  }

  private updateOrbitals(delta: number): void {
    const count = this.player.stats.orbitalCount;

    // 数が変わったら再生成
    if (this.orbitalBullets.length !== count) {
      this.orbitalBullets.forEach((b) => b.destroy());
      this.orbitalBullets = [];
      for (let i = 0; i < count; i++) {
        const orb = this.add.circle(0, 0, 8, 0x66ffff).setDepth(9);
        this.orbitalBullets.push(orb);
      }
    }

    if (count === 0) return;

    this.orbitalAngle += delta * 0.003;
    const radius = 60;
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    this.orbitalBullets.forEach((orb, i) => {
      const a = this.orbitalAngle + (i / count) * Math.PI * 2;
      orb.setPosition(px + Math.cos(a) * radius, py + Math.sin(a) * radius);

      // 敵との当たり判定
      for (const enemy of this.waveSystem.enemies) {
        if (!enemy.isAlive) continue;
        const dist = Phaser.Math.Distance.Between(orb.x, orb.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < 8 + enemy.config.size) {
          enemy.takeDamage(this.player.stats.damage * 0.5);
          this.applyBulletEffects(enemy, this.player.stats);
          if (!enemy.isAlive) this.onEnemyKilled(enemy.sprite.x, enemy.sprite.y, enemy.config.xp, enemy.config.youkakuDrop, enemy.config.youkakuChance);
        }
      }
    });
  }

  private doDischarge(): void {
    const stats = this.player.stats;
    const range = [80, 120, 160][stats.dischargeLevel - 1];
    const dmg   = Math.floor(stats.damage * 0.6);
    const px = this.player.sprite.x;
    const py = this.player.sprite.y;
    const maxChain = stats.dischargeLevel >= 3 ? 3 : 1;

    let hit = 0;
    for (const enemy of this.waveSystem.enemies) {
      if (!enemy.isAlive || hit >= maxChain) continue;
      const dist = Phaser.Math.Distance.Between(px, py, enemy.sprite.x, enemy.sprite.y);
      if (dist < range) {
        enemy.takeDamage(dmg);
        hit++;
        // 電撃ビジュアル
        const line = this.add.graphics();
        line.lineStyle(2, 0xffff44, 0.8);
        line.strokeLineShape(new Phaser.Geom.Line(px, py, enemy.sprite.x, enemy.sprite.y));
        this.time.delayedCall(150, () => line.destroy());
        if (!enemy.isAlive) this.onEnemyKilled(enemy.sprite.x, enemy.sprite.y, enemy.config.xp, enemy.config.youkakuDrop, enemy.config.youkakuChance);
      }
    }
  }

  private fireHomingMissiles(): void {
    const stats = this.player.stats;
    const count = [1, 2, 3][stats.homingLevel - 1];
    const targets = [...this.waveSystem.enemies].filter((e) => e.isAlive).slice(0, count);

    for (const target of targets) {
      const sx = this.player.sprite.x;
      const sy = this.player.sprite.y;
      const angle = Math.atan2(target.sprite.y - sy, target.sprite.x - sx);
      const spd   = 300;
      this.playerPool.fire(this, sx, sy,
        Math.cos(angle) * spd, Math.sin(angle) * spd,
        Math.floor(stats.damage * 1.5), 'player', 0xff8800, 7);
    }
  }

  private fireLaser(): void {
    const stats = this.player.stats;
    const width  = stats.laserLevel >= 3 ? 40 : 20;
    const px = this.player.sprite.x;

    const laser = this.add.rectangle(px, this.scale.height / 2, width, this.scale.height, 0x44ffff, 0.7);
    laser.setDepth(8);
    this.activeLaser = laser;

    // レーザーダメージ
    for (const enemy of this.waveSystem.enemies) {
      if (!enemy.isAlive) continue;
      if (Math.abs(enemy.sprite.x - px) < width / 2 + enemy.config.size) {
        enemy.takeDamage(stats.damage * 8);
        if (stats.iceLevel > 0) enemy.applyStatus('freeze', 1000, stats.iceLevel); // レーザー霜柱シナジー
        if (!enemy.isAlive) this.onEnemyKilled(enemy.sprite.x, enemy.sprite.y, enemy.config.xp, enemy.config.youkakuDrop, enemy.config.youkakuChance);
      }
    }
    // ボスにもダメージ
    if (this.boss?.isAlive && Math.abs(this.boss.sprite.x - px) < width / 2 + 45) {
      this.boss.takeDamage(stats.damage * 8);
    }

    this.tweens.add({
      targets: laser, alpha: 0, duration: 300,
      onComplete: () => { laser.destroy(); this.activeLaser = null; },
    });
  }

  // ─── XP磁石 ────────────────────────────────────────────
  private handleXPMagnet(): void {
    const magLv = this.player.stats.xpMagnetLevel;
    if (magLv === 0 || this.xpGems.length === 0) return;
    const range  = magLv >= 3 ? 9999 : [200, 400][magLv - 1];
    const px = this.player.sprite.x, py = this.player.sprite.y;

    this.xpGems = this.xpGems.filter((gem) => {
      if (!gem.active) return false;
      const dist = Phaser.Math.Distance.Between(px, py, gem.x, gem.y);
      if (dist < range) {
        this.xpSystem.addXP(gem.getData('xp') as number);
        gem.destroy();
        return false;
      }
      return true;
    });
  }

  // ─── 当たり判定 ──────────────────────────────────────
  private handleCollisions(time: number): void {
    const ps = this.player.sprite;
    const stats = this.player.stats;

    // プレイヤー弾 vs 敵
    this.playerPool.physicsGroup.getChildren().forEach((b) => {
      const bullet = b as Phaser.GameObjects.Arc;
      if (!bullet.active) return;
      let pierceCount = bullet.getData('pierceCount') as number ?? 0;

      // 通常敵
      for (const enemy of this.waveSystem.enemies) {
        if (!enemy.isAlive) continue;
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.sprite.x, enemy.sprite.y);
        if (dist < bullet.radius + enemy.config.size * stats.hitboxScale) {
          const dmg = bullet.getData('damage') as number;
          enemy.takeDamage(dmg);
          this.applyBulletEffects(enemy, stats);

          // 吸血（B5）
          if (stats.lifeStealRate > 0) {
            this.player.heal(Math.ceil(dmg * stats.lifeStealRate));
          }
          // 経験値共鳴（D8）
          if (stats.xpResonanceLevel > 0 && !enemy.isAlive) {
            this.player.heal(Math.ceil(this.player.stats.maxHp * [0.001, 0.002, 0.003][stats.xpResonanceLevel - 1]));
          }

          if (!enemy.isAlive) {
            this.onEnemyKilled(enemy.sprite.x, enemy.sprite.y, enemy.config.xp, enemy.config.youkakuDrop, enemy.config.youkakuChance);
          }

          // 爆発（A2）
          if (stats.explosionLevel > 0) {
            this.doExplosion(bullet.x, bullet.y, stats);
          }
          // 分裂（A5）
          if (stats.splitLevel > 0) {
            this.doSplit(bullet.x, bullet.y, stats);
          }

          // 貫通（A1）
          if (stats.piercing) {
            pierceCount++;
            bullet.setData('pierceCount', pierceCount);
            if (pierceCount > stats.pierceLimit) {
              this.playerPool.killBullet(bullet);
            }
          } else {
            this.playerPool.killBullet(bullet);
          }
          if (!bullet.active) break;
        }
      }

      // ボス
      if (bullet.active && this.boss?.isAlive) {
        const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.boss.sprite.x, this.boss.sprite.y);
        if (dist < bullet.radius + 45) {
          const dmg = bullet.getData('damage') as number;
          this.boss.takeDamage(dmg);
          if (stats.lifeStealRate > 0) this.player.heal(Math.ceil(dmg * stats.lifeStealRate));
          if (stats.explosionLevel > 0) this.doExplosion(bullet.x, bullet.y, stats);
          this.playerPool.killBullet(bullet);
          if (!this.boss.isAlive) this.onBossDefeated();
        }
      }
    });

    // 敵弾 vs プレイヤー
    this.enemyPool.physicsGroup.getChildren().forEach((b) => {
      const bullet = b as Phaser.GameObjects.Arc;
      if (!bullet.active) return;

      // 磁力バリア（B9）
      if (stats.barrierLevel > 0) {
        const absorbChance = [0.1, 0.2, 0.3][stats.barrierLevel - 1];
        if (Math.random() < absorbChance) {
          this.enemyPool.killBullet(bullet);
          if (stats.barrierLevel >= 3) this.player.heal(2);
          return;
        }
      }

      const dist = Phaser.Math.Distance.Between(bullet.x, bullet.y, ps.x, ps.y);
      if (dist < bullet.radius + 10 * stats.hitboxScale) {
        const dmg = bullet.getData('damage') as number;
        this.player.takeDamage(dmg, time);
        this.enemyPool.killBullet(bullet);
        this.cameras.main.flash(100, 255, 0, 0, false);
      }
    });

    // 敵体当たり
    for (const enemy of this.waveSystem.enemies) {
      if (!enemy.isAlive) continue;
      const dist = Phaser.Math.Distance.Between(enemy.sprite.x, enemy.sprite.y, ps.x, ps.y);
      if (dist < enemy.config.size + 14 * stats.hitboxScale) {
        this.player.takeDamage(5, time);
        enemy.takeDamage(999);
      }
    }

    // 障害物即死
    for (const obs of this.obstacleSystem.obstacles) {
      if (!obs.active) continue;
      const bounds = obs.getBounds();
      if (ps.x > bounds.left - 10 && ps.x < bounds.right + 10 &&
          ps.y > bounds.top  - 10 && ps.y < bounds.bottom + 10) {
        this.player.takeDamage(9999, time);
      }
    }
  }

  // ─── 弾エフェクト適用 ─────────────────────────────────
  private applyBulletEffects(enemy: import('../entities/Enemy').Enemy, stats: typeof this.player.stats): void {
    if (stats.poisonLevel > 0) enemy.applyStatus('poison', 3000, stats.poisonLevel);
    if (stats.burnLevel   > 0) enemy.applyStatus('burn',   2000, stats.burnLevel);
    if (stats.iceLevel    > 0) {
      if (stats.iceLevel >= 2) {
        enemy.applyStatus('freeze', 1000, stats.iceLevel);
      } else {
        enemy.applyStatus('slow', 2000, stats.iceLevel);
      }
    }
  }

  private doExplosion(x: number, y: number, stats: typeof this.player.stats): void {
    const radius = [50, 75, 90][stats.explosionLevel - 1];
    const dmg    = Math.floor(stats.damage * 0.5);

    const circle = this.add.circle(x, y, radius, 0xff6600, 0.4);
    this.tweens.add({ targets: circle, alpha: 0, scale: 1.5, duration: 250, onComplete: () => circle.destroy() });

    for (const enemy of this.waveSystem.enemies) {
      if (!enemy.isAlive) continue;
      if (Phaser.Math.Distance.Between(x, y, enemy.sprite.x, enemy.sprite.y) < radius + enemy.config.size) {
        enemy.takeDamage(dmg);
        if (!enemy.isAlive) this.onEnemyKilled(enemy.sprite.x, enemy.sprite.y, enemy.config.xp, enemy.config.youkakuDrop, enemy.config.youkakuChance);
      }
    }
  }

  private doSplit(x: number, y: number, stats: typeof this.player.stats): void {
    const count = stats.splitLevel >= 2 ? 8 : 4;
    const dmg   = Math.floor(stats.damage * 0.3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.playerPool.fire(this, x, y,
        Math.cos(angle) * 200, Math.sin(angle) * 200,
        dmg, 'player', 0xaaccff, 4);
    }
  }

  // ─── 敵撃破処理 ───────────────────────────────────────
  private onEnemyKilled(x: number, y: number, xp: number, youkakuDrop: number, youkakuChance: number): void {
    // XP ジェムを配置
    const gem = this.add.circle(x, y, 6, 0x88ff88).setDepth(4);
    gem.setData('xp', xp);
    this.xpGems.push(gem);

    // 磁石Lv3は即回収
    if (this.player.stats.xpMagnetLevel >= 3) {
      this.xpSystem.addXP(xp);
      gem.destroy();
      this.xpGems = this.xpGems.filter((g) => g.active);
    } else {
      // 画面下方向に落下させる（プレイヤーが拾いやすいよう）
      this.tweens.add({
        targets: gem,
        y: this.scale.height - 120,
        duration: 2000,
        ease: 'Cubic.easeIn',
      });
      this.time.delayedCall(8000, () => {
        if (gem.active) { gem.destroy(); }
        this.xpGems = this.xpGems.filter((g) => g.active);
      });
    }

    // 妖核ドロップ
    this.dropYoukaku(x, y, youkakuDrop, youkakuChance);
  }

  private dropYoukaku(x: number, y: number, amount: number, chance: number): void {
    const stats = this.player.stats;
    const finalAmount = Math.ceil(amount * (1 + stats.youkakuBonusRate));
    if (Math.random() > chance * (1 + stats.youkakuBonusRate * 0.5)) return;
    this.youkakuThisRun += finalAmount;

    const gem = this.add.circle(x, y, 6, 0xcc88ff).setDepth(4);
    this.tweens.add({
      targets: gem, y: y - 30, alpha: 0, duration: 600,
      onComplete: () => gem.destroy(),
    });
    this.youkakuText.setText(`妖核: ${this.youkakuThisRun}`);
  }

  // ─── XP拾い（プレイヤー付近） ─────────────────────────
  private updateHUD(): void {
    const BAR_W = this.scale.width * 0.45;
    const stats = this.player.stats;

    // HP バー
    const hpRatio = Math.max(0, stats.hp / stats.maxHp);
    this.hpBar.width = BAR_W * hpRatio;
    this.hpText.setText(`${stats.hp}/${stats.maxHp}`);

    // HP バーの色（残量で変化）
    const hpColor = hpRatio > 0.5 ? 0xdd2222 : hpRatio > 0.25 ? 0xee6600 : 0xff2200;
    this.hpBar.setFillStyle(hpColor);

    // XP バー
    const xpRatio = this.xpSystem.getXPRatio();
    this.xpBar.width = BAR_W * xpRatio;

    const lv = this.xpSystem.getLevel();
    const xpNow = this.xpSystem.getXP();
    const xpNeeded = this.xpSystem.getXPNeeded();
    this.xpLabel.setText(`Lv${lv} → ${lv + 1}: ${xpNow}/${xpNeeded}`);
    this.levelText.setText(`Lv${lv}`);

    const elapsed = Math.floor(this.waveSystem.getElapsed());
    const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const s = (elapsed % 60).toString().padStart(2, '0');
    this.timerText.setText(`${m}:${s}`);

    // XP ジェムの近接回収
    const range = this.player.stats.xpMagnetLevel >= 2 ? 150 : 60;
    const px = this.player.sprite.x, py = this.player.sprite.y;
    this.xpGems = this.xpGems.filter((gem) => {
      if (!gem.active) return false;
      if (Phaser.Math.Distance.Between(px, py, gem.x, gem.y) < range) {
        this.xpSystem.addXP(gem.getData('xp') as number);
        gem.destroy();
        return false;
      }
      return true;
    });
  }

  private updateSynergyHUD(): void {
    const synergies: ActiveSynergy[] = SynergyCalculator.getActive(this.skillSystem);
    // シナジーテキストを再描画
    this.synergyTexts.forEach((t) => t.destroy());
    this.synergyTexts = [];
    synergies.forEach((syn, i) => {
      const t = this.add.text(10, 60 + i * 22, `⚡ ${syn.name}`,
        { fontSize: '13px', color: '#' + syn.color.toString(16).padStart(6, '0') })
        .setDepth(102).setAlpha(0.85);
      this.synergyTexts.push(t);
    });
  }

  // ─── レベルアップ ─────────────────────────────────────
  private onLevelUp(level: number): void {
    this.skillSystem.setCurrentLevel(level);

    // D3 ラッシュ
    const rushLv = this.skillSystem.getSkillLevel('D3_rush');
    if (rushLv > 0) {
      const dur = [3000, 5000, 7000][rushLv - 1];
      this.player.rushTimer = dur;
    }

    const { width, height } = this.scale;
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff, 0.25).setDepth(200);
    this.tweens.add({ targets: flash, alpha: 0, duration: 400, onComplete: () => flash.destroy() });

    const lvText = this.add.text(width / 2, height / 2, `Level ${level}!`,
      { fontSize: '48px', color: '#ffd700', stroke: '#ff8800', strokeThickness: 4 })
      .setOrigin(0.5).setDepth(201);
    this.tweens.add({ targets: lvText, y: height / 2 - 60, alpha: 0, duration: 1000,
      onComplete: () => lvText.destroy() });

    this.paused = true;
    this.time.delayedCall(600, () => {
      const choiceCount = this.player.stats.skillChoiceCount;
      const cards = this.skillSystem.drawCards(choiceCount);
      if (cards.length > 0) {
        this.scene.launch('LevelUpScene', {
          cards,
          skillSystem: this.skillSystem,
          playerStats: this.player.stats,
          onClose: () => { this.paused = false; },
        });
      } else {
        this.paused = false;
      }
    });
  }

  // ─── ボス出現 ────────────────────────────────────────
  private onBossSpawn(id: string, type: 'miniboss' | 'midboss' | 'boss'): void {
    const def = STAGE1_BOSSES[id];
    if (!def) return;

    this.boss = new Boss(this, this.enemyPool, def.name, def.maxHp, def.phases);

    const { width, height } = this.scale;
    const color = type === 'boss' ? '#ffdd00' : type === 'midboss' ? '#ff88aa' : '#ff8888';
    const t = this.add.text(width / 2, height / 2 - 120, `-- ${def.name} --`,
      { fontSize: '34px', color, stroke: '#440000', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: t, alpha: 0, duration: 2000, delay: 1000, onComplete: () => t.destroy() });
  }

  // ─── ボス撃破 ─────────────────────────────────────────
  private onBossDefeated(): void {
    const bossName = this.boss?.getName?.() ?? '';
    const def = Object.values(STAGE1_BOSSES).find((d) => d.name === bossName);
    const xpReward  = def?.xpReward  ?? 500;
    const ykReward  = def?.youkakuReward ?? 15;

    this.xpSystem.addXP(xpReward);
    this.youkakuThisRun += ykReward;
    this.youkakuText.setText(`妖核: ${this.youkakuThisRun}`);

    const { width, height } = this.scale;
    const t = this.add.text(width / 2, height / 2, '撃破！',
      { fontSize: '52px', color: '#ffd700', stroke: '#ff8800', strokeThickness: 4 })
      .setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: t, y: height / 2 - 80, alpha: 0, duration: 1500,
      onComplete: () => {
        t.destroy();
        this.boss = null;
        // ラスボス撃破ならクリア
        if (this.waveSystem.getElapsed() >= 1799) {
          this.onStageClear();
        }
      },
    });
  }

  // ─── ステージクリア ───────────────────────────────────
  private onStageClear(): void {
    this.stageCleared = true;
    const clearBonus = 50;
    const totalYoukaku = this.youkakuThisRun + clearBonus;
    SaveSystem.addYoukaku(totalYoukaku);
    SaveSystem.markStageCleared(1);

    this.time.delayedCall(800, () => {
      this.scene.stop('LevelUpScene');
      this.scene.start('ResultScene', {
        stage: 1,
        youkakuEarned: totalYoukaku,
        level: this.xpSystem.getLevel(),
        elapsed: this.waveSystem.getElapsed(),
      });
    });
  }

  // ─── ゲームオーバー ──────────────────────────────────
  private onGameOver(): void {
    if (this.paused) return;
    this.paused = true;
    this.orbitalBullets.forEach((b) => b.destroy());
    this.orbitalBullets = [];

    const kept = Math.floor(this.youkakuThisRun * 0.5);
    SaveSystem.addYoukaku(kept);

    this.scene.stop('LevelUpScene');
    this.scene.start('GameOverScene', {
      youkakuKept: kept,
      youkakuLost: this.youkakuThisRun - kept,
    });
  }
}
