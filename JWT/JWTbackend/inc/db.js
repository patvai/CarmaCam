const mongodb = require('mongodb');
const logger = require('./logger');
const argv = require('minimist')(process.argv.slice(2));

const client = mongodb.MongoClient;
/*
 Initialize a connection to the MongoDB
 change the IP and keyspace so that it is according to your setting.
 */
const dbServer = 'localhost:27017';
const dbName = (argv.db) ? argv.db : 'bdr_db';

// USE BELOW URL ONCE BDR ACCOUNT IS SETUP IN MONGODB
// var url = 'mongodb://' + keyspace + ':' + keyspace + '@' + dbServer + '/' + keyspace + '?authMechanism=DEFAULT&authSource=' + keyspace + '&maxPoolSize=50';
// http://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html#mongoclient-connect
// "mongodb://username:password@localhost:27017/exampledatabase"
// https://docs.mongodb.com/manual/reference/connection-string/
const url = `mongodb://${dbServer}/${dbName}`;

const wrapper = {};

// http://mongodb.github.io/node-mongodb-native/3.0/api/MongoClient.html#.connect
client.connect(url, (err, database) => {
  if (err) {
    logger.error(`Error connecting to database: ${err}.`);
    return;
  }

  logger.info('Successfully connected to database.');
  wrapper.db = database;
});

module.exports = wrapper;
