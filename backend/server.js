const express = require('express');
const bcrypt = require('bcryptjs');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require("cors");
const app = express();
app.use(cors());
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET;
const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL;
const HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET;
const hasuraRequest = async (query, variables) => {
  const response = await axios.post(HASURA_GRAPHQL_URL, {
    query,
    variables,
  }, {
    headers: {
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
  });
  return response.data;
};

app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const query = `
    mutation($name: name!, $email: String!, $password: bpchar!) {
  insert_User_one(object: {name: $name, email: $email, password: $password}) {
    id
    name
    email
  }
}

  `;
  const variables = { name, email, password: hashedPassword };
  try{const result = await hasuraRequest(query, variables);
    const token = jwt.sign({ id: result.data?.insert_User_one.id, email: result.data?.insert_User_one.email }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ message: 'User registered successfully', user: result.data.insert_User_one, token });}
    catch(e){
      res.json({error: e.errors});
      console.log('error:',e);
    }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const query = `
    query($email: String!) {
      User(where: {email: {_eq: $email}}) {
        id
        name
        email
        password
      }
    }
  `;
  const variables = { email };
  const result = await hasuraRequest(query, variables);
  const user = result?.data.User[0];

  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: 'Invalid password' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

const authenticate = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

app.get('/profile', authenticate, async (req, res) => {
  const query = `
    query($id: uuid!) {
      User_by_pk(id: $id) {
        id
        name
        email
        balance
      }
    }
  `;
  const variables = { id: req.user.id };
  const result = await hasuraRequest(query, variables);

  res.json(result.data.User_by_pk);
});

app.post('/deposit', authenticate, async (req, res) => {
  const { amount } = req.body;
  const user_id = req.user.id;

  const query = `
    mutation($user_id: uuid!, $amount: float8!) {
      insert_Transaction_one(object: {user_id: $user_id, Amount: $amount, Type: "deposit"}) {
        Id
        user_id
        Amount
        Type
        time
      }
      update_User_by_pk(pk_columns: {id: $user_id}, _inc: {balance: $amount}) {
        id
        balance
      }
    }
  `;
  const variables = { user_id, amount };

  try {
    const result = await hasuraRequest(query, variables);
    res.json(result.data.insert_Transaction_one);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/withdraw', authenticate, async (req, res) => {
  const { amount } = req.body;
  const user_id = req.user.id;

  const query = `
    mutation($user_id: uuid!, $amount: float8!) {
      insert_Transaction_one(object: {user_id: $user_id, Amount: $amount, Type: "withdrawal"}) {
        Id
        user_id
        Amount
        Type
        time
      }
      update_User_by_pk(pk_columns: {id: $user_id}, _inc: {balance: $amount}) {
        id
        balance
      }
    }
  `;
  const variables = { user_id, amount: -amount };

  try {
    const result = await hasuraRequest(query, variables);
    res.json(result.data.insert_Transaction_one);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
