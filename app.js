require('dotenv').config({path: __dirname + '/.env'})

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var apiRouter = require('./routes/api')


//const PORT = process.env.PORT || 3000

var app = express();

// Code added to connect this express app to slack app

const token = process.env.BOT_TOKEN

// Allows our app to receive messages that occur on channels
// that it has been added to.
// At the moment, the app will simply console.log anything that comes in.
const eventsApi = require('@slack/events-api')
const slackEvents = eventsApi.createEventAdapter(process.env.SIGNING_SECRET)

// allow our app to respond to some (or all) of those messages.
const { WebClient, LogLevel } = require("@slack/web-api");
const client = new WebClient(token, {
    logLevel: LogLevel.DEBUG
});

app.use('/', slackEvents.expressMiddleware())
slackEvents.on("message", async(event) => {
    console.log(event)
})

//This sets up an express server that runs on localhost:3000 
//TODO: set a PORT in your .env file
app.listen(3000, () => {
  console.log(`App listening at http://localhost:3000`)
  //console.log(`App listening at http://localhost:${PORT}`)
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//order here is significant, each of these is installing a middleware
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api', apiRouter); // this makes it /api/xxx in the calling path

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
