var nodemailer = require('nodemailer');

exports.email = function (userEmail, textEmail, userName) {
    var transporter = nodemailer.createTransport({
        service: 'gmail.com',
        auth: {
            user: 'projectstore.nodejs@gmail.com',
            pass: 'Project1368'
        }
    });

    var mailOptions = {
        from: 'projectstore.nodejs@gmail.com',
        to: userEmail,
        subject: ' שלום ' + userName + ' !',
        text: textEmail
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('sent email!')
        }
    })
}