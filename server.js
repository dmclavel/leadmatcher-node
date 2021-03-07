const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3001;

/* Connect to DB */
require('./db');

/* Routes */
const leadmatchRoutes = require('./routes/leadmatch');
const userRoutes = require('./routes/user');

/* Other middlewares */
const { errorLogger } = require('./middlewares/error');

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(cors({
    exposedHeaders: ['user-auth-token'],
}));

app.use(leadmatchRoutes);
app.use(userRoutes);
app.use(errorLogger);

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});