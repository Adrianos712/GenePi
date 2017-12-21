'use strict';


const genepiProto = require('./genepi-proto.js');

const rollingKeyMod  =    16;
const rollingCodeMod = 65536;

function addRollKey (key) {
  return (key + 1) % rollingKeyMod;
};

function addRollCode (code) {
  return (code + 1) % rollingCodeMod;
};

class SomFy extends genepiProto {

  constructor (emitter = null, receiver = null) {
    super(emitter, receiver, 'GPIO');

    this.emitter  = emitter;
    this.receiver = receiver;

    this.protoTree = {
        "shutter": {
            "param": {
                "address":  "[0-16777215]",
                "timeup":   "number",
                "timedown": "number"
            },
            "rolling": {
                "rollingcode": "[0-65535]",
                "rollingkey":  "[0-15]"
            },
            "cmd": {
                "Up": {
                    "action": "button"
                },
                "My": {
                    "action": "button"
                },
                "Down": {
                    "action": "button"
                },
                "Prog": {
                    "action": "button"
                },
                "Slider": {
                    "action": "[0-99]",
                    "state": "[0-99]"
                }
            }
        }
    };

    // listening on receiver
    if (this.receiver) {
//TODO: event ?
      receiver.listen(this.parseFrame.bind(this));
    }
  } // constructor


  execCmd (param) {

    let data = {
        "protocol":    param.protocol,
        "type":        param.type,
        "address":     param.address,
        "rollingcode": param.rollingcode,
        "rollingkey":  param.rollingkey
    };

    let res = {
        "protocol": param.protocol,
        "type":     param.type,
        "param": {
            "address":     param.address
        },
        "rolling": {
            "rollingcode": addRollCode(param.rollingcode),
            "rollingkey":  addRollKey(param.rollingkey)
        },
        "cmd": {}
    };

    switch (param.cmd) {
      case 'Up':
        data.cmdID = 2;
        data.cmd   = 'up';
        res.cmd.Slider = { "state": 99 };
        break;

      case 'Down':
        data.cmdID = 4;
        data.cmd   = 'down';
        res.cmd.Slider = { "state": 0 };
        break;

      case 'My':
        data.cmdID = 1;
        data.cmd   = 'my';
//TODO ?        res.cmd.Slider = { "state":  };
//        res.cmd.My = {};
        break;

      case 'Prog':
        data.cmdID = 8;
        data.cmd   = 'prog';
        res.cmd.Prog = {};
        break;

      case 'Slider':
        // testing oldValue param
        if ( typeof (param.oldValue) === 'undefined' ) { throw ('Missing attribute oldValue'); }
        let match = /^\[(\d+)\-(\d+)\]$/.exec(this.protoTree.shutter.cmd.Slider.state);
        if ( isNaN(param.oldValue) || (Number(param.oldValue) < Number(match[1])) || (Number(param.oldValue) > Number(match[2])) ) { throw ('Wrong attribute type for param oldValue:' + param.oldValue + ' - should be ' + this.protoTree.shutter.cmd.Slider.state); }
        param.oldValue = Number(param.oldValue);

        let time = 0;

        // prepare second frame: my
        let dataAfter = {...data, "cmdID": 1, "cmd": "my"};
        dataAfter.rollingcode++;
        dataAfter.rollingkey++;

        if (param.value < param.oldValue) {
          // down
          data.cmdID = 4;
          data.cmd   = 'down';
          time = param.timedown;

        } else if (param.value > param.oldValue) {
          // up
          data.cmdID = 2;
          data.cmd   = 'up';
          time = param.timeup;

        } else {
//TODO: test
          return {};
        }

        // time between frames (ms) = |%diff| / 100 * time * 1000
        time = Math.abs(param.oldValue - param.value) * time * 10;

        // send stop (my) after time
        setTimeout( () => {
          let frame = new SomFyFrame(dataAfter).frame;
          this.emitter.send(frame);
        }, time);

        res.cmd.Slider = { "state": param.value };
        res.rolling.rollingcode = addRollCode(res.rolling.rollingcode);
        res.rolling.rollingkey  = addRollKey(res.rolling.rollingkey);
//TODO : rolling +1 - generer un nouveau res ?
        break;
    }


    // send frame
    let frame = new SomFyFrame(data).frame;
    this.emitter.send(frame);

    return res;
  }


  // parse frame
  parseFrame (frame) {
    let data = new SomFyFrame({'frame':frame});

    if (data.isRTS) {
      delete data.isRTS;
      delete data.frame;
      console.info('Received %s message: %j', this.constructor.name, data);

      // building message
      let message = {
          "protocol": this.constructor.name,
          "type":     "shutter",
          "rolling": {
              "rollingcode": addRollCode(data.rollingcode),
              "rollingkey":  addRollKey(data.rollingkey)
          },
          "param": {
              "address":   data.address
          },
          "cmd": {
              "Slider": {}
          }
      };

      switch (data.cmdID) {
        case 2:
          message.cmd.Slider.state = 99;
          break;
        case 4:
          message.cmd.Slider.state = 0;
          break;
//TODO
      }

      this.emit('message', message);
    }
  }
}


//////////////// SomFy RTS //////////////////////
const hardPulse1_1    =  9415;
const hardPulse1_2    = 89565;
const hardPulse2_1    = 10750;
const hardPulse2_2    = 17750;
const symbolPulse     =  1280;
const halfSymbolPulse = symbolPulse / 2;
const softPulse       = symbolPulse * 2;
const startPulse      =  4750;
const footPulse1      = 27500;
const footPulse2      = 32500;
const tolerance       =   0.3;


const hardPulse1_1Min    = hardPulse1_1    - hardPulse1_1    * tolerance;
const hardPulse1_1Max    = hardPulse1_1    + hardPulse1_1    * tolerance;
const hardPulse1_2Min    = hardPulse1_2    - hardPulse1_2    * tolerance;
const hardPulse1_2Max    = hardPulse1_2    + hardPulse1_2    * tolerance;
const hardPulse2_1Min    = hardPulse2_1    - hardPulse2_1    * tolerance;
const hardPulse2_1Max    = hardPulse2_1    + hardPulse2_1    * tolerance;
const hardPulse2_2Min    = hardPulse2_2    - hardPulse2_2    * tolerance;
const hardPulse2_2Max    = hardPulse2_2    + hardPulse2_2    * tolerance;
const symbolPulseMin     = symbolPulse     - symbolPulse     * tolerance;
const symbolPulseMax     = symbolPulse     + symbolPulse     * tolerance;
const halfSymbolPulseMin = halfSymbolPulse - halfSymbolPulse * tolerance;
const halfSymbolPulseMax = halfSymbolPulse + halfSymbolPulse * tolerance;
const softPulseMin       = softPulse       - softPulse       * tolerance;
const softPulseMax       = softPulse       + softPulse       * tolerance;
const startPulseMin      = startPulse      - startPulse      * tolerance;
const startPulseMax      = startPulse      + startPulse      * tolerance;
const footPulse1Min      = footPulse1      - footPulse1      * tolerance;
const footPulse1Max      = footPulse1      + footPulse1      * tolerance;
const footPulse2Min      = footPulse2      - footPulse2      * tolerance;
const footPulse2Max      = footPulse2      + footPulse2      * tolerance;


class SomFyFrame {
  constructor(param) {

    this.type        = 'shutter';
    this.address     = param.address     || 0;
    this.cmd         = param.cmd         || 0;
    this.cmdID       = param.cmdID       || 0;
    this.rollingcode = param.rollingcode || 0;
    this.rollingkey  = param.rollingkey  || 0;
    this.frame       = param.frame       || [];

    if (typeof(param.frame) === 'undefined') {
      this.isRTS = true;
      this.paramToFrame();
    } else {
      this.isRTS = false;
      this.frameToParam();
    }
  }



  frameToParam() {
    let status  = 'waiting_sync'
    let nbSoftPulse = 0;
    let payload = [0, 0, 0, 0, 0, 0, 0];
    let prevBit = 0;
    let offset  = 0;
    let waitingHalfSymbol = false;

    // parsing frame
    for (let i = 0; i < this.frame.length; i++) {

      switch (status) {
        case 'waiting_sync':
          if (this.frame[i] > softPulseMin && this.frame[i] < softPulseMax) {
            // received Soft Sync
            ++nbSoftPulse;

          } else if (this.frame[i] > startPulseMin && this.frame[i] < startPulseMax && nbSoftPulse >= 8) {
            // received Start
            this.softSync = nbSoftPulse;
            status = 'data';

          } else if ((this.frame[i] > hardPulse1_1Min && this.frame[i] < hardPulse1_1Max) || (this.frame[i] > hardPulse1_2Min && this.frame[i] < hardPulse1_2Max)) {
            this.hardSync = 'type1';

          } else if ((this.frame[i] > hardPulse2_1Min && this.frame[i] < hardPulse2_1Max) || (this.frame[i] > hardPulse2_2Min && this.frame[i] < hardPulse2_2Max)) {
            this.hardSync = 'type2';

          } else if (this.frame[i] < softPulseMin) {
            // not hardPulse nor soft -> wrong frame
            return;
          }
          break;
          
        case 'data':
          if (this.frame[i] > symbolPulseMin && this.frame[i] < symbolPulseMax && !waitingHalfSymbol) {
            prevBit = 1 - prevBit;
            payload[parseInt(offset/8)] += prevBit << (7 - offset % 8);
            ++offset;

          } else if (this.frame[i] > halfSymbolPulseMin && this.frame[i] < halfSymbolPulseMax) {
            if (waitingHalfSymbol) {
              waitingHalfSymbol = false;
              payload[parseInt(offset/8)] += prevBit << (7 - offset % 8);
              ++offset;
            } else {
              waitingHalfSymbol = true;
            }

          } else if ((this.frame[i] > footPulse1Min && this.frame[i] < footPulse1Max) || (this.frame[i] > footPulse2Min && this.frame[i] < footPulse2Max)) {
            // footer - complete
            if (offset == 56) {
              this.isRTS = true;
              this.decode(payload);
            }
            return;

          } else {
            // not hardPulse nor soft -> wrong frame
            return;
          }
          break;
      }
    }
  }


  decode(payload) {
    let data = [];

    // De-obfuscation
    data[0] = payload[0];
    for(let i = 1; i < 7; ++i) data[i] = payload[i] ^ payload[i-1];
 
    // Checksum
    let cksum = 0;
    for(let i = 0; i < 7; ++i) cksum = cksum ^ data[i] ^ (data[i] >> 4);
    cksum = cksum & 0x0F;
    if (cksum != 0) {
      console.info('wrong checksum');
      return;
    }

//debug
//for (let i=0; i<7; i++) console.log('dec SomFy: %d = %d 0x%s 0b%s', i, payload[i], payload[i].toString(16), payload[i].toString(2));
//for (let i=0; i<7; i++) console.log('dec SomFy: %d = %d 0x%s 0b%s', i, data[i], data[i].toString(16), data[i].toString(2));

    // Touche de controle
    switch(data[1] & 0xF0) {
      case 0x10: this.cmdID = 1; this.cmd = "My"; break;
      case 0x20: this.cmdID = 2; this.cmd = "Up"; break;
      case 0x40: this.cmdID = 4; this.cmd = "Down"; break;
      case 0x80: this.cmdID = 8; this.cmd = "Prog"; break;
      default:   this.cmd = "???"; break;
    }
 
    // Rolling key
    this.rollingkey = (data[0] & 0x0F);
 
    // Rolling code
    this.rollingcode = (data[2] << 8) + data[3];
 
    // Adresse
    this.address = (data[6] << 16) + (data[5] << 8 & 0xFFFF) + data[4];
  }


  paramToFrame() {
    // payload
    let data = [];
    data[0] = 0xA0 | this.rollingkey;
    data[1] = this.cmdID << 4;
    data[2] = (this.rollingcode & 0xFF00) >>> 8;
    data[3] =  this.rollingcode & 0x00FF;
    data[4] = (this.address & 0x0000FF);
    data[5] = (this.address & 0x00FF00) >>> 8;
    data[6] = (this.address & 0xFF0000) >>> 16;
 
    // Calcul du checksum
    let cksum = 0;
    for(let i = 0; i < 7; ++i) cksum = cksum ^ data[i] ^ (data[i] >> 4);
    data[1] = data[1] + (cksum & 0x0F);

//debug
console.log(this);
//for (let i=0; i<7; i++) console.log('enc SomFy: %d = %d 0x%s 0b%s', i, data[i], data[i].toString(16), data[i].toString(2));


    // Obsufscation
    for(let i = 1; i < 7; ++i) data[i] = data[i] ^ data[i-1];

//for (let i=0; i<7; i++) console.log('enc SomFy: %d = %d 0x%s 0b%s', i, data[i], data[i].toString(16), data[i].toString(2));

    // Header
    this.frame.push(hardPulse1_1);  // 1
    this.frame.push(hardPulse1_2);  // 0

    for (let i=1; i<=8; i++)
      this.frame.push(softPulse);   // 10101010
    this.frame.push(startPulse);    // 1

    let lastBit = 0;

    for(let i = 0; i < 56; ++i) {
      let bit = (data[parseInt(i/8)] >>> (7 - i%8)) & 0x01;

      if (lastBit ^ bit) {
        this.frame.push(symbolPulse);
      } else {
        this.frame.push(halfSymbolPulse);
        this.frame.push(halfSymbolPulse);
      }

      lastBit = bit;
    }
   

    // last half + Footer
    if (lastBit) {
      this.frame.push(halfSymbolPulse);   // 1
      this.frame.push(footPulse1);        // 0
    } else {
      this.frame.push(halfSymbolPulse + footPulse1);  // 0
    }
  }
}



module.exports = SomFy;

