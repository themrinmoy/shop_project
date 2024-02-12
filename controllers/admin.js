const product = require('../models/product');
const Product = require('../models/product');

const fileHelper = require('../util/file');

exports.getAddProduct = (req, res, next) => {
    if (!req.session.isLoggedIn) {

        return res.redirect('/login');
    }
    console.log('getAddProduct()')
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        product: {},
        errorMessage: null,
        validationErrors: []
    });
};

// Handle the creation of a new product
exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;


    if (!image) {
        console.log(image)
    }


    if (!image) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description,
            },
            errorMessage: 'Attached file is not an image.',
            validationErrors: []
        });
    }

    const imageUrl = image.path;

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user
    });
    console.log('postAddProduct()')


    product
        .save()
        .then(result => {
            console.log('Created Product');
            res.redirect('/admin/products');
        })
        .catch(err => {
            console.log(err);
        });
};


// Render the page for editing an existing product
exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;

    // Find the product by ID in the database
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return res.redirect('/');
            }
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                product: product,
                errorMessage:  null
            });
        })
        .catch(err => { console.log(err) });
};

// Handle the update of an existing product
exports.postEditProduct = (req, res, next) => {


    console.log('postEditProduct()')

    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDescription = req.body.description;

    if (!image) {
        console.log(image)
    }

    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                console.log('wrong request!')
                return res.redirect('/')
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.description = updatedDescription;
            if (image) {
                fileHelper.deleteFile(product.imageUrl);
                product.imageUrl = image.path;
            }
            return product.save()
                .then(result => {
                    console.log("UPDATED PRODUCT!");
                    res.redirect('/admin/products');
                });
        })
        .catch(err => console.log(err))

};

// Render the page with all products
exports.getProducts = (req, res, next) => {

    console.log('getProducts() -- from admin.js')

    Product.find({ userId: req.user._id })
        .populate('userId', 'name')
        .then(products => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products',
            })
        })
        .catch(err => {
            console.log(err);
        });
};

// Handle the deletion of a product
exports.deleteProduct = (req, res, next) => {
    console.log('deleteProduct()')
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then(product => {
            if (!product) {
                return next(new Error('Product not found'));
            }
            fileHelper.deleteFile(product.imageUrl);
            return Product.deleteOne({ _id: prodId, userId: req.user._id })

        })
        .then(product => {
            console.log('DESTROYED PRODUCT');
            res.status(200).json({ message: 'Success!' })

  
        })
        .catch(err => {

            res.status(500).json({ message: 'Deleting product failed.' });
        });

};
