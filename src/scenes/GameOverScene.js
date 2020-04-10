class GameOverScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'GameOver'
        });
    }
    preload() {
        
    }
    create() {

      this.scene.bringToTop();
      this.GameOverText = this.add.bitmapText(300, 300, 'font', 'GAME OVER', 30);

      this.ScoreText = this.add.text(300, 400, `Score: ${this.registry.get('finalScore')}`, { fill: "#fff", fontSize: 20 })

      this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

      this.input.on('pointerdown', () => {
        this.startGame();
      });
    }

    update(time, delta) {
      if (this.startKey.isDown) {
        this.startGame();
      }
    }

    startGame() {
      this.scene.stop('GameOver');
      this.scene.start('TitleScene');
    }

}

export default GameOverScene;
