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
                "Toggle": {
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
                "Toggle": {
                    "unit": "[0-15]",
                    "action": "toggle",
                    "state": "toggle"
                },
                 "Dim": {
                    "unit": "[0-15]",
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

    this.type = param.type;
    this.ID = param.ID;
    this.unit = (typeof (param.unit) !== 'undefined') ? param.unit : 0;

    switch (param.cmd) {
      case 'All on':
        this.all = 1;
        this.state = 1;
        break;

      case 'All off':
        this.all = 1;
        this.state = 0;
        break;

      case 'Toggle':
        this.all = 0;
        this.state = param.value;
        break;

      case 'Dim':
        this.all = 0;
        this.dimLevel = param.value;
        this.state = (this.dimLevel) ? 1 : 0;
        break;
    }


console.log('sender value:');
console.dir(this);

  }

  toFrame() {
  }

  result() {
  }
  
}


module.exports = HomeEasy;

