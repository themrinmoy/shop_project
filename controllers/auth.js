const crypto = require('crypto')

const bcrypt = require('bcryptjs')
const User = require('../models/user');

const nodemailer = require('nodemailer');

const postmarkTransport = require('nodemailer-postmark-transport');
const { validationResult } = require('express-validator');
const { error } = require('console');

const transport = nodemailer.createTransport(postmarkTransport({
    auth: {
        apiKey: 'POSTMARK_API_TOKEN'
    }
}))


exports.getLogin = (req, res, next) => {
    console.log("getLogin()");
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/login', {
        path: '/login',
        pageTitle: "Login",
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: [],
    });
  
};





exports.getSignup = (req, res, next) => {

    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }

    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []


    });
}

exports.postLogin = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;

    const errors = validationResult(req);
    // const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors.array());
        // console.log(errors.array())
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: { email: email, password: password },


            // validationErrors: errors.array()
            validationErrors: errors.array()
        });
    }

    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage: 'Invalid email or password',
                    oldInput: { email: email, password: password },


                    validationErrors: []
                });
            }
            bcrypt
                .compare(password, user.password)
                .then(doMatch => {

                    if (doMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        return req.session.save(err => {
                            console.log(err);
                            return res.redirect('/');
                        });
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Invalid email or password',
                        oldInput: { email: email, password: password },


                        validationErrors: []
                        // validationErrors
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/login');
                });
        })
};

exports.postSignup = (req, res, next) => {

    console.log('postSignup()')

    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array())
        console.log(errors.array())
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: req.body.confirmPassword
            },
            validationErrors: errors.array()
        });
    }

    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            // if (typeof hashedPassword === 'string') {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/login')
            return transport.sendMail({
                to: email,
                from: 'Mrinmoy.Chakraborty2020@uem.edu.in',
                subject: 'Signup succeeded!',
                html: '<h1>You Successfully signed Up!</h1>'
            });

        })
        .catch(err => {
            console.log(err);
        })
};

exports.postLogout = (req, res, next) => {
    console.log('postLogout()');
    req.session.destroy(err => {
        console.log(err);
        res.redirect('/');

    })
}


exports.getReset = (req, res, next) => {

    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message


    });

}


exports.postReset = (req, res, next) => {

    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset')
            // res.redirect('/login');
        }
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No account with that email found.')
                    return res.redirect('/reset')
                }

                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;

                return user.save();
            })
            .then(result => {
                res.redirect('/')
                transport.sendMail({
                    to: req.body.email,
                    from: 'Mrinmoy.Chakraborty2020@uem.edu.in',
                    subject: 'Password Reset',
                    html: `
                            <p>Hello,</p>
                            <p>We received a request to reset the password associated with this email address. If you made this request, click the link below to reset your password:</p>
                            <a href="http://localhost:3000/reset/${token}">Reset Password</a>
                            <p>If you didn't make this request, you can ignore this email.</p>
                            <p>Best regards,<br>mrinmoy.org</p>
                            `
                })

            })
            // .then(() => {
            //     res.redirect('/')
            // })
            .catch(err => {
                console.log(err)
            })
    })

}



exports.getNewPassword = (req, res, next) => {

    const token = req.params.token;

    User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
        .then(user => {
            let message = req.flash('error');
            if (message.length > 0) {
                message = message[0];
            } else {
                message = null;
            }



            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'New Password',
                errorMessage: message,
                userId: user._id.toString(),
                passwordToken: token

            });
        })
        .catch(err => {
            console.log(err);
        })



}


exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken, resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            resetUser = user;
            return bcrypt.hash(newPassword, 12);

        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            console.log('password updated!')

            return resetUser.save()
        })
        .then(result => {

            res.redirect('/login')
        })
        .catch(err => {
            console.log(err)
        })


}