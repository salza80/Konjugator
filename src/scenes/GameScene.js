import Block from '../sprites/Block';
import FallingText from '../sprites/FallingText';
import InputText from '../sprites/InputText';
import Bullet from '../sprites/Bullet';
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
          text: "test",
          opts: { fill: "#de77ae", fontSize: 20 }
      })
      this.input.keyboard.on('keydown-' + 'ENTER', this.fire, this)
      this.timers.push(this.time.addEvent({delay: 10000, callback: this.spawnFallingText, callbackScope: this, loop: true}))
      this.timers.push(this.time.addEvent({delay: 5000, callback: this.spawnFallingText, callbackScope: this, loop: true}))
    }

    fire() {
      let t = this.inputText.text
              this.inputText.setText('')

      this.fallingTextGroup.getChildren().every((fallingText) => {
        if (fallingText.text === t) {
          let b = new Bullet({
                scene: this,
                key: 'bullet',
                x: fallingText.x + (fallingText.width / 2),
                y: 600
              })
          this.bullets.add(b)
          this.physics.add.overlap(b, fallingText, this.hit, null, this)
          return false
        } 
      })
    }

    hit(bullet, fallingText) {
      bullet.destroy()
      fallingText.destroy()
    }

    smashBlock(fallingText, block) {
        block.blowUp()
        fallingText.blowUp()
    }

    spawnFallingText() {
      let b = new FallingText({
          scene: this,
          x: Block.getRandomTileX(),
          y: 0,
          text: "Here",
          opts: { fill: "#de77ae" }
      })
      this.fallingTextGroup.add(b, this)
    } 


    update(time, delta) {
      

        
    }
      
  
}

export default GameScene;
