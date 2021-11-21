const fakeBot = require("./Twit");
const _ = require('lodash');
const palavraService = require('../services/palavra-service')
const fraseService = require('../services/frase-service')


const admWord = require('../tokens/tokens').accesKey;
var comandos = [admWord, 'imagem', 'fundo', 'frase', 'palavra', 'help'];
var localAdm = '';
var botId = require('../tokens/tokens').botId;;
var lastMessageId = '';
var tempFrases = [];
var trancaBot = false;
var tipoAvaliacao = "";

function avaliarPosts() {
  return "Avaliando posts"
}
function ajustarHorario(value) {
  var h = value.split('/');
  initPubs[0] = (h[0].split(':'))[0]
  initPubs[1] = (h[0].split(':'))[1]
  timerPublicacao = h[1] * 60000 * 60
}
function avaliar(value) {
  tipoAvaliacao = value;
  if (value.includes("frase")) {
    fraseService.findAll().then(function (data) {
      data.forEach(element => {
        if (!element.avaliada && !trancaBot) {
          trancaBot = true;
          fakeBot.post('direct_messages/events/new', {
            event: {
              type: "message_create",
              message_create: {
                target: {
                  recipient_id: localAdm
                },
                message_data: {
                  text: "id:" + element._id + ": \n\n" + element.conteudo
                }
              }
            }
          }, (error, event) => {
            if (error) {
              console.log(error)
            }
          })
        }
      });
    })
  }

  if (value.includes("palavra")) {
    palavraService.findAll().then(function (data) {
      data.forEach(element => {
        if (!element.avaliada && !trancaBot) {
          trancaBot = true;
          fakeBot.post('direct_messages/events/new', {
            event: {
              type: "message_create",
              message_create: {
                target: {
                  recipient_id: localAdm
                },
                message_data: {
                  text: "id:" + element._id + ": \n\n" + element.conteudo
                }
              }
            }
          }, (error, event) => {
            if (error) {
              console.log(error)
            }
          })
        }
      });
    })
  }
}
function verifyCommandsADM(value) {
  var newValue = value.split(admWord + " ")[1];
  if (newValue.includes("sugestoes")) {
    var sugestao = newValue.split('sugestoes ')[1]
    return avaliar(sugestao);
  }
  if (newValue.includes("horarios")) {
    return ajustarHorario((newValue.split("horarios ")[1]))
  }
  if (newValue.includes("post")) {
    return "Post manual"
  }
  return "eu sou um bot burro"
}
function verifyCommands(value) {
  if (value.includes("palavra")) {
    var tipo = {
      conteudo: value.split("palavra: ")[1]
    };
    palavraService.save(tipo)
  }
  if (value.includes("frase")) {
    var tipo = {
      conteudo: value.split("frase: ")[1]
    };
    fraseService.save(tipo)
  }
  return "Sugestão enviada para avaliação \nHehe 🐀"
}
function verifyWords(comando) {
  let isComando = false;
  comandos.forEach(element => {
    if (comando.includes(element)) {
      isComando = true;
    }
  });
  return isComando;
}
function readMessages() {
  /*
   media: {
      id: 1462521441652547600,
      id_str: '1462521441652547584',
      indices: [Array],
      media_url: 'https://ton.twitter.com/1.1/ton/data/dm/1462521464100425732/1462521441652547584/XKWbSM1G.png',
      media_url_https: 'https://ton.twitter.com/1.1/ton/data/dm/1462521464100425732/1462521441652547584/XKWbSM1G.png',
      url: 'https://t.co/F8kYzSvRFz',
      display_url: 'pic.twitter.com/F8kYzSvRFz',
      expanded_url: 'https://twitter.com/messages/media/1462521464100425732',
      type: 'photo',
      sizes: [Object]
    }
  */
  const status = {
    status: "Teste postando duas imagens",
    media_ids: [1462524558934790150]
  }
  fakeBot.post("statuses/update", status, function (error, tweet, response) {
    if (error) {
      console.log(error)
    } else {
      console.log("Successfully tweeted an image!")
    }
  })
  fakeBot.get("/direct_messages/events/list").then(function (value) {
    console.log(value.data.events[2].message_create.message_data)
    var lastMessage = (value.data.events[0].message_create.message_data.text);
    var anteLastMessage = (value.data.events[1].message_create.message_data.text);

    if (_.isEqual(lastMessage, "aprovado") && trancaBot) {
      var id = anteLastMessage.split(":")[1];
      if (_.isEqual(tipoAvaliacao, 'frase')) {
        fraseService.update(id).then(function () {
          trancaBot = false;
          avaliar(tipoAvaliacao);
        })
      }
      if (_.isEqual(tipoAvaliacao, 'palavra')) {
        palavraService.update(id).then(function () {
          trancaBot = false;
          avaliar(tipoAvaliacao);
        })
      }
    }
    if (_.isEqual(lastMessage, "recusado") && trancaBot) {
      var id = anteLastMessage.split(":")[1];
      if (_.isEqual(tipoAvaliacao, 'frase')) {
        palavraService.delete(id).then(function () {
          trancaBot = false;
          avaliar(tipoAvaliacao);
        })
      }
      if (_.isEqual(tipoAvaliacao, 'palavra')) {
        palavraService.delete(id).then(function () {
          trancaBot = false;
          avaliar(tipoAvaliacao);
        })
      }
    }
    if (trancaBot) {
      return;
    }
    var recebidas = (value.data.events).filter(function (a) {
      return verifyWords(a.message_create.message_data.text) && a.message_create.sender_id != botId;
    })
    var respondidas = (value.data.events).filter(function (a) {
      return a.message_create.sender_id == botId;
    })

    var novasChamadas = recebidas.filter(function (mensagemRecebida) {
      var respondidasPraEssa = (respondidas
        .filter(function (mensagenRespondida) {
          return mensagenRespondida.message_create.target.recipient_id == mensagemRecebida.message_create.sender_id;
        }))[0];
      return respondidasPraEssa == undefined;
    });

    var naoRespondidas = recebidas
      .filter(function (rec) {
        var dataRec = rec.created_timestamp;

        var datasResp = respondidas
          .filter(function (res) {
            return res.message_create.target.recipient_id == rec.message_create.sender_id;
          })
          .map(function (timestamp) {
            return timestamp.created_timestamp;
          }).sort(function (a, b) {
            return b - a;
          });
        return datasResp[0] < dataRec;
      });

    send(novasChamadas);
    send(naoRespondidas);
  });
}
function mensagem(value, sender_id) {
  if (value.includes(admWord)) {
    if (_.isEqual(value, 'leafeon help')) {
      return "Selecione a opção desejada: \n\n1. Avaliar publicações \n2. Definir horarios de postagem \n3. Post manual \n4. Avaliar sugestões"
    }
    localAdm = sender_id;
    return verifyCommandsADM(value);
  }
  if (_.isEqual('help', value)) {
    return "Saudações, eu sou um bot que gera noticias falsas baseadas em templates. \n\n\nMeus comandos são: \n\n1.imagem: sugere uma imagem(não funciona) \n2.frase: segere um texto(adicione @ nos vãos que serão sustituidos por palavras) \n3.palavra: sugere um nome proprio a ser usado para preencher a frase \n4.template: sugere um template de noticia(não funciona) \nHehe 🐀"
  }
  return verifyCommands(value);
}
function send(value){
  value.forEach(element => {
    var texto = mensagem(element.message_create.message_data.text, element.message_create.sender_id);
    if (_.isEmpty(texto)) {
      return;
    }
    if (element.id != lastMessageId) {
      lastMessageId = element.id;
      fakeBot.post('direct_messages/events/new', {
        event: {
          type: "message_create",
          message_create: {
            target: {
              recipient_id: element.message_create.sender_id
            },
            message_data: {
              text: texto
            }
          }
        }
      }, (error, event) => {
        if (error) {
          console.log(error)
        }
      })
    }
  });
}
module.exports = readMessages;