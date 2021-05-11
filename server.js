'use strict'

var app = module.exports = require('express')();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var port = process.env.port || 5000;


app.use('/users', require('./src/users'));
app.use('/orders', require('./src/orders'));
app.use('/products', require('./src/products'));

app.use(function (req, res) {
  res.status(404).send({ url: req.originalUrl + ' not found' })
});

app.listen(port, () => {
  console.log('server run');
});