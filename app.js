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
const BOT_ID = "B04LLKT2R5M";
const botUserId = "U04M3KY743E";
var app = express();
app.use("/health", (req, res, next) => {
  res.status(200);
  res.send("OK");
});

const token = process.env.BOT_TOKEN;
const userIDToNameMap = new Map();
choice = "";

// Allows our app to receive messages that occur on channels
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

    // If ID is bot ID, its buddy, otherwise its user with name of the user's ID.
    const conversationReplies = [];
    for (var i = 0; i < replies.messages.length; i++) {
      var message = replies.messages[i];
      var replyMessage = {
        id: `${message.user}_${message.thread_ts}`,
        content: message.text,
      };
      if (message.user.includes(botUserId)) {
        replyMessage.role = "assistant";
        replyMessage.name = "Buddy";
      } else {
        replyMessage.role = "user";
        var userName =
          (await lookupNamesFromIDInMap(message.user)) || message.user;
        userName = userName.split(".", 1)[0];
        replyMessage.name = userName;
      }
      conversationReplies.push(replyMessage);
    }

    console.log(
      ">>>>\n Conversations Replies\n" +
        JSON.stringify(conversationReplies) +
        "\n>>>>\n"
    );

    console.log(event.user);
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

async function lookupNamesFromIDInMap(userID) {
  if (!userIDToNameMap.has(userID)) {
    res = await client.users.info({ token, user: userID });
    if (res.ok) {
      userIDToNameMap.set(userID, res.user.name);
    }
  }
  return userIDToNameMap.get(userID);
}
