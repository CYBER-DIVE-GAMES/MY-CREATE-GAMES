// ============================================================
// AudioManager - Web Audio API による効果音・BGM 管理
// ============================================================
window.AudioManager = (function () {
  let ctx = null;
  let bgmNode = null;
  let bgmGain = null;
  let sfxGain = null;
  let bgmVol = 0.35;
  let sfxVol = 0.6;
  let currentBgm = null;
  let bgmLoopTimer = null;

  // ---------- 音楽シーケンス定義 ----------
  const NOTE = { C4:261.6,D4:293.7,E4:329.6,F4:349.2,G4:392.0,A4:440.0,B4:493.9,
                 C5:523.3,D5:587.3,E5:659.3,F5:698.5,G5:784.0,A5:880.0,
                 C3:130.8,D3:146.8,E3:164.8,G3:196.0,A3:220.0,B3:246.9,
                 Bb4:466.2, Ab4:415.3, Eb5:622.3, F3:174.6 };

  const BGM = {
    title: {
      bpm: 72, loop: true,
      tracks: [
        { wave:'sine',   vol:0.4, notes:[
          [NOTE.E4,2],[NOTE.D4,2],[NOTE.C4,4],[NOTE.G4,2],[NOTE.F4,2],[NOTE.E4,4],
          [NOTE.A4,2],[NOTE.G4,2],[NOTE.F4,2],[NOTE.E4,2],[NOTE.D4,4],[0,4],
        ]},
        { wave:'triangle', vol:0.2, notes:[
          [NOTE.C3,4],[NOTE.G3,4],[NOTE.A3,4],[NOTE.E3,4],
          [NOTE.F3,4],[NOTE.C3,4],[NOTE.D3,4],[0,4],
        ]},
      ],
    },
    village: {
      bpm: 80, loop: true,
      tracks: [
        { wave:'sine', vol:0.35, notes:[
          [NOTE.C4,2],[0,1],[NOTE.E4,2],[NOTE.G4,1],[NOTE.A4,2],[0,2],
          [NOTE.G4,2],[NOTE.F4,2],[NOTE.E4,2],[NOTE.D4,2],[NOTE.C4,4],
          [NOTE.A4,2],[NOTE.G4,2],[NOTE.F4,2],[NOTE.E4,2],[NOTE.D4,2],[NOTE.C4,2],
        ]},
        { wave:'triangle', vol:0.18, notes:[
          [NOTE.C3,4],[NOTE.G3,4],[NOTE.F3,4],[NOTE.G3,4],
          [NOTE.C3,4],[NOTE.A3,4],[NOTE.G3,4],[0,4],
        ]},
      ],
    },
    forest: {
      bpm: 65, loop: true,
      tracks: [
        { wave:'sine', vol:0.30, notes:[
          [NOTE.A3,3],[NOTE.C4,1],[NOTE.E4,3],[0,1],[NOTE.D4,4],
          [NOTE.F4,3],[NOTE.E4,1],[NOTE.D4,2],[NOTE.C4,2],[NOTE.A3,4],
          [NOTE.G3,2],[NOTE.A3,2],[NOTE.C4,4],[0,4],
        ]},
        { wave:'sawtooth', vol:0.08, notes:[
          [NOTE.A3,8],[NOTE.D3,8],[NOTE.E3,8],[0,8],
        ]},
      ],
    },
    temple: {
      bpm: 60, loop: true,
      tracks: [
        { wave:'triangle', vol:0.28, notes:[
          [NOTE.A3,4],[NOTE.Bb4,2],[NOTE.A3,2],[0,2],[NOTE.G3,4],[0,2],
          [NOTE.F3,4],[NOTE.G3,2],[NOTE.A3,2],[0,4],
        ]},
        { wave:'sawtooth', vol:0.10, notes:[
          [NOTE.A3,4],[0,4],[NOTE.E3,4],[0,4],
          [NOTE.D3,4],[0,4],[NOTE.A3,4],[0,4],
        ]},
      ],
    },
    boss: {
      bpm: 140, loop: true,
      tracks: [
        { wave:'sawtooth', vol:0.28, notes:[
          [NOTE.A3,1],[NOTE.A3,1],[NOTE.A3,2],[NOTE.G3,1],[NOTE.A3,1],[NOTE.A3,2],
          [NOTE.F3,1],[NOTE.F3,1],[NOTE.G3,2],[NOTE.A3,4],
          [NOTE.D4,1],[NOTE.D4,1],[NOTE.D4,2],[NOTE.C4,1],[NOTE.D4,1],[0,2],
        ]},
        { wave:'square', vol:0.12, notes:[
          [NOTE.A3,2],[0,2],[NOTE.E3,2],[0,2],[NOTE.A3,2],[0,2],[NOTE.D3,4],
        ]},
      ],
    },
    gameover: {
      bpm: 55, loop: false,
      tracks: [
        { wave:'sine', vol:0.30, notes:[
          [NOTE.A4,2],[NOTE.G4,2],[NOTE.F4,2],[NOTE.E4,2],
          [NOTE.D4,4],[NOTE.C4,6],[0,2],
        ]},
      ],
    },
  };

  // ---------- ヘルパー ----------
  function _ctx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function _makeMaster() {
    if (bgmGain) return;
    const c = _ctx();
    bgmGain = c.createGain(); bgmGain.gain.value = bgmVol; bgmGain.connect(c.destination);
    sfxGain = c.createGain(); sfxGain.gain.value = sfxVol; sfxGain.connect(c.destination);
  }

  function _playTrack(track, bpm, startTime, c) {
    const beatDur = 60 / bpm;
    let t = startTime;
    const gain = c.createGain();
    gain.gain.value = track.vol;
    gain.connect(bgmGain);

    track.notes.forEach(([freq, beats]) => {
      if (freq > 0) {
        const osc = c.createOscillator();
        osc.type = track.wave;
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(t);
        const dur = beats * beatDur;
        gain.gain.setValueAtTime(track.vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.95);
        osc.stop(t + dur);
      }
      t += beats * beatDur;
    });
    return t - startTime; // total duration
  }

  function _calcBgmDuration(bgmKey) {
    const spec = BGM[bgmKey];
    if (!spec) return 4;
    const beatDur = 60 / spec.bpm;
    let maxBeats = 0;
    spec.tracks.forEach(tr => {
      const beats = tr.notes.reduce((s, [, b]) => s + b, 0);
      if (beats > maxBeats) maxBeats = beats;
    });
    return maxBeats * beatDur;
  }

  function _scheduleBgm(bgmKey, startTime) {
    const spec = BGM[bgmKey];
    if (!spec) return;
    const c = _ctx();
    spec.tracks.forEach(tr => _playTrack(tr, spec.bpm, startTime, c));
    return _calcBgmDuration(bgmKey);
  }

  // ---------- 公開API ----------
  return {
    init() { _makeMaster(); },

    playBGM(key) {
      if (currentBgm === key) return;
      this.stopBGM();
      _makeMaster();
      currentBgm = key;
      const spec = BGM[key];
      if (!spec) return;

      const startNow = () => {
        const c = _ctx();
        if (c.state === 'suspended') c.resume();
        const dur = _scheduleBgm(key, c.currentTime);
        if (spec.loop) {
          bgmLoopTimer = setInterval(() => {
            if (currentBgm !== key) { clearInterval(bgmLoopTimer); return; }
            const c2 = _ctx();
            _scheduleBgm(key, c2.currentTime);
          }, (dur - 0.1) * 1000);
        }
      };

      // ユーザーインタラクション後に再生
      if (_ctx().state === 'running') {
        startNow();
      } else {
        _ctx().resume().then(startNow);
      }
    },

    stopBGM() {
      if (bgmLoopTimer) { clearInterval(bgmLoopTimer); bgmLoopTimer = null; }
      currentBgm = null;
      // 既存の BGM gain をフェードアウト
      if (bgmGain) {
        const c = _ctx();
        bgmGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.3);
        setTimeout(() => {
          bgmGain.gain.value = bgmVol;
        }, 350);
      }
    },

    playSFX(key) {
      _makeMaster();
      const c = _ctx();
      if (c.state === 'suspended') c.resume();
      const t = c.currentTime;

      const g = c.createGain();
      g.gain.value = sfxVol;
      g.connect(sfxGain);

      const sfxMap = {
        attack:     () => { const o=c.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(300,t); o.frequency.exponentialRampToValueAtTime(80,t+0.1); g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.12); o.connect(g); o.start(t); o.stop(t+0.15); },
        heavy_attack:()=>{ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(180,t); o.frequency.exponentialRampToValueAtTime(50,t+0.2); g.gain.setValueAtTime(0.7,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.22); o.connect(g); o.start(t); o.stop(t+0.25); },
        hit:        () => { const o=c.createOscillator(); o.type='square'; o.frequency.setValueAtTime(220,t); o.frequency.exponentialRampToValueAtTime(60,t+0.08); g.gain.setValueAtTime(0.4,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1); o.connect(g); o.start(t); o.stop(t+0.12); },
        player_hit: () => { const o=c.createOscillator(); o.type='square'; o.frequency.setValueAtTime(150,t); g.gain.setValueAtTime(0.6,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.15); o.connect(g); o.start(t); o.stop(t+0.18); },
        enemy_die:  () => { [0,0.04,0.08].forEach((d,i)=>{ const o=c.createOscillator(); const gg=c.createGain(); o.type='sawtooth'; o.frequency.value=200-i*40; gg.gain.setValueAtTime(0.4,t+d); gg.gain.exponentialRampToValueAtTime(0.001,t+d+0.15); o.connect(gg); gg.connect(sfxGain); o.start(t+d); o.stop(t+d+0.2); }); },
        boss_die:   () => { for(let i=0;i<5;i++){ const d=i*0.08; const o=c.createOscillator(); const gg=c.createGain(); o.type='sawtooth'; o.frequency.value=300-i*50; gg.gain.setValueAtTime(0.5,t+d); gg.gain.exponentialRampToValueAtTime(0.001,t+d+0.3); o.connect(gg); gg.connect(sfxGain); o.start(t+d); o.stop(t+d+0.35); } },
        magic:      () => { const o=c.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(880,t); o.frequency.exponentialRampToValueAtTime(1760,t+0.15); g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2); o.connect(g); o.start(t); o.stop(t+0.22); },
        level_up:   () => { [NOTE.C4,NOTE.E4,NOTE.G4,NOTE.C5].forEach((f,i)=>{ const d=i*0.12; const o=c.createOscillator(); const gg=c.createGain(); o.type='sine'; o.frequency.value=f; gg.gain.setValueAtTime(0.45,t+d); gg.gain.exponentialRampToValueAtTime(0.001,t+d+0.3); o.connect(gg); gg.connect(sfxGain); o.start(t+d); o.stop(t+d+0.35); }); },
        item_get:   () => { [NOTE.G4,NOTE.A4,NOTE.C5].forEach((f,i)=>{ const d=i*0.08; const o=c.createOscillator(); const gg=c.createGain(); o.type='sine'; o.frequency.value=f; gg.gain.setValueAtTime(0.35,t+d); gg.gain.exponentialRampToValueAtTime(0.001,t+d+0.18); o.connect(gg); gg.connect(sfxGain); o.start(t+d); o.stop(t+d+0.22); }); },
        menu_select:() => { const o=c.createOscillator(); o.type='sine'; o.frequency.value=NOTE.A4; g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); o.connect(g); o.start(t); o.stop(t+0.1); },
        menu_move:  () => { const o=c.createOscillator(); o.type='sine'; o.frequency.value=NOTE.E4; g.gain.setValueAtTime(0.15,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.05); o.connect(g); o.start(t); o.stop(t+0.07); },
        save:       () => { [NOTE.C4,NOTE.G4].forEach((f,i)=>{ const d=i*0.1; const o=c.createOscillator(); const gg=c.createGain(); o.type='sine'; o.frequency.value=f; gg.gain.setValueAtTime(0.3,t+d); gg.gain.exponentialRampToValueAtTime(0.001,t+d+0.25); o.connect(gg); gg.connect(sfxGain); o.start(t+d); o.stop(t+d+0.3); }); },
        dodge:      () => { const o=c.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(600,t); o.frequency.exponentialRampToValueAtTime(200,t+0.08); g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.1); o.connect(g); o.start(t); o.stop(t+0.12); },
        combo:      () => { const o=c.createOscillator(); o.type='square'; o.frequency.setValueAtTime(500,t); o.frequency.exponentialRampToValueAtTime(250,t+0.06); g.gain.setValueAtTime(0.3,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.08); o.connect(g); o.start(t); o.stop(t+0.1); },
      };

      if (sfxMap[key]) sfxMap[key]();
    },

    setVolume(bgm, sfx) {
      bgmVol = bgm;
      sfxVol = sfx;
      if (bgmGain) bgmGain.gain.value = bgm;
      if (sfxGain) sfxGain.gain.value = sfx;
    },

    getBgmVol() { return bgmVol; },
    getSfxVol() { return sfxVol; },
    getCurrentBgm() { return currentBgm; },

    resumeContext() {
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
  };
})();
