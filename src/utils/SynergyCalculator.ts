import { SkillSystem } from '../systems/SkillSystem';
import { PlayerStats } from '../entities/Player';

export interface ActiveSynergy {
  name: string;
  color: number;
}

/** シナジー条件の定義 */
const SYNERGY_DEFS = [
  { name: '炎毒嵐',      color: 0xff8844, requires: ['A6_poison',    'A7_burn']        },
  { name: '氷砕弾',      color: 0x88ccff, requires: ['A8_ice',       'A2_explosion']   },
  { name: '連鎖爆発',    color: 0xff4400, requires: ['A5_split',     'A2_explosion']   },
  { name: '吸血鬼の宴',  color: 0xff2266, requires: ['B5_lifesteal', 'A2_explosion']   },
  { name: '電撃貫通',    color: 0xffff44, requires: ['A1_pierce',    'C4_discharge']   },
  { name: '無限回廊',    color: 0x8844ff, requires: ['C6_reflect',   'C3_orbital']     },
  { name: '死に際の怒り',color: 0xff8800, requires: ['B8_last_stand','G4_overload']    },
  { name: 'レーザー霜柱',color: 0x44ffff, requires: ['C7_laser',     'A8_ice']         },
  { name: '時間崩壊',    color: 0xaa44ff, requires: ['D4_slow_time', 'K5_abyss_eye']   },
  { name: '覚醒輪廻',    color: 0xffdd00, requires: ['G5_reincarnation', 'D3_rush']    },
];

export class SynergyCalculator {
  /** 現在の取得スキルからアクティブなシナジーを返す */
  static getActive(skillSystem: SkillSystem): ActiveSynergy[] {
    return SYNERGY_DEFS.filter((s) =>
      s.requires.every((id) => skillSystem.getSkillLevel(id) > 0)
    ).map((s) => ({ name: s.name, color: s.color }));
  }

  /**
   * シナジー由来のダメージ補正を計算する。
   * 弾がヒットしたときに呼ばれ、追加ダメージ倍率を返す。
   */
  static getDamageMultiplier(
    skillSystem: SkillSystem,
    _targetHasPoison: boolean,
    _targetFrozen: boolean
  ): number {
    let mult = 1.0;

    // 炎毒嵐: 毒状態の敵に炎弾が当たると3倍ダメ（ここでは1.5倍として表現）
    if (skillSystem.hasBoth('A6_poison', 'A7_burn') && _targetHasPoison) mult *= 1.5;
    // 氷砕弾: 凍結中に爆発ダメ+300%（ここでは2倍として表現）
    if (skillSystem.hasBoth('A8_ice', 'A2_explosion') && _targetFrozen) mult *= 2.0;

    return mult;
  }

  /** シナジー発動時に追加効果をstatsに反映 */
  static applyPassiveSynergies(skillSystem: SkillSystem, stats: PlayerStats): void {
    // G1_bullet_prodigy 弾幕申し子: Cスキルがあれば全体ダメ+30%
    if (skillSystem.getSkillLevel('G1_bullet_prodigy') > 0) {
      stats.damage = Math.floor(stats.damage * 1.3);
    }
  }
}
