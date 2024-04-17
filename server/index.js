"use strict";

// Basic express setup:

const PORT          = 8080;
const express       = require("express");
const app           = express();

app.use(express.static("public"));


//simple route to get webmap

app.get("/", function(req, res) {
  res.render("index");
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
