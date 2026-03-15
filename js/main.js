// ============================================================
// js/main.js
// Phaser3 ゲーム設定・初期化
// CYBER DIVE - ローグライクシューター
// ============================================================

'use strict';

// ゲームキャンバスのサイズ（スマホ縦長スタイル）
const GAME_WIDTH  = 420;
const GAME_HEIGHT = 720;

// ============================================================
// Phaser3 の設定オブジェクト
// type       : レンダラー（AUTO = WebGL優先、Canvas フォールバック）
// physics    : 物理エンジン（Arcade = シンプルな矩形・円形当たり判定）
// scene      : 使用するシーンの一覧（起動順に並べる）
// scale      : 画面スケーリング設定（ブラウザサイズに合わせて自動調整）
// ============================================================
const config = {
    type: Phaser.AUTO,

    width:  GAME_WIDTH,
    height: GAME_HEIGHT,

    parent: 'game-container', // index.html の <div id="game-container"> に描画

    backgroundColor: '#000011',

    // アーケード物理エンジンを有効化
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 }, // 重力なし（宇宙/空中ゲーム）
            debug: false        // デバッグ表示（当たり判定の可視化）true にすると確認できる
        }
    },

    // シーンの定義（配列の先頭から順に起動される）
    scene: [
        BootScene,      // 起動時のテクスチャ生成
        MenuScene,      // タイトル・ステージ選択
        GameScene,      // メインゲームプレイ
        UpgradeScene,   // レベルアップ強化選択（GameScene の上に重ねる）
        GameOverScene,  // ゲームオーバー・クリア結果
    ],

    // レスポンシブ対応：ブラウザウィンドウに合わせて拡縮する
    scale: {
        mode: Phaser.Scale.FIT,          // アスペクト比を保ちながらフィット
        autoCenter: Phaser.Scale.CENTER_BOTH, // 上下左右中央に配置
        width:  GAME_WIDTH,
        height: GAME_HEIGHT,
    },

    // レンダリング設定
    render: {
        antialias: true,  // スムーズな描画
        pixelArt: false   // ドット絵でないのでオフ
    }
};

// ゲームインスタンスを生成して起動
const game = new Phaser.Game(config);
