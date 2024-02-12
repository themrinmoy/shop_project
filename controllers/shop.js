const fs = require('fs');
const path = require('path');

const stripe = require('stripe')('sk_test_51OaQJHSJMzEXtTp5BWhpMqM7N5000X4Mt2M9bR31hvgJnb7OGnBw8n1AjFnlgOI9NHYnRtKPUO9CSQPI27q55b6L001og14MAB')

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order')

const ITEMS_PER_PAGE = 4;

exports.getProducts = (req, res, next) => {
    const page = +req.query.page || 1;

    let totalItems;

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'Products',
                path: '/products',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),



            })


        })
        .catch(err => {
            console.log(err);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;

    console.log('getProduct()')


    Product.findById(prodId)
        .then(product => {
            console.log('\ngetProduct()');
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products',
            })
        })
        .catch(
            err => console.log(err)
        );

};

exports.getIndex = (req, res, next) => {
    console.log("\ngetIndex()");
    const page = +req.query.page || 1;
    // console.log(((page - 1) * ITEMS_PER_PAGE))
    let totalItems;

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts;
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/',
                currentPage: page,
                hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                hasPreviousPage: page > 1,
                nextPage: page + 1,
                previousPage: page - 1,
                lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),



            })


        })
        // .limit(5)
        .catch(err => {
            console.log(err);
        });
};

exports.getCart = (req, res, next) => {
    console.log('getCart()')
    req.user
        // .populate('cart', 'title' , 'price', 'description', 'imageUrl')
        .populate('cart.items.productId')
        // .execPopulate()
        .then(
            user => {
                // console.log(user.cart.items)
                const products = user.cart.items;
                res.render('shop/cart', {
                    path: '/cart',
                    pageTitle: 'Your Cart',
                    products: products,
                })
            }
        ).catch(err => console.log(err));

};

exports.postCart = (req, res, next) => {
    console.log('postCart()')
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product)
            // return req.user.addToCart(product);

        })
        .then(result => {
            console.log(result);
            res.redirect('/cart');
        });
};



exports.postCartDeleteProduct = (req, res, next) => {
    console.log('postCartDeleteProduct()')

    const prodId = req.body.productId;
    req.user
        .removeFromcart(prodId)
        .then(result => {
            res.redirect('/cart')
        })
        .catch(err => {
            console.log(err);
        });

}


exports.getCheckout = (req, res, next) => {
    console.log('getCheckout()');

    let products;
    let total = 0;

    req.user
        .populate('cart.items.productId')
        .then(user => {
            products = user.cart.items;
            total = 0;
            products.forEach(p => {
                total += p.quantity * p.productId.price;
            });

            const transformedItems = products.map(p => ({
                quantity: p.quantity,
                price_data: {
                    // currency: 'usd',  // Modify as needed
                    currency: 'INR',  // Modify as needed
                    unit_amount: p.productId.price * 100,
                    product_data: {
                        name: p.productId.title,
                        description: p.productId.description,
                        // images: [p.productId.imageUrl],
                    },
                },
            }));

            const successUrl = req.protocol + '://' + req.get('host') + '/checkout/success';
            const cancelUrl = req.protocol + '://' + req.get('host') + '/checkout/cancel';

            console.log('Success URL:', successUrl);
            console.log('Cancel URL:', cancelUrl);

            // sessionParams.billing_address_collection = 'required';


            stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: transformedItems,
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                billing_address_collection: 'required', // Include this line for Indian regulations
            })
                .then(session => {
                    res.render('shop/checkout', {
                        path: '/checkout',
                        pageTitle: 'Checkout',
                        products: products,
                        totalSum: total,
                        sessionId: session.id,
                    });
                })
                .catch(err => {
                    const error = new Error(err);
                    error.httpStatusCode = 500;
                    return next(error);
                });
        });
};





exports.getCheckoutSuccess = (req, res, next) => {
    console.log('postOrder()')

    req.user
        .populate('cart.items.productId')
        .then(user => {
            // console.log(user.cart.items);

            const products = user.cart.items.map(i => {
                // return { quantity: i.quantity, product: { ...i.productId._doc } };
                return { quantity: i.quantity, product: { ...i.productId._doc } };

            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                // products: products,
                products: products


            });

            return order.save();
            // return order.save();

        })
        .then(result => {
            req.user.clearCart();
        })
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));

}




exports.postOrder = (req, res, next) => {
    console.log('postOrder()')

    req.user
        .populate('cart.items.productId')
        .then(user => {
            // console.log(user.cart.items);

            const products = user.cart.items.map(i => {
                // return { quantity: i.quantity, product: { ...i.productId._doc } };
                return { quantity: i.quantity, product: { ...i.productId._doc } };

            });
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user
                },
                // products: products,
                products: products


            });

            return order.save();
            // return order.save();

        })
        .then(result => {
            req.user.clearCart();
        })
        .then(result => {
            res.redirect('/orders');
        })
        .catch(err => console.log(err));

}

exports.getOrders = (req, res, next) => {
    console.log('getOrders()')


    Order.find({ 'user.userId': req.user._id })


        .then(orders => {

            res.render('shop/orders', {
                path: '/orders',
                pageTitle: "Your Orders",
                orders: orders,

            })
        })
        .catch(err => { console.log(err) });

};





exports.getInvoice = (req, res, next) => {



    const orderId = req.params.orderId;

    Order.findById(orderId).then(order => {

        if (!order) {
            return next(new Error('No order found.'));
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            return next(new Error('Unauthorized'));
        }

        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data', 'invoices', invoiceName);

        const pdfDoc = new PDFDocument();

        // Set headers
        res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', 'atachment; filename="' + invoiceName + '"');
        res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"');

        // Pipe the document to response
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);

        // Function to add common details
        function addCommonDetails() {
            pdfDoc.fontSize(14).text('Company Name and Address');
            pdfDoc.text('Invoice Number: ' + orderId);
            pdfDoc.text('Invoice Date: ' + new Date());
            pdfDoc.text('Customer Name and Address');
        }

        // Add common details at the beginning
        addCommonDetails();

        // Add products
        pdfDoc.fontSize(26).text('Invoice', { underline: true });
        pdfDoc.text('-----------------------');
        let totalPrice = 0;
        order.products.forEach(prod => {
            totalPrice += prod.quantity * prod.product.price;
            pdfDoc.fontSize(14).text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
        });
        pdfDoc.text('-----------------------');

        // Add total price
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

        // add some gap
        pdfDoc.text(' ');
        pdfDoc.text(' ');
        pdfDoc.text(' ');
        pdfDoc.text('Signature');
        // Add common details at the end


        pdfDoc.end();



    })
        .catch(err => next(err));



}
