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

    this.frame = {
        "type": param.type,
        "ID":   param.ID,
        "unit": (typeof (param.unit) !== 'undefined') ? param.unit : 0
    };

    this.res = {
        "protocol": param.protocol,
        "type":     this.frame.type,
        "param": {
            "ID":   this.frame.ID
        },
        "cmd": {}
    };

    switch (param.cmd) {
      case 'All on':
        this.frame.all = 1;
        this.frame.state = 1;

        this.res.cmd.Power = {
            "state": 1
        };
        break;

      case 'All off':
        this.frame.all = 1;
        this.frame.state = 0;

        this.res.cmd.Power = {
            "state": 0
        };
        break;

      case 'Power':
        this.frame.all = 0;
        this.frame.state = param.value;

        this.res.cmd.Power = {
            "unit": this.frame.unit,
            "state": this.frame.state
        };
        break;

      case 'Dim':
        this.frame.all = 0;
        this.frame.dimLevel = param.value;
        this.frame.state = (this.frame.dimLevel) ? 1 : 0;

        this.res.cmd = {
          "Power": {
            "unit": this.frame.unit,
            "state": this.frame.state
          },
          "Dim": {
            "unit": this.frame.unit,
            "state": this.frame.dimLevel
          }
        };
        break;

      case 'Dim all':
        this.frame.all = 1;
        this.frame.dimLevel = param.value;
        this.frame.state = (this.frame.dimLevel) ? 1 : 0;

        this.res.cmd = {
          "Power": {
            "state": this.frame.state
          },
          "Dim": {
            "state": this.frame.dimLevel
          },
          "Dim all": {
            "state": this.frame.dimLevel
          }
        };
        break;
    }


console.log('sender value:');
console.log(JSON.stringify(this, null, 2));

  }

  toFrame() {
  }

}


module.exports = HomeEasy;

