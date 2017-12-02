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
const maxFrameSize = 3000;
const statusEnum   = {
    'hardSync' : 1,
    'recvData' : 2
};


class GPIOreceiver {

  constructor (param) {
    this.pin = param.pin;

    // init sender process
    this.spawnReceiver();

    // listeners callbacks
    this.listeners = [];

    // frame param
    this.initFrame();

    // pulse handler
    this.rxPinProcess.on('message', (pulse) => {
      this.addPulse(pulse);
    });
  }

  spawnReceiver () {
    // fork process
    this.rxPinProcess = fork(`${__dirname}/genepi-hard-GPIO-receiver.js`, [this.pin]);
    console.log('Spawned receiver subprocess %s for pin %d', this.rxPinProcess.pid, this.pin);

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
    this.offset = 0;
    this.status = statusEnum.hardSync;
  }


  addPulse (p) {
    if (this.offset == (maxFrameSize - 1)) {
      // frame too long
printFrame(this.frame, this.offset);
      this.initFrame();
    }

    switch (this.status) {

      case statusEnum.hardSync:
        if (p > hardPulse) {
          // hard pulse
          this.frame[this.offset++] = p;
//process.stdout.write(" H" + p);
        } else if ((p <= hardPulse) && (this.offset != 0)) {
          //first data pulse
          this.frame[this.offset++] = p;
          this.status = statusEnum.recvData
        }
        break;

      case statusEnum.recvData:
// suppr bruit ?
        this.frame[this.offset++] = p;

        if ( p > hardPulse ) {
          // footer - 
this.listeners[0](this.frame);
//printFrame(this.frame, this.offset);
//TODO: do stuff

          // add pulse to new frame
          this.initFrame();
          this.frame[this.offset++] = p;
        }

        break;
    }
  }
}


function printFrame(frame, offset) {

if (offset != 133) { return; }

  let minShortPulse = 800;
  let maxShortPulse = 0;
  let minLongPulse = hardPulse;
  let maxLongPulse = 0;

  // printing message
//  console.log("\n\nframe: %s - pulse = %s", offset, firstPulse?"H":"L");
  console.debug("Received frame - pulses: %d - frame: %s", offset, frame.join(' '));

  for (let i = 0; i < offset; i++) {

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

