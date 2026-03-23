// ============================================================
// js/data/EnemyData.js
// 敵キャラクターのデータ定義ファイル
// 通常敵・ボスのステータスとステージ設定を管理します
// ============================================================

'use strict';

// ============================================================
// 敵データ
// hp        : 基本HP
// damage    : プレイヤーへの接触ダメージ
// speed     : 移動速度(px/秒)
// xpValue   : 倒したときに落とす経験値量
// coinChance: コインをドロップする確率 (0.0〜1.0)
// coinAmount: ドロップするコイン数の範囲 [最小, 最大]
// size      : スプライトのサイズ(px)
// color     : スプライトの色（16進数）
// isBoss    : ボス判定フラグ
// ============================================================
const ENEMY_DATA = {

    // ==================== 通常敵 ====================

    // 【グラント】最も基本的な敵。スライム型宇宙人
    grunt: {
        id: 'grunt',
        textureKey: 'enemy_slime',   // BootSceneで生成するテクスチャキー
        hp: 30,
        damage: 10,
        speed: 75,
        xpValue: 10,
        coinChance: 0.10,
        coinAmount: [1, 2],
        size: 26,
        color: 0xff4444,
        scoreValue: 100,
        isBoss: false,
        // 狙い撃ち弾を発射
        shootsBack: true,
        bulletPattern: 'aimed',
        bulletSpeed: 200,
        bulletDamageRatio: 0.4,
        shootInterval: [2500, 3500]
    },

    // 【スピーダー】速いが弱い敵。クラゲ型宇宙人
    speeder: {
        id: 'speeder',
        textureKey: 'enemy_jellyfish',
        hp: 15,
        damage: 8,
        speed: 160,
        xpValue: 15,
        coinChance: 0.08,
        coinAmount: [1, 2],
        size: 22,
        color: 0xff8800,
        scoreValue: 150,
        isBoss: false,
        // 素早い単発弾を連射
        shootsBack: true,
        bulletPattern: 'aimed',
        bulletSpeed: 300,
        bulletDamageRatio: 0.3,
        shootInterval: [1200, 2000]
    },

    // 【タンク】遅いが頑丈な敵。タコ型宇宙人
    tank: {
        id: 'tank',
        textureKey: 'enemy_octopus',
        hp: 120,
        damage: 20,
        speed: 45,
        xpValue: 35,
        coinChance: 0.25,
        coinAmount: [2, 4],
        size: 36,
        color: 0xaa0000,
        scoreValue: 350,
        isBoss: false,
        // 3方向扇形弾を発射
        shootsBack: true,
        bulletPattern: 'spread3',
        bulletSpeed: 160,
        bulletDamageRatio: 0.5,
        shootInterval: [3000, 4500]
    },

    // 【スナイパー】プレイヤーに向けて弾を撃つ宇宙人
    sniper: {
        id: 'sniper',
        textureKey: 'enemy_shooter',
        hp: 25,
        damage: 15,
        speed: 60,
        xpValue: 20,
        coinChance: 0.12,
        coinAmount: [1, 3],
        size: 22,
        color: 0xaa44ff,
        scoreValue: 200,
        isBoss: false,
        // 高速狙い撃ち
        shootsBack: true,
        bulletPattern: 'aimed',
        bulletSpeed: 330,
        bulletDamageRatio: 0.6,
        shootInterval: [1200, 2200]
    },

    // ==================== ボス ====================

    // 【ミニボス】5分ごとに出現する小型UFO
    miniBoss: {
        id: 'miniBoss',
        textureKey: 'boss_ufo_mini',
        hp: 1500,
        damage: 30,
        speed: 55,
        xpValue: 300,
        coinChance: 1.0,
        coinAmount: [15, 25],
        size: 60,
        color: 0x880000,
        scoreValue: 3000,
        isBoss: true
    },

    // 【中ボス】20分で出現する中型UFO
    midBoss: {
        id: 'midBoss',
        textureKey: 'boss_ufo_mid',
        hp: 8000,
        damage: 45,
        speed: 65,
        xpValue: 800,
        coinChance: 1.0,
        coinAmount: [50, 80],
        size: 80,
        color: 0x550033,
        scoreValue: 15000,
        isBoss: true,
        isMidBoss: true
    },

    // 【最終ボス】30分で出現するラスボス大型UFO
    finalBoss: {
        id: 'finalBoss',
        textureKey: 'boss_ufo_final',
        hp: 30000,
        damage: 70,
        speed: 70,
        xpValue: 2000,
        coinChance: 1.0,
        coinAmount: [150, 250],
        size: 100,
        color: 0x220011,
        scoreValue: 60000,
        isBoss: true,
        isFinalBoss: true
    }
};

// ============================================================
// ステージ設定
// 各ステージの難易度係数と固有設定
// xxxMultiplier: ENEMY_DATAの基本値に掛ける倍率
// ============================================================
const STAGE_CONFIG = {
    1: {
        name: 'ステージ1 - 低難易度',
        description: 'チュートリアル的な難易度。まず基本を覚えよう',
        enemyHpMult:    1.0, // 敵HP倍率
        enemyDmgMult:   1.0, // 敵ダメージ倍率
        enemySpeedMult: 1.0, // 敵スピード倍率
        bossHpMult:     1.0, // ボスHP倍率
        spawnRateMult:  1.0, // 敵出現頻度倍率
        bgColor: 0x0a0a1a    // 背景色（暗い青）
    },
    2: {
        name: 'ステージ2 - 中難易度',
        description: '手強い敵が増える。装備を整えて挑もう',
        enemyHpMult:    1.8,
        enemyDmgMult:   1.5,
        enemySpeedMult: 1.2,
        bossHpMult:     2.0,
        spawnRateMult:  1.4,
        bgColor: 0x0a1a0a    // 背景色（暗い緑）
    },
    3: {
        name: 'ステージ3 - 高難易度',
        description: '最強の敵が待ち受ける。覚悟して挑め',
        enemyHpMult:    3.0,
        enemyDmgMult:   2.5,
        enemySpeedMult: 1.5,
        bossHpMult:     3.5,
        spawnRateMult:  2.0,
        bgColor: 0x1a0a0a    // 背景色（暗い赤）
    }
};

// ============================================================
// 時間経過による難易度スケーリング
// 経過時間（秒）に対して敵ステータスに掛ける倍率を定義
// 配列の各要素: { time: 適用開始秒数, hpMult, dmgMult, speedMult, spawnInterval }
// ============================================================
const TIME_SCALING = [
    // 全敵タイプが最初から登場。スポーン間隔を短くして弾幕密度を高める
    { time:    0, hpMult: 1.0, dmgMult: 1.0, speedMult: 1.0, spawnInterval: 2000, types: ['grunt', 'speeder'] },
    { time:   60, hpMult: 1.1, dmgMult: 1.0, speedMult: 1.0, spawnInterval: 1700, types: ['grunt', 'speeder', 'tank', 'sniper'] },
    { time:  120, hpMult: 1.2, dmgMult: 1.1, speedMult: 1.05,spawnInterval: 1500, types: ['grunt', 'speeder', 'tank', 'sniper'] },
    { time:  180, hpMult: 1.4, dmgMult: 1.2, speedMult: 1.1, spawnInterval: 1350, types: ['grunt', 'speeder', 'tank', 'sniper'] },
    { time:  240, hpMult: 1.6, dmgMult: 1.3, speedMult: 1.15,spawnInterval: 1200, types: ['grunt', 'speeder', 'tank', 'sniper'] },
    { time:  300, hpMult: 1.8, dmgMult: 1.4, speedMult: 1.2, spawnInterval: 1100, types: ['grunt', 'speeder', 'tank', 'sniper'] },
    { time:  480, hpMult: 2.2, dmgMult: 1.6, speedMult: 1.3, spawnInterval: 950,  types: ['grunt', 'speeder', 'tank', 'sniper'] },
    { time:  600, hpMult: 2.6, dmgMult: 1.8, speedMult: 1.35,spawnInterval: 850,  types: ['grunt', 'speeder', 'tank', 'sniper'] },
    { time:  900, hpMult: 3.2, dmgMult: 2.0, speedMult: 1.4, spawnInterval: 750,  types: ['grunt', 'speeder', 'tank', 'sniper'] },
    { time: 1200, hpMult: 4.0, dmgMult: 2.5, speedMult: 1.5, spawnInterval: 600,  types: ['grunt', 'speeder', 'tank', 'sniper'] }, // 中ボス後
    { time: 1500, hpMult: 5.0, dmgMult: 3.0, speedMult: 1.6, spawnInterval: 480,  types: ['grunt', 'speeder', 'tank', 'sniper'] },
    { time: 1700, hpMult: 6.5, dmgMult: 3.5, speedMult: 1.7, spawnInterval: 350,  types: ['grunt', 'speeder', 'tank', 'sniper'] }, // 最終ボス直前
];
