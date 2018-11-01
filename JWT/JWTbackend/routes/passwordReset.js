const express = require('express');
const wrapper = require('../inc/db');
const logger = require('../inc/logger');

const router = express.Router();

router.post('*/resetPassword', (req, res) => {
  if (!req.body.phone) {
    res.send({ error: 'Phone number not provided' });
    return;
  }

  const query = { phone: req.body.phone };
  // TODO: see if the number exist
  wrapper.db.collection('account').find(query).next((err, result) => {
    if (err) {
      res.sendStatus(500);
    } else {
      // TODO: should not send result back blindly
      res.send({ result: 'success' });
    }
  });
});

router.put('/resetPassword', (req, res) => {
});

module.exports = router;
