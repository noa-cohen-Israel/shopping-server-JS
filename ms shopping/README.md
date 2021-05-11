# shopping server JS

The micro-service provides a service for a shopping site's ordering system in a secure manner, user and order management.

## Installation


```bash
npm install
npm start
```

## Usage

you can use with postman:

http://localhost:5000/users
    
    path:/
    type:get
    get all users - administrator privileges
    headers['auth-token']: token

    path:/login
    type:get
    login by userName and password
    query: userName,password

    path:/
    type:post
    registration
    body: {firstName,lastName,phone,email,password,type,userName}

    path:/
    type:put
    update user
    body: {firstName,lastName,phone,email,password,type,userName}
    headers['auth-token']: token

    path:/
    type:delete
    delete user
    body: {id}
    headers['auth-token']: token

http://localhost:5000/orders
    
    path:/
    type:get
    get user's orders or for 'administrator' - all orders
    headers['auth-token']: token

    path:/:orderId
    type:get
    get order by orderId
    headers['auth-token']: token
    parems: orderId
    
    path:/
    type:post
    add order
    headers['auth-token']: token
    body: {date,(totalPrice),products}  products:[{name,productId,price,amount}]

    path:/:orderId
    type:put
    update order
    headers['auth-token']: token
    body: {date,(totalPrice),products}  products:[{name,productId,price,amount}]
    parems: orderId

    path:/:orderId
    type:delete
    delete order
    headers['auth-token']: token
    parems: orderId

http://localhost:5000/products
    
    path:/count
    type:get
    Receives the quantity ordered from the productId that choose
    headers['auth-token']: token
    query:productId

    path:/:orderId
    type:get
    get products of the productId that choose
    headers['auth-token']: token
    params:orderId

    path:/:orderId
    type:post
    add product
    headers['auth-token']: token
    params:orderId
    body: {name,productId,price,amount}

    path:/:orderId
    type:put
    update product
    headers['auth-token']: token
    params:orderId
    body: {name,productId,price,amount}

    path:/
    type:delete
    delete all product from all orders - administrator privileges
    headers['auth-token']: token
    query:productId  

    path:/:orderId
    type:delete
    delete product from order that choose
    headers['auth-token']: token
    params:orderId
    body: {productId}

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

