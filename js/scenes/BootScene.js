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

    preload() {}

    // ============================================================
    // create()
    // 全ゲームオブジェクトのテクスチャをプログラムで生成する
    // ============================================================
    create() {
        const W = this.scale.width;
        const H = this.scale.height;

        const loadBg = this.add.graphics();
        loadBg.fillStyle(0x000011);
        loadBg.fillRect(0, 0, W, H);

        this.add.text(W / 2, H / 2, 'CYBER DIVE\n読み込み中...', {
            fontSize: '28px',
            fontFamily: 'Arial, sans-serif',
            color: '#00ffff',
            align: 'center',
            stroke: '#004444',
            strokeThickness: 3
        }).setOrigin(0.5);

        // ============================================================
        // プレイヤー: リアルな戦闘機（トップダウン視点）
        // デルタ翼＋コックピット＋双発エンジン
        // ============================================================
        this._makeTexture('player', 44, 60, (g) => {
            // 機体本体（細長い胴体）
            g.fillStyle(0x3366cc);
            g.fillTriangle(22, 0, 30, 40, 14, 40); // 機首から胴体

            // 主翼（スウェプトデルタ翼）
            g.fillStyle(0x2255aa);
            g.fillTriangle(22, 20, 0, 50, 18, 42);   // 左翼
            g.fillTriangle(22, 20, 44, 50, 26, 42);   // 右翼

            // 胴体後部
            g.fillStyle(0x2244aa);
            g.fillRect(16, 38, 12, 14);

            // エンジンナセル（左右）
            g.fillStyle(0x1133aa);
            g.fillRect(10, 36, 8, 16);  // 左エンジン
            g.fillRect(26, 36, 8, 16);  // 右エンジン

            // エンジン排気炎（左）
            g.fillStyle(0xff6600);
            g.fillTriangle(12, 52, 16, 52, 14, 62);
            g.fillStyle(0xffcc00, 0.7);
            g.fillTriangle(13, 52, 15, 52, 14, 58);

            // エンジン排気炎（右）
            g.fillStyle(0xff6600);
            g.fillTriangle(28, 52, 32, 52, 30, 62);
            g.fillStyle(0xffcc00, 0.7);
            g.fillTriangle(29, 52, 31, 52, 30, 58);

            // コックピットキャノピー
            g.fillStyle(0x88ddff, 0.9);
            g.fillEllipse(22, 16, 10, 14);
            g.fillStyle(0xccf0ff, 0.6);
            g.fillEllipse(21, 13, 5, 7);

            // 機首先端ライン（エアインテーク）
            g.fillStyle(0x7799cc);
            g.fillRect(18, 0, 8, 4);

            // 垂直尾翼（小さいフィン）
            g.fillStyle(0x4477bb);
            g.fillTriangle(22, 30, 22, 42, 17, 40); // 左尾翼
            g.fillTriangle(22, 30, 22, 42, 27, 40); // 右尾翼
        });

        // ============================================================
        // 敵: スライム型宇宙人（grunt）
        // ぷるぷるした半透明の丸い体＋大きな目
        // ============================================================
        this._makeTexture('enemy_slime', 30, 28, (g) => {
            // 体（丸いスライム）
            g.fillStyle(0xff3333);
            g.fillEllipse(15, 17, 28, 22);

            // 体の光沢
            g.fillStyle(0xff7777, 0.7);
            g.fillEllipse(15, 15, 20, 14);

            // 頭のふくらみ
            g.fillStyle(0xff4444);
            g.fillEllipse(15, 9, 22, 16);

            // 白目（左）
            g.fillStyle(0xffffff);
            g.fillEllipse(9, 12, 9, 10);
            // 白目（右）
            g.fillEllipse(21, 12, 9, 10);

            // 瞳（左）
            g.fillStyle(0x000000);
            g.fillCircle(10, 13, 3);
            // 瞳（右）
            g.fillCircle(20, 13, 3);

            // ハイライト（左目）
            g.fillStyle(0xffffff);
            g.fillCircle(11, 12, 1);
            // ハイライト（右目）
            g.fillCircle(21, 12, 1);

            // スライムのしずく（触手）
            g.fillStyle(0xff3333);
            g.fillEllipse(8, 26, 5, 7);
            g.fillEllipse(15, 28, 5, 7);
            g.fillEllipse(22, 26, 5, 7);
        });

        // ============================================================
        // 敵: クラゲ型宇宙人（speeder）
        // 半透明のドーム頭＋揺れる触手
        // ============================================================
        this._makeTexture('enemy_jellyfish', 26, 26, (g) => {
            // 触手（下）
            g.fillStyle(0xff8800, 0.7);
            g.fillRect(4,  17, 3, 8);
            g.fillRect(9,  19, 3, 7);
            g.fillRect(14, 17, 3, 9);
            g.fillRect(19, 19, 3, 6);

            // ドーム本体
            g.fillStyle(0xff8800);
            g.fillEllipse(13, 12, 24, 18);

            // ドームの光沢（内側）
            g.fillStyle(0xffcc44, 0.5);
            g.fillEllipse(13, 10, 16, 10);

            // 目（2つ）
            g.fillStyle(0xffffff);
            g.fillCircle(9, 11, 3);
            g.fillCircle(17, 11, 3);
            g.fillStyle(0x000033);
            g.fillCircle(9, 11, 2);
            g.fillCircle(17, 11, 2);
        });

        // ============================================================
        // 敵: タコ型宇宙人（tank）
        // 丸い頭部＋太い触手8本
        // ============================================================
        this._makeTexture('enemy_octopus', 40, 36, (g) => {
            // 触手（放射状に8本）
            g.fillStyle(0xbb1111);
            // 左側4本
            g.fillEllipse(4,  26, 7, 10);
            g.fillEllipse(10, 30, 7, 10);
            g.fillEllipse(16, 32, 7, 10);
            // 右側4本
            g.fillEllipse(36, 26, 7, 10);
            g.fillEllipse(30, 30, 7, 10);
            g.fillEllipse(24, 32, 7, 10);

            // 体（丸い頭）
            g.fillStyle(0xdd2222);
            g.fillEllipse(20, 16, 34, 28);

            // 体の光沢
            g.fillStyle(0xff5555, 0.5);
            g.fillEllipse(20, 12, 24, 16);

            // 大きな目（2つ）
            g.fillStyle(0xffffff);
            g.fillEllipse(12, 15, 11, 13);
            g.fillEllipse(28, 15, 11, 13);

            // 瞳（垂直に細い）
            g.fillStyle(0x000000);
            g.fillEllipse(12, 16, 5, 9);
            g.fillEllipse(28, 16, 5, 9);

            // ハイライト
            g.fillStyle(0xffffff);
            g.fillCircle(14, 13, 2);
            g.fillCircle(30, 13, 2);
        });

        // ============================================================
        // 敵: シューター型宇宙人（sniper）
        // 細長い体＋砲台を持つ宇宙人
        // ============================================================
        this._makeTexture('enemy_shooter', 24, 28, (g) => {
            // 体（細長い胴体）
            g.fillStyle(0x9933ff);
            g.fillEllipse(12, 18, 18, 22);

            // 光沢
            g.fillStyle(0xbb66ff, 0.5);
            g.fillEllipse(12, 15, 12, 14);

            // 頭部（丸い）
            g.fillStyle(0xaa44ff);
            g.fillCircle(12, 9, 9);

            // 目（1つ・大きなサイクロプス目）
            g.fillStyle(0xffffff);
            g.fillEllipse(12, 9, 12, 10);
            g.fillStyle(0xff0000);
            g.fillCircle(12, 9, 4);
            g.fillStyle(0x220000);
            g.fillCircle(12, 9, 2);
            g.fillStyle(0xffffff);
            g.fillCircle(13, 8, 1);

            // 砲身（左右に1本ずつ）
            g.fillStyle(0x772299);
            g.fillRect(0,  13, 6, 3);
            g.fillRect(18, 13, 6, 3);

            // 砲口の光
            g.fillStyle(0xcc44ff, 0.8);
            g.fillCircle(2,  14, 2);
            g.fillCircle(22, 14, 2);
        });

        // ============================================================
        // ボス: ミニUFO（miniBoss）
        // 小型の円盤＋ドーム窓＋底面ライト
        // ============================================================
        this._makeTexture('boss_ufo_mini', 64, 42, (g) => {
            // UFOの下部フランジ（外縁）
            g.fillStyle(0x888800);
            g.fillEllipse(32, 32, 60, 18);

            // UFO本体（扁平な円盤）
            g.fillStyle(0xbbbb00);
            g.fillEllipse(32, 26, 56, 22);

            // 金属的な光沢
            g.fillStyle(0xeeee44, 0.5);
            g.fillEllipse(32, 22, 40, 12);

            // ドーム（上部）
            g.fillStyle(0x006633);
            g.fillEllipse(32, 16, 30, 22);

            // ドームの窓（半透明グリーン）
            g.fillStyle(0x00ff88, 0.7);
            g.fillEllipse(32, 14, 22, 16);

            // エイリアンのシルエット（ドーム内）
            g.fillStyle(0x004422);
            g.fillEllipse(32, 13, 10, 8); // 頭
            g.fillEllipse(32, 19, 8, 6);  // 体

            // 底面の発光ライト（3つ）
            g.fillStyle(0x00ffff, 0.9);
            g.fillCircle(18, 33, 3);
            g.fillCircle(32, 35, 3);
            g.fillCircle(46, 33, 3);

            // UFOの縁取りライン
            g.lineStyle(1, 0xffff44, 0.6);
            g.strokeEllipse(32, 26, 56, 22);
        });

        // ============================================================
        // ボス: 中型UFO（midBoss）
        // より大きく複雑なデザイン＋複数の目
        // ============================================================
        this._makeTexture('boss_ufo_mid', 84, 56, (g) => {
            // 外縁リング
            g.fillStyle(0x550088);
            g.fillEllipse(42, 44, 78, 22);

            // 本体
            g.fillStyle(0x7700bb);
            g.fillEllipse(42, 36, 74, 28);

            // 上面光沢
            g.fillStyle(0xaa44ee, 0.5);
            g.fillEllipse(42, 30, 56, 18);

            // ドーム
            g.fillStyle(0x440066);
            g.fillEllipse(42, 22, 42, 30);

            // ドームウィンドウ
            g.fillStyle(0xcc44ff, 0.6);
            g.fillEllipse(42, 20, 32, 22);

            // エイリアンの顔（ドーム内）
            g.fillStyle(0x220033);
            g.fillEllipse(42, 18, 18, 14); // 頭
            // 目（3つ）
            g.fillStyle(0xff0000);
            g.fillCircle(34, 17, 3);
            g.fillCircle(42, 15, 3);
            g.fillCircle(50, 17, 3);

            // 底面発光
            g.fillStyle(0xff44ff, 0.9);
            g.fillCircle(24, 44, 4);
            g.fillCircle(36, 47, 4);
            g.fillCircle(48, 47, 4);
            g.fillCircle(60, 44, 4);

            // アンテナ（左右）
            g.fillStyle(0xaa22cc);
            g.fillRect(14, 22, 4, 12);
            g.fillRect(66, 22, 4, 12);
            g.fillStyle(0xff44ff);
            g.fillCircle(16, 20, 4);
            g.fillCircle(68, 20, 4);
        });

        // ============================================================
        // ボス: 最終UFO（finalBoss）
        // 巨大な戦艦型UFO＋複雑な構造物
        // ============================================================
        this._makeTexture('boss_ufo_final', 104, 70, (g) => {
            // 外縁（最外殻）
            g.fillStyle(0x110022);
            g.fillEllipse(52, 56, 100, 26);

            // 中間リング
            g.fillStyle(0x330044);
            g.fillEllipse(52, 48, 96, 32);

            // 本体ディスク
            g.fillStyle(0x550066);
            g.fillEllipse(52, 40, 90, 36);

            // 上部光沢
            g.fillStyle(0x9900cc, 0.5);
            g.fillEllipse(52, 32, 70, 24);

            // メインドーム
            g.fillStyle(0x220033);
            g.fillEllipse(52, 26, 56, 38);

            // ドームウィンドウ
            g.fillStyle(0xff00cc, 0.5);
            g.fillEllipse(52, 23, 44, 28);

            // ラスボスのエイリアン顔
            g.fillStyle(0x110022);
            g.fillEllipse(52, 21, 26, 20); // 頭
            // 4つの目
            g.fillStyle(0xff0000);
            g.fillCircle(39, 20, 4);
            g.fillCircle(48, 17, 4);
            g.fillCircle(57, 17, 4);
            g.fillCircle(65, 20, 4);
            // ハイライト
            g.fillStyle(0xff8888);
            g.fillCircle(40, 19, 2);
            g.fillCircle(49, 16, 2);
            g.fillCircle(58, 16, 2);
            g.fillCircle(66, 19, 2);

            // 翼状のアームキャノン（左右）
            g.fillStyle(0x330044);
            g.fillEllipse(14, 42, 24, 10);
            g.fillEllipse(90, 42, 24, 10);
            // 砲口
            g.fillStyle(0xff00ff);
            g.fillCircle(4,  42, 4);
            g.fillCircle(100, 42, 4);

            // 底面の発光リング
            g.fillStyle(0xff00ff, 0.8);
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                const rx = 52 + Math.cos(angle) * 32;
                const ry = 54 + Math.sin(angle) * 6;
                g.fillCircle(rx, ry, 4);
            }

            // アンテナ群（頭部）
            g.fillStyle(0xcc00ff);
            g.fillRect(42, 4,  3, 10);
            g.fillRect(52, 0,  3, 12);
            g.fillRect(62, 4,  3, 10);
            g.fillStyle(0xff00ff);
            g.fillCircle(43, 3,  3);
            g.fillCircle(53, 0,  3);
            g.fillCircle(63, 3,  3);
        });

        // ============================================================
        // 弾・アイテム類
        // ============================================================

        // 直線弾（細長い光弾）
        this._makeTexture('bullet_bullet', 6, 14, (g) => {
            g.fillStyle(0x00ffff);
            g.fillRect(2, 0, 2, 14);
            g.fillStyle(0x88ffff, 0.8);
            g.fillRect(2, 0, 2, 6);
            // 発光感
            g.fillStyle(0xffffff, 0.5);
            g.fillRect(2, 0, 1, 4);
        });

        // レールガン弾（太く長い）
        this._makeTexture('bullet_railgun', 6, 20, (g) => {
            g.fillStyle(0x00ffff);
            g.fillRect(0, 0, 6, 20);
            g.fillStyle(0xffffff);
            g.fillRect(1, 0, 4, 8);
            g.fillStyle(0x00ffff, 0.5);
            g.fillRect(0, 0, 6, 3);
        });

        // 拡散弾（丸い弾）
        this._makeTexture('bullet_spread', 8, 8, (g) => {
            g.fillStyle(0xffee00);
            g.fillCircle(4, 4, 4);
            g.fillStyle(0xffffff, 0.7);
            g.fillCircle(3, 3, 2);
        });

        // 追尾弾（炎のような円）
        this._makeTexture('bullet_homing', 10, 10, (g) => {
            g.fillStyle(0xff6600);
            g.fillCircle(5, 5, 5);
            g.fillStyle(0xffaa00);
            g.fillCircle(5, 4, 3);
            g.fillStyle(0xffff44, 0.8);
            g.fillCircle(5, 4, 1);
        });

        // ミサイルストーム弾（ロケット形）
        this._makeTexture('bullet_missileStorm', 8, 16, (g) => {
            // ミサイル先端
            g.fillStyle(0xffcc00);
            g.fillTriangle(4, 0, 8, 6, 0, 6);
            // 胴体
            g.fillStyle(0xff4400);
            g.fillRect(2, 5, 4, 8);
            // 噴射炎
            g.fillStyle(0xffffff, 0.9);
            g.fillTriangle(4, 13, 1, 18, 7, 18);
            g.fillStyle(0xff8800, 0.7);
            g.fillTriangle(4, 13, 2, 16, 6, 16);
        });

        // 敵の弾（暗い紫球）
        this._makeTexture('bullet_enemy', 10, 10, (g) => {
            g.fillStyle(0x8800cc);
            g.fillCircle(5, 5, 5);
            g.fillStyle(0xcc44ff, 0.7);
            g.fillCircle(4, 4, 3);
            g.fillStyle(0xffffff, 0.5);
            g.fillCircle(3, 3, 1);
        });

        // 経験値オーブ（キラキラした宝石）
        this._makeTexture('xp_orb', 12, 12, (g) => {
            g.fillStyle(0x00cc66);
            g.fillCircle(6, 6, 6);
            g.fillStyle(0x00ff88);
            g.fillEllipse(6, 5, 8, 7);
            g.fillStyle(0xaaffcc, 0.8);
            g.fillEllipse(5, 4, 4, 3);
            g.fillStyle(0xffffff, 0.9);
            g.fillCircle(4, 3, 1);
        });

        // コイン（金貨）
        this._makeTexture('coin', 14, 14, (g) => {
            g.fillStyle(0xdd9900);
            g.fillCircle(7, 7, 7);
            g.fillStyle(0xffcc00);
            g.fillCircle(7, 6, 5);
            g.fillStyle(0xffee44);
            g.fillCircle(7, 6, 3);
            // ¥マーク
            g.fillStyle(0xaa6600);
            g.fillRect(6, 4, 2, 6);
            g.fillRect(4, 5, 6, 1);
            g.fillRect(4, 7, 6, 1);
        });

        // パーティクル（汎用・白い点）
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
