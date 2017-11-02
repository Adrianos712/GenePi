#!/usr/bin/env node
'use strict';

//////////////////////////////  Connecting to RFpi daemons  //////////////////////////////
const WebSocket = require('../recon-ws.js');

//TODO ajout du APIkey
var ws = new WebSocket('ws://localhost:8080/path', 1000);
require('../jsonrpc.js')(ws, ws.send);

ws.on('message', ws.handleMessage);

ws.on('open', function open() {

  // capabilities
  ws.call('capabilities', {}).then((result) => {
    console.log('capabilities response: %s', result);
  });

  // capabilities
  ws.call('subscribe', [1,2]).then((result) => {
    console.log('subscribe response: %s', JSON.stringify(result));
  });


  // subscribe
  var id = "123456789";
  ws.call('subscribe', {'id': id, 'unit': 4}).then((result) => {
    console.log('subscribe response: %s', JSON.stringify(result));
  });


  // unknown
  ws.call('unknown', {'id': id, 'unit': 4}).then((result) => {
    console.log('unknown response: %s', result);
  }).catch(error => {
    console.log('Error: %s', error);
  });


  // test msg invalides
  ws.send('pouet');
});

