// ===== 戦闘システム =====

const battle = {
  enemy: null,
  enemyMaxHp: 0,
  isBoss: false,
  isPlayerTurn: true,

  // 戦闘開始
  start(enemyData, isBoss = false) {
    this.enemy = { ...enemyData };
    this.enemyMaxHp = enemyData.hp;
    this.isBoss = isBoss;
    this.isPlayerTurn = true;
    this._render();
    this._log('clear');
    this._log(`${this.enemy.name} が現れた！`);
    this._setCommandsEnabled(true);
  },

  // ===== アクション =====

  doAttack() {
    if (!this.isPlayerTurn) return;
    this._setCommandsEnabled(false);
    const dmg = this._calcDamage(player.atk, this.enemy.def);
    this.enemy.hp -= dmg;
    this._log(`⚔ ${this.enemy.name} に ${dmg} のダメージ！`);
    this._render();
    if (this._checkEnemyDead()) return;
    setTimeout(() => this._enemyTurn(), 800);
  },

  doMagic(spellKey) {
    if (!this.isPlayerTurn) return;
    const spell = SPELLS[spellKey];
    if (player.mp < spell.cost) {
      this._log('MPが足りない！');
      this._showCommands();
      return;
    }
    this._setCommandsEnabled(false);
    player.mp -= spell.cost;

    if (spell.heal) {
      const h = spell.heal(player.mag);
      player.hp = Math.min(player.hp + h, player.maxHp);
      this._log(`${spell.message} HP が ${h} 回復した！`);
      this._render();
      setTimeout(() => this._enemyTurn(), 800);
    } else {
      const dmg = spell.damage(player.mag);
      this.enemy.hp -= dmg;
      this._log(`${spell.message} ${this.enemy.name} に ${dmg} のダメージ！`);
      this._render();
      if (this._checkEnemyDead()) return;
      setTimeout(() => this._enemyTurn(), 800);
    }
  },

  doItem(itemKey) {
    if (!this.isPlayerTurn) return;
    if (itemKey === 'potion') {
      const h = player.usePotion();
      if (h === false) {
        this._log('ポーションを持っていない！');
        this._showCommands();
        return;
      }
      this._setCommandsEnabled(false);
      this._log(`🧪 ポーションを飲んだ！ HP が ${h} 回復した！`);
      this._render();
      setTimeout(() => this._enemyTurn(), 800);
    }
  },

  doRun() {
    if (this.isBoss) {
      this._log('魔王からは逃げられない！');
      this._showCommands();
      return;
    }
    if (Math.random() < 0.5) {
      this._log('🏃 逃げ出した！');
      setTimeout(() => showScreen('screen-field'), 800);
    } else {
      this._log('逃げられなかった！');
      this._setCommandsEnabled(false);
      setTimeout(() => this._enemyTurn(), 800);
    }
  },

  // ===== 内部処理 =====

  _enemyTurn() {
    const dmg = Math.max(1, this._calcDamage(this.enemy.atk, player.def));
    player.hp -= dmg;
    player.hp = Math.max(0, player.hp);
    this._log(`👹 ${this.enemy.name} の攻撃！ ${dmg} のダメージ！`);
    this._render();
    if (player.isDead()) {
      this._log('力尽きてしまった...');
      setTimeout(() => showScreen('screen-gameover'), 1000);
      return;
    }
    this._setCommandsEnabled(true);
    this._showCommands();
  },

  _checkEnemyDead() {
    if (this.enemy.hp <= 0) {
      this.enemy.hp = 0;
      this._render();
      this._log(`${this.enemy.name} を倒した！`);
      const lvMsgs = player.gainExp(this.enemy.exp);
      lvMsgs.forEach(m => this._log(m));
      player.potions = Math.min(player.potions + (this.isBoss ? 0 : 0), 5);
      setTimeout(() => {
        if (this.isBoss) {
          showScreen('screen-clear');
          document.getElementById('clear-stats').textContent =
            `Lv ${player.lv} | 経験値 ${player.exp}`;
        } else {
          field.message(`${this.enemy.name} を倒した！ 経験値 ${this.enemy.exp} 獲得！`);
          showScreen('screen-field');
        }
      }, 1200);
      return true;
    }
    return false;
  },

  _calcDamage(atk, def) {
    const base = Math.max(1, atk - def);
    const variance = Math.floor(base * 0.2);
    return base + Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  },

  _log(text) {
    const log = document.getElementById('battle-log');
    if (text === 'clear') {
      log.innerHTML = '';
      return;
    }
    const p = document.createElement('p');
    p.textContent = text;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  },

  _render() {
    // 敵
    const pct = Math.max(0, this.enemy.hp / this.enemyMaxHp * 100);
    document.getElementById('enemy-hp-bar').style.width = pct + '%';
    document.getElementById('enemy-hp-text').textContent =
      `HP: ${Math.max(0, this.enemy.hp)} / ${this.enemyMaxHp}`;
    document.getElementById('enemy-name').textContent = this.enemy.name;
    document.getElementById('enemy-sprite').textContent = this.enemy.sprite;

    // プレイヤー
    document.getElementById('battle-player-hp').textContent =
      `${player.hp} / ${player.maxHp}`;
    document.getElementById('battle-player-mp').textContent =
      `${player.mp} / ${player.maxMp}`;
    document.getElementById('battle-player-lv').textContent = player.lv;
    document.getElementById('item-potion-count').textContent = player.potions;
  },

  _setCommandsEnabled(enabled) {
    document.querySelectorAll('.cmd-btn, .magic-btn, .item-btn').forEach(btn => {
      btn.disabled = !enabled;
    });
  },

  _showCommands() {
    document.getElementById('battle-commands').classList.remove('hidden');
    document.getElementById('magic-menu').classList.add('hidden');
    document.getElementById('item-menu').classList.add('hidden');
  },
};
