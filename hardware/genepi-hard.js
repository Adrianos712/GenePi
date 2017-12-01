'use strict';

console.log('hard log= ', process.LOGLEVEL);


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

  addReceiver (name, param) {
//TODO: check receiverObj
//TODO: check params
    if (typeof(this.receiverList[name]) === 'undefined') {
      this.receiverList[name] = new this.receiverObj(param);
    } 
  }
}


module.exports = genepiHW;
