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
//TODO: Need to figure out where to park this, if we want to install this in dev/ staging.
// e.g. need to figure out to install this to multiple slack
const BOT_ID = "B04LLKT2R5M";
const botUserId = "U04M3KY743E";
var app = express();
app.use("/health", (req, res, next) => {
  res.status(200);
  res.send("OK");
});

// PROD URL: https://buddy-ai.onrender.com/slack

const token = process.env.BOT_TOKEN;
choice = "";

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

  if (!event.subtype && !event.bot_id) {
    // Only grab replies
    replies = await client.conversations.replies({
      token,
      ts: event.thread_ts || event.ts,
      channel: event.channel,
      limit: 100,
    });

    console.log(JSON.stringify(replies.messages, undefined, 2));
    // const conversationReplies = replies.messages
    //   .filter((message) => message.bot_id != BOT_ID)
    //   .filter((message) => !message.text.startsWith("switch to"))
    //   .map((message) => message.text)
    //   .join("\n");

    //TODO: improve this by looking up the user slack name to put as user instead of the ID.
    /*
      Conversations Replies
    [{"role":"U37T7TB0F","content":"<@U04M3KY743E> testing monday morning"},{"role":"U04M3KY743E","content":"( "},{"role":"U37T7TB0F","content":"good morning"}]
    */
    // what it is now in prompt.
    //<U37T7TB0F>: jellybean!
    //<U04M3KY743E>:  Nope, try again!
    //<U013B333UQ6>: red bull
    // how to make it response to people directly by name, not some random ID.
    //<U04M3KY743E>:  Your name is @U013B333UQ6.
    //<U013B333UQ6>: say <@U013B333UQ6>
    // <U04M3KY743E>:   Hi there, <@U013B333UQ6>!

    const conversationReplies = replies.messages.map((message) => ({
      role: message.user.includes(botUserId) ? "assistant" : "user",
      name: message.user.includes(botUserId) ? "Buddy" : message.user,
      content: message.text,
    }));

    console.log(
      ">>>>\n Conversations Replies\n" +
        JSON.stringify(conversationReplies) +
        "\n>>>>\n"
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
    console.log(event.user);
    //var conversationRepliesJSON = JSON.stringify(replies.messages);
    var lastMessage = replies.messages[replies.messages.length - 1];
    var lastMessagedUser = lastMessage["user"];

    console.log("lastMessage: " + JSON.stringify(lastMessage));
    console.log("lastMessagedUser: " + lastMessagedUser);

    if (lastMessagedUser.includes(botUserId)) {
      console.log("Skipping message, not for us");
      return;
    }

    smartResponse = await generate(conversationReplies);
    console.log(">>>>\nsmartResponse\n" + smartResponse + "\n>>>>\n");

    if (smartResponse) {
      // if (smartResponse.includes(":")) {
      //   smartResponse = smartResponse.split(":", 2)[1];
      // }
      // smartResponse = smartResponse.replace(/<(U[^>]+)>/, "<@$1>");

      //<U37T7TB0F>: <@U04M3KY743E> create a riddle where the answer is “cottonball”, let people guess, do not share the answer untill 5 guesses or until someone guess “cottonball”.

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
