'use strict';

var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const { secret } = require('../config/config');
var config = require('../config/config');
var middleware = require('./middleware');
var _ = require('lodash');
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




//Receives the quantity ordered from the productId that choose
//headers['auth-token']: token
//query:productId
router.get('/count', middleware.validationToken, async (req, res) => {
    if (req.query.productId == undefined) return res.status(500).send("you neet enter productId")
    let result = await getUserByToken(req.headers['auth-token']);
    if (result) {
        let sum = 0
        if (result.type != 'administrator') return res.send("you neet administrator privileges")
        ordersdb.find().toArray()
            .then(resultFind => {
                if (resultFind == null) return res.status(500).send("there is not order");
                else {
                    resultFind.map((order) => {
                        order.products.map((product) => { if (product.productId == req.query.productId) sum += product.amount })
                    })
                    res
                        .send(sum + " products were invite")
                        .end();
                }
            })
            .catch(error => { return res.status(500).send(error); })
    }
    else {
        return res.status(404).send("the user not found");
    }
});

//get products of the productId that choose
//headers['auth-token']: token
//params:orderId
router.get('/:orderId', [middleware.validationToken, middleware.checkUserOrederById], function (req, res) {
    ordersdb.findOne({ "_id": ObjectId(req.params.orderId) })
        .then(result => {
            res
                .send(result.products)
                .end();
        }
        )
        .catch(error => { console.error(error); return res.status(500).send(err); })
});

//add product
//headers['auth-token']: token
//params:orderId
//body: {name,productId,price,amount}
router.post('/:orderId', [middleware.validationToken, middleware.validProduct, middleware.checkUserOrederById],
    function (req, res) {
        let products
        ordersdb.findOne({ _id: ObjectId(req.params.orderId) })
            .then((result) => {
                products = result.products

                let existProductId = _.find(products, { productId: req.body.productId });//middleware if the productId exist
                if (existProductId == undefined) {
                    req.body.amount = parseInt(req.body.amount)
                    req.body.price = parseInt(req.body.price)
                    let total = result.totalPrice + (req.body.price * req.body.amount)
                    products.push(req.body)
                    ordersdb.updateOne({ _id: ObjectId(req.params.orderId) },
                        {
                            $set: {
                                products: products,
                                totalPrice: total
                            }
                        })
                        .then(() => {
                            res
                                .send({ message: 'the product ' + req.body.productId + ' add sucssesfuly' })
                                .end();
                        })
                        .catch(error => console.error(error))
                }
                else { return res.send({ message: 'the product ' + req.body.productId + ' exist' }) }
            })
            .catch(error => res.status(404).send(error))
    });


//update product
//headers['auth-token']: token
//params:orderId
//body: {name,productId,price,amount}
router.put('/:orderId', [middleware.validationToken, middleware.validProduct, middleware.checkUserOrederById], function (req, res) {
    if (req.body.productId == undefined || req.body.amount == undefined) return res.status(500).send("you neen to enter productId and amount")
    ordersdb.findOne({ _id: ObjectId(req.params.orderId) })
        .then((result) => {

            let existProduct = _.filter(result.products, { productId: req.body.productId });//middleware if the productId exist
            if (existProduct.length != 0) {
                let amount = existProduct[0].amount
                existProduct[0].amount = parseInt(req.body.amount);
                result.totalPrice += (req.body.amount - amount) * existProduct[0].price
                ordersdb.findOneAndUpdate(
                    { _id: ObjectId(req.params.orderId) },
                    {
                        $set: {
                            totalPrice: result.totalPrice,
                            products: result.products
                        }
                    }
                )
                    .then(() => {
                        res.send("ok put");
                    })
                    .catch(error => console.error(error))
            }
            else { return res.send({ message: 'the product ' + req.body.productId + ' not exist' }) }
        })
        .catch(error => res.status(404).send(error))
});

//delete all product from all orders - administrator privileges
//headers['auth-token']: token
//query:productId
router.delete('/', middleware.validationToken, async (req, res) => {
    if (req.query.productId == undefined) return res.status(500).send("you neet enter productId")
    let result = await getUserByToken(req.headers['auth-token']);
    if (result) {
        if (result.type != 'administrator') return res.send("you neet administrator privileges")
        ordersdb.find().toArray()
            .then(resultFind => {
                if (resultFind == null) res.status(500).send("there is not order");
                else {
                    resultFind.map((order) => {
                        let removedProduct = _.remove(order.products, function (value) {
                            return value.productId == req.query.productId
                        });
                        if (removedProduct.length != 0) {
                            order.totalPrice -= removedProduct[0].amount * removedProduct[0].price
                            ordersdb.findOneAndUpdate(
                                { _id: order._id },
                                {
                                    $set: {
                                        totalPrice: order.totalPrice,
                                        products: order.products
                                    }
                                })
                        }
                    })
                    res
                        .send("the product deleted")
                        .end();
                }
            })
            .catch(error => { console.error(error); return res.status(500).send(err); })
    }
    else {
        return res.status(404).send("the user not found");
    }
});

//delete product from order that choose
//headers['auth-token']: token
//params:orderId
//body: {productId}
router.delete('/:orderId', [middleware.validationToken, middleware.checkUserOrederById], function (req, res) {
    if (req.body.productId == undefined) return res.status(500).send("productId is undefind")
    ordersdb.findOne({ _id: ObjectId(req.params.orderId) })
        .then((result) => {

            let removedProduct = _.remove(result.products, function (value) {
                return value.productId == req.body.productId
            });
            if (removedProduct.length == 0) return res.status(500).send("the productId: " + req.body.productId + " not exist in this order")
            let total = result.totalPrice;
            total -= removedProduct[0].amount * removedProduct[0].price
            ordersdb.findOneAndUpdate(
                { _id: ObjectId(req.params.orderId) },
                {
                    $set: {
                        totalPrice: total,
                        products: result.products
                    }
                }
            )
                .then(() => {
                    res.send("ok delete");
                })
                .catch(error => console.error(error))
        }
        ).catch(error => res.status(404).send(error))
})



module.exports = router;