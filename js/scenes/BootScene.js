// ============================================================
// BootScene.js - 初期化・アセット生成
// ============================================================

class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 外部ファイルは使わない - 全てコードで生成
    }

    create() {
        // ロード画面
        const { width, height } = this.scale;
        const loadText = this.add.text(width / 2, height / 2, '読み込み中...', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'monospace',
        }).setOrigin(0.5, 0.5);

        // メインメニューへ（次フレームで）
        this.time.delayedCall(200, () => {
            loadText.destroy();
            this.scene.start('MenuScene');
        });
    }
}
