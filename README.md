
#### Phaser 3 + ES6 + Webpack

Konjugator!



# Setup
You’ll need to install a few things before you have a working copy of the project.

## 1. Clone this repo:



## 2. Install node.js and npm:

https://nodejs.org/en/


## 3. Install dependencies (optionally you could install [yarn](https://yarnpkg.com/)):

Navigate to the cloned repo’s directory.

Run:

```npm install```

or if you choose yarn, just run ```yarn```

## 4. Run the development server:

Run:

```npm run dev```

This will run a server so you can run the game in a browser.

Open your browser and enter localhost:3000 into the address bar.

Also this will start a watch process, so you can change the source and the process will recompile and refresh the browser.


## Build for deployment:

Run:

```npm run deploy```

This will optimize and minimize the compiled bundle.

## Import from package


import startGame '@salza80/konjugator'

After npm install copy @salza80/konjugator/assets to public/[assetpathname]

set assetpath in config

  game.startGame({
    start_text: 'Konjugiere das verb! Bist du bereit?',
    words_url: 'url to json',
    asset_path: '[assetpathname]/'
  }) 