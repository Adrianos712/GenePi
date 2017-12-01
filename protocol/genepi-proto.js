'use strict';


class genepiProto {

  constructor () {
  }


  // get protocol capabilities
  getCapabilities () { return this.protoTree; }


  // send action on protocol
  send (param) {

    // check emitter
    if (this.GPIOemitter === null) {
      throw 'No GPIO emitter defined';
    }      


    // check if params exists
    ['type', 'cmd'].forEach( (attr) => {
      if ( typeof (param[attr]) === 'undefined' ) { throw ('Missing attribute ' + attr); }
    });

    // check if known type
    if ( ! Object.keys(this.protoTree).includes(param.type) ) { throw ('Unknown type ' + param.type); }
    if ( ! Object.keys(this.protoTree[param.type].cmd).includes(param.cmd) ) { throw ('Unknown cmd ' + param.cmd); }

    // check all params
    ['param', 'rolling'].forEach( (attr) => {
      if ( typeof (this.protoTree[param.type][attr]) !== 'undefined' ) {
        Object.keys(this.protoTree[param.type][attr]).forEach( (key) => {
          genepiProto.checkParam(this.protoTree[param.type][attr], param, key);
        });
      }
    });

    // check cmd params
    Object.keys(this.protoTree[param.type].cmd[param.cmd]).forEach( (key) => {
      // do not check state
      if (key === 'state') { return; }

      if (key === 'action') {
        genepiProto.checkAction(this.protoTree[param.type].cmd[param.cmd].action, param);
      } else {
        genepiProto.checkParam(this.protoTree[param.type].cmd[param.cmd], param, key);
      }
    });

//TODO: delete obj
    return this.execCmd(param);
  }


  // check if received param match reference
  static checkAction (action, param) {

    if ( action === 'button' ) { return; }

    if ( typeof (param.value) === 'undefined' ) { throw ('Missing attribute value'); }

    var match = 0;

    switch (action) {
      case 'toggle':
        if ( (param.value != 0) && (param.value != 1) ) { throw ('Wrong attribute type for param value:' + param.value + ' - should be 0 or 1'); }
        param.value = Number(param.value);
        break;

      // slider
      case ( (match = /^\[(\d+)\-(\d+)\]$/.exec(action)) && action):
        if ( isNaN(param.value) || (Number(param.value) < Number(match[1])) || (Number(param.value) > Number(match[2])) ) { throw ('Wrong attribute type for param value:' + param.value + ' - should be ' + action); }
        param.value = Number(param.value);
        break;

      case 'color':
//TODO
        break;

      default:
        throw ('Unknown action type: ' + action);
        break;
    }
  }

  // check if received param match reference
  static checkParam (ref, param, key) {

    // param is present
    if ( typeof (param[key]) === 'undefined' ) { throw ('Missing attribute ' + key); }

    var match = 0;

    // param type is ok
    switch (ref[key]) {
      case 'string':
        if ( typeof (param[key]) !== 'string' ) { throw ('Wrong attribute type for param ' + key + ':' + param[key] + ' - should be ' + ref[key]); }
        break;

      case 'number':
        if ( isNaN(param[key]) ) { throw ('Wrong attribute type for param ' + key + ':' + param[key] + ' - should be ' + ref[key]); }
        param[key] = Number(param[key]);
        break;

      // range
      case ( (match = /^\[(\d+)\-(\d+)\]$/.exec(ref[key])) && ref[key]):
        if ( isNaN(param[key]) || (Number(param[key]) < Number(match[1])) || (Number(param[key]) > Number(match[2])) ) { throw ('Wrong attribute type for param ' + key + ':' + param[key] + ' - should be ' + ref[key]); }
        param[key] = Number(param[key]);
        break;

      default:
        throw ('Unknown param type: ' + ref[key]);
        break;
    }
  }
}

module.exports = genepiProto;

