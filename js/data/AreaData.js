// ============================================================
// AreaData - マップエリアデータ
// 0=床, 1=壁, 2=草, 3=水, 4=石, 5=砂
// ============================================================
window.AreaData = (function () {

  // タイルヘルパー
  function row(str) {
    return str.split('').map(c => {
      if (c === '#') return 1; // 壁
      if (c === '.') return 0; // 床
      if (c === 'g') return 2; // 草
      if (c === 'w') return 3; // 水
      if (c === 's') return 4; // 石
      if (c === 'd') return 5; // 砂
      return 0;
    });
  }

  // ============================================================
  // VILLAGE - 失われた村
  // ============================================================
  const VILLAGE_MAP = [
    row('##############################'),
    row('#............................#'),
    row('#..gggg..................gggg.#'),
    row('#..g....g................g..g.#').slice(0, 30),
    row('#............................#'),
    row('#.##....####.......###......#'),
    row('#.##.....##.........##......#'),
    row('#............................#'),
    row('#............................#'),
    row('#.....sssss..............sss.#'),
    row('#.....sssss..............sss.#'),
    row('#............................#'),
    row('#............................#'),
    row('#..ggg...........####.......#'),
    row('#..ggg...........####.......#'),
    row('#............................#'),
    row('#....www.......www...........#'),
    row('#....www.......www...........#'),
    row('#............................#'),
    row('##############################'),
  ].map(r => { while (r.length < 30) r.push(0); return r.slice(0, 30); });

  // 30×20 に正確に整形
  for (let y = 0; y < 20; y++) {
    VILLAGE_MAP[y] = VILLAGE_MAP[y] || [];
    while (VILLAGE_MAP[y].length < 30) VILLAGE_MAP[y].push(0);
    VILLAGE_MAP[y] = VILLAGE_MAP[y].slice(0, 30);
    VILLAGE_MAP[y][0]  = 1;
    VILLAGE_MAP[y][29] = 1;
  }
  for (let x = 0; x < 30; x++) { VILLAGE_MAP[0][x] = 1; VILLAGE_MAP[19][x] = 1; }
  // 北出口
  for (let x = 13; x <= 16; x++) VILLAGE_MAP[0][x] = 0;

  // ============================================================
  // FOREST - 深い森
  // ============================================================
  const FOREST_MAP = [];
  for (let y = 0; y < 22; y++) {
    const r = [];
    for (let x = 0; x < 30; x++) {
      if (x === 0 || x === 29 || y === 0 || y === 21) r.push(1);
      else r.push(2);
    }
    FOREST_MAP.push(r);
  }
  // 通路を掘る
  [[1, 1, 12, 3], [12, 3, 12, 9], [12, 9, 5, 9], [5, 9, 5, 16],
   [12, 9, 22, 9], [22, 9, 22, 16], [22, 16, 14, 16], [14, 16, 14, 20]
  ].forEach(([x1, y1, x2, y2]) => {
    const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
    let cx = x1, cy = y1;
    while (cx !== x2 || cy !== y2) {
      for (let w = -1; w <= 1; w++) {
        const nx = cx + (dy !== 0 ? w : 0);
        const ny = cy + (dx !== 0 ? w : 0);
        if (nx > 0 && nx < 29 && ny > 0 && ny < 21) FOREST_MAP[ny][nx] = 0;
      }
      if (cx !== x2) cx += dx;
      else cy += dy;
    }
    for (let w = -1; w <= 1; w++) {
      const nx = x2 + (dy !== 0 ? w : 0);
      const ny = y2 + (dx !== 0 ? w : 0);
      if (nx > 0 && nx < 29 && ny > 0 && ny < 21) FOREST_MAP[ny][nx] = 0;
    }
  });
  // 南入口（村からの出口）
  for (let x = 11; x <= 14; x++) FOREST_MAP[0][x] = 0;
  // 北出口（神殿へ）
  for (let x = 13; x <= 15; x++) FOREST_MAP[21][x] = 0;
  // 池を数か所
  [[8, 5], [9, 5], [8, 6], [9, 6],
   [20, 13], [21, 13], [20, 14], [21, 14]].forEach(([x, y]) => {
    if (FOREST_MAP[y] && x > 0 && x < 29) FOREST_MAP[y][x] = 3;
  });

  // ============================================================
  // TEMPLE - 古代の神殿
  // ============================================================
  const TEMPLE_MAP = [];
  for (let y = 0; y < 20; y++) {
    const r = [];
    for (let x = 0; x < 26; x++) {
      if (x === 0 || x === 25 || y === 0 || y === 19) r.push(1);
      else r.push(4);
    }
    TEMPLE_MAP.push(r);
  }
  // 中央通路
  for (let y = 1; y <= 18; y++) {
    for (let x = 9; x <= 15; x++) TEMPLE_MAP[y][x] = 0;
  }
  // 左右小部屋
  for (let y = 4; y <= 8; y++) {
    for (let x = 2; x <= 7; x++) TEMPLE_MAP[y][x] = 0;
    for (let x = 17; x <= 22; x++) TEMPLE_MAP[y][x] = 0;
  }
  // ボスルーム
  for (let y = 4; y <= 15; y++) {
    for (let x = 6; x <= 19; x++) {
      if (y >= 4 && y <= 15 && x >= 6 && x <= 19) TEMPLE_MAP[y][x] = 0;
    }
  }
  // 南入口（森からの出口）
  for (let x = 11; x <= 14; x++) TEMPLE_MAP[19][x] = 0;
  // 装飾柱
  [[3, 3], [22, 3], [3, 16], [22, 16]].forEach(([x, y]) => {
    TEMPLE_MAP[y][x] = 1;
  });

  return {
    village: {
      id: 'village', name: '失われた村', nameEn: 'Lost Village',
      bgm: 'village',
      bgColor: 0x0d0d1a,
      ambientColor: 0x1a1a2e,
      width: 30, height: 20, tileSize: 48,
      tiles: VILLAGE_MAP,
      enemySpawns: [
        { type: 'shade_small', tileX: 3,  tileY: 3  },
        { type: 'shade_small', tileX: 26, tileY: 3  },
        { type: 'shade_small', tileX: 3,  tileY: 15 },
        { type: 'shade_small', tileX: 26, tileY: 15 },
        { type: 'shade_small', tileX: 14, tileY: 4  },
      ],
      npcSpawns: [
        { id: 'yonah',     tileX: 15, tileY: 10, dialogId: 'yonah_sick',       questGiver: null },
        { id: 'popola',    tileX: 8,  tileY: 7,  dialogId: 'popola_first',     questGiver: ['side_01', 'side_02'] },
        { id: 'villager',  tileX: 20, tileY: 5,  dialogId: 'villager_a',       questGiver: null },
        { id: 'villager',  tileX: 22, tileY: 12, dialogId: 'villager_b_letter', questGiver: ['side_03'] },
        { id: 'weiss',     tileX: 14, tileY: 8,  dialogId: 'controls_hint',    questGiver: null },
      ],
      exits: [
        { tileX: 14, tileY: 0, targetArea: 'forest', targetTileX: 14, targetTileY: 19,
          requireFlag: null, lockedMsg: null },
      ],
      savePoints: [{ tileX: 5, tileY: 5 }],
      storyTriggers: [
        { tileX: 14, tileY: 1, dialogId: 'intro_village', flag: 'intro_village_done', once: true },
      ],
    },

    forest: {
      id: 'forest', name: '深い森', nameEn: 'Deep Forest',
      bgm: 'forest',
      bgColor: 0x050d05,
      ambientColor: 0x0d1a0d,
      width: 30, height: 22, tileSize: 48,
      tiles: FOREST_MAP,
      enemySpawns: [
        { type: 'shade_small',   tileX: 4,  tileY: 7  },
        { type: 'shade_small',   tileX: 20, tileY: 7  },
        { type: 'shade_warrior', tileX: 7,  tileY: 12 },
        { type: 'shade_warrior', tileX: 21, tileY: 12 },
        { type: 'shade_warrior', tileX: 14, tileY: 5  },
        { type: 'shade_mage',    tileX: 10, tileY: 15 },
        { type: 'shade_mage',    tileX: 18, tileY: 15 },
        { type: 'shade_small',   tileX: 14, tileY: 18 },
      ],
      npcSpawns: [],
      exits: [
        { tileX: 14, tileY: 21, targetArea: 'temple', targetTileX: 13, targetTileY: 18,
          requireFlag: 'main_01_done', lockedMsg: 'まだここには行けない。先に村の仕事を終わらせよう。' },
        { tileX: 14, tileY: 0,  targetArea: 'village', targetTileX: 14, targetTileY: 1,
          requireFlag: null, lockedMsg: null },
      ],
      savePoints: [{ tileX: 13, tileY: 10 }],
      storyTriggers: [
        { tileX: 13, tileY: 2,  dialogId: 'forest_entry',       flag: 'forest_entry_done',  once: true },
        { tileX: 14, tileY: 16, dialogId: 'forest_scroll_found', flag: 'scroll_found',       once: true,
          requireKill: { type: 'shade_warrior', count: 3 }, giveItem: 'ancient_scroll' },
      ],
    },

    temple: {
      id: 'temple', name: '古代の神殿', nameEn: 'Ancient Temple',
      bgm: 'temple',
      bgColor: 0x080308,
      ambientColor: 0x140814,
      width: 26, height: 20, tileSize: 48,
      tiles: TEMPLE_MAP,
      enemySpawns: [
        { type: 'shade_mage',    tileX: 4,  tileY: 6  },
        { type: 'shade_mage',    tileX: 20, tileY: 6  },
        { type: 'shade_warrior', tileX: 4,  tileY: 12 },
        { type: 'shade_warrior', tileX: 20, tileY: 12 },
      ],
      bossSpawn: { type: 'ancient_boss', tileX: 12, tileY: 8 },
      npcSpawns: [],
      exits: [
        { tileX: 13, tileY: 19, targetArea: 'forest', targetTileX: 14, targetTileY: 20,
          requireFlag: null, lockedMsg: null },
      ],
      savePoints: [{ tileX: 12, tileY: 17 }],
      storyTriggers: [
        { tileX: 12, tileY: 16, dialogId: 'temple_entry', flag: 'temple_entry_done', once: true },
        { tileX: 12, tileY: 6,  dialogId: 'boss_pre', flag: 'boss_pre_done', once: true,
          requireFlag: 'entered_temple' },
      ],
    },
  };
})();
