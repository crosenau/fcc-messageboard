'use strict';

require('dotenv').config();

const express     = require('express');
const bodyParser  = require('body-parser');
const expect      = require('chai').expect;
const cors        = require('cors');
const MongoClient = require('mongodb').MongoClient;
const helmet      = require('helmet');

const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet({
  frameguard: { action: 'sameorigin' },
  dnsPrefetchControl: { allow: false },
  referrerPolicy: { policy: 'same-origin' }
}));



app.use((req, res, next) => {
  console.log('\n');
  console.log(`New ${req.method} request to ${req.path} from ${req.ip}`);
  console.log('x-forwarded-for: ', req.headers['x-forwarded-for']);
  next();
});

const client = new MongoClient(process.env.DATABASE_URI, { useNewUrlParser: true });

client.connect()
  .then(() => {
    console.log('Successfully connected to database');

    const db = client.db('fcc');

    //For FCC testing purposes
    fccTestingRoutes(app);
    apiRoutes(app, db);

    //Sample front-end
    app.route('/b/:board/')
    .get((req, res) => {
      res.sendFile(process.cwd() + '/views/board.html');
    });

    app.route('/b/:board/:threadid')
    .get((req, res) => {
      res.sendFile(process.cwd() + '/views/thread.html');
    });

    app.route('/')
    .get((req, res) => {
      res.sendFile(process.cwd() + '/views/index.html');
    });
      
    //404 Not Found Middleware
    app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found');
    });

    //Start our server and tests!
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
      if(process.env.NODE_ENV==='test') {
        console.log('Running Tests...');
        setTimeout(() => {
          try {
            runner.run();
          } catch(e) {
            const error = e;
              console.log('Tests are not valid:');
              console.log(error);
          }
        }, 1500);
      }
    });
  })
  .catch(err => {
    console.log('Error connecting to database');
    console.log(err);
  });

module.exports = app; //for testing
