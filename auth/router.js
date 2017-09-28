const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const {JWT_EXPIRY,JWT_SECRET} = require('../config');

const createAuthToken = user => {
  return jwt.sign({user}, JWT_SECRET, {
    subject: user.userName,
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const router = express.Router();

router.post('/login',
  passport.authenticate('basic', {session: false}),
  (req, res) => {
    const authToken = createAuthToken(req.user.apiRepr());
    res.json({authToken});
  }
);

router.post('/refresh',
  passport.authenticate('jwt', {session: false}),
  (req, res) => {
    const authToken = createAuthToken(req.user);
    res.json({authToken});
  }
);

module.exports = {router};
