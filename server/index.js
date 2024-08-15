require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const { createTicket, updateTicket, getAssistants, getUsers, addUser, loginUser } = require('./services');
const cors = require('cors');
const logger = require('./logger');

const app = express();
const PORT = 8080;

const allowedOrigins = [
  'http://localhost:5173',
  'http://ticketer-ad5c5fe4-d288-4c49-b916-125663c09ed2.s3-website-us-east-1.amazonaws.com',
  'https://ticketer.stocksmanager.net'
];

app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization', 'X-Amz-Date', 'X-Amz-Security-Token'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.get('/assistants', async (req, res) => {
  try {
    const assistants = await getAssistants();
    res.status(200).json(assistants);
  } catch (error) {
    logger.error("Error occurred while fetching assistants", error);
    res.status(500).send("Error occurred while fetching assistants");
  }
});

app.post('/tickets', async (req, res) => {
  try {
    await createTicket(req.body);
    res.status(201).send("Assistant added successfully");
  } catch (error) {
    logger.error("Error occurred while adding ticket", error);
    res.status(500).send("Error occurred while adding ticket");
  }
});

app.patch('/tickets/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    const { scanned, usado } = req.body;
    await updateTicket(qrCode, scanned, usado);
    res.status(200).send("Ticket updated successfully");
  } catch (error) {
    logger.error("Error occurred while updating ticket", error);
    res.status(500).send("Error occurred while updating ticket");
  }
}
);

app.get('/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).send("Error occurred while fetching users");
  }
});

app.post('/users', async (req, res) => {
  try {
    const user = await addUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    logger.error("Error occurred while adding user", error);
    res.status(500).send("Error occurred while adding user");
  }
});

app.post('/login', async (req, res) => {
  try {
    logger.info("Logging in with user", req.body);
    const { usuario, password } = req.body;
    const loginResult = await loginUser(usuario, password);

    if (loginResult.status === "OK") {
      // Return the token in the response body instead of setting a cookie
      res.status(200).json({ message: "Login successful", token: loginResult.token });
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    logger.error("Error occurred while logging in", error);
    res.status(500).send("Error occurred while logging in");
  }
});


// Check if running locally or on AWS Lambda
if (process.env.LOCAL_ENV === 'true') {
  app.listen(PORT, (error) => {
    if (!error) {
      logger.info("Server is Successfully Running, and App is listening on port " + PORT);
    } else {
      logger.info("Error occurred, server can't start", error);
    }
  });
} else {
  logger.info("Running on AWS Lambda");
  module.exports.handler = serverless(app);
}
