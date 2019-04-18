import Block from '../sprites/Block';
import FallingText from '../sprites/FallingText';
import InputText from '../sprites/InputText';
import Bullet from '../sprites/Bullet';
import Score from '../sprites/Score';
import { getRandomInt } from '../helpers/util.js'

class GameScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'GameScene'
        });
    }

    preload() {

    }

    create() {
     
    
      // // Add and play the music
      this.music = this.sound.add('overworld');
      this.music.play({
          loop: true
      });
      this.timers = [];
      this.tilesGroup = this.add.group()
      this.fallingTextGroup = this.add.group()
      this.inputGroup = this.add.group()
      this.bullets = this.add.group()

      this.tilesGroup.addMultiple(Block.createStartBlocks(100, this), this)
      this.physics.add.overlap(this.fallingTextGroup, this.tilesGroup, this.smashBlock, null, this);

      this.inputText = new InputText({
          scene: this,
          x: 400,
          y: 600,
          opts: { fill: "#00ff00", fontSize: 20 }
      })
      this.scoreText = new Score({
          scene: this,
          x: 800,
          y: 50,
          text: "",
          opts: { fill: "#00ff00", fontSize: 30 }
      })
      this.input.keyboard.on('keydown-' + 'ENTER', this.fire, this)
      // this.timers.push(this.time.addEvent({delay: 10000, callback: this.spawnFallingText, callbackScope: this, loop: true}))
      this.timers.push(this.time.addEvent({delay: 5000, callback: this.spawnFallingText, callbackScope: this, loop: true}))

      this.timers.push(this.time.addEvent({delay: 20000, callback: this.spawnBonusText, callbackScope: this, loop: true}))
    }

    fire() {
      let t = this.inputText.getText()
      if (t === '') { return }
      this.inputText.setText('')
      let hasHit = false

      this.fallingTextGroup.getChildren().every((fallingText) => {
        if (fallingText.text === t) {
          let b = new Bullet({
                scene: this,
                y: 600,
                target: fallingText
              })
          this.bullets.add(b, this)
          this.physics.add.overlap(b, fallingText, this.hit, null, this)
          
          hasHit = true
          return false
        }
        return true
      })
      if (!hasHit) {
        console.log('MISS')
        this.cameras.main.shake(100, 0.05);
        this.sound.playAudioSprite('sfx', 'smb_bump');
      }
    }

    hit(bullet, fallingText) {
      this.scoreText.updateScore(fallingText)
      bullet.destroy()
      fallingText.hit()
    }

    smashBlock(fallingText, block) {
        block.blowUp()
        fallingText.blowUp()
        if (this.tilesGroup.getLength() === 0 ) {
          
          this.gameOver()
        }
    }

    gameOver() {
      console.log('GAME OVER')
    }

    spawnFallingText() {
      let b = new FallingText({
          scene: this,
          x: FallingText.getRandomTileX(),
          text: "Heres",
          opts: { fill: "#de77ae" }
      })
      this.fallingTextGroup.add(b, this)
    }

    spawnBonusText() {
        let b = new FallingText({
            scene: this,
            x: FallingText.getRandomTileX(),
            text: "Bonus",
            textType: "bonus",
            opts: { fill: "#ffa500", fontSize: 20 }
        })
        
        this.fallingTextGroup.add(b, this)
    }


    update(time, delta) {
      

        
    }
      
  
}

export default GameScene;
