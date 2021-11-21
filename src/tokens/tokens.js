require("dotenv").config();
const twitterApp = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,    
    access_token: process.env.ACCESS_TOKEN,    
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
    timeout_ms: 60 * 1000
  };
  module.exports.requireKey = process.env.REQUIRE_KEY;
  module.exports.accesKey = process.env.ACCESS_KEY;
  module.exports.twit = {
    twitterApp,
    userName: process.env.USERNAME
  };
  module.exports.botId = process.env.BOT_ID;
  module.exports.rota = process.env.ROTA;
