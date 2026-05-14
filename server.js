const express = require("express");
const path = require("path");

const app = express();

/* =========================
   Public Folder
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
   Server Start
========================= */

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

console.log(
"🚀 PRO DESIGN ERP RUNNING"
);

});