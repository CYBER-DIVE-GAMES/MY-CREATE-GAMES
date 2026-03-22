// ===== フィールド管理 =====

const field = {
  message(text) {
    document.getElementById('field-message').textContent = text;
  },

  updateStatus() {
    document.getElementById('field-hp').textContent = `${player.hp} / ${player.maxHp}`;
    document.getElementById('field-mp').textContent = `${player.mp} / ${player.maxMp}`;
    document.getElementById('field-lv').textContent = player.lv;
  },

  // ランダムエンカウント
  encounter() {
    // レベルに応じて出現する敵を絞る
    const maxIndex = Math.min(player.lv + 1, ENEMIES.length - 1);
    const minIndex = Math.max(0, player.lv - 2);
    const pool = ENEMIES.slice(minIndex, maxIndex + 1);
    const enemy = pool[Math.floor(Math.random() * pool.length)];
    showScreen('screen-battle');
    battle.start(enemy, false);
  },

  // ボス戦
  fightBoss() {
    showScreen('screen-battle');
    battle.start(BOSS, true);
  },

  // 休む
  rest() {
    player.rest();
    this.updateStatus();
    this.message('🏕 テントを張って休んだ。HP・MPが全回復し、ポーションを1個拾った！');
  },
};
