#!/usr/bin/env node
'use strict';

process.on('disconnect', function () {
  console.debug('IPC disconnection - exiting');
  process.emit('SIGINT');
});

// get microsecond time
function getTime () {
  var hrTime = process.hrtime();
  return parseInt(hrTime[0] * 1000000 + hrTime[1] / 1000, 10);
}

// parameters
var pin = process.argv[2];

// init log
require('../lib/log.js').init('GPIO-Rx ' + pin);


// bind GPIO
const Gpio = require('onoff').Gpio
var receiver = new Gpio(pin, 'in', 'both');

// clean GPIO on exit
process.on('SIGINT', function () {
  process.removeAllListeners('disconnect');
  console.info('Closing pin %s', pin);
  receiver.unexport();
});


// init time
var pulse = 0
var elapsed = getTime();

// listen on pin
receiver.watch( (err) => {
  if (err) { throw err; }

  // get pulse length 
  pulse = getTime() - elapsed;
  elapsed += pulse;

  // do smthg
  if (pulse > 200)
    process.send(pulse);
});

console.info('Listening on pin %s', pin);


