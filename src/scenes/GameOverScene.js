import Phaser from 'phaser';
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

      this.add.text(300, 470, 'Click or press X to return to the menu', { fill: '#4ceaee', fontSize: 24 })
      this.input.keyboard.once('keydown-X', this.startGame, this)

      this.input.once('pointerdown', () => {
        this.startGame();
      });
    }

    startGame() {
      this.input.keyboard.off('keydown-X', this.startGame, this)
      this.scene.start('TitleScene');
    }

}

export default GameOverScene;
