/** Initialize connection to the database **/
require('dotenv').config();
const mongoose = require('mongoose');

(async function initializeDBConnection () {
    try {
        const mongoURI = 
            process.env.NODE_ENV === 'production' ? 
            '' : 
            'mongodb://127.0.0.1:27017/LeadMatchNode';
        mongoose.Promise = global.Promise;
        mongoose.set('useCreateIndex', true);
        mongoose.set('useFindAndModify', false);
        await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    } catch (e) {
        console.log(`Connection failed: ${e}`);
    }
})();