'use strict';

const { fork } = require('child_process');

// parent class
const genepiHW = require('./genepi-hard.js');


class GPIO extends genepiHW {

  constructor (param) {
    super(param);

    // init sender
    if ( typeof(param.TXpin) !== 'undefined' ) {
      this.sender = new GPIOsender ({"pin": param.TXpin});
    }

    // init receiver
    if ( typeof(param.RXpin) !== 'undefined' ) {
      this.receiver = new GPIOreceiver ({"pin": param.RXpin});
    }
  }


  // get hardware configuration
  getConfig () {
    return GPIO.config;
  }


  // send frame
  send (frame) {
    if ( typeof(this.sender) === 'undefined' ) {
      throw 'No GPIO sender hardware available';
    }

    this.sender.send(frame);
  }


  // listen frames
  listen (cb) {
    if ( typeof(this.receiver) === 'undefined' ) {
      throw 'No GPIO receiver hardware available';
    }

    this.receiver.addListener(cb);

//TODO add stream ?
  }

  // free ressources on exit
//  clearOnExit () {
//  }
}

// hw configuration
GPIO.config = {
    "mandatory": {},
    "optional": {
        "TXpin": ["int", "GPIO pin for sending frames"],
        "RXpin": ["int", "GPIO pin for receiving frames"]
    }
};


//////////////////// Sender ////////////////////////////
class GPIOsender {

  constructor (param) {
    this.pin = param.pin;

    // init sender process
    this.spawnSender();
  }

//TODO:setTimer -> exit
  spawnSender () {
    // fork process
    this.txPinProcess = fork(`${__dirname}/genepi-hard-GPIO-sender.js`, [this.pin]);
    console.log('Spawned sender subprocess %s for pin %d', this.txPinProcess.pid, this.pin);

    // restart process on exit
    this.txPinProcess.on('exit', () => {
      console.warn('Subprocess %s for pin %d exited - restarting', this.txPinProcess.pid, this.pin);
      this.spawnSender();
    });
  }


  // send frame to subprocess
  send (frame) {
    this.txPinProcess.send(frame);
  }
}

//TODO: add invert on recv
//TODO: bench writeSync + usleep 1




//////////////////// Receiver ////////////////////////////
const hardPulse    = 6000;
const maxFrameSize = 300;
const statusEnum   = {
    'hardSync' : 1,
    'recvData' : 2
};


class GPIOreceiver {

  constructor (param) {
    this.pin = param.pin;

    // listeners callbacks
    this.listeners = [];

    // frame param
    this.initFrame();

    // init sender process
    this.spawnReceiver();
  }

  spawnReceiver () {
    // fork process
    this.rxPinProcess = fork(`${__dirname}/genepi-hard-GPIO-receiver.js`, [this.pin]);
    console.log('Spawned receiver subprocess %s for pin %d', this.rxPinProcess.pid, this.pin);

    // pulse handler
    this.rxPinProcess.on('message', (pulse) => {
      this.addPulse(pulse);
    });

    // restart process on exit
    this.rxPinProcess.on('exit', () => {
      console.warn('Subprocess %s for pin %d exited - restarting', this.rxPinProcess.pid, this.pin);
      this.spawnReceiver();
    });
  }


  addListener (cb) {
    this.listeners.push(cb);
  }
  

  initFrame () {
    this.frame = [];
    this.status = statusEnum.hardSync;
  }


  addPulse (p) {
    if (this.frame.length == (maxFrameSize - 1)) {
      // frame too long
//printFrame(this.frame);
      this.initFrame();
    }

    switch (this.status) {

      case statusEnum.hardSync:
        if (p > hardPulse) {
          // hard pulse
          this.frame.push(p);

        } else if ((p <= hardPulse) && (this.frame.length != 0)) {
          //first data pulse
          this.frame.push(p);
          this.status = statusEnum.recvData
        }
        break;

      case statusEnum.recvData:
// suppr bruit ?
        this.frame.push(p);

        if ( p > hardPulse ) {
          // footer - frame complete
//TODO: do stuff
//printFrame(this.frame);
          for (let i = 0; i < this.listeners.length; i++) {
            setImmediate(this.listeners[i], this.frame);
          }

          // add pulse to new frame
          this.initFrame();
          this.frame.push(p);
        }
        break;
    }
  }
}


function printFrame(frame) {

//TODO
if (frame.length < 50) { return; }

  let minShortPulse = 800;
  let maxShortPulse = 0;
  let minLongPulse = hardPulse;
  let maxLongPulse = 0;

  // printing message
  console.debug("Received frame - pulses: %d - frame: %s", frame.length, frame.join(' '));

  for (let i = 0; i < frame.length; i++) {

    if (frame[i] < 800) {
      //Calculate min and max for short pulses
      if (frame[i] < minShortPulse) {
        minShortPulse = frame[i];
      } else if (frame[i] > maxShortPulse) {
        maxShortPulse = frame[i];        
      }

    } else if (frame[i] < frame[2]) {
      //Calculate min and max for long pulses
      if (frame[i] < minLongPulse) {
        minLongPulse = frame[i];
      } else if (frame[i] > maxLongPulse) {
        maxLongPulse = frame[i];        
      }
    }

//    process.stdout.write(" " + frame[i]);
  }

//  let avgShortPulse = (minShortPulse + maxShortPulse ) / 2;
  let avgShortPulse = 330;
  let tolShortPulse = parseInt(100 * (1 - (maxShortPulse - avgShortPulse ) / avgShortPulse));
//  let avgLongPulse = (minLongPulse + maxLongPulse ) / 2;
  let avgLongPulse = 1300;
  let tolLongPulse = parseInt(100 * (1 - (maxLongPulse - avgLongPulse ) / avgLongPulse), 10);

  console.debug('Short\t%s\t%s\t%s\t%s', minShortPulse, maxShortPulse, avgShortPulse, tolShortPulse);
  console.debug('Long\t%s\t%s\t%s\t%s', minLongPulse, maxLongPulse, avgLongPulse, tolLongPulse);
}


module.exports = GPIO;

