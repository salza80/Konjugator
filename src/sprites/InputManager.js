import Phaser from 'phaser';
import InputButton from './InputButton.js'

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
    this.textBox = this.scene.add.text(this.fullWidth / 2, this.bottomY, '', {fill: "#00ff00", fontSize: this.textBoxSize })
    this.answerText = ''
    this.setupSuccess = false
    this.scene.events.once('shutdown', this.destroy, this)

    if (this.inputType === 'Voice') {
      this.setupSpeechRecognitionEntry()
    } else if (this.inputType === 'Touch') {
      this.setupTouchEntry()
    } else { this.setupKeyboardEntry() }
  }

  destroy() {
    this.destroyed = true
    this.scene.game.canvas.removeEventListener('keydown', this.keyboardHandler)
    if (this.recognition) {
      this.recognition.onresult = null
      this.recognition.onerror = null
      this.recognition.onend = null
      this.recognition.onaudiostart = null
      this.recognition.onspeechend = null
      this.recognition.onnomatch = null
      this.recognition.abort()
    }
  }

  setupSpeechRecognitionEntry() {

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList


    if (!SpeechRecognition) {
      this.inputType = 'Keyboard'
      this.setupKeyboardEntry()
      this.scene.add.text(100, 110, 'Voice input is unavailable in this browser. Keyboard input is enabled.', { fill: '#ff0', fontSize: 20 })
      return
    }

    const speechButtonPressed = () => {
      if (this.listening) { return }
      try {
        this.voiceShot = false
        this.recognition.start()
        this.listening = true
        this.speechButton.setText('Listening…')
      } catch {
        this.listening = false
        this.speechButton.setText('Try again')
      }
    }

    this.speechButton = new InputButton(this.scene, this.fullWidth / 2, this.bottomY + this.textBox.height + 8, "Talk", { fill: "#4ceaee", fontSize: this.buttonSize }, speechButtonPressed, this).setActive(true).setVisible(true)
    this.speechButton.setDepth(2)
    this.speechButton.x = this.speechButton.x - (this.speechButton.width / 2)
    this.scene.add.existing(this.speechButton);

    var answers = this.allAnswers()

    var grammar = '#JSGF V1.0; grammar answers; public <answers> = ' + answers.join(' | ') + ' ;'

    this.recognition = new SpeechRecognition();
    if (SpeechGrammarList) {
      this.speechRecognitionList = new SpeechGrammarList();
      this.speechRecognitionList.addFromString(grammar, 1);
      this.recognition.grammars = this.speechRecognitionList;
    }
    this.recognition.continuous = false;
    this.recognition.lang = 'de-DE';
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    this.recognition.onerror = (event) => {
      this.listening = false
      this.speechButton.setText(event.error === 'not-allowed' ? 'Microphone blocked' : 'Try again')
    }
    
    this.recognition.onresult = (event) => {
      if (this.voiceShot || this.destroyed || !this.scene.scene.isActive()) { return }
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        if (!result.length) { continue }
        const prefix = Array.from(event.results).slice(0, index).map((part) => part[0].transcript).join(' ')
        const transcript = (alternative) => `${prefix} ${alternative.transcript}`.trim()
        this.setText(transcript(result[0]))
        // Interim alternatives may change: only use the leading exact match.
        const alternatives = result.isFinal ? Array.from(result) : [result[0]]
        for (const alternative of alternatives) {
          const answer = transcript(alternative)
          if (this.funcOnFire(answer, false)) {
            this.voiceShot = true
            this.setText(answer)
            this.speechButton.setText('Stopping…')
            this.recognition.stop()
            return
          }
        }
        // Wait for the final result before reporting an incorrect answer.
        if (result.isFinal) { this.funcOnFire(this.getText()) }
      }
    }

    this.recognition.onend = () => {
      this.listening = false
      if (this.speechButton.text === 'Listening…' || this.speechButton.text === '...' || this.speechButton.text === 'Stopping…') {
        this.speechButton.setText('Talk')
      }
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
    // Listen once to each DOM event; rapid keys can be replayed by Phaser's frame queue.
    this.keyboardHandler = (event) => {
      if (this.scene.scene.isActive()) { this.keysEntered(event) }
    }
    this.scene.game.canvas.addEventListener('keydown', this.keyboardHandler)

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
    return ans.match(re) || []
  }

  removeAllSpaces(text) {
    return text.replace(/\s/g, '')
  }

  clearAvailableChars() {
    for (var char of Object.values(this.allCharacterButtons)) {
      char.setActive(false).setVisible(false).setX(0)
    }
  }

  setAnswerText(answerText) {
    if (this.destroyed || !this.textBox.scene) { return }
    this.answerText = answerText
    this.setText('')
    this.showAvailableButtons()
  }

  showAvailableButtons() {
    if (this.inputType !== 'Touch') { return false }
    this.clearAvailableChars()
    let topPadding = 60
    const firstButton = Object.values(this.allCharacterButtons)[0]
    if (!firstButton) { return }
    let buttonHeight = firstButton.height

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
    if (this.destroyed || !this.textBox.scene) { return }
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

    const distractors = Phaser.Math.RND.shuffle(this.allCharacters().filter((char) => !availableChars.includes(char)))
    availableChars.push(...distractors.slice(0, Math.max(0, NO_AVAILABLE_CHARACTERS - availableChars.length)))

    return Phaser.Math.RND.shuffle(availableChars)
  }


  setText(text) {
    if (this.inputType === 'Touch' && this.answerText !== '') {
      const compact = this.removeAllSpaces(text)
      if (!this.removeAllSpaces(this.answerText).startsWith(compact)) {
        this.scene.cameras.main.shake(100, 0.05)
        this.scene.sound.playAudioSprite('sfx', 'smb_bump')
        return false
      }
      let count = 0
      let end = 0
      while (end < this.answerText.length && count < compact.length) {
        if (!/\s/.test(this.answerText[end])) { count++ }
        end++
      }
      while (end < this.answerText.length && /\s/.test(this.answerText[end])) { end++ }
      this.textBox.setText(this.answerText.slice(0, end))
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

  keysEntered(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) { return }
    if (event.key === 'Backspace') {
      event.preventDefault()
      this.back()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      this.fire()
    } else if (/^[a-zäöüß ]$/i.test(event.key)) {
      event.preventDefault()
      this.setText(this.getText() + event.key)
    } else if ('1234'.includes(event.key) && event.key.length === 1) {
      event.preventDefault()
      this.setText(this.getText() + ['ä', 'ö', 'ü', 'ß'][Number(event.key) - 1])
    }
  }
}
