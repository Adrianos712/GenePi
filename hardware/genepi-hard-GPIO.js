'use strict';

const sleep    = require('sleep');
const onoff    = require('onoff').Gpio;
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
if (typeof (this.pouet) === 'undefined') {
this.pouet = "";
sleep.sleep(5);
return;
}else{
return "OK";
}


    let port = true;
    for (let val=0; val < frame.length; val++) {

      this.txPin.writeSync((port) ? 1 : 0);
      port = !port;

      sleep.usleep(frame[val]-100);
    }

    // finished: back to LOW
    this.txPin.writeSync(0);
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

