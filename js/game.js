// ============================================================
// game.js - デスク・ウォーズ (Desk Wars)
// Pure HTML5 Canvas + JavaScript  - No external libraries
// ============================================================

// ===================== 定数 =====================
const CW = 800, CH = 450;
const GROUND_Y  = 360;
const PLAYER_BASE_X = 80;
const ENEMY_BASE_X  = 720;
const PLAYER_SPAWN_X = 130;
const ENEMY_SPAWN_X  = 670;

const SCENE = { TITLE:'TITLE', MAP:'MAP', BATTLE:'BATTLE',
                BUFF_SELECT:'BUFF_SELECT', RESULT:'RESULT', GAME_OVER:'GAME_OVER' };

// ===================== プレイヤーユニット定義 =====================
const PLAYER_DEFS = [
  { id:'clip',    name:'クリップ',  key:'1', cost:20, hp:80,  atk:12, def:0, spd:75, range:45,  atkInt:800,  isRanged:false, color:'#5577cc', w:22, h:28 },
  { id:'eraser',  name:'消しゴム',  key:'2', cost:40, hp:220, atk:10, def:4, spd:35, range:48,  atkInt:1400, isRanged:false, color:'#ee88aa', w:34, h:24 },
  { id:'scissors',name:'ハサミ',    key:'3', cost:55, hp:90,  atk:22, def:1, spd:58, range:110, atkInt:1100, isRanged:true,  color:'#888888', w:20, h:34 },
  { id:'pencil',  name:'鉛筆',      key:'4', cost:65, hp:110, atk:28, def:2, spd:55, range:150, atkInt:1000, isRanged:true,  color:'#ffcc33', w:14, h:42 },
  { id:'ruler',   name:'定規',      key:'5', cost:85, hp:160, atk:20, def:3, spd:42, range:55,  atkInt:600,  isRanged:false, color:'#44aadd', w:56, h:12,
    isSplash:true, splashRadius:55 }
];

// ===================== 敵ユニット定義 =====================
const ENEMY_DEFS = [
  { id:'thumbtack',   name:'画鋲',       hp:55,  atk:8,  def:0, spd:60, range:45,  atkInt:1000, isRanged:false, color:'#cc4444', w:20, h:20 },
  { id:'paperclip',   name:'クリップ兵', hp:45,  atk:6,  def:0, spd:90, range:45,  atkInt:750,  isRanged:false, color:'#cc7744', w:18, h:26 },
  { id:'tape',        name:'テープ',     hp:200, atk:6,  def:4, spd:28, range:45,  atkInt:1800, isRanged:false, color:'#8888cc', w:30, h:30 },
  { id:'stapler',     name:'ホチキス',   hp:90,  atk:20, def:2, spd:38, range:150, atkInt:1400, isRanged:true,  color:'#445566', w:36, h:22 },
  { id:'correction',  name:'修正テープ', hp:110, atk:14, def:1, spd:48, range:120, atkInt:1100, isRanged:true,  color:'#ddddcc', w:28, h:24 }
];

const BOSS_DEF = {
  id:'sharpener', name:'巨大鉛筆削り', hp:3000, atk:45, def:12, spd:18, range:90, atkInt:2000,
  isRanged:false, isBoss:true, color:'#884422', w:72, h:64,
  skillInterval:7000, skillRange:160, isSplash:true, splashRadius:70
};

// ===================== バフ定義 =====================
const ALL_BUFFS = [
  { id:'atk_up',   name:'攻撃力強化',    desc:'全ユニット攻撃力 +10%', color:'#ff8844',
    apply: s => s.attackMult   = +(( s.attackMult||1)+0.10).toFixed(2) },
  { id:'hp_up',    name:'耐久力強化',    desc:'全ユニット HP +15%',   color:'#44cc44',
    apply: s => s.hpMult       = +((s.hpMult||1)+0.15).toFixed(2) },
  { id:'ink_regen',name:'インク回復',    desc:'インク回復速度 +10%',   color:'#4488ff',
    apply: s => s.inkRegenMult = +((s.inkRegenMult||1)+0.10).toFixed(2) },
  { id:'ink_max',  name:'タンク拡張',    desc:'インク最大量 +20%',     color:'#44cccc',
    apply: s => s.inkMaxMult   = +((s.inkMaxMult||1)+0.20).toFixed(2) },
  { id:'spd_up',   name:'行進強化',      desc:'移動速度 +10%',         color:'#ffcc44',
    apply: s => s.speedMult    = +((s.speedMult||1)+0.10).toFixed(2) },
  { id:'atkspd',   name:'連撃訓練',      desc:'攻撃速度 +15%',         color:'#ff4488',
    apply: s => s.atkSpdMult   = +((s.atkSpdMult||1)+0.15).toFixed(2) },
  { id:'cost_dn',  name:'コスト削減',    desc:'召喚コスト -10%',       color:'#aaffaa',
    apply: s => s.costMult     = Math.max(0.5, +((s.costMult||1)-0.10).toFixed(2)) },
  { id:'def_up',   name:'防御強化',      desc:'防御力 +3',             color:'#8844ff',
    apply: s => s.defBonus     = (s.defBonus||0)+3 },
  { id:'double',   name:'二連撃',        desc:'30%で2回攻撃',          color:'#ff8800',
    apply: s => s.doubleChance = Math.min(0.9,(s.doubleChance||0)+0.30) }
];

// ===================== ユーティリティ =====================
const rng  = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
const pick = arr   => arr[Math.floor(Math.random()*arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=rng(0,i);[a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function clamp(v,lo,hi){ return Math.max(lo,Math.min(hi,v)); }
function lerp(a,b,t){ return a+(b-a)*t; }

// ===================== パーティクル =====================
class InkParticle {
  constructor(x,y,color){
    this.x=x; this.y=y; this.color=color||'#4488ff';
    this.vx=(Math.random()-0.5)*120; this.vy=(Math.random()-1.2)*100;
    this.life=1.0; this.decay=Math.random()*1.5+1.5;
    this.r=Math.random()*3+1;
  }
  update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.vy+=180*dt; this.life-=this.decay*dt; }
  draw(ctx){ if(this.life<=0)return; ctx.save(); ctx.globalAlpha=Math.max(0,this.life); ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill(); ctx.restore(); }
  dead(){ return this.life<=0; }
}

class PaperParticle {
  constructor(x,y){
    this.x=x; this.y=y;
    this.vx=(Math.random()-0.5)*80; this.vy=-Math.random()*80-20;
    this.rot=Math.random()*Math.PI*2; this.rotv=(Math.random()-0.5)*8;
    this.life=1.0; this.decay=Math.random()*0.8+0.8;
    this.w=rng(4,10); this.h=rng(3,7);
    this.color=`hsl(${rng(40,60)},${rng(10,30)}%,${rng(70,90)}%)`;
  }
  update(dt){ this.x+=this.vx*dt; this.y+=this.vy*dt; this.vy+=200*dt; this.rot+=this.rotv*dt; this.life-=this.decay*dt; }
  draw(ctx){ if(this.life<=0)return; ctx.save(); ctx.globalAlpha=Math.max(0,this.life); ctx.translate(this.x,this.y); ctx.rotate(this.rot); ctx.fillStyle=this.color; ctx.fillRect(-this.w/2,-this.h/2,this.w,this.h); ctx.restore(); }
  dead(){ return this.life<=0; }
}

class SuctionRing {
  constructor(x,y,maxR){
    this.x=x; this.y=y; this.maxR=maxR; this.r=0; this.life=1.0;
  }
  update(dt){ this.r+=this.maxR*dt*0.8; this.life-=dt*1.2; }
  draw(ctx){ if(this.life<=0)return; ctx.save(); ctx.globalAlpha=Math.max(0,this.life)*0.5; ctx.strokeStyle='#ff8844'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.stroke(); ctx.restore(); }
  dead(){ return this.life<=0; }
}

// ===================== ダメージ数値 =====================
class DamageNumber {
  constructor(x,y,dmg,isEnemy){
    this.x=x; this.y=y; this.dmg=dmg; this.isEnemy=isEnemy;
    this.vy=-60; this.life=1.0; this.decay=1.8;
  }
  update(dt){ this.y+=this.vy*dt; this.vy*=0.95; this.life-=this.decay*dt; }
  draw(ctx){ if(this.life<=0)return; ctx.save(); ctx.globalAlpha=Math.max(0,this.life); ctx.font='bold 12px monospace'; ctx.textAlign='center'; ctx.fillStyle=this.isEnemy?'#ff4444':'#ffcc44'; ctx.strokeStyle='#000'; ctx.lineWidth=3; ctx.strokeText('-'+this.dmg,this.x,this.y); ctx.fillText('-'+this.dmg,this.x,this.y); ctx.restore(); }
  dead(){ return this.life<=0; }
}

// ===================== 飛び道具 =====================
class Projectile {
  constructor(sx,sy,target,dmg,color,isEnemy,isSplash,splashR,units){
    this.x=sx; this.y=sy; this.target=target; this.dmg=dmg;
    this.color=color||'#ffcc44'; this.isEnemy=isEnemy;
    this.isSplash=isSplash||false; this.splashR=splashR||0;
    this.units=units; // all units array for splash
    this.speed=320; this.dead=false;
  }
  update(dt){
    if(this.dead)return;
    if(!this.target||this.target.isDead){ this.dead=true; return; }
    const dx=this.target.x-this.x, dy=this.target.y-this.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<8){ this.hit(); return; }
    const s=this.speed*dt/dist;
    this.x+=dx*s; this.y+=dy*s;
  }
  hit(){
    if(this.dead)return; this.dead=true;
    if(this.isSplash && this.splashR>0){
      for(const u of this.units){
        if(u.isDead) continue;
        if(u.isEnemy !== this.isEnemy && Math.abs(u.x-this.x)<this.splashR)
          u.takeDamage(this.dmg);
      }
    } else {
      if(!this.target.isDead) this.target.takeDamage(this.dmg);
    }
  }
  draw(ctx){
    if(this.dead)return;
    ctx.save(); ctx.fillStyle=this.color;
    ctx.beginPath(); ctx.arc(this.x,this.y,4,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }
}

// ===================== Unit クラス =====================
class Unit extends Entity {
  constructor(x,y,def,isEnemy,buffs){
    const b=buffs||{};
    const hm=b.hpMult||1, am=b.attackMult||1, sm=b.speedMult||1, asm=b.atkSpdMult||1;
    super(x, y, def.w, def.h, {
      hp:    Math.round(def.hp   * hm),
      attack:Math.round(def.atk  * am),
      defense:(def.def||0)+(b.defBonus||0),
      speed: Math.round(def.spd  * sm),
      range: def.range,
      attackInterval: Math.round((def.atkInt||1000) / (asm)),
      isEnemy, isRanged:def.isRanged||false,
      isBoss:def.isBoss||false, isSplash:def.isSplash||false,
      splashRadius:def.splashRadius||0, color:def.color
    });
    this.defId = def.id;
    this.defRef = def;
    this.costMult = b.costMult||1;
    this.doubleChance = b.doubleChance||0;
    // Death animation state
    this.deathTimer = 0;
    this.deathDuration = 500;
    this.particles = [];     // local particle list passed from scene
    this.damageNums = [];
    this.allUnits = null;    // set by battle scene after creation
    this.projectiles = null; // set by battle scene after creation
    // Boss skill
    this.skillCooldown = 0;
  }

  update(dt, now, playerUnits, enemyUnits, particles, damageNums, projectiles){
    if(this.isDead){
      this.deathTimer += dt;
      this.alpha = Math.max(0, 1 - this.deathTimer/this.deathDuration);
      return;
    }
    this.updateFlash(dt*1000);

    const enemies = this.isEnemy ? playerUnits : enemyUnits;
    this.target = this.findTarget(enemies);

    // Boss skill
    if(this.isBoss && this.defRef.skillInterval){
      this.skillCooldown -= dt*1000;
      if(this.skillCooldown <= 0){
        this.skillCooldown = this.defRef.skillInterval;
        this.activateSuctionSkill(playerUnits, particles);
      }
    }

    if(this.target && !this.target.isDead){
      const dist = this.distanceTo(this.target);
      if(dist <= this.range){
        this.state = ENTITY_STATE.ATTACK;
        if(now - this.lastAttackTime >= this.attackInterval){
          this.performAttack(this.target, enemies, particles, damageNums, projectiles, now);
          this.lastAttackTime = now;
        }
      } else {
        this.state = ENTITY_STATE.WALK;
        this.x += (this.isEnemy ? -1 : 1) * this.speed * dt;
      }
    } else {
      this.state = ENTITY_STATE.WALK;
      this.x += (this.isEnemy ? -1 : 1) * this.speed * dt;
    }
  }

  findTarget(enemies){
    let best=null, bestDist=Infinity;
    for(const e of enemies){
      if(e.isDead) continue;
      const d = this.distanceTo(e);
      if(d < bestDist){ bestDist=d; best=e; }
    }
    return best;
  }

  performAttack(target, enemies, particles, damageNums, projectiles, now){
    const dealDmg = (t, dmgAmt) => {
      if(!t||t.isDead) return;
      const d = t.takeDamage(dmgAmt);
      if(d>0){
        damageNums.push(new DamageNumber(t.x, t.y - t.height*0.5 - 10, d, this.isEnemy));
        // Ink splatter particles
        const col = this.isEnemy ? '#ff4444' : '#4488ff';
        for(let i=0;i<5;i++) particles.push(new InkParticle(t.x, t.y, col));
        if(t.isDead){ for(let i=0;i<4;i++) particles.push(new PaperParticle(t.x, t.y)); }
      }
    };

    if(this.isRanged){
      const splash = this.isSplash;
      const allUnits = enemies.concat(this.isEnemy ? [] : []);
      projectiles.push(new Projectile(this.x, this.y-this.height*0.3,
        target, this.attack, this.color, this.isEnemy, splash, this.splashRadius, enemies));
    } else if(this.isSplash && this.splashRadius>0){
      for(const e of enemies){
        if(!e.isDead && Math.abs(e.x-this.x)<=this.splashRadius) dealDmg(e, this.attack);
      }
    } else {
      dealDmg(target, this.attack);
      if(Math.random()<this.doubleChance) dealDmg(target, this.attack);
    }
  }

  activateSuctionSkill(playerUnits, particles){
    const sr = this.defRef.skillRange||160;
    for(const u of playerUnits){
      if(u.isDead) continue;
      if(Math.abs(u.x-this.x) < sr){
        u.x += (this.x - u.x) * 0.4; // pull toward boss
        u.stunTimer = 800;
      }
    }
    for(let i=0;i<3;i++) particles.push(new SuctionRing(this.x, this.y, sr));
  }

  isFullyDead(){ return this.isDead && this.deathTimer >= this.deathDuration; }

  draw(ctx){
    if(this.alpha<=0) return;
    ctx.save(); ctx.globalAlpha=this.alpha;
    UnitRenderer.draw(ctx, this);
    ctx.restore();
    if(!this.isDead) this.drawHpBar(ctx);
  }
}

// ===================== Castle クラス =====================
class Castle extends Entity {
  constructor(x,y,isEnemy){
    super(x, y, 70, 100, {
      hp: isEnemy?800:1000, attack:0, defense:5,
      isEnemy, color: isEnemy?'#553300':'#334477'
    });
    this.shakeTimer=0;
  }
  takeDamage(amount){
    const d = super.takeDamage(amount);
    this.shakeTimer=200;
    return d;
  }
  update(dt){ this.updateFlash(dt*1000); if(this.shakeTimer>0) this.shakeTimer-=dt*1000; }
  draw(ctx){
    const ox = this.shakeTimer>0 ? rng(-3,3) : 0;
    ctx.save(); ctx.translate(ox,0);
    if(this.isEnemy) this.drawEnemyCastle(ctx);
    else             this.drawPlayerCastle(ctx);
    this.drawHpBar(ctx);
    ctx.restore();
  }
  drawPlayerCastle(ctx){
    // Pencil case (blue zipper case)
    const x=this.x-35, y=this.y-50;
    ctx.fillStyle = this.flashTimer>0?'#fff':'#334477';
    ctx.fillRect(x,y,70,80);
    ctx.fillStyle='#2255aa'; ctx.fillRect(x+5,y+5,60,10); // zipper
    ctx.fillStyle='#7799cc'; ctx.fillRect(x+5,y+20,60,8);
    ctx.fillStyle='#7799cc'; ctx.fillRect(x+5,y+35,60,8);
    ctx.fillStyle='#7799cc'; ctx.fillRect(x+5,y+50,60,8);
    // Handle
    ctx.fillStyle='#aabbdd'; ctx.fillRect(x+25,y-8,20,8);
    // HP text
    ctx.fillStyle='#fff'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
    ctx.fillText(this.hp,this.x,y+95);
  }
  drawEnemyCastle(ctx){
    // Pencil holder (dark cylinder/cup)
    const x=this.x-35, y=this.y-55;
    ctx.fillStyle = this.flashTimer>0?'#fff':'#553300';
    ctx.fillRect(x,y,70,90);
    ctx.fillStyle='#774422'; ctx.fillRect(x+5,y+5,60,10);
    ctx.fillStyle='#442200'; ctx.fillRect(x,y,70,15);
    // Pencils sticking out
    ctx.fillStyle='#ffcc33'; ctx.fillRect(x+12,y-25,8,30);
    ctx.fillStyle='#ff8888'; ctx.fillRect(x+22,y-30,8,32);
    ctx.fillStyle='#88ccff'; ctx.fillRect(x+40,y-20,8,28);
    // HP text
    ctx.fillStyle='#fff'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
    ctx.fillText(this.hp,this.x,y+100);
  }
}

// ===================== Unit Renderer =====================
const UnitRenderer = {
  draw(ctx, unit){
    const x=unit.x, y=unit.y, w=unit.w||unit.width, h=unit.h||unit.height;
    const flash = unit.flashTimer>0;
    switch(unit.defId){
      case 'clip':      this.drawClip(ctx,x,y,w,h,flash,false); break;
      case 'eraser':    this.drawEraser(ctx,x,y,w,h,flash,false); break;
      case 'scissors':  this.drawScissors(ctx,x,y,w,h,flash,false); break;
      case 'pencil':    this.drawPencil(ctx,x,y,w,h,flash,false); break;
      case 'ruler':     this.drawRuler(ctx,x,y,w,h,flash,false); break;
      case 'thumbtack': this.drawThumbtack(ctx,x,y,w,h,flash); break;
      case 'paperclip': this.drawPaperclip(ctx,x,y,w,h,flash); break;
      case 'tape':      this.drawTape(ctx,x,y,w,h,flash); break;
      case 'stapler':   this.drawStapler(ctx,x,y,w,h,flash); break;
      case 'correction':this.drawCorrection(ctx,x,y,w,h,flash); break;
      case 'sharpener': this.drawSharpener(ctx,x,y,w,h,flash); break;
      default:
        ctx.fillStyle=flash?'#fff':unit.color;
        ctx.fillRect(x-w/2,y-h/2,w,h);
    }
  },
  drawClip(ctx,x,y,w,h,flash){
    // Binder clip - silver/blue
    const c=flash?'#fff':'#5577cc';
    ctx.fillStyle=c; ctx.fillRect(x-w/2,y-h/2+6,w,h-12);
    ctx.fillStyle=flash?'#fff':'#7799ee';
    ctx.fillRect(x-w/2,y-h/2,4,8); ctx.fillRect(x+w/2-4,y-h/2,4,8);
    ctx.fillStyle=flash?'#fff':'#aabbff';
    ctx.fillRect(x-3,y-h/2-4,6,8);
  },
  drawEraser(ctx,x,y,w,h,flash){
    ctx.fillStyle=flash?'#fff':'#ee88aa';
    ctx.fillRect(x-w/2,y-h/2,w,h);
    ctx.fillStyle=flash?'#fff':'#ffffff';
    ctx.fillRect(x-w/2+2,y-h/2+h*0.3,w-4,h*0.15);
    ctx.fillStyle=flash?'#fff':'#cc6688';
    ctx.font='5px monospace'; ctx.textAlign='center';
    ctx.fillText('MONO',x,y+2);
  },
  drawScissors(ctx,x,y,w,h,flash){
    const c=flash?'#fff':'#888';
    // Two ring handles
    ctx.fillStyle=c;
    ctx.beginPath(); ctx.ellipse(x-3,y-h/2+8,5,7,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x+3,y-h/2+16,5,7,0,0,Math.PI*2); ctx.fill();
    // Blades
    ctx.fillStyle=flash?'#fff':'#aaaaaa';
    ctx.fillRect(x-w/2,y,w/2,h/2-4);
    ctx.fillRect(x,y+4,w/2,h/2-4);
  },
  drawPencil(ctx,x,y,w,h,flash){
    // Eraser top
    ctx.fillStyle=flash?'#fff':'#ee8888';
    ctx.fillRect(x-w/2,y-h/2,w,h*0.15);
    // Metal band
    ctx.fillStyle=flash?'#fff':'#aaaaaa';
    ctx.fillRect(x-w/2,y-h/2+h*0.15,w,h*0.05);
    // Yellow body
    ctx.fillStyle=flash?'#fff':'#ffcc33';
    ctx.fillRect(x-w/2,y-h/2+h*0.20,w,h*0.65);
    // Pointed tip
    ctx.fillStyle=flash?'#fff':'#ffcc33';
    ctx.beginPath();
    ctx.moveTo(x-w/2,y+h/2-h*0.15);
    ctx.lineTo(x+w/2,y+h/2-h*0.15);
    ctx.lineTo(x,y+h/2);
    ctx.closePath(); ctx.fill();
    // Graphite tip
    ctx.fillStyle=flash?'#fff':'#444';
    ctx.beginPath(); ctx.moveTo(x-1,y+h/2-5); ctx.lineTo(x+1,y+h/2-5); ctx.lineTo(x,y+h/2); ctx.closePath(); ctx.fill();
  },
  drawRuler(ctx,x,y,w,h,flash){
    ctx.fillStyle=flash?'#fff':'#bbddff';
    ctx.fillRect(x-w/2,y-h/2,w,h);
    ctx.strokeStyle=flash?'#fff':'#3388bb'; ctx.lineWidth=1;
    ctx.strokeRect(x-w/2,y-h/2,w,h);
    // Tick marks
    ctx.fillStyle=flash?'#fff':'#336699';
    for(let i=0;i<8;i++){
      const tx=x-w/2+6+i*(w-12)/7;
      ctx.fillRect(tx,y-h/2+1,1,h*0.5);
    }
  },
  drawThumbtack(ctx,x,y,w,h,flash){
    ctx.fillStyle=flash?'#fff':'#cc4444';
    ctx.beginPath(); ctx.arc(x,y-h/2+w/2,w/2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=flash?'#fff':'#aa2222';
    ctx.beginPath(); ctx.moveTo(x-2,y-h/2+w); ctx.lineTo(x+2,y-h/2+w); ctx.lineTo(x,y+h/2); ctx.closePath(); ctx.fill();
  },
  drawPaperclip(ctx,x,y,w,h,flash){
    ctx.strokeStyle=flash?'#fff':'#cc7744'; ctx.lineWidth=3;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(x-4,y+h/2-2); ctx.lineTo(x-4,y-h/2+4);
    ctx.arc(x,y-h/2+4,4,Math.PI,0);
    ctx.lineTo(x+4,y);
    ctx.arc(x+1,y,3,0,Math.PI);
    ctx.lineTo(x-2,y+h/2-2);
    ctx.stroke();
  },
  drawTape(ctx,x,y,w,h,flash){
    // Tape roll
    ctx.fillStyle=flash?'#fff':'#8888cc';
    ctx.beginPath(); ctx.arc(x,y,w/2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=flash?'#fff':'#bbbbee';
    ctx.beginPath(); ctx.arc(x,y,w/4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=flash?'#fff':'#8888cc';
    ctx.beginPath(); ctx.arc(x,y,w/8,0,Math.PI*2); ctx.fill();
  },
  drawStapler(ctx,x,y,w,h,flash){
    ctx.fillStyle=flash?'#fff':'#445566';
    ctx.fillRect(x-w/2,y-h/2+h*0.4,w,h*0.6);
    ctx.fillStyle=flash?'#fff':'#556677';
    ctx.fillRect(x-w/2,y-h/2,w,h*0.45);
    ctx.fillStyle=flash?'#fff':'#778899';
    ctx.fillRect(x-w/2+2,y-h/2+2,w-4,4);
    // Staple slot
    ctx.fillStyle='#223344';
    ctx.fillRect(x-w/4,y+h/2-8,w/2,4);
  },
  drawCorrection(ctx,x,y,w,h,flash){
    ctx.fillStyle=flash?'#fff':'#ddddcc';
    ctx.fillRect(x-w/2,y-h/2,w,h);
    ctx.fillStyle=flash?'#fff':'#bbbbaa';
    ctx.beginPath(); ctx.arc(x,y,h/2-2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=flash?'#fff':'#eeeedd';
    ctx.beginPath(); ctx.arc(x,y,h/4,0,Math.PI*2); ctx.fill();
  },
  drawSharpener(ctx,x,y,w,h,flash){
    // Big brown sharpener box
    ctx.fillStyle=flash?'#fff':'#884422';
    ctx.fillRect(x-w/2,y-h/2,w,h);
    ctx.fillStyle=flash?'#fff':'#aa5533';
    ctx.fillRect(x-w/2+4,y-h/2+4,w-8,h/2-4);
    // Hole
    ctx.fillStyle='#221100';
    ctx.beginPath(); ctx.ellipse(x,y+h*0.1,10,14,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=flash?'#fff':'#cc7744';
    ctx.fillRect(x-w/2,y+h/2-12,w,12);
    // Boss label
    ctx.fillStyle='#ffeecc'; ctx.font='bold 8px monospace'; ctx.textAlign='center';
    ctx.fillText('BOSS',x,y+4);
  }
};

// ===================== インクシステム =====================
class InkSystem {
  constructor(){ this.ink=50; this.maxInk=100; this.regen=15; }
  reset(gs){
    this.maxInk = Math.round(100*(gs.inkMaxMult||1));
    this.regen  = 15*(gs.inkRegenMult||1);
    this.ink    = Math.min(50, this.maxInk);
  }
  update(dt){ this.ink=Math.min(this.maxInk, this.ink+this.regen*dt); }
  canAfford(cost){ return this.ink>=cost; }
  spend(cost){ if(this.canAfford(cost)){ this.ink-=cost; return true; } return false; }
  getEffectiveCost(base,gs){ return Math.max(5, Math.round(base*(gs.costMult||1))); }
  draw(ctx, x, y){
    const bw=140, bh=16;
    ctx.fillStyle='#111'; ctx.fillRect(x-1,y-1,bw+2,bh+2);
    ctx.fillStyle='#003366'; ctx.fillRect(x,y,bw,bh);
    ctx.fillStyle='#2266cc'; ctx.fillRect(x,y,bw*(this.ink/this.maxInk),bh);
    ctx.fillStyle='#aaccff'; ctx.font='bold 10px monospace'; ctx.textAlign='left';
    ctx.fillText(`インク: ${Math.floor(this.ink)}/${this.maxInk}`, x+4, y+12);
  }
}

// ===================== ウェーブ生成 =====================
function generateWaves(floor, isBoss){
  if(isBoss){
    const scale = Math.pow(1.12, floor-1);
    const boss = Object.assign({}, BOSS_DEF);
    boss.hp   = Math.round(boss.hp   * scale);
    boss.atk  = Math.round(boss.atk  * scale);
    return [{ delay:2000, enemies:[{def:boss,count:1}], addons:[{def:ENEMY_DEFS[0],count:3}] }];
  }
  const scale = Math.pow(1.12, floor-1);
  const avail = ENEMY_DEFS.slice(0, Math.min(5, 1+Math.floor(floor/2)));
  const numWaves = Math.min(5, 2+Math.floor(floor/3));
  const waves=[];
  for(let w=0;w<numWaves;w++){
    const delay=2500+w*7000;
    const count=3+Math.floor(floor/2)+w;
    const enemies=[];
    for(let e=0;e<count;e++){
      const def=Object.assign({},pick(avail));
      def.hp  =Math.round(def.hp  *scale);
      def.atk =Math.round(def.atk *scale);
      enemies.push({def,count:1});
    }
    waves.push({delay,enemies});
  }
  return waves;
}

// ===================== マップ生成 =====================
function generateMap(floorBase){
  // 4 levels: [start(1 node)] [choice(2-3)] [choice(2-3)] [boss(1)]
  const levels=[];
  levels.push([{type:'normal', floor:floorBase, visited:true, available:false}]);
  for(let l=1;l<=2;l++){
    const cnt=rng(2,3);
    const row=[];
    for(let i=0;i<cnt;i++){
      const t=Math.random()<0.25?'elite':'normal';
      row.push({type:t, floor:floorBase+l, visited:false, available:false});
    }
    levels.push(row);
  }
  levels.push([{type:'boss', floor:floorBase+3, visited:false, available:false}]);
  // Mark first choice row as available
  for(const n of levels[1]) n.available=true;
  // Assign positions
  const mapW=700, startX=80;
  for(let l=0;l<levels.length;l++){
    const row=levels[l];
    for(let i=0;i<row.length;i++){
      row[i].x = startX + l*(mapW/(levels.length-1));
      row[i].y = CH/2 + (i-(row.length-1)/2)*80 + rng(-10,10);
    }
  }
  // Build connections
  const conns=[];
  for(let l=0;l<levels.length-1;l++){
    const from=levels[l], to=levels[l+1];
    const used=new Set();
    for(const fn of from){
      // Connect to 1-2 nodes in next level
      const targets=shuffle(to).slice(0,rng(1,Math.min(2,to.length)));
      for(const tn of targets){
        conns.push({from:fn,to:tn});
        used.add(tn);
      }
    }
    // Ensure every 'to' node has at least one connection
    for(const tn of to){
      if(!used.has(tn)){
        const fn=pick(from);
        conns.push({from:fn,to:tn});
      }
    }
  }
  return {levels, conns, currentLevel:0, currentNode:levels[0][0]};
}

// ===================== シーン基底クラス =====================
class Scene {
  constructor(game){ this.game=game; }
  onEnter(data){}
  update(dt,now){}
  draw(ctx){}
  onClick(x,y){}
  onKey(key){}
}

// ===================== 背景描画ヘルパー =====================
function drawNotebookBg(ctx){
  // Cream paper
  ctx.fillStyle='#fdf9ee'; ctx.fillRect(0,0,CW,CH);
  // Horizontal lines
  ctx.strokeStyle='#b8d0e8'; ctx.lineWidth=1;
  for(let y=30;y<CH;y+=22){ ctx.beginPath(); ctx.moveTo(60,y); ctx.lineTo(CW,y); ctx.stroke(); }
  // Red margin
  ctx.strokeStyle='#ffaaaa'; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(58,0); ctx.lineTo(58,CH); ctx.stroke();
  // Ground
  ctx.fillStyle='#d4c4a0'; ctx.fillRect(0,GROUND_Y,CW,CH-GROUND_Y);
  ctx.strokeStyle='#a89070'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,GROUND_Y); ctx.lineTo(CW,GROUND_Y); ctx.stroke();
  // Ground texture
  ctx.strokeStyle='#b8a080'; ctx.lineWidth=1;
  for(let i=0;i<20;i++){
    ctx.beginPath(); ctx.moveTo(i*40,GROUND_Y); ctx.lineTo(i*40+20,CH); ctx.stroke();
  }
}

// ===================== タイトルシーン =====================
class TitleScene extends Scene {
  onEnter(){ this.t=0; this.btnHover=false; }
  update(dt){ this.t+=dt; }
  draw(ctx){
    drawNotebookBg(ctx);
    // Title text
    ctx.save();
    ctx.textAlign='center';
    ctx.font='bold 52px "Hiragino Kaku Gothic Pro",sans-serif';
    ctx.strokeStyle='#334'; ctx.lineWidth=6;
    ctx.strokeText('デスク・ウォーズ',CW/2,CH/2-80);
    ctx.fillStyle='#223366'; ctx.fillText('デスク・ウォーズ',CW/2,CH/2-80);
    ctx.font='18px monospace'; ctx.fillStyle='#556';
    ctx.fillText('DESK WARS - Tower Defense × Roguelike',CW/2,CH/2-45);
    ctx.font='13px monospace'; ctx.fillStyle='#778';
    ctx.fillText('文房具たちの戦いが始まる！',CW/2,CH/2-15);

    // Start button
    const bx=CW/2-90, by=CH/2+10, bw=180, bh=44;
    const pulse=0.85+Math.sin(this.t*3)*0.15;
    ctx.fillStyle=`rgba(33,66,155,${pulse})`;
    ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle='#aaccff'; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle='#fff'; ctx.font='bold 20px monospace'; ctx.textAlign='center';
    ctx.fillText('▶ ゲームスタート',CW/2,by+28);

    // Controls help
    ctx.font='11px monospace'; ctx.fillStyle='#889';
    ctx.fillText('キー1〜5でユニット召喚 / タップでも操作可能',CW/2,CH-20);
    ctx.restore();
  }
  onClick(x,y){
    if(x>CW/2-90&&x<CW/2+90&&y>CH/2+10&&y<CH/2+54){
      this.game.newRun();
      this.game.changeScene(SCENE.MAP);
    }
  }
}

// ===================== マップシーン =====================
class MapScene extends Scene {
  onEnter(){
    this.map = this.game.state.map;
    this.hoveredNode = null;
  }
  update(dt,now,mx,my){ this.mx=mx; this.my=my; }
  draw(ctx){
    // Corkboard background
    ctx.fillStyle='#c8a87a'; ctx.fillRect(0,0,CW,CH);
    // Cork texture dots
    ctx.fillStyle='rgba(0,0,0,0.05)';
    for(let i=0;i<200;i++) ctx.fillRect(rng(0,CW),rng(0,CH),2,2);

    const gs=this.game.state;
    // Title
    ctx.fillStyle='#3322110'; ctx.font='bold 20px monospace';
    ctx.textAlign='left'; ctx.fillStyle='#332211';
    ctx.fillText(`デスク・ウォーズ  Floor ${gs.floor} / ローグライクマップ`, 20, 30);

    if(!this.map) return;
    const {levels,conns}=this.map;

    // Draw connections
    for(const c of conns){
      ctx.save(); ctx.strokeStyle='#8a6a3a'; ctx.lineWidth=2;
      ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(c.from.x,c.from.y); ctx.lineTo(c.to.x,c.to.y);
      ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    }

    // Draw nodes
    for(const row of levels){
      for(const node of row){
        this.drawNode(ctx, node);
      }
    }

    // Active buffs
    ctx.fillStyle='#332211'; ctx.font='bold 12px monospace'; ctx.textAlign='left';
    ctx.fillText('取得バフ:', CW-170, 30);
    const bufNames=gs.selectedBuffs||[];
    for(let i=0;i<bufNames.length;i++){
      ctx.font='11px monospace'; ctx.fillStyle='#553311';
      ctx.fillText('• '+bufNames[i], CW-170, 50+i*16);
    }
  }
  drawNode(ctx,node){
    const {x,y,type,visited,available}=node;
    const w=60,h=44;
    // Sticky note colors
    const col = type==='boss'?'#ff9955':type==='elite'?'#ffcc44':'#ffff88';
    const border= visited?'#888':available?'#ff4400':'#aa8800';
    ctx.save();
    if(available && !visited){ ctx.shadowColor='#ff8800'; ctx.shadowBlur=10; }
    ctx.fillStyle= visited?'#bbbbaa':col;
    ctx.fillRect(x-w/2,y-h/2,w,h);
    ctx.strokeStyle=border; ctx.lineWidth=visited?1:2; ctx.strokeRect(x-w/2,y-h/2,w,h);
    // Label
    ctx.textAlign='center';
    ctx.fillStyle=visited?'#888':'#333';
    ctx.font=`bold 10px monospace`;
    const label=type==='boss'?'⚔BOSS':type==='elite'?'★ELITE':'⚔BATTLE';
    ctx.fillText(label,x,y-4);
    ctx.font='9px monospace';
    ctx.fillText(`Floor ${node.floor||'?'}`,x,y+8);
    if(visited){ ctx.font='10px monospace'; ctx.fillStyle='#666'; ctx.fillText('✓クリア',x,y+20); }
    ctx.restore();
  }
  onClick(x,y){
    if(!this.map) return;
    const {levels}=this.map;
    for(const row of levels){
      for(const node of row){
        if(node.available && !node.visited){
          const d=Math.hypot(x-node.x,y-node.y);
          if(d<35){
            this.game.selectMapNode(node);
            return;
          }
        }
      }
    }
  }
}

// ===================== バトルシーン =====================
class BattleScene extends Scene {
  onEnter(data){
    const gs=this.game.state;
    this.floor      = data.floor||gs.floor;
    this.isBoss     = data.isBoss||false;
    this.waves      = generateWaves(this.floor, this.isBoss);
    this.waveIdx    = 0;
    this.waveTimer  = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;

    this.playerUnits = [];
    this.enemyUnits  = [];
    this.projectiles = [];
    this.particles   = [];
    this.damageNums  = [];

    this.ink = new InkSystem();
    this.ink.reset(gs);

    this.playerCastle = new Castle(PLAYER_BASE_X, GROUND_Y-50, false);
    this.enemyCastle  = new Castle(ENEMY_BASE_X,  GROUND_Y-55, true);

    this.battleOver  = false;
    this.resultTimer = 0;
    this.resultWin   = false;
    this.btnHover    = -1;
    this.time        = 0;
  }

  update(dt, now){
    if(this.battleOver){ this.resultTimer+=dt; if(this.resultTimer>=2.0){ this.endBattle(); } return; }
    this.time += dt;
    this.ink.update(dt);

    // Wave spawning
    this.waveTimer += dt*1000;
    if(this.waveIdx<this.waves.length){
      const wave=this.waves[this.waveIdx];
      if(this.waveTimer>=wave.delay){
        this.waveIdx++;
        // Build spawn queue
        for(const entry of (wave.enemies||[])){
          for(let i=0;i<(entry.count||1);i++) this.spawnQueue.push(entry.def);
        }
        for(const entry of (wave.addons||[])){
          for(let i=0;i<(entry.count||1);i++) this.spawnQueue.push(entry.def);
        }
      }
    }
    this.spawnTimer -= dt*1000;
    if(this.spawnQueue.length>0 && this.spawnTimer<=0){
      const def=this.spawnQueue.shift();
      this.spawnEnemy(def);
      this.spawnTimer=800+rng(0,400);
    }

    // Update units
    const gs=this.game.state;
    for(const u of this.playerUnits) u.update(dt,now,this.playerUnits,this.enemyUnits,this.particles,this.damageNums,this.projectiles);
    for(const u of this.enemyUnits)  u.update(dt,now,this.playerUnits,this.enemyUnits,this.particles,this.damageNums,this.projectiles);

    // Castle contact
    for(let i=this.playerUnits.length-1;i>=0;i--){
      const u=this.playerUnits[i];
      if(!u.isDead && u.x >= ENEMY_BASE_X-30){
        const d=this.enemyCastle.takeDamage(u.attack*3);
        this.damageNums.push(new DamageNumber(this.enemyCastle.x,this.enemyCastle.y-60,d,false));
        u.die(); for(let p=0;p<3;p++) this.particles.push(new PaperParticle(u.x,u.y));
      }
    }
    for(let i=this.enemyUnits.length-1;i>=0;i--){
      const u=this.enemyUnits[i];
      if(!u.isDead && u.x <= PLAYER_BASE_X+30){
        const d=this.playerCastle.takeDamage(u.attack*3);
        this.damageNums.push(new DamageNumber(this.playerCastle.x,this.playerCastle.y-60,d,true));
        u.die(); for(let p=0;p<3;p++) this.particles.push(new PaperParticle(u.x,u.y));
      }
    }

    // Remove fully dead
    this.playerUnits = this.playerUnits.filter(u=>!u.isFullyDead());
    this.enemyUnits  = this.enemyUnits.filter(u=>!u.isFullyDead());

    // Update castles
    this.playerCastle.update(dt);
    this.enemyCastle.update(dt);

    // Update projectiles
    for(const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter(p=>!p.dead);

    // Update particles & numbers
    for(const p of this.particles) p.update(dt);
    this.particles = this.particles.filter(p=>!p.dead());
    for(const dn of this.damageNums) dn.update(dt);
    this.damageNums = this.damageNums.filter(dn=>!dn.dead());

    // Win/Lose check
    if(this.enemyCastle.isDead){ this.battleOver=true; this.resultWin=true; }
    if(this.playerCastle.isDead){ this.battleOver=true; this.resultWin=false; }
  }

  spawnEnemy(def){
    const gs=this.game.state;
    const u=new Unit(ENEMY_SPAWN_X+rng(0,30), GROUND_Y-def.h/2, def, true, null);
    this.enemyUnits.push(u);
  }

  spawnPlayer(defId){
    const gs=this.game.state;
    const def=PLAYER_DEFS.find(d=>d.id===defId);
    if(!def) return;
    const cost=this.ink.getEffectiveCost(def.cost,gs);
    if(!this.ink.spend(cost)) return;
    const u=new Unit(PLAYER_SPAWN_X+rng(0,20), GROUND_Y-def.h/2, def, false, gs);
    this.playerUnits.push(u);
  }

  endBattle(){
    if(this.resultWin){
      const gs=this.game.state;
      gs.map.currentNode.visited=true;
      // Advance floor
      gs.floor = Math.max(gs.floor, (gs.map.currentNode.floor||gs.floor)+1);
      this.game.changeScene(SCENE.BUFF_SELECT, {win:true,isBoss:this.isBoss});
    } else {
      this.game.changeScene(SCENE.GAME_OVER);
    }
  }

  draw(ctx){
    drawNotebookBg(ctx);
    // Castles
    this.playerCastle.draw(ctx);
    this.enemyCastle.draw(ctx);
    // Projectiles
    for(const p of this.projectiles) p.draw(ctx);
    // Units
    for(const u of this.playerUnits) u.draw(ctx);
    for(const u of this.enemyUnits)  u.draw(ctx);
    // Particles
    for(const p of this.particles) p.draw(ctx);
    // Damage numbers
    for(const dn of this.damageNums) dn.draw(ctx);
    // UI
    this.drawUI(ctx);
    // Boss warning
    if(this.isBoss && this.time<3){
      ctx.save(); ctx.textAlign='center';
      ctx.font='bold 28px monospace';
      ctx.fillStyle=`rgba(255,80,0,${1-this.time/3})`;
      ctx.fillText('⚠ BOSS BATTLE ⚠',CW/2,CH/2);
      ctx.restore();
    }
    // Result overlay
    if(this.battleOver && this.resultTimer<2){
      ctx.save(); ctx.globalAlpha=Math.min(1,this.resultTimer);
      ctx.fillStyle=this.resultWin?'rgba(0,100,0,0.5)':'rgba(100,0,0,0.5)';
      ctx.fillRect(0,0,CW,CH);
      ctx.textAlign='center'; ctx.fillStyle='#fff'; ctx.font='bold 36px monospace';
      ctx.fillText(this.resultWin?'VICTORY!':'DEFEAT...', CW/2, CH/2);
      ctx.restore();
    }
  }

  drawUI(ctx){
    const gs=this.game.state;
    const barH=82;
    ctx.fillStyle='rgba(20,20,40,0.88)';
    ctx.fillRect(0,CH-barH,CW,barH);
    ctx.strokeStyle='#445'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(0,CH-barH); ctx.lineTo(CW,CH-barH); ctx.stroke();

    // Ink bar
    this.ink.draw(ctx, 8, CH-barH+8);

    // Floor info
    ctx.textAlign='right'; ctx.fillStyle='#aabbcc'; ctx.font='bold 12px monospace';
    ctx.fillText(`Floor ${this.floor}${this.isBoss?' ⚔BOSS':''}`, CW-8, CH-barH+18);

    // Active buffs
    ctx.textAlign='left'; ctx.font='9px monospace'; ctx.fillStyle='#8899aa';
    const bufStrs=(gs.selectedBuffs||[]).slice(0,5);
    for(let i=0;i<bufStrs.length;i++) ctx.fillText('• '+bufStrs[i], CW-180, CH-barH+30+i*12);

    // Unit buttons
    for(let i=0;i<PLAYER_DEFS.length;i++){
      const def=PLAYER_DEFS[i];
      const cost=this.ink.getEffectiveCost(def.cost,gs);
      const bx=8+i*155, by=CH-barH+28, bw=148, bh=50;
      const canBuy=this.ink.canAfford(cost);
      ctx.fillStyle=canBuy?'#223366':'#1a1a2a';
      ctx.fillRect(bx,by,bw,bh);
      ctx.strokeStyle=canBuy?'#5577cc':'#334';
      ctx.lineWidth=1.5; ctx.strokeRect(bx,by,bw,bh);
      // Unit mini preview
      ctx.save(); ctx.scale(0.55,0.55);
      const preX=(bx+22)/0.55, preY=(by+bh/2)/0.55;
      const fakeUnit={defId:def.id,x:preX,y:preY,width:def.w,height:def.h,color:def.color,flashTimer:0,isEnemy:false,isBoss:false};
      UnitRenderer.draw(ctx,fakeUnit);
      ctx.restore();
      ctx.fillStyle=canBuy?'#eef':'#556'; ctx.font='bold 11px monospace'; ctx.textAlign='left';
      ctx.fillText(def.name, bx+38, by+16);
      ctx.fillStyle=canBuy?'#aaccff':'#445566'; ctx.font='10px monospace';
      ctx.fillText(`コスト: ${cost}`, bx+38, by+30);
      ctx.fillStyle='#667'; ctx.font='9px monospace';
      ctx.fillText(`[${def.key}]`, bx+38, by+43);
    }
  }

  onClick(x,y){
    if(this.battleOver) return;
    const gs=this.game.state;
    for(let i=0;i<PLAYER_DEFS.length;i++){
      const bx=8+i*155, by=CH-82+28, bw=148, bh=50;
      if(x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh){ this.spawnPlayer(PLAYER_DEFS[i].id); return; }
    }
  }

  onKey(key){
    if(this.battleOver) return;
    for(const def of PLAYER_DEFS){ if(def.key===key){ this.spawnPlayer(def.id); return; } }
  }
}

// ===================== バフ選択シーン =====================
class BuffSelectScene extends Scene {
  onEnter(data){
    this.win    = data&&data.win;
    this.isBoss = data&&data.isBoss;
    this.choices= shuffle(ALL_BUFFS).slice(0,3);
    this.hover  = -1;
    this.t      = 0;
  }
  update(dt){ this.t+=dt; }
  draw(ctx){
    ctx.fillStyle='#1a1a2e'; ctx.fillRect(0,0,CW,CH);
    // Header
    ctx.textAlign='center'; ctx.fillStyle='#aaccff'; ctx.font='bold 22px monospace';
    ctx.fillText(this.isBoss?'🏆 ボスクリア！':'⭐ ステージクリア！', CW/2, 50);
    ctx.fillStyle='#88aacc'; ctx.font='14px monospace';
    ctx.fillText('バフを1つ選んでください', CW/2, 80);
    // Cards
    for(let i=0;i<3;i++){
      const b=this.choices[i];
      const cx=CW/2+(i-1)*220, cy=CH/2;
      const bw=190, bh=160;
      const hov=(this.hover===i);
      const scale=hov?1.05:1+(Math.sin(this.t*2+i)*0.01);
      ctx.save(); ctx.translate(cx,cy); ctx.scale(scale,scale);
      ctx.fillStyle=hov?b.color+'dd':'#223';
      ctx.fillRect(-bw/2,-bh/2,bw,bh);
      ctx.strokeStyle=b.color; ctx.lineWidth=hov?3:2;
      ctx.strokeRect(-bw/2,-bh/2,bw,bh);
      ctx.textAlign='center';
      ctx.font='28px sans-serif'; ctx.fillStyle='#fff';
      ctx.fillText(b.id==='atk_up'?'⚔':b.id==='hp_up'?'🛡':b.id==='ink_regen'?'🖊':
                   b.id==='ink_max'?'🗃':b.id==='spd_up'?'💨':b.id==='atkspd'?'⚡':
                   b.id==='cost_dn'?'💰':b.id==='def_up'?'🔰':'✊', 0, -40);
      ctx.font='bold 14px monospace'; ctx.fillStyle=b.color;
      ctx.fillText(b.name, 0, -5);
      ctx.font='11px monospace'; ctx.fillStyle='#aac';
      this.wrapText(ctx, b.desc, 0, 20, bw-20, 18);
      ctx.restore();
    }
  }
  wrapText(ctx,txt,x,y,maxW,lineH){
    const words=txt.split(''); let line='';
    for(const c of words){ const t=line+c; if(ctx.measureText(t).width>maxW){ ctx.fillText(line,x,y); line=c; y+=lineH; } else line=t; }
    if(line) ctx.fillText(line,x,y);
  }
  onClick(x,y){
    for(let i=0;i<3;i++){
      const cx=CW/2+(i-1)*220, cy=CH/2, bw=190, bh=160;
      if(x>=cx-bw/2&&x<=cx+bw/2&&y>=cy-bh/2&&y<=cy+bh/2){
        const gs=this.game.state;
        this.choices[i].apply(gs);
        gs.selectedBuffs = gs.selectedBuffs||[];
        gs.selectedBuffs.push(this.choices[i].name);
        // Advance map or go to game over
        this.advanceMap();
        return;
      }
    }
  }
  advanceMap(){
    const gs=this.game.state;
    const map=gs.map;
    if(!map) { this.game.changeScene(SCENE.MAP); return; }
    // Mark current node visited, unlock next row
    const cur=map.currentNode;
    cur.visited=true;
    const curLevel=map.levels.findIndex(row=>row.includes(cur));
    const nextRow=map.levels[curLevel+1];
    if(nextRow){ for(const n of nextRow) n.available=true; }
    // If this was the boss, generate new map
    if(this.isBoss){
      gs.map=generateMap(gs.floor);
    }
    this.game.changeScene(SCENE.MAP);
  }
  // Track hover
  onMouseMove(x,y){
    this.hover=-1;
    for(let i=0;i<3;i++){
      const cx=CW/2+(i-1)*220,cy=CH/2,bw=190,bh=160;
      if(x>=cx-bw/2&&x<=cx+bw/2&&y>=cy-bh/2&&y<=cy+bh/2){ this.hover=i; break; }
    }
  }
}

// ===================== リザルトシーン =====================
class ResultScene extends Scene {
  onEnter(data){ this.win=data&&data.win; this.t=0; }
  update(dt){ this.t+=dt; }
  draw(ctx){
    drawNotebookBg(ctx);
    ctx.save(); ctx.textAlign='center';
    ctx.font='bold 48px monospace';
    ctx.fillStyle=this.win?'#224499':'#992222';
    ctx.fillText(this.win?'VICTORY!':'DEFEAT...', CW/2, CH/2-60);
    ctx.font='16px monospace'; ctx.fillStyle='#445';
    ctx.fillText(this.win?'おめでとう！次のステージへ進め！':'...もう一度挑戦しよう！', CW/2, CH/2);
    // Button
    const bx=CW/2-80,by=CH/2+40,bw=160,bh=44;
    ctx.fillStyle='#334488'; ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle='#aaccff'; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle='#fff'; ctx.font='bold 16px monospace';
    ctx.fillText(this.win?'次へ進む':'タイトルへ',CW/2,by+28);
    ctx.restore();
  }
  onClick(x,y){
    const bx=CW/2-80,by=CH/2+40,bw=160,bh=44;
    if(x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh){
      if(this.win) this.game.changeScene(SCENE.MAP);
      else this.game.changeScene(SCENE.TITLE);
    }
  }
}

// ===================== ゲームオーバーシーン =====================
class GameOverScene extends Scene {
  onEnter(){ this.t=0; }
  update(dt){ this.t+=dt; }
  draw(ctx){
    ctx.fillStyle='#0a0008'; ctx.fillRect(0,0,CW,CH);
    // Crumpled paper effect
    ctx.save(); ctx.globalAlpha=0.15;
    for(let i=0;i<30;i++){
      ctx.strokeStyle=`hsl(${rng(30,50)},30%,70%)`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(rng(0,CW),rng(0,CH)); ctx.lineTo(rng(0,CW),rng(0,CH)); ctx.stroke();
    }
    ctx.restore();
    ctx.textAlign='center';
    ctx.font='bold 56px monospace';
    ctx.fillStyle=`hsl(0,70%,${40+Math.sin(this.t*2)*10}%)`;
    ctx.fillText('GAME OVER', CW/2, CH/2-50);
    ctx.font='16px monospace'; ctx.fillStyle='#886';
    ctx.fillText(`Floor ${this.game.state.floor} まで到達！`, CW/2, CH/2);
    const buffs=this.game.state.selectedBuffs||[];
    if(buffs.length>0){
      ctx.font='12px monospace'; ctx.fillStyle='#665';
      ctx.fillText('取得バフ: '+buffs.join(', '), CW/2, CH/2+28);
    }
    // Buttons
    const bx=CW/2-80,by=CH/2+60,bw=160,bh=40;
    ctx.fillStyle='#331111'; ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle='#aa4444'; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle='#eeb'; ctx.font='bold 16px monospace';
    ctx.fillText('もう一度',CW/2,by+26);
  }
  onClick(x,y){
    const bx=CW/2-80,by=CH/2+60,bw=160,bh=40;
    if(x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh) this.game.newRun(), this.game.changeScene(SCENE.TITLE);
  }
}

// ===================== ゲームメインクラス =====================
class Game {
  constructor(){
    this.canvas = document.getElementById('game-canvas');
    this.ctx    = this.canvas.getContext('2d');
    this.scaleX = 1; this.scaleY = 1;
    this.mouseX = 0; this.mouseY = 0;

    this.state  = this.createState();
    this.scenes = {
      [SCENE.TITLE]:       new TitleScene(this),
      [SCENE.MAP]:         new MapScene(this),
      [SCENE.BATTLE]:      new BattleScene(this),
      [SCENE.BUFF_SELECT]: new BuffSelectScene(this),
      [SCENE.RESULT]:      new ResultScene(this),
      [SCENE.GAME_OVER]:   new GameOverScene(this),
    };
    this.currentScene = this.scenes[SCENE.TITLE];
    this.currentScene.onEnter({});

    this.lastTime = 0;
    this.resize();
    window.addEventListener('resize', ()=>this.resize());
    this.setupInput();
    requestAnimationFrame(t=>this.loop(t));
  }

  createState(){
    return {
      scene: SCENE.TITLE,
      floor: 1,
      map:   null,
      selectedBuffs: [],
      // Buff multipliers
      attackMult:1, hpMult:1, inkRegenMult:1, inkMaxMult:1,
      speedMult:1,  atkSpdMult:1, costMult:1, defBonus:0, doubleChance:0
    };
  }

  newRun(){
    this.state = this.createState();
    this.state.map = generateMap(1);
  }

  resize(){
    const ratio = CW/CH;
    let w=window.innerWidth, h=window.innerHeight;
    if(w/h > ratio){ w=h*ratio; } else { h=w/ratio; }
    this.canvas.width  = CW;
    this.canvas.height = CH;
    this.canvas.style.width  = w+'px';
    this.canvas.style.height = h+'px';
    this.scaleX = CW/w;
    this.scaleY = CH/h;
  }

  toCanvas(cx,cy){
    const r=this.canvas.getBoundingClientRect();
    return { x:(cx-r.left)*this.scaleX, y:(cy-r.top)*this.scaleY };
  }

  setupInput(){
    // Mouse
    this.canvas.addEventListener('click',e=>{
      const {x,y}=this.toCanvas(e.clientX,e.clientY);
      this.currentScene.onClick(x,y);
    });
    this.canvas.addEventListener('mousemove',e=>{
      const {x,y}=this.toCanvas(e.clientX,e.clientY);
      this.mouseX=x; this.mouseY=y;
      if(this.currentScene.onMouseMove) this.currentScene.onMouseMove(x,y);
    });
    // Touch
    this.canvas.addEventListener('touchstart',e=>{
      e.preventDefault();
      const t=e.touches[0];
      const {x,y}=this.toCanvas(t.clientX,t.clientY);
      this.currentScene.onClick(x,y);
    },{passive:false});
    // Keyboard
    window.addEventListener('keydown',e=>{
      if(this.currentScene.onKey) this.currentScene.onKey(e.key);
    });
  }

  changeScene(name, data={}){
    this.state.scene = name;
    this.currentScene = this.scenes[name];
    this.currentScene.onEnter(data);
  }

  selectMapNode(node){
    const gs=this.game||this;
    this.state.map.currentNode = node;
    node.available = false;
    const isBoss = node.type==='boss';
    this.changeScene(SCENE.BATTLE, { floor: node.floor||this.state.floor, isBoss });
  }

  loop(timestamp){
    const dt = Math.min((timestamp-this.lastTime)/1000, 0.05);
    this.lastTime = timestamp;
    this.ctx.clearRect(0,0,CW,CH);
    this.currentScene.update(dt, timestamp, this.mouseX, this.mouseY);
    this.currentScene.draw(this.ctx);
    requestAnimationFrame(t=>this.loop(t));
  }
}

// ===================== 初期化 =====================
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
