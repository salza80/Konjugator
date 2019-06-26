class InputButton extends Phaser.GameObjects.Text {
    constructor(scene, x, y, text, style, pressedFunc) {
        super(scene, x, y, text, style)

        this.setInteractive()
        this.on('pointerover', () => this.enterHoverState())
        this.on('pointerout', () => this.enterButtonRestState())
        this.on('pointerdown', () => this.enterButtonActiveState())
        this.on('pointerup', () => this.enterHoverState())
        this.on('pointerup', function () {pressedFunc(text)})
    }

    enterHoverState() {
        this.setStyle({ fill: '#ff0'});
    }

    enterButtonRestState() {
        this.setStyle({ fill: '#4ceaee'});
    }

    enterButtonActiveState() {
        this.setStyle({ fill: '#0ff' });
    }
}

export default class InputText extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);

        //config.text, config.opts
        config.scene.add.existing(this);
        this.textBox = this.scene.add.text(0, 0, ' ', config.opts)
        this.add(this.textBox)
        this.alphaKeys = this.scene.input.keyboard.addKeys("a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,BACKSPACE", true, false)
        for (var key in this.alphaKeys ) {
            this.alphaKeys[key].on('down', this.keysEntered, this)
        }


        // add german keys
        this.scene.input.keyboard.addKey(186, true, false).on('down', this.keysEntered, this)
        this.scene.input.keyboard.addKey(222, true, false).on('down', this.keysEntered, this)
        this.scene.input.keyboard.addKey(192, true, false).on('down', this.keysEntered, this)
        this.scene.input.keyboard.addKey(219, true, false).on('down', this.keysEntered, this)

        this.keyButtonPressed = (key) => {
            this.setText(this.getText() + key)
        }  
        this.numericSpecialMapped = this.scene.input.keyboard.addKeys(
            {
                'ä': Phaser.Input.Keyboard.KeyCodes.ONE,
                'ö': Phaser.Input.Keyboard.KeyCodes.TWO,
                'ü': Phaser.Input.Keyboard.KeyCodes.THREE,
                'ß': Phaser.Input.Keyboard.KeyCodes.FOUR
            }
        )
        let xButton = 0
        for (var key in this.numericSpecialMapped ) {
            let b = new InputButton(this.scene, xButton, this.textBox.height + 8, key, { fill: "#4ceaee", fontSize: 25 }, this.keyButtonPressed )
            this.numericSpecialMapped[key].on('down', this.keysEntered, this)
            this.add(b)
            xButton = xButton + 40
        }
    }

    setText(text) {
        this.textBox.setText(text)
    }

    getText() {
        return this.textBox.text.trim()
    }


    keysEntered(eventName, event) {
        if (event) {
            switch (event.key) {
                case 'Backspace':
                    if (this.getText().length > 0 ) {
                        this.setText(this.textBox.text.slice(0, this.getText().length -1))
                    }
                    break;
                case 'Enter':
                    break;
                case '1': 
                    this.setText(this.textBox.text + 'ä')
                    break;
                case '2': 
                    this.setText(this.textBox.text + 'ö')
                    break;
                case '3': 
                    this.setText(this.textBox.text + 'ü')
                    break;
                case '4': 
                    this.setText(this.textBox.text + 'ß')
                    break;
                default:
                   this.setText(this.textBox.text + event.key)
                }
        }
    }
}
