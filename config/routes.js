const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knex = require('knex');
const knexConfig = require('../knexfile.js');
const db = knex(knexConfig.development);
const { authenticate } = require('./middlewares.js');

const secret = "Why can't banks keep secrets? There are too many tellers!";

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
  server.get('/api/users', listUsers);
  server.delete('/api/users/:id', deleteUser);
};

function tokenMaker(user) {
  const payload = {
    username: user.username
  };
  const options = {
    expiresIn: '1h'
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
      const id = ids[0];
      db('users')
        .where({ id })
        .first()
        .then(user => {
          const token = tokenMaker(user);
          res.status(201).json({ id: user.id, token, message: 'Successful Registration' })
        })
        .catch(err => {
          res.status(500).json({ err: 'Cannot register that user' })
        })
    })
}

function login(req, res) {
  const { username, password } = req.body;
  const creds = { username, password };
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

function listUsers(req, res) {
  db('users')
    .select('id', 'username', 'password')
    .then(users => {
      res.json(users);
    })
    .catch(err => res.send(err));
}

function deleteUser(req,res) {
  const { id } = req.params;
  db('users')
    .where({ id: id })
    .del()
    .then(count => {
      res.status(200).json({ count });
    })
    .catch(err => res.status(500).json(err));
}

function getJokes(req, res) {
  axios
  //@ts-ignore
    .get('https://safe-falls-22549.herokuapp.com/random_ten')
    .then(response => {
      res.status(200).json(response.data);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}
