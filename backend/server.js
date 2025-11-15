const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const path = require('path');
const MongoStore = require("connect-mongo");
const methodOverride = require("method-override");
const flash = require("express-flash");
const logger = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const cors = require("cors");
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
connectDB().then(() => {
  console.log('✅ Database connected, starting server...');

  app.listen(process.env.PORT, () => {
    console.log("🚀 Server is running, you better catch it!");
  });
});

//Using EJS for views
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//Static Folder
app.use(express.static("public"));

//CORS Configuration - Allow frontend to make requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

//Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now to allow external scripts/styles
  crossOriginEmbedderPolicy: false
}));
app.use(mongoSanitize()); // Prevent MongoDB injection

//Body Parsing
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));

//Logging
app.use(logger("dev"));

//Use forms for put / delete
app.use(methodOverride("_method"));

// Setup Sessions - stored in MongoDB
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    },
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_STRING }),
  })
);

app.use((req, res, next) => {
  console.log("🔍 Middleware Debug: Checking req.session...");
  console.log("req.session:", req.session); // Should not be undefined
  if (!req.session) {
    console.error("❌ ERROR: req.session is undefined! Check express-session setup.");
  } else {
    console.log("✅ req.session exists:", req.session);
  }
  next();
});

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Use flash messages for errors, info, ect...
app.use(flash());

//Setup Routes For Which The Server Is Listening
app.use("/", mainRoutes);
app.use("/clips", clipRoutes);

console.log('server starting to listen')



// //Server Running
// app.listen(1237, () => {
//   console.log(`Server is running on port 1234, you better catch it!`);
// });
