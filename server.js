require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const passport = require('passport');
const cors = require('cors');
const { router: usersRouter } = require('./users');
const { router: authRouter, basicStrategy, jwtStrategy } = require('./auth');
const {User} = require('./users/models');
mongoose.Promise = global.Promise;

const { PORT, DATABASE_URL, CLIENT_ORIGIN } = require('./config');

const app = express();

app.use(morgan('common'));

app.use(
  cors({
      origin: CLIENT_ORIGIN
  })
);

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(passport.initialize());
passport.use(basicStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', usersRouter);
app.use('/api/auth/', authRouter);


app.get('/api/protected',
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    let {userName} = req.user;
    console.log("current username in proctected",{userName})
   return User
      .findOne({userName})
      .then(user => {
        console.log("protected ",user)
        return res.json({
          data: user.expenseManagerData
        })
      })
   
  }
);

app.get('*', (req, res) => {
   return res.json({ok: true});
});

let server;

function runServer(databaseurl=DATABASE_URL) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseurl, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(PORT, () => {
        console.log(`Your app is listening on port ${PORT}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = { app, runServer, closeServer };

