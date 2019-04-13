import Block from '../sprites/Block';
import FallingText from '../sprites/FallingText';

class GameScene extends Phaser.Scene {
    constructor(test) {
        super({
            key: 'GameScene'
        });
    }

    preload() {
       
    }

    create() {
       
      
        // // Add and play the music
        // this.music = this.sound.add('overworld');
        // this.music.play({
        //     loop: true
        // });

        this.tilesGroup = this.add.group()
        this.fallingTextGroup = this.add.group()

        let rows = this.getRows(200)
        rows.forEach((row) => {
            row.x.forEach((x) => {
                let b = new Block({
                    scene: this,
                    key: 'block',
                    x: x,
                    y: row.y
                })
                this.tilesGroup.add(b, this)
            })
        })

        // this.physics.add.collider(this.fallingTextGroup, this.tilesGroup);
        this.physics.add.overlap(this.fallingTextGroup, this.tilesGroup, this.smashBlock, null, this);
    }

    smashBlock(fallingText, block) {
        console.log(fallingText)
        console.log(block)
        fallingText.blowUp()
        block.blowUp()
    }   


    getRows(noBlocks) {
        let rows = [];
        let i = 0
        while (i < noBlocks) {
            let randomX = this.getRandomTileX()
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
            let y = 695 - (rowIndex * 11)
            row.y=y
        })
       
        return rows
    }

    // getRandomRow() {
    //     let arrayX = [];
    //     let i = 0
    //     while (i < 50) {
    //         let random = this.getRandomTileX()
    //         if(!arrayX.includes(random)) {
    //             arrayX.push(random)
    //         }
    //         i++    
    //     }
    //     return arrayX

    // }

    getRandomTileX () {
        let min=0; 
        let max=99;  
        let random = Math.floor(Math.random() * (+max - +min)) + +min;
        return (random * 10) + 5
    }

    update(time, delta) {
        if(this.fallingTextGroup.countActive() < 1) {
            let b = new FallingText({
                    scene: this,
                    x: this.getRandomTileX(),
                    y: 0,
                    text: "Here",
                    opts: { fill: "#de77ae" }
                })
                this.fallingTextGroup.add(b, this)
                // this.physics.add.collider(this.fallingTextGroup, this.tilesGroup);
                
        }

        
    }
      
  
}

export default GameScene;
