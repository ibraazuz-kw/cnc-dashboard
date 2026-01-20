/**
 * CNC Dashboard - server.js
 * تشغيل:
 * npm install
 * npm start
 *
 * يفتح:
 * https://YOUR-RENDER-URL/
 * https://YOUR-RENDER-URL/admin
 */

const express = require("express");
const path = require("path");

const app = express();

// مهم لقراءة JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== مجلد الواجهة (public) ======
const PUBLIC_DIR = path.join(__dirname, "public");
app.use(express.static(PUBLIC_DIR));

// ====== صفحات الموقع ======

// الصفحة الرئيسية /
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

// صفحة الأدمن
app.get("/admin", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "admin.html"));
});

// صفحة الطلبات للأدمن
app.get("/admin/orders", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "orders.html"));
});

// اختبار السيرفر
app.get("/health", (req, res) => {
  res.json({ ok: true, app: "CNC Dashboard", status: "running" });
});

// إذا دخل رابط غير موجود
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// ====== تشغيل السيرفر على Render ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port:", PORT);
});
