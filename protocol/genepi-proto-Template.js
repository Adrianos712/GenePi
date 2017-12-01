'use strict';


const genepiProto = require('./genepi-proto.js');

class Template extends genepiProto {

  constructor (GPIOemitter = null, GPIOreceiver = null) {
    super();

    this.GPIOemitter  = GPIOemitter;
    this.GPIOreceiver = GPIOreceiver;

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



  execCmd (param) {

    // check emitter type
    if (typeof(this.GPIOemitter.send) !== 'function') {
      throw 'Invalid GPIO emitter type';
    }


    let data = {
        "protocol": param.protocol,
        "type":     param.type,
    };

    let res = {
        "protocol": param.protocol,
        "type":     param.type,
        "param": {
        },
        "cmd": {}
    };

    return res;
  }
}


module.exports = Template;

