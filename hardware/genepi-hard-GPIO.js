'use strict';

const sleep    = require('sleep');
const onoff    = require('onoff').Gpio;

// parent class
const genepiHW = require('./genepi-hard.js');


class GPIO extends genepiHW {

  constructor () {
    super(GPIOsender, null);

    // static pin list
    GPIO.pinList = []
  }

  // add pin to pin list
  static addPin (pin) {
    GPIO.pinList.push(pin);
  }

  // free ressources on exit
  clearOnExit () {
    GPIO.pinList.forEach( (pin) => {
console.log('GPIO: closing pin %s', pin);
      pin.unexport();
    });
  }
}

var prout = function (frame) {
  var test = GPIO.pinList;
  require('sleep').sleep(5);
  console.log('thread msg: %s', JSON.stringify(frame));
  console.log('test: %s', JSON.stringify(test));
}

class GPIOsender {

  constructor (param) {

    // bind GPIO
    this.txPin = new onoff(param.pin, 'out'); 
    // adding pin to list
    GPIO.addPin(this.txPin);

    // init to LOW
    this.txPin.writeSync(0);
  }


  send(frame) {
    for (let repeat = 1; repeat <= 3; repeat++) {
//console.log(JSON.stringify(frame));

      let port = true;
      for (let val=0; val < frame.length; val++) {

        this.txPin.writeSync((port) ? 1 : 0);
        port = !port;

        sleep.usleep(frame[val]-100);
      }

      // finished: back to LOW
      this.txPin.writeSync(0);
      sleep.usleep(10000);
    }
  }
}

//TODO: add invert on recv
//TODO: bench writeSync + usleep 1
/*
var elapsed = getTime();
var time = 0;

time = getTime() - elapsed;
elapsed +=  time;
console.log('%s send %s for %s us', time, port, val);
*/


function getTime () {
  var hrTime = process.hrtime();
  return hrTime[0] * 1000000 + hrTime[1] / 1000;
}


module.exports = GPIO;

