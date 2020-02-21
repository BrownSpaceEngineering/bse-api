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
   CONST1=1193
   CONST2=547
   MULTIPLIER=200000
   SECRET="blahblah"
   ```
   
   and `config.js`
   ```
   // basic server-specific configuration for API
   exports.SERVER_PORT = 3000;
   exports.SLACK_WEBHOOK_URL = "http://localhost:3000"
   exports.EMAIL_RECIPIENTS = {
     // "someone@gmail.com": "full"
   };
   // email config as used by emailjs
   exports.EMAIL_CONFIG = {
     user: "me.me",
     password:"mysecretpassword",
     host: "smtp.gmail.com",
     ssl: true
   };
   exports.FROM_ADDRESS = "this.is.an.email@gmail.com";
   exports.TWIT_CONFIG = null;
   ```
