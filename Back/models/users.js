const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  admin: {
    type: Boolean,
    default: false,
  },
  classe: String,
  cours: [{ type: mongoose.Schema.Types.ObjectId, ref: "cours" }],
});

const User = mongoose.model("users", UserSchema);

module.exports = User;
