import express from 'express';
import { HttpException } from './errors.js';
import * as storage from './storage.js';
import * as utils from './utils.js';
import geoip from 'geoip-lite';

const router = express.Router();

// Create new short URL
router.post('/shorturls', (req, res, next) => {
  try {
    const { url, validity, shortcode } = req.body || {};

    if (!url || !utils.isValidUrl(url)) {
      throw new HttpException('Invalid or missing URL', 400, 'URL_INVALID');
    }

    let shortCode = (shortcode || '').trim();

    if (shortCode) {
      utils.assertValidShortcode(shortCode);
      if (storage.exists(shortCode)) {
        throw new HttpException('Shortcode already exists', 409, 'SHORTCODE_CONFLICT');
      }
    } else {
      do {
        shortCode = utils.generateCode();
      } while (storage.exists(shortCode));
    }

    const now = new Date();
    const expiration = utils.getExpiry(validity);

    const newEntry = {
      shortcode: shortCode,
      originalUrl: url,
      createdAt: now,
      expiry: expiration,
      hits: 0,
      lastAccess: null,
      clicks: []
    };

    storage.save(newEntry);
    req.log?.info('short_url_created', { shortcode: shortCode, url });

    const host = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.status(201).json({
      shortLink: `${host}/${shortCode}`,
      expiry: expiration.toISOString()
    });

  } catch (err) {
    next(err);
  }
});

// Get analytics for a shortcode
router.get('/shorturls/:shortcode', (req, res, next) => {
  try {
    const code = req.params.shortcode;
    const record = storage.fetch(code);
    if (!record) throw new HttpException('Shortcode not found', 404, 'NOT_FOUND');

    res.json({
      ...record,
      createdAt: record.createdAt.toISOString(),
      expiry: record.expiry.toISOString(),
      clicks: record.clicks.map(click => ({
        ...click,
        timestamp: click.timestamp.toISOString(),
        country: click.country || 'Unknown'
      })),
      active: new Date() < new Date(record.expiry)
    });

  } catch (err) {
    next(err);
  }
});

// Redirect to original URL
router.get('/:shortcode', (req, res, next) => {
  try {
    const code = req.params.shortcode;
    const data = storage.fetch(code);
    if (!data) throw new HttpException('Shortcode not found', 404, 'NOT_FOUND');

    if (new Date() > new Date(data.expiry)) {
      req.log?.warn('access_to_expired_shortlink', { shortcode: code });
      throw new HttpException('Link expired', 410, 'LINK_EXPIRED');
    }

    const ip = req.ip || req.headers['x-forwarded-for'];
    const geo = geoip.lookup(ip);
    const country = geo?.country || 'Unknown';

    const clickData = {
      timestamp: new Date(),
      referrer: req.get('Referer') || null,
      userAgent: req.get('User-Agent') || null,
      country
    };

    storage.recordClick(code, clickData);
    req.log?.info('redirecting_to_original', { shortcode: code, destination: data.originalUrl });

    res.redirect(302, data.originalUrl);

  } catch (err) {
    next(err);
  }
});

export default router;
