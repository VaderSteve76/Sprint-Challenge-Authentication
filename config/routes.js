const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('knex');
const knexConfig = require('../knexfile');
const db = knex(knexConfig.development);
const { authenticate } = require('./middlewares.js');

const secret = "Why can't banks keep secrets? There are too many tellers!";

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function tokenMaker(user) {
  const payload = {
    username: user.username
  };
  const options = {
    expiresIn: '10m'
  };
  return jwt.sign(payload, secret, options)
}

function register(req, res) {
  const creds = req.body;
  const hash = bcrypt.hashSync(creds.password, 12);
  creds.password = hash;
  db('users')
    .insert(creds)
    .then(ids => {
      res.status(201).json(ids);
    })
    .catch(err => res.json(err));
}

function login(req, res) {
  const creds = req.body;
  db('users')
    .where({ username: creds.username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(creds.password, user.password)) {
        const token = tokenMaker(user);
        res.status(200).json({ Welcome: user.username, token });
      } else {
        res.status(401).json({ message: 'you shall not pass!' });
      }
    })
    .catch(err => res.json(err))
}

function getJokes(req, res) {
  axios
    .get('https://safe-falls-22549.herokuapp.com/random_ten')
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
