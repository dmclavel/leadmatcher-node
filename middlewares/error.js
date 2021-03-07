const errorLogger = (err, req, res, next) => {
    let validatedStatus = 200;

    if (typeof err.statusCode === 'number') {
        validatedStatus = err.statusCode;
    }

    res.status(validatedStatus).set('Content-Type', 'application/json').send({ message: err.message });
};

module.exports = {
    errorLogger,
};