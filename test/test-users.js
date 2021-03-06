const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const {app, runServer, closeServer} = require('../server');
const {User} = require('../users');
const {JWT_SECRET,TEST_DATABASE_URL} = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);


describe('/api/user', function() {
  const userName = 'exampleUser';
  const password = 'examplePass';
  const fullName = 'Example';
  const userNameB = 'exampleUserB';
  const passwordB = 'examplePassB';
  const fullNameB = 'ExampleB';
  

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  after(function() {
    return closeServer();
  });

  beforeEach(function() {
  });

  afterEach(function() {
    return User.remove({});
  });

  describe('/api/users', function() {
    describe('POST', function() {
      it('Should reject users with missing username', function() {
        return chai.request(app)
          .post('/api/users')
          .send({
            password,
            fullName
          })
          .then(() => expect.fail(null, null, 'Request should not succeed'))
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('userName');
          });
      });
      it('Should reject users with missing password', function() {
        return chai.request(app)
          .post('/api/users')
          .send({
            userName,
            fullName
          })
          .then(() => expect.fail(null, null, 'Request should not succeed'))
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Missing field');
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with non-string username', function() {
        return chai.request(app)
          .post('/api/users')
          .send({
            userName: 1234,
            password,
            fullName
          })
          .then(() => expect.fail(null, null, 'Request should not succeed'))
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Incorrect field type: expected string');
            expect(res.body.location).to.equal('userName');
          });
      });
      it('Should reject users with non-string password', function() {
        return chai.request(app)
          .post('/api/users')
          .send({
            userName,
            password: 1234,
            fullName
          })
          .then(() => expect.fail(null, null, 'Request should not succeed'))
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Incorrect field type: expected string');
            expect(res.body.location).to.equal('password');
          });
      });
      it('Should reject users with non-string first name', function() {
        return chai.request(app)
          .post('/api/users')
          .send({
            userName,
            password,
            fullName: 1234
          })
          .then(() => expect.fail(null, null, 'Request should not succeed'))
          .catch(err => {
            if (err instanceof chai.AssertionError) {
              throw err;
            }

            const res = err.response;
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Incorrect field type: expected string');
            expect(res.body.location).to.equal('fullName');
          });
      });
     
      it('Should reject users with duplicate username', function() {
        return User.create({
          userName,
          password,
          fullName
        })
        .then(() =>
          chai.request(app)
            .post('/api/users')
            .send({
              userName,
              password,
              fullName
            })
        )
        .then(() => expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }

          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.reason).to.equal('ValidationError');
          expect(res.body.message).to.equal('Username already taken');
          expect(res.body.location).to.equal('userName');
        });
      });
      it('Should create a new user', function() {
        return chai.request(app)
          .post('/api/users')
          .send({
            userName,
            password,
            fullName
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('code','reason','user');
            expect(res.body.user.userName).to.equal(userName);
            expect(res.body.user.fullName).to.equal(fullName);
            return User.findOne({
              userName
            });
          })
          .then(user => {
            expect(user).to.not.be.null;
            expect(user.fullName).to.equal(fullName);
            return user.validatePassword(password);
          })
          .then(passwordIsCorrect => {
            expect(passwordIsCorrect).to.be.true;
          });
      });
      
    });

    describe('GET', function() {
      it('Should return an empty array initially', function() {
        return chai.request(app)
          .get('/api/users')
          .then(res => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            expect(res.body).to.have.length(0);
          });
      });
      it('Should return an array of users', function() {
        return User.create({
          userName,
          password,
          fullName
        }, {
          userName: userNameB,
          password: passwordB,
          fullName: fullNameB
        })
        .then(() => chai.request(app).get('/api/users'))
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body).to.have.length(2);
          expect(res.body[0]).to.deep.equal({
            userName,
            fullName
          });
          expect(res.body[1]).to.deep.equal({
            userName: userNameB,
            fullName: fullNameB
          });
        });
      });
    });
  });
});
