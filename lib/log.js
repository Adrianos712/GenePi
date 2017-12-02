'use strict';

exports.init = function(tag = '') {
  if (tag) { tag = "[" + tag + "] " ; }

  require('console-ten').init(console, process.env.NODE_LOGLEVEL, (level) => "[" + (new Date().toISOString().substr(5, 18).replace('T', ' ')) + "] [" + level + "]\t" + tag);

};


