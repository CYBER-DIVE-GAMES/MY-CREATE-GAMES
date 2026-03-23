// ============================================================
// js/managers/SoundManager.js
// Web Audio API を使ったプロシージャル効果音・BGM管理
// 外部ファイル不要：全てオシレーター/ノイズで生成します
// ============================================================

'use strict';

const SOUND = (() => {
    // ============================================================
    // AudioContext（ブラウザのオーディオエンジン）
    // ユーザー操作後に初期化する（autoplay policy対策）
    // ============================================================
    let _ctx = null;
    let _masterGain = null;
    let _bgmNodes = [];       // BGMノード群（停止時にまとめて止める）
    let _bgmPlaying = false;
    let _bgmGain = null;

    // BGMのテンポ管理
    let _bgmBPM = 128;
    let _bgmBarTime = 0;
    let _bgmScheduledUntil = 0;
    let _bgmStepIndex = 0;
    let _bgmTimerId = null;

    // ============================================================
    // _init()
    // AudioContext を初期化する（最初のユーザー操作時に呼ぶ）
    // ============================================================
    function _init() {
        if (_ctx) return; // 既に初期化済み
        try {
            _ctx = new (window.AudioContext || window.webkitAudioContext)();
            _masterGain = _ctx.createGain();
            _masterGain.gain.value = 0.6;
            _masterGain.connect(_ctx.destination);
        } catch (e) {
            console.warn('[SoundManager] Web Audio API not supported:', e);
        }
    }

    // ============================================================
    // resume()
    // ユーザー操作後に AudioContext を再開する
    // Phaser の入力イベントから呼ぶこと
    // ============================================================
    function resume() {
        _init();
        if (_ctx && _ctx.state === 'suspended') {
            _ctx.resume();
        }
    }

    // ============================================================
    // _note(freq, type, startTime, duration, gainVal, destNode)
    // 指定した周波数・波形でオシレーターを鳴らす汎用関数
    // ============================================================
    function _note(freq, type, startTime, duration, gainVal, destNode) {
        if (!_ctx) return;
        const osc = _ctx.createOscillator();
        const g   = _ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, startTime);
        g.gain.setValueAtTime(gainVal || 0.3, startTime);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(g);
        g.connect(destNode || _masterGain);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.01);
    }

    // ============================================================
    // _noise(startTime, duration, gainVal, filterFreq, destNode)
    // ホワイトノイズを生成してローパスフィルタで整形する
    // 爆発・打撃音などに使用
    // ============================================================
    function _noise(startTime, duration, gainVal, filterFreq, destNode) {
        if (!_ctx) return;
        const bufLen  = Math.ceil(_ctx.sampleRate * duration) + 1024;
        const buffer  = _ctx.createBuffer(1, bufLen, _ctx.sampleRate);
        const data    = buffer.getChannelData(0);
        for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;

        const src    = _ctx.createBufferSource();
        src.buffer   = buffer;

        const filter = _ctx.createBiquadFilter();
        filter.type  = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq || 2000, startTime);

        const g = _ctx.createGain();
        g.gain.setValueAtTime(gainVal || 0.4, startTime);
        g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        src.connect(filter);
        filter.connect(g);
        g.connect(destNode || _masterGain);
        src.start(startTime);
        src.stop(startTime + duration + 0.05);
    }

    // ============================================================
    // SE: 各種効果音
    // ============================================================

    // 直線弾発射音
    function playStraightShot() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _note(880, 'square', t,       0.05, 0.18);
        _note(660, 'square', t + 0.02, 0.04, 0.10);
    }

    // 拡散弾発射音（ちょっとブレる感じ）
    function playSpreadShot() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        for (let i = 0; i < 3; i++) {
            _note(700 + i * 60, 'sawtooth', t + i * 0.015, 0.07, 0.12);
        }
    }

    // 追尾弾発射音（ビューン感）
    function playHomingShot() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        const osc = _ctx.createOscillator();
        const g   = _ctx.createGain();
        osc.type  = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        osc.connect(g);
        g.connect(_masterGain);
        osc.start(t);
        osc.stop(t + 0.18);
    }

    // 爆発弾発射音
    function playExplosionShot() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _note(220, 'sawtooth', t, 0.15, 0.20);
        _noise(t, 0.18, 0.30, 800);
    }

    // レーザー発射音（ビーン持続音）
    function playLaserStart() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _note(1200, 'sawtooth', t, 0.30, 0.15);
        _note(600,  'square',   t, 0.30, 0.10);
    }

    // レールガン発射音（重いドン！）
    function playRailgun() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _noise(t, 0.25, 0.50, 3000);
        _note(180, 'square', t, 0.20, 0.30);
        _note(90,  'sine',   t, 0.35, 0.25);
    }

    // ミサイルストーム発射音（ドドドド）
    function playMissileStorm() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        for (let i = 0; i < 4; i++) {
            _noise(t + i * 0.04, 0.12, 0.20, 1200);
            _note(160 + i * 20, 'sawtooth', t + i * 0.04, 0.10, 0.15);
        }
    }

    // ============================================================
    // 命中エフェクト音
    // ============================================================

    // 通常命中
    function playHit() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _noise(t, 0.08, 0.20, 1500);
        _note(440, 'square', t, 0.05, 0.10);
    }

    // 爆発命中（大きな爆発）
    function playExplosionHit() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _noise(t, 0.35, 0.55, 600);
        _note(110, 'sine',     t, 0.30, 0.30);
        _note(80,  'sawtooth', t + 0.05, 0.25, 0.20);
    }

    // レーザー命中（チリチリ）
    function playLaserHit() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _note(2200, 'sine', t, 0.04, 0.08);
        _note(1800, 'sine', t + 0.02, 0.03, 0.06);
    }

    // ============================================================
    // プレイヤーダメージ音
    // ============================================================
    function playPlayerHit() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _noise(t, 0.15, 0.40, 3000);
        _note(300, 'sawtooth', t, 0.12, 0.20);
    }

    // ============================================================
    // 敵撃破音
    // ============================================================
    function playEnemyDie() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _noise(t, 0.18, 0.25, 1200);
        _note(200, 'square', t, 0.10, 0.12);
        _note(100, 'sine',   t + 0.05, 0.12, 0.10);
    }

    // ============================================================
    // レベルアップ音（明るいアルペジオ）
    // ============================================================
    function playLevelUp() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        const chord = [523, 659, 784, 1047]; // C5 E5 G5 C6
        chord.forEach((freq, i) => {
            _note(freq, 'sine', t + i * 0.08, 0.25, 0.18);
        });
        // キラキラ感
        _note(2093, 'triangle', t + 0.35, 0.20, 0.10);
    }

    // ============================================================
    // 強化選択音
    // ============================================================
    function playUpgradeSelect() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _note(784, 'sine', t,       0.10, 0.20);
        _note(988, 'sine', t + 0.08, 0.10, 0.20);
        _note(1175,'sine', t + 0.16, 0.12, 0.22);
    }

    // ============================================================
    // ボス出現音（警告）
    // ============================================================
    function playBossAppear() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        // 重いサイレン風
        _note(220, 'sawtooth', t,       0.40, 0.35);
        _note(165, 'sawtooth', t + 0.35, 0.40, 0.35);
        _note(220, 'sawtooth', t + 0.70, 0.40, 0.35);
        _noise(t, 0.15, 0.20, 500);
        _noise(t + 0.70, 0.15, 0.20, 500);
    }

    // ============================================================
    // ボス撃破音（大爆発）
    // ============================================================
    function playBossDie() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _noise(t, 0.60, 0.70, 800);
        _noise(t + 0.10, 0.50, 0.50, 400);
        _note(110, 'sine',     t, 0.50, 0.35);
        _note(80,  'sawtooth', t + 0.15, 0.45, 0.30);
        _note(60,  'sine',     t + 0.30, 0.40, 0.25);
        // 勝利的な高音
        _note(880, 'sine', t + 0.55, 0.20, 0.15);
        _note(1320,'sine', t + 0.65, 0.20, 0.12);
    }

    // ============================================================
    // コイン取得音
    // ============================================================
    function playCoin() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _note(1047, 'sine', t,       0.07, 0.20);
        _note(1319, 'sine', t + 0.06, 0.07, 0.18);
    }

    // ============================================================
    // XP取得音
    // ============================================================
    function playXpPickup() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        _note(659, 'triangle', t, 0.06, 0.12);
    }

    // ============================================================
    // ゲームオーバー音
    // ============================================================
    function playGameOver() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        const notes = [440, 370, 311, 262]; // Am下降
        notes.forEach((freq, i) => {
            _note(freq, 'sawtooth', t + i * 0.20, 0.30, 0.20);
        });
        _noise(t + 0.70, 0.40, 0.25, 600);
    }

    // ============================================================
    // ステージクリア音
    // ============================================================
    function playStageClear() {
        if (!_ctx) return;
        const t = _ctx.currentTime;
        const fanfare = [523, 659, 784, 1047, 1319, 1568]; // Cメジャースケール上昇
        fanfare.forEach((freq, i) => {
            _note(freq, 'sine', t + i * 0.10, 0.30, 0.20);
        });
        _note(2093, 'sine', t + 0.65, 0.50, 0.15);
    }

    // ============================================================
    // BGM: シンセウェーブ風ループ
    // ============================================================

    // BGMのベースラインノート（0が休符）
    const _baseLine = [
        55, 55, 0, 55,  65, 65, 0, 65,
        49, 49, 0, 49,  58, 58, 0, 58
    ];
    // BGMのメロディーライン
    const _melodyLine = [
        220, 0, 262, 0,  294, 0, 330, 262,
        220, 0, 196, 0,  175, 0, 196, 220
    ];
    // BGMのコードパッド（和音ルート）
    const _chordLine = [
        110, 0, 0, 0,   130, 0, 0, 0,
        98,  0, 0, 0,   116, 0, 0, 0
    ];

    function _scheduleBGMStep(stepIdx, time) {
        if (!_ctx || !_bgmGain) return;

        const beatDur = 60 / _bgmBPM;
        const step    = stepIdx % _baseLine.length;

        // --- ベース ---
        if (_baseLine[step]) {
            _note(_baseLine[step], 'square', time, beatDur * 0.9, 0.22, _bgmGain);
        }

        // --- メロディー ---
        if (_melodyLine[step]) {
            _note(_melodyLine[step], 'triangle', time, beatDur * 0.75, 0.14, _bgmGain);
        }

        // --- コードパッド（低い和音）---
        if (_chordLine[step]) {
            _note(_chordLine[step] * 2,  'sawtooth', time, beatDur * 3.8, 0.06, _bgmGain);
            _note(_chordLine[step] * 2.5,'sawtooth', time, beatDur * 3.8, 0.05, _bgmGain);
        }

        // --- ドラム（ビート） ---
        // キック: 偶数拍
        if (step % 4 === 0) {
            _noise(time, 0.18, 0.30, 300,  _bgmGain);
            _note(80, 'sine', time, 0.15, 0.25, _bgmGain);
        }
        // スネア: 2拍・4拍目
        if (step % 4 === 2) {
            _noise(time, 0.12, 0.22, 4000, _bgmGain);
        }
        // ハイハット: 全拍
        _noise(time, 0.04, 0.08, 8000, _bgmGain);
    }

    // BGMスケジューラー（少し先まで先行スケジュール）
    function _bgmScheduler() {
        if (!_bgmPlaying || !_ctx) return;
        const beatDur    = 60 / _bgmBPM;
        const lookahead  = 0.2; // 200ms先まで先行

        while (_bgmScheduledUntil < _ctx.currentTime + lookahead) {
            _scheduleBGMStep(_bgmStepIndex, _bgmScheduledUntil);
            _bgmScheduledUntil += beatDur;
            _bgmStepIndex++;
        }
    }

    // ============================================================
    // startBGM()
    // BGMを開始する
    // ============================================================
    function startBGM() {
        if (!_ctx || _bgmPlaying) return;
        _bgmPlaying = true;

        _bgmGain = _ctx.createGain();
        _bgmGain.gain.value = 0.45;
        _bgmGain.connect(_masterGain);

        _bgmStepIndex      = 0;
        _bgmScheduledUntil = _ctx.currentTime + 0.05;

        // スケジューラーを50msごとに呼ぶ
        _bgmTimerId = setInterval(_bgmScheduler, 50);
        _bgmScheduler();
    }

    // ============================================================
    // stopBGM()
    // BGMを停止する（フェードアウト付き）
    // ============================================================
    function stopBGM() {
        if (!_bgmPlaying) return;
        _bgmPlaying = false;
        clearInterval(_bgmTimerId);
        _bgmTimerId = null;

        if (_bgmGain && _ctx) {
            _bgmGain.gain.setValueAtTime(_bgmGain.gain.value, _ctx.currentTime);
            _bgmGain.gain.exponentialRampToValueAtTime(0.0001, _ctx.currentTime + 0.5);
            setTimeout(() => {
                if (_bgmGain) {
                    try { _bgmGain.disconnect(); } catch(e) {}
                    _bgmGain = null;
                }
            }, 600);
        }
    }

    // ============================================================
    // ボス戦BGM（テンポアップ・短ループ）
    // ============================================================
    function startBossBGM() {
        stopBGM();
        if (!_ctx) return;

        _bgmBPM = 160; // テンポアップ
        _bgmPlaying = true;

        _bgmGain = _ctx.createGain();
        _bgmGain.gain.value = 0.50;
        _bgmGain.connect(_masterGain);

        _bgmStepIndex      = 0;
        _bgmScheduledUntil = _ctx.currentTime + 0.05;

        _bgmTimerId = setInterval(_bgmScheduler, 50);
        _bgmScheduler();
    }

    function resetBGMTempo() {
        _bgmBPM = 128;
    }

    // ============================================================
    // playWeaponShot(weaponType)
    // 武器タイプに応じた発射音を再生するディスパッチャー
    // ============================================================
    function playWeaponShot(weaponType) {
        switch (weaponType) {
            case 'straightShot':  playStraightShot(); break;
            case 'spreadShot':    playSpreadShot();   break;
            case 'homingBullet':  playHomingShot();   break;
            case 'explosion':     playExplosionShot();break;
            case 'laser':         playLaserStart();   break;
            case 'railgun':       playRailgun();      break;
            case 'missileStorm':  playMissileStorm(); break;
            default:              playStraightShot(); break;
        }
    }

    // ============================================================
    // playHitEffect(weaponType)
    // 武器タイプに応じた命中音を再生するディスパッチャー
    // ============================================================
    function playHitEffect(weaponType) {
        switch (weaponType) {
            case 'explosion':
            case 'missileStorm': playExplosionHit(); break;
            case 'laser':
            case 'railgun':      playLaserHit();     break;
            default:             playHit();          break;
        }
    }

    // ============================================================
    // 公開 API
    // ============================================================
    return {
        resume,
        startBGM,
        stopBGM,
        startBossBGM,
        resetBGMTempo,
        playWeaponShot,
        playHitEffect,
        playHit,
        playPlayerHit,
        playEnemyDie,
        playLevelUp,
        playUpgradeSelect,
        playBossAppear,
        playBossDie,
        playCoin,
        playXpPickup,
        playGameOver,
        playStageClear,
        playExplosionHit,
        playLaserStart,
        playLaserHit,
    };
})();
