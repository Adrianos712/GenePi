'use strict';


const genepiProto = require('./genepi-proto.js');

class SomFy extends genepiProto {

  constructor (emitter = null, receiver = null) {
    super(emitter, receiver, 'GPIO');

    this.emitter  = emitter;
    this.receiver = receiver;

    this.protoTree = {
        "shutter": {
            "param": {
                "address": "[0-16777215]",
                "time": "number"
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
//TODO        "time":        param.time,
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
            "rollingcode": (param.rollingcode + 1) % 65536,
            "rollingkey":  (param.rollingkey  + 1) % 16
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
//TODO        data.cmdID = ;
//TODO  copy data
//TODO : rolling +1
        if (param.value > param.oldValue) {
        } else if (param.value < param.oldValue) {
        } else {
//TODO: test
          return {};
        }
        res.cmd.Slider = { "state": param.value };
        break;
    }


    let frame = new SomFyFrame(data).frame;
    this.emitter.send(frame);

    return res;
  }


  // parse frame
  parseFrame (frame) {
return;
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
              "rollingcode": data.rollingcode,
              "rollingkey":  data.rollingkey
          },
          "param": {
              "address":   data.address
          },
          "cmd": {
              "Slider": {}
          }
      };

      switch (data.action) {
        case '2':
          message.cmd.Slider.state = 99;
          break;
        case '4':
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
for (let i=0; i<7; i++) console.log('SomFy: %d = %d\t0x%s\t0b%s', i, data[i], data[i].toString(16), data[i].toString(2));


    // Obsufscation
    for(let i = 1; i < 7; ++i) data[i] = data[i] ^ data[i-1];

for (let i=0; i<7; i++) console.log('SomFy: %d = %d\t0x%s\t0b%s', i, data[i], data[i].toString(16), data[i].toString(2));

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
        this.frame.push(halfSymbolPulse);
        this.frame.push(halfSymbolPulse);
      } else {
        this.frame.push(symbolPulse);
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

