
const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  age: Number,
  phone: String,

  department: {
    type: String,
    required: true
  },

  token: Number,

  status: {
    type: String,
    enum: ["WAITING", "SERVING", "COMPLETED", "SKIPPED"],
    default: "WAITING"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Patient", patientSchema);
