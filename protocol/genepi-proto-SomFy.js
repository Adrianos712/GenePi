'use strict';


const genepiProto = require('./genepi-proto.js');

class SomFy extends genepiProto {

  constructor (emitter = null, receiver = null) {
    super(emitter, receiver, 'GPIO');

    this.emitter  = emitter;
    this.receiver = receiver;

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
                    "action": "[0-99]",
                    "state": "[0-99]"
                }
            }
        }
    };

  } // constructor


  execCmd (param) {

    let data = {
        "protocol":    param.protocol,
        "type":        param.type,
        "address":     param.address,
        "time":        param.time,
        "rollingcode": param.rollingcode,
        "rollingkey":  param.rollingkey
    };

    let res = {
        "protocol": param.protocol,
        "type":     param.type,
        "param": {
            "address":     param.address
        },
        "rolling": {
            "rollingcode": (param.rollingcode + 1) % 65536,
            "rollingkey":  (param.rollingkey  + 1) % 16
        },
        "cmd": {}
    };

    switch (param.cmd) {
      case 'Up':
        data.state = 2;
        data.cmd   = 'up';
        res.cmd.Slider = { "state": 99 };
        break;

      case 'Down':
        data.state = 4;
        data.cmd   = 'down';
        res.cmd.Slider = { "state": 0 };
        break;

      case 'My':
        data.state = 1;
        data.cmd   = 'my';
//TODO ?        res.cmd.Slider = { "state":  };
//        res.cmd.My = {};
        break;

      case 'Prog':
        data.state = 8;
        data.cmd   = 'prog';
        res.cmd.Prog = {};
        break;

      case 'Slider':
//TODO        data.state = ;
        res.cmd.Slider = { "state": param.value };
        break;
    }

    return res;
  }

}


module.exports = SomFy;

