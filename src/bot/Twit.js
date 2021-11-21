const Twit = require("twit");
const tokens = require("../tokens/tokens");
const T = new Twit(tokens.twit.twitterApp);
module.exports = T;