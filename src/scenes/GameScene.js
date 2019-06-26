import Block from '../sprites/Block';
import GameTextFactory from '../sprites/GameText';
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

    create () {
     
     // this spawn falling text speed
     this.fallingTextTimerFrom = 5000
     this.fallingTextTimerTo = 15000
    
      // Add and play the music
      this.music = this.sound.add('overworld');
      this.music.play({
          loop: true
      });
      this.timers = [];
      this.tilesGroup = this.add.group()
      this.gameTextGroup = this.add.group({ runChildUpdate: true })
      this.inputGroup = this.add.group()
      this.bullets = this.add.group()

      this.tilesGroup.addMultiple(Block.createStartBlocks(250, this), this)
      this.physics.add.overlap(this.gameTextGroup, this.tilesGroup, this.smashBlock, null, this);

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
      
      //set random word timer
      this.startText = this.add.text(50, 200, 'Konjugiere das verb! Bist du bereit?', { fill: "#00ff00", fontSize: 30 })
      this.keysText = this.add.text(100, 300, 'For ä,ö,ü & ß input on english keyboard use the buttons or 1, 2, 3, 4 keys respectively.', { fill: "#00ff00", fontSize: 13 })
      this.countDownEvent = this.time.addEvent({delay: 1000, callback: this.countDown, callbackScope: this, repeat: 5})

    }

    countDown() {
      if (this.countDownEvent.getRepeatCount() !== 0) {
        this.startText.setText('Konjugiere das verb! Bist du bereit?  ' + (this.countDownEvent.getRepeatCount()))
      } else {
        this.startText.destroy()
        this.keysText.destroy()
        this.inputText.setText('')
        this.spawnFallingText()
        this.setRandomTimer(this.spawnBonusText, 15000, 50000)
      }  
    }

    setRandomTimer(func, fromDelay, toDelay) {
      this.timers.push(this.time.addEvent({delay: getRandomInt(fromDelay, toDelay), callback: func, callbackScope: this, loop: false}))
    }

    fire() {
      let t = this.inputText.getText()
      if (t === '') { return }
      this.inputText.setText('')
      let hasHit = false

      this.gameTextGroup.getChildren().every((fallingText) => {
        if (fallingText.answer === t) {
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
      this.registry.set('restartScene', true);
      console.log('GAME OVER')
      this.music.stop()
      this.scene.stop('GameScene');
      this.scene.start('TitleScene');
    }

    spawnFallingText() {
      let b = GameTextFactory({
          scene: this,
          textType: "falling",
          opts: { fill: "#de77ae" }
      })
      this.gameTextGroup.add(b, this)
      this.setRandomTimer(this.spawnFallingText, this.fallingTextTimerFrom, this.fallingTextTimerFrom)
    }

    spawnBonusText() {
        let b = GameTextFactory({
            scene: this,
            textType: "bonus",
            opts: { fill: "#ffa500", fontSize: 15 }
        })
        
        this.gameTextGroup.add(b, this)
        this.setRandomTimer(this.spawnBonusText, 8000, 20000)
    }


    update(time, delta) {
      

        
    }
      
  
}

export default GameScene;
