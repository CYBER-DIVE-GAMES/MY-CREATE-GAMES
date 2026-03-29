// ============================================================
// MenuUI - メニューUIヘルパー
// ============================================================
class MenuUI {

  static createPanel(scene, x, y, w, h, alpha = 0.9) {
    const g = scene.add.graphics();
    g.fillStyle(GameConfig.COLORS.UI_BG, alpha);
    g.fillRoundedRect(0, 0, w, h, 8);
    g.lineStyle(2, GameConfig.COLORS.UI_BORDER, 1);
    g.strokeRoundedRect(0, 0, w, h, 8);
    g.setPosition(x, y);
    return g;
  }

  static createTitle(scene, x, y, text, style = null) {
    const s   = style || { ...GameConfig.FONT.LARGE, color: '#daa520' };
    const txt = scene.add.text(x, y, text, s).setOrigin(0.5, 0);
    // 下線
    const line = scene.add.graphics();
    line.lineStyle(1, GameConfig.COLORS.UI_BORDER, 0.7);
    line.lineBetween(x - txt.width / 2, y + txt.height + 4, x + txt.width / 2, y + txt.height + 4);
    return { txt, line };
  }

  static createButton(scene, x, y, w, text, callback) {
    const bg = scene.add.graphics();
    bg.fillStyle(GameConfig.COLORS.UI_BG, 0.8);
    bg.fillRoundedRect(0, 0, w, 32, 6);
    bg.lineStyle(1, GameConfig.COLORS.UI_BORDER, 0.6);
    bg.strokeRoundedRect(0, 0, w, 32, 6);
    bg.setPosition(x, y);

    const txt = scene.add.text(x + w / 2, y + 16, text, GameConfig.FONT.PRIMARY).setOrigin(0.5);

    const zone = scene.add.zone(x, y, w, 32).setOrigin(0).setInteractive();
    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(GameConfig.COLORS.UI_BORDER, 0.3);
      bg.fillRoundedRect(0, 0, w, 32, 6);
      bg.lineStyle(2, GameConfig.COLORS.UI_BORDER2, 1);
      bg.strokeRoundedRect(0, 0, w, 32, 6);
      txt.setColor('#daa520');
      AudioManager.playSFX('menu_move');
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(GameConfig.COLORS.UI_BG, 0.8);
      bg.fillRoundedRect(0, 0, w, 32, 6);
      bg.lineStyle(1, GameConfig.COLORS.UI_BORDER, 0.6);
      bg.strokeRoundedRect(0, 0, w, 32, 6);
      txt.setColor(GameConfig.FONT.PRIMARY.color);
    });
    zone.on('pointerup', () => {
      AudioManager.playSFX('menu_select');
      if (callback) callback();
    });

    return { bg, txt, zone };
  }

  static createStatRow(scene, x, y, label, value, color = null) {
    const lbl = scene.add.text(x, y, label, GameConfig.FONT.SMALL).setOrigin(0, 0.5);
    const val = scene.add.text(x + 160, y, String(value),
      { ...GameConfig.FONT.SMALL, color: color || GameConfig.FONT.SMALL.color }).setOrigin(0, 0.5);
    return { lbl, val };
  }

  static createBar(scene, x, y, w, h, value, max, color, bgColor) {
    const bg = scene.add.graphics();
    bg.fillStyle(bgColor); bg.fillRoundedRect(x, y, w, h, 3);

    const fg = scene.add.graphics();
    fg.fillStyle(color);
    fg.fillRoundedRect(x, y, w * (value / max), h, 3);

    return { bg, fg,
      update(v, m) {
        fg.clear();
        fg.fillStyle(color);
        fg.fillRoundedRect(x, y, w * (v / m), h, 3);
      },
    };
  }
}
