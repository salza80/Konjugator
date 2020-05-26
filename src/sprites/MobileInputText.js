import InputButton from './InputButton.js'

const ALL_CHARACTERS =  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ü', 'ß']
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü', 'ß']

const NO_AVAILABLE_CHARACTERS = 10
const WIDTH = 1280

export default class MobileInputText extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);

        //config.text, config.opts
        config.scene.add.existing(this);
        this.textBox = this.scene.add.text(WIDTH / 2, 0, ' ', config.opts)
        this.add(this.textBox)

        this.alphaKeys = this.scene.input.keyboard.addKeys("ONE,TWO,THREE,FOUR,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,BACKSPACE", true, false)
        for (var key in this.alphaKeys ) {
            this.alphaKeys[key].on('down', this.keysEntered, this)
        }


        // add german keys
        this.scene.input.keyboard.addKey(186, true, false).on('down', this.keysEntered, this)
        this.scene.input.keyboard.addKey(222, true, false).on('down', this.keysEntered, this)
        this.scene.input.keyboard.addKey(192, true, false).on('down', this.keysEntered, this)
        this.scene.input.keyboard.addKey(219, true, false).on('down', this.keysEntered, this)

        this.scene.input.keyboard.on('keydown-' + 'ENTER', this.fire, this)

        this.answerText = ''

        this.backButton = new InputButton(this.scene, 0, this.textBox.height + 8, 'BACK', { fill: '#fc0b03', fontSize: 60 }, this.back(),this).setVisible(false).setActive(false)
        this.add(this.backButton)

        this.allCharacterButtons = {}
        for (var char of ALL_CHARACTERS) {
            let b = new InputButton(this.scene, 0, this.textBox.height + 8, char, { fill: "#4ceaee", fontSize: 60 }, this.keyButtonPressed, this).setActive(false).setVisible(false)
            this.add(b)
            this.allCharacterButtons[char] = b
        } 
    }

    keyButtonPressed(key) {
        this.setText(this.getText() + key)
    } 

    clearAvailableChars() {
        for (var char of Object.values(this.allCharacterButtons)) {
            char.setActive(false).setVisible(false).setX(0)
        }
        this.backButton.setActive(false).setVisible(false)
    }

    setAnswerText(gameText) {
        this.answerText = gameText.getAnswer()
        this.setText('')
        this.createAvailableButtons()
    }

    createAvailableButtons() {
        this.clearAvailableChars()


        // let xButton = 0
        let availableChars = this.getAvailableCharKeys()
        let xButton = (WIDTH/2) - (((80 * availableChars.length) + this.backButton.width) / 2)
        for (var char of availableChars ) {
            let b = this.allCharacterButtons[char]
            b.setX(xButton).setActive(true).setVisible(true)
            xButton = xButton + 80
        }
        this.backButton.setActive(true).setVisible(true).setFill('#fc0b03').setX(xButton)
    }

    back() {
        let text = this.getText()
        if (text.length > 0) {
            this.setText(text.substring(0, text.length - 1))
        }
    }

    gameTextRemoved(gameText) {
        if (gameText.getAnswer() === this.answerText) {
            this.answerText= ''
            this.setText('')
            this.createAvailableButtons()
        }
    }

    getAvailableCharKeys() {
        if (this.answerText === '') {
            return ['ä', 'ö', 'ü', 'ß']
        }
        let answerChars = this.answerText.split('')
        let currentTextChars = this.getText().split('')
        let availableChars = []
        for (var index in answerChars) {
            if (!availableChars.includes(answerChars[index])){ 
                availableChars.push(answerChars[index])
            }
        }

        // add some random vowels
        [...Array(3)].forEach(() => {
            let randomChar = VOWELS[Phaser.Math.RND.between(0, VOWELS.length -1)]
            if (!availableChars.includes(randomChar)){ 
                availableChars.push(randomChar)
            }
        });

        do {
            let randomChar = ALL_CHARACTERS[Phaser.Math.RND.between(0, ALL_CHARACTERS.length -1)]
            if (!availableChars.includes(randomChar)){ 
                availableChars.push(randomChar)
            }
            
        } while(availableChars.length < NO_AVAILABLE_CHARACTERS)

        return Phaser.Math.RND.shuffle(availableChars)
    }


    setText(text) {
        this.textBox.setText(text)
        if (this.getText() === this.answerText && this.answerText !== '') {
            this.fire()
        }

    }

    fire() {
        this.scene.events.emit('correctAnswer', this.getText())
        this.answerText=''
        this.setText('')
        this.createAvailableButtons()
    }

    getText() {
        return this.textBox.text.trim()
    }

    keysEntered(eventName, event) {
        if (event) {
            switch (event.key) {
                case 'Backspace':
                    this.back()
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
