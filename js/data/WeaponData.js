// ============================================================
// js/data/WeaponData.js
// 武器データ・強化データの定義ファイル
// 各武器のステータス、進化条件、パッシブ強化などを管理します
// ============================================================

'use strict';

// ============================================================
// 武器データ
// id          : 武器の識別子（英語キー）
// name        : ゲーム内表示名
// description : 説明文
// maxLevel    : 最大レベル
// type        : 動作方式（bullet/spread/homing/laser/explosion/railgun/missileStorm）
// color       : 弾の色（16進数 0xRRGGBB）
// stats       : レベルごとのステータス配列（stats[0] = レベル1）
// ============================================================
const WEAPON_DATA = {

    // ==================== 通常武器 5種類 ====================

    // 【直線弾】上方向に真っ直ぐ飛ぶ基本的な弾
    straightShot: {
        id: 'straightShot',
        name: '直線弾',
        description: '真っ直ぐ飛ぶ弾を発射する基本武器',
        maxLevel: 5,
        type: 'bullet',
        color: 0x00ffff, // シアン色
        stats: [
            // Lv1: 基本性能
            { damage: 15, fireRate: 1000, speed: 500, count: 1 },
            // Lv2: ダメージ・速度アップ
            { damage: 22, fireRate: 900,  speed: 530, count: 1 },
            // Lv3: 弾数が2発に増加
            { damage: 30, fireRate: 800,  speed: 560, count: 2 },
            // Lv4: さらに強化
            { damage: 38, fireRate: 700,  speed: 590, count: 2 },
            // Lv5: MAX 弾数3発
            { damage: 50, fireRate: 600,  speed: 620, count: 3 },
        ]
    },

    // 【拡散弾】扇状に複数の弾を同時に発射する
    spreadShot: {
        id: 'spreadShot',
        name: '拡散弾',
        description: '扇状に複数の弾を同時発射する',
        maxLevel: 5,
        type: 'spread',
        color: 0xffff00, // 黄色
        stats: [
            // spreadAngle: 弾の広がり角度（度）。この角度を弾数で等分して発射
            { damage: 10, fireRate: 1200, speed: 400, count: 3, spreadAngle: 20 },
            { damage: 14, fireRate: 1100, speed: 420, count: 3, spreadAngle: 25 },
            { damage: 18, fireRate: 1000, speed: 440, count: 5, spreadAngle: 30 },
            { damage: 24, fireRate: 900,  speed: 460, count: 5, spreadAngle: 35 },
            { damage: 30, fireRate: 800,  speed: 480, count: 7, spreadAngle: 40 },
        ]
    },

    // 【追尾弾】最も近い敵を自動で追いかける弾
    homingBullet: {
        id: 'homingBullet',
        name: '追尾弾',
        description: '最も近い敵を自動追尾して攻撃する',
        maxLevel: 5,
        type: 'homing',
        color: 0xff8800, // オレンジ色
        stats: [
            // turnRate: 旋回速度（ラジアン/秒）。大きいほど急旋回できる
            { damage: 20, fireRate: 1500, speed: 280, count: 1, turnRate: 3   },
            { damage: 28, fireRate: 1400, speed: 300, count: 1, turnRate: 3.5 },
            { damage: 36, fireRate: 1300, speed: 320, count: 2, turnRate: 4   },
            { damage: 45, fireRate: 1200, speed: 340, count: 2, turnRate: 4.5 },
            { damage: 56, fireRate: 1100, speed: 360, count: 3, turnRate: 5   },
        ]
    },

    // 【レーザー】一定時間連続ダメージを与えるビーム兵器
    laser: {
        id: 'laser',
        name: 'レーザー',
        description: '連続ダメージを与えるレーザービーム',
        maxLevel: 5,
        type: 'laser',
        color: 0xff0055, // 赤ピンク
        stats: [
            // duration: レーザー持続時間(ms) / cooldown: 次まで待機時間(ms)
            { damage: 5,  fireRate: 80, width: 4,  duration: 2000, cooldown: 3000 },
            { damage: 8,  fireRate: 80, width: 5,  duration: 2500, cooldown: 2800 },
            { damage: 12, fireRate: 80, width: 6,  duration: 3000, cooldown: 2600 },
            { damage: 18, fireRate: 80, width: 8,  duration: 3500, cooldown: 2200 },
            { damage: 25, fireRate: 80, width: 10, duration: 4000, cooldown: 1800 },
        ]
    },

    // 【爆発】プレイヤー周囲にランダムな爆発を発生させる範囲攻撃
    explosion: {
        id: 'explosion',
        name: '爆発',
        description: '周囲にランダム爆発で範囲ダメージ',
        maxLevel: 5,
        type: 'explosion',
        color: 0xff4400, // 橙赤色
        stats: [
            // radius: 爆発の半径(px) / count: 1回の発動で何箇所爆発するか
            { damage: 40,  fireRate: 3000, radius: 80,  count: 1 },
            { damage: 55,  fireRate: 2800, radius: 95,  count: 1 },
            { damage: 72,  fireRate: 2600, radius: 110, count: 2 },
            { damage: 92,  fireRate: 2400, radius: 120, count: 2 },
            { damage: 120, fireRate: 2200, radius: 135, count: 3 },
        ]
    },

    // ==================== 奥義（進化武器）2種類 ====================
    // requires に指定した2つの武器が両方Lv3以上になると進化可能

    // 【レールガン】直線弾 + レーザー の進化武器
    // 超高速で画面内の全ての敵を貫通する究極の射撃
    railgun: {
        id: 'railgun',
        name: '【奥義】レールガン',
        description: '全てを貫通する超高速のレール弾！',
        maxLevel: 1,
        type: 'railgun',
        color: 0x00ffff,
        isUltimate: true,
        requires: ['straightShot', 'laser'], // 直線弾Lv3 + レーザーLv3 で進化
        stats: [
            // pierce: 貫通回数（999 = 全貫通）
            { damage: 300, fireRate: 1500, speed: 1000, count: 1, pierce: 999 }
        ]
    },

    // 【ミサイルストーム】追尾弾 + 爆発 の進化武器
    // 爆発する追尾ミサイルを大量発射する最強の攻撃
    missileStorm: {
        id: 'missileStorm',
        name: '【奥義】ミサイルストーム',
        description: '爆発する追尾ミサイルを乱射する！',
        maxLevel: 1,
        type: 'missileStorm',
        color: 0xff4400,
        isUltimate: true,
        requires: ['homingBullet', 'explosion'], // 追尾弾Lv3 + 爆発Lv3 で進化
        stats: [
            // radius: 爆発半径 / turnRate: 旋回速度
            { damage: 100, fireRate: 500, speed: 350, count: 3, turnRate: 6, radius: 90 }
        ]
    }
};

// ============================================================
// パッシブ強化データ
// レベルアップ時の選択肢として表示される強化効果
// apply(player): プレイヤーオブジェクトに直接適用される関数
// ============================================================
const PASSIVE_DATA = [
    {
        id: 'maxHp',
        name: '最大HP +40',
        description: '最大HPが40増加する',
        icon: '❤️',
        apply: (player) => {
            player.maxHp += 40;
            // 回復も同時に行う
            player.hp = Math.min(player.hp + 40, player.maxHp);
        }
    },
    {
        id: 'speed',
        name: '移動速度 +15%',
        description: '移動速度が15%アップ',
        icon: '💨',
        apply: (player) => { player.speed = Math.round(player.speed * 1.15); }
    },
    {
        id: 'damage',
        name: '全武器ダメージ +15%',
        description: '全武器のダメージが15%増加',
        icon: '⚔️',
        apply: (player) => { player.damageMultiplier *= 1.15; }
    },
    {
        id: 'fireRate',
        name: '攻撃速度 +15%',
        description: '全武器の攻撃速度が15%アップ',
        icon: '⚡',
        apply: (player) => { player.fireRateMultiplier *= 1.15; }
    },
    {
        id: 'pickup',
        name: 'アイテム吸収範囲 +40%',
        description: 'XP・コインの吸収範囲が40%拡大',
        icon: '🧲',
        apply: (player) => { player.pickupRadius = Math.round(player.pickupRadius * 1.4); }
    },
    {
        id: 'armor',
        name: '防御 +8',
        description: '受けるダメージを8軽減',
        icon: '🛡️',
        apply: (player) => { player.armor += 8; }
    },
    {
        id: 'regen',
        name: 'HP回復 +2/秒',
        description: '毎秒2HPを自動回復する',
        icon: '💊',
        apply: (player) => { player.hpRegen += 2; }
    },
    {
        id: 'xpBonus',
        name: '経験値獲得 +25%',
        description: '取得する経験値が25%増加',
        icon: '✨',
        apply: (player) => { player.xpMultiplier *= 1.25; }
    },
    {
        id: 'coinBonus',
        name: 'コイン獲得 +30%',
        description: 'ドロップするコインが30%増加',
        icon: '💰',
        apply: (player) => { player.coinMultiplier *= 1.30; }
    },
    {
        id: 'healNow',
        name: 'HP即時回復',
        description: '現在のHPを最大値の30%回復',
        icon: '🩹',
        apply: (player) => {
            const heal = Math.round(player.maxHp * 0.3);
            player.hp = Math.min(player.hp + heal, player.maxHp);
        }
    },
];

// ============================================================
// 恒久強化データ（コインで購入する永続的な強化）
// MenuSceneのショップで購入でき、全ランに引き継がれる
// cost     : 購入に必要なコイン数
// maxLevel : 最大購入回数（これ以上は購入不可）
// effect   : 効果の種類（SaveManagerで参照するキー）
// value    : 1レベルあたりの効果値
// ============================================================
const PERMANENT_UPGRADES = [
    { id: 'perm_hp',     name: 'HP強化',     description: '開始時の最大HPが20増加',     cost: 50,  maxLevel: 10, effect: 'maxHp',     value: 20 },
    { id: 'perm_spd',    name: '速度強化',   description: '移動速度が5%上昇',           cost: 40,  maxLevel: 10, effect: 'speed',     value: 0.05 },
    { id: 'perm_dmg',    name: '攻撃強化',   description: '全武器ダメージが5%上昇',     cost: 60,  maxLevel: 10, effect: 'damage',    value: 0.05 },
    { id: 'perm_fr',     name: '連射強化',   description: '全武器攻撃速度が5%上昇',     cost: 60,  maxLevel: 10, effect: 'fireRate',  value: 0.05 },
    { id: 'perm_pickup', name: '磁力強化',   description: 'アイテム吸収範囲が10%拡大', cost: 30,  maxLevel: 5,  effect: 'pickup',    value: 0.10 },
    { id: 'perm_coin',   name: 'コイン強化', description: 'コイン獲得量が10%増加',     cost: 80,  maxLevel: 5,  effect: 'coinBonus', value: 0.10 },
];
