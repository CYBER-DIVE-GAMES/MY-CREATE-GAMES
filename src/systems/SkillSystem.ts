import Phaser from 'phaser';
import { PlayerStats, BASE_PLAYER_STATS } from '../entities/Player';
import { SkillDef } from '../skills/SkillBase';
import { ATTACK_SKILLS }  from '../skills/AttackSkills';
import { DEFENSE_SKILLS } from '../skills/DefenseSkills';
import { BULLET_SKILLS }  from '../skills/BulletSkills';
import { UTILITY_SKILLS } from '../skills/UtilitySkills';
import { GOLD_SKILLS }    from '../skills/GoldSkills';
import { CURSE_SKILLS }   from '../skills/CurseSkills';

// 全スキルをフラットに結合
export const ALL_SKILLS: SkillDef[] = [
  ...ATTACK_SKILLS,
  ...DEFENSE_SKILLS,
  ...BULLET_SKILLS,
  ...UTILITY_SKILLS,
  ...GOLD_SKILLS,
  ...CURSE_SKILLS,
];

// LevelUpScene との互換性のために再エクスポート
export type { SkillDef };

export class SkillSystem {
  private acquired: Map<string, number> = new Map();
  private luckyBellLevel: number = 0;
  private currentLevel: number = 1; // レベル参照用（G1/G3の解放条件）

  getAcquired(): Map<string, number> { return this.acquired; }
  getSkillLevel(id: string): number  { return this.acquired.get(id) ?? 0; }
  setCurrentLevel(lv: number): void  { this.currentLevel = lv; }

  /** スキルカードをランダムに選ぶ */
  drawCards(count: number = 3): SkillDef[] {
    const available = ALL_SKILLS.filter((s) => {
      // レベル上限チェック
      const lv = this.getSkillLevel(s.id);
      if (lv >= s.maxLevel) return false;
      // 解放条件チェック
      if (s.isUnlocked && !s.isUnlocked(this.acquired)) return false;
      // G1: Lv15以上
      if (s.id === 'G1_bullet_prodigy' && this.currentLevel < 15) return false;
      // G3: Lv20以上
      if (s.id === 'G3_chaos_engine' && this.currentLevel < 20) return false;
      return true;
    });

    if (available.length === 0) return [];

    // カーソを呪いスキル・ゴールドスキルの出現率調整
    const weighted: SkillDef[] = [];
    for (const s of available) {
      const times = s.category === 'K' ? 1
                  : s.category === 'G' ? (1 + this.luckyBellLevel)
                  : 4;
      for (let i = 0; i < times; i++) weighted.push(s);
    }

    Phaser.Utils.Array.Shuffle(weighted);
    // 重複を除きつつ count 枚
    const seen = new Set<string>();
    const result: SkillDef[] = [];
    for (const s of weighted) {
      if (!seen.has(s.id)) {
        seen.add(s.id);
        result.push(s);
      }
      if (result.length >= count) break;
    }
    return result;
  }

  /**
   * スキルを取得し、全スキルを BaseStats から再計算して適用する。
   * 現在のHPは保存して maxHp にクランプ。
   */
  acquire(skillId: string, playerStats: PlayerStats): void {
    const skill = ALL_SKILLS.find((s) => s.id === skillId);
    if (!skill) return;
    const currentLv = this.getSkillLevel(skillId);
    if (currentLv >= skill.maxLevel) return;

    this.acquired.set(skillId, currentLv + 1);

    // D7 幸運の鈴レベルを更新
    const d7lv = this.getSkillLevel('D7_lucky_bell');
    this.luckyBellLevel = d7lv;

    // 全スキルを再計算
    this.recalculate(playerStats);
  }

  /**
   * BASE_PLAYER_STATS を起点にして取得済みスキルを順番に apply し直す。
   * HP は min(現在HP, 新maxHp) で保存。
   */
  recalculate(stats: PlayerStats): void {
    const savedHp = stats.hp;
    Object.assign(stats, { ...BASE_PLAYER_STATS });

    for (const [id, lv] of this.acquired) {
      const skill = ALL_SKILLS.find((s) => s.id === id);
      if (skill) skill.apply(stats, lv);
    }

    stats.hp = Math.min(savedHp, stats.maxHp);
  }

  /** シナジー条件チェック（SynergyCalculatorから呼ばれる） */
  hasBoth(idA: string, idB: string): boolean {
    return this.acquired.has(idA) && this.acquired.has(idB);
  }
}
