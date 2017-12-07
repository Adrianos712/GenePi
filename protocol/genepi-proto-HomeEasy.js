'use strict';


const genepiProto = require('./genepi-proto.js');

class HomeEasy extends genepiProto {

  constructor (emitter = null, receiver = null) {
    super(emitter, receiver, 'GPIO');

    this.emitter  = emitter;
    this.receiver = receiver;


    this.protoTree = {
        "switch": {
            "param": {
                "ID": "[0-67108863]"
            },
            "cmd": {
                "All on": {
                    "action": "button"
                },
                "All off": {
                    "action": "button"
                },
                "Power": {
                    "unit": "[0-15]",
                    "action": "toggle",
                    "state": "toggle"
                }
            }
        },
        "dimmer": {
            "param": {
                "ID": "[0-67108863]"
            },
            "cmd": {
                "All on": {
                    "action": "button"
                },
                "All off": {
                    "action": "button"
                },
                "Power": {
                    "unit": "[0-15]",
                    "action": "toggle",
                    "state": "toggle"
                },
                "Dim": {
                    "unit": "[0-15]",
                    "action": "[0-15]",
                    "state": "[0-15]"
                },
                "Dim all": {
                    "action": "[0-15]",
                    "state": "[0-15]"
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


  // exec HomeEasy command
  execCmd (param) {

    let data = {
        "protocol": param.protocol,
        "type":     param.type,
        "ID":       param.ID,
        "unit":     (typeof (param.unit) !== 'undefined') ? param.unit : 0
    };

    let res = {
        "protocol": param.protocol,
        "type":     param.type,
        "param": {
            "ID":   data.ID
        },
        "cmd": {}
    };

    switch (param.cmd) {
      case 'All on':
        data.all = 1;
        data.state = 1;

        res.cmd.Power = {
            "state": 1
        };
        break;

      case 'All off':
        data.all = 1;
        data.state = 0;

        res.cmd.Power = {
            "state": 0
        };
        break;

      case 'Power':
        data.all = 0;
        data.state = param.value;

        res.cmd.Power = {
            "unit": data.unit,
            "state": data.state
        };
        break;

      case 'Dim':
        data.all = 0;
        data.dimLevel = param.value;
        data.state = (data.dimLevel) ? 1 : 0;

        res.cmd = {
          "Power": {
            "unit": data.unit,
            "state": data.state
          },
          "Dim": {
            "unit": data.unit,
            "state": data.dimLevel
          }
        };
        break;

      case 'Dim all':
        data.all = 1;
        data.dimLevel = param.value;
        data.state = (data.dimLevel) ? 1 : 0;

        res.cmd = {
          "Power": {
            "state": data.state
          },
          "Dim": {
            "state": data.dimLevel
          },
          "Dim all": {
            "state": data.dimLevel
          }
        };
        break;
    }


    let frame = new HEframe(data).frame;
    this.emitter.send(frame);

    return res;
  }


  // parse frame
  parseFrame (frame) {
    let data = new HEframe({'frame':frame});

    if (data.isHE) {
      delete data.isHE;
      delete data.frame;
      console.info('Received %s message: %j', this.constructor.name, data);

      // building message
      let message = {
          "protocol": this.constructor.name,
          "type":     data.type,
          "param": {
              "ID":   data.ID
          },
          "cmd": {
              "Power": {
                  "state": data.state
               }
          }
      };

      if (!data.all) message.cmd.Power.unit = data.unit;

      if (data.type === 'dimmer') {
        message.cmd.Dim = { "state": data.dimLevel };
        if (!data.all) message.cmd.Dim.unit = data.unit;

        // Dimm all
        if (data.all) message.cmd['Dim all'] = message.cmd.Dim;
      }

      this.emit('message', message);
    }
  }
}


//////////////// HomeEasy //////////////////////
const hardPulse  = 10000;
const softPulse  =  2800;
const shortPulse =   300;
const longPulse  =  1280;
const footPulse  = 10000;
const tolerance  =   0.3;

const hardPulseMin  = hardPulse  - hardPulse  * tolerance;
const hardPulseMax  = hardPulse  + hardPulse  * tolerance;
const softPulseMin  = softPulse  - softPulse  * tolerance;
const softPulseMax  = softPulse  + softPulse  * tolerance;
const shortPulseMin = shortPulse - shortPulse * tolerance * 2;
const shortPulseMax = shortPulse + shortPulse * tolerance * 2;
const longPulseMin  = longPulse  - longPulse  * tolerance;
const longPulseMax  = longPulse  + longPulse  * tolerance;
const footPulseMin  = footPulse  - footPulse  * tolerance;
const footPulseMax  = footPulse  + footPulse  * tolerance;

// add leadings 0 to a string
String.prototype.add0 = function (len) {
  let ret = '';
  for (let i = this.length ; i < len ; ++i) { ret+= '0'; }
  return ret + this;
}

class HEframe {
  constructor(param) {

    this.type     = param.type     || 'switch';
    this.ID       = param.ID       || 0;
    this.unit     = param.unit     || 0;
    this.all      = param.all      || 0;
    this.state    = param.state    || 0;
    this.dimLevel = param.dimLevel || 0;
    this.frame    = param.frame    || [];

    if (typeof(param.frame) === 'undefined') {
      this.isHE = true;
      this.paramToFrame();
    } else {
      this.isHE = false;
      this.frameToParam();
    }
  }


  frameToParam() {
    let status  = 'hard_sync'
    let payload = '';
    let prevBit = 0;
    let offset  = 0;

    for (let i = 0; i < this.frame.length; i++) {

      switch (status) {
        case 'hard_sync':
          if ( (this.frame[i] > shortPulseMin) && (this.frame[i] < shortPulseMax) ) {
            // tempo
            status = 'soft_sync';

          } else if ( (this.frame[i] < hardPulseMin) || (this.frame[i] > hardPulseMax) ) {
            // not hardPulse nor soft -> wrong frame
            return;
          }
          break;

        case 'soft_sync':
          if ( (this.frame[i] > softPulseMin) && (this.frame[i] < softPulseMax) ) {
            if ( (this.frame.length - i != 131) && (this.frame.length - i != 147) ) return ; // wrong length
            if ( this.frame.length - i == 147 ) this.type = 'dimmer';
            // received Soft Sync
            status = 'data';

          } else {
            // not softPulse -> wrong frame
            return;
          }
          break;

        case 'data':
          if ( (this.frame[i] > shortPulseMin) && (this.frame[i] < shortPulseMax) ) {
            // short pulse : bit = 0
            if ( offset % 4 == 3 ) {
              // second bit
              if ( (prevBit == 1) || (offset > 110) ) {
                // code 10 : bit = 1
                // or code 00 : bit = 0 for bits 128-144 for dimmer
                payload += '1';

              } else {
                // wrong code 00 : clear
                return ;
              }
            } else if ( offset % 2 ) {
              // first bit
              prevBit = 0;
            }

          } else if ( (this.frame[i] > longPulseMin) && (this.frame[i] < longPulseMax) ) {
            // long pulse : bit = 1
            if ( offset % 4 == 3 ) {
              // second bit
              if (prevBit == 0) {
                // code 01 : bit = 0
                payload += '0';

              } else {
                // wrong code 11 : clear
                return ;
              }
            } else if ( offset % 2 ) {
              // first bit
              prevBit = 1;
            } else {
              // wrong tempo : clear
              return ;
            }

          } else if ( (this.frame[i] > footPulseMin) && (this.frame[i] < footPulseMax) ) {
            // received Footer
            this.isHE = true;

            // decoding
            this.ID    = parseInt(payload.substring( 0,26), 2);
            this.all   = parseInt(payload.substring(26,27), 2);
            this.state = parseInt(payload.substring(27,28), 2);
            this.unit  = parseInt(payload.substring(28,32), 2);

            if ( this.type === 'dimmer' ) {
              this.dimLevel = parseInt(payload.substr(32,36), 2);
            } else {
              delete(this.dimLevel);
            }

            return;

          } else {
            // noise : clear
            return ;
          }

          offset++;
          break;
      }
    }
  }


  paramToFrame() {
    // Header
    this.frame.push(shortPulse); // 1
    this.frame.push(hardPulse);  // 0
    this.frame.push(shortPulse); // 1
    this.frame.push(softPulse);  // 0

    this.addToFrame(this.ID,    26);
    this.addToFrame(this.all,   1);
    this.addToFrame(this.state, 1);
    this.addToFrame(this.unit,  4);
    if (this.type === 'dimmer') {
      this.addToFrame(this.dimLevel,  4);
    }

    // Footer
    this.frame.push(shortPulse); // 1
    this.frame.push(footPulse);  // 0
    this.frame.push(shortPulse); // 1
  }


  // private properties

  send0() {
    this.frame.push(shortPulse); // 1
    this.frame.push(shortPulse); // 0
    this.frame.push(shortPulse); // 1
    this.frame.push(longPulse);  // 0
  }

  send1() {
    this.frame.push(shortPulse); // 1
    this.frame.push(longPulse);  // 0
    this.frame.push(shortPulse); // 1
    this.frame.push(shortPulse); // 0 
  }

  addToFrame(value, len) {
    let binary = value.toString(2).add0(len);
    for (let i=0; i < binary.length ; i++) {
      if(binary[i] == 1) {
        this.send1();
      } else {
        this.send0();
      }
    }
  }
}


module.exports = HomeEasy;

