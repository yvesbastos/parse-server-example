var http = require('http');

Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});


Parse.Cloud.define("getProducts", function(request, response) {
  console.log("Initializing getProducts");
  const query = new Parse.Query("ProductSearch");
  var limit = request.params.limit;
  var skip = request.params.skip;
  var location = request.params.location;
  var radius = request.params.radius;
  var description = request.params.description;

  if (!limit) {
      limit = 100
  }

  if (!skip) {
    skip = 0
  }

  if (!radius) {
    radius = 10
  }

  query.limit = limit
  query.skip = skip

  //TODO: not working
  //query.withinKilometers("location", radius);
  query.include("store");

  //PROBLEMA: se o usuario estiver em Arapiraca e ja tiver
  //resultados de Maceio no Parse, ele nunca vai conseguir
  //ver resultados de Arapiraca
  query.contains("body", description)
    .find()
    .then((results) => {
      if  (results != null && results.length > 0) {
        response.success(results);
      } else {
        search_sefaz(description, location.latitude, location.longitude, radius, function(results, error) {

          if (error == null) {
          // if  (results != null && results.length > 0) {
            // for (var productSale of results) {
            //   var sale = new Parse.Object("ProductSearch")
            //
            //   // TODO: set location and store
            //   sale.set({body: productSale.dscProduto, barcode: productSale.codGetin, ncm: codNcm, minValue: productSale.valMinimoVendido, maxValue: productSale.valMaximoVendido, price: productSale.valUltimaVenda})
            //   sale.save();
            // }

            //TODO: actually return values
            response.success([]);
          } else {
            response.error(error);
          }
        })
        response.success([]);
      }
    })
    .catch((e) =>  {
      response.error(e);
    });
});




var search_sefaz = function (productName, latitude, longitude, radius, callback) {
    console.log("searching at sefaz");

    var options = {
      hostname: 'api.sefaz.al.gov.br',
      path: '/sfz_nfce_api/api/public/consultarPrecosPorDescricao',
      method: 'POST',
      json: true,
      headers: {
        'Content-Type': 'application/json',
        'appToken': 'e5def5439dde4fd996efd14db70a32f0aa492a5a'
      }
    };

    var req = http.request(options, function(res) {
      console.log('Status: ' + res.statusCode);
      res.setEncoding('utf8');
      var body = '';
      res.on('data', function (chunk) {
        body += chunk;
      });
      res.on('error', function(e) {
        console.log('problem with request: ' + e.message);
        callback(null, e);
      });
      res.on('end', function() {
        console.log('end!!');
        var jsonBody;
        try {
          jsonBody = JSON.parse(body);
         //logger.log(jsonBody);//jsonBody.explanation);
         callback(jsonBody, null);
        } catch (e) {
          callback(null, e);
        }
       });
    });

    var requestBody = {
      "descricao": productName,
      "dias": 1,
      "latitude": latitude, //-9.6440903,
      "longitude": longitude, // -35.7448128,
      "raio": radius //10
    };
    var requestString = JSON.stringify(requestBody);
    req.write(requestString);
    req.end();
}
