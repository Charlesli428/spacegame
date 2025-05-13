class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        this.add.text(250, 200, 'Space Shooter', {
            fontSize: '40px',
            fill: '#fff'
        });

        this.add.text(270, 280, 'Press P to Play', {
            fontSize: '24px',
            fill: '#fff'
        });

        // Access and show high score if it exists
        let storedHighScore = localStorage.getItem('highScore') || 0;
        this.add.text(270, 340, `High Score: ${storedHighScore}`, {
            fontSize: '20px',
            fill: '#fff'
        });

        this.input.keyboard.on('keydown-P', () => {
            this.scene.start('MovementScene');
        });
    }
}
window.TitleScene = TitleScene;