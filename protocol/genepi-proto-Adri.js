'use strict';


const genepiProto = require('./genepi-proto.js');


class Adri extends genepiProto {

  constructor (emitter = null, receiver = null) {
    super(emitter, receiver, 'GPIO');

    this.emitter  = emitter;
    this.receiver = receiver;

    this.protoTree = {
        "RGBW": {
            "param": {
                "address":  "[0-65535]"
            },
            "cmd": {
                "RGB": {
                    "unit": "[0-15]",
                    "action": "color",
                    "state":  "color"
                },
                "Brightness": {
                    "unit": "[0-15]",
                    "action": "[0-255]",
                    "state": "[0-255]"
                },
                "Power": {
                    "unit": "[0-15]",
                    "action": "toggle",
                    "state": "toggle"
                },
                "Max": {
                    "unit": "[0-15]",
                    "action": "button"
                },
                "Strobe": {
                    "unit": "[0-15]",
                    "action": "button"
                },
                "Fade": {
                    "unit": "[0-15]",
                    "action": "button"
                },
                "Random": {
                    "unit": "[0-15]",
                    "action": "button"
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
        "protocol": param.protocol,
        "type":     param.type,
        "address":  param.address,
        "unit":     (typeof (param.unit) !== 'undefined') ? param.unit : 0
    };

    let res = {
        "protocol": param.protocol,
        "type":     param.type,
        "param": {
            "address":     param.address
        },
        "cmd": {
            "Power": {
                "state": 1
            }
        }
    };

    if (data.unit)
      res.cmd.Power.unit = data.unit;

    switch (param.cmd) {
      case 'RGB':
        data.cmdID = 0;
        data.cmd   = 'rgb';
        data.red   = param.RGB.red;
        data.green = param.RGB.green;
        data.blue  = param.RGB.blue;

        res.cmd.RGB = { "state": param.value };
        if (data.unit)
          res.cmd.RGB.unit = data.unit;
        break;

      case 'Brightness':
        data.cmdID  = 1;
        data.cmd    = 'brightness';
        data.bright = param.value;

        res.cmd.Brightness = { "state": param.value };
        if (data.unit)
          res.cmd.Brightness.unit = data.unit;
        break;

      case 'Power':
        if (param.value) {
          // On
          data.cmdID = 2;
          data.cmd   = 'on';
        } else {
          // Off
          data.cmdID = 3;
          data.cmd   = 'off';
          res.cmd.Power = { "state": 0 };
        }

        break;

      case 'Max':
        data.cmdID = 4;
        data.cmd   = 'max';
        break;

      case 'Strobe':
        data.cmdID = 5;
        data.cmd   = 'strobe';
        break;

    }


    // send frame
    let frame = new AdriFrame(data).frame;
    this.emitter.send(frame);

    return res;
  }


  // parse frame
  parseFrame (frame) {
    let data = new AdriFrame({'frame':frame});

    if (data.isAdri) {
      delete data.isAdri;
      delete data.frame;
      this.emit('raw', data);

      // building message
      let message = {
          "protocol": this.constructor.name,
          "type":     this.type,
          "param": {
              "address":   data.address
          },
          "cmd": {}
      };

return; //TODO
//switch (data.type) {
      switch (data.cmdID) {
        case 2:
//          message.cmd.Slider.state = 99;
          break;
        case 4:
//          message.cmd.Slider.state = 0;
          break;
      }

      this.emit('message', message);
    }
  }
}


//////////////// Adri //////////////////////
const hardPulse1      = 10000;
const hardPulse2      = 10000;
const symbolPulse     =  1000;
const halfSymbolPulse = symbolPulse / 2;
const softPulse       = symbolPulse * 2;
const startPulse      = symbolPulse * 4;
const footPulse       = 20000;
const tolerance       =   0.3;


const hardPulse1Min      = hardPulse1      - hardPulse1      * tolerance;
const hardPulse1Max      = hardPulse1      + hardPulse1      * tolerance;
const hardPulse2Min      = hardPulse2      - hardPulse2      * tolerance;
const hardPulse2Max      = hardPulse2      + hardPulse2      * tolerance;
const symbolPulseMin     = symbolPulse     - symbolPulse     * tolerance;
const symbolPulseMax     = symbolPulse     + symbolPulse     * tolerance;
const halfSymbolPulseMin = halfSymbolPulse - halfSymbolPulse * tolerance;
const halfSymbolPulseMax = halfSymbolPulse + halfSymbolPulse * tolerance;
const softPulseMin       = softPulse       - softPulse       * tolerance;
const softPulseMax       = softPulse       + softPulse       * tolerance;
const startPulseMin      = startPulse      - startPulse      * tolerance;
const startPulseMax      = startPulse      + startPulse      * tolerance;
const footPulseMin       = footPulse       - footPulse       * tolerance;
const footPulseMax       = footPulse       + footPulse       * tolerance;


class AdriFrame {
  constructor(param) {

    this.type        = param.type;
    this.address     = param.address     || 0;
    this.unit        = param.unit        || 0;
    this.cmd         = param.cmd         || 0;
    this.cmdID       = param.cmdID       || 0;

    if (typeof(param.red)    !== 'undefined') this.red    = param.red;
    if (typeof(param.green)  !== 'undefined') this.green  = param.green;
    if (typeof(param.blue)   !== 'undefined') this.blue   = param.blue;
    if (typeof(param.bright) !== 'undefined') this.bright = param.bright;

    this.frame       = param.frame       || [];

    if (typeof(param.frame) === 'undefined') {
      this.isAdri = true;
      this.paramToFrame();
    } else {
      this.isAdri = false;
      this.frameToParam();
    }
  }



  frameToParam() {
    let status  = 'waiting_sync'
    let nbSoftPulse = 0;
    let payload = [0];
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

          } else if (this.frame[i] > startPulseMin && this.frame[i] < startPulseMax && nbSoftPulse == 6) {
            // received Start
            status = 'data';

//          } else if ((this.frame[i] > hardPulse1Min && this.frame[i] < hardPulse1Max) || (this.frame[i] > hardPulse2Min && this.frame[i] < hardPulse2Max)) {

          } else if (this.frame[i] < softPulseMin) {
            // not hardPulse nor soft -> wrong frame
            return;
          }
          break;
          
        case 'data':
          if (this.frame[i] > symbolPulseMin && this.frame[i] < symbolPulseMax && !waitingHalfSymbol) {
            prevBit = 1 - prevBit;
            // init payload byte
            if (! (offset % 8))
              payload[offset/8] = 0;
            payload[parseInt(offset/8)] += prevBit << (7 - offset % 8);
            ++offset;

          } else if (this.frame[i] > halfSymbolPulseMin && this.frame[i] < halfSymbolPulseMax) {
            if (waitingHalfSymbol) {
              waitingHalfSymbol = false;
              // init payload byte
              if (! (offset % 8))
                payload[offset/8] = 0;
              payload[parseInt(offset/8)] += prevBit << (7 - offset % 8);
              ++offset;

            } else {
              waitingHalfSymbol = true;
            }

          } else if (this.frame[i] > footPulseMin && this.frame[i] < footPulseMax) {
            // footer - complete
            if (! (offset % 8))
              this.decode(payload);
            return;

          } else {
            // wrong pulse
            return;
          }
          break;
      }
    }
  }


  decode(data) {
    // Checksum
    let cksum = 0;
    for(let i = 0; i < data.length; ++i) cksum = cksum ^ data[i] ^ (data[i] >> 4);
    cksum = cksum & 0x0F;
    if (cksum != 0) {
      console.info('wrong checksum');
      return;
    }

//debug
for (let i=0; i<data.length; i++) console.debug('dec Adri: %d = %d 0x%s 0b%s', i, data[i], data[i].toString(16), data[i].toString(2));

    // Adresse
    this.address = (data[1] << 8 & 0xFFFF) + data[2];

    // Equipment type
    switch(data[0] & 0xF0) {
      case 0x10: 
        this.type = 'RGBW';

        // Command
        switch(data[3] & 0xF0) {
          case 0x00: this.cmdID = 0; this.cmd = "RGB";
            this.red    = data[4];
            this.green  = data[5];
            this.blue   = data[6];
            break;

          case 0x10: this.cmdID = 1; this.cmd = "brightness";
            this.bright = data[4];
            break;

          case 0x20: this.cmdID = 2; this.cmd = "on"; break;
          case 0x30: this.cmdID = 3; this.cmd = "off"; break;
          case 0x40: this.cmdID = 4; this.cmd = "max"; break;
          case 0x50: this.cmdID = 5; this.cmd = "strobe"; break;
          case 0x60: this.cmdID = 6; this.cmd = "fade"; break;
          default:   this.cmd = "???"; break;
        }

        // Unit
        this.unit = data[3] & 0x0F;
        break;

      case 0x20: 
        this.type = 'Proble';
        break;
      default:
        return;
    }

    this.isAdri = true;
  }


  paramToFrame() {
    // payload
    let data = [];
 
    switch (this.type) {
      case 'RGBW':
        // RGBW lamp
        data[0] = 0x10;
        data[1] = (this.address >>> 8) & 0xFF;
        data[2] =  this.address & 0xFF;
        data[3] = (this.cmdID << 4) | this.unit;

        switch (this.cmdID) {
          case 0:
            // RGB
            data[4] = this.red;
            data[5] = this.green;
            data[6] = this.blue;
            break;

          case 1:
            // brightness
            data[4] = this.bright;
            break;
        }
        
        break;
//add proto here
    }

    // Calcul du checksum
    let cksum = 0;
    for(let i = 0; i < data.length; ++i) cksum = cksum ^ data[i] ^ (data[i] >> 4);
    data[0] = data[0] + (cksum & 0x0F);

//debug
//console.debug(this);
for (let i=0; i<data.length; i++) console.debug('enc Adri: %d = %d 0x%s 0b%s', i, data[i], data[i].toString(16), data[i].toString(2));


    // Header
    this.frame.push(hardPulse1);  // 1
    this.frame.push(hardPulse2);  // 0

    for (let i=1; i<=6; i++)
      this.frame.push(softPulse);   // 101010
    this.frame.push(startPulse);    // 1

    let lastBit = 0;

    for(let i = 0; i < 8 * data.length; ++i) {
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
      this.frame.push(halfSymbolPulse + footPulse);  // 0
    } else {
      this.frame.push(halfSymbolPulse);   // 1
      this.frame.push(footPulse);         // 0
    }
  }
}



module.exports = Adri;

