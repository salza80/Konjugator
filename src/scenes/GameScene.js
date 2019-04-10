class GameScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'GameScene'
        });
    }

    preload() {
       
    }

    create() {
       

        // Add and play the music
        this.music = this.sound.add('overworld');
        this.music.play({
            loop: true
        });

        

    }

    update(time, delta) {
      
    }

  
}

export default GameScene;
