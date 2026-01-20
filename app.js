// ===============================
// أدوات عامة
// ===============================
function nowString(){
  const d = new Date();
  return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${d.toLocaleTimeString("ar-KW")}`;
}

function genOrderId(){
  return "ORD-" + Date.now();
}

function getClientName(){
  return localStorage.getItem("pd_client_name") || "بدون اسم";
}

// ===============================
// جدول القياسات (الارتفاع قبل العرض)
// ===============================
let measures = [];

function initMeasureUI(){
  // سطر واحد افتراضي
  measures = [
    { height:"", width:"", qty:1, dir:"يمين (من داخل البيت)" }
  ];
  renderMeasures();
}

function addMeasure(){
  measures.push({ height:"", width:"", qty:1, dir:"يمين (من داخل البيت)" });
  renderMeasures();
}

function removeMeasure(i){
  measures.splice(i,1);
  if(measures.length === 0) measures.push({ height:"", width:"", qty:1, dir:"يمين (من داخل البيت)" });
  renderMeasures();
}

function dirArrow(dir){
  // سهم واضح مثل طلبك
  if(dir.includes("يمين")) return "➡️";
  return "⬅️";
}

function renderMeasures(){
  const box = document.getElementById("measureList");
  if(!box) return;

  box.innerHTML = "";
  measures.forEach((m, i)=>{
    const row = document.createElement("div");
    row.className = "itemRow tableGrid grid-measure";

    row.innerHTML = `
      <div style="font-weight:900">${i+1}</div>

      <div>
        <input placeholder="مثال: 300" value="${m.height}"
          oninput="measures[${i}].height=this.value" />
      </div>

      <div>
        <input placeholder="مثال: 110" value="${m.width}"
          oninput="measures[${i}].width=this.value" />
      </div>

      <div>
        <input type="number" min="1" value="${m.qty}"
          oninput="measures[${i}].qty=parseInt(this.value||1)" />
      </div>

      <div>
        <div class="row" style="gap:10px">
          <div class="col">
            <select onchange="measures[${i}].dir=this.value; renderMeasures();">
              <option ${m.dir.includes("يمين")?"selected":""}>يمين (من داخل البيت)</option>
              <option ${m.dir.includes("يسار")?"selected":""}>يسار (من داخل البيت)</option>
            </select>
          </div>
          <div class="col" style="min-width:120px">
            <div class="arrowBox">${dirArrow(m.dir)}</div>
          </div>
        </div>
      </div>

      <div style="grid-column: 1 / -1; margin-top:10px">
        <button class="btn-red" onclick="removeMeasure(${i})">حذف</button>
      </div>
    `;
    box.appendChild(row);
  });

  // مثال سريع
  const ex = document.getElementById("measureExample");
  if(ex){
    const first = measures[0];
    ex.innerText = `✅ مثال: ${first.height||"300"}×${first.width||"110"} عدد ${first.qty||1} / اتجاه الفتحة ${first.dir.includes("يمين")?"يمين":"يسار"}`;
  }
}

// ===============================
// تفاصيل الشيت (قياسات جاهزة + سماكات 2-12)
// ===============================
const SHEET_SIZES = [
  "122x244","122x300","150x300","100x300","100x200","122x350","122x400","150x400"
];

const THICKNESS = [2,3,4,5,6,7,8,9,10,11,12];

let sheets = [];

function initSheetUI(){
  sheets = [{ size:"122x244", thick:2, qty:1 }];
  renderSheets();
}

function addSheet(){
  sheets.push({ size:"122x244", thick:2, qty:1 });
  renderSheets();
}

function removeSheet(i){
  sheets.splice(i,1);
  if(sheets.length===0) sheets.push({ size:"122x244", thick:2, qty:1 });
  renderSheets();
}

function renderSheets(){
  const box = document.getElementById("sheetList");
  if(!box) return;
  box.innerHTML = "";

  sheets.forEach((s, i)=>{
    const row = document.createElement("div");
    row.className = "itemRow tableGrid grid-sheet";

    const sizeOptions = SHEET_SIZES.map(v=>`<option ${v===s.size?"selected":""}>${v}</option>`).join("");
    const thickOptions = THICKNESS.map(v=>`<option ${v===s.thick?"selected":""}>${v}</option>`).join("");

    row.innerHTML = `
      <div>
        <select onchange="sheets[${i}].size=this.value">
          ${sizeOptions}
        </select>
      </div>

      <div>
        <select onchange="sheets[${i}].thick=parseInt(this.value)">
          ${thickOptions}
        </select>
      </div>

      <div>
        <input type="number" min="1" value="${s.qty}" oninput="sheets[${i}].qty=parseInt(this.value||1)" />
      </div>

      <div>
        <button class="btn-red" onclick="removeSheet(${i})">حذف</button>
      </div>
    `;
    box.appendChild(row);
  });
}

// ===============================
// أمر تشغيل CNC (يروح للأدمن)
// ===============================
function buildOrderText(){
  const client = getClientName();
  const orderType = (document.getElementById("orderType")?.value || "").trim();
  const cutDetails = (document.getElementById("cutDetails")?.value || "").trim();
  const notes = (document.getElementById("notes")?.value || "").trim();

  const fileInput = document.getElementById("fileUpload");
  const fileName = fileInput?.files?.[0]?.name || "لا يوجد";

  let text = "";
  text += "📌 أمر تشغيل CNC\n";
  text += "--------------------------------\n";
  text += `العميل: ${client}\n`;
  text += `نوع الطلب: ${orderType || "غير محدد"}\n`;
  text += `رقم الطلب: ${genOrderId()}\n`;
  text += `التاريخ: ${nowString()}\n`;
  text += "--------------------------------\n";

  text += "📏 القياسات (سم):\n";
  measures.forEach((m, idx)=>{
    const h = m.height || "-";
    const w = m.width || "-";
    const q = m.qty || 1;
    const d = m.dir.includes("يمين") ? "يمين" : "يسار";
    const arrow = dirArrow(m.dir);
    text += `${idx+1}) ${h} × ${w} | العدد: ${q} | الفتحة: ${d} ${arrow}\n`;
  });

  text += "--------------------------------\n";
  text += "🧾 الشيتات المطلوبة:\n";
  sheets.forEach((s, idx)=>{
    text += `${idx+1}) قياس: ${s.size} | سماكة: ${s.thick}mm | كمية: ${s.qty}\n`;
  });

  text += "--------------------------------\n";
  text += "✂️ تفاصيل القص/الحفر:\n";
  text += (cutDetails || "لا يوجد") + "\n";

  text += "--------------------------------\n";
  text += "📎 الملف:\n";
  text += fileName + "\n";

  text += "--------------------------------\n";
  text += "📝 ملاحظات:\n";
  text += (notes || "لا يوجد") + "\n";
  text += "--------------------------------\n";
  text += "✅ يرجى التأكيد قبل التنفيذ.\n";

  return text;
}

function sendToAdmin(){
  const client = getClientName();
  const txt = buildOrderText();

  // حفظ آخر طلب للعميل
  localStorage.setItem("pd_last_order_text_"+client, txt);

  // حفظه في قائمة طلبات الأدمن
  const all = JSON.parse(localStorage.getItem("pd_admin_orders") || "[]");
  all.unshift({
    client,
    text: txt,
    createdAt: Date.now()
  });
  localStorage.setItem("pd_admin_orders", JSON.stringify(all));

  const preview = document.getElementById("orderPreview");
  if(preview) preview.innerText = txt;

  alert("تم إرسال أمر التشغيل للأدمن ✅");
}

function copyText(){
  const preview = document.getElementById("orderPreview");
  if(!preview) return;
  navigator.clipboard.writeText(preview.innerText);
  alert("تم نسخ أمر التشغيل ✅");
}

// ===============================
// PDF للشيتات (بـ window.print)
// ===============================
function downloadSheetPDF(){
  const client = getClientName();

  let html = `
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8">
    <title>طلب شيت - ${client}</title>
    <style>
      body{font-family:Arial; padding:24px}
      h2{margin:0 0 10px 0}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #000;padding:8px;text-align:center}
      th{background:#f1f1f1}
      .small{color:#444;margin-top:8px}
    </style>
  </head>
  <body>
    <h2>طلب شيت (Pro Design)</h2>
    <div><b>اسم العميل:</b> ${client}</div>
    <div class="small"><b>التاريخ:</b> ${nowString()}</div>

    <table>
      <thead>
        <tr>
          <th>م</th>
          <th>قياس الشيت</th>
          <th>السماكة (mm)</th>
          <th>الكمية</th>
        </tr>
      </thead>
      <tbody>
        ${sheets.map((s,i)=>`
          <tr>
            <td>${i+1}</td>
            <td>${s.size}</td>
            <td>${s.thick}</td>
            <td>${s.qty}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

// ===============================
// الأدمن: عرض الطلبات
// ===============================
function renderOrders(){
  const box = document.getElementById("ordersList");
  if(!box) return;

  const all = JSON.parse(localStorage.getItem("pd_admin_orders") || "[]");
  if(all.length === 0){
    box.innerText = "لا يوجد طلبات حالياً.";
    return;
  }

  let out = "";
  all.forEach((o, i)=>{
    out += `#${i+1}\n`;
    out += `العميل: ${o.client}\n`;
    out += `----------------------------\n`;
    out += o.text + "\n";
    out += `============================\n\n`;
  });

  box.innerText = out;
}

function fillClientsSelect(){
  const sel = document.getElementById("adminClientSelect");
  if(!sel) return;

  const all = JSON.parse(localStorage.getItem("pd_admin_orders") || "[]");
  const uniqueClients = [...new Set(all.map(x=>x.client))];

  sel.innerHTML = "";
  if(uniqueClients.length === 0){
    sel.innerHTML = `<option value="">لا يوجد عملاء</option>`;
    return;
  }

  uniqueClients.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c;
    opt.innerText = c;
    sel.appendChild(opt);
  });
}

function loadAdminClient(){
  const sel = document.getElementById("adminClientSelect");
  if(!sel || !sel.value) return;

  const client = sel.value;

  // تحميل الحالة
  const st = localStorage.getItem("pd_status_"+client) || "قيد التشغيل";
  const stSel = document.getElementById("adminStatus");
  if(stSel) stSel.value = st;

  // تحميل آخر فاتورة
  const inv = localStorage.getItem("pd_invoice_"+client);
  const box = document.getElementById("invoicePreview");
  if(box) box.innerText = inv ? inv : "لا توجد فاتورة.";
}

function saveStatus(){
  const sel = document.getElementById("adminClientSelect");
  const stSel = document.getElementById("adminStatus");
  if(!sel || !sel.value) return alert("اختر عميل");
  const client = sel.value;
  const st = stSel.value;

  localStorage.setItem("pd_status_"+client, st);
  alert("تم حفظ الحالة ✅");
}

// ===============================
// فاتورة (نص + PDF)
// ===============================
function createInvoice(){
  const sel = document.getElementById("adminClientSelect");
  if(!sel || !sel.value) return alert("اختر عميل");

  const client = sel.value;

  const cut = parseFloat(document.getElementById("priceCut").value || 0);
  const engrave = parseFloat(document.getElementById("priceEngrave").value || 0);
  const material = parseFloat(document.getElementById("priceMaterial").value || 0);
  const disc = parseFloat(document.getElementById("discount").value || 0);

  const totalBefore = cut + engrave + material;
  const totalFinal = Math.max(0, totalBefore - disc);

  const orderType = "حسب الطلب";
  const orderId = genOrderId();

  let txt = "";
  txt += "🧾 فاتورة Pro Design\n";
  txt += "--------------------------------\n";
  txt += `العميل: ${client}\n`;
  txt += `نوع الطلب: ${orderType}\n`;
  txt += `رقم الطلب: ${orderId}\n`;
  txt += `التاريخ: ${nowString()}\n`;
  txt += "--------------------------------\n";
  txt += `سعر القص: KD ${cut.toFixed(3)}\n`;
  txt += `سعر الحفر: KD ${engrave.toFixed(3)}\n`;
  txt += `سعر المادة/الشيت: KD ${material.toFixed(3)}\n`;
  txt += "--------------------------------\n";
  txt += `الإجمالي قبل الخصم: KD ${totalBefore.toFixed(3)}\n`;
  txt += `الخصم: KD ${disc.toFixed(3)}\n`;
  txt += `الإجمالي النهائي: KD ${totalFinal.toFixed(3)}\n`;
  txt += "--------------------------------\n";
  txt += "✅ شكراً لتعاملكم معنا.\n";

  localStorage.setItem("pd_invoice_"+client, txt);

  const box = document.getElementById("invoicePreview");
  if(box) box.innerText = txt;

  alert("تم إنشاء الفاتورة ✅");
}

function sendInvoiceToClient(){
  const sel = document.getElementById("adminClientSelect");
  if(!sel || !sel.value) return alert("اختر عميل");
  const client = sel.value;

  const inv = localStorage.getItem("pd_invoice_"+client);
  if(!inv) return alert("لا توجد فاتورة! أنشئ فاتورة أولاً.");

  localStorage.setItem("pd_invoice_sent_"+client, inv);
  alert("تم إرسال الفاتورة للعميل ✅");
}

function loadInvoiceToClient(){
  const client = getClientName();
  const inv = localStorage.getItem("pd_invoice_sent_"+client);

  const box = document.getElementById("invoiceBox");
  if(!box) return;

  box.innerText = inv ? inv : "لا توجد فاتورة حالياً.";
}

function downloadInvoicePDF(){
  const client = getClientName();
  const inv = localStorage.getItem("pd_invoice_sent_"+client);
  if(!inv) return alert("لا توجد فاتورة لتحميلها");

  const html = `
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8">
    <title>فاتورة - ${client}</title>
    <style>
      body{font-family:Arial;padding:24px}
      pre{white-space:pre-wrap;font-size:16px}
    </style>
  </head>
  <body>
    <pre>${inv}</pre>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}

function downloadAdminInvoicePDF(){
  const sel = document.getElementById("adminClientSelect");
  if(!sel || !sel.value) return alert("اختر عميل");
  const client = sel.value;

  const inv = localStorage.getItem("pd_invoice_"+client);
  if(!inv) return alert("لا توجد فاتورة");

  const html = `
  <html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8">
    <title>فاتورة - ${client}</title>
    <style>
      body{font-family:Arial;padding:24px}
      pre{white-space:pre-wrap;font-size:16px}
    </style>
  </head>
  <body>
    <pre>${inv}</pre>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
}
