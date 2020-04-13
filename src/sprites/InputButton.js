export default class InputButton extends Phaser.GameObjects.Text {
    constructor(scene, x, y, text, style, pressedFunc, context) {
        super(scene, x, y, text, style)

        this.resetStyleColor = style.fill || '#4ceaee'
        this.setInteractive()
        this.on('pointerover', () => this.enterHoverState())
        this.on('pointerout', () => this.enterButtonResetState())
        this.on('pointerdown', () => this.enterButtonActiveState())
        this.on('pointerup', () => this.enterHoverState())
        let onPressFunction = pressedFunc.bind(context)
        this.on('pointerup', function () {onPressFunction(text)})
    }

    enterHoverState() {
        this.setStyle({ fill: '#ff0'});
    }

    enterButtonResetState() {
        this.setStyle({ fill: this.resetStyleColor});
    }

    enterButtonActiveState() {
        this.setStyle({ fill: '#0ff' });
    }
}
