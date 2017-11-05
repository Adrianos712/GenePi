'use strict';

const rpio = require('rpio');
const genepiHW = require('./genepi-hard.js');


class GPIO extends genepiHW {

  constructor () {
    super(GPIOsender, null);

    // init gpio
    rpio.init({
      'gpiomem':  true,      /* Use /dev/gpiomem */
      'mapping': 'physical', /* Use the P1-P40 numbering scheme */
      'mock':     undefined, /* Emulate specific hardware in mock mode */
    });

    // static pin list
    GPIO.pinList = []
  }

  // add pin to pin list
  static addPin (pin) {
    GPIO.pinList.push(pin);
  }

  clearOnExit () {
    GPIO.pinList.forEach( (pin) => {
console.log('GPIO: closing pin %s', pin);
      rpio.close(pin);
    });
  }
}


class GPIOsender {

  constructor (param) {
//TODO: add pull-up/down
    this.txPin = param.pin;
    this.pud   = param.pud || rpio.PULL_OFF;

    // adding pin to list
    GPIO.addPin(this.txPin);

    // bind GPIO
    rpio.open(this.txPin, rpio.OUTPUT, this.pud);
    // init to LOW
    rpio.write(this.txPin, rpio.LOW);
  }


  send(frame) {

    frame = [9728,352,2844,356,328,364,1272,348,1268,356,332,360,328,352,1260,364,324,356,1260,372,328,360,1272,372,328,356,1348,380,440,376,1268,348,332,356,1276,352,332,356,1288,348,332,356,1264,360,1260,352,328,352,324,364,1260,364,1248,364,328,352,328,364,1276,356,332,352,1268,352,1276,348,328,348,1276,348,328,348,348,348,1280,344,1280,344,332,344,332,348,1268,356,1288,352,328,352,324,352,1284,348,324,352,1344,380,328,356,1296,368,1288,360,348,356,328,352,1272,352,348,348,1276,356,1280,352,592,352,332,348,1276,356,320,352,1276,356,324,368,1276,348,424,352,1280,344,9740];

console.log('frame: len ' + frame.length + '\n' + frame.join(' '));

var start = getTime();
var elapsed = 0;
var time = 0;
console.log('time = %s', start);

    rpio.write(this.txPin, rpio.HIGH);
    rpio.usleep(300);

    let port = false;
    frame.forEach( (val) => {

time = getTime() - elapsed;
elapsed +=  time;
console.log('%s send %s for %s us', time, port, val);
      rpio.write(this.txPin, (port) ? rpio.HIGH : rpio.LOW);
      port = !port;
 //     rpio.usleep(1);
      rpio.usleep(val-210);
    });

    // finished: back to LOW
    rpio.write(this.txPin, rpio.LOW);
  }

}

//TODO: add invert on recv

module.exports = GPIO;

function getTime () {
  var hrTime = process.hrtime();
  return hrTime[0] * 1000000 + hrTime[1] / 1000;
}
