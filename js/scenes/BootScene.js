// ============================================================
// BootScene - テクスチャをプログラムで生成してゲームを起動
// ============================================================
class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }

  create() {
    const C = GameConfig.COLORS;

    // ---- プレイヤー (32×48) ----
    this._gen('player', 32, 48, g => {
      // 足
      g.fillStyle(0x888888); g.fillRect(8, 36, 7, 12); g.fillRect(17, 36, 7, 12);
      // 体
      g.fillStyle(C.PLAYER); g.fillRect(8, 16, 16, 22);
      // ケープ
      g.fillStyle(0x444466); g.fillTriangle(6, 18, 6, 40, 16, 30);
      // 頭
      g.fillStyle(C.PLAYER); g.fillCircle(16, 10, 9);
      // 剣
      g.fillStyle(0xcccccc); g.fillRect(4, 8, 3, 28);
      g.fillStyle(0xaa8822); g.fillRect(3, 20, 5, 4);
      // 目
      g.fillStyle(0x333355); g.fillCircle(13, 10, 2); g.fillCircle(19, 10, 2);
    });

    // ---- プレイヤー攻撃 (32×48) ----
    this._gen('player_attack', 32, 48, g => {
      g.fillStyle(0x888888); g.fillRect(8, 36, 7, 12); g.fillRect(17, 36, 7, 12);
      g.fillStyle(C.PLAYER); g.fillRect(8, 16, 16, 22);
      g.fillStyle(0x444466); g.fillTriangle(6, 18, 6, 40, 16, 30);
      g.fillStyle(C.PLAYER); g.fillCircle(16, 10, 9);
      // 剣を斜めに
      g.fillStyle(0xdddddd); g.fillRect(20, 4, 3, 32);
      g.fillStyle(0xaa8822); g.fillRect(18, 18, 7, 4);
      g.fillStyle(0x333355); g.fillCircle(13, 10, 2); g.fillCircle(19, 10, 2);
    });

    // ---- 小さな影 (24×24) ----
    this._gen('shade_small', 24, 24, g => {
      g.fillStyle(C.SHADE); g.fillEllipse(12, 14, 20, 18);
      g.fillStyle(C.SHADE_LIGHT); g.fillEllipse(12, 12, 16, 14);
      // 触手
      g.fillStyle(C.SHADE); g.fillTriangle(3, 18, 6, 8, 9, 18);
      g.fillTriangle(15, 18, 18, 8, 21, 18);
      // 目
      g.fillStyle(C.SHADE_EYE); g.fillCircle(9, 11, 3); g.fillCircle(15, 11, 3);
      g.fillStyle(0xff8080); g.fillCircle(9, 11, 1); g.fillCircle(15, 11, 1);
    });

    // ---- 影の戦士 (40×52) ----
    this._gen('shade_warrior', 40, 52, g => {
      // 足
      g.fillStyle(C.SHADE); g.fillRect(9, 38, 9, 14); g.fillRect(22, 38, 9, 14);
      // 体
      g.fillStyle(C.SHADE); g.fillRect(8, 18, 24, 22);
      // 武器腕
      g.fillStyle(0x4a0066); g.fillRect(30, 14, 8, 28);
      g.fillStyle(0x888888); g.fillRect(33, 8, 4, 20);
      // 頭
      g.fillStyle(C.SHADE_LIGHT); g.fillEllipse(20, 12, 22, 18);
      // 目
      g.fillStyle(C.SHADE_EYE); g.fillCircle(14, 12, 4); g.fillCircle(26, 12, 4);
      g.fillStyle(0xff8080); g.fillCircle(14, 12, 2); g.fillCircle(26, 12, 2);
      // 影のオーラ
      g.fillStyle(C.SHADE, 0.5); g.fillEllipse(20, 40, 36, 12);
    });

    // ---- 影の術師 (32×48) ----
    this._gen('shade_mage', 32, 48, g => {
      // ローブ
      g.fillStyle(0x1a003a); g.fillRect(8, 16, 16, 32);
      g.fillStyle(0x2a0050); g.fillTriangle(8, 16, 4, 48, 28, 48);
      // 腕（魔法の手）
      g.fillStyle(0x3d0060); g.fillRect(2, 18, 6, 16); g.fillRect(24, 18, 6, 16);
      g.fillStyle(0x8844ff); g.fillCircle(5, 34, 5); g.fillCircle(27, 34, 5);
      // 頭
      g.fillStyle(0x2a0040); g.fillCircle(16, 10, 10);
      g.fillStyle(C.SHADE_EYE); g.fillCircle(11, 10, 3); g.fillCircle(21, 10, 3);
      g.fillStyle(0xff6060); g.fillCircle(11, 10, 1.5); g.fillCircle(21, 10, 1.5);
    });

    // ---- 古代の守護者 ボス (80×80) ----
    this._gen('ancient_boss', 80, 80, g => {
      // 影の体
      g.fillStyle(C.BOSS); g.fillEllipse(40, 44, 60, 56);
      g.fillStyle(C.BOSS_LIGHT); g.fillEllipse(40, 40, 52, 48);
      // 腕
      g.fillStyle(C.BOSS); g.fillEllipse(10, 40, 22, 14); g.fillEllipse(70, 40, 22, 14);
      g.fillStyle(0x880044); g.fillCircle(4, 40, 8); g.fillCircle(76, 40, 8);
      // 頭
      g.fillStyle(0x380018); g.fillEllipse(40, 22, 44, 36);
      // 角
      g.fillStyle(0x5a0028); g.fillTriangle(20, 18, 16, 2, 28, 14);
      g.fillTriangle(60, 18, 64, 2, 52, 14);
      // 目（3つ）
      g.fillStyle(C.SHADE_EYE); g.fillCircle(28, 22, 6); g.fillCircle(52, 22, 6); g.fillCircle(40, 14, 5);
      g.fillStyle(0xffaaaa); g.fillCircle(28, 22, 3); g.fillCircle(52, 22, 3); g.fillCircle(40, 14, 2.5);
      // オーラ
      g.lineStyle(2, 0x880044, 0.6); g.strokeEllipse(40, 44, 68, 64);
    });

    // ---- NPC: ワイス (魔導書) (32×48) ----
    this._gen('npc_weiss', 32, 48, g => {
      // 本の形
      g.fillStyle(0xf0f0ff); g.fillRect(8, 4, 16, 40);
      // 表紙の装飾
      g.lineStyle(2, 0xb8860b); g.strokeRect(10, 6, 12, 36);
      g.fillStyle(0xdaa520); g.fillRect(14, 20, 4, 8);
      g.fillCircle(16, 24, 4);
      // 輝き
      g.fillStyle(0xffffee, 0.7); g.fillCircle(16, 14, 3);
      // 「W」
      g.fillStyle(0x8888bb);
      g.fillTriangle(11, 10, 13, 18, 16, 14); g.fillTriangle(16, 14, 19, 18, 21, 10);
    });

    // ---- NPC: ヨナ (少女) (32×48) ----
    this._gen('npc_yonah', 32, 48, g => {
      // 足
      g.fillStyle(0xaa8866); g.fillRect(11, 36, 5, 12); g.fillRect(16, 36, 5, 12);
      // 病のドレス
      g.fillStyle(0xddccbb); g.fillRect(9, 18, 14, 20);
      g.fillStyle(0xccbbaa); g.fillTriangle(9, 18, 5, 48, 27, 48);
      // 腕
      g.fillStyle(C.NPC_SKIN); g.fillRect(5, 20, 5, 14); g.fillRect(22, 20, 5, 14);
      // 頭
      g.fillStyle(C.NPC_SKIN); g.fillCircle(16, 12, 10);
      // 髪
      g.fillStyle(0x553322); g.fillEllipse(16, 10, 24, 16);
      g.fillRect(7, 10, 4, 14); g.fillRect(21, 10, 4, 14);
      // 目（病で弱々しい）
      g.fillStyle(0x664422); g.fillEllipse(12, 13, 5, 4); g.fillEllipse(20, 13, 5, 4);
      g.fillStyle(0xffddcc, 0.4); g.fillEllipse(16, 16, 10, 4);
    });

    // ---- NPC: ポポラ (村長) (32×48) ----
    this._gen('npc_popola', 32, 48, g => {
      g.fillStyle(0x8866aa); g.fillRect(9, 18, 14, 30);
      g.fillStyle(0x6644aa); g.fillTriangle(9, 18, 4, 48, 28, 48);
      g.fillStyle(C.NPC_SKIN); g.fillRect(5, 20, 5, 14); g.fillRect(22, 20, 5, 14);
      g.fillStyle(C.NPC_SKIN); g.fillCircle(16, 12, 9);
      g.fillStyle(0x997755); g.fillEllipse(16, 9, 22, 14);
      g.fillStyle(0x664422); g.fillEllipse(12, 12, 5, 5); g.fillEllipse(20, 12, 5, 5);
    });

    // ---- NPC: 村人 (32×48) ----
    this._gen('npc_villager', 32, 48, g => {
      g.fillStyle(0x996633); g.fillRect(9, 18, 14, 30);
      g.fillStyle(0x775522); g.fillTriangle(9, 18, 4, 48, 28, 48);
      g.fillStyle(C.NPC_SKIN); g.fillRect(5, 20, 5, 14); g.fillRect(22, 20, 5, 14);
      g.fillStyle(C.NPC_SKIN); g.fillCircle(16, 12, 9);
      g.fillStyle(0x885533); g.fillEllipse(16, 9, 20, 14);
      g.fillStyle(0x4433aa); g.fillEllipse(12, 12, 5, 4); g.fillEllipse(20, 12, 5, 4);
    });

    // ---- 魔法弾（プレイヤー） (12×12) ----
    this._gen('proj_magic', 12, 12, g => {
      g.fillStyle(0x2222ff, 0.3); g.fillCircle(6, 6, 6);
      g.fillStyle(0x6666ff, 0.7); g.fillCircle(6, 6, 4);
      g.fillStyle(0xaaaaff);      g.fillCircle(6, 6, 2);
    });

    // ---- 敵弾 (12×12) ----
    this._gen('proj_enemy', 12, 12, g => {
      g.fillStyle(0xff0000, 0.3); g.fillCircle(6, 6, 6);
      g.fillStyle(0xff4444, 0.7); g.fillCircle(6, 6, 4);
      g.fillStyle(0xffaaaa);      g.fillCircle(6, 6, 2);
    });

    // ---- ボス弾 (16×16) ----
    this._gen('proj_enemy_boss', 16, 16, g => {
      g.fillStyle(0x880000, 0.3); g.fillCircle(8, 8, 8);
      g.fillStyle(0xcc2222, 0.8); g.fillCircle(8, 8, 5);
      g.fillStyle(0xff8888);      g.fillCircle(8, 8, 2);
    });

    // ---- タイルテクスチャ (48×48) ----
    const TS = GameConfig.TILE_SIZE;

    // 床
    this._gen('tile_floor', TS, TS, g => {
      g.fillStyle(C.FLOOR); g.fillRect(0, 0, TS, TS);
      g.lineStyle(1, C.FLOOR_ALT, 0.4);
      g.lineBetween(0, 0, TS, 0); g.lineBetween(0, 0, 0, TS);
    });

    // 壁
    this._gen('tile_wall', TS, TS, g => {
      g.fillStyle(C.WALL); g.fillRect(0, 0, TS, TS);
      g.fillStyle(C.WALL_TOP); g.fillRect(0, 0, TS, 8);
      g.lineStyle(1, 0x1a1a28, 0.8);
      g.lineBetween(0, 0, TS, 0); g.lineBetween(TS, 0, TS, TS);
    });

    // 草
    this._gen('tile_grass', TS, TS, g => {
      g.fillStyle(C.GRASS); g.fillRect(0, 0, TS, TS);
      g.fillStyle(C.GRASS_DARK, 0.5);
      for (let i = 0; i < 6; i++) {
        const rx = 4 + i * 8, ry = 4 + (i % 3) * 14;
        g.fillRect(rx, ry, 2, 6);
      }
    });

    // 水
    this._gen('tile_water', TS, TS, g => {
      g.fillStyle(C.WATER); g.fillRect(0, 0, TS, TS);
      g.lineStyle(1, 0x0a1840, 0.5);
      g.lineBetween(4, 20, 44, 20); g.lineBetween(8, 30, 40, 30);
    });

    // 石
    this._gen('tile_stone', TS, TS, g => {
      g.fillStyle(C.STONE); g.fillRect(0, 0, TS, TS);
      g.lineStyle(1, 0x0e0e0e, 0.6);
      g.lineBetween(0, TS / 2, TS, TS / 2);
      g.lineBetween(TS / 4, 0, TS / 4, TS / 2);
      g.lineBetween(TS * 3 / 4, TS / 2, TS * 3 / 4, TS);
    });

    // 砂
    this._gen('tile_sand', TS, TS, g => {
      g.fillStyle(C.SAND); g.fillRect(0, 0, TS, TS);
      g.fillStyle(0x1c1812, 0.3);
      g.fillCircle(10, 10, 2); g.fillCircle(30, 20, 2); g.fillCircle(20, 36, 2);
    });

    // ---- セーブポイント (48×48) ----
    this._gen('save_point', TS, TS, g => {
      g.lineStyle(2, 0x88aaff, 0.8);
      g.strokeCircle(TS / 2, TS / 2, 18);
      g.fillStyle(0x4466ff, 0.2); g.fillCircle(TS / 2, TS / 2, 18);
      g.fillStyle(0x8888ff); g.fillCircle(TS / 2, TS / 2, 5);
    });

    // ---- パーティクル ----
    this._gen('particle_hit', 6, 6, g => {
      g.fillStyle(0xffffff); g.fillCircle(3, 3, 3);
    });
    this._gen('particle_magic', 6, 6, g => {
      g.fillStyle(0x8888ff); g.fillCircle(3, 3, 3);
    });

    // ---- 初期化 ----
    SaveManager.init();
    QuestSystem.hookEvents();

    // main_01 クエストを自動開始
    if (!QuestSystem.hasStarted('main_01')) QuestSystem.startQuest('main_01');

    this.scene.start('Title');
  }

  _gen(key, w, h, drawFn) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    drawFn(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
