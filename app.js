/***********************
  CNC Dashboard (Admin)
  LocalStorage Version
***********************/

const ORDERS_KEY = "cnc_orders_v1";
const STATUS_KEY = "cnc_status_map_v1";
const INVOICE_KEY = "cnc_invoice_map_v1";

let selectedOrderId = null;

// Helpers
function loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function loadStatusMap() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStatusMap(map) {
  localStorage.setItem(STATUS_KEY, JSON.stringify(map));
}

function loadInvoiceMap() {
  try {
    return JSON.parse(localStorage.getItem(INVOICE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveInvoiceMap(map) {
  localStorage.setItem(INVOICE_KEY, JSON.stringify(map));
}

function formatDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleString("ar-KW");
  } catch {
    return "";
  }
}

function badgeClass(status) {
  if (status === "جاهز") return "ready";
  return "run";
}

function safeText(v, fallback="غير محدد") {
  if (v === undefined || v === null || v === "") return fallback;
  return String(v);
}

// UI
const ordersListEl = document.getElementById("ordersList");
const emptyMsgEl = document.getElementById("emptyMsg");
const detailsBoxEl = document.getElementById("detailsBox");
const searchInputEl = document.getElementById("searchInput");

const statusSelectEl = document.getElementById("statusSelect");
const saveStatusBtn = document.getElementById("saveStatusBtn");

const cutPriceEl = document.getElementById("cutPrice");
const engravePriceEl = document.getElementById("engravePrice");
const sheetPriceEl = document.getElementById("sheetPrice");
const discountEl = document.getElementById("discount");
const invoiceNoteEl = document.getElementById("invoiceNote");
const createInvoiceBtn = document.getElementById("createInvoiceBtn");
const sendInvoiceBtn = document.getElementById("sendInvoiceBtn");
const invoicePreviewEl = document.getElementById("invoicePreview");

function renderOrders() {
  const orders = loadOrders();
  const statusMap = loadStatusMap();

  const q = (searchInputEl?.value || "").trim().toLowerCase();

  const filtered = orders.filter(o => {
    const id = safeText(o.id, "");
    const name = safeText(o.clientName, "");
    return (id + " " + name).toLowerCase().includes(q);
  });

  ordersListEl.innerHTML = "";

  if (!filtered.length) {
    emptyMsgEl.style.display = "block";
    return;
  }
  emptyMsgEl.style.display = "none";

  filtered.reverse().forEach(order => {
    const id = safeText(order.id, "ORD-بدون رقم");
    const clientName = safeText(order.clientName, "عميل بدون اسم");
    const date = formatDate(order.createdAt);

    const status = statusMap[id] || "قيد التشغيل";

    const card = document.createElement("div");
    card.className = "order-card";
    card.innerHTML = `
      <div class="order-title">${clientName}</div>
      <div class="order-meta">${id} • ${date}</div>
      <div class="badge ${badgeClass(status)}">${status}</div>
    `;

    card.onclick = () => openOrder(id);

    ordersListEl.appendChild(card);
  });
}

function openOrder(orderId) {
  selectedOrderId = orderId;

  const orders = loadOrders();
  const statusMap = loadStatusMap();
  const invoiceMap = loadInvoiceMap();

  const order = orders.find(o => safeText(o.id, "") === orderId);

  if (!order) {
    detailsBoxEl.textContent = "الطلب غير موجود.";
    return;
  }

  const clientName = safeText(order.clientName, "عميل بدون اسم");
  const status = statusMap[orderId] || "قيد التشغيل";

  statusSelectEl.value = status;

  // تفاصيل
  const lines = [];
  lines.push(`📌 رقم الطلب: ${orderId}`);
  lines.push(`👤 العميل: ${clientName}`);
  lines.push(`📅 التاريخ: ${formatDate(order.createdAt)}`);
  lines.push(`🟡 الحالة: ${status}`);
  lines.push(`--------------------------`);

  // قياسات
  const measures = Array.isArray(order.measures) ? order.measures : [];
  lines.push(`📏 القياسات (سم):`);
  if (!measures.length) {
    lines.push(`- لا توجد قياسات`);
  } else {
    measures.forEach((m, idx) => {
      lines.push(
        `${idx+1}) ${safeText(m.height,"?")} × ${safeText(m.width,"?")} | العدد: ${safeText(m.qty,"?")} | اتجاه: ${safeText(m.openDir,"?")}`
      );
    });
  }

  lines.push(`--------------------------`);

  // الشيت
  const sheets = Array.isArray(order.sheets) ? order.sheets : [];
  lines.push(`🧾 الشيتات:`);
  if (!sheets.length) {
    lines.push(`- لا توجد شيتات`);
  } else {
    sheets.forEach((s, idx) => {
      lines.push(
        `${idx+1}) ${safeText(s.size,"?")} | سماكة: ${safeText(s.thickness,"?")}mm | كمية: ${safeText(s.qty,"?")}`
      );
    });
  }

  lines.push(`--------------------------`);
  lines.push(`✂️ تفاصيل القص/الحفر: ${safeText(order.cncDetails,"لا يوجد")}`);
  lines.push(`📝 ملاحظات: ${safeText(order.notes,"لا يوجد")}`);

  detailsBoxEl.textContent = lines.join("\n");

  // فاتورة
  const inv = invoiceMap[orderId];
  if (inv) {
    cutPriceEl.value = inv.cutPrice ?? 0;
    engravePriceEl.value = inv.engravePrice ?? 0;
    sheetPriceEl.value = inv.sheetPrice ?? 0;
    discountEl.value = inv.discount ?? 0;
    invoiceNoteEl.value = inv.note ?? "";

    invoicePreviewEl.textContent = buildInvoiceText(orderId, clientName, inv);
  } else {
    invoicePreviewEl.textContent = "لا توجد فاتورة";
  }
}

function buildInvoiceText(orderId, clientName, inv) {
  const cut = Number(inv.cutPrice || 0);
  const engrave = Number(inv.engravePrice || 0);
  const sheet = Number(inv.sheetPrice || 0);
  const discount = Number(inv.discount || 0);

  const subtotal = cut + engrave + sheet;
  const total = Math.max(0, subtotal - discount);

  return `
فاتورة Pro Design
--------------------------
العميل: ${clientName}
رقم الطلب: ${orderId}
--------------------------
سعر القص: KD ${cut.toFixed(3)}
سعر الحفر: KD ${engrave.toFixed(3)}
سعر الشيت/المادة: KD ${sheet.toFixed(3)}
--------------------------
الإجمالي قبل الخصم: KD ${subtotal.toFixed(3)}
الخصم: KD ${discount.toFixed(3)}
الإجمالي النهائي: KD ${total.toFixed(3)}
--------------------------
ملاحظة: ${inv.note ? inv.note : "لا يوجد"}
✅ شكراً لتعاملكم معنا.
`.trim();
}

// حفظ الحالة
saveStatusBtn?.addEventListener("click", () => {
  if (!selectedOrderId) {
    alert("اختر طلب أولاً");
    return;
  }
  const statusMap = loadStatusMap();
  statusMap[selectedOrderId] = statusSelectEl.value;
  saveStatusMap(statusMap);

  alert("تم حفظ الحالة ✅");
  renderOrders();
  openOrder(selectedOrderId);
});

// إنشاء فاتورة
createInvoiceBtn?.addEventListener("click", () => {
  if (!selectedOrderId) {
    alert("اختر طلب أولاً");
    return;
  }

  const invoiceMap = loadInvoiceMap();

  const inv = {
    cutPrice: Number(cutPriceEl.value || 0),
    engravePrice: Number(engravePriceEl.value || 0),
    sheetPrice: Number(sheetPriceEl.value || 0),
    discount: Number(discountEl.value || 0),
    note: invoiceNoteEl.value || ""
  };

  invoiceMap[selectedOrderId] = inv;
  saveInvoiceMap(invoiceMap);

  // عرض
  const orders = loadOrders();
  const order = orders.find(o => safeText(o.id,"") === selectedOrderId);
  const clientName = safeText(order?.clientName, "عميل بدون اسم");

  invoicePreviewEl.textContent = buildInvoiceText(selectedOrderId, clientName, inv);

  alert("تم إنشاء/تحديث الفاتورة ✅");
});

// إرسال الفاتورة للعميل (يحفظها على الطلب)
sendInvoiceBtn?.addEventListener("click", () => {
  if (!selectedOrderId) {
    alert("اختر طلب أولاً");
    return;
  }

  const invoiceMap = loadInvoiceMap();
  const inv = invoiceMap[selectedOrderId];
  if (!inv) {
    alert("سوي فاتورة أولاً");
    return;
  }

  const orders = loadOrders();
  const idx = orders.findIndex(o => safeText(o.id,"") === selectedOrderId);
  if (idx === -1) {
    alert("الطلب غير موجود");
    return;
  }

  orders[idx].invoiceSent = true;
  orders[idx].invoiceData = inv;
  saveOrders(orders);

  alert("تم إرسال الفاتورة للعميل ✅");
});

// بحث
searchInputEl?.addEventListener("input", renderOrders);

// تشغيل
renderOrders();
