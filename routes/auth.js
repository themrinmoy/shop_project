const express = require('express');
// const expValidator = require('express-validator/check')
const { check, body } = require('express-validator')

const authController = require('../controllers/auth');
const User = require('../models/user')


const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post(
    '/login',
    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email address.'),
        body('password', 'Password has to be valid')
            .isLength({ min: 5 })
            .isAlphanumeric()
    ],
    authController.postLogin);

// router.post(
//     '/login',
//     [
//         body('email')
//             .isEmail()
//             .withMessage('Please enter a valid email address.'),
//         body('password', 'Password has to be valid.')
//             .isLength({ min: 5 })
//             .isAlphanumeric()
//     ],
//     authController.postLogin
// );

router.post('/signup',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom((value, { req }) => {

                return User.findOne({ email: value }).then(userDoc => {

                    if (userDoc) {
                        // req.flash('error', 'E-Mail exists already, please try different one!')
                        // return res.redirect('/signup');
                        return Promise.reject(
                            'E-Mail exists already, please try different one!'
                        );
                    }
                })


            }),
        // check()
        body('password',
            'Please enter a password with only numbers and text and at least 5 characters.')
            .isLength({ min: 5 })
            .isAlphanumeric(),

        body('confirmPassword').custom((value, { req }) => {
            if (value !== req.body.password) {

                throw new Error('Passwords have to match!');
                // throw new Error('Passwords mismatch!');
            }
            return true;
        })
    ],
    authController.postSignup);

router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/new-password', authController.postNewPassword);

module.exports = router;
