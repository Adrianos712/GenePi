'use strict';


class genepiProto {

  constructor () {
  }

  getCapabilities () { return this.protoTree; }

  execute (param) {
    ['type', 'cmd', 'ID'].forEach( (attr) => {
      if ( typeof (param[attr]) === 'undefied' ) { throw ('Missing attribute %s', attr); }
      this[attr] = param[attr];
    });

  }

}

module.exports = genepiProto;

