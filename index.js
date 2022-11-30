const fs = require('fs'),
static = require('node-static'),
fileServer = new static.Server('./'),
config = {
  cert: fs.readFileSync('./cert/localhost.cert'),
  key: fs.readFileSync('./cert/localhost.key')
}

require('https').createServer(config,function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response, function (err, result) {
            if (err) { // There was an error serving the file
                console.error("Error serving " + request.url + " - " + err.message);

                // Respond to the client
                response.writeHead(err.status, err.headers);
                response.end();
            }
        });
    }).resume();
}).listen(8080);
