/*
Generic enemy class that extends Phaser sprites.
Classes for enemy types extend this class.
*/

export default class InputText extends Phaser.GameObjects.Text {
    constructor(config) {
        super(config.scene, config.x, config.y, config.text, config.opts);
        config.scene.add.existing(this);
        this.alphaKeys = this.scene.input.keyboard.addKeys("a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,ö,ä,ü,BACKSPACE", true, false)
        for (var key in this.alphaKeys ) {
            this.alphaKeys[key].on('down', this.keysEntered, this)
        }
        // add german keys
        this.scene.input.keyboard.addKey(186, true, false).on('down', this.keysEntered, this)
        this.scene.input.keyboard.addKey(222, true, false).on('down', this.keysEntered, this)
        this.scene.input.keyboard.addKey(192, true, false).on('down', this.keysEntered, this)
        this.scene.input.keyboard.addKey(219, true, false).on('down', this.keysEntered, this)
    }



    keysEntered(eventName, event) {
        if (event) {
            switch (event.key) {
                case 'Backspace':
                    if (this.text.length > 0 ) {
                        this.setText(this.text.slice(0, this.text.length -1))
                    }
                    break;
                case 'Enter':
                    break;
                default:
                    this.setText(this.text + event.key)
                }
        }

    }



}
