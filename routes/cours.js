var express = require("express");
require("../models/connection");
var router = express.Router();
const bcrypt = require("bcrypt");
const Cours = require("../models/cours");
const User = require("../models/users");

router.post("/addCours", async (req, res) => {
  const { start, end, intervenant, descritpion, students } = req.body;
  if (!start || !end || !intervenant || !Descritpion || !students) {
    return res.status(404).json({ result: false, error: "il manque 1 ou plusieurs champs" });
  }

  const newCours = new Cours({
    start: start,
    end: end,
    intervenant: intervenant, // à envoyer { id, username }
    descritpion: descritpion,
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

router.get("/mesCours"), async (req, res) => {
  try {
    const today = new Date();
    const userId = req.query.userUid;
    const allCours = await Cours.find({ students: userId });

    console.log(allCours)
    const coursTodayAndBefore = allCours.filter((cours) => {

    })
  } catch (err) {
    console.log(err)
  }


    // return res.json({ result: true, cours: coursOfTodayAndBefore });
  };

router.post("/présent"), async (req, res) => {
    try {
      const { userId, coursId } = req.body;
      const user = await User.findById(userId);
      const cours = await Cours.findById(coursId);
      if (!user || !cours) {
        return res.status(404).json({ message: "Utilisateur OU cours introuvable." });
      }
      cours.presents.push(user._id);
      await cours.save();

      return res.status(200).json({ result: true, message: "L'élève à été ajouté avec succès !" });
    } catch {
      return res.status(500).json({
        message:
          "Une erreur est survenue lors de l'ajout de l'utilisateur à la liste des présents.",
      });
    }
  };

module.exports = router;
