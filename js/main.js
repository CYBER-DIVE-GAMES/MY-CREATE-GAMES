// ===== 画面切り替え =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  if (id === 'screen-field') {
    field.updateStatus();
  }
  if (id === 'screen-status') {
    updateStatusScreen();
  }
}

// ===== ステータス画面更新 =====
function updateStatusScreen() {
  document.getElementById('st-name').textContent   = player.name;
  document.getElementById('st-lv').textContent     = player.lv;
  document.getElementById('st-hp').textContent     = `${player.hp} / ${player.maxHp}`;
  document.getElementById('st-mp').textContent     = `${player.mp} / ${player.maxMp}`;
  document.getElementById('st-atk').textContent    = player.atk;
  document.getElementById('st-mag').textContent    = player.mag;
  document.getElementById('st-def').textContent    = player.def;
  document.getElementById('st-exp').textContent    = player.exp;
  document.getElementById('st-next').textContent   = player.nextExp();
  document.getElementById('st-potion').textContent = `${player.potions} 個`;
}

// ===== イベント登録 =====
document.addEventListener('DOMContentLoaded', () => {

  // --- タイトル ---
  document.getElementById('btn-start').addEventListener('click', () => {
    player.init();
    field.message('冒険が始まった！魔王を倒して世界を救え！');
    showScreen('screen-field');
  });

  // --- フィールド ---
  document.getElementById('btn-battle').addEventListener('click', () => {
    field.encounter();
  });

  document.getElementById('btn-rest').addEventListener('click', () => {
    field.rest();
  });

  document.getElementById('btn-status').addEventListener('click', () => {
    showScreen('screen-status');
  });

  document.getElementById('btn-boss').addEventListener('click', () => {
    if (player.lv < 5) {
      field.message('⚠ まだ力が足りない！ Lv5 以上で魔王に挑める！');
      return;
    }
    field.fightBoss();
  });

  // --- ステータス ---
  document.getElementById('btn-back-field').addEventListener('click', () => {
    showScreen('screen-field');
  });

  // --- 戦闘コマンド ---
  document.querySelectorAll('.cmd-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'attack') {
        battle.doAttack();
      } else if (action === 'magic') {
        document.getElementById('battle-commands').classList.add('hidden');
        document.getElementById('magic-menu').classList.remove('hidden');
      } else if (action === 'item') {
        document.getElementById('battle-commands').classList.add('hidden');
        document.getElementById('item-menu').classList.remove('hidden');
      } else if (action === 'run') {
        battle.doRun();
      }
    });
  });

  // --- 魔法メニュー ---
  document.querySelectorAll('.magic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const spell = btn.dataset.spell;
      if (spell === 'back') {
        document.getElementById('magic-menu').classList.add('hidden');
        document.getElementById('battle-commands').classList.remove('hidden');
        return;
      }
      document.getElementById('magic-menu').classList.add('hidden');
      document.getElementById('battle-commands').classList.remove('hidden');
      battle.doMagic(spell);
    });
  });

  // --- アイテムメニュー ---
  document.querySelectorAll('.item-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.dataset.item;
      if (item === 'back') {
        document.getElementById('item-menu').classList.add('hidden');
        document.getElementById('battle-commands').classList.remove('hidden');
        return;
      }
      document.getElementById('item-menu').classList.add('hidden');
      document.getElementById('battle-commands').classList.remove('hidden');
      battle.doItem(item);
    });
  });

  // --- ゲームオーバー ---
  document.getElementById('btn-retry').addEventListener('click', () => {
    player.init();
    field.message('再び立ち上がった...');
    showScreen('screen-field');
  });

  // --- クリア ---
  document.getElementById('btn-retry-clear').addEventListener('click', () => {
    player.init();
    field.message('新たな冒険が始まった！');
    showScreen('screen-field');
  });
});
