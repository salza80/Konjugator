class GameOverScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'GameOver'
        });
    }
    preload() {
        
    }
    create() {

      this.scene.bringToTop();
      this.GameOverText = this.add.bitmapText(300, 300, 'font', 'GAME OVER', 30);
      let finalScore = this.registry.get('finalScore')
      this.ScoreText = this.add.text(300, 400, `Score: ${finalScore}`, { fill: "#fff", fontSize: 20 })

      let gameOverCallback = this.registry.get('gameOverCallback')
      if (gameOverCallback){ 
        gameOverCallback(
          {
            score: finalScore
          }
      )}

      this.startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

      this.input.once('pointerdown', () => {
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
