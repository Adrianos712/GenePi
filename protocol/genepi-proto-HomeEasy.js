'use strict';


const genepiProto = require('./genepi-proto.js');

class HomeEasy extends genepiProto {

  constructor (GPIOemitter) {
    super(sender, GPIOemitter);

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

  } // constructor

}


class sender {
  constructor (GPIOemitter, param) {
    this.GPIOemitter = GPIOemitter;

    this.data = {
        "protocol": param.protocol,
        "type":     param.type,
        "ID":       param.ID,
        "unit":     (typeof (param.unit) !== 'undefined') ? param.unit : 0
    };

    this.res = {
        "protocol": param.protocol,
        "type":     param.type,
        "param": {
            "ID":   this.data.ID
        },
        "cmd": {}
    };

    switch (param.cmd) {
      case 'All on':
        this.data.all = 1;
        this.data.state = 1;

        this.res.cmd.Power = {
            "state": 1
        };
        break;

      case 'All off':
        this.data.all = 1;
        this.data.state = 0;

        this.res.cmd.Power = {
            "state": 0
        };
        break;

      case 'Power':
        this.data.all = 0;
        this.data.state = param.value;

        this.res.cmd.Power = {
            "unit": this.data.unit,
            "state": this.data.state
        };
        break;

      case 'Dim':
        this.data.all = 0;
        this.data.dimLevel = param.value;
        this.data.state = (this.data.dimLevel) ? 1 : 0;

        this.res.cmd = {
          "Power": {
            "unit": this.data.unit,
            "state": this.data.state
          },
          "Dim": {
            "unit": this.data.unit,
            "state": this.data.dimLevel
          }
        };
        break;

      case 'Dim all':
        this.data.all = 1;
        this.data.dimLevel = param.value;
        this.data.state = (this.data.dimLevel) ? 1 : 0;

        this.res.cmd = {
          "Power": {
            "state": this.data.state
          },
          "Dim": {
            "state": this.data.dimLevel
          },
          "Dim all": {
            "state": this.data.dimLevel
          }
        };
        break;
    }

/*
console.log('sender value:');
console.log(JSON.stringify(this, null, 2));
*/

    let frame = new HEframe(this.data).frame;
    GPIOemitter.send(frame);
//console.log('frame: len ' + frame.length + '\n' + frame.join(' '));

  }

}

//////////////// HomeEasy //////////////////////
const hardPulse  = 10000;
const softPulse  =  2800;
const shortPulse =   300;
const longPulse  =  1280;
const footPulse  = 10000;

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
      this.paramToFrame();
    } else {
      this.frameToParam();
    }
  }

  frameToParam() {
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

