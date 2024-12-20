console.log('server first starting')
const express = require("express");
console.log('here .25')
const app = express();
console.log('here .5')
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const path = require('path');
console.log('here 1')
const MongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override");
const flash = require("express-flash");
const logger = require("morgan");
const connectDB = require("./config/database");
const mainRoutes = require("./routes/main");
const clipRoutes = require("./routes/clips");
const bodyParser = require('body-parser');

//Use .env file in config folder
require("dotenv").config({ path: "./config/.env" });

// Passport config
require("./config/passport")(passport);

console.log('connecting to database')
//Connect To Database
connectDB();

//Using EJS for views
app.set("view engine", "ejs");

//Static Folder
app.use(express.static("public"));

//Body Parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Logging
app.use(logger("dev"));

//Use forms for put / delete
app.use(methodOverride("_method"));

// Setup Sessions - stored in MongoDB
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Use flash messages for errors, info, ect...
app.use(flash());

//Setup Routes For Which The Server Is Listening
app.use("/", mainRoutes);
app.use("/clips", clipRoutes); 

console.log('server starting to listen')

//Server Running
app.listen(process.env.PORT, () => {
  console.log("Server is running, you better catch it!");
});
