// ============================================================
// js/scenes/BootScene.js
// ブートシーン（ゲーム起動時の初期化）
// 外部画像ファイルを使わず、コードで全テクスチャを生成します
// ============================================================

'use strict';

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    // preload() は外部ファイル読み込み用。今回は全てコード生成するので空にする
    preload() {}

    // ============================================================
    // create()
    // 全ゲームオブジェクトのテクスチャをプログラムで生成する
    // ============================================================
    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        // ローディング表示
        const loadBg = this.add.graphics();
        loadBg.fillStyle(0x000011);
        loadBg.fillRect(0, 0, W, H);

        const loadText = this.add.text(W / 2, H / 2, 'CYBER DIVE\n読み込み中...', {
            fontSize: '28px',
            fontFamily: 'Arial, sans-serif',
            color: '#00ffff',
            align: 'center',
            stroke: '#004444',
            strokeThickness: 3
        }).setOrigin(0.5);

        // ============================================================
        // テクスチャ生成
        // makeGraphics() で描画して generateTexture() でテクスチャ化する
        // ============================================================

        // --- プレイヤー（戦闘機シルエット）---
        this._makeTexture('player', 40, 48, (g) => {
            // 機体本体
            g.fillStyle(0x4488ff);
            g.fillTriangle(20, 0, 0, 48, 40, 48); // 機体の三角形
            // コックピット
            g.fillStyle(0x88ccff);
            g.fillEllipse(20, 16, 12, 14);
            // エンジン部
            g.fillStyle(0x2255aa);
            g.fillRect(8, 36, 10, 12);
            g.fillRect(22, 36, 10, 12);
            // エンジン炎
            g.fillStyle(0xff8800);
            g.fillTriangle(10, 48, 16, 48, 13, 56);
            g.fillTriangle(24, 48, 30, 48, 27, 56);
        });

        // --- 通常敵: グラント（赤い菱形）---
        this._makeTexture('enemy_grunt', 24, 24, (g) => {
            g.fillStyle(0xff4444);
            g.fillTriangle(12, 0, 24, 12, 12, 24); // 右半分
            g.fillTriangle(12, 0, 0, 12, 12, 24);  // 左半分
            g.fillStyle(0xffaaaa);
            g.fillEllipse(12, 10, 8, 8); // コア
        });

        // --- 通常敵: スピーダー（細い矢印型）---
        this._makeTexture('enemy_speeder', 18, 18, (g) => {
            g.fillStyle(0xff8800);
            g.fillTriangle(9, 0, 18, 18, 0, 18);
            g.fillStyle(0xffcc44);
            g.fillCircle(9, 8, 4);
        });

        // --- 通常敵: タンク（大きい四角）---
        this._makeTexture('enemy_tank', 34, 34, (g) => {
            g.fillStyle(0xaa0000);
            g.fillRect(3, 3, 28, 28);
            g.fillStyle(0xcc2222);
            g.fillRect(7, 7, 20, 20);
            g.fillStyle(0xff4444);
            g.fillRect(12, 12, 10, 10);
            // 四隅の装甲
            g.fillStyle(0x880000);
            g.fillRect(0, 0, 8, 8);
            g.fillRect(26, 0, 8, 8);
            g.fillRect(0, 26, 8, 8);
            g.fillRect(26, 26, 8, 8);
        });

        // --- 通常敵: スナイパー（細長い紫）---
        this._makeTexture('enemy_sniper', 20, 20, (g) => {
            g.fillStyle(0xaa44ff);
            g.fillRect(7, 0, 6, 20); // 細い胴体
            g.fillRect(2, 5, 16, 8); // 横の武器
            g.fillStyle(0xcc88ff);
            g.fillCircle(10, 5, 5); // 頭部
        });

        // --- ミニボス ---
        this._makeTexture('enemy_miniBoss', 56, 56, (g) => {
            g.fillStyle(0x880000);
            g.fillRect(4, 4, 48, 48);
            g.fillStyle(0xaa1111);
            g.fillEllipse(28, 28, 38, 38);
            g.fillStyle(0xff2222);
            g.fillEllipse(28, 18, 20, 16);
            // 角
            g.fillStyle(0xcc0000);
            g.fillTriangle(16, 4, 12, 0, 20, 0);
            g.fillTriangle(40, 4, 36, 0, 44, 0);
        });

        // --- 中ボス ---
        this._makeTexture('enemy_midBoss', 76, 76, (g) => {
            g.fillStyle(0x550033);
            g.fillRect(0, 0, 76, 76);
            g.fillStyle(0x770055);
            g.fillEllipse(38, 38, 66, 66);
            g.fillStyle(0xaa0077);
            g.fillEllipse(38, 28, 40, 30);
            // 目
            g.fillStyle(0xff0000);
            g.fillCircle(26, 30, 6);
            g.fillCircle(50, 30, 6);
            // 王冠
            g.fillStyle(0xffdd00);
            g.fillTriangle(22, 12, 26, 0, 30, 12);
            g.fillTriangle(34, 12, 38, 0, 42, 12);
            g.fillTriangle(46, 12, 50, 0, 54, 12);
        });

        // --- 最終ボス ---
        this._makeTexture('enemy_finalBoss', 96, 96, (g) => {
            g.fillStyle(0x220011);
            g.fillRect(0, 0, 96, 96);
            g.fillStyle(0x440022);
            g.fillEllipse(48, 48, 88, 88);
            g.fillStyle(0x660033);
            g.fillEllipse(48, 36, 60, 44);
            // 目
            g.fillStyle(0xff0000);
            g.fillCircle(32, 36, 8);
            g.fillCircle(64, 36, 8);
            g.fillStyle(0xffffff);
            g.fillCircle(34, 34, 4);
            g.fillCircle(66, 34, 4);
            // 翼
            g.fillStyle(0x330011);
            g.fillTriangle(0, 48, 20, 20, 20, 70);
            g.fillTriangle(96, 48, 76, 20, 76, 70);
            // 王冠（大きめ）
            g.fillStyle(0xffdd00);
            g.fillTriangle(28, 16, 32, 0, 36, 16);
            g.fillTriangle(44, 16, 48, 0, 52, 16);
            g.fillTriangle(60, 16, 64, 0, 68, 16);
        });

        // --- 直線弾 ---
        this._makeTexture('bullet_bullet', 6, 12, (g) => {
            g.fillStyle(0x00ffff, 0.9);
            g.fillRect(1, 0, 4, 12);
            g.fillStyle(0xffffff, 0.7);
            g.fillRect(2, 0, 2, 5);
        });

        // --- レールガン弾（長くて細い）---
        this._makeTexture('bullet_railgun', 5, 18, (g) => {
            g.fillStyle(0x00ffff);
            g.fillRect(0, 0, 5, 18);
            g.fillStyle(0xffffff);
            g.fillRect(1, 0, 3, 8);
        });

        // --- 拡散弾 ---
        this._makeTexture('bullet_spread', 6, 10, (g) => {
            g.fillStyle(0xffff00, 0.9);
            g.fillRect(1, 0, 4, 10);
            g.fillStyle(0xffffff, 0.6);
            g.fillRect(2, 0, 2, 4);
        });

        // --- 追尾弾 ---
        this._makeTexture('bullet_homing', 8, 8, (g) => {
            g.fillStyle(0xff8800);
            g.fillCircle(4, 4, 4);
            g.fillStyle(0xffcc44);
            g.fillCircle(4, 3, 2);
        });

        // --- ミサイルストーム弾 ---
        this._makeTexture('bullet_missileStorm', 8, 14, (g) => {
            g.fillStyle(0xff4400);
            g.fillTriangle(4, 0, 8, 14, 0, 14);
            g.fillStyle(0xff8800);
            g.fillRect(2, 8, 4, 6);
            g.fillStyle(0xffff00, 0.8);
            g.fillTriangle(4, 14, 2, 20, 6, 20);
        });

        // --- 敵の弾 ---
        this._makeTexture('bullet_enemy', 8, 8, (g) => {
            g.fillStyle(0xaa44ff);
            g.fillCircle(4, 4, 4);
            g.fillStyle(0xdd88ff);
            g.fillCircle(4, 3, 2);
        });

        // --- 経験値オーブ ---
        this._makeTexture('xp_orb', 10, 10, (g) => {
            g.fillStyle(0x00ff88, 0.8);
            g.fillCircle(5, 5, 5);
            g.fillStyle(0xaaffcc, 0.9);
            g.fillCircle(5, 4, 3);
            g.fillStyle(0xffffff, 0.8);
            g.fillCircle(4, 3, 1);
        });

        // --- コイン ---
        this._makeTexture('coin', 12, 12, (g) => {
            g.fillStyle(0xffcc00, 0.9);
            g.fillCircle(6, 6, 6);
            g.fillStyle(0xffee44);
            g.fillCircle(6, 5, 4);
            g.fillStyle(0xffe800);
            g.fillRect(5, 3, 2, 6); // 中央の縦線（コインの縁取り）
        });

        // --- パーティクル（汎用）---
        this._makeTexture('particle', 4, 4, (g) => {
            g.fillStyle(0xffffff);
            g.fillCircle(2, 2, 2);
        });

        // ============================================================
        // 少し待ってからメニューシーンへ移動
        // ============================================================
        this.time.delayedCall(300, () => {
            this.scene.start('MenuScene');
        });
    }

    // ============================================================
    // _makeTexture(key, w, h, drawFn)
    // テクスチャ生成のヘルパーメソッド
    // key   : テクスチャの識別キー
    // w, h  : テクスチャのサイズ（px）
    // drawFn: Graphics オブジェクトを受け取り描画する関数
    // ============================================================
    _makeTexture(key, w, h, drawFn) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        drawFn(g);
        g.generateTexture(key, w, h);
        g.destroy();
    }
}
