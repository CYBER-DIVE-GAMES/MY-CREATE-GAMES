// ============================================================
// js/scenes/UpgradeScene.js
// レベルアップ強化選択シーン
// レベルアップ時にGameSceneの上に重ねて表示されます
// プレイヤーが1つを選択するとGameSceneに結果を返して終了します
// ============================================================

'use strict';

class UpgradeScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UpgradeScene' });
    }

    // ============================================================
    // init(data)
    // GameSceneから渡されたデータを受け取る
    // data.choices : 選択肢の配列（LevelSystem.generateChoices()の結果）
    // data.level   : 到達した新しいレベル
    // ============================================================
    init(data) {
        this.choices = data.choices || [];
        this.level   = data.level   || 1;
    }

    // ============================================================
    // create()
    // 強化選択UIを作成する
    // ============================================================
    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ============================================================
        // 半透明の暗転オーバーレイ（後ろのGameSceneがうっすら見える）
        // ============================================================
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.70);
        overlay.fillRect(0, 0, W, H);

        // ============================================================
        // タイトルテキスト
        // ============================================================
        this.add.text(W / 2, H * 0.10, `⬆ LEVEL UP! Lv.${this.level}`, {
            fontSize: '28px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffff00',
            stroke: '#884400',
            strokeThickness: 4
        }).setOrigin(0.5);

        this.add.text(W / 2, H * 0.18, '強化を1つ選んでください', {
            fontSize: '16px',
            fontFamily: 'Arial, sans-serif',
            color: '#cccccc'
        }).setOrigin(0.5);

        // ============================================================
        // 3つの選択カードを横に並べる
        // ============================================================
        const cardW     = Math.min(240, (W - 80) / 3);
        const cardH     = 200;
        const cardSpacing = 20;
        const totalW    = this.choices.length * cardW + (this.choices.length - 1) * cardSpacing;
        const startX    = W / 2 - totalW / 2;
        const cardY     = H * 0.25;

        this.choices.forEach((choice, i) => {
            const cx = startX + i * (cardW + cardSpacing);
            this.createChoiceCard(cx, cardY, cardW, cardH, choice, i);
        });

        // ============================================================
        // 操作ヒント
        // ============================================================
        this.add.text(W / 2, H * 0.90, 'カードをクリックして強化を選ぼう', {
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            color: '#888888'
        }).setOrigin(0.5);
    }

    // ============================================================
    // createChoiceCard(x, y, w, h, choice, index)
    // 選択肢カードを1枚生成する
    // ============================================================
    createChoiceCard(x, y, w, h, choice, index) {
        // カードの背景色を選択肢の種類によって変える
        const bgColors = {
            evolution:    0x111100, // 奥義（黄色系）
            newWeapon:    0x001122, // 新規武器（青系）
            weaponUpgrade:0x001133, // 武器レベルアップ（青系）
            passive:      0x110022, // パッシブ（紫系）
        };
        const borderColors = {
            evolution:    0xffcc00, // 奥義（金）
            newWeapon:    0x00aaff, // 新規武器（水色）
            weaponUpgrade:0x4488ff, // 武器レベルアップ（青）
            passive:      0xaa44ff, // パッシブ（紫）
        };

        const bgColor     = bgColors[choice.type]     || 0x111122;
        const borderColor = borderColors[choice.type] || 0x4466aa;

        // --- カード背景 ---
        const bg = this.add.graphics();
        const drawNormal = () => {
            bg.clear();
            bg.fillStyle(bgColor);
            bg.fillRoundedRect(x, y, w, h, 10);
            bg.lineStyle(2, borderColor, 0.8);
            bg.strokeRoundedRect(x, y, w, h, 10);
        };
        const drawHover = () => {
            bg.clear();
            bg.fillStyle(bgColor); // ホバー時（色は同じで枠線で強調）
            bg.fillRoundedRect(x, y, w, h, 10);
            bg.lineStyle(3, borderColor, 1.0);
            bg.strokeRoundedRect(x, y, w, h, 10);
            // ホバー時に輝くエフェクト（外側に光彩）
            bg.lineStyle(8, borderColor, 0.2);
            bg.strokeRoundedRect(x - 2, y - 2, w + 4, h + 4, 12);
        };
        drawNormal();

        // --- 種別バッジ（カード上部）---
        const badgeLabels = {
            evolution:     '⚡ 奥義進化',
            newWeapon:     '✨ 新規武器',
            weaponUpgrade: '🔫 武器強化',
            passive:       '💫 パッシブ強化',
        };
        const badgeColors = {
            evolution:     '#ffcc00',
            newWeapon:     '#00ccff',
            weaponUpgrade: '#88aaff',
            passive:       '#cc88ff',
        };

        this.add.text(x + w / 2, y + 18, badgeLabels[choice.type] || '強化', {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            color: badgeColors[choice.type] || '#aaaacc'
        }).setOrigin(0.5);

        // 区切り線
        const line = this.add.graphics();
        line.lineStyle(1, borderColor, 0.4);
        line.beginPath();
        line.moveTo(x + 10, y + 32);
        line.lineTo(x + w - 10, y + 32);
        line.strokePath();

        // --- アイコン ---
        this.add.text(x + w / 2, y + 62, choice.icon || '⬆', {
            fontSize: '32px',
        }).setOrigin(0.5);

        // --- 名前 ---
        this.add.text(x + w / 2, y + 108, choice.name, {
            fontSize: '14px',
            fontFamily: 'Arial Black, sans-serif',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2,
            wordWrap: { width: w - 16 },
            align: 'center'
        }).setOrigin(0.5);

        // --- 説明 ---
        this.add.text(x + w / 2, y + 148, choice.description, {
            fontSize: '12px',
            fontFamily: 'Arial, sans-serif',
            color: '#aaaacc',
            wordWrap: { width: w - 20 },
            align: 'center',
            lineSpacing: 3
        }).setOrigin(0.5, 0);

        // --- クリック範囲 ---
        const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0)
            .setInteractive({ useHandCursor: true });

        hit.on('pointerover',  drawHover);
        hit.on('pointerout',   drawNormal);
        hit.on('pointerdown',  () => this.selectChoice(choice));

        // ホバー時にカードを少し拡大
        hit.on('pointerover', () => {
            this.tweens.add({ targets: [bg, hit], scaleX: 1.03, scaleY: 1.03, duration: 100, ease: 'Power1' });
        });
        hit.on('pointerout', () => {
            this.tweens.add({ targets: [bg, hit], scaleX: 1, scaleY: 1, duration: 100 });
        });
    }

    // ============================================================
    // selectChoice(choice)
    // プレイヤーが強化を選択したときの処理
    // ============================================================
    selectChoice(choice) {
        // ============================================================
        // GameSceneに選択結果を通知する
        // GameSceneのイベントリスナー 'upgradeChosen' が受け取り、
        // 強化を適用してゲームを再開する
        // ============================================================
        const gameScene = this.scene.get('GameScene');
        if (gameScene) {
            gameScene.events.emit('upgradeChosen', choice);
            // 武器リストを更新
            gameScene.updateWeaponList();
        }

        // このシーンを終了する
        this.scene.stop('UpgradeScene');
    }
}
