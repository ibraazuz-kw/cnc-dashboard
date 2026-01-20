const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "login.html")));
app.get("/client", (req, res) => res.sendFile(path.join(__dirname, "client.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "admin.html")));

app.listen(PORT, () => console.log("Server running on port:", PORT));
