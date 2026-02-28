// ============================================================
// Castle.js - 城クラス
// ============================================================

class Castle {
    constructor(scene, x, isPlayer, stats) {
        this.scene = scene;
        this.x = x;
        this.isPlayer = isPlayer;

        this.maxHp = stats.maxHp || 1000;
        this.hp = this.maxHp;
        this.defense = stats.defense || 0;

        // 城の描画サイズ
        this.width = 70;
        this.height = 120;
        this.groundY = scene.GROUND_Y;

        // メインのGraphicsオブジェクト
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(5);

        // HPバー背景
        this.hpBarBg = scene.add.graphics();
        this.hpBarBg.setDepth(20);

        // HPバー
        this.hpBarFill = scene.add.graphics();
        this.hpBarFill.setDepth(21);

        // HP数値テキスト
        this.hpText = scene.add.text(x, this.groundY - this.height - 30, '', {
            fontSize: '11px',
            fill: isPlayer ? '#aaffaa' : '#ffaaaa',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 1).setDepth(22);

        // ダメージフラッシュ用のオーバーレイ
        this.flashGraphics = scene.add.graphics();
        this.flashGraphics.setDepth(23);
        this.flashAlpha = 0;

        // シールドエフェクト（鉄壁スキル用）
        this.shieldActive = false;
        this.shieldGraphics = scene.add.graphics();
        this.shieldGraphics.setDepth(24);

        this.draw();
    }

    draw() {
        const g = this.graphics;
        g.clear();

        const cx = this.x;
        const baseY = this.groundY;
        const w = this.width;
        const h = this.height;
        const left = cx - w / 2;
        const top = baseY - h;

        // 城の色（プレイヤー=青み、敵=赤み）
        const mainColor = this.isPlayer ? 0x557799 : 0x995555;
        const darkColor = this.isPlayer ? 0x334466 : 0x664433;
        const lightColor = this.isPlayer ? 0x88aacc : 0xcc8888;

        // 土台
        g.fillStyle(darkColor);
        g.fillRect(left - 5, baseY - 10, w + 10, 10);

        // 城壁本体
        g.fillStyle(mainColor);
        g.fillRect(left, top, w, h);

        // 城壁の石のテクスチャ（横縞）
        g.fillStyle(darkColor);
        for (let row = 0; row < 5; row++) {
            const yy = top + 20 + row * 18;
            g.fillRect(left, yy, w, 2);
        }
        // 縦のブロック線
        g.fillStyle(darkColor);
        for (let col = 1; col < 4; col++) {
            const xx = left + col * (w / 4);
            g.fillRect(xx, top + 20, 2, h - 20);
        }

        // 城壁の明るい面（左側）
        g.fillStyle(lightColor);
        g.fillRect(left, top, 5, h);

        // 城門
        g.fillStyle(0x221100);
        const gateW = 20;
        const gateH = 35;
        const gateX = cx - gateW / 2;
        const gateY = baseY - gateH;
        g.fillRect(gateX, gateY, gateW, gateH);

        // 城門のアーチ（楕円で近似）
        g.fillStyle(0x221100);
        g.fillEllipse(cx, gateY + 2, gateW, gateW);

        // 城門の鎖（縦棒）
        g.fillStyle(0x888844);
        g.fillRect(cx - 2, gateY, 2, gateH);
        g.fillRect(cx + 2, gateY, 2, gateH);

        // 城壁の窓
        g.fillStyle(0xffee88);
        const winW = 8, winH = 12;
        if (!this.isPlayer) {
            g.fillRect(left + 8,  top + 25, winW, winH);
            g.fillRect(left + w - 8 - winW, top + 25, winW, winH);
            g.fillRect(left + 8,  top + 55, winW, winH);
            g.fillRect(left + w - 8 - winW, top + 55, winW, winH);
        } else {
            g.fillRect(left + 8,  top + 25, winW, winH);
            g.fillRect(left + w - 8 - winW, top + 25, winW, winH);
            g.fillRect(left + 8,  top + 55, winW, winH);
            g.fillRect(left + w - 8 - winW, top + 55, winW, winH);
        }

        // 城塔（左右）
        const towerW = 18;
        const towerH = h + 25;
        g.fillStyle(darkColor);
        g.fillRect(left - towerW / 2, baseY - towerH, towerW, towerH);
        g.fillRect(left + w - towerW / 2, baseY - towerH, towerW, towerH);

        // 城塔の明るい面
        g.fillStyle(lightColor);
        g.fillRect(left - towerW / 2, baseY - towerH, 3, towerH);
        g.fillRect(left + w - towerW / 2, baseY - towerH, 3, towerH);

        // 塔の頂上（凸凹）
        g.fillStyle(darkColor);
        const crenW = 5, crenH = 8;
        // 左塔
        for (let i = 0; i < 2; i++) {
            g.fillRect(left - towerW / 2 + i * (crenW + 2), baseY - towerH - crenH, crenW, crenH);
        }
        // 右塔
        for (let i = 0; i < 2; i++) {
            g.fillRect(left + w - towerW / 2 + i * (crenW + 2), baseY - towerH - crenH, crenW, crenH);
        }
        // メイン城壁の凸凹
        g.fillStyle(darkColor);
        const mCrenCount = 5;
        for (let i = 0; i < mCrenCount; i++) {
            const cx2 = left + 5 + i * (w - 10) / (mCrenCount - 1);
            g.fillRect(cx2 - 4, top - crenH, 8, crenH);
        }

        // 旗
        const flagPoleX = this.isPlayer ? cx - 2 : cx - 2;
        const flagPoleTop = baseY - towerH - crenH - 30;
        g.fillStyle(0x88aa44);
        g.fillRect(flagPoleX, flagPoleTop, 2, 30);
        g.fillStyle(this.isPlayer ? 0x2255ff : 0xff2222);
        g.fillTriangle(
            flagPoleX + 2, flagPoleTop,
            flagPoleX + 2, flagPoleTop + 14,
            flagPoleX + 18, flagPoleTop + 7
        );

        // ダメージフラッシュ
        if (this.flashAlpha > 0) {
            this.flashGraphics.clear();
            this.flashGraphics.fillStyle(0xff0000, this.flashAlpha);
            this.flashGraphics.fillRect(left - towerW / 2, baseY - towerH - crenH - 30, w + towerW, towerH + crenH + 30);
        }

        // シールドエフェクト
        if (this.shieldActive) {
            this.shieldGraphics.clear();
            this.shieldGraphics.lineStyle(3, 0x44aaff, 0.8);
            this.shieldGraphics.strokeRect(left - towerW / 2 - 5, baseY - towerH - crenH - 35, w + towerW + 10, towerH + crenH + 40);
            this.shieldGraphics.fillStyle(0x44aaff, 0.08);
            this.shieldGraphics.fillRect(left - towerW / 2 - 5, baseY - towerH - crenH - 35, w + towerW + 10, towerH + crenH + 40);
        }

        this.drawHpBar();
    }

    drawHpBar() {
        const barW = 80;
        const barH = 8;
        const barX = this.x - barW / 2;
        const barY = this.groundY - this.height - 42;
        const hpRatio = Math.max(0, this.hp / this.maxHp);

        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x330000);
        this.hpBarBg.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);

        this.hpBarFill.clear();
        const barColor = hpRatio > 0.5 ? 0x22cc22 : hpRatio > 0.25 ? 0xffaa00 : 0xff2200;
        this.hpBarFill.fillStyle(barColor);
        this.hpBarFill.fillRect(barX, barY, Math.floor(barW * hpRatio), barH);

        this.hpText.setText(`${this.hp}/${this.maxHp}`);
        this.hpText.setPosition(this.x, barY);
    }

    takeDamage(amount) {
        const reducedAmount = Math.max(1, amount - this.defense);
        this.hp = Math.max(0, this.hp - reducedAmount);

        // フラッシュアニメーション
        this.flashAlpha = 0.5;
        this.scene.tweens.add({
            targets: this,
            flashAlpha: 0,
            duration: 300,
            onUpdate: () => this.draw(),
        });

        this.draw();
        return reducedAmount;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.draw();
    }

    activateShield() {
        this.shieldActive = true;
        this.draw();
    }

    deactivateShield() {
        this.shieldActive = false;
        this.shieldGraphics.clear();
        this.draw();
    }

    isDestroyed() {
        return this.hp <= 0;
    }

    destroy() {
        this.graphics.destroy();
        this.hpBarBg.destroy();
        this.hpBarFill.destroy();
        this.hpText.destroy();
        this.flashGraphics.destroy();
        this.shieldGraphics.destroy();
    }
}
