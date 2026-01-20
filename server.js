/**
 * server.js (مبسط)
 * يشغل الموقع على Render
 * ويفتح index.html تلقائي على الرابط الرئيسي /
 */

const express = require("express");
const path = require("path");

const app = express();

// Render يحدد PORT تلقائي
const PORT = process.env.PORT || 3000;

// يخدم الملفات الثابتة (مثل index.html و css و js)
app.use(express.static(__dirname));

// الصفحة الرئيسية تفتح تلقائي
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// أي رابط ثاني يرجعه للصفحة الرئيسية (عشان ما يعطي Not Found)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port:", PORT);
});
