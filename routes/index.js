"use strict";

const { Router } = require("express");
const router = new Router();

router.get("/", (req, res, next) => {
  console.log(req.user);
  res.render("index", { title: "Hello World!" });
});

router.get("/profile", (req, res, next) => {
  res.render("profile");
});

module.exports = router;
