const mongoose = require('mongoose');

const connectionString ="mongodb+srv://admin:9bXOhAuXNkCT03tE@cluster1.qignvzz.mongodb.net/app-eduSign"

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log('Database connected'))
  .catch(error => console.error(error));
