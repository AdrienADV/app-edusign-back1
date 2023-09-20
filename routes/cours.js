var express = require("express");
require("../models/connection");
var router = express.Router();
const bcrypt = require("bcrypt");
const Cours = require("../models/cours");
const User = require("../models/users");

router.post("/create", async (req, res) => {
  const { start, end, intervenant, description, students, salle, titre } = req.body;
  if (!start || !end || !intervenant || !description || !students || !salle) {
    return res.status(404).json({ result: false, error: "il manque 1 ou plusieurs champs" });
  }

  const newCours = new Cours({
    start: start,
    end: end,
    intervenant: intervenant, // à envoyer { id, username }
    titre : titre, 
    salle: salle,
    description: description,
    students: students,
    presents: [],
  });
  try {
    await newCours.save();
    await User.updateMany({ _id: { $in: students } }, { $push: { cours: newCours._id } });
    // await newCours.populate("students");
    return res.status(200).json({ result: true, error: "Cours crée" });
  } catch (error) {
    res.status(404).json({ result: false, error: "Erreur lors de l'enregistrement du cours" });
  }
});

router.get("/mes-cours-students", async (req, res) => {
  try {
    const today = new Date();
    const userId = req.query.userUid;
    const allCours = await Cours.find({ students: userId });

    const coursTodayAndBefore = allCours.filter((cours) => {
      return cours.start <= today;
    });
    res.status(200).json({ result: true, cours: coursTodayAndBefore });
  } catch (err) {
    console.log(err);
    res.status(400).json({ result: false, error: "aucun cours récupéré" });
  }
});

router.post("/present", async (req, res) => {
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
    return res.status(500).json({ result: false, message: "Une erreur est survenue lors de l'ajout de l'utilisateur à la liste des présents."});
  }
});












/////////////  /////////////  /////////////  /////////////  /////////////  /////////////  /////////////  /////////////  /////////////

router.delete("/delete-all-cours", async (req, res) => {
  try {
    const result = await User.updateMany({ admin: false }, { $set: { cours: [] } });
    if (result.nModified > 0) {
      return res.status(200).json({
        message: "Les cours ont été supprimés de tous les utilisateurs non-admin avec succès.",
      });
    } else {
      return res
        .status(404)
        .json({ message: "Aucun utilisateur non-admin trouvé pour supprimer les cours." });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur suppression des cours." });
  }
});

module.exports = router;
