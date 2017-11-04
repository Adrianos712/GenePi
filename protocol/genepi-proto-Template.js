'use strict';


const genepiProto = require('./genepi-proto.js');

class Template extends genepiProto {

  constructor (GPIOemitter) {
    super(sender, GPIOemitter);

    this.protoTree = {
        ">type": {
            "param": {
                ">param1": "[0-67108863]"
            },
            "cmd": {
                ">cmd1": {
                    "action": "button"
                },
                 ">cmd2": {
                    ">param": "[0-15]",
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

    this.res = {
        "protocol": param.protocol,
        "type":     param.type,
        "param": {
        },
        "cmd": {}
    };


  }
}


module.exports = Template;

