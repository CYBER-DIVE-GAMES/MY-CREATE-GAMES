# 引き継ぎ情報 (2026-05-05)

## ブランチ
`claude/setup-heavenpiercer-game-r3Vs0`

## 最新コミット
`d428378` Fix: UtilitySkills import削除

---

## 完了済み実装

| 項目 | 状態 |
|------|------|
| タイトル画面BGM・ボタンSE | ✅ |
| 門番スプライト修正（LINEAR filter） | ✅ |
| 攻撃アニメーション（門番・火蛇・血桜） | ✅ |
| 毒DoTダメージ修正 | ✅ |
| 修行の間アップグレード反映 | ✅ |
| レベルアップフリーズ修正 | ✅ |
| スキルシステム再設計（A/B/C=レベルアップ、G/K=ボス報酬） | ✅ |
| スキルD削除 | ✅ |
| G5廻転輪廻削除 | ✅ |
| ボス報酬3択表示 | ✅ |
| 敵弾depth=7で消えなくなるよう修正 | ✅ |
| XPジェム磁石回収時にxpGグラフィック破棄 | ✅ |
| ハートドロップ（5%確率、最大HP30%回復） | ✅ |
| ボス難易度強化（HP増・弾速増・フェーズ追加） | ✅ |

---

## 未完了（次セッションでの作業）

### ウェーブ密度強化（最重要）
`src/systems/WaveSystem.ts` を**バジェット制ランダム生成**に変更する。

#### 設計方針（ユーザー承認済み）
固定スケジュール廃止 → タイマー＋バジェットでランダム生成

**敵コスト定義:**
```
foxfire / cherry_spirit / dancing_doll → コスト1
ghost_warrior / skull_lantern / yaksha_eye → コスト2
fire_serpent / blood_cherry / shadow_spider → コスト3
gate_guardian → コスト5
```

**バジェット計算:**
```
baseBudget = 5 + Math.floor(elapsed / 300) * 2.5  (5分ごとに+2.5)
実際のbudget = baseBudget + random(0, 3)  上限22
```

**ウェーブ間隔:** 7〜12秒（ランダム）

**敵の出現解禁時間 (minTime):**
```
foxfire:       0秒
ghost_warrior: 20秒
cherry_spirit: 60秒
skull_lantern: 60秒
yaksha_eye:    130秒
fire_serpent:  120秒
dancing_doll:  180秒
shadow_spider: 190秒
blood_cherry:  240秒
gate_guardian: 250秒
```

**ボスは固定スケジュール維持:**
```
300s  → miniboss1 (骸の剣鬼)
600s  → miniboss2 (双子の狐精)
900s  → miniboss3 (呪縛の般若)
1200s → midboss   (冥府の狐女王 朱禍)
1500s → miniboss4 (桜樹の怨念)
1800s → boss      (九尾の大妖怪 夜叫)
```

**shadow_spider / gate_guardian の座標:**
- shadow_spider: x=-50(左から)かx=590(右から)、y=250〜450のランダム
- gate_guardian: x=60〜480のランダム、y=-60（上から降下）

#### 実装イメージ（WaveSystem.tsの変更箇所）

```typescript
// STAGE1_SCHEDULE配列を削除
// 以下のプロパティをクラスに追加
private waveTimer: number = 0;
private nextWaveInterval: number = 8;
private nextBossIndex: number = 0;
private bossSchedule = [
  { time: 300,  id: 'miniboss1', type: 'miniboss' as const },
  { time: 600,  id: 'miniboss2', type: 'miniboss' as const },
  { time: 900,  id: 'miniboss3', type: 'miniboss' as const },
  { time: 1200, id: 'midboss',   type: 'midboss'  as const },
  { time: 1500, id: 'miniboss4', type: 'miniboss' as const },
  { time: 1800, id: 'boss',      type: 'boss'     as const },
];

// update()でボスチェック＋waveTimerで定期スポーン
// spawnRandomWave()でバジェット計算→敵選択→生成
```

---

## 主要ファイル構成

```
src/
  scenes/
    StageScene.ts      ← メインゲームシーン（ハートドロップ・ボス報酬等）
    TitleScene.ts      ← タイトル（BGM・SE済み）
    LevelUpScene.ts    ← レベルアップUI
  systems/
    WaveSystem.ts      ← ★次セッションで変更
    SkillSystem.ts     ← A/B/C=レベルアップ、G/K=ボス報酬
    XPSystem.ts
  entities/
    Enemy.ts           ← 攻撃アニメ・DoT対応済み
    Player.ts
    Boss.ts
  skills/
    AttackSkills.ts    ← A1〜A10 (A4削除済み)
    DefenseSkills.ts   ← B1〜B9 (B6/B7/B8削除済み)
    BulletSkills.ts    ← C1〜C10
    GoldSkills.ts      ← G1〜G4 (G5削除済み)
    CurseSkills.ts     ← K1〜K5
  data/bosses/
    bossDefinitions.ts ← 全ボスHP・攻撃パターン（強化済み）
  utils/
    BulletPool.ts      ← depth=7設定済み
    SaveSystem.ts
```

---

## 注意事項
- `pixelArt: true`がmain.tsにあるが、敵スプライトはBootScene.create()でLINEARフィルタ上書き済み
- レベルアップフリーズ防止: pendingLevelUps[]キューで管理、paused=trueのままキュー消化
- ボス報酬UIはStageScene内インライン実装（depth=300）
