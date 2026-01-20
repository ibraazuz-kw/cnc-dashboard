const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// يخدم الملفات الثابتة (HTML/CSS/JS) من مجلد public
app.use(express.static(path.join(__dirname, "public")));

// الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// صفحة العميل
app.get("/orders", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "orders.html"));
});

// صفحة الأدمن
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// لو دخل على رابط غلط
app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
