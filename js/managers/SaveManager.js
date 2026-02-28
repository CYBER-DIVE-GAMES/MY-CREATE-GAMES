// ============================================================
// SaveManager.js - セーブ・ロード管理
// ============================================================

const SAVE_KEY = 'castle_defender_save';

const DEFAULT_SAVE = {
    playerLevel: 1,
    playerExp: 0,
    gold: 200,
    clearedStages: [],
    stageStars: {},      // { stageId: 1~3 }
    unlockedStages: [0], // 最初からステージ0が解放
    upgrades: {
        soldier:  { hp: 0, attack: 0, speed: 0 },
        archer:   { hp: 0, attack: 0, speed: 0 },
        knight:   { hp: 0, attack: 0, speed: 0 },
        mage:     { hp: 0, attack: 0, speed: 0 },
        catapult: { hp: 0, attack: 0, speed: 0 },
        dragon:   { hp: 0, attack: 0, speed: 0 },
        castle:   { hp: 0, defense: 0, manaRegen: 0 },
    },
    skills: {
        fireBolt:   { unlocked: false, power: 0, cooldown: 0 },
        shieldWall: { unlocked: false, duration: 0, cooldown: 0 },
        arrowRain:  { unlocked: false, power: 0, cooldown: 0 },
    },
    settings: {
        bgmVolume: 0.7,
        sfxVolume: 1.0,
    },
    totalPlayTime: 0,
    lastSaved: null,
};

const EXP_TABLE = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3250, 4000, 5000];

class SaveManager {
    static save(data) {
        try {
            data.lastSaved = new Date().toISOString();
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('セーブ失敗:', e);
            return false;
        }
    }

    static load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SAVE));
            const loaded = JSON.parse(raw);
            // デフォルト値でマージ（新項目追加対策）
            return SaveManager.mergeWithDefaults(loaded, DEFAULT_SAVE);
        } catch (e) {
            console.warn('ロード失敗:', e);
            return JSON.parse(JSON.stringify(DEFAULT_SAVE));
        }
    }

    static mergeWithDefaults(loaded, defaults) {
        const result = { ...defaults };
        for (const key in loaded) {
            if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
                result[key] = SaveManager.mergeWithDefaults(loaded[key] || {}, defaults[key]);
            } else {
                result[key] = loaded[key];
            }
        }
        return result;
    }

    static reset() {
        localStorage.removeItem(SAVE_KEY);
        return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    }

    static hasSave() {
        return localStorage.getItem(SAVE_KEY) !== null;
    }

    // EXPを追加してレベルアップを処理
    static addExp(saveData, exp) {
        saveData.playerExp += exp;
        let leveled = false;
        while (
            saveData.playerLevel < EXP_TABLE.length - 1 &&
            saveData.playerExp >= EXP_TABLE[saveData.playerLevel]
        ) {
            saveData.playerExp -= EXP_TABLE[saveData.playerLevel];
            saveData.playerLevel++;
            leveled = true;
        }
        return leveled;
    }

    // 現レベルの必要EXPを返す
    static getExpRequired(level) {
        if (level >= EXP_TABLE.length - 1) return EXP_TABLE[EXP_TABLE.length - 1];
        return EXP_TABLE[level];
    }

    // ステージクリア後の処理
    static onStageClear(saveData, stageId, stars) {
        if (!saveData.clearedStages.includes(stageId)) {
            saveData.clearedStages.push(stageId);
        }
        // ★はより高い値で上書き
        if (!saveData.stageStars[stageId] || saveData.stageStars[stageId] < stars) {
            saveData.stageStars[stageId] = stars;
        }
        // 次のステージを解放
        const nextId = stageId + 1;
        if (nextId < STAGE_DATA.length && !saveData.unlockedStages.includes(nextId)) {
            saveData.unlockedStages.push(nextId);
        }
    }

    // アップグレードのコスト計算
    static getUpgradeCost(category, stat, currentLevel) {
        let base;
        if (category === 'castle') {
            base = UPGRADE_DATA.castle[stat].costBase;
        } else {
            base = UPGRADE_DATA[category][stat].costBase;
        }
        return base * (currentLevel + 1);
    }

    // アップグレードを実行
    static applyUpgrade(saveData, category, stat) {
        const currentLevel = saveData.upgrades[category][stat];
        let maxLevel = 5;
        const cost = SaveManager.getUpgradeCost(category, stat, currentLevel);

        if (currentLevel >= maxLevel) return { success: false, reason: '最大レベル' };
        if (saveData.gold < cost) return { success: false, reason: 'ゴールド不足' };

        saveData.gold -= cost;
        saveData.upgrades[category][stat]++;
        return { success: true };
    }

    // スキル解放
    static unlockSkill(saveData, skillName) {
        const skillData = UPGRADE_DATA.skills[skillName];
        if (!skillData) return { success: false };
        const cost = skillData.unlock.cost;
        if (saveData.gold < cost) return { success: false, reason: 'ゴールド不足' };
        if (saveData.skills[skillName].unlocked) return { success: false, reason: '解放済み' };

        saveData.gold -= cost;
        saveData.skills[skillName].unlocked = true;
        return { success: true };
    }

    // スキルアップグレード
    static upgradeSkill(saveData, skillName, stat) {
        const skillUpg = UPGRADE_DATA.skills[skillName][stat];
        if (!skillUpg) return { success: false };
        const currentLevel = saveData.skills[skillName][stat];
        if (currentLevel >= skillUpg.maxLevel) return { success: false, reason: '最大レベル' };
        const cost = skillUpg.costBase * (currentLevel + 1);
        if (saveData.gold < cost) return { success: false, reason: 'ゴールド不足' };

        saveData.gold -= cost;
        saveData.skills[skillName][stat]++;
        return { success: true };
    }

    // 城のステータスを計算（アップグレード込み）
    static getCastleStats(saveData) {
        const upgCastle = saveData.upgrades.castle;
        return {
            maxHp: Math.floor(1000 * (1 + upgCastle.hp * 0.20)),
            defense: Math.floor(upgCastle.defense * 5),  // 防御値 (ダメージ軽減%)
            manaRegen: 5 * (1 + upgCastle.manaRegen * 0.20),
        };
    }

    // スキルのステータスを計算
    static getSkillStats(saveData, skillName) {
        const skill = saveData.skills[skillName];
        if (!skill.unlocked) return null;

        const base = {
            fireBolt:   { damage: 80, cooldown: 15000, radius: 80 },
            shieldWall: { duration: 5000, cooldown: 20000 },
            arrowRain:  { damage: 40, cooldown: 18000 },
        }[skillName];

        if (!base) return null;

        if (skillName === 'fireBolt') {
            return {
                damage: Math.floor(base.damage * (1 + skill.power * 0.30)),
                cooldown: Math.floor(base.cooldown * (1 - skill.cooldown * 0.20)),
                radius: base.radius,
            };
        } else if (skillName === 'shieldWall') {
            return {
                duration: Math.floor(base.duration * (1 + skill.duration * 0.30)),
                cooldown: Math.floor(base.cooldown * (1 - skill.cooldown * 0.20)),
            };
        } else if (skillName === 'arrowRain') {
            return {
                damage: Math.floor(base.damage * (1 + skill.power * 0.30)),
                cooldown: Math.floor(base.cooldown * (1 - skill.cooldown * 0.20)),
            };
        }

        return base;
    }
}
