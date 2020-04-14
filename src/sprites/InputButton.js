export default class InputButton extends Phaser.GameObjects.Text {
    constructor(scene, x, y, text, style, pressedFunc, context) {
        super(scene, x, y, text, style)
        this.resetStyleColor = style.fill || '#4ceaee'
        this.fontWeight = 'bold'
        this.setShadow(2, 2, "#867470", 2, true, true);
        this.setInteractive()
        this.on('pointerover', () => this.enterHoverState())
        this.on('pointerout', () => this.enterButtonResetState())
        this.on('pointerdown', () => this.enterButtonActiveState())
        this.on('pointerup', () => this.enterHoverState())
        let onPressFunction = pressedFunc ? pressedFunc.bind(context) : () => {}
        this.on('pointerup', function () {onPressFunction(text)})
    }

    enterHoverState() {
        this.setPadding(0,0)
        this.setShadow(3, 3, "#867470", 2, true, true);
        this.setStyle({ fill: '#ff0'});
    }

    enterButtonResetState() {
        this.setShadow(2, 2, "#867470", 2, true, true);
        this.setStyle({ fill: this.resetStyleColor});
    }

    enterButtonActiveState() {
        this.setShadow(1, 1, "#867470", 2, true, true);
        this.setPadding(2,2)
        this.setStyle({ fill: '#ff0'});
    }
}
