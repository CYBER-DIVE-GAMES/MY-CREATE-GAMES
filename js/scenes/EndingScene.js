// ============================================================
// EndingScene - エンディングシーン
// ============================================================
class EndingScene extends Phaser.Scene {
  constructor() { super({ key: 'Ending' }); }

  init(data) {
    this._endingId = (data && data.endingId) || 'normal';
  }

  create() {
    const W = GameConfig.WIDTH, H = GameConfig.HEIGHT;
    AudioManager.stopBGM();

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000);

    const isTrue = this._endingId === 'true';

    // エンディングテキスト
    const stories = isTrue ? [
      '── 真のエンディング ──',
      '',
      '古代の守護者は倒れた。',
      '「封印の詩節」は静かに輝き、ニーアの手の中で溶けていった。',
      '',
      'その瞬間、ワイスの声が聞こえた。',
      '「ニーア……シェードは……人間だったのだ。',
      '　千年前の大災害で、魂と肉体が引き離されてしまった。',
      '　彼らは……ただ、帰りたかっただけなのだよ。」',
      '',
      'ニーアはしばらく黙っていた。',
      'そして、静かに言った。',
      '「それでも……ヨナを助けたかった。',
      '　それは……間違いじゃないはずだ。」',
      '',
      'ヨナの病は癒えた。',
      '世界の傷は、まだ深い。',
      'だが、二人はまた歩き始めた。',
      '',
      '── fin. ──',
    ] : [
      '── エンディング ──',
      '',
      '長い戦いが終わった。',
      '「封印の詩節」の力でヨナの病は消え去った。',
      '',
      'ヨナは久しぶりに外の空気を吸い、笑顔を見せた。',
      '「ありがとう、お兄ちゃん。',
      '　世界中を旅してきたんでしょ？」',
      '',
      'ニーアは少し照れながら答えた。',
      '「たいしたことじゃないよ。',
      '　ただ……帰ってきたかっただけだから。」',
      '',
      'ワイスが口を挟む。',
      '「全くもって感動的だな。',
      '　ところで礼はいらんのか？」',
      '',
      'ヨナが笑う。',
      'ニーアも笑う。',
      'そして世界は、少しだけ明るくなった。',
      '',
      '── fin. ──',
    ];

    // テキストをスクロール表示
    let scrollGroup = this.add.container(W / 2, H + 40);
    let totalH = 0;

    stories.forEach((line, i) => {
      const isHeading = line.startsWith('──');
      const style = isHeading
        ? { ...GameConfig.FONT.LARGE, color: '#daa520' }
        : GameConfig.FONT.PRIMARY;
      const txt = this.add.text(0, totalH, line, style).setOrigin(0.5, 0);
      scrollGroup.add(txt);
      totalH += line === '' ? 12 : 28;
    });

    // クレジット（テキスト後）
    const credits = [
      '', '',
      '── クレジット ──', '',
      'SHADOW ECHO',
      'シャドウエコー — 失われた魂の物語',
      '',
      'Engine: Phaser 3',
      'Graphics: Procedural (no external assets)',
      'Audio: Web Audio API',
      '',
      'ニーアレプリカントへの敬意を込めて',
      '',
      '─────────────────',
    ];
    credits.forEach(line => {
      const isHead = line.startsWith('──');
      const style  = isHead ? { ...GameConfig.FONT.LARGE, color: '#8888aa' } : GameConfig.FONT.SMALL;
      const t = this.add.text(0, totalH, line, { ...style, color: isHead ? '#8888aa' : '#666666' }).setOrigin(0.5, 0);
      scrollGroup.add(t);
      totalH += line === '' ? 12 : 24;
    });

    // スクロールアニメーション
    const scrollDist = H + 80 + totalH;
    const duration   = scrollDist * 28; // 1px = 28ms

    this.tweens.add({
      targets:  scrollGroup,
      y:        -totalH,
      duration: duration,
      ease:     'Linear',
      onComplete: () => {
        this.time.delayedCall(1500, () => {
          this.scene.start('Title');
        });
      },
    });

    // スキップ
    this.input.keyboard.once('keydown', () => {
      this.tweens.killTweensOf(scrollGroup);
      this.scene.start('Title');
    });

    this.add.text(W - 8, H - 8, 'キーを押すとスキップ',
      { ...GameConfig.FONT.TINY, color: '#333333' }).setOrigin(1, 1);

    // BGM (title をエンディング用に再利用)
    this.time.delayedCall(500, () => AudioManager.playBGM('title'));
  }
}
