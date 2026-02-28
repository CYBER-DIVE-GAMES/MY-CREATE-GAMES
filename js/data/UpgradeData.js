// ============================================================
// UpgradeData.js - アップグレード定義
// ============================================================

// 各ユニットのアップグレード（HP/攻撃/速度 それぞれ最大5段階）
// コスト: 段階 * 基本コスト

const UPGRADE_DATA = {
    // ==================== ユニットアップグレード ====================
    soldier: {
        hp:     { costBase: 80,  maxLevel: 5, effectPer: 0.15, label: 'HP強化',   icon: '❤️' },
        attack: { costBase: 90,  maxLevel: 5, effectPer: 0.15, label: '攻撃強化', icon: '⚔️' },
        speed:  { costBase: 70,  maxLevel: 5, effectPer: 0.10, label: '速度強化', icon: '👟' },
    },
    archer: {
        hp:     { costBase: 70,  maxLevel: 5, effectPer: 0.15, label: 'HP強化',   icon: '❤️' },
        attack: { costBase: 100, maxLevel: 5, effectPer: 0.15, label: '攻撃強化', icon: '⚔️' },
        speed:  { costBase: 80,  maxLevel: 5, effectPer: 0.10, label: '速度強化', icon: '👟' },
    },
    knight: {
        hp:     { costBase: 120, maxLevel: 5, effectPer: 0.15, label: 'HP強化',   icon: '❤️' },
        attack: { costBase: 110, maxLevel: 5, effectPer: 0.15, label: '攻撃強化', icon: '⚔️' },
        speed:  { costBase: 90,  maxLevel: 5, effectPer: 0.10, label: '速度強化', icon: '👟' },
    },
    mage: {
        hp:     { costBase: 80,  maxLevel: 5, effectPer: 0.15, label: 'HP強化',   icon: '❤️' },
        attack: { costBase: 130, maxLevel: 5, effectPer: 0.15, label: '攻撃強化', icon: '⚔️' },
        speed:  { costBase: 90,  maxLevel: 5, effectPer: 0.10, label: '速度強化', icon: '👟' },
    },
    catapult: {
        hp:     { costBase: 100, maxLevel: 5, effectPer: 0.15, label: 'HP強化',   icon: '❤️' },
        attack: { costBase: 150, maxLevel: 5, effectPer: 0.15, label: '攻撃強化', icon: '⚔️' },
        speed:  { costBase: 80,  maxLevel: 5, effectPer: 0.10, label: '速度強化', icon: '👟' },
    },
    dragon: {
        hp:     { costBase: 200, maxLevel: 5, effectPer: 0.15, label: 'HP強化',   icon: '❤️' },
        attack: { costBase: 220, maxLevel: 5, effectPer: 0.15, label: '攻撃強化', icon: '⚔️' },
        speed:  { costBase: 150, maxLevel: 5, effectPer: 0.10, label: '速度強化', icon: '👟' },
    },

    // ==================== 城アップグレード ====================
    castle: {
        hp:        { costBase: 200, maxLevel: 5, effectPer: 0.20, label: '城壁強化',     icon: '🏰', desc: '城の最大HPを増加' },
        defense:   { costBase: 180, maxLevel: 5, effectPer: 0.15, label: '防衛強化',     icon: '🛡️', desc: '城への全ダメージを軽減' },
        manaRegen: { costBase: 160, maxLevel: 5, effectPer: 0.20, label: 'マナ回復強化', icon: '💧', desc: 'マナ回復速度を増加' },
    },

    // ==================== スキルアップグレード ====================
    skills: {
        fireBolt: {
            unlock:   { cost: 300, label: '火炎弾解放',     icon: '🔥', desc: '敵に範囲ダメージ (CD: 15秒)' },
            power:    { costBase: 200, maxLevel: 3, label: '火炎弾強化', icon: '🔥', effectPer: 0.30 },
            cooldown: { costBase: 150, maxLevel: 3, label: 'CD短縮',     icon: '⏱️', effectPer: -0.20 },
        },
        shieldWall: {
            unlock:   { cost: 400, label: '鉄壁解放',       icon: '🛡️', desc: '城の防御を5秒間2倍 (CD: 20秒)' },
            duration: { costBase: 180, maxLevel: 3, label: '効果時間延長', icon: '⏳', effectPer: 0.30 },
            cooldown: { costBase: 150, maxLevel: 3, label: 'CD短縮',     icon: '⏱️', effectPer: -0.20 },
        },
        arrowRain: {
            unlock:   { cost: 350, label: '矢雨解放',       icon: '🏹', desc: '全敵にダメージ (CD: 18秒)' },
            power:    { costBase: 200, maxLevel: 3, label: '矢雨強化',   icon: '🏹', effectPer: 0.30 },
            cooldown: { costBase: 150, maxLevel: 3, label: 'CD短縮',     icon: '⏱️', effectPer: -0.20 },
        },
    }
};

// アップグレードコストを計算する関数
function getUpgradeCost(upgData, currentLevel) {
    return upgData.costBase * (currentLevel + 1);
}

// アップグレード効果量を計算する関数
function getUpgradeEffect(upgData, level) {
    return upgData.effectPer * level;
}
