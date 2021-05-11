var jwt = require('jsonwebtoken');
var config = require('../config/config');


const userFields = ['firstName', 'lastName', 'phone', 'email', 'password', 'type', 'userName']
const productFields = ['name', 'productId', 'price', 'amount']
const orderFields = ['date', 'products']

var ObjectId = require('mongodb').ObjectID;
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
let token
let db;
async function connectToDb() {
  let myDb = await MongoClient.connect(url, { useUnifiedTopology: true });
  db = myDb.db();
  ordersdb = await db.collection('orders');
}

connectToDb();


async function getUserByToken() {
  let result = await db.collection('users').findOne({ "userId": token });
  if (result != undefined)
    return result;
  else return null;
}


const defaultFieldValidation = (value, regex) => {
  if (value == undefined) return false
  if (!regex.test(value)) {
    return true;
  }
  return false;
};

exports.validationToken = (req, res, next) => {
  token = req.headers['auth-token'];
  if (token == null) return res.send("user need to login");
  jwt.verify(token, config.secret, (err) => {
    if (err) return res.send("the token isnot valid")
    next()
  })
}
exports.validProduct = (req, res, next) => {
  let errorMessage = []
  productFields.map((value) => {
    if (req.body[value] == undefined) {
      errorMessage.push(value + " is must field ")
    }
  })
  if (defaultFieldValidation(req.body[productFields[0]], /^[א-תA-Za-z\s'-]{2,20}$/)) errorMessage.push("Product name between 2 and 20 letters ")
  if (defaultFieldValidation(req.body[productFields[2]], /^[0-9]{1,9}$/)) errorMessage.push("price is just numbers ")
  if (defaultFieldValidation(req.body[productFields[3]], /^[0-9]{1,2}$/)) errorMessage.push("Limited quantity per product between 0-99 ")
  if (errorMessage.length != 0) return res.status(500).send(errorMessage.map(value => { return value }))
  else next()
}

exports.validOrder = (req, res, next) => {
  let errorMessage = []
  orderFields.map((value) => {
    if (req.body[value] == undefined) {
      errorMessage.push(value + " is must field ")
    }
  })
  if (defaultFieldValidation(req.body[orderFields[0]], /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/)) errorMessage.push("date format DD/MM/YYYY")
  if (!Array.isArray(req.body[orderFields[1]])) errorMessage.push("products is array of products")
  else {
    let listProductsId = []
    req.body[orderFields[1]].map((product) => {
      productFields.map((value) => {
        if (product[value] == undefined) {
          errorMessage.push(value + " is must field in products")
        }
      })
      if (product[productFields[1]] != undefined) {
        if (listProductsId.includes(product[productFields[1]])) errorMessage.push("productId:" + product[productFields[1]] + " can be once")
        else listProductsId.push(product[productFields[1]])
      }
      if (defaultFieldValidation(product[productFields[0]], /^[א-תA-Za-z\s'-]{2,20}$/)) errorMessage.push("Product name between 2 and 20 letters in productId:" + product[productFields[1]])
      if (defaultFieldValidation(product[productFields[2]], /^[0-9]{1,9}$/)) errorMessage.push("price is just numbers productId:" + product[productFields[1]])
      if (defaultFieldValidation(product[productFields[3]], /^[0-9]{1,2}$/)) errorMessage.push("Limited quantity per product between 0-99 productId:" + product[productFields[1]])
    })
  }
  if (errorMessage.length != 0) return res.status(500).send(errorMessage.map(value => { return value }))
  else next()
}



exports.validUser = (req, res, next) => {
  let errorMessage = []
  userFields.map((value) => {
    if (req.body[value] == undefined) {
      errorMessage.push(value + " is must field ")
    }
  })
  if (defaultFieldValidation(req.body[userFields[0]], /^[א-תA-Za-z\s'-]{2,20}$/)) errorMessage.push("firstName between 2 and 20 letters ")
  if (defaultFieldValidation(req.body[userFields[1]], /^[א-תA-Za-z\s'-]{2,20}$/)) errorMessage.push("lastName between 2 and 20 letters")
  if (defaultFieldValidation(req.body[userFields[2]], /^0(\d{8,9})$/)) errorMessage.push("phone is not valid")
  if (defaultFieldValidation(req.body[userFields[3]], /^[a-zA-Z0-9]{6,30}@gmail.com$/)) errorMessage.push("email is not valid")
  if (defaultFieldValidation(req.body[userFields[4]], /(?=.*\d)(?=.*[a-zA-Z]).{8,20}$/)) errorMessage.push("password is not valid")
  if (defaultFieldValidation(req.body[userFields[5]], /^[א-תA-Za-z\s'-]{2,20}$/)) errorMessage.push("type between 2 and 20 letters")
  if (defaultFieldValidation(req.body[userFields[6]], /^[0-9א-תA-Za-z\s'-]{2,20}$/)) errorMessage.push("userName is not valid")
  if (errorMessage.length != 0) return res.status(500).send(errorMessage.map(value => { return value }))
  else next()
}


exports.checkPrivileges = async (req, res, next) => {
  let result = await getUserByToken()
  if (result != null) {
    if (result.type == 'administrator') next()
    else return res.status(500).send("you neet administrator privileges")
  }
  else return res.status(404).send("the token changed")
}

exports.checkUserName = async (req, res, next) => {
  const existUserName = await db.collection('users').findOne({ "userName": req.body.userName });
  if (existUserName == null) next()
  else return res.status(500).send("this userName exist")

}

exports.checkUserByUserName = async (req, res, next) => {
  let result = await getUserByToken()
  if (result != null) {
    if (result.userName == req.body.userName || result.type == 'administrator') next()
    else return res.status(500).send("you neet administrator privileges")
  }
  else return res.status(404).send("the token changed")

}

exports.checkUserById = async (req, res, next) => {
  let result = await getUserByToken()
  if (result != null) {
    if (result._id.valueOf(req.body.id) || result.type == 'administrator') next()
    else return res.status(500).send("you neet administrator privileges")
  }
  else return res.status(404).send("the token changed")

}

exports.checkUserOrederById = async (req, res, next) => {
  let result = await getUserByToken()
  if (result != null) {
    const existOrder = await db.collection('orders').findOne({ "_id": ObjectId(req.params.orderId) });
    if (existOrder != null) {
      if (result._id.generationTime == existOrder.userId.generationTime || result.type == 'administrator') next()
      else return res.status(500).send("you neet administrator privileges")
    }
    else return res.status(500).send("order not exist")
  }
  else return res.status(500).send("user not exist")

}

