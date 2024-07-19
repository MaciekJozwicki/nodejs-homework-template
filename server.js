const app = require("./app");
const mongoose = require("mongoose");

mongoose.set("strictQuery", true);

const port = 3000;

const uri = "mongodb+srv://maciekjozwicki:zdduN9mNT6M162NV@cluster0.fghiouw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(uri)
  .then(() => {
    console.log("Database connection successful");
    app.listen(port);
  })
  .then(() => {
    console.log(`Server is on ${port}`);
  })
  .catch((error) => {
    console.log(error.message);
    process.exit(1);
  });