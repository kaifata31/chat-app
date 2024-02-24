const mongoose = require("mongoose");

const url = `mongodb+srv://chat_app_admin:admin1234@cluster0.ksg2rez.mongodb.net/?retryWrites=true&w=majority`;

mongoose
  .connect(url)
  .then(() => console.log("Connected to DB"))
  .catch((e) => console.log("Error", e));
