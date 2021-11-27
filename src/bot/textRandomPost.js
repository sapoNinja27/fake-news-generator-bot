const fakeBot = require("./Twit");
const fraseService = require('../services/frase-service')
const palavraService = require('../services/palavra-service')
const imagemService = require('../services/image-service')
const _ = require('lodash')
function randonNews() {
  fraseService.find().then(function (data) {
    if (_.isNil(data) || _.isEmpty(data)) {
      return;
    }
    var frase = data[0].conteudo;
    var noticia = "";
    var array = frase.split("");
    var ocorrenciaPalavra = (frase.split("@").length - 1);
    palavraService.find(ocorrenciaPalavra).then(function (palavras) {
      if (_.isNil(palavras) || _.isEmpty(palavras)) {
        return;
      }
      let paralvrasList = [];
      palavras.forEach(element => {
        paralvrasList.push(element.conteudo);
      });
      array.forEach(letra => {
        if (letra == "@") {
          noticia += paralvrasList[ocorrenciaPalavra-1];
          ocorrenciaPalavra--;
        } else {
          noticia += letra;
        }
      });
      imagemService.find(paralvrasList[0]).then(function(imageObj){
        let imgIds = []
        if(!_.isNil(imageObj)){
          // imgIds = imageObj.map(i=>{
          //   return parseInt(i.conteudo)
          // })
        }
        const status = {
          status: noticia+" fake.new/jda32a #bot🐀",
          media_ids: [imgIds]
        }
        fakeBot.post(
          'statuses/update', status,
          function (err, data, response) {
            if (err) {
              console.log("ERRO: " + err);
              return false;
            }
            console.log("Tweet postado com sucesso!\n");
          }
        )
      })
    })
  });
}
module.exports = randonNews;