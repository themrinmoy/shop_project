const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;


const mongoConnect = callback => {
    MongoClient.connect(
        'mongodb+srv://mrinmoy_shop_project:1LsXE01sdYFoYl4J@cluster0.l2av6jw.mongodb.net/shop?retryWrites=true&w=majority'
    )
        .then(client => {
            console.log("Connected!")
            _db = client.db();
            callback();
        })
        .catch(err => {
            console.log(err)
            throw err;
        });
};

const getDb = () => {
    if (_db) {
        return _db;
    }
    throw 'No database Found!'
}

// module.exports = mongoConnect;

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;


// mrinmoy_shop_project
// 1LsXE01sdYFoYl4J













// const Sequelize = require('sequelize');

// // const sequelize = new Sequelize('node-complete', 'root', 'Mysql', {
// //     dialect: 'mysql',
// //     host: 'localhost'
// // });

//

// module.exports = sequelize;



















































// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'node-complete',
//     password: 'Mysql'
// })


// module.exports = pool.promise();


