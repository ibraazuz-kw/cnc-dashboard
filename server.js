/**
 * server.js - ملف واحد (كامل)
 * بواسطة ChatGPT
 *
 * تشغيل محلي:
 * node server.js
 *
 * روابط:
 * العميل:  http://localhost:3000/
 * الادمن:  http://localhost:3000/admin
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

// Render / Cloud / Local
const PORT = process.env.PORT || 3000;

// ====== مسارات التخزين ======
const DATA_DIR = path.join(__dirname, "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

// ====== تأكد من وجود مجلد البيانات ======
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ====== تأكد من وجود ملف الطلبات ======
if (!fs.existsSync(ORDERS_FILE)) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2), "utf8");
}

// ====== Middlewares ======
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// ====== ملفات الواجهة (public) ======
app.use(express.static(path.join(__dirname, "public")));

// ====== أدوات مساعدة ======
function readOrders() {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, "utf8");
    return JSON.parse(raw || "[]");
  } catch (e) {
    return [];
  }
}

function saveOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

// ====== الصفحة الرئيسية (واجهة العميل) ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ====== صفحة الادمن ======
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// ====== API: إضافة طلب جديد ======
app.post("/api/orders", (req, res) => {
  try {
    const body = req.body || {};

    // بيانات الطلب
    const order = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),

      // العميل
      customerName: body.customerName || "",
      customerPhone: body.customerPhone || "",

      // المقاسات الأساسية
      width: body.width || "",
      height: body.height || "",

      // اتجاه الباب
      doorDirection: body.doorDirection || "",

      // عرض الخط
      lineWidth: body.lineWidth || "",

      // الجام / المسافات
      jamTop: body.jamTop || "",
      jamBottom: body.jamBottom || "",
      jamLockSide: body.jamLockSide || "",
      jamHingeSide: body.jamHingeSide || "",

      // المسكة المخفية
      hiddenHandle: body.hiddenHandle || "no",
      hiddenHandlePosition: body.hiddenHandlePosition || "",

      // نوع المادة
      materialType: body.materialType || "",
      sheetThickness: body.sheetThickness || "",

      // ملاحظات
      notes: body.notes || "",

      // حالة الطلب
      status: "جديد",
    };

    const orders = readOrders();
    orders.unshift(order);
    saveOrders(orders);

    res.json({ ok: true, message: "تم استلام الطلب بنجاح ✅", order });
  } catch (err) {
    res.status(500).json({ ok: false, message: "خطأ بالسيرفر", error: err.message });
  }
});

// ====== API: جلب كل الطلبات (للاادمن) ======
app.get("/api/orders", (req, res) => {
  try {
    const orders = readOrders();
    res.json({ ok: true, orders });
  } catch (err) {
    res.status(500).json({ ok: false, message: "خطأ بالسيرفر", error: err.message });
  }
});

// ====== API: تحديث حالة الطلب ======
app.post("/api/orders/:id/status", (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    const orders = readOrders();
    const index = orders.findIndex((o) => o.id === id);

    if (index === -1) {
      return res.status(404).json({ ok: false, message: "الطلب غير موجود" });
    }

    orders[index].status = status || orders[index].status;
    saveOrders(orders);

    res.json({ ok: true, message: "تم تحديث الحالة ✅", order: orders[index] });
  } catch (err) {
    res.status(500).json({ ok: false, message: "خطأ بالسيرفر", error: err.message });
  }
});

// ====== API: حذف طلب ======
app.delete("/api/orders/:id", (req, res) => {
  try {
    const { id } = req.params;

    const orders = readOrders();
    const newOrders = orders.filter((o) => o.id !== id);

    saveOrders(newOrders);

    res.json({ ok: true, message: "تم حذف الطلب ✅" });
  } catch (err) {
    res.status(500).json({ ok: false, message: "خطأ بالسيرفر", error: err.message });
  }
});

// ====== صفحة فحص ======
app.get("/health", (req, res) => {
  res.json({ ok: true, status: "running", port: PORT });
});

// ====== تشغيل السيرفر ======
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
