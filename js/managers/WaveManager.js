// ============================================================
// WaveManager.js - 敵ウェーブ管理
// ============================================================

class WaveManager {
    constructor(scene, stageData, upgrades) {
        this.scene = scene;
        this.stageData = stageData;
        this.upgrades = upgrades || {};

        this.startTime = null;
        this.waveIndex = 0;
        this.spawnedWaves = [];
        this.allSpawned = false;

        // ウェーブをtime順にソート
        this.waves = [...(stageData.waves || [])].sort((a, b) => a.time - b.time);
        this.totalWaves = this.waves.length;

        // 敵スポーン位置（敵城の少し前）
        this.spawnX = 680;
    }

    start(time) {
        this.startTime = time;
    }

    update(time) {
        if (this.startTime === null) return;
        if (this.allSpawned) return;

        const elapsed = time - this.startTime;

        // 時刻になったウェーブをスポーン
        while (this.waveIndex < this.waves.length) {
            const wave = this.waves[this.waveIndex];
            if (elapsed >= wave.time) {
                this.spawnWave(wave, time);
                this.waveIndex++;
            } else {
                break;
            }
        }

        if (this.waveIndex >= this.waves.length) {
            this.allSpawned = true;
        }
    }

    spawnWave(wave, time) {
        const count = wave.count || 1;
        const unitKey = wave.type;
        const baseConfig = UNIT_DATA[unitKey];
        if (!baseConfig) {
            console.warn(`Unknown unit type: ${unitKey}`);
            return;
        }

        for (let i = 0; i < count; i++) {
            // 少しずつずらしてスポーン
            const delay = i * 400;
            this.scene.time.delayedCall(delay, () => {
                this.spawnUnit(unitKey, baseConfig);
            });
        }
    }

    spawnUnit(unitKey, config) {
        if (this.scene.gameOver) return;

        // スポーン位置（少しランダムにずらす）
        const spawnX = this.spawnX + Phaser.Math.Between(-10, 10);
        const groundY = this.scene.GROUND_Y;
        const spawnY = config.isFlying ? groundY - 30 : groundY - 10;

        const unit = new Unit(
            this.scene,
            spawnX,
            spawnY,
            config,
            true,   // isEnemy = true
            {}      // 敵はアップグレードなし
        );

        this.scene.enemyUnits.push(unit);

        // スポーンエフェクト
        this.createSpawnEffect(spawnX, spawnY);
    }

    createSpawnEffect(x, y) {
        const p = this.scene.add.graphics();
        p.setDepth(16);
        p.lineStyle(2, 0xff4400, 1);
        p.strokeCircle(x, y, 5);
        this.scene.tweens.add({
            targets: p,
            scaleX: 3,
            scaleY: 3,
            alpha: 0,
            duration: 400,
            onComplete: () => p.destroy()
        });
    }

    // まだスポーンしていないウェーブの次のタイム
    getNextWaveTime() {
        if (this.startTime === null || this.waveIndex >= this.waves.length) return null;
        return this.waves[this.waveIndex].time - (this.scene.time.now - this.startTime);
    }

    // 全ウェーブスポーン済みか
    isComplete() {
        return this.allSpawned;
    }

    // 進捗率 (0.0~1.0)
    getProgress() {
        if (this.waves.length === 0) return 1;
        return this.waveIndex / this.waves.length;
    }
}
