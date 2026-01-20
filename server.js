/**
 * server.js (كامل)
 * يشغل الموقع على Render
 * صفحات:
 * /        = بوابة الدخول
 * /client  = صفحة العميل
 * /admin   = صفحة الأدمن
 */

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// يخدم ملفات ثابتة (css/js/images)
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

// لو الرابط غلط
app.get("*", (req, res) => {
  res.status(404).send("Not Found");
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
