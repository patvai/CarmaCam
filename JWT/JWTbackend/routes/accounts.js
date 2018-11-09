/* eslint-disable no-underscore-dangle */
const express = require('express');
const wrapper = require('../inc/db');
const bcrypt = require('bcrypt');
const mongodb = require('mongodb');
const logger = require('../inc/logger');

// changed
const jwt = require('jwt-simple');
const passport  = require('passport');
// pass passport for configuration
require('./config/passport')(passport);

// added
const secret = 'ranDomSeCret';

const router = express.Router();
const { ObjectId } = mongodb;

function validateName(name) {
  return /^[A-z]*$/.test(name);
}

// https://www.codeproject.com/Tips/492632/Email-Validation-in-JavaScript
function validateEmail(email) {
  // eslint-disable-next-line no-useless-escape
  const filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return filter.test(email);
}

// TODO: need to be authenticated, this is where for registering new users
router.post('*/accounts', async (req, res) => {
  const requiredProps = [
    'fname',
    'lname',
    'email',
    'phone',
    'password',
    'licensePlate',
    'zipcode',
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const prop of requiredProps) {
    if (!req.body[prop]) {
      res.send({ error: `Does not contains ${prop} for registartion.` });
      return;
    }
  }

  if (!validateName(req.body.fname)) {
    res.send({ error: `'${req.body.fname}' is not a valid first name.` });
    return;
  }

  if (!validateName(req.body.lname)) {
    res.send({ error: `'${req.body.lname}' is not a valid last name.` });
    return;
  }

  if (!validateEmail(req.body.email)) {
    res.send({ error: `'${req.body.email}' is not a valid email.` });
    return;
  }

  // TODO: let front end force enter username, then check user name
  // if (!validateName(req.body.username)) {
  //   res.send({ error: `'${req.body.username}' is not a valid username.` });
  //   return;
  // }

  // TODO: validate phone
  // TODO: validate password
  // TODO: validate licensePlate
  // TODO: validate zipcode

  try {
    const hasDuplicateNumber = await wrapper.db.collection('account').find({ phone: req.body.phone }).hasNext();
    if (hasDuplicateNumber) {
      res.send({ error: `Account of number ${req.body.phone} already exist.` });
      return;
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    const newData = {
      fname: req.body.fname,
      lname: req.body.lname,
      email: req.body.email,
      phone: req.body.phone,
      password: hashedPassword,
      licensePlate: req.body.licensePlate,
      zipcode: req.body.zipcode,
      rewards: 0,
    };
    // communicate to the backend to create the new user
    await wrapper.db.collection('account').insertOne(newData, { w: 1 });
    // TODO: should be able to get the _id from the result of insertOne()
    const insertedDoc = await wrapper.db.collection('account').find({ phone: req.body.phone }).next();
    const id = insertedDoc._id;
    req.session.phone = req.body.phone;
    res.send({
      message: 'Successfully created account.',
      id,
    });
  } catch (e) {
    logger.error(`Account creation error ${e}.`);
    res.send({ error: 'Server error, could not create account.' });
  }
});

// TODO: need to be authenticated to see the authorized content
// router.get('*/accounts/:id', (req, res) => {
//   try {
//     const query = { _id: new ObjectId(req.params.id) };
//     // @ts-ignore
//     wrapper.db.collection('account').find(query).next((err, result) => {
//       if (err) {
//         res.send({ error: 'Server error.' });
//         return;
//       }

//       if (!req.session || !req.session.phone) {
//         res.send({ error: 'Not logged in, cannot read account data.' });
//         return;
//       }

//       if (req.session.phone !== result.phone) {
//         res.send({ error: 'Cannot read account data that does not belong to you.' });
//         return;
//       }

//       const response = result;
//       delete response.password;
//       res.send(response);
//     });
//   } catch (e) {
//     res.send({ error: 'Server error' });
//   }
// });


// changed part
router.get('*/accounts/:id', passport.authenticate('jwt', {session: false}), (req, res) => {
  var token = getToken(req.headers); // TODO: the token need to be put in the headers and send here
  if (token) {
    var decoded = jwt.decode(token, secret);
    try {
      const query = { _id: new ObjectId(req.params.id) };
      // @ts-ignore
      wrapper.db.collection('account').find(query).next((err, result) => {
        if (err) {
          res.send({ error: 'Server error.' });
          return;
        }

        if (!result) {
          return res.status(403).send({success: false, error: "Not logged in, cannot read account data."});
        } else {
          //res.json({success: true}); //Not sure about this line
          const response = result;
          delete response.password;
          var json = JSON.parse(response); // added line
          json.success = true; // added line
          response = JSON.stringify(json); // added line
          res.send(response);
        }
      });
    } catch (e) {
      res.send({ error: 'Server error' });
    }
  } else {
    return res.status(403).send({success: false, error: 'Cannot read account data that does not belong to you.'});
  }
});

getToken = function (headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

module.exports = router;
