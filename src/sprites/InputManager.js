import { InputButton } from './InputText.js'
import { getRandomInt, shuffle } from '../helpers/util.js'

const ALL_CHARACTERS =  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ü', 'ß']
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ä', 'ö', 'ü', 'ß']

const NO_AVAILABLE_CHARACTERS = 8

export default class InputManager {
    constructor(config, width, height, sideWidth, showTouchInput ) {
        this.scene = config.scene
        //config.text, config.opts
        // config.scene.add.existing(this);

        this.bottomY = height - 100
        this.sideWidth = sideWidth
        this.fullWidth = width
        this.fullHeight = height
        this.showTouchInput = showTouchInput

        this.buttonSize = this.showTouchInput ? 100 : 60
        this.othButtonSize = this.showTouchInput ? 80 : 60
        this.textBoxSize = this.showTouchInput ? 40 : 20

        this.setAllCharacters()


        this.textBox = this.scene.add.text(this.fullWidth / 2, this.bottomY, ' ', {fill: "#00ff00", fontSize: this.textBoxSize })

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

        if (showTouchInput) {
            this.graphics = this.scene.add.graphics();
            this.graphics.fillStyle(0x000000, 1);
            this.graphics.setDepth(1)
            this.graphics.fillRect(0, 0, this.sideWidth, this.fullHeight)
            this.graphics.fillRect(this.fullWidth - this.sideWidth, 0, this.sideWidth, this.fullHeight)
        }

        this.answerText = ''

        let backButtonPressed = (key) => {
            this.back()
        } 
        this.backButton = new InputButton(this.scene, 0, this.bottomY + this.textBox.height + 8, 'BACK', { fill: '#fc0b03', fontSize: this.buttonSize }, backButtonPressed).setVisible(false).setActive(false)

        let clearButtonPressed = (key) => {
            this.clear()
        } 
        this.clearButton = new InputButton(this.scene, 0, this.bottomY + this.textBox.height + 8, 'CLEAR', { fill: '#fc0b03', fontSize: this.buttonSize }, clearButtonPressed).setVisible(false).setActive(false)
        this.scene.add.existing(this.backButton);
        this.scene.add.existing(this.clearButton);

        if (this.showTouchInput) {
            this.backButton.setActive(true).setVisible(true).setFill('#fc0b03').setX(this.fullWidth - this.backButton.width - this.sideWidth - 20).setY(this.bottomY)
            this.clearButton.setActive(true).setVisible(true).setFill('#fc0b03').setX(this.sideWidth + 20).setY(this.bottomY)
        }

        if (!this.showTouchInput) {
            this.createGermanVowelButtons();
        }

        let keyButtonPressed = (key) => {
            this.setText(this.getText() + key)
        } 
        this.allCharacterButtons = {}
        for (var char of this.all_chars) {
            let b = new InputButton(this.scene, 0, this.bottomY + this.textBox.height + 8, char, { fill: "#4ceaee", fontSize: this.buttonSize }, keyButtonPressed).setActive(false).setVisible(false)
            b.setDepth(2)
            this.scene.add.existing(b);
            this.allCharacterButtons[char] = b
        }

        
    }

    setAllCharacters() {
        if (!this.showTouchInput) {
            this.all_chars = ALL_CHARACTERS
            return false
        }
        var chars = [];

        var verbs = this.scene.cache.json.get('verbs')

        for (var verb of Object.values(verbs) ) {
            for (var [p, answer] of Object.entries(verb) ) {
                if (p !== 'english'){
                    var charGroups = this.splitAnswer(answer)
                    for ( var c of charGroups ) {
                        if (!chars.includes(c)){
                            chars.push(c)
                        }
                    }
                }
            }
        }
        this.all_chars = chars
        // answers is array of all possible answers

    }

    splitAnswer(answer) {
        var max_chars = 2
        var match = `.{1,${max_chars}}`;
        var re = new RegExp(match,"g");
        return answer.match(re)
    }

    clearAvailableChars() {
        for (var char of Object.values(this.allCharacterButtons)) {
            char.setActive(false).setVisible(false).setX(0)
        }
        // this.backButton.setActive(false).setVisible(false)
    }

    setAnswerText(gameText) {
        this.answerText = gameText.getAnswer()
        this.setText('')
        this.showAvailableButtons()
    }

    createGermanVowelButtons() {
        let xButton = (this.fullWidth/2) - (80 * 2)
        for (var char of ['ä', 'ö', 'ü', 'ß'] ) {
            let b = this.allCharacterButtons[char]
            b.setX(xButton).setActive(true).setVisible(true)
            xButton = xButton + 80
        }
    }

    showAvailableButtons() {
        if (!this.showTouchInput) {return false}
        this.clearAvailableChars()
        let topPadding = 40
        // let buttonWidth = this.allCharacterButtons[Object.keys(this.allCharacterButtons)[0]].width

        let availableChars = this.getAvailableCharKeys()
        let yIncrement = (this.fullHeight - (topPadding * 2)) / (Math.round(availableChars.length / 2) )

        let xButton1 = Math.round(this.sideWidth / 2)
        let xButton2 = this.fullWidth - Math.round(this.sideWidth / 2)
        let yButton = topPadding
        let firstCol = true

        for (var char of availableChars ) {
            let b = this.allCharacterButtons[char]
            if (firstCol) {
                b.setY(yButton).setX(xButton1 - Math.round(b.width/2)).setActive(true).setVisible(true)
            } else {
                b.setY(yButton).setX(xButton2 - Math.round(b.width/2)).setActive(true).setVisible(true)
            }
            if (!firstCol) {
                yButton = yButton + yIncrement
            }
            firstCol = !firstCol
        }
        
    }

    back() {
        let text = this.getText()
        if (text.length > 0) {
            this.setText(text.substring(0, text.length - 1))
        }
    }

    clear() {
        this.setText('')
    }

    gameTextRemoved(gameText) {
        if (gameText.getAnswer() === this.answerText) {
            this.answerText= ''
            this.setText('')
            this.showAvailableButtons()
        }
    }

    // getAvailableCharKeys() {
    //     if (this.answerText === '') {
    //         return []
    //     }
    //     let answerChars = this.answerText.split('')
    //     let availableChars = []
    //     for (var index in answerChars) {
    //         if (!availableChars.includes(answerChars[index])){ 
    //             availableChars.push(answerChars[index])
    //         }
    //     }

    //     // add some random vowels
    //     [...Array(3)].forEach(() => {
    //         if (availableChars.length < NO_AVAILABLE_CHARACTERS) { 
    //             let randomChar = VOWELS[getRandomInt(0, VOWELS.length -1)]
    //             if (!availableChars.includes(randomChar)){ 
    //                 availableChars.push(randomChar)
    //             }
    //         }
    //     });

    //     do {
    //         let randomChar = ALL_CHARACTERS[getRandomInt(0, ALL_CHARACTERS.length -1)]
    //         if (!availableChars.includes(randomChar)){ 
    //             availableChars.push(randomChar)
    //         }
            
    //     } while(availableChars.length < NO_AVAILABLE_CHARACTERS)

    //     return shuffle(availableChars)
    // }

     getAvailableCharKeys() {
        if (this.answerText === '') {
            return []
        }
        let answerChars = this.splitAnswer(this.answerText)
        let availableChars = []
        for (var index in answerChars) {
            if (!availableChars.includes(answerChars[index])){ 
                availableChars.push(answerChars[index])
            }
        }

        do {
            let randomChar = this.all_chars[getRandomInt(0, this.all_chars.length -1)]
            if (!availableChars.includes(randomChar)){ 
                availableChars.push(randomChar)
            }
            
        } while(availableChars.length < NO_AVAILABLE_CHARACTERS)

        return shuffle(availableChars)
    }


    setText(text) {

        if (text !== '' && this.answerText !== '' ) {
            if (!this.answerText.startsWith(text)) {
                this.scene.cameras.main.shake(100, 0.05);
                this.scene.sound.playAudioSprite('sfx', 'smb_bump');
                return false
            }
        }

        this.textBox.setText(text)
        this.textBox.setX((this.fullWidth / 2) - (this.textBox.width / 2))
        if (this.getText() === this.answerText && this.answerText !== '') {
            this.fire()
        }

    }

    fire() {
        this.scene.events.emit('correctAnswer', this.getText())
        this.answerText=''
        this.setText('')
        this.showAvailableButtons()
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
