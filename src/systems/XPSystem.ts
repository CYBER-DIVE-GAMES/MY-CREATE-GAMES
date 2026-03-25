export class XPSystem {
  private xp: number = 0;
  private level: number = 1;
  private onLevelUp: (level: number) => void;

  // XP閾値テーブル（Lv→次Lvに必要なXP）バンパイアサバイバーズ参考
  private static readonly XP_TABLE: number[] = [
    20,   // Lv1 → 2
    35,   // Lv2 → 3
    55,   // Lv3 → 4
    80,   // Lv4 → 5
    110,  // Lv5 → 6
    150,  // Lv6 → 7
    195,  // Lv7 → 8
    245,  // Lv8 → 9
    300,  // Lv9 → 10
    360,  // Lv10 → 11
  ];

  constructor(onLevelUp: (level: number) => void) {
    this.onLevelUp = onLevelUp;
  }

  addXP(amount: number): void {
    this.xp += amount;
    this.checkLevelUp();
  }

  private checkLevelUp(): void {
    const needed = this.xpForNext();
    if (needed > 0 && this.xp >= needed) {
      this.xp -= needed;
      this.level++;
      this.onLevelUp(this.level);
      this.checkLevelUp();
    }
  }

  private xpForNext(): number {
    const idx = this.level - 1;
    if (idx >= XPSystem.XP_TABLE.length) {
      return 420; // Lv11以降は420固定
    }
    return XPSystem.XP_TABLE[idx];
  }

  getLevel(): number { return this.level; }
  getXP(): number { return this.xp; }
  getXPNeeded(): number { return this.xpForNext(); }

  getXPRatio(): number {
    const needed = this.xpForNext();
    if (needed <= 0) return 1;
    return Math.min(1, this.xp / needed);
  }
}
