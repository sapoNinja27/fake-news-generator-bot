const https = require('https')


module.exports.find = function(url){
    https.get(url, res => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
        });
        res.on('end', () => {
          data = JSON.parse(data);
          console.log(data);
        })
      }).on('error', err => {
        console.log(err.message);
      })
};