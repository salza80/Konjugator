import { getRandomInt } from '../helpers/util.js'
/*
Generic enemy class that extends Phaser sprites.
Classes for enemy types extend this class.
*/


export default class Block extends Phaser.GameObjects.Sprite {
    constructor(config) {
        super(config.scene, config.x, config.y, config.key);
        config.scene.physics.world.enable(this);
      

        // start still and wait until needed
        // this.body.setCollideWorldBounds(true);
        this.body.allowGravity = false;
        this.body.setImmovable(true);
        this.beenSeen = false;


        // Standard sprite is 16x16 pixels with a smaller body
        this.setSize(10, 10);
        this.setDisplaySize(10, 10)
        

    // If you've scaled a Sprite by altering its `width`, `height`, or `scale` and you want to
    // position the Body relative to the Sprite's dimensions (which will differ from its texture's
    // dimensions), you should divide these arguments by the Sprite's current scale:
    //
        // this.body.setSize(10 / this.scaleX, 10 / this.scaleY)
    //

        // this.body.offset.set(10, 12);
    }

    blowUp() {
      this.destroy()

    }

    static createStartBlocks(noBlocks, scene) {
      let rows = Block.getRows(200)
      let blocks = [];
      rows.forEach((row) => {
          row.x.forEach((x) => {
              blocks.push(new Block({
                  scene: scene,
                  key: 'block',
                  x: x,
                  y: row.y
                })
              )
          })
      })
      return blocks;

    }

    

    static getRows(noBlocks) {
        let rows = [];
        let i = 0
        while (i < noBlocks) {
            let randomX = Block.getRandomTileX()
            rows.forEach((row, rowIndex) => {
                if(!row.x.includes(randomX)){
                    row.x.push(randomX)
                    randomX = undefined
                    return false;
                }
            })
            if (randomX){
                rows.push({y: undefined, x: [randomX]})
            }
            i++    
        }

        rows.forEach((row, rowIndex) => {
            let y = 595 - (rowIndex * 11)
            row.y = y
        })
       
        return rows
    }

    static getRandomTileX () {
      return (getRandomInt(0,99) * 10) + 5
    }
}
