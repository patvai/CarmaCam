// http://www.jyotman.xyz/post/logging-in-node.js-done-right
const winston = require('winston');

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'debug',
      timestamp: () => (new Date()).toISOString(),
    }),
  ],
});

module.exports = logger;