require("dotenv").config({ path: __dirname + "/.env" });
var generate = require("./routes/generate");
var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var apiRouter = require("./routes/api");

const PORT = process.env.PORT || 3000;
const BOT_ID = "B04LLKT2R5M";

var app = express();
app.use("/health", (req, res, next) => {
  res.status(200);
  res.send("OK");
});

const token = process.env.BOT_TOKEN;

// Allows our app to receive messages that occur on channels
// At the moment, the app will simply console.log anything that comes in.
const eventsApi = require("@slack/events-api");
const slackEvents = eventsApi.createEventAdapter(process.env.SIGNING_SECRET);

// allow our app to respond to some (or all) of those messages.
const { WebClient, LogLevel } = require("@slack/web-api");
const client = new WebClient(token, {
  logLevel: LogLevel.DEBUG,
});
app.use("/slack", indexRouter);
app.use("/slack", slackEvents.expressMiddleware());

slackEvents.on("error", async (err) => {
  console.error(err);
  return "fail";
});

slackEvents.on("message", async (event) => {
  console.log(event);

  //TODO:
  // There is a bug here where its not aggregating the right messages before it send to open ai API
  //
  if (!event.subtype && !event.bot_id) {
    //TODO: can you get a different message from generate openai api

    // replies only has the reply
    replies = await client.conversations.replies({
      token,
      ts: event.thread_ts || event.ts,
      channel: event.channel,
      limit: 100,
    });

    const conversationReplies = replies.messages
      .filter((message) => message.bot_id != BOT_ID)
      .map((message) => message.text)
      .join("\n");
    console.log(
      ">>>>\n Conversations Replies\n" + conversationReplies + "\n>>>>\n"
    );

    // this seems to just grab last 10 messages within the thread or not
    // history = await client.conversations.history({
    //   token,
    //   ts: event.thread_ts,
    //   channel: event.channel,
    //   limit: 10,
    // });
    // console.log(
    //   ">>>>\n Conversations history\n" +
    //     history.messages.map((message) => message.text).join("\n") +
    //     "\n>>>>\n"
    // );
    // appendMessage = history.messages
    //   .map((message) => {
    //     message.text;
    //   })
    //   .join("\n");

    //console.log(">>>>\nappendMessage\n" + appendMessage + "\n>>>>\n");
    //TODO: debug why append Message is not doing the right thing before swapping smartResponse
    //smartResponse = await generate(appendMessage);

    //smartResponse = await generate(event.text);

    smartResponse = await generate(conversationReplies);
    console.log(">>>>\npost another message\nsmartResponse\n>>>>");

    if (smartResponse) {
      client.chat.postMessage({
        token,
        channel: event.channel,
        thread_ts: event.ts,
        text: smartResponse,
      });
    } else {
      client.chat.postMessage({
        token,
        channel: event.channel,
        thread_ts: event.ts,
        text: "Open AI is busy at the moment",
      });
    }
  }
});

//This sets up an express server that runs on localhost:3000
app.listen(3000, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//order here is significant, each of these is installing a middleware
app.use("/", indexRouter);

app.use("/users", usersRouter);
app.use("/api", apiRouter); // this makes it /api/xxx in the calling path

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
