const mongoose = require("mongoose");

const coursSchema = mongoose.Schema({
  start: Date,
  end: Date,
  intervenant: String,
  intervenantId : String,
  titre : String,
  description : String,
  salle : String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  presents : [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }]
});

const Cours = mongoose.model("cours", coursSchema);

module.exports = Cours;
