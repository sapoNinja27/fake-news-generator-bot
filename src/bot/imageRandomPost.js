const fakeBot = require('./Twit');
const fs = require('fs');
var timerPublicacao = 60000 * 60;
var initPubs = ['07', '30']
var getImagem = require('../services/image-service')

function publicNews() {
  var imageData;
  getImagem("https://ton.twitter.com/i/ton/data/dm/1462524558934790150/1462524525602615298/DGEPgoZ6.png:small").then(function (data) {
    imageData = data;
    fakeBot.post("media/upload", { media: imageData }, function (error, media, response) {
      if (error) {
        console.log(error)
      } else {
        const status = {
          status: "Teste postando duas imagens",
          media_ids: [media.media_id_string]
        }
        fakeBot.post("statuses/update", status, function (error, tweet, response) {
          if (error) {
            console.log(error)
          } else {
            console.log("Successfully tweeted an image!")
          }
        })
      }
    })
  }
  )
}
function checkTime() {
  var localHour = new Date().getHours();
  var localminutes = new Date().getMinutes();
  if ((initPubs[0] == localHour && initPubs[1] < localminutes) || initPubs[0] < localHour) {
    publicNews();
    setInterval(publicNews, timerPublicacao);
  }
}
module.exports = checkTime;