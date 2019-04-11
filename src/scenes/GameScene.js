import Block from '../sprites/Block';

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

        let tilesGroup = this.add.group()

        let rows = this.getRows(200)
        rows.forEach((row) => {
            row.x.forEach((x) => {
                let b = new Block({
                    scene: this,
                    key: 'block',
                    x: x,
                    y: row.y
                })
                tilesGroup.add(b, this)
            })
        })
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
      
    }

  
}

export default GameScene;
