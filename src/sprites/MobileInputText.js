import { InputButton } from './InputText.js'
import { getRandomInt, shuffle } from '../helpers/util.js'

const ALL_CHARACTERS =  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'ä', 'ö', 'ü', 'ß']
const NO_AVAILABLE_CHARACTERS = 6

export default class MobileInputText extends Phaser.GameObjects.Container {
    constructor(config) {
        super(config.scene, config.x, config.y);

        //config.text, config.opts
        config.scene.add.existing(this);
        this.textBox = this.scene.add.text(0, 0, ' ', config.opts)
        this.add(this.textBox)

        this.answerText = ''

        let backButtonPressed = (key) => {
            this.back()
        } 

        this.backButton = new InputButton(this.scene, (40 * NO_AVAILABLE_CHARACTERS), this.textBox.height + 8, 'BACK', { fill: '#fc0b03', fontSize: 25 }, backButtonPressed).setVisible(false).setActive(false)
        this.add(this.backButton)

        let keyButtonPressed = (key) => {
            this.setText(this.getText() + key)
        } 
        this.allCharacterButtons = {}
        for (var char of ALL_CHARACTERS) {
            let b = new InputButton(this.scene, 0, this.textBox.height + 8, char, { fill: "#4ceaee", fontSize: 25 }, keyButtonPressed).setActive(false).setVisible(false)
            this.add(b)
            this.allCharacterButtons[char] = b
        } 
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
    }

    createAvailableButtons() {
        this.clearAvailableChars()

        let xButton = 0
        let availableChars = this.getAvailableCharKeys()
        for (var char of availableChars ) {
            let b = this.allCharacterButtons[char]
            b.setX(xButton).setActive(true).setVisible(true)
            xButton = xButton + 40
        }
        this.backButton.setActive(true).setVisible(true).setFill('#fc0b03')
    }

    back() {
        let text = this.getText()
        if (text.length > 0) {
            this.setText(text.substring(0, text.length - 1))
        }
    }

    gameTextRemoved(gameText) {
        if(gameText.getAnswer() === this.answerText) {
            this.answerText= ''
            this.setText('')
        }
    }

    getAvailableCharKeys() {
        let answerChars = this.answerText.split('')
        let currentTextChars = this.getText().split('')
        let availableChars = []
        for (var index in answerChars) {
            if (currentTextChars[index] !== answerChars[index]) {
                availableChars.push(answerChars[index])
                break;
            }
        }
        do {
            let randomChar = ALL_CHARACTERS[getRandomInt(0, ALL_CHARACTERS.length -1)]
            if (!availableChars.includes(randomChar)){ 
                availableChars.push(randomChar)
            }
            
        } while(availableChars.length < NO_AVAILABLE_CHARACTERS)

        return shuffle(availableChars)
    }


    setText(text) {
        this.textBox.setText(text)
        if (this.getText() === this.answerText) {
            this.scene.events.emit('correctAnswer')
            this.clearAvailableChars()
        } else {
            this.createAvailableButtons()
        }

    }

    getText() {
        return this.textBox.text.trim()
    }
}
