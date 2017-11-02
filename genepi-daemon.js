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

['config.daemon', 'config.daemon.port', 'config.protocol', 'config.sender', 'config.receiver'].forEach(function (item) {
  if (typeof eval(item) === 'undefined' )
    leave('ERROR: %s not defined in config file', item);
});


var protoTable = {};

// creating plugin table
try {
  Object.keys(config.protocol).forEach( (protoName) => {

//console.log('Parsing protocol: %s', protoName);

    protoTable[protoName] = new (require('./protocol/genepi-proto-' + protoName + '.js'))();
  
  });
} catch (error) {
console.log(error);
  leave('ERROR: failed parsing config file: %s', error);
}

//console.dir(protoTable);


//TODO : Daemon response: {"jsonrpc":"2.0","id":1,"error":{"message":"Internal error","code":-32603,"data":{"message":"Internal error","code":-32603,"data":"send method error method send error: no protocol"}}}


/* refaire
['sender', 'receiver'].forEach( (hardware) => {
  Object.keys(config.plugin).forEach( (name) => {
    if ((typeof config.plugin[name][hardware] !== 'undefined') && (typeof config[hardware][config.plugin[name][hardware]] !== 'number'))
      leave('Bad %s: %s for plugin %s', hardware, config.plugin[name][hardware], name);
  });
});
*/


//////////////////////////////  Init Protocols        //////////////////////////////
/*
fs.readdirSync('./protocol/').forEach( (file) => {
  let proto = false;

  if (proto = /genepi-proto-(.*)\.js/.exec(file) ) {
    console.log('Adding protocol: %s', proto[1]);
  }
});
*/


//////////////////////////////  Init RPC methods      //////////////////////////////
const rpcMethod = {
  'check': () => 'OK',
  'capabilities': (params) => {
    let capa = {};
    Object.keys(protoTable).forEach( (proto) => {
      capa[proto] = protoTable[proto].getCapabilities();
    });
    return capa;
  },

  'send': async (params) => {
    try {
console.log('RPC call: method send with param %s', JSON.stringify(params));

      if (typeof (params.protocol) === 'undefined') {
        throw ('no protocol');
      } else if (typeof (protoTable[params.protocol]) === 'undefined') {
        throw ('protocol unknown ' + params.protocol);
      }

      protoTable[params.protocol].send(params);


      return 'OK';
//        return {"protocol":"SomFy","type":"shutter","param":{"address":"111111"},"rolling":{"rollingcode":params.rollingcode++,"rollingkey":params.rollingkey++},"cmd":{"Slider":{"state":params.value}}};

    } catch (error) {
      throw 'send method error: ' + error;
    }
  },

}

//////////////////////////////  Init HTTP server  //////////////////////////////
const http = require('http');
const url = require('url');
const textBody = require('body');

const server = http.createServer(function(req, res) {
  var page = url.parse(req.url).pathname;
  console.log(page);

//TODO ajout du APIkey
  if (page == '/') {

    textBody(req, res, function (err, body) {
      // err probably means invalid HTTP protocol or some shiz. 
      if (err) {
        res.statusCode = 500;
        return res.end('Server error');
      }

      // attach RPC requests handler
      require('./jsonrpc.js')(res, res.end, rpcMethod);

      // handle request
      res.writeHead(200, {"Content-Type": "application/json"});
      res.handleMessage(body);
    });

  } else {
//TODO bad APIkey
    res.statusCode = 401;
    return res.end('Unauthorized');
  }

});



//////////////////////////////  Init WebSocket  //////////////////////////////
const WebSocket = require('uws');
const wss = new WebSocket.Server({ server });


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


//////////////////////////////  Starting HTTP server  //////////////////////////////
server.listen(config.daemon.port, function listening() {
  console.log('Listening on %d', server.address().port);
});

