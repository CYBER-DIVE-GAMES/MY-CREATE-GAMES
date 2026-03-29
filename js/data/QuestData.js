// ============================================================
// QuestData - クエスト定義
// ============================================================
window.QuestData = {

  // ==================== メインクエスト ====================
  main_01: {
    id:          'main_01',
    name:        '封印された詩節を求めて',
    description: 'ポポラから「グリモア・ワイス」の断片を探すよう頼まれた。まずは失われた村の廃墟を調べてみよう。',
    type:        'main',
    chapter:     0,
    autoStart:   true,
    objectives:  [
      { id: 'talk_popola',  type: 'flag',  target: 'talked_popola',     desc: 'ポポラに話しかける',                 required: 1, current: 0 },
      { id: 'get_fragment', type: 'flag',  target: 'has_fragment_hint', desc: '村廃墟の奥で手がかりを見つける',       required: 1, current: 0 },
      { id: 'kill_shades',  type: 'kill',  target: 'shade_small',       desc: '影を倒す（5体）',                    required: 5, current: 0 },
    ],
    rewards:     { xp: 150, gold: 50, items: [] },
    nextQuest:   'main_02',
    completionFlag: 'main_01_done',
    completionDialog: 'main_01_complete',
  },

  main_02: {
    id:          'main_02',
    name:        '深い森の謎',
    description: '詩節の断片は深い森の奥にあるらしい。森には強力な影が潜んでいる。気をつけろ。',
    type:        'main',
    chapter:     1,
    autoStart:   false,
    objectives:  [
      { id: 'enter_forest',  type: 'flag',  target: 'entered_forest',    desc: '深い森へ向かう',                    required: 1, current: 0 },
      { id: 'kill_warriors', type: 'kill',  target: 'shade_warrior',     desc: '影の戦士を倒す（3体）',              required: 3, current: 0 },
      { id: 'find_scroll',   type: 'item',  target: 'ancient_scroll',    desc: '古代の巻物を手に入れる',             required: 1, current: 0 },
    ],
    rewards:     { xp: 280, gold: 100, items: ['steel_sword'] },
    nextQuest:   'main_03',
    completionFlag: 'main_02_done',
    completionDialog: 'main_02_complete',
  },

  main_03: {
    id:          'main_03',
    name:        '古代の神殿',
    description: '巻物の文字を解読すると、詩節の本体は古代の神殿にあることがわかった。守護者を倒してヨナを救え。',
    type:        'main',
    chapter:     2,
    autoStart:   false,
    objectives:  [
      { id: 'enter_temple', type: 'flag',  target: 'entered_temple',   desc: '古代の神殿へ向かう',                 required: 1, current: 0 },
      { id: 'kill_boss',    type: 'flag',  target: 'boss_defeated',    desc: '古代の守護者を倒す',                 required: 1, current: 0 },
      { id: 'get_cure',     type: 'item',  target: 'grimoire_fragment', desc: '封印の詩節を手に入れる',             required: 1, current: 0 },
    ],
    rewards:     { xp: 0, gold: 0, items: [] },
    completionFlag: 'main_03_done',
    completionDialog: 'ending_begin',
  },

  // ==================== サイドクエスト ====================
  side_01: {
    id:          'side_01',
    name:        '回復草を集めて',
    description: '村の病人のために回復草を5本集めてほしいとのこと。森の近くに生えているはずだ。',
    type:        'side',
    chapter:     0,
    autoStart:   false,
    objectives:  [
      { id: 'gather_herbs', type: 'item', target: 'healing_herb', desc: '回復草を集める（5個）', required: 5, current: 0 },
    ],
    rewards:     { xp: 60, gold: 40, items: ['healing_potion'] },
    completionFlag:   'side_01_done',
    completionDialog: 'side_01_complete',
  },

  side_02: {
    id:          'side_02',
    name:        '村への脅威',
    description: '最近、村の周辺に影が増えてきた。10体倒して村の安全を確保せよ。',
    type:        'side',
    chapter:     0,
    autoStart:   false,
    objectives:  [
      { id: 'kill_10', type: 'kill', target: 'shade_small', desc: '影を倒す（10体）', required: 10, current: 0 },
    ],
    rewards:     { xp: 80, gold: 60, items: [] },
    completionFlag:   'side_02_done',
    completionDialog: 'side_02_complete',
  },

  side_03: {
    id:          'side_03',
    name:        'ヨナへの手紙',
    description: '体の不自由な村人が、病床のヨナへ届けてほしい手紙を持っている。',
    type:        'side',
    chapter:     0,
    autoStart:   false,
    objectives:  [
      { id: 'get_letter',    type: 'item', target: 'letter_for_yonah', desc: '手紙を受け取る',       required: 1, current: 0 },
      { id: 'deliver_letter', type: 'flag', target: 'letter_delivered', desc: 'ヨナに手紙を届ける', required: 1, current: 0 },
    ],
    rewards:     { xp: 40, gold: 20, items: ['healing_herb', 'healing_herb'] },
    completionFlag:   'side_03_done',
    completionDialog: 'side_03_complete',
  },
};
