const express = require("express");
const path = require("path");
const app = express();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(express.static(__dirname));

// صفحات مباشرة
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/client.html", (req, res) => res.sendFile(path.join(__dirname, "client.html")));
app.get("/admin.html", (req, res) => res.sendFile(path.join(__dirname, "admin.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port", PORT));
