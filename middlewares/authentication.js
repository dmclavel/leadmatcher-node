const User = require('../models/User');

const userAuthListen = async (req, res, next) => {
    const bearer = req.get('Authorization');

    if (typeof bearer === 'string') {
        try {
            const token = bearer.split(' ')[1];
            const user = await User.findTokenAndVerify(token);

            if (user) {
                req.user = user;
                req.token = token;
                return next();
            }
        } catch (e) {

        }
    }

    res.status(401).send();
};

module.exports = {
    userAuthListen,
};