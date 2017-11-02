'use strict';


const genepiProto = require('./genepi-proto.js');

class SomFy extends genepiProto {

  constructor (GPIOemitter) {
    super(sender, GPIOemitter);

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
                    "action": "[0-9]",
                    "state": "[0-9]"
                }
            }
        }
    };

  } // constructor

}


class sender {
  constructor (GPIOemitter, param) {
    this.GPIOemitter = GPIOemitter;

  }

  toFrame() {
  }

  result() {
  }
  
}


module.exports = SomFy;

