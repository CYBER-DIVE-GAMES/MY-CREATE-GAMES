// ============================================================
// js/managers/EnemySpawner.js
// 敵スポーン管理マネージャー
// 時間経過に応じた敵の出現・ボスの出現タイミングを管理します
// ============================================================

'use strict';

class EnemySpawner {
    // ============================================================
    // コンストラクタ
    // scene       : 属するPhaser.Scene
    // stageConfig : ステージの難易度設定（STAGE_CONFIGの要素）
    // ============================================================
    constructor(scene, stageConfig) {
        this.scene       = scene;
        this.stageConfig = stageConfig;

        // スポーンタイマー（次のスポーンまでの残り時間、ms）
        this.spawnTimer = 0;

        // 中ボス撃破後フラグ（難易度が大幅に上昇する）
        this.midBossDefeated = false;

        // ボス出現タイミング（秒数）
        // 5分ごとにミニボス、20分で中ボス、30分で最終ボス
        this.bossSchedule = [
            { time: 300,  type: 'miniBoss',  done: false }, //  5分
            { time: 600,  type: 'miniBoss',  done: false }, // 10分
            { time: 900,  type: 'miniBoss',  done: false }, // 15分
            { time: 1200, type: 'midBoss',   done: false }, // 20分（中ボス）
            { time: 1500, type: 'miniBoss',  done: false }, // 25分
            { time: 1800, type: 'finalBoss', done: false }, // 30分（最終ボス）
        ];

        // 現在アクティブなボス（1体のみ）
        this.activeBoss = null;

        // 通常スポーンの一時停止フラグ（ボス出現時に停止）
        this.pauseSpawn = false;
        this.pauseTimer = 0;

        // スポーン上限（パフォーマンス保護）
        this.maxEnemies = 80;
    }

    // ============================================================
    // update(time, gameTimeSec)
    // 毎フレーム呼ばれる更新処理
    // time        : Phaser の現在時刻（ms）
    // gameTimeSec : ゲーム内経過時間（秒）
    // ============================================================
    update(time, gameTimeSec, delta) {
        // ============================================================
        // ボス出現チェック（スケジュールと照合）
        // ============================================================
        for (const schedule of this.bossSchedule) {
            if (!schedule.done && gameTimeSec >= schedule.time) {
                schedule.done = true;
                this.spawnBoss(schedule.type, gameTimeSec);
                // ボス出現時は通常スポーンを3秒停止
                this.pauseSpawn = true;
                this.pauseTimer = 3000;
                break; // 1回に1体だけ
            }
        }

        // スポーン停止タイマーの更新
        if (this.pauseSpawn) {
            this.pauseTimer -= delta;
            if (this.pauseTimer <= 0) this.pauseSpawn = false;
        }

        // ボス戦中・停止中は通常スポーンしない
        if (this.pauseSpawn || this.activeBoss) return;

        // ============================================================
        // 通常敵のスポーン
        // ============================================================
        if (this.scene.allEnemies.length >= this.maxEnemies) return; // 上限チェック

        this.spawnTimer -= delta;
        if (this.spawnTimer <= 0) {
            const scaling = this.getCurrentScaling(gameTimeSec);
            this.spawnTimer = scaling.spawnInterval * (1 / this.stageConfig.spawnRateMult);
            this.spawnEnemy(scaling, gameTimeSec);
        }
    }

    // ============================================================
    // getCurrentScaling(gameTimeSec)
    // 現在の経過時間に対応するスケーリングパラメータを返す
    // TIME_SCALING 配列から現在時刻に最適な設定を選択する
    // ============================================================
    getCurrentScaling(gameTimeSec) {
        let scaling = TIME_SCALING[0];
        for (const s of TIME_SCALING) {
            if (gameTimeSec >= s.time) scaling = s;
            else break;
        }

        // 中ボス撃破後は難易度を追加で上げる
        if (this.midBossDefeated) {
            return {
                ...scaling,
                hpMult:        scaling.hpMult   * 1.5,
                dmgMult:       scaling.dmgMult  * 1.5,
                speedMult:     scaling.speedMult * 1.2,
                spawnInterval: scaling.spawnInterval * 0.7
            };
        }

        return scaling;
    }

    // ============================================================
    // spawnEnemy(scaling, gameTimeSec)
    // 通常敵を1体スポーンする
    // scaling : TIME_SCALING から取得した現在の難易度設定
    // ============================================================
    spawnEnemy(scaling, gameTimeSec) {
        // 出現させる敵の種類をランダムに選ぶ
        const types = scaling.types;
        const typeId = types[Math.floor(Math.random() * types.length)];

        // スポーン位置：画面上端からランダムなX座標
        const W  = this.scene.scale.width;
        const sx = Phaser.Math.Between(30, W - 30);
        const sy = -30; // 画面上端の少し外

        // ステージと時間の倍率を組み合わせて最終ステータスを計算
        const hpMult    = scaling.hpMult    * this.stageConfig.enemyHpMult;
        const dmgMult   = scaling.dmgMult   * this.stageConfig.enemyDmgMult;
        const speedMult = scaling.speedMult * this.stageConfig.enemySpeedMult;

        const enemy = new Enemy(this.scene, sx, sy, typeId, hpMult, dmgMult, speedMult);
        this.scene.allEnemies.push(enemy);
    }

    // ============================================================
    // spawnBoss(bossType, gameTimeSec)
    // ボスをスポーンする
    // bossType : 'miniBoss' / 'midBoss' / 'finalBoss'
    // ============================================================
    spawnBoss(bossType, gameTimeSec) {
        const W = this.scene.scale.width;
        const bx = W / 2; // 画面中央X
        const by = 100;   // 画面上部から少し下

        // ステージの倍率を適用
        const hpMult = this.stageConfig.bossHpMult;
        const dmgMult = this.stageConfig.enemyDmgMult;

        const boss = new Boss(this.scene, bx, by, bossType, hpMult, dmgMult, 1);
        this.activeBoss = boss;
        this.scene.allEnemies.push(boss);

        // GameScene にボス出現を通知
        this.scene.events.emit('bossSpawned', { type: bossType, boss: boss });

        // ボス出現メッセージを表示
        this.scene.showBossAlert(bossType);
    }

    // ============================================================
    // onBossDefeated(bossType)
    // ボスが倒されたときに呼ばれる処理
    // ============================================================
    onBossDefeated(bossType) {
        this.activeBoss = null;

        if (bossType === 'midBoss') {
            // 中ボス撃破後：難易度が大幅上昇
            this.midBossDefeated = true;
            this.scene.showMidBossDefeatedMessage();
        }
    }
}
