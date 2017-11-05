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
                    "action": "[0-99]",
                    "state": "[0-99]"
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
        "protocol":    param.protocol,
        "type":        param.type,
        "address":     param.address,
        "time":        param.time,
        "rollingcode": param.rollingcode,
        "rollingkey":  param.rollingkey
    };

    this.res = {
        "protocol": param.protocol,
        "type":     param.type,
        "param": {
            "ID":   this.data.ID
        },
        "rolling": {
            "rollingcode": (param.rollingcode + 1) % 65536,
            "rollingkey":  (param.rollingkey  + 1) % 16
        },
        "cmd": {}
    };

    switch (param.cmd) {
      case 'Up':
        this.data.state = 2;
        this.data.cmd   = 'up';
        this.res.cmd.Slider = { "state": 99 };
        break;

      case 'Down':
        this.data.state = 4;
        this.data.cmd   = 'down';
        this.res.cmd.Slider = { "state": 0 };
        break;

      case 'My':
        this.data.state = 1;
        this.data.cmd   = 'my';
//TODO ?        this.res.cmd.Slider = { "state":  };
        this.res.cmd.My = {};
        break;

      case 'Prog':
        this.data.state = 8;
        this.data.cmd   = 'prog';
        this.res.cmd.Prog = {};
        break;

      case 'Slider':
//TODO        this.data.state = ;
        this.res.cmd.Slider = { "state": param.value };
        break;
    }

console.log('sender value:');
console.log(JSON.stringify(this, null, 2));

  }

}


module.exports = SomFy;

