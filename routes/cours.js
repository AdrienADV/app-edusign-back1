var express = require("express");
require("../models/connection");
var router = express.Router();
const bcrypt = require("bcrypt");
const Cours = require("../models/cours");
const User = require("../models/users");

router.post("/addCours", async (req, res) => {
  const { start, end, intervenant, Descritpion, students } = req.body;
  if (!start || !end || !intervenant || !Descritpion || !students) {
    return res.status(404).json({ result: false, error: "il manque 1 ou plusieurs champs" });
  }

  const newCours = new Cours({
    start: start,
    end: end,
    intervenant: intervenant, // à envoyer { id, username }
    Descritpion: Descritpion,
    students: students,
    presents: [],
  });

  try {
    await newCours.save();
    await User.updateMany({ _id: { $in: students } }, { $push: { cours: newCours._id } });
    await newCours.populate("students");
  } catch (error) {
    res.status(404).json({ result: false, error: "Erreur lors de l'enregistrement du cours" });
  }
});

router.get("/todayCours"),
  async (req, res) => {
    const today = new Date();
    const userId = req.query.uid;
    const todayCours = await Cours.find({ students: userId });
    const coursOfToday = todayCours.filter((cours) => isSameDay(cours.start, today));

    return res.json({ result: true, coursOfToday: todayCours });
  };

module.exports = router;
