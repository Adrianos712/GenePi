'use strict';

const jsonrpc = require('jsonrpc-lite')
, EventEmitter = require('events').EventEmitter;



function jsonRPC (conn, sendMethod, methodList) {

  // init connection
  conn.rpcID = 1;
  conn.rpcMethod = methodList || {};    // list of method handlers
  conn.rpcSend = sendMethod;            // connection/socket send method
  conn.rpcEvent = new EventEmitter;

  // send a RPC success message
  conn.success = (id, params) => {
    conn.rpcSend(JSON.stringify(jsonrpc.success(id, params)));
  }

  // send a RPC error message
  conn.error = (id, errorObj) => {
    conn.rpcSend(JSON.stringify(jsonrpc.error(id, errorObj)));
  }

  // send a RPC request
  conn.call = (method, params) => {
    return new Promise(function(resolve, reject) {
console.log ('[%s]calling method %s with param %s', conn.rpcID, method, JSON.stringify(params));
      conn.rpcEvent.once('callOK' + conn.rpcID, resolve);
      conn.rpcEvent.once('callErr' + conn.rpcID, reject);
      conn.rpcSend(JSON.stringify(jsonrpc.request(conn.rpcID++, method, params)));
    });
  }

  // send a RPC notification
  conn.notify = (method, param) => {
    conn.rpcSend(JSON.stringify(jsonrpc.notification(method, param)));
  }

  // add a RPC method handler
  conn.addMethod = (method, reqHandler) => {
    conn.rpcMethod[method] = reqHandler;
  }

  // del a RPC method handler
  conn.delMethod = (method) => {
    delete conn.rpcMethod[method];
  }

  // handle a received message on the connection
  conn.handleMessage = async (message) => {
//console.log('\nreceived: %s', message);

    var jsonMsg = jsonrpc.parse(message);
//console.log(' [%s]json - type: %s', jsonMsg.payload.id, jsonMsg.type);

    if ((jsonMsg.type === 'request') || (jsonMsg.type === 'notification')) {
      // RPC request -> find a method handler

      if (typeof conn.rpcMethod[jsonMsg.payload.method] === 'function') {
//console.log(' [%s]method exists: %s -> handling request', jsonMsg.payload.id, jsonMsg.payload.method);
        try {
          // handle call and send result
          let result = await conn.rpcMethod[jsonMsg.payload.method](jsonMsg.payload.params) || {};
console.log(' [%s]result: %s', jsonMsg.payload.id, JSON.stringify(result));
          if (jsonMsg.type === 'request') conn.success(jsonMsg.payload.id, result);

        } catch (error) {
          // send error
console.log(' [%s]error: %s', jsonMsg.payload.id, error);
          conn.error(jsonMsg.payload.id, jsonrpc.JsonRpcError.internalError(error));
        }

      } else {
        // RPC method does not exists
console.log(' [%s]unknown method: %s -> error', jsonMsg.payload.id, jsonMsg.payload.method);
        conn.error(jsonMsg.payload.id, jsonrpc.JsonRpcError.methodNotFound());
      }

    } else if (jsonMsg.type === 'success') {
      // RPC success response - calling promise result
      conn.rpcEvent.emit('callOK' + jsonMsg.payload.id, jsonMsg.payload.result);
      conn.rpcEvent.removeAllListeners('callErr' + jsonMsg.payload.id);
console.log(' [%s]received param: %s', jsonMsg.payload.id, JSON.stringify(jsonMsg.payload.result));

    } else if (jsonMsg.type === 'error') {
      // RPC error response - calling promise reject
      conn.rpcEvent.emit('callErr' + jsonMsg.payload.id, jsonMsg.payload.error);
      conn.rpcEvent.removeAllListeners('callOK' + jsonMsg.payload.id);
console.log(' [%s]received error: %s', jsonMsg.payload.id, jsonMsg.payload.error);

    } else {
      // not RPC message
console.log(' [%s]not JSON RPC message: %s', jsonMsg.payload.id, message);
      conn.error(0, jsonMsg.payload);
    }
  }

//TODO : debug
  conn.on('error', function error(err) {
    console.log('Client socket Error: %s', err);
  });

  conn.on('close', function close() {
    console.log('Closing socket');
//console.log(ws);
  });
}

module.exports = jsonRPC;

