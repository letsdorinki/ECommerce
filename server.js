const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const db = require('./db');
const ordersRoutes = require('./routes/order');

const app = express();
app.use(bodyParser.json());
app.use('/orders', ordersRoutes);
const PORT = process.env.PORT || 8080;

app.use('/api', ordersRoutes); // Mount orders routes

app.get('/', (req, res) => {
    res.send('E-commerce API is running...');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
