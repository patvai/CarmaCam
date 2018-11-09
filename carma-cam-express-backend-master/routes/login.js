/* eslint-disable no-underscore-dangle */
const express = require('express');
const wrapper = require('../inc/db');
const bcrypt = require('bcrypt');
const logger = require('../inc/logger');

const router = express.Router();

router.get('*/loginWithCookie', (req, res) => {
  if (!req.session || !req.session.phone) {
    res.send({ error: 'Does not contains the correct cookie for login.' });
    return;
  }

  const queryObj = { phone: req.session.phone };
  // @ts-ignore
  wrapper.db.collection('account').find(queryObj).next((err, result) => {
    if (err) {
      res.send({ error: 'No such account exist' });
      return;
    }

    const response = result;
    delete response.password;
    res.send(response);
  });
});

router.get('*/logout', (req, res) => {
  if (req.session && req.session.phone) {
    delete req.session.phone;
  }
  res.send({});
});

router.post('*/login', (req, res) => {
  if (!req.body.phone) {
    res.send({ error: 'Phone not entered.' });
    return;
  }

  if (!req.body.password) {
    res.send({ error: 'Password not entered.' });
    return;
  }

  const query = { phone: req.body.phone };
  // @ts-ignore
  wrapper.db.collection('account').find(query).next((err, result) => {
    if (err) {
      res.send({ error: 'Server error.' });
      return;
    }

    if (result === null) {
      res.send({ error: 'No such account exist' });
      return;
    }

    if (typeof result.password === 'undefined') {
      res.send({ error: 'Server error' });
      return;
    }

    bcrypt.compare(req.body.password, result.password, (bcryptErr, pwMatches) => {
      if (bcryptErr) {
        logger.error(`Failed to compare hashed password: ${bcryptErr}`);
        res.send({ error: 'Server error' });
        return;
      }

      if (!pwMatches) {
        logger.error(`Incorrect password for phone: ${result.phone}`);
        res.send({ error: 'Password does not match' });
        return;
      }

      const response = result;
      delete response.password;
      req.session.phone = req.body.phone;
      res.send(response);
    });
  });
});

module.exports = router;
