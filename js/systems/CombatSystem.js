// ============================================================
// CombatSystem - 戦闘計算・ダメージ表示
// ============================================================
window.CombatSystem = (function () {

  function _randBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  return {
    // 通常ダメージ計算
    calcDamage(atkStat, defStat) {
      const base = Math.max(1, atkStat - defStat * 0.4);
      const roll = _randBetween(0.85, 1.15);
      return Math.floor(base * roll);
    },

    // 魔法ダメージ (防御半無視)
    calcMagicDamage(atkStat) {
      const base = atkStat * GameConfig.PLAYER.MAGIC_DAMAGE_MULTIPLIER;
      return Math.floor(base * _randBetween(0.9, 1.1));
    },

    // クリティカル判定（10%確率、2倍）
    isCrit() {
      return Math.random() < 0.10;
    },

    // プレイヤー攻撃の最終ダメージ
    playerAttackDamage(comboIndex = 0, isHeavy = false, isMagic = false) {
      const p = GameState.player;
      if (isMagic) return this.calcMagicDamage(p.atk);

      const mult = isHeavy
        ? GameConfig.PLAYER.HEAVY_DAMAGE_MULTIPLIER
        : (GameConfig.PLAYER.ATTACK_DAMAGE_MULTIPLIERS[comboIndex] || 1.0);

      let dmg = this.calcDamage(p.atk * mult, 0);
      let crit = this.isCrit();
      if (crit) dmg *= 2;
      return { damage: dmg, crit };
    },

    // 敵の攻撃ダメージ計算
    enemyAttackDamage(enemyAtk) {
      const p = GameState.player;
      return this.calcDamage(enemyAtk, p.def);
    },

    // ダメージをプレイヤーに与える（ゲームオーバーチェック付き）
    damagePlayer(amount, scene) {
      const p = GameState.player;
      const actual = Math.max(1, amount);
      GameState.setHp(p.hp - actual);
      this.showDamageNumber(scene, 480, 220, actual, 'player');
      AudioManager.playSFX('player_hit');
      if (p.hp <= 0) EventBus.emit(EV.GAME_OVER);
    },

    // ダメージを敵に与える
    damageEnemy(enemy, amount, crit = false) {
      if (!enemy || !enemy.active || enemy.state === 'dead') return 0;
      const actual = Math.max(1, amount);
      enemy.hp = Math.max(0, enemy.hp - actual);
      const scene = enemy.scene;
      this.showDamageNumber(scene, enemy.x, enemy.y - enemy.displayHeight / 2, actual, crit ? 'crit' : 'damage');
      AudioManager.playSFX('hit');
      if (enemy.hp <= 0) enemy.die();
      else enemy.onHit();
      return actual;
    },

    // HP回復
    healPlayer(amount, scene) {
      const p = GameState.player;
      const before = p.hp;
      GameState.healHp(amount);
      const healed = p.hp - before;
      this.showDamageNumber(scene, 480, 220, healed, 'heal');
    },

    // フローティングダメージ数字
    showDamageNumber(scene, x, y, amount, type = 'damage') {
      if (!scene) return;
      let style;
      let text = String(Math.floor(amount));
      switch (type) {
        case 'crit':    style = GameConfig.FONT.CRIT;   text = text + '!!'; break;
        case 'heal':    style = GameConfig.FONT.HEAL;   text = '+' + text;  break;
        case 'magic':   style = GameConfig.FONT.MAGIC;  break;
        case 'player':  style = GameConfig.FONT.DAMAGE; break;
        default:        style = GameConfig.FONT.DAMAGE; break;
      }

      const txt = scene.add.text(x + _randBetween(-12, 12), y, text, style);
      txt.setOrigin(0.5, 1);
      txt.setDepth(GameConfig.DEPTH.EFFECTS + 1);

      scene.tweens.add({
        targets:  txt,
        y:        y - 60,
        alpha:    0,
        duration: 900,
        ease:     'Power2',
        onComplete: () => txt.destroy(),
      });
    },

    // エフェクト: ヒットフラッシュ
    hitFlash(sprite, color = 0xff4444, duration = 120) {
      if (!sprite || !sprite.active) return;
      sprite.setTintFill(color);
      sprite.scene.time.delayedCall(duration, () => {
        if (sprite && sprite.active) sprite.clearTint();
      });
    },

    // エフェクト: 死亡パーティクル
    deathEffect(scene, x, y, size = 'medium') {
      const colors = [0x5a1070, 0x3d0050, 0x8020a0, 0xff1010];
      const count  = size === 'boss' ? 20 : size === 'medium' ? 10 : 6;
      for (let i = 0; i < count; i++) {
        const gfx = scene.add.graphics();
        const c   = colors[Math.floor(Math.random() * colors.length)];
        const sz  = _randBetween(3, 10);
        gfx.fillStyle(c, 1);
        gfx.fillCircle(0, 0, sz);
        gfx.setPosition(x, y);
        gfx.setDepth(GameConfig.DEPTH.EFFECTS);

        const angle = Math.random() * Math.PI * 2;
        const speed = _randBetween(40, 140);
        scene.tweens.add({
          targets:  gfx,
          x:        x + Math.cos(angle) * speed,
          y:        y + Math.sin(angle) * speed,
          alpha:    0,
          duration: _randBetween(400, 900),
          ease:     'Power2',
          onComplete: () => gfx.destroy(),
        });
      }
    },
  };
})();
