#!/usr/bin/env node

const http              = require('http');
const debug 		    = require('debug')('log:server');
const CApp              = require('../dist/CApp');
const CAppInitialize 	= require("../dist/CAppInitialize");

setTimeout(async () => {
  try {
    await CAppInitialize.load();

    const port = normalizePort(process.env.PORT || '8081');
    CApp.set('port', port);

    const server = http.createServer(CApp);

    /* Listen on provided port, on all network interfaces. */


    server.listen(port);
    server.setMaxListeners(0);
    server.keepAliveTimeout = 121 * 1000;
    server.headersTimeout = 125 * 1000;

    server.on('error', onError);
    server.on('listening', onListening);

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
      const addr = server.address();
      const bind = typeof addr === 'string'
          ? 'pipe ' + addr
          : 'port ' + addr.port;
      debug('Listening on ' + bind);
    }
  }
  catch (exception) {
    console.error(exception);
  }

  /**
   * Normalize a port into a number, string, or false.
   */

  function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  }

  /**
   * Event listener for HTTP server "error" event.
   */

  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    const bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;

      default:
        throw error;
    }
  }


}, 0);
