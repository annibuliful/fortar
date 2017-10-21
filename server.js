const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const validator = require('express-validator')
const ejs = require('ejs');
const engine = require('ejs-mate');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const flash = require('connect-flash');

const app = express();

//mongoose.connect('mongodb://root:1234@ds159024.mlab.com:59024/showroomrod');
mongoose.connect('mongodb://localhost/showroomrod');
mongoose.Promise = global.Promise;

require('./config/passport');
require('./secret/secret');

app.use(express.static('public'));
app.use(express.static('photo'));
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(validator())
app.use(session({
    secret: 'Thisismytestkey',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

require('./routes/user')(app,passport);
require('./routes/car')(app);
require('./routes/support')(app);


app.listen(2000, function() {
    console.log('App is running on port 2000');
});