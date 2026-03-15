// ============================================================
// js/managers/LevelSystem.js
// レベルシステムマネージャー
// 経験値の管理・レベルアップ処理・強化候補の生成を担当します
// ============================================================

'use strict';

class LevelSystem {
    // ============================================================
    // コンストラクタ
    // scene         : 属するPhaser.Scene
    // player        : プレイヤーオブジェクト
    // weaponManager : 武器管理マネージャー
    // ============================================================
    constructor(scene, player, weaponManager) {
        this.scene         = scene;
        this.player        = player;
        this.weaponManager = weaponManager;

        // --- レベル関連 ---
        this.level    = 1;   // 現在レベル
        this.xp       = 0;   // 現在の経験値
        this.xpToNext = 100; // 次レベルまでの必要経験値（レベルアップ後に増加）

        // レベルアップするたびに必要経験値が増加する係数
        this.xpGrowthFactor = 1.15; // 15%増加
    }

    // ============================================================
    // addXp(amount)
    // 経験値を追加する
    // プレイヤーの xpMultiplier を適用してから加算する
    // ============================================================
    addXp(amount) {
        // プレイヤーの経験値獲得倍率を適用
        const actualXp = Math.round(amount * this.player.xpMultiplier);
        this.xp += actualXp;

        // 必要経験値に達したらレベルアップ（複数回ループすることもある）
        while (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.levelUp();
        }
    }

    // ============================================================
    // levelUp()
    // レベルアップ処理
    // 次レベルの必要経験値を更新し、UpgradeSceneを表示する
    // ============================================================
    levelUp() {
        this.level++;

        // 必要経験値を増やす（レベルが上がるほど多くのXPが必要）
        this.xpToNext = Math.round(this.xpToNext * this.xpGrowthFactor);

        // 強化候補を3つ生成する
        const choices = this.generateChoices();

        // GameSceneを一時停止してUpgradeSceneを起動する
        this.scene.events.emit('levelUp', {
            level:   this.level,
            choices: choices
        });
    }

    // ============================================================
    // generateChoices()
    // レベルアップ時に提示する強化候補を3つ生成して返す
    // 候補の種類：新規武器・武器レベルアップ・パッシブ強化・進化（奥義）
    // ============================================================
    generateChoices() {
        const choices = [];
        const maxChoices = 3;

        // ========================================
        // 1. 奥義進化チェック（最優先で提示）
        // ========================================
        const evolvable = this.weaponManager.checkEvolution();
        for (const evoId of evolvable) {
            if (choices.length >= maxChoices) break;
            const data = WEAPON_DATA[evoId];
            choices.push({
                type: 'evolution',
                weaponId: evoId,
                name: data.name,
                description: data.description,
                icon: '⚡'
            });
        }

        // ========================================
        // 2. 候補プールを作成（武器・パッシブ両方）
        // ========================================
        const pool = [];

        // 既存武器のレベルアップ候補
        for (const weapon of this.weaponManager.weapons) {
            const data = WEAPON_DATA[weapon.id];
            if (!data) continue;
            if (data.isUltimate) continue; // 奥義は別扱い
            if (weapon.level < data.maxLevel) {
                pool.push({
                    type: 'weaponUpgrade',
                    weaponId: weapon.id,
                    name: `${data.name} Lv${weapon.level + 1}`,
                    description: data.description,
                    icon: '🔫',
                    currentLevel: weapon.level,
                    nextLevel: weapon.level + 1
                });
            }
        }

        // 新規武器の追加候補（まだ持っていない武器）
        for (const [id, data] of Object.entries(WEAPON_DATA)) {
            if (data.isUltimate) continue; // 奥義は別扱い
            if (this.weaponManager.hasWeapon(id)) continue; // 既に所持
            if (this.weaponManager.weapons.length >= this.weaponManager.maxWeapons) continue; // スロット満杯

            pool.push({
                type: 'newWeapon',
                weaponId: id,
                name: `${data.name} NEW`,
                description: data.description,
                icon: '✨'
            });
        }

        // パッシブ強化候補
        for (const passive of PASSIVE_DATA) {
            pool.push({
                type: 'passive',
                passiveId: passive.id,
                name: passive.name,
                description: passive.description,
                icon: passive.icon
            });
        }

        // ========================================
        // 3. プールからランダムに選んで残りを埋める
        // ========================================
        // シャッフル（Fisher-Yates アルゴリズム）
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        // まだ選ばれていないものを追加
        const existingIds = new Set(choices.map(c => c.weaponId || c.passiveId));
        for (const item of pool) {
            if (choices.length >= maxChoices) break;
            const itemId = item.weaponId || item.passiveId;
            if (!existingIds.has(itemId)) {
                existingIds.add(itemId);
                choices.push(item);
            }
        }

        // 選択肢が足りない場合はパッシブで埋める
        while (choices.length < maxChoices) {
            const passive = PASSIVE_DATA[Math.floor(Math.random() * PASSIVE_DATA.length)];
            choices.push({
                type: 'passive',
                passiveId: passive.id,
                name: passive.name,
                description: passive.description,
                icon: passive.icon
            });
        }

        return choices;
    }

    // ============================================================
    // applyChoice(choice)
    // プレイヤーが選択した強化を適用する
    // choice : generateChoices() が返したオブジェクトの1つ
    // ============================================================
    applyChoice(choice) {
        switch (choice.type) {
            case 'evolution':
            case 'newWeapon':
                // 武器を新規追加（奥義の場合は進化処理が走る）
                this.weaponManager.addWeapon(choice.weaponId);
                break;

            case 'weaponUpgrade':
                // 既存武器をレベルアップ
                this.weaponManager.addWeapon(choice.weaponId);
                break;

            case 'passive':
                // パッシブデータを検索して apply() を実行
                const passiveData = PASSIVE_DATA.find(p => p.id === choice.passiveId);
                if (passiveData) passiveData.apply(this.player);
                break;
        }
    }

    // ============================================================
    // getXpRatio()
    // 現在の経験値割合を返す（0.0〜1.0）
    // XPバーの表示計算に使う
    // ============================================================
    getXpRatio() {
        return this.xp / this.xpToNext;
    }
}
