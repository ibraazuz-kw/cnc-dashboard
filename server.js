const express = require("express");
const path = require("path");

const app = express();

/* =========================
   Static Files
========================= */

app.use(
express.static(
path.join(__dirname, "public")
)
);

/* =========================
   Main Route
========================= */

app.get("/", (req, res) => {

res.sendFile(
path.join(__dirname, "public", "login.html")
);

});

/* =========================
   Server
========================= */

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

console.log(
"🚀 PRO DESIGN RUNNING"
);

});