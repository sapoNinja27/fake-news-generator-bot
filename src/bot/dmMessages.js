const fakeBot = require("./Twit");
const _ = require('lodash');
const palavraService = require('../services/palavra-service')
const fraseService = require('../services/frase-service')
const imagemService = require('../services/image-service')


const admWord = require('../tokens/tokens').accesKey;
var comandos = [admWord, 'imagem', 'fundo', 'frase', 'palavra', 'help'];
var localAdm = '';
var botId = require('../tokens/tokens').botId;;
var lastMessageId = '';
var itemId = '';
var lastConteudo = '';
var trancaBot = false;
var tipoAvaliacao = "";

function readMessages() {
  fakeBot.get("/direct_messages/events/list").then(function (value) {
    if (lastConteudo == value.data.events[0].message_create.message_data.text) {
      return
    }

    lastConteudo = value.data.events[0].message_create.message_data.text;
    checarConteudo(lastConteudo);

    if (trancaBot) {
      return;
    }

    var recebidas = filtrarRecebidas(value);
    var respondidas = filtrarRespondidas(value);

    var novasChamadas = filtrarNovasChamadas(recebidas, respondidas);

    var naoRespondidas = filtraNaoRespondidas(recebidas, respondidas);

    send(novasChamadas);
    send(naoRespondidas);
  });
}

function checarConteudo(lastMessage) {
  if (_.isEqual(lastMessage, "aprovado") && trancaBot) {
    aprovar();
  }
  if (_.isEqual(lastMessage, "recusado") && trancaBot) {
    recusar();
  }
}
function filtraNaoRespondidas(recebidas, respondidas) {
  return recebidas
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
}
function filtrarNovasChamadas(recebidas, respondidas) {
  return recebidas.filter(function (mensagemRecebida) {
    var respondidasPraEssa = (respondidas
      .filter(function (mensagenRespondida) {
        return mensagenRespondida.message_create.target.recipient_id == mensagemRecebida.message_create.sender_id;
      }))[0];
    return respondidasPraEssa == undefined;
  });
}
function filtrarRespondidas(value) {
  return (value.data.events).filter(function (a) {
    return a.message_create.sender_id == botId;
  })
}
function filtrarRecebidas(value) {
  return (value.data.events).filter(function (a) {
    return verifyWords(a.message_create.message_data.text) && a.message_create.sender_id != botId;
  })
}
function aprovar() {
  if (_.isEqual(tipoAvaliacao, 'frase')) {
    fraseService.update(itemId).then(function () {
      trancaBot = false;
      avaliar(tipoAvaliacao);
    })
  }
  if (_.isEqual(tipoAvaliacao, 'palavra')) {
    palavraService.update(itemId).then(function () {
      trancaBot = false;
      avaliar(tipoAvaliacao);
    })
  }
  if (_.isEqual(tipoAvaliacao, 'imagem')) {
    imagemService.update(itemId).then(function () {
      trancaBot = false;
      avaliar(tipoAvaliacao);
    })
  }
}

function recusar() {
  if (_.isEqual(tipoAvaliacao, 'frase')) {
    palavraService.delete(itemId).then(function () {
      trancaBot = false;
      avaliar(tipoAvaliacao);
    })
  }
  if (_.isEqual(tipoAvaliacao, 'palavra')) {
    palavraService.delete(itemId).then(function () {
      trancaBot = false;
      avaliar(tipoAvaliacao);
    })
  }
  if (_.isEqual(tipoAvaliacao, 'imagem')) {
    imagemService.delete(itemId).then(function () {
      trancaBot = false;
      avaliar(tipoAvaliacao);
    })
  }
}

function ajustarHorario(value) {
  var h = value.split('/');
  initPubs[0] = (h[0].split(':'))[0]
  initPubs[1] = (h[0].split(':'))[1]
  timerPublicacao = h[1] * 60000 * 60
}
function sendToAdm(conteudo, id, imagem) {
  if (!conteudo) {
    return "todas as " + tipoAvaliacao + "s avaliadas"
  }
  itemId = id;
  var attch = null;
  if (imagem) {
    attch = {
      type: "media",
      media: {
        id: imagem
      }
    };
  }
  fakeBot.post('direct_messages/events/new', {
    event: {
      type: "message_create",
      message_create: {
        target: {
          recipient_id: localAdm
        },
        message_data: {
          text: conteudo,
          attachment: attch
        }
      }
    }
  }, (error, event) => {
    if (error) {
      console.log(error)
    }
  })
}
function avaliar(value) {
  tipoAvaliacao = value;
  if (value.includes("frase")) {
    fraseService.findAll().then(function (data) {
      data.forEach(element => {
        console.log(element)
        if (!element.avaliada && !trancaBot) {
          trancaBot = true;
          sendToAdm(element.conteudo, element._id)
        }
      });
    })
  }

  if (value.includes("palavra")) {
    palavraService.findAll().then(function (data) {
      data.forEach(element => {
        if (!element.avaliada && !trancaBot) {
          trancaBot = true;
          sendToAdm(element.conteudo, element._id)
        }
      });
    })
  }

  if (value.includes("imagem")) {
    imagemService.findAll().then(function (data) {
      data.forEach(element => {
        if (!element.avaliada && !trancaBot) {
          trancaBot = true;
          fakeBot.post("media/upload", { media: element.conteudo }, function (error, media, response) {
            if (error) {
              console.log(error)
            } else {
              sendToAdm(element.descricao, element._id, media.media_id_string)
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
    var parse = value.split("palavra: ")[1]
    if (lastConteudo == parse) {
      return
    }
    lastConteudo = parse;
    var tipo = {
      conteudo: parse
    };
    palavraService.save(tipo).then(function (data) {
      console.log(data)
    })
  }
  if (value.includes("frase")) {
    var parse = value.split("frase: ")[1]
    lastConteudo = parse;
    var tipo = {
      conteudo: parse
    };
    fraseService.save(tipo).then(function (data) {
      console.log(data)
    })
  }
  if (value.includes("imagem")) {
    var parse = value.split("'")
    lastConteudo = parse[1];
    imagemService.convert(parse[1]).then(function (data) {
      var desc = parse[2].split(' descricao: ')[1];
      var tipo = {
        conteudo: data,
        descricao: desc
      };
      palavraService.save({
        conteudo: tipo.descricao
      }).then(function (data) {
        console.log(data)
      })
      imagemService.save(tipo).then(function (data) {
        console.log(data)
      })

    })
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

function send(value) {
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