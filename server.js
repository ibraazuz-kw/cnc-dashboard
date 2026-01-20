const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// يخدم كل الملفات (html/css/js)
app.use(express.static(__dirname));

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// صفحات ثابتة
app.get("/client", (req, res) => {
  res.sendFile(path.join(__dirname, "client.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
