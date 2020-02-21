# Brown Space Engineering API

## Setting up a Local Development Environment
1. Install NodeJS and NPM (typically through a single installer or package for your OS) as well as Docker.
2. Start a MongoDB instance on port 27017 with `docker run --rm -p 27017:27017 mongo`.
3. Clone the `bse-api` repository.
4. Set up submodules (used for a couple libraries)
   ```
   git submodule init
   git submodule update
   ```
5. Install npm packages: `npm i`
6. Add two config files for local development:

   `.env` (don't miss the dot)
   ```
   DATABASE_URI="127.0.0.1:27017"
   CONST1=1000
   CONST2=500
   MULTIPLIER=300000
   SECRET="foobar"
   ```
   
   and `config.js` based on `config-sample.js` (i.e. run `cp config-sample.js config.js`)
