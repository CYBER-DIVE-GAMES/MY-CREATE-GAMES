// ============================================================
// StoryData - ストーリー・ダイアログデータ
// ============================================================
window.StoryData = {

  dialogs: {

    // ---- オープニング ----
    intro_weiss: {
      lines: [
        { speaker: '', text: '──世界が壊れて、千年が過ぎた。' },
        { speaker: '', text: '人々は廃墟の中で息をひそめ、空には黒い砂が舞っていた。' },
        { speaker: '', text: '影（シェード）と呼ばれる怪物が跋扈し、夜ごと村を脅かしていた。' },
        { speaker: '', text: 'そして今日も、ある若者が剣を手に立ち上がる──' },
        { speaker: 'ワイス', text: 'やれやれ。また目が覚めてしまった。ここはどこだ？', portrait: 'weiss' },
        { speaker: 'ニーア', text: '！　誰だ！　本が喋った！', portrait: 'nier' },
        { speaker: 'ワイス', text: '本とは失礼な。我は「グリモア・ワイス」。古代の知識を宿した偉大なる魔導書だ。', portrait: 'weiss' },
        { speaker: 'ニーア', text: 'どうでもいい。ヨナが病気なんだ。助けてくれるなら何でも聞く。', portrait: 'nier' },
        { speaker: 'ワイス', text: '……ふむ。黒文病か。ならば我が「封印の詩節」の場所を知っている。', portrait: 'weiss' },
        { speaker: 'ワイス', text: '共に旅をしろ。詩節を集めれば、その病を治す力が手に入る。', portrait: 'weiss' },
        { speaker: 'ニーア', text: 'わかった。一緒に来てくれ、ワイス。', portrait: 'nier' },
      ],
    },

    intro_village: {
      lines: [
        { speaker: '', text: '──失われた村。かつては賑わいを見せたこの地も、今は廃墟と静寂の中にある。' },
        { speaker: 'ワイス', text: '詩節の気配を感じる。この村の廃墟に、何か手がかりがあるはずだ。', portrait: 'weiss' },
        { speaker: 'ニーア', text: 'まずポポラさんに話を聞いてみよう。', portrait: 'nier' },
      ],
    },

    // ---- ポポラ ----
    popola_first: {
      lines: [
        { speaker: 'ポポラ', text: 'ニーア……また剣を持って出かけようとしているの？', portrait: 'popola' },
        { speaker: 'ニーア', text: 'ヨナを助けたいんだ。「封印の詩節」のことを教えてくれ。', portrait: 'nier' },
        { speaker: 'ポポラ', text: '……そう。あなたたちの力が必要な時が来たのね。', portrait: 'popola' },
        { speaker: 'ポポラ', text: 'この村の廃墟の奥に、古代の魔法陣がある。そこに詩節の断片があるはず。', portrait: 'popola' },
        { speaker: 'ポポラ', text: 'でも、気をつけて。影が増えているわ。無理はしないで。', portrait: 'popola' },
        { speaker: 'ニーア', text: 'ありがとう、ポポラさん。', portrait: 'nier' },
      ],
      onComplete: [{ setFlag: 'talked_popola', value: true }],
    },

    popola_quest_side01: {
      lines: [
        { speaker: 'ポポラ', text: 'そうだ、ニーア。村に体の弱い人がいてね。', portrait: 'popola' },
        { speaker: 'ポポラ', text: '回復草を5つ集めてきてもらえると助かるんだけど…', portrait: 'popola' },
        { speaker: 'ニーア', text: 'もちろん。森の近くに生えてたな。', portrait: 'nier' },
      ],
      startQuest: 'side_01',
    },

    popola_quest_side02: {
      lines: [
        { speaker: 'ポポラ', text: '最近、村の外れに影が多くてね。見張りが怖がって仕事ができないの。', portrait: 'popola' },
        { speaker: 'ポポラ', text: '10体ほど倒してもらえると、みんなが安心できるんだけど。', portrait: 'popola' },
        { speaker: 'ニーア', text: 'わかった。任せてくれ。', portrait: 'nier' },
      ],
      startQuest: 'side_02',
    },

    // ---- ヨナ ----
    yonah_sick: {
      lines: [
        { speaker: 'ヨナ', text: 'お兄ちゃん……また行くの？', portrait: 'yonah' },
        { speaker: 'ニーア', text: 'すぐ戻る。ヨナを治す薬を必ず見つけてくるから。', portrait: 'nier' },
        { speaker: 'ヨナ', text: '……うん。信じてる。', portrait: 'yonah' },
        { speaker: 'ヨナ', text: 'でも、無理はしないで。ヨナはお兄ちゃんに帰ってきてほしいだけだから。', portrait: 'yonah' },
        { speaker: 'ニーア', text: '（胸が締め付けられる。絶対に諦めない）', portrait: 'nier' },
      ],
    },

    yonah_letter: {
      lines: [
        { speaker: 'ヨナ', text: 'これ、手紙？誰から？', portrait: 'yonah' },
        { speaker: 'ニーア', text: '村のあの人から。「元気でいてくれ」って。', portrait: 'nier' },
        { speaker: 'ヨナ', text: 'ありがとう……皆、優しいね。', portrait: 'yonah' },
        { speaker: 'ヨナ', text: 'ヨナ、早く良くなって、みんなにお礼がしたい。', portrait: 'yonah' },
      ],
      onComplete: [{ setFlag: 'letter_delivered', value: true }],
    },

    // ---- 村人 ----
    villager_a: {
      lines: [
        { speaker: '村人', text: 'ニーアさん。最近、北の廃墟に変な影が出るって噂ですよ。' },
        { speaker: 'ニーア', text: 'わかった。気をつける。', portrait: 'nier' },
      ],
    },

    villager_b_letter: {
      lines: [
        { speaker: '老人', text: 'ニーア……頼みがある。この手紙を、ヨナちゃんに渡してくれるか。' },
        { speaker: '老人', text: '足が悪くて、自分では行けないんじゃ。' },
        { speaker: 'ニーア', text: 'もちろん。任せてください。', portrait: 'nier' },
      ],
      giveItem: 'letter_for_yonah',
      startQuest: 'side_03',
    },

    // ---- 森エリア ----
    forest_entry: {
      lines: [
        { speaker: 'ワイス', text: '深い森か。ここには強力な影が住み着いている。', portrait: 'weiss' },
        { speaker: 'ニーア', text: '大丈夫。ヨナのためなら、どんな敵も倒す。', portrait: 'nier' },
        { speaker: 'ワイス', text: '……その覚悟、覚えておこう。', portrait: 'weiss' },
      ],
      onComplete: [{ setFlag: 'entered_forest', value: true }],
    },

    forest_scroll_found: {
      lines: [
        { speaker: 'ワイス', text: '！　これは……古代の文字で書かれた巻物だ。', portrait: 'weiss' },
        { speaker: 'ニーア', text: '何て書いてある？', portrait: 'nier' },
        { speaker: 'ワイス', text: '「封印の詩節は、時の終わりを見守る守護者の胸に宿る」……', portrait: 'weiss' },
        { speaker: 'ワイス', text: '古代の神殿だ。そこに主たる詩節が眠っているに違いない。', portrait: 'weiss' },
        { speaker: 'ニーア', text: 'じゃあ次は神殿へ向かおう。', portrait: 'nier' },
      ],
      onComplete: [{ setFlag: 'has_fragment_hint', value: true }],
    },

    // ---- 神殿 ----
    temple_entry: {
      lines: [
        { speaker: 'ワイス', text: 'ここが古代の神殿……圧倒的な魔力を感じる。', portrait: 'weiss' },
        { speaker: 'ニーア', text: '奥に何かいる。大きな影が見える。', portrait: 'nier' },
        { speaker: 'ワイス', text: 'あれが守護者だ。千年もの間、この場所を守り続けた存在。', portrait: 'weiss' },
        { speaker: 'ワイス', text: 'ニーア……今から言うことをよく聞いてくれ。', portrait: 'weiss' },
        { speaker: 'ワイス', text: 'シェードは……かつて人間だったのかもしれない。', portrait: 'weiss' },
        { speaker: 'ニーア', text: '何？', portrait: 'nier' },
        { speaker: 'ワイス', text: '千年前の大災害で、肉体を失った魂が影となった。彼らは体を取り戻したがっている。', portrait: 'weiss' },
        { speaker: 'ニーア', text: 'それでも……ヨナを助けるために、倒さなければならない。', portrait: 'nier' },
        { speaker: 'ワイス', text: 'わかっている。行こう。', portrait: 'weiss' },
      ],
      onComplete: [{ setFlag: 'entered_temple', value: true }, { setFlag: 'truth_revealed', value: true }],
    },

    boss_pre: {
      lines: [
        { speaker: '？？？', text: '……ニンゲン……ナゼ、コノ場所ヲ犯ス……', portrait: 'boss' },
        { speaker: 'ニーア', text: 'どけ。ヨナを助けるためだ。', portrait: 'nier' },
        { speaker: '？？？', text: 'ワレハ……千年……待ッテイタ……帰リタカッタ……', portrait: 'boss' },
        { speaker: 'ニーア', text: 'っ……（これは……泣いているのか？）', portrait: 'nier' },
        { speaker: 'ワイス', text: 'ニーア。迷うな。今は前を向け。', portrait: 'weiss' },
        { speaker: 'ニーア', text: '……わかった。ヨナのために、戦う！', portrait: 'nier' },
      ],
    },

    boss_defeated: {
      lines: [
        { speaker: '？？？', text: 'アリガトウ……ヤット……アノ子ノ……トコロニ……', portrait: 'boss' },
        { speaker: '', text: '巨大な影は静かに消えていった。' },
        { speaker: '', text: 'その場に、光り輝く詩節の断片が残された。' },
        { speaker: 'ニーア', text: 'これが……「封印の詩節」……', portrait: 'nier' },
        { speaker: 'ワイス', text: 'ニーア。お前は今日、怪物を倒したのではない。', portrait: 'weiss' },
        { speaker: 'ワイス', text: '永い眠りに就いていた魂を、解放してやったのだ。', portrait: 'weiss' },
        { speaker: 'ニーア', text: 'ヨナの元に帰ろう。', portrait: 'nier' },
      ],
      onComplete: [{ setFlag: 'boss_defeated', value: true }],
    },

    // ---- エンディング ----
    ending_begin: {
      lines: [
        { speaker: '', text: '詩節の力で、ヨナの病は消えた。' },
        { speaker: 'ヨナ', text: 'お兄ちゃん……体が……軽い。', portrait: 'yonah' },
        { speaker: 'ニーア', text: 'よかった……本当に、よかった……', portrait: 'nier' },
        { speaker: 'ワイス', text: 'やれやれ。人間とはつくづく感情的な生き物だな。', portrait: 'weiss' },
        { speaker: 'ヨナ', text: 'ありがとう、ワイスさんも。', portrait: 'yonah' },
        { speaker: 'ワイス', text: 'ふ……どういたしまして。', portrait: 'weiss' },
      ],
    },

    // ---- クエスト完了 ----
    main_01_complete: {
      lines: [
        { speaker: 'ポポラ', text: 'よくやったわ。次は深い森へ向かってみて。', portrait: 'popola' },
        { speaker: 'ポポラ', text: '危険だから、十分に準備をしてからね。', portrait: 'popola' },
      ],
    },
    main_02_complete: {
      lines: [
        { speaker: 'ワイス', text: '巻物の謎が解けた。次は古代の神殿だ。', portrait: 'weiss' },
        { speaker: 'ニーア', text: 'もう少しだ、ヨナ。待っていてくれ。', portrait: 'nier' },
      ],
    },
    side_01_complete: {
      lines: [
        { speaker: 'ポポラ', text: 'ありがとう！ 村の皆が助かるわ。', portrait: 'popola' },
        { speaker: 'ニーア', text: '大したことじゃないよ。', portrait: 'nier' },
      ],
    },
    side_02_complete: {
      lines: [
        { speaker: 'ポポラ', text: '見張りたちも安心して仕事ができるようになったわ。本当にありがとう。', portrait: 'popola' },
      ],
    },
    side_03_complete: {
      lines: [
        { speaker: '老人', text: 'ヨナちゃんに届けてくれたか。ありがとう。ニーアには本当に感謝しておる。' },
      ],
    },

    // ---- セーブポイント ----
    save_point: {
      lines: [
        { speaker: '', text: '光の柱が、静かにあなたを包んだ。' },
        {
          speaker: '', text: 'ゲームをセーブしますか？',
          choices: [
            { text: 'はい、セーブする', next: '_save_yes' },
            { text: 'いいえ', next: '_save_no' },
          ],
        },
      ],
    },

    // ---- 操作説明 ----
    controls_hint: {
      lines: [
        { speaker: 'ワイス', text: '覚えておくがよい。移動は WASD か矢印キーだ。', portrait: 'weiss' },
        { speaker: 'ワイス', text: 'Z キーで攻撃。続けて押せばコンボになる。', portrait: 'weiss' },
        { speaker: 'ワイス', text: 'X キーで強攻撃。C キーで魔法を放てる。', portrait: 'weiss' },
        { speaker: 'ワイス', text: 'Shift キーでロール回避。無敵時間が短いから慎重に使え。', portrait: 'weiss' },
        { speaker: 'ワイス', text: 'E キーで NPCに話しかけ、ESC でメニューが開く。', portrait: 'weiss' },
        { speaker: 'ニーア', text: 'わかった。やってみる。', portrait: 'nier' },
      ],
    },
  },
};
