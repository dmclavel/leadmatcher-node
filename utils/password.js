const bcrypt = require('bcryptjs');

const hashPassword = (password) => 
    new Promise((resolve, reject) => {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                reject();
            } else {
                bcrypt.hash(password, salt, function (err, hash) {
                    if (err) {
                        reject();
                    } else {
                        resolve(hash);
                    }
                });
            }
        });
    });

const passwordsMatching = async (inputPassword, dbPassword) => {
    try {
        return await bcrypt.compare(inputPassword, dbPassword);
    } catch (e) {
        console.log('Error in password match checker: ', e);
        return false;
    }
};

module.exports = {
    hashPassword,
    passwordsMatching,
};