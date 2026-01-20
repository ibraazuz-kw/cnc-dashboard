const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// يخدم الملفات الثابتة
app.use(express.static(__dirname));

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// صفحة العميل
app.get("/client", (req, res) => {
  res.sendFile(path.join(__dirname, "client.html"));
});

// صفحة الأدمن
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "admin.html"));
});

// أي رابط غلط يرجع للصفحة الرئيسية
app.get("*", (req, res) => {
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
