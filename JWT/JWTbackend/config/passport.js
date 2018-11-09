var JwtStrategy = require('passport-jwt').Strategy;
 
// load up the user model
// var User = require('../app/models/user');
// var config = require('../config/database'); // get db config file

// added
const secret = 'ranDomSeCret';
 
module.exports = function(passport) {
  var opts = {};
  opts.secretOrKey = secret;
  passport.use(new JwtStrategy(opts, function(jwt_payload, done) {
    // TODO: need to change the database call
    // User.findOne({id: jwt_payload.id}, function(err, user) {
    //       if (err) {
    //           return done(err, false);
    //       }
    //       if (user) {
    //           done(null, user);
    //       } else {
    //           done(null, false);
    //       }
    //   });
  }));
};