'use strict';


const genepiProto = require('./genepi-proto.js');

class Template extends genepiProto {

  constructor (emitter = null, receiver = null) {
    super(emitter, receiver, 'GPIO');

    this.emitter  = emitter;
    this.receiver = receiver;

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

