const axios = require("axios")
const rota = require('../tokens/tokens').rota + "imagem/corpo";
const auth = require('../tokens/tokens').requireKey;

module.exports.convert = function(url) {
  return axios
    .get(url, {
      responseType: 'arraybuffer'
    })
    .then(response => Buffer.from(response.data, 'binary').toString('base64'))
}

module.exports.find = function(descricao) {
  return axios
    .get(rota + "/find/"+descricao)
    .then(response => response.data)
    .catch(error => error)
}

module.exports.findAll = function() {
  return axios
    .get(rota + "/findAll")
    .then(response => response.data)
    .catch(error => error)
}

module.exports.save = function(obj) {
  return axios
    .post(rota + "/save/",obj)
    .then(response => response.data)
    .catch(error => error)
}

module.exports.update = function(id) {
  return axios
    .put(rota + "/update/" + id,{avaliada: true}, {
      headers: {
        'Authorization': auth
      }
    })
    .then(response => response.data)
    .catch(error => error)
}

module.exports.delete = function(id) {
  return axios
    .delete(rota + "/delete/"+id, {
      headers: {
        'Authorization': auth
      }
    })
    .then(response => response.data)
    .catch(error => error)
}