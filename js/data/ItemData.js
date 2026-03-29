// ============================================================
// ItemData - アイテムデータ定義
// ============================================================
window.ItemData = {

  // ---- 消耗品 ----
  healing_herb: {
    id: 'healing_herb', name: '回復草', nameEn: 'Healing Herb',
    description: '野生の薬草。傷ついた体を癒す。HP+40',
    type: 'consumable', subtype: 'heal',
    effect: { hp: 40 }, value: 30,
    icon: '🌿',
  },
  healing_potion: {
    id: 'healing_potion', name: '回復薬', nameEn: 'Healing Potion',
    description: '薬師が調合した回復薬。HP+120',
    type: 'consumable', subtype: 'heal',
    effect: { hp: 120 }, value: 100,
    icon: '🧪',
  },
  ether_bottle: {
    id: 'ether_bottle', name: 'エーテル瓶', nameEn: 'Ether Bottle',
    description: '魔力を満たした小瓶。MP+50',
    type: 'consumable', subtype: 'mp',
    effect: { mp: 50 }, value: 80,
    icon: '💧',
  },

  // ---- 素材・収集 ----
  dark_crystal: {
    id: 'dark_crystal', name: '闇結晶', nameEn: 'Dark Crystal',
    description: '影から採れる不思議な結晶。売却できる。',
    type: 'material', value: 25, icon: '💎',
  },
  ancient_scroll: {
    id: 'ancient_scroll', name: '古代の巻物', nameEn: 'Ancient Scroll',
    description: '古代文字で記された巻物。何かの手がかりになるかもしれない。',
    type: 'material', value: 80, icon: '📜',
  },

  // ---- 武器 ----
  iron_sword: {
    id: 'iron_sword', name: '鉄の剣', nameEn: 'Iron Sword',
    description: '村の鍛冶屋が作った頑丈な剣。',
    type: 'weapon', slot: 'weapon',
    atk: 12, value: 150, icon: '⚔️',
  },
  steel_sword: {
    id: 'steel_sword', name: '鋼の剣', nameEn: 'Steel Sword',
    description: '高品質の鋼で鍛えられた剣。鋭い切れ味を持つ。',
    type: 'weapon', slot: 'weapon',
    atk: 25, value: 400, icon: '⚔️',
  },
  ancient_blade: {
    id: 'ancient_blade', name: '古代の刃', nameEn: 'Ancient Blade',
    description: '神殿の奥で発見された古代の剣。謎の力が宿っている。',
    type: 'weapon', slot: 'weapon',
    atk: 40, value: 1000, icon: '🗡️',
  },

  // ---- 防具 ----
  leather_armor: {
    id: 'leather_armor', name: '革の鎧', nameEn: 'Leather Armor',
    description: '丈夫な革で作られた軽い鎧。',
    type: 'armor', slot: 'armor',
    def: 6, value: 120, icon: '🛡️',
  },
  iron_armor: {
    id: 'iron_armor', name: '鉄の鎧', nameEn: 'Iron Armor',
    description: '全身を覆う鉄製の鎧。重いが防御力が高い。',
    type: 'armor', slot: 'armor',
    def: 14, value: 350, icon: '🛡️',
  },

  // ---- 重要アイテム ----
  grimoire_fragment: {
    id: 'grimoire_fragment', name: '封印の詩節', nameEn: 'Sealed Verse',
    description: '古代の魔導書「グリモア・ワイス」の断片。輝く光を放っている。',
    type: 'key', value: 0, icon: '📖',
  },
  black_scrawl_cure: {
    id: 'black_scrawl_cure', name: '黒文病の治療薬', nameEn: 'Black Scrawl Cure',
    description: 'ヨナの病を治す唯一の薬。長い旅の果てに手に入れた。',
    type: 'key', value: 0, icon: '✨',
  },
  letter_for_yonah: {
    id: 'letter_for_yonah', name: 'ヨナへの手紙', nameEn: "Letter for Yonah",
    description: 'ある村人からヨナへの手紙。',
    type: 'key', value: 0, icon: '📨',
  },
};
