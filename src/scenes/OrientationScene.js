import { isPortrait } from '../helpers/orientation';
import Phaser from 'phaser';
import InputButton from '../sprites/InputButton';

class OrientationScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'OrientationScene'
        });
    }
    init(data) {
      this.returnScene = data?.returnScene || this.returnScene
    }
    preload() {
        
    }

    create() {
      this.cameras.main.setBackgroundColor('#000000')
      this.events.on('wake', this.loadContent, this)
      this.setupOrientationChange();
      this.scene.bringToTop();
    }

    loadContent() {
      if (!this.sys.game.device.os.desktop && isPortrait()) {
        this.loadOrientatonWarning()
      } else
      {
        this.loadContinueButton()
      }
    }

    setupOrientationChange() {
      this.loadContent()
      this.orientationHandler = () => {
        if (this.scene.isActive()) { this.loadContent() }
      }
      this.scale.on('orientationchange', this.orientationHandler)
      this.scale.on('resize', this.orientationHandler)
      this.events.once('shutdown', () => {
        this.scale.off('orientationchange', this.orientationHandler)
        this.scale.off('resize', this.orientationHandler)
      })
    }

    loadOrientatonWarning() {
      this.destroyOrientationWarning()
      this.destroyContinueButton()
      this.OrientationWarningText = this.add.text(100, 100, 'Switch your device to Landscape', { fill: "#F0091F", fontSize: 60 })
      this.OrientationWarningText2 = this.add.text(100, 300, 'If the screen does not rotate:', { fill: "#00ff00", fontSize: 40 })
      this.OrientationWarningText3 = this.add.text(100, 400, 'check Auto-rotate screen option is on (Android)', { fill: "#00ff00", fontSize: 40 })
      this.OrientationWarningText4 = this.add.text(100, 500, 'Or Orientation Lock is off on Iphone', { fill: "#00ff00", fontSize: 40 })
    }

    destroyOrientationWarning() {
      if (this.OrientationWarningText) {this.OrientationWarningText.destroy()}
      if (this.OrientationWarningText2) {this.OrientationWarningText2.destroy()}
      if (this.OrientationWarningText3) {this.OrientationWarningText3.destroy()}
      if (this.OrientationWarningText4) {this.OrientationWarningText4.destroy()}

    }

    destroyContinueButton() {
      if (this.continueBtn) {this.continueBtn.destroy()}  
    }

    loadContinueButton() {
      this.destroyContinueButton()
      this.destroyOrientationWarning()
      this.continueBtn = new InputButton(this, 200, 300, "Continue", { fill: "#4ceaee", fontSize: 60 }, this.continue, this)
      this.add.existing(this.continueBtn);    
    }

    update(time, delta) {
    }

    checkFullScreenSwitch() {
      if (!this.sys.game.device.os.desktop  && !this.scale.isFullscreen) { this.scale.startFullscreen() }
    }

    continue() {
      this.checkFullScreenSwitch()
      this.scene.resume(this.returnScene);
      this.scene.sleep()
    }
}

export default OrientationScene;
