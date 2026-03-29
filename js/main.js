// ============================================================
// main.js - Phaser ゲーム初期化
// ============================================================
window.addEventListener('load', () => {

  const config = {
    type:   Phaser.AUTO,
    width:  GameConfig.WIDTH,
    height: GameConfig.HEIGHT,
    parent: 'game-container',
    backgroundColor: '#0d0d1a',

    physics: {
      default: 'arcade',
      arcade:  { gravity: { y: 0 }, debug: false },
    },

    scene: [
      BootScene,
      TitleScene,
      FieldScene,
      HUDScene,
      DialogScene,
      PauseMenuScene,
      WorldMapScene,
      GameOverScene,
      EndingScene,
    ],

    scale: {
      mode:       Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    render: {
      antialias:        false,
      pixelArt:         false,
      roundPixels:      true,
      powerPreference:  'high-performance',
    },
  };

  new Phaser.Game(config);
});
