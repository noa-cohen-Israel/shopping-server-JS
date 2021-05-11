'use strict';

var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var config = require('../config/config');
var ObjectId = require('mongodb').ObjectID;
var middleware = require('./middleware');
var email = require('./email');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
let usersdb;


MongoClient.connect(url, { useUnifiedTopology: true }, function (err, client) {
    if (err) throw err;
    console.log("Database created!");

    let db = client.db('mydb');
    usersdb = db.collection('users');
});


function register(req) {
    let userDetails = req.body;
    var token = jwt.sign({ id: req.body.userName }, config.secret, {
        expiresIn: 86400 // expires in 24 hours
    });
    userDetails.userId = token;
    return userDetails;
}


//get all users - administrator privileges
//headers['auth-token']: token
router.get('/', [middleware.validationToken, middleware.checkPrivileges], function (req, res) {
    usersdb.find().toArray()
        .then(result => {
            res.send(result);
        })
        .catch(error => console.error(error))
});

//login by userName and password
//query: userName,password
router.get('/login', function (req, res) {
    if (req.query.userName != undefined || req.query.password != undefined) {
        usersdb.findOne({ "userName": req.query.userName, "password": req.query.password })
            .then(result => {
                if (result == null) res.status(500).send("the userName or the password is worng");
                else {
                    var token = jwt.sign({ id: result._id }, config.secret, {
                        expiresIn: 86400 // expires in 24 hours
                    });
                    usersdb.updateOne({ _id: result._id }, {
                        $set: {
                            userId: token
                        }
                    })
                    email.email(userDetails.email, "ברוכים השבים!", userDetails.firstName)
                    res
                        .header('Access-Control-Expose-Headers', 'auth-token')
                        .header('auth-token', token)
                        .json({ message: 'Logged In' })
                        .end();
                }
            })
            .catch(error => { console.error(error); return res.status(500).send(err); })
    }
    else res.status(500).send("userName or password is undefined");
});

//registration
//body: {firstName,lastName,phone,email,password,type,userName}
router.post('/', [middleware.validUser, middleware.checkUserName],
    function (req, res) {
        const userDetails = register(req)
        let formatUserDetails = {}
        formatUserDetails.firstName = userDetails.firstName
        formatUserDetails.lastName = userDetails.lastName
        formatUserDetails.userName = userDetails.userName
        formatUserDetails.phone = userDetails.phone
        formatUserDetails.password = userDetails.password
        formatUserDetails.email = userDetails.email
        formatUserDetails.type = userDetails.type
        formatUserDetails.userId = userDetails.userId
        usersdb.insertOne(formatUserDetails)
            .then(() => {
                email.email(userDetails.email, "ברוכים הבאים!", userDetails.firstName)
                res
                    .header('Access-Control-Expose-Headers', 'auth-token')
                    .header('auth-token', userDetails.userId)
                    .json({ message: 'registration' })
                    .end();
            })
            .catch(error => console.error(error))
    });

//update user
//body: {firstName,lastName,phone,email,password,type,userName}
//headers['auth-token']: token
router.put('/', [middleware.validationToken, middleware.validUser, middleware.checkUserByUserName], function (req, res) {
    usersdb.findOneAndUpdate(
        { userName: req.body.userName },
        {
            $set: {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                phone: req.body.phone,
                password: req.body.password
            }
        }
    )
        .then(() => {
            res.status(200).send("ok put");
        })
        .catch(error => console.error(error))
});

//delete user
//body: {id}
//headers['auth-token']: token
router.delete('/', [middleware.validationToken, middleware.checkUserById], function (req, res) {
    usersdb.deleteOne({ _id: ObjectId(req.body.id) })
        .then(() => {
            res.send("ok")
        })
        .catch(error => console.error(error))
});

module.exports = router;