#!/usr/bin/env node
'use strict';

const leave = require('leave');

//////////////////////////////  Parsing arguments  //////////////////////////////
var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'RFpi daemon'
});
parser.addArgument(
  [ '-c', '--config-file' ],
  {
    help: 'daemon configuration file. Default: config.json',
    defaultValue: 'config.json'
  }
);
parser.addArgument(
  [ '-b', '--bar' ],
  {
    help: 'bar foo',
//    required: true
  }
);
parser.addArgument(
  '-f',
  {
    help: 'baz bar'
  }
);
var args = parser.parseArgs();
console.dir(args);


//////////////////////////////  Parsing config file  //////////////////////////////
const fs=require('fs');
try {
  var config = JSON.parse(fs.readFileSync(args.config_file, 'utf8'));
} catch (err) {
  leave('%s', err);
}

console.dir(config);
console.log("\n");

['config.daemon', 'config.daemon.port', 'config.plugin'].forEach(function (item) {
  if (typeof eval(item) === 'undefined' )
    leave('ERROR: %s not defined in config file', item);
});

['sender', 'receiver'].forEach( (hardware) => {
  Object.keys(config.plugin).forEach( (name) => {
    if ((typeof config.plugin[name][hardware] !== 'undefined') && (typeof config[hardware][config.plugin[name][hardware]] !== 'number'))
      leave('Bad %s: %s for plugin %s', hardware, config.plugin[name][hardware], name);
  });
});


//////////////////////////////  Starting HTTP socket  //////////////////////////////
const http = require('http');
const WebSocket = require('uws');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rpcMethod = {
  'capabilities': (params) => 'OK',

  'send': async (params) => {
console.log('RPC call: method send with param %s', JSON.stringify(params));
    try {
      if (typeof (params.protoco) === 'undefined') {
//        throw 'method send error: no protocol';
      }
//TODO tarray proto
//TODO : Daemon response: {"jsonrpc":"2.0","id":1,"error":{"message":"Internal error","code":-32603,"data":{"message":"Internal error","code":-32603,"data":"send method error method send error: no protocol"}}}

//        let proto = require('./proto/genepi-proto-' + params.protocol);
//        return proto.execute(params);

        return {"protocol":"SomFy","type":"shutter","param":{"address":"111111"},"rolling":{"rollingcode":params.rollingcode++,"rollingkey":params.rollingkey++},"cmd":{"Slider":{"state":params.value}}};

    } catch (error) {
      throw 'send method error ' + error;
    }
  },

}


wss.on('error', function(err) {
  console.log('Server Error: %s', err);
//  console.log(err);
})
 
wss.on('connection', function connection(ws, req) {

console.log('new client connection');

  require('./jsonrpc.js')(ws, ws.send, rpcMethod);
  ws.on('message', ws.handleMessage);

//  ws.addMethod('subscribe', (params) => params);

});


/*
const url = require('url');
const querystring = require('querystring');

const server = http.createServer(function(req, res) {
    var page = url.parse(req.url).pathname;
    console.log(page);
    res.writeHead(200, {"Content-Type": "text/plain"});
    if (page == '/') {
        res.write('Vous êtes à l\'accueil, que puis-je pour vous ?');
    }
    else if (page == '/sous-sol') {
        res.write('Vous êtes dans la cave à vins, ces bouteilles sont à moi !');
    }

    var params = querystring.parse(url.parse(req.url).query);
    res.writeHead(200, {"Content-Type": "text/plain"});
    if ('prenom' in params && 'nom' in params) {
        res.write('Vous vous appelez ' + params['prenom'] + ' ' + params['nom']);
    }
    else {
        res.write('Vous devez bien avoir un prénom et un nom, non ?');
    }
    res.end();
});

*/
 
server.listen(config.daemon.port, function listening() {
  console.log('Listening on %d', server.address().port);
});
