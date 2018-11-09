const express = require('express');
const wrapper = require('../inc/db');
const mongodb = require('mongodb');
const logger = require('../inc/logger');
const Grid = require('gridfs-stream');

const router = express.Router();
const { ObjectId } = mongodb;

router.get('*/baddriverreports/:id', (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    // @ts-ignore
    wrapper.db.collection('baddriverreports').findOne(query, (err, report) => {
      if (err) {
        logger.warn(`Failed to find the video to delete: ${err}.`);
        res.send({ error: `Could not find the video of id ${req.params.id} to delete.` });
        return;
      }

      if (!req.session || !req.session.phone) {
        res.send({ error: 'Not logged in, cannot read report.' });
        return;
      }

      if (report.postingAccount !== req.session.phone) {
        res.send({ error: 'Cannot read baddriverreports that does not belong to you.' });
        return;
      }

      res.send(report);
    });
  } catch (e) {
    res.send({ error: 'Server error.' });
  }
});

router.get('*/accounts/:phone/baddriverreports', (req, res) => {
  if (!req.session || !req.session.phone) {
    res.send({ error: 'Not logged in, cannot read all report.' });
    return;
  }

  if (req.params.phone !== req.session.phone) {
    res.send({ error: 'Cannot read reports that does not belong to you.' });
    return;
  }

  const query = { postingAccount: req.params.phone };

  // @ts-ignore
  wrapper.db.collection('baddriverreports').find(query).toArray((err, result) => {
    if (err) {
      res.send({ error: 'Server error.' });
      return;
    }

    res.send(result);
  });
});

router.post('*/updateBaddriverreports/:id', async (req, res) => {
  if (!req.session || !req.session.phone) {
    res.send({ error: 'Not logged in, cannot update a report.' });
    return;
  }

  try {
    const query = { _id: new ObjectId(req.params.id) };
    const report = await wrapper.db.collection('baddriverreports').findOne(query);

    if (report.postingAccount !== req.session.phone) {
      res.send({ error: 'Cannot update a report that does not belong to you.' });
      return;
    }

    const newData = {
      licensePlateNumber: req.body.licensePlateNumber,
      vehicleDescription: req.body.vehicleDescription,
      licenseState: req.body.licenseState,
      severity: req.body.severity,
      category: req.body.category,
      incidentDescription: req.body.incidentDescription,
      status: 'reported',
    };

    await wrapper.db.collection('baddriverreports').updateOne(query, { $set: newData }, { w: 1 });
    res.send({ message: 'update success' });
  } catch (e) {
    res.send({ error: 'Server error.' });
  }
});

router.post('*/deleteBaddriverreports/:id', (req, res) => {
  try {
    const query = { _id: new ObjectId(req.params.id) };
    // @ts-ignore
    wrapper.db.collection('baddriverreports').findOne(query, (err, report) => {
      if (err) {
        logger.warn(`Failed to find the bad driver report to delete: ${err}.`);
        res.send({ error: `Could not find the bad driver report of id ${req.params.id} to delete.` });
        return;
      }

      if (!req.session || !req.session.phone) {
        res.send({ error: 'Not logged in, cannot delete report.' });
        return;
      }

      if (report.postingAccount !== req.session.phone) {
        res.send({ error: 'Cannot delete baddriverreports that does not belong to you.' });
        return;
      }

      const videoId = report.videoClip;
      const imageId = report.capturedImage;
      // @ts-ignore
      wrapper.db.collection('baddriverreports').deleteOne(query, (delReportErr, obj) => {
        if (delReportErr) {
          logger.error(`Failed to delete baddriverreport ${delReportErr}.`);
          res.send({ error: 'Failed to delete baddriverreport.' });
          return;
        }

        // also delete the video
        const gfs = Grid(wrapper.db, mongodb);
        if (videoId) {
          // should always be not null, but check anyway
          gfs.remove({ _id: videoId }, (removeVidErr) => {
            if (removeVidErr) {
              logger.error(`Failed to delete video file: ${removeVidErr}.`);
              res.send({ error: 'Failed to delete video file.' });
              return;
            }

            logger.debug('Video file deleted.');
          });
          if (!imageId) {
            res.send(obj);
            return;
          }

          gfs.remove({ _id: imageId }, (removeImgErr) => {
            if (removeImgErr) {
              logger.error(`Failed to delete image file: ${removeImgErr}.`);
              res.send({ error: 'Failed to delete image file.' });
              return;
            }

            logger.debug('Image file deleted.');
            res.send(obj);
          });
        }
      });
    });
  } catch (e) {
    res.send({ error: 'Server error.' });
  }
});

module.exports = router;
