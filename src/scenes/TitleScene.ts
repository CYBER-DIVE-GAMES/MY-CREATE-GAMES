import Phaser from 'phaser';
import { SaveSystem } from '../utils/SaveSystem';

// ─── 妖核強化ツリー定義 ───────────────────────────────────────────
interface UpgradeDef {
  id: string;
  name: string;
  maxLevel: number;
  cost: (level: number) => number;   // 次レベルのコスト
  description: (level: number) => string;
}

const UPGRADE_LINES: { lineTitle: string; color: string; upgrades: UpgradeDef[] }[] = [
  {
    lineTitle: '体魄',
    color: '#ff8888',
    upgrades: [
      {
        id: 'hp_up',
        name: '体力強化',
        maxLevel: 5,
        cost: (lv) => [5, 8, 12, 18, 25][lv] ?? 999,
        description: (lv) => lv === 0 ? '最大HP +15%/Lv' : `最大HP +${lv * 15}%`,
      },
      {
        id: 'dmg_reduce',
        name: '被ダメ軽減',
        maxLevel: 4,
        cost: (lv) => [8, 14, 22, 35][lv] ?? 999,
        description: (lv) => lv === 0 ? '被ダメージ -5%/Lv' : `被ダメージ -${lv * 5}%`,
      },
      {
        id: 'start_heal',
        name: '開始時回復',
        maxLevel: 3,
        cost: (lv) => [10, 18, 30][lv] ?? 999,
        description: (lv) => lv === 0 ? 'ステージ開始時にHP回復' : `開始時HP +${[0, 20, 35, 50][lv]}%`,
      },
      {
        id: 'guardian',
        name: '生還の加護',
        maxLevel: 2,
        cost: (lv) => [20, 40][lv] ?? 999,
        description: (lv) => lv === 0 ? '致死ダメージを一度耐える(1回/run)' : lv === 1 ? '致死耐え: 1回/run' : '致死耐え: 2回/run',
      },
    ],
  },
  {
    lineTitle: '霊力',
    color: '#88aaff',
    upgrades: [
      {
        id: 'atk_up',
        name: '攻撃強化',
        maxLevel: 5,
        cost: (lv) => [5, 8, 12, 18, 25][lv] ?? 999,
        description: (lv) => lv === 0 ? '攻撃力 +10%/Lv' : `攻撃力 +${lv * 10}%`,
      },
      {
        id: 'spd_up',
        name: '弾速強化',
        maxLevel: 3,
        cost: (lv) => [6, 12, 20][lv] ?? 999,
        description: (lv) => lv === 0 ? '弾速 +10%/Lv' : `弾速 +${lv * 10}%`,
      },
      {
        id: 'crit_up',
        name: 'クリティカル強化',
        maxLevel: 4,
        cost: (lv) => [8, 15, 24, 38][lv] ?? 999,
        description: (lv) => lv === 0 ? 'クリ率 +3%/Lv' : `クリ率 +${lv * 3}%`,
      },
      {
        id: 'pioneer',
        name: '先達の加護',
        maxLevel: 2,
        cost: (lv) => [25, 45][lv] ?? 999,
        description: (lv) => lv === 0 ? '初期スキル選択肢+1' : lv === 1 ? '初期選択肢+1' : '初期選択肢+2',
      },
    ],
  },
  {
    lineTitle: '妖技',
    color: '#cc88ff',
    upgrades: [
      {
        id: 'xp_up',
        name: '経験値強化',
        maxLevel: 5,
        cost: (lv) => [5, 8, 12, 18, 25][lv] ?? 999,
        description: (lv) => lv === 0 ? 'XP取得量 +10%/Lv' : `XP取得量 +${lv * 10}%`,
      },
      {
        id: 'youkaku_up',
        name: '収穫強化',
        maxLevel: 4,
        cost: (lv) => [8, 14, 22, 35][lv] ?? 999,
        description: (lv) => lv === 0 ? '妖核取得量 +15%/Lv' : `妖核取得量 +${lv * 15}%`,
      },
      {
        id: 'choice_up',
        name: 'スキル選択拡張',
        maxLevel: 3,
        cost: (lv) => [12, 22, 40][lv] ?? 999,
        description: (lv) => lv === 0 ? 'スキル選択肢+1/Lv' : `スキル選択肢 +${lv}`,
      },
      {
        id: 'spirit_regen',
        name: '妖気の回復',
        maxLevel: 2,
        cost: (lv) => [20, 40][lv] ?? 999,
        description: (lv) => lv === 0 ? 'HP自然回復(微量)' : lv === 1 ? '毎秒 +0.5HP' : '毎秒 +1HP',
      },
    ],
  },
];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const saveData = SaveSystem.load();

    // 背景画像
    if (this.textures.exists('title_bg')) {
      this.add.image(width / 2, height / 2, 'title_bg').setDisplaySize(width, height).setDepth(0);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x050510);
    }

    // 星のパーティクル
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 1.0);
      const star = this.add.circle(x, y, size, 0xffffff, alpha).setDepth(1);
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: 0.1 },
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    // タイトルパネル
    const panelH = 200;
    const panelG = this.add.graphics().setDepth(2);
    panelG.fillStyle(0x000000, 0.55);
    panelG.fillRect(0, 130, width, panelH);
    // 上下の金色ライン
    panelG.lineStyle(2, 0xffd700, 0.7);
    panelG.strokeRect(0, 130, width, panelH);

    // タイトルロゴ
    this.add.text(width / 2, 200, '妖狐討魔録', {
      fontSize: '64px',
      color: '#ffd700',
      fontStyle: 'bold',
      stroke: '#ff6600',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(3);

    this.add.text(width / 2, 285, '～ Youko Touma-roku ～', {
      fontSize: '22px',
      color: '#ccbbff',
    }).setOrigin(0.5).setDepth(3);

    // 妖核表示
    const youkakuText = this.add.text(width / 2, 380, `妖核：${saveData.youkaku} 個`, {
      fontSize: '20px',
      color: '#cc88ff',
      stroke: '#220022',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    // 「はじめる」ボタン
    const startBtnBg = this.add.graphics().setDepth(3);
    const drawStartBtn = (hovered: boolean) => {
      startBtnBg.clear();
      startBtnBg.fillStyle(hovered ? 0x552266 : 0x331144, 1);
      startBtnBg.fillRoundedRect(width/2 - 120, 470, 240, 60, 12);
      startBtnBg.lineStyle(2, hovered ? 0xffd700 : 0xaa88cc, 1);
      startBtnBg.strokeRoundedRect(width/2 - 120, 470, 240, 60, 12);
    };
    drawStartBtn(false);

    const startText = this.add.text(width / 2, 500, 'はじめる', {
      fontSize: '32px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4);
    const startZone = this.add.zone(width/2, 500, 240, 60).setInteractive({ useHandCursor: true });
    startZone.on('pointerover', () => { drawStartBtn(true); startText.setColor('#ffd700'); });
    startZone.on('pointerout', () => { drawStartBtn(false); startText.setColor('#ffffff'); });
    startZone.on('pointerdown', () => this.scene.start('StageScene', { stage: 1 }));

    // 「修行の間」ボタン
    const trainBtnBg = this.add.graphics().setDepth(3);
    const drawTrainBtn = (hovered: boolean) => {
      trainBtnBg.clear();
      trainBtnBg.fillStyle(hovered ? 0x331133 : 0x220033, 1);
      trainBtnBg.fillRoundedRect(width/2 - 100, 570, 200, 50, 10);
      trainBtnBg.lineStyle(2, hovered ? 0xcc88ff : 0x664488, 1);
      trainBtnBg.strokeRoundedRect(width/2 - 100, 570, 200, 50, 10);
    };
    drawTrainBtn(false);

    const trainText = this.add.text(width / 2, 595, '修行の間', {
      fontSize: '26px', color: '#cc88ff',
    }).setOrigin(0.5).setDepth(4);
    const trainZone = this.add.zone(width/2, 595, 200, 50).setInteractive({ useHandCursor: true });
    trainZone.on('pointerover', () => { drawTrainBtn(true); trainText.setColor('#ffffff'); });
    trainZone.on('pointerout', () => { drawTrainBtn(false); trainText.setColor('#cc88ff'); });
    trainZone.on('pointerdown', () => {
      this.showUpgradeTree(youkakuText);
    });

    // バージョン
    this.add.text(width - 10, height - 10, 'v0.2.0 Phase2', {
      fontSize: '14px', color: '#444466',
    }).setOrigin(1, 1).setDepth(3);
  }

  private showUpgradeTree(youkakuText: Phaser.GameObjects.Text): void {
    const { width, height } = this.scale;
    const overlayObjects: Phaser.GameObjects.GameObject[] = [];

    const addObj = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      overlayObjects.push(obj);
      return obj;
    };

    const closeAll = () => {
      overlayObjects.forEach(o => o.destroy());
    };

    // 半透明背景
    addObj(this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.92).setDepth(200).setInteractive());

    // タイトル
    addObj(this.add.text(width / 2, 42, '修行の間', {
      fontSize: '30px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201));

    // 妖核表示
    const saveData = SaveSystem.load();
    const ykDisplay = addObj(this.add.text(width / 2, 82, `妖核：${saveData.youkaku} 個`, {
      fontSize: '18px',
      color: '#cc88ff',
    }).setOrigin(0.5).setDepth(201));

    const refreshYoukaku = () => {
      const d = SaveSystem.load();
      ykDisplay.setText(`妖核：${d.youkaku} 個`);
      youkakuText.setText(`妖核：${d.youkaku} 個`);
    };

    // 説明テキスト（ホバー時に表示）
    const descBox = addObj(this.add.text(width / 2, height - 60, '', {
      fontSize: '15px',
      color: '#ffffff',
      backgroundColor: '#111133',
      padding: { x: 10, y: 6 },
      align: 'center',
      wordWrap: { width: width - 40 },
    }).setOrigin(0.5).setDepth(202).setAlpha(0));

    // 3列レイアウト
    const colX = [90, 270, 450];
    const startY = 140;
    const rowH = 170;

    UPGRADE_LINES.forEach((line, lineIdx) => {
      const cx = colX[lineIdx];

      // ライン見出し
      addObj(this.add.text(cx, startY - 28, `─ ${line.lineTitle} ─`, {
        fontSize: '16px',
        color: line.color,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(201));

      line.upgrades.forEach((upDef, rowIdx) => {
        const cy = startY + rowIdx * rowH;
        this.buildUpgradeCell(cx, cy, upDef, line.color, overlayObjects, descBox, refreshYoukaku);
      });
    });

    // 閉じるボタン
    const closeBtn = addObj(this.add.text(width / 2, height - 24, '[ 閉じる ]', {
      fontSize: '20px',
      color: '#aaaaaa',
      backgroundColor: '#222244',
      padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(202).setInteractive({ useHandCursor: true }));

    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#aaaaaa'));
    closeBtn.on('pointerdown', () => closeAll());
  }

  private buildUpgradeCell(
    cx: number, cy: number,
    upDef: UpgradeDef,
    lineColor: string,
    overlayObjects: Phaser.GameObjects.GameObject[],
    descBox: Phaser.GameObjects.Text,
    onPurchase: () => void,
  ): void {
    const addObj = <T extends Phaser.GameObjects.GameObject>(obj: T): T => {
      overlayObjects.push(obj);
      return obj;
    };

    const DEPTH = 201;
    const cellW = 140;
    const cellH = 155;

    // セル背景
    const cellBg = addObj(
      this.add.rectangle(cx, cy + cellH / 2 - 10, cellW, cellH, 0x111133, 0.9)
        .setDepth(DEPTH)
        .setStrokeStyle(1, 0x334466)
        .setInteractive({ useHandCursor: true })
    );

    // スキル名
    addObj(this.add.text(cx, cy + 4, upDef.name, {
      fontSize: '13px',
      color: lineColor,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(DEPTH + 1));

    // レベルドット表示用（後で再描画）
    const dotContainer = this.add.container(cx, cy + 32).setDepth(DEPTH + 1);
    overlayObjects.push(dotContainer);

    // コストテキスト
    const costText = addObj(this.add.text(cx, cy + 80, '', {
      fontSize: '13px',
      color: '#ffdd88',
    }).setOrigin(0.5, 0).setDepth(DEPTH + 1));

    // 購入ボタン
    const buyBtn = addObj(this.add.text(cx, cy + 110, '[ 強化 ]', {
      fontSize: '15px',
      color: '#ffffff',
      backgroundColor: '#331155',
      padding: { x: 8, y: 5 },
    }).setOrigin(0.5, 0).setDepth(DEPTH + 2).setInteractive({ useHandCursor: true }));

    const refresh = () => {
      const data = SaveSystem.load();
      const lv = data.upgrades[upDef.id] ?? 0;

      // ドット
      dotContainer.removeAll(true);
      for (let i = 0; i < upDef.maxLevel; i++) {
        const filled = i < lv;
        const dot = this.add.circle((i - (upDef.maxLevel - 1) / 2) * 16, 0, 5,
          filled ? Phaser.Display.Color.HexStringToColor(lineColor).color : 0x333355);
        dotContainer.add(dot);
      }

      if (lv >= upDef.maxLevel) {
        costText.setText('MAX');
        costText.setColor('#aaffaa');
        buyBtn.setVisible(false);
      } else {
        const cost = upDef.cost(lv);
        costText.setText(`コスト: ${cost}`);
        costText.setColor('#ffdd88');
        buyBtn.setVisible(true);

        const canAfford = data.youkaku >= cost;
        buyBtn.setColor(canAfford ? '#ffffff' : '#886688');
        buyBtn.setStyle({ backgroundColor: canAfford ? '#331155' : '#221133' });
      }
    };

    refresh();

    // ホバーで説明表示
    cellBg.on('pointerover', () => {
      const data = SaveSystem.load();
      const lv = data.upgrades[upDef.id] ?? 0;
      descBox.setText(upDef.description(lv));
      this.tweens.add({ targets: descBox, alpha: 1, duration: 150 });
    });
    cellBg.on('pointerout', () => {
      this.tweens.add({ targets: descBox, alpha: 0, duration: 150 });
    });

    // 購入
    buyBtn.on('pointerdown', () => {
      const data = SaveSystem.load();
      const lv = data.upgrades[upDef.id] ?? 0;
      if (lv >= upDef.maxLevel) return;
      const cost = upDef.cost(lv);
      if (data.youkaku < cost) return;

      data.youkaku -= cost;
      data.upgrades[upDef.id] = lv + 1;
      SaveSystem.save(data);

      onPurchase();
      refresh();

      // 購入フラッシュ
      this.tweens.add({
        targets: cellBg,
        fillColor: { from: 0x442266, to: 0x111133 },
        duration: 300,
      });
    });

    buyBtn.on('pointerover', () => {
      const data = SaveSystem.load();
      const lv = data.upgrades[upDef.id] ?? 0;
      descBox.setText(upDef.description(lv));
      this.tweens.add({ targets: descBox, alpha: 1, duration: 150 });
    });
  }
}
