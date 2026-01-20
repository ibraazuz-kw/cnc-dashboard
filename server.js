const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));

// الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// صفحة الدخول
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// صفحة العميل
app.get("/client", (req, res) => {
  res.sendFile(path.join(__dirname, "client.html"));
});

// صفحة الأدمن
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// أي رابط ثاني = Not Found (لا يرجع للبوابة)
app.get("*", (req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
