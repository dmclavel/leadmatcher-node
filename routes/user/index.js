const express = require('express');
const router = express.Router();

const User = require('../../models/User');

const { userAuthListen } = require('../../middlewares/authentication');

const { createErrorInstance, buildErrors, userFriendlyError } = require('../../utils/error');

router.get('/user', userAuthListen, (req, res) => {
    const user = req.user;

    res.send(user);
});

router.delete('/user/logout', userAuthListen, async (req, res) => {
    const user = req.user;
    const token = req.token;

    try {
        await user.removeToken(token);

        res.send();
    } catch (e) {
        console.log('Error deleting token: ', e);
        res.status(400).send();
    }
});

router.post('/user/signup', async (req, res, next) => {
    const { username, email, password } = req.body;

    try {
        const user = new User({ username, email, password });
        const token = await user.generateJWT();

        res.status(201).set('user-auth-token', token).send(user);
    } catch (e) {
        if (e.errors) {
            const errorKeys = Object.keys(e.errors);
            const errorMessages = buildErrors(e.errors, errorKeys);

            if (typeof errorMessages === 'string') {
                return next(createErrorInstance(400, errorMessages));
            }
        }

        next(createErrorInstance(400, userFriendlyError(e.message)));
    }
});

router.post('/user/login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;

    try {
        const user = await User.findUserCredentials(usernameOrEmail, password);

        if (user) {
            const token = await user.generateJWT();
            return res.set('user-auth-token', token).send(user);
        }
    } catch (e) {

    }

    res.status(401).send();
});

module.exports = router;