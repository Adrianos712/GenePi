'use strict';


class genepiHW {

  constructor (senderObj, receiverObj) {
    if (senderObj !== null) {
      this.senderObj = senderObj;
      this.senderList   = {};
    }

    if (receiverObj !== null) {
      this.receiverObj = receiverObj;
      this.receiverList = {};
    }
  }

//TODO  static capabilities () {}

  addSender (name, param) {
//TODO: check senderObj
//TODO: check params
    if (typeof(this.senderList[name]) === 'undefined') {
      this.senderList[name] = new this.senderObj(param);
    } 
  }
}


module.exports = genepiHW;
