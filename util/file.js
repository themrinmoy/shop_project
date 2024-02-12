// const fs = require('fs');

// const deleteFile = (filePath) => {
//     fs.unlink(filePath, (err) => {
//         if (err) {
//             throw (err);
//         }
//     })
// }

// exports.deleteFile = deleteFile;



const fs = require('fs');

const deleteFile = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) {
                throw err;
            }
        });
    } else {
        console.log(`File does not exist: ${filePath}`);
    }
}

exports.deleteFile = deleteFile;