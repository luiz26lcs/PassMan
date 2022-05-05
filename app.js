require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const loginSchema = new mongoose.Schema({
  website: String,
  username: String,
  password: String
});

const Login = mongoose.model("Login", loginSchema);

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  logins: [loginSchema]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
  res.render("home");
});

app.get("/data", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("data", {
      data: req.user
    });
  } else {
    res.redirect("/login");
  }
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.get("/create", function(req, res) {
  if (req.isAuthenticated()) {
    res.render("create");
  } else {
    res.redirect("/login");
  }
});



app.post("/login", function(req, res) {

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if (err) {
      console.log(err)
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/data");
      });
    }
  });

});

app.post("/register", function(req, res) {

  User.register({
    username: req.body.username
  }, req.body.password, function(err, user) {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function() {
        res.redirect("/data");
      });
    }
  });

});


app.post("/create", function(req, res) {

  const site = req.body.website;
  const user = req.body.username;
  const passwd = req.body.password;

  const newLogin = new Login({
    website: site,
    username: user,
    password: passwd
  });

  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err)
    } else {
      if (foundUser) {
        foundUser.logins.push(newLogin);
        foundUser.save(function() {
          res.redirect("/data");
        });
      }
    }
  });
});


app.post("/data", function(req, res) {
  res.redirect("/create");
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  
  User.findById(req.user.id, function(err, foundUser) {
    if (err) {
      console.log(err)
    } else {
      if (foundUser) {
        foundUser.logins.pull({ _id: checkedItemId });
        foundUser.save(function() {
          res.redirect("/data");
        });
      }
    }
  });

});


app.listen(3000, function() {
  console.log("Started at port 3000.");
});
