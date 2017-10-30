'use strict';


const genepiProto = require('./genepi-proto.js');

class HomeEasy extends genepiProto {

  constructor (param) {
    super();

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
  }

  getAddr() {
    return this.address;
  }


}


class sender {
  constructor (param) {
  }

  
}


HomeEasy.sender = sender;
module.exports = HomeEasy;

