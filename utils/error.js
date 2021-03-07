const createErrorInstance = (status, message) => {
    const error = new Error();

    error.statusCode = status;
    error.message = message;

    return error;
};

const buildErrors = (errorObject, errorKeys) => {
    if (!Array.isArray(errorKeys)) {
        return null;
    }

    let errorMessages = '';

    for (let i = 0; i < errorKeys.length; i++) {
        if (i + 1 === errorKeys.length) {
            errorMessages += `${errorObject[errorKeys[i]].properties.message}`;
        } else {
            errorMessages += `${errorObject[errorKeys[i]].properties.message}|`;
        }
    }

    return errorMessages;
};

const userFriendlyError = (errorMessage) => {
    if (errorMessage.includes('duplicate key error') && errorMessage.includes('username')) {
        return 'Username has already been taken.';
    } else if (errorMessage.includes('duplicate key error') && errorMessage.includes('email')) {
        return 'Email address has already been taken.';
    }

    return errorMessage;
}

module.exports = {
    createErrorInstance,
    buildErrors,
    userFriendlyError,
};