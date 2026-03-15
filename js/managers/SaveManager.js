// ============================================================
// js/managers/SaveManager.js
// セーブ・ロード管理
// コインや恒久強化のデータをlocalStorageに保存・読み込みします
// ============================================================

'use strict';

// localStorage に保存するキー名
const SAVE_KEY = 'roguelike_shooter_save';

// セーブデータのデフォルト値
const DEFAULT_SAVE = {
    // 所持コイン（ゲーム終了後も持ち越される）
    totalCoins: 0,

    // 恒久強化の購入済みレベル
    // { upgrade_id: レベル数 } の形式
    permUpgrades: {},

    // クリア済みステージ
    clearedStages: [],

    // 統計情報
    stats: {
        totalKills: 0,
        totalDeaths: 0,
        totalCoinsEarned: 0,
        totalPlayTime: 0 // 秒
    }
};

class SaveManager {
    // ============================================================
    // save(data)
    // セーブデータをlocalStorageに保存する
    // ============================================================
    static save(data) {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('セーブに失敗しました:', e);
            return false;
        }
    }

    // ============================================================
    // load()
    // セーブデータをlocalStorageから読み込む
    // データがなければデフォルト値を返す
    // ============================================================
    static load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return SaveManager.getDefault();

            const loaded = JSON.parse(raw);
            // デフォルト値とマージ（新しいキーが追加されても対応できるように）
            return SaveManager._merge(loaded, SaveManager.getDefault());
        } catch (e) {
            console.warn('ロードに失敗しました:', e);
            return SaveManager.getDefault();
        }
    }

    // ============================================================
    // getDefault()
    // デフォルトのセーブデータのコピーを返す
    // ============================================================
    static getDefault() {
        return JSON.parse(JSON.stringify(DEFAULT_SAVE));
    }

    // ============================================================
    // reset()
    // セーブデータを削除してデフォルトに戻す
    // ============================================================
    static reset() {
        localStorage.removeItem(SAVE_KEY);
        return SaveManager.getDefault();
    }

    // ============================================================
    // addCoins(saveData, amount)
    // コインを追加して保存する
    // ============================================================
    static addCoins(saveData, amount) {
        saveData.totalCoins += amount;
        saveData.stats.totalCoinsEarned += amount;
        SaveManager.save(saveData);
    }

    // ============================================================
    // spendCoins(saveData, amount)
    // コインを消費する（足りなければ false を返す）
    // ============================================================
    static spendCoins(saveData, amount) {
        if (saveData.totalCoins < amount) return false;
        saveData.totalCoins -= amount;
        SaveManager.save(saveData);
        return true;
    }

    // ============================================================
    // buyPermUpgrade(saveData, upgradeId)
    // 恒久強化を購入する
    // 戻り値: { success: boolean, reason: string }
    // ============================================================
    static buyPermUpgrade(saveData, upgradeId) {
        const upgradeData = PERMANENT_UPGRADES.find(u => u.id === upgradeId);
        if (!upgradeData) return { success: false, reason: '不明なアップグレード' };

        const currentLevel = saveData.permUpgrades[upgradeId] || 0;

        if (currentLevel >= upgradeData.maxLevel) {
            return { success: false, reason: '最大レベルに達しています' };
        }

        const cost = upgradeData.cost * (currentLevel + 1); // レベルが高いほど高い

        if (saveData.totalCoins < cost) {
            return { success: false, reason: `コインが不足しています（必要: ${cost}）` };
        }

        // 購入処理
        saveData.totalCoins -= cost;
        saveData.permUpgrades[upgradeId] = currentLevel + 1;
        SaveManager.save(saveData);

        return { success: true };
    }

    // ============================================================
    // getPermBonus(saveData)
    // 恒久強化から得られるボーナスを計算して返す
    // プレイヤー生成時に使用する
    // ============================================================
    static getPermBonus(saveData) {
        const bonus = {
            maxHp:     0,
            speed:     0,
            damage:    0,
            fireRate:  0,
            pickup:    0,
            coinBonus: 0
        };

        for (const upgrade of PERMANENT_UPGRADES) {
            const level = saveData.permUpgrades[upgrade.id] || 0;
            if (level <= 0) continue;

            const totalValue = upgrade.value * level;

            switch (upgrade.effect) {
                case 'maxHp':     bonus.maxHp     += totalValue; break;
                case 'speed':     bonus.speed     += totalValue; break;
                case 'damage':    bonus.damage    += totalValue; break;
                case 'fireRate':  bonus.fireRate  += totalValue; break;
                case 'pickup':    bonus.pickup    += totalValue; break;
                case 'coinBonus': bonus.coinBonus += totalValue; break;
            }
        }

        return bonus;
    }

    // ============================================================
    // getUpgradeCost(upgradeId, saveData)
    // 指定アップグレードの現在の購入コストを返す
    // ============================================================
    static getUpgradeCost(upgradeId, saveData) {
        const upgradeData = PERMANENT_UPGRADES.find(u => u.id === upgradeId);
        if (!upgradeData) return Infinity;
        const currentLevel = saveData.permUpgrades[upgradeId] || 0;
        return upgradeData.cost * (currentLevel + 1);
    }

    // ============================================================
    // _merge(loaded, defaults)
    // ロードしたデータとデフォルト値を再帰的にマージする
    // ============================================================
    static _merge(loaded, defaults) {
        const result = { ...defaults };
        for (const key in loaded) {
            if (
                typeof defaults[key] === 'object' &&
                !Array.isArray(defaults[key]) &&
                defaults[key] !== null &&
                typeof loaded[key] === 'object'
            ) {
                result[key] = SaveManager._merge(loaded[key], defaults[key]);
            } else {
                result[key] = loaded[key];
            }
        }
        return result;
    }
}
