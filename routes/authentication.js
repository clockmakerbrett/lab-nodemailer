const { Router } = require("express");
const router = new Router();

const nodemailer = require("nodemailer");
const transport = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

const generateRandomToken = () => {
  const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += characters[Math.floor(Math.random() * characters.length)];
  }
  return token;
};

const User = require("./../models/user");
const bcryptjs = require("bcryptjs");

router.get("/", (req, res, next) => {
  res.render("index");
});

router.get("/sign-up", (req, res, next) => {
  res.render("sign-up");
});

router.post("/sign-up", (req, res, next) => {
  const { name, email, password } = req.body;
  let user;
  bcryptjs
    .hash(password, 10)
    .then((hash) => {
      return User.create({
        name,
        email,
        passwordHash: hash,
        confirmationToken: generateRandomToken(),
      });
    })
    .then((document) => {
      user = document;
      req.session.user = user._id;
    })
    .then(() => {
      return transport.sendMail({
        from: process.env.NODEMAILER_EMAIL,
        to: "clockmakerbrett@gmail.com",
        subject: "Confirm your account",
        html: `
          <span>Click the link below to confirm your account</span>
          <br>
          <a href="http://localhost:3000/confirm/?token=${user.confirmationToken}">http://localhost:3000/confirm/?token=${user.confirmationToken}</a>
        `,
      });
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((error) => {
      next(error);
    });
});

router.get("/confirm", (req, res, next) => {
  const token = req.query.token;
  User.findOneAndUpdate({ confirmationToken: token }, { status: "active" })
    .then(() => {
      res.render("confirmation");
    })
    .catch((error) => {
      next(error);
    });
});

router.get("/sign-in", (req, res, next) => {
  res.render("sign-in");
});

router.post("/sign-in", (req, res, next) => {
  let userId;
  const { email, password } = req.body;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return Promise.reject(new Error("There's no user with that email."));
      } else {
        userId = user._id;
        return bcryptjs.compare(password, user.passwordHash);
      }
    })
    .then((result) => {
      if (result) {
        req.session.user = userId;
        res.redirect("/");
      } else {
        return Promise.reject(new Error("Wrong password."));
      }
    })
    .catch((error) => {
      next(error);
    });
});

router.post("/sign-out", (req, res, next) => {
  req.session.destroy();
  res.redirect("/");
});

const routeGuard = require("./../middleware/route-guard");

router.get("/private", routeGuard, (req, res, next) => {
  res.render("private");
});

module.exports = router;
