#!/usr/bin/env node
'use strict';



//////////////////////////////  Parsing arguments  //////////////////////////////
var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'GenePi daemon'
});
parser.addArgument(
  [ '-c', '--config-file' ],
  {
    help: 'Daemon configuration file. Default: config.json',
    defaultValue: __dirname + '/config.json'
  }
);
parser.addArgument(
  [ '-l', '--loglevel' ],
  {
    help: 'Daemon loglevel. Default: 3 (LOG)',
    defaultValue: 3
  }
);
parser.addArgument(
  '-f',
  {
    help: 'baz bar'
//    required: true
  }
);
var args = parser.parseArgs();


// init logging
process.env.NODE_LOGLEVEL = args.loglevel;
require('./lib/log.js').init();


console.debug('Arguments: %j', args);

//////////////////////////////  Parsing config file  //////////////////////////////
const fs=require('fs');
try {
  var config = JSON.parse(fs.readFileSync(args.config_file, 'utf8'));
} catch (err) {
  console.error('€rror parsing config file: %s', err);
  process.exit(1);
}


['config.daemon', 'config.daemon.port', 'config.protocol', 'config.hardware'].forEach(function (item) {
  if (typeof eval(item) === 'undefined' ) {
    console.error('param %s not defined in config file', item);
    process.exit(1);
  }
});

console.debug('Config: %j', config);


//////////////////////////////  Init Hard & Proto        //////////////////////////////
var hwTable    = {};
var protoTable = {};

// clear hardware resources on exit
process.on('SIGINT', process.exit);
process.on('SIGTERM', process.exit);
process.on('exit', function () {
  console.log('Exit: clearing hardwares');
  Object.keys(hwTable).forEach( (hwName) => {
    if (typeof (hwTable[hwName].clearOnExit) === 'function') {
      hwTable[hwName].clearOnExit();
    }
  });
});


try {
  // parsing hardwares type
  Object.keys(config.hardware).forEach( (hwType) => {
    // foreach hardware name
    Object.keys(config.hardware[hwType]).forEach( (hwName) => {

      if ( typeof(hwTable[hwName]) !== 'undefined') {
        throw 'Hardware name ' + hwName + ' already exists ';
      }

      // creating HW
      console.debug('New %s hardware: %s with param: %j', hwType, hwName, config.hardware[hwType][hwName]);
      hwTable[hwName] = new (require('./hardware/genepi-hard-' + hwType + '.js'))(config.hardware[hwType][hwName]);
    });
  });

  // parsing protocols
  Object.keys(config.protocol).forEach( (protoName) => {
    let sender = null, receiver = null;

    if ( (typeof(config.protocol[protoName].sender) !== 'undefined') && (typeof(hwTable[config.protocol[protoName].sender]) !== 'undefined') )
      sender = hwTable[config.protocol[protoName].sender];

    if ( (typeof(config.protocol[protoName].receiver) !== 'undefined') && (typeof(hwTable[config.protocol[protoName].receiver]) !== 'undefined') )
      receiver = hwTable[config.protocol[protoName].receiver];

    // creating protocol
    console.info('Binding proto %s with sender %s and receiver %s', protoName, sender ? config.protocol[protoName].sender:'none', receiver ? config.protocol[protoName].receiver : 'none');
    protoTable[protoName] = new (require('./protocol/genepi-proto-' + protoName + '.js'))(sender, receiver);
  });

} catch (error) {
  console.error('Failed parsing config file: %s', error);
  console.debug(error);
  process.exit(0);
}

//console.log(require('util').inspect(hwTable, {depth: null}));
//console.log(JSON.stringify(protoTable, true, 2));


//////////////////////////////  Init RPC methods      //////////////////////////////
const rpcMethod = {
//TODO:check ?
  'check': () => 'OK',

  'capabilities': () => {
    console.info('RPC call: method capabilities');

    let capa = {};
    Object.keys(protoTable).forEach( (proto) => {
      capa[proto] = protoTable[proto].getCapabilities();
    });
    return capa;
  },

  'send': async (params) => {
    try {
      console.info('RPC call: method send with param %j', params);

      if (typeof (params.protocol) === 'undefined') {
        throw ('no protocol');
      } else if (typeof (protoTable[params.protocol]) === 'undefined') {
        throw ('protocol unknown ' + params.protocol);
      }

      return protoTable[params.protocol].send(params);

    } catch (error) {
      console.debug(error);
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
  console.debug('Received HTTP request with URL: %s',  page);

//TODO ajout du APIkey
  if (page == '/') {

    textBody(req, res, function (err, body) {
      // err probably means invalid HTTP protocol or some shiz. 
      if (err) {
        console.warn('HTTP server error parsing body: %s - return 500', err);
        res.statusCode = 500;
        return res.end('Server error');
      }

      // attach RPC requests handler
      require('./jsonrpc.js')(res, res.end, rpcMethod);

      // handle request
      console.debug('Received RPC request with body: %s',  body);
      res.writeHead(200, {"Content-Type": "application/json"});
      res.handleMessage(body);
    });

  } else {
//TODO bad APIkey
    console.debug('Bad API key - return 401');
    res.statusCode = 401;
    return res.end('Unauthorized');
  }

});



//////////////////////////////  Init WebSocket  //////////////////////////////
const WebSocket = require('uws');
const wss = new WebSocket.Server({ server });
var wsClientTable = [];

wss.on('error', function(err) {
  console.error('Server Error: %s', err);
  console.debug(err);
  process.exit(1);
})
 
wss.on('connection', function connection(ws, req) {

  console.info('New webSocket client connection');
//TODO add connection info
console.info (JSON.stringify(ws, true, 2));

  wsClientTable.push(ws);

  require('./jsonrpc.js')(ws, ws.send, rpcMethod);
  ws.on('message', ws.handleMessage);
});


//////////////////////////////  Starting HTTP server  //////////////////////////////
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('Impossible de lancer le daemon: port deja utilise');
    process.exit(1);
  }

  console.error('Erreur sur le serveur: %s', err);
});


server.listen(config.daemon.port, function (err) {
  if (err) {
    console.error('Impossible de lancer le daemon: %s', err);
    process.exit(1);
  }

  console.log('Daemon listening on port %d', server.address().port);
});

//TODO: gerer l'envoi par socket
  function handleNotif (message) {
console.info ('Got notification: %s', JSON.stringify(message, true, 2));
    wsClientTable.forEach( ws => ws.notify('message', message) );
  }


    // listening for notif
    protoTable.HomeEasy.on('notif', handleNotif);


