'use strict';

var express = require('express');
var router = express.Router();
var middleware = require('./middleware');
var ObjectId = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
let ordersdb;
let db;
async function connectToDb() {
    let myDb = await MongoClient.connect(url, { useUnifiedTopology: true });
    db = myDb.db();
    ordersdb = await db.collection('orders');
}

connectToDb();



async function getUserByToken(token) {
    let result = await db.collection('users').findOne({ "userId": token });
    if (result != undefined)
        return result;
    else return null;
}


//get user's orders or for administrator all orders
//headers['auth-token']: token
router.get('/', middleware.validationToken, async (req, res) => {
    let result = await getUserByToken(req.headers['auth-token'])
    if (result) {
        let fieldsToFind = {};
        if (result.type != 'administrator') fieldsToFind = { "userId": result._id }
        ordersdb.find(fieldsToFind).toArray()
            .then(resultFind => {
                if (resultFind == null) res.status(500).send(" orders not exist");
                else {
                    res
                        .send(resultFind)
                    .end();
                }
            })
            .catch(error => { console.error(error); return res.status(500).send(err); })
    }
    else {
        return res.status(404).send("the token changed");
    }
});

//get order by orderId
//headers['auth-token']: token
//parems: orderId
router.get('/:orderId', [middleware.validationToken, middleware.checkUserOrederById], function (req, res) {
    ordersdb.findOne({ "_id": ObjectId(req.params.orderId) })
        .then(result => {
            if (result == null) res.status(500).send("this order not exist");
            else {
                res
                    .send(result)
                .end();
            }
        })
        .catch(error => { console.error(error); return res.status(500).send(err); })
});

//add order
//headers['auth-token']: token
//body: {date,(totalPrice),products}  products:[{name,productId,price,amount}]
router.post('/', [middleware.validationToken, middleware.validOrder],
    function (req, res) {
        let order = req.body
        db.collection('users').findOne({ "userId": req.headers['auth-token'] })
            .then((result) => {
                order.userId = result._id
                order.totalPrice = 0
                order.products.map((value) => {
                    value.amount = parseInt(value.amount); value.price = parseInt(value.price)
                    order.totalPrice += value.price * value.amount
                })
                ordersdb.insertOne(order)

                    .then(() => {
                        res
                            .send({ message: 'the order number ' + order._id })
                            .end();
                    })
                    .catch(error => console.error(error))
            })
            .catch(error => res.status(404).send(error))

    });


//update order
//headers['auth-token']: token
//body: {date,(totalPrice),products}  products:[{name,productId,price,amount}]
//parems: orderId
router.put('/:orderId', [middleware.validationToken, middleware.validOrder, middleware.checkUserOrederById], function (req, res) {
    let totalPrice = 0
    req.body.products.map((value) => {
        value.amount = parseInt(value.amount); value.price = parseInt(value.price)
        totalPrice += value.price * value.amount
    })
    ordersdb.findOneAndUpdate(
        { _id: ObjectId(req.params.orderId) },
        {
            $set: {
                date: req.body.date,
                totalPrice: totalPrice,
                products: req.body.products
            }
        }
    )
        .then(() => {
            res.send("ok put");
        })
        .catch(error => console.error(error))
});

//delete order
//headers['auth-token']: token
//parems: orderId
router.delete('/:orderId', [middleware.validationToken, middleware.checkUserOrederById], function (req, res) {
    ordersdb.deleteOne({ _id: ObjectId(req.params.orderId) })
        .then(() => {
            res.send("ok")
        })
        .catch(error => console.error(error))
});

module.exports = router;