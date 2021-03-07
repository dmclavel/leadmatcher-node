const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { isEmailValid, hideEmail } = require('../../utils/email');
const { hashPassword, passwordsMatching } = require('../../utils/password');
const { passwordCapitalCase, passwordSpecialCase } = require('../../constants/regex');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: [6, 'Username requires at least 6 characters.'],
        maxLength: [12, 'Up to 12 characters are allowed for the Username.'],
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        validate: {
            validator: email => Promise.resolve(isEmailValid(email)),
            message: 'Email address provided is invalid.',
        },
    },
    password: {
        type: String,
        required: true,
        trim: true,
        // minLength: [8, 'Password requires at least 8 characters.'],
        // maxLength: [32, 'Up to 32 characters are allowed for the Password.'],
        // validate: {
        //     validator: password => {
        //         return Promise.resolve(
        //             passwordCapitalCase.test(password) &&
        //             passwordSpecialCase.test(password)
        //         );
        //     },
        //     message: 'An uppercase letter and a special character is required for the Password.',
        // },
    },
    tokens: [
        {
            access: {
                type: String,
                required: true,
            },
            token: {
                type: String,
                required: true,
            },
        }
    ],
});

UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject._id;
    delete userObject.tokens;
    userObject.email = hideEmail(userObject.email);

    return userObject;
};

UserSchema.methods.generateJWT = function () {
    const user = this;
    const access = 'user-auth';

    try {
        const token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + 1209600,   // 14 days before token expires
            _id: user._id.toHexString(),
            access,
        }, process.env.AUTH_SECRET);

        user.tokens = user.tokens.concat({ access, token });

        return user.save()
            .then(() => token);
    } catch (e) {
        console.log('Error in generating authToken: ', e);
        return Promise.reject();
    }
};

UserSchema.methods.removeToken = function (token) {
    const user = this;

    return user.updateOne({ $pull: { tokens: { token } } });
};

UserSchema.statics.findTokenAndVerify = function (token) {
    const User = this;

    try {
        const decoded = jwt.verify(token, process.env.AUTH_SECRET);

        return User.findOne({
            '_id': decoded._id,
            'tokens.token': token,
            'tokens.access': 'user-auth'
        });
    } catch (e) {
        console.log('Error in token verification: ', e);
        return Promise.reject();
    }
};

UserSchema.statics.findUserCredentials = async function (usernameOrEmail, password) {
    const User = this;
    let userQuery;

    if (isEmailValid(usernameOrEmail)) {
        userQuery = { email: usernameOrEmail };
    } else {
        userQuery = { username: usernameOrEmail };
    }

    try {
        const user = await User.findOne(userQuery);

        if (user) {
            if (await passwordsMatching(password, user.password)) {
                return user;
            }
        }

        return null;
    } catch(e) {
        console.log('Error in finding credentials: ', e);
        return null;
    }
};

UserSchema.pre('save', async function (next) {
    const user = this;

    try {
        if (user.isModified('password')) {
            const hashedPassword = await hashPassword(user.password);
    
            user.password = hashedPassword;
        }

        next();
    } catch (e) {
        console.log('Error in pre-saving: ', e);
        Promise.reject();
    }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;