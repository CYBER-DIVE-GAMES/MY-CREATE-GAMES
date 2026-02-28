// ============================================================
// main.js - Phaserゲーム初期化
// ============================================================

const GAME_WIDTH  = 800;
const GAME_HEIGHT = 500;

const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0a0a1a',
    render: {
        antialias: false,    // ピクセルアートのためオフ
        pixelArt: true,
    },
    scene: [
        BootScene,
        MenuScene,
        WorldMapScene,
        GameScene,
        ResultScene,
        UpgradeScene,
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
    },
};

const game = new Phaser.Game(config);
