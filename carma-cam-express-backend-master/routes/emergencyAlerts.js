const express = require('express');
const wrapper = require('../inc/db');
const logger = require('../inc/logger');
const bcrypt = require('bcrypt');

const router = express.Router();

// @ts-ignore
async function validatePoliceAccount(phone, password) {
  const accountQuery = { phone };
  const accountResult = await wrapper.db.collection('account').find(accountQuery).next();

  if (accountResult === null) {
    // eslint-disable-next-line no-throw-literal
    throw {
      name: 'customError',
      message: 'No such account exist',
    };
  }

  if (typeof accountResult.password === 'undefined') {
    // eslint-disable-next-line no-throw-literal
    throw {
      name: 'customError',
      message: 'Server error.',
    };
  }

  const pwMatches = await bcrypt.compare(password, accountResult.password);

  if (!pwMatches) {
    logger.error(`Incorrect password for phone: ${phone}`);
    // eslint-disable-next-line no-throw-literal
    throw {
      name: 'customError',
      message: 'Password does not match',
    };
  }

  if (!accountResult.isPolice) {
    // eslint-disable-next-line no-throw-literal
    throw {
      name: 'customError',
      message: 'This account is not authorized to use this API.',
    };
  }
}

// @ts-ignore
function queryEmergencyAlertsByRadius(lon, lat, radius) {
  const query = {
    location: {
      $geoWithin: {
        $centerSphere: [
          [lon, lat],
          radius / 3963.2,
        ],
      },
    },
  };

  if (lon < -180 || lon > 180) {
    // eslint-disable-next-line no-throw-literal
    throw {
      name: 'customError',
      message: `lon ${lon} not withing the range of -180 ~ 180`,
    };
  }

  if (lat < -90 || lat > 90) {
    // eslint-disable-next-line no-throw-literal
    throw {
      name: 'customError',
      message: `lat ${lat} not within the range of -90 ~ 90`,
    };
  }

  return wrapper.db.collection('emergencyalerts').find(query).toArray();
}

router.post('*/readEmergencyAlerts', async (req, res) => {
  const requiredProps = ['phone', 'password'];
  // eslint-disable-next-line no-restricted-syntax
  for (const prop of requiredProps) {
    if (!req.body[prop]) {
      res.send({ error: `${prop} not in the request` });
      return;
    }
  }

  const {
    phone,
    password,
  } = req.body;

  try {
    await validatePoliceAccount(phone, password);
    const result = await wrapper.db.collection('emergencyalerts').find({}).toArray();
    res.send(result);
  } catch (e) {
    if (e.name === 'customError') {
      res.send({ error: e.message });
      return;
    }

    logger.debug(`Server error: ${e}.`);
    res.send({ error: 'Server error.' });
  }
});

router.post('*/readEmergencyAlertsByRadius', async (req, res) => {
  const requiredProps = ['phone', 'password', 'radius', 'lon', 'lat'];
  // eslint-disable-next-line no-restricted-syntax
  for (const prop of requiredProps) {
    if (!req.body[prop]) {
      res.send({ error: `${prop} not in the request` });
      return;
    }
  }

  const {
    phone,
    password,
  } = req.body;
  const radius = parseFloat(req.body.radius);
  const lon = parseFloat(req.body.lon);
  const lat = parseFloat(req.body.lat);

  try {
    await validatePoliceAccount(phone, password);
    const result = await queryEmergencyAlertsByRadius(lon, lat, radius);
    res.send(result);
  } catch (e) {
    if (e.name === 'customError') {
      res.send({ error: e.message });
      return;
    }

    logger.debug(`Server error: ${e}.`);
    res.send({ error: 'Server error.' });
  }
});


module.exports = router;
