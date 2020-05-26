import InputButton from './InputButton.js'
import { getRandomInt, shuffle } from '../helpers/util.js'

const NO_AVAILABLE_CHARACTERS = 6

export default class InputManager {
  constructor(config) {
    this.scene = config.scene
    this.bottomY = config.height - 100
    this.fullWidth = config.width
    this.fullHeight = config.height
    this.inputType = config.inputType
    this.funcOnFire = config.onFire.bind(config.context)
    this.sideWidth = this.inputType === 'Touch' ? config.sideWidth : 0
    this.buttonSize = this.inputType === 'Touch' ? 100 : 60
    this.textBoxSize = this.inputType === 'Touch' ? 80 : 30
    this.textBox = this.scene.add.text(this.fullWidth / 2, this.bottomY, ' ', {fill: "#00ff00", fontSize: this.textBoxSize })
    this.answerText = ''
    this.setupSuccess = false

    if (this.inputType === 'Voice') {
      this.setupSpeechRecognitionEntry()
    } else if (this.inputType === 'Touch') {
      this.setupTouchEntry()
    } else { this.setupKeyboardEntry() }
  }

  removeKeys() {
    'ONE,TWO,THREE,FOUR,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,SPACE,BACKSPACE,ENTER'.split(',').forEach((k)=> (this.scene.input.keyboard.removeKey(k)))
    this.scene.input.keyboard.removeKey(186)
    this.scene.input.keyboard.removeKey(222)
    this.scene.input.keyboard.removeKey(192)
    this.scene.input.keyboard.removeKey(219)
  }

  setupSpeechRecognitionEntry() {

    let SpeechRecognition = SpeechRecognition || webkitSpeechRecognition || undefined
    let SpeechGrammarList = SpeechGrammarList || webkitSpeechGrammarList || undefined
    let SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent || undefined


    if (!SpeechRecognition) {
      this.scene.add.text(this.sideWidth + 50, 300, 'Speech Recognition not available! Please use updated Chrome or Edge web browser.', { fill: "#00ff00", fontSize: 20 })
      return false
    }

    const speechButtonPressed = () => {
      this.recognition.start()
    }

    this.speechButton = new InputButton(this.scene, this.fullWidth / 2, this.bottomY + this.textBox.height + 8, "Talk", { fill: "#4ceaee", fontSize: this.buttonSize }, speechButtonPressed, this).setActive(true).setVisible(true)
    this.speechButton.setDepth(2)
    this.speechButton.x = this.speechButton.x - (this.speechButton.width / 2)
    this.scene.add.existing(this.speechButton);

    var answers = this.allAnswers()

    var grammar = '#JSGF V1.0; grammar answers; public <answers> = ' + answers.join(' | ') + ' ;'

    this.recognition = new SpeechRecognition();
    this.speechRecognitionList = new SpeechGrammarList();
    this.speechRecognitionList.addFromString(grammar,1)

    this.recognition.grammars = this.speechRecognitionList;
    this.recognition.continuous = false;
    this.recognition.lang = 'de-DE';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 3;

    this.recognition.onerror = (event) => {
      this.speechButton.text = "Talk"
    }
    
    this.recognition.onresult = (event) => {
      this.speechButton.text = "Talk"
      this.setText(event.results[0][0].transcript)
      let match =  false
      for (const result of event.results[0] ) {
        match = this.funcOnFire(result.transcript, false)
        if (match) {
          this.setText(result.transcript)
          break;
        }
      }
      if (!match) {this.funcOnFire(this.getText())}
    }

    this.recognition.onaudiostart = () => {
      this.speechButton.text = "..."
    }

    this.recognition.onspeechend = () => {
      this.speechButton.text = "Talk"
      this.recognition.stop();
    }

    this.recognition.onnomatch = (event) => {
      this.speechButton.text = "Talk"
      this.recognition.stop();
    }

    this.setupSuccess = true
  }

  setupKeyboardEntry() {
    this.removeKeys()
    this.alphaKeys = this.scene.input.keyboard.addKeys("ONE,TWO,THREE,FOUR,a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,SPACE,BACKSPACE,ENTER", true, false)
    for (var key in this.alphaKeys ) {
      this.alphaKeys[key].on('down', this.keysEntered, this)
    }

    // add german keys for german keyboard
    this.scene.input.keyboard.addKey(186, true, false).on('down', this.keysEntered, this)
    this.scene.input.keyboard.addKey(222, true, false).on('down', this.keysEntered, this)
    this.scene.input.keyboard.addKey(192, true, false).on('down', this.keysEntered, this)
    this.scene.input.keyboard.addKey(219, true, false).on('down', this.keysEntered, this)

    //add german buttons
    this.allCharacterButtons = {}
    let xButton = (this.fullWidth/2) - (80 * 2)
    for (var char of ['ä', 'ö', 'ü', 'ß'] ) {
      let b = new InputButton(this.scene, xButton, this.bottomY + this.textBox.height + 8, char, { fill: "#4ceaee", fontSize: this.buttonSize }, this.keyButtonPressed, this)
      this.scene.add.existing(b);
      this.allCharacterButtons[char] = b
      xButton = xButton + 80
    }

    this.setupSuccess = true
  }

  setupTouchEntry() {
    // add black rectangles on side input area
    this.graphics = this.scene.add.graphics();
    this.graphics.fillStyle(0x000000, 1);
    this.graphics.setDepth(1)
    this.graphics.fillRect(0, 0, this.sideWidth, this.fullHeight)
    this.graphics.fillRect(this.fullWidth - this.sideWidth, 0, this.sideWidth, this.fullHeight)

    // create all buttons set to invisible
    this.allCharacterButtons = {}
    for (var char of this.allCharacters()) {
      let b = new InputButton(this.scene, 0, this.bottomY + this.textBox.height + 8, char, { fill: "#4ceaee", fontSize: this.buttonSize }, this.keyButtonPressed, this).setActive(false).setVisible(false)
      b.setDepth(2)
      this.scene.add.existing(b);
      this.allCharacterButtons[char] = b
    }

    this.setupSuccess = true
  }

  back() {
    let text = this.getText()
    if (text.length > 0) {
      this.setText(text.substring(0, text.length - 1))
    }
  }

  keyButtonPressed(key) {
    this.setText(this.getText() + key)
  }

  allAnswers() {
    if (this._allAnswers) { return this._allAnswers}
    var words = this.scene.cache.json.get('words')
    this._allAnswers = words.map((word)=> word.answer)
    return this._allAnswers
  }

  allCharacters() {
    // determin all possible button characters from potential answers
    if (this._allChars) { return this._allChars }
    var chars = [];
    for (var answer of this.allAnswers()) {
      var charGroups = this.splitAnswer(answer)
      for ( var c of charGroups ) {
          if (!chars.includes(c)){
              chars.push(c)
          }
      }
    }
    this._allChars = chars
    return this._allChars
  }

  splitAnswer(answer) {
    //remove all spaces
    var ans  = this.removeAllSpaces(answer)
    var max_chars = 2
    var match = `.{1,${max_chars}}`;
    var re = new RegExp(match,"g");
    return ans.match(re)
  }

  removeAllSpaces(text) {
    return text.replace(/ /g,'')
  }

  clearAvailableChars() {
    for (var char of Object.values(this.allCharacterButtons)) {
      char.setActive(false).setVisible(false).setX(0)
    }
  }

  setAnswerText(answerText) {
    this.answerText = answerText
    this.setText('')
    this.showAvailableButtons()
  }

  showAvailableButtons() {
    if (this.inputType !== 'Touch') { return false }
    this.clearAvailableChars()
    let topPadding = 60
    let buttonHeight = this.allCharacterButtons[Object.keys(this.allCharacterButtons)[0]].height

    let availableChars = this.getAvailableCharKeys()
    let yIncrement = (this.fullHeight - topPadding) / (Math.round(availableChars.length / 2) + 1)

    let xButton1 = Math.round(this.sideWidth / 2)
    let xButton2 = this.fullWidth - Math.round(this.sideWidth / 2)
    let yButton = topPadding + yIncrement - (buttonHeight /2)
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

  gameTextRemoved(answerText) {
    if (answerText === this.answerText) {
      this.answerText= ''
      this.setText('')
      this.showAvailableButtons()
    }
  }

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
      let randomChar = this.allCharacters()[getRandomInt(0, this.allCharacters().length -1)]
      if (!availableChars.includes(randomChar)){
        availableChars.push(randomChar)
      }
    } while(availableChars.length < NO_AVAILABLE_CHARACTERS)

    return shuffle(availableChars)
  }


  setText(text) {
    if (text.trim() !== '' && this.answerText !== '' ) {
      if (!this.answerText.trim().startsWith(text)) {
        this.scene.cameras.main.shake(100, 0.05);
        this.scene.sound.playAudioSprite('sfx', 'smb_bump');
        return false
      }

      if (this.answerText.charAt(text.length) == ' ') {
        //add space if next character in answer is a space
        this.textBox.setText(text + ' ')
      } else { this.textBox.setText(text) }
    } else {
      this.textBox.setText(text)
    }

    if (text.trim() !== '') { this.scene.sound.playAudioSprite('sfx', 'smb_stomp') }

    this.textBox.setX((this.fullWidth / 2) - (this.textBox.width / 2))
    if (this.getText() === this.answerText && this.answerText !== '') {
      this.fire()
    }

  }

  fire() {
    this.funcOnFire(this.getText())
    this.answerText=''
    this.setText('')
    this.showAvailableButtons()
  }

  getText() {
    return this.textBox.text
  }

  keysEntered(eventName, event) {
    if (event) {
      switch (event.key) {
        case 'Backspace':
          this.back()
          break;
        case 'Enter':
          this.fire()
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
