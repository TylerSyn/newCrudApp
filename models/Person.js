const mongoose = require("mongoose");

const peopleSchema = new mongoose.Schema({
    firstname:String,
    lastname:String,
    email:String
});

const Person = mongoose.model("Person", peopleSchema, "peopledata");

module.exports = Person;