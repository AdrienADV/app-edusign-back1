var express = require("express");
require("../models/connection");
var router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/users");

router.post("/register", (req, res) => {
  if (req.body.username === "" || req.body.password === "" || req.body.email === "") {
    res.json({ result: false, error: "il manque des caracères" });
    return;
  }
  User.findOne({ username: req.body.username }).then((data) => {
    if (data === null) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.password, salt);
      const newUser = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash,
        classe: req.body.classe,
        admin: req.body.admin,
      });

      newUser.save().then((newDoc) => {
        res.json({
          result: true,
          dataUser: {
            admin: newDoc.admin,
            id: newDoc._id,
          },
        });
      });
    } else {
      res.json({ result: false, error: "Utilisateur existe deja !" });
    }
  });
});

router.post("/login", (req, res) => {
  if (req.body.password === "" || req.body.email === "") {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  User.findOne({ email: req.body.email }).then((data) => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({
        result: true,
        dataUser: {
          admin: data.admin,
          id: data._id,
          username: data.username,
        },
      });
    } else {
      res.json({ result: false, error: "User not found or mauvais password" });
    }
  });
});

module.exports = router;
