#!/usr/bin/env node
'use strict';

process.on('disconnect', function () {
  console.debug('IPC disconnection - exiting');
  process.emit('SIGINT');
});

const sleep = require('sleep');

// get microsecond time
function getTime () {
  var hrTime = process.hrtime();
  return parseInt(hrTime[0] * 1000000 + hrTime[1] / 1000, 10);
}

// parameters
var pin = process.argv[2];

// init log
require('../lib/log.js').init('GPIO-Tx ' + pin);

console.info('Init sender on pin %s', pin);

// bind GPIO
const Gpio  = require('onoff').Gpio
if (Gpio.accessible) {
  var txPin = new Gpio(pin, 'out');

  // clean GPIO on exit
  process.on('SIGINT', function () {
    process.removeAllListeners('disconnect');
    console.info('Closing pin %s', pin);
    txPin.unexport();
  });

  // init to LOW
  txPin.writeSync(0);

  //send frame
  process.on('message', (frame) => {

//TODO: suppr repeat ?
    for (let repeat = 1; repeat <= 3; repeat++) {
      console.debug('Sending frame: %s', frame.join(' '));

      let port = true;
      for (let val=0; val < frame.length; val++) {

        txPin.writeSync((port) ? 1 : 0);
        port = !port;

        sleep.usleep(frame[val]-100);
      }

      // finished: back to LOW
      txPin.writeSync(0);
      sleep.usleep(10000);
    }
  });
} else {
  console.warn('Unaccessible GPIO pin %s', pin);
}



