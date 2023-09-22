var express = require("express");
require("../models/connection");
var router = express.Router();
const bcrypt = require("bcrypt");
const Cours = require("../models/cours");
const User = require("../models/users");
const crypto = require("crypto");

router.post("/create", async (req, res) => {
  const { start, end, intervenant, description, students, salle, titre, intervenantId } = req.body;
  if (!start || !end || !intervenant || !description || !students || !salle) {
    return res.status(404).json({ result: false, error: "il manque 1 ou plusieurs champs" });
  }

  const newCours = new Cours({
    start: start,
    end: end,
    intervenant: intervenant,
    intervenantId: intervenantId,
    titre: titre,
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

// router.post("/present", async (req, res) => {
//   try {
//     const { userId, coursId } = req.body;
//     const user = await User.findById(userId);
//     const cours = await Cours.findById(coursId);
//     if (!user || !cours) {
//       return res.status(404).json({ message: "Utilisateur OU cours introuvable." });
//     }

//     if (cours.presents.includes(userId)) {
//       return res.status(400).json({ message: "L'utilisateur est déjà présent." });
//     }
//     cours.presents.push(user._id);
//     await cours.save();
//     return res.status(200).json({ result: true, message: "L'élève à été ajouté avec succès !" });
//   } catch {
//     return res.status(500).json({
//       result: false,
//       message: "Une erreur est survenue lors de l'ajout de l'utilisateur à la liste des présents.",
//     });
//   }
// });

router.get("/cours-details", async (req, res) => {
  const coursUid = req.query.coursUid;
  try {
    const coursDetails = await Cours.findOne({ _id: coursUid });
    return res.status(200).json({ result: true, coursDetails });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ result: false, message: "ERREUR RECHERCHE" });
  }
});

router.get("/mes-cours-admin", async (req, res) => {
  const uid = req.query.adminUid;
  try {
    const allMyCours = await Cours.find({ intervenantId: uid });
    return res.status(200).json({ result: true, allMyCours: allMyCours });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ result: false, message: "ERREUR RECHERCHE" });
  }
});

/////////////  /////////////  /////////////  /////////////  /////////////  /////////////  /////////////  /////////////  /////////////

const secretKey = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

function encryptIdAndExpirationDate(id, expirationDate) {
  const cipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv);
  let encryptedId = cipher.update(id, "utf8", "hex");
  encryptedId += cipher.final("hex");

  const expirationDateCipher = crypto.createCipheriv("aes-256-cbc", secretKey, iv);
  let encryptedExpirationDate = expirationDateCipher.update(
    expirationDate.toString(),
    "utf8",
    "hex"
  );
  encryptedExpirationDate += expirationDateCipher.final("hex");
  return { encryptedId, encryptedExpirationDate };
}

function decryptData(encryptedData) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", secretKey, iv);
  let decryptedData = decipher.update(encryptedData, "hex", "utf8");
  decryptedData += decipher.final("utf8");
  return decryptedData;
}

router.get("/qr-code-generator", async (req, res) => {
  try {
    const uid = req.query.coursUid;
    const idToEncrypt = uid;
    const expirationDateToEncrypt = Date.now() + 30 * 1000;
    const { encryptedId, encryptedExpirationDate } = encryptIdAndExpirationDate(
      idToEncrypt,
      expirationDateToEncrypt
    );
    const response = `${encryptedId}-${encryptedExpirationDate}`;
    res.status(200).json({ result: true, QrCodeId: response, iv });
  } catch (e) {
    res.status(500).json({ result: false, error: e + "ERRORR 500 MEEEC" });
  }
});

router.post("/qr-code-scan", async (req, res) => {
  try {
    const { encryptedId, encryptedExpirationDate, userId } = req.body;
    const decryptedIdCours = decryptData(encryptedId);
    const decryptedExpirationDate = decryptData(encryptedExpirationDate);

    const data = {
      idcours: decryptedIdCours,
      decryptedExpirationDate: decryptedExpirationDate,
      userId: userId,
    };
    const dateEnMillisecondes = decryptedExpirationDate;
    const date = new Date(dateEnMillisecondes);
    const aujourdHui = new Date();

    if (date > aujourdHui) {
      return res.status(400).json({ result: false, error: "Le QR CODE EST PERIME MEEEC" });
    } else {
      const user = await User.findById(userId);
      const cours = await Cours.findById(decryptedIdCours);
      if (!user || !cours) {
        return res.status(404).json({ message: "Utilisateur OU cours introuvable." });
      }
      if (cours.presents.includes(userId)) {
        return res.status(400).json({ message: "L'utilisateur est déjà présent." });
      }
      cours.presents.push(user._id);
      await cours.save();
      return res.status(200).json({ result: true, message: "L'élève à été ajouté avec succès !" });
    }
  } catch (e) {
    res.status(500).json({ result: false, error: e.message });
  }
});

// router.delete("/delete-all-cours", async (req, res) => {
//   try {
//     const result = await User.updateMany({ admin: false }, { $set: { cours: [] } });
//     if (result.nModified > 0) {
//       return res.status(200).json({
//         message: "Les cours ont été supprimés de tous les utilisateurs non-admin avec succès.",
//       });
//     } else {
//       return res
//         .status(404)
//         .json({ message: "Aucun utilisateur non-admin trouvé pour supprimer les cours." });
//     }
//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({ message: "Erreur suppression des cours." });
//   }
// });

module.exports = router;
