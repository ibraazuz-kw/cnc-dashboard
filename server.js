/**
 * Pro Design CNC Orders Server (FULL) - Single file server.js
 * By ChatGPT
 * Run:
 *   node server.js
 * Open:
 *   http://127.0.0.1:3000/client.html
 *   http://127.0.0.1:3000/admin-login.html
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const crypto = require("crypto");

const PORT = 3000;

const DATA_DIR = path.join(__dirname, "data");
const UPLOADS_DIR = path.join(__dirname, "public", "uploads");
const PUBLIC_DIR = path.join(__dirname, "public");

const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const FACTORY_WHATSAPP = "96596765547"; // المصنع
const DESIGNER_WHATSAPP = "96594016181"; // المصمم

// ============ Helpers ============
function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf8");
  if (!fs.existsSync(USERS_FILE)) {
    const initial = [
      {
        username: "prodesign",
        password: "1234",
        role: "superadmin",
        company: "Pro Design",
      },
      // أمثلة عملاء (تقدر تضيف من الادمن)
      {
        username: "alsayf",
        password: "1111",
        role: "clientadmin",
        company: "شركة السيف",
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
}

function send(res, status, body, contentType = "text/html; charset=utf-8") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(body);
}

function sendJSON(res, status, obj) {
  send(res, status, JSON.stringify(obj), "application/json; charset=utf-8");
}

function notFound(res) {
  send(res, 404, "404 Not Found");
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        const ct = req.headers["content-type"] || "";
        if (ct.includes("application/json")) {
          resolve(JSON.parse(data || "{}"));
        } else {
          // x-www-form-urlencoded
          const out = {};
          (data || "").split("&").forEach((pair) => {
            if (!pair) return;
            const [k, v] = pair.split("=");
            out[decodeURIComponent(k)] = decodeURIComponent(v || "");
          });
          resolve(out);
        }
      } catch {
        resolve({});
      }
    });
  });
}

function makeId() {
  return String(Date.now());
}

function sha256(s) {
  return crypto.createHash("sha256").update(String(s)).digest("hex");
}

// Cookies session (simple)
const SESSIONS = {}; // sid -> {username, role, company}

function getCookie(req, name) {
  const cookie = req.headers.cookie || "";
  const parts = cookie.split(";").map((x) => x.trim());
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === name) return v;
  }
  return null;
}

function setCookie(res, name, value) {
  res.setHeader("Set-Cookie", `${name}=${value}; Path=/; HttpOnly`);
}

function authUser(req) {
  const sid = getCookie(req, "sid");
  if (!sid) return null;
  return SESSIONS[sid] || null;
}

// ============ HTML Templates ============
function baseHTML(title, body, extraHead = "") {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${title}</title>
${extraHead}
<style>
  :root{
    --bg:#f5f7fb;
    --card:#ffffff;
    --text:#111827;
    --muted:#6b7280;
    --border:#e5e7eb;
    --shadow: 0 10px 30px rgba(0,0,0,.06);
    --radius: 18px;
    --blue:#2563eb;
    --green:#16a34a;
    --purple:#7c3aed;
    --orange:#f97316;
    --red:#ef4444;
    --black:#111827;
  }
  *{box-sizing:border-box}
  body{
    margin:0;
    font-family: system-ui, -apple-system, "Segoe UI", Tahoma, Arial;
    background:var(--bg);
    color:var(--text);
  }
  .wrap{max-width:980px;margin:0 auto;padding:18px}
  .card{
    background:var(--card);
    border:1px solid var(--border);
    box-shadow:var(--shadow);
    border-radius:var(--radius);
    padding:18px;
    margin:14px 0;
  }
  .header{
    display:flex;align-items:center;justify-content:space-between;gap:12px;
  }
  .brand{
    display:flex;align-items:center;gap:12px;
  }
  .brand h1{
    margin:0;font-size:28px;letter-spacing:.2px;
  }
  .brand p{margin:0;color:var(--muted);font-size:14px}
  .logo{
    width:64px;height:64px;border-radius:16px;
    border:1px solid var(--border);
    object-fit:cover;background:#fff;
  }

  h2{margin:0 0 12px 0;font-size:20px}
  label{display:block;margin:10px 0 6px;color:var(--muted);font-size:13px}
  input,select,textarea{
    width:100%;
    padding:12px 12px;
    border-radius:14px;
    border:1px solid var(--border);
    background:#fff;
    outline:none;
    font-size:15px;
  }
  textarea{min-height:90px;resize:vertical}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  @media(max-width:820px){
    .grid2,.grid3{grid-template-columns:1fr}
    .header{flex-direction:column;align-items:flex-start}
  }
  .btnRow{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
  .btn{
    border:none;cursor:pointer;
    padding:14px 16px;border-radius:16px;
    color:#fff;font-weight:700;font-size:15px;
    min-width:160px;
  }
  .btn.blue{background:var(--blue)}
  .btn.green{background:var(--green)}
  .btn.purple{background:var(--purple)}
  .btn.orange{background:var(--orange)}
  .btn.red{background:var(--red)}
  .btn.black{background:var(--black)}
  .btn:active{transform:scale(.99)}
  .hint{color:var(--muted);font-size:13px;margin-top:6px}
  .hr{height:1px;background:var(--border);margin:16px 0}

  .pill{
    display:inline-flex;align-items:center;gap:8px;
    padding:10px 12px;border-radius:999px;
    border:1px solid var(--border);background:#fff;
    color:var(--text);font-weight:600;font-size:14px;
  }

  .table{
    width:100%;
    border-collapse:collapse;
    overflow:hidden;border-radius:14px;border:1px solid var(--border);
  }
  .table th,.table td{
    padding:10px;border-bottom:1px solid var(--border);
    text-align:center;font-size:14px;
  }
  .table th{background:#f3f4f6}
  .badge{
    display:inline-block;padding:6px 10px;border-radius:999px;
    background:#eef2ff;color:#3730a3;font-weight:700;font-size:12px;
  }

  .miniBtn{
    border:1px solid var(--border);
    background:#fff;border-radius:12px;
    padding:10px 12px;font-weight:800;cursor:pointer;
  }
  .miniBtn.primary{background:#111827;color:#fff;border-color:#111827}

  .accordion{
    border:1px solid var(--border);
    border-radius:16px;
    overflow:hidden;
    background:#fff;
  }
  .accHead{
    display:flex;align-items:center;justify-content:space-between;
    padding:12px 14px;cursor:pointer;
    font-weight:800;
    background:#fafafa;
  }
  .accBody{padding:12px 14px;display:none}
  .accBody.show{display:block}

  canvas{
    width:100%;
    max-width:520px;
    height:auto;
    border:1px solid var(--border);
    border-radius:16px;
    background:#fff;
  }
</style>
</head>
<body>
<div class="wrap">
${body}
</div>
</body>
</html>`;
}

function headerBlock() {
  return `
<div class="card">
  <div class="header">
    <div class="brand">
      <div>
        <h1>Pro Design</h1>
        <p>إرسال أمر تشغيل CNC + تفاصيل الشيت</p>
      </div>
    </div>
    <img class="logo" src="/logo.jpg" onerror="this.style.display='none'" />
  </div>
</div>`;
}

// ============ CLIENT PAGE ============
function clientHTML() {
  return baseHTML(
    "Pro Design | أمر تشغيل CNC",
    `
${headerBlock()}

<div class="card">
  <h2>📌 بيانات العميل</h2>
  <div class="grid2">
    <div>
      <label>اسم العميل / الشركة</label>
      <input id="company" placeholder="مثال: شركة السيف" />
    </div>
    <div>
      <label>رقم الهاتف</label>
      <input id="phone" inputmode="numeric" placeholder="مثال: 94016181" />
    </div>
  </div>

  <div class="grid2">
    <div>
      <label>العملية</label>
      <select id="jobType">
        <option value="حفر">حفر</option>
        <option value="قص">قص</option>
        <option value="قص + حفر">قص + حفر</option>
      </select>
    </div>
    <div>
      <label>نوع المادة</label>
      <select id="materialType">
        <option value="الألمنيوم">الألمنيوم</option>
        <option value="ستانلس">ستانلس</option>
        <option value="حديد">حديد</option>
        <option value="الوكوبوند">الوكوبوند</option>
      </select>
    </div>
  </div>

  <div class="grid2">
    <div>
      <label>اتجاه فتحة الباب</label>
      <select id="doorOpenDirection">
        <option value="يمين">يمين</option>
        <option value="يسار">يسار</option>
      </select>
    </div>
    <div>
      <label>عرض الخط (mm)</label>
      <select id="lineWidth">
        <option value="4mm">4mm</option>
        <option value="6mm">6mm</option>
        <option value="10mm">10mm</option>
        <option value="20mm">20mm</option>
      </select>
    </div>
  </div>

  <label>قياسات الطلب (يكتبها العميل)</label>
  <textarea id="orderMeasurements" placeholder="مثال: 70x50 فيكس / 100x200 درفه / ..."></textarea>
  <div class="hint">💡 الأفضل تكتب القياسات هنا + تحت المخطط راح تنطبع أيضاً.</div>

  <div class="hr"></div>

  <h2>📦 تفاصيل الشيتات (أكثر من قياس + سماكة + كمية)</h2>
  <div id="sheetsWrap"></div>

  <div class="btnRow">
    <button class="btn black" onclick="addSheetRow()">➕ إضافة شيت</button>
    <button class="btn red" onclick="clearSheets()">🗑️ مسح الشيتات</button>
  </div>

  <div class="hr"></div>

  <h2>🧩 مخطط الباب (رسم بياني)</h2>
  <div class="grid2">
    <div>
      <label>عرض الباب (سم)</label>
      <input id="doorW" type="number" value="100" />
      <label>ارتفاع الباب (سم)</label>
      <input id="doorH" type="number" value="220" />
      <div class="hint">الرسم يتغير حسب العرض والارتفاع</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:center">
      <canvas id="doorCanvas" width="520" height="700"></canvas>
    </div>
  </div>

  <div class="accordion" style="margin-top:12px">
    <div class="accHead" onclick="toggleAcc('glassAcc')">
      <span>➕ الجام (اختياري)</span>
      <span class="badge" id="glassBadge">مغلق</span>
    </div>
    <div class="accBody" id="glassAcc">
      <div class="grid2">
        <div>
          <label>تفعيل الجام</label>
          <select id="hasGlass" onchange="drawDoor()">
            <option value="لا">لا</option>
            <option value="نعم">نعم</option>
          </select>
        </div>
        <div>
          <label>المرجع الجانبي للجام</label>
          <select id="glassSideRef" onchange="drawDoor()">
            <option value="طرف القفل">طرف القفل</option>
            <option value="طرف المفصلات">طرف المفصلات</option>
          </select>
        </div>
      </div>

      <div class="grid2">
        <div>
          <label>عرض الجام (سم)</label>
          <input id="glassW" type="number" value="20" oninput="drawDoor()" />
        </div>
        <div>
          <label>ارتفاع الجام (سم)</label>
          <input id="glassH" type="number" value="60" oninput="drawDoor()" />
        </div>
      </div>

      <div class="grid3">
        <div>
          <label>بعد الجام من فوق (سم)</label>
          <input id="glassTop" type="number" value="15" oninput="drawDoor()" />
        </div>
        <div>
          <label>بعد الجام من تحت (سم)</label>
          <input id="glassBottom" type="number" value="15" oninput="drawDoor()" />
        </div>
        <div>
          <label>بعد الجام عن الطرف المختار (سم)</label>
          <input id="glassSideGap" type="number" value="10" oninput="drawDoor()" />
        </div>
      </div>
    </div>
  </div>

  <div class="accordion" style="margin-top:12px">
    <div class="accHead" onclick="toggleAcc('handleAcc')">
      <span>➕ المسكة المخفية (اختياري)</span>
      <span class="badge" id="handleBadge">مغلق</span>
    </div>
    <div class="accBody" id="handleAcc">
      <div class="grid2">
        <div>
          <label>نوع المسكة</label>
          <select id="handleType" onchange="drawDoor()">
            <option value="لا يوجد">لا يوجد</option>
            <option value="مخفية">مخفية</option>
          </select>
        </div>
        <div>
          <label>جهة المسكة</label>
          <select id="handleSideRef" onchange="drawDoor()">
            <option value="طرف القفل">طرف القفل</option>
            <option value="طرف المفصلات">طرف المفصلات</option>
          </select>
        </div>
      </div>

      <div class="grid2">
        <div>
          <label>طول المسكة (سم)</label>
          <input id="handleLen" type="number" value="200" oninput="drawDoor()" />
        </div>
        <div>
          <label>عرض المسكة (سم)</label>
          <input id="handleW" type="number" value="10" oninput="drawDoor()" />
        </div>
      </div>

      <div class="grid2">
        <div>
          <label>بعد المسكة من فوق (سم)</label>
          <input id="handleTop" type="number" value="20" oninput="drawDoor()" />
        </div>
        <div>
          <label>بعد المسكة عن الطرف المختار (سم)</label>
          <input id="handleSideGap" type="number" value="20" oninput="drawDoor()" />
        </div>
      </div>
    </div>
  </div>

  <div class="hr"></div>

  <label>ملف / صورة (اختياري)</label>
  <input id="file" type="file" />

  <label>ملاحظات (اختياري)</label>
  <input id="notes" placeholder="أي ملاحظة..." />

  <div class="btnRow">
    <button class="btn blue" onclick="submitOrder()">🚀 إرسال أمر التشغيل</button>
  </div>
  <div class="hint" id="resultHint"></div>
</div>

<script>
  const sheetsWrap = document.getElementById("sheetsWrap");

  function toggleAcc(id){
    const el = document.getElementById(id);
    el.classList.toggle("show");
    const badge = document.getElementById(id === "glassAcc" ? "glassBadge" : "handleBadge");
    badge.textContent = el.classList.contains("show") ? "مفتوح" : "مغلق";
  }

  function sheetRowTemplate(size="", thickness="3mm", qty="1"){
    return \`
      <div class="grid3" style="margin-bottom:10px">
        <div>
          <label>القياس</label>
          <select class="sheetSize">
            <option value="122x244">122x244</option>
            <option value="150x300">150x300</option>
            <option value="122x300">122x300</option>
            <option value="100x200">100x200</option>
            <option value="150x400">150x400</option>
            <option value="Custom">مخصص</option>
          </select>
          <input class="sheetCustom" placeholder="إذا مخصص اكتب القياس هنا" style="margin-top:8px;display:none" />
        </div>
        <div>
          <label>السماكة</label>
          <select class="sheetThk">
            <option value="2mm">2mm</option>
            <option value="3mm">3mm</option>
            <option value="4mm">4mm</option>
            <option value="6mm">6mm</option>
          </select>
        </div>
        <div>
          <label>الكمية</label>
          <input class="sheetQty" type="number" value="\${qty}" min="1" />
        </div>
      </div>
    \`;
  }

  function addSheetRow(){
    const div = document.createElement("div");
    div.innerHTML = sheetRowTemplate();
    sheetsWrap.appendChild(div);

    const sizeSel = div.querySelector(".sheetSize");
    const custom = div.querySelector(".sheetCustom");

    sizeSel.addEventListener("change", () => {
      if(sizeSel.value === "Custom"){
        custom.style.display = "block";
      }else{
        custom.style.display = "none";
        custom.value = "";
      }
    });
  }

  function clearSheets(){
    sheetsWrap.innerHTML = "";
    addSheetRow();
  }

  function collectSheets(){
    const rows = Array.from(sheetsWrap.querySelectorAll("div"));
    const out = [];
    rows.forEach(r => {
      const sizeSel = r.querySelector(".sheetSize");
      const custom = r.querySelector(".sheetCustom");
      const thk = r.querySelector(".sheetThk");
      const qty = r.querySelector(".sheetQty");

      if(!sizeSel || !thk || !qty) return;

      let size = sizeSel.value;
      if(size === "Custom") size = (custom.value || "").trim();

      if(!size) return;

      out.push({
        size,
        thickness: thk.value,
        qty: String(qty.value || "1")
      });
    });
    return out;
  }

  async function submitOrder(){
    const company = document.getElementById("company").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const orderMeasurements = document.getElementById("orderMeasurements").value.trim();
    const jobType = document.getElementById("jobType").value;
    const materialType = document.getElementById("materialType").value;
    const doorOpenDirection = document.getElementById("doorOpenDirection").value;
    const lineWidth = document.getElementById("lineWidth").value;
    const notes = document.getElementById("notes").value.trim();

    const sheets = collectSheets();

    // Door Diagram Inputs
    const doorW = Number(document.getElementById("doorW").value || 100);
    const doorH = Number(document.getElementById("doorH").value || 220);

    const hasGlass = document.getElementById("hasGlass").value;
    const glassSideRef = document.getElementById("glassSideRef").value;
    const glassW = Number(document.getElementById("glassW").value || 0);
    const glassH = Number(document.getElementById("glassH").value || 0);
    const glassTop = Number(document.getElementById("glassTop").value || 0);
    const glassBottom = Number(document.getElementById("glassBottom").value || 0);
    const glassSideGap = Number(document.getElementById("glassSideGap").value || 0);

    const handleType = document.getElementById("handleType").value;
    const handleSideRef = document.getElementById("handleSideRef").value;
    const handleLen = Number(document.getElementById("handleLen").value || 0);
    const handleW = Number(document.getElementById("handleW").value || 0);
    const handleTop = Number(document.getElementById("handleTop").value || 0);
    const handleSideGap = Number(document.getElementById("handleSideGap").value || 0);

    const fileInput = document.getElementById("file");
    let fileData = null;

    if(fileInput.files && fileInput.files[0]){
      const f = fileInput.files[0];
      const buf = await f.arrayBuffer();
      fileData = {
        name: f.name,
        type: f.type,
        data: Array.from(new Uint8Array(buf))
      };
    }

    const payload = {
      company,
      phone,
      orderMeasurements,
      jobType,
      materialType,
      doorOpenDirection,
      lineWidth,
      notes,
      sheets,
      diagram: {
        doorW, doorH,
        hasGlass, glassSideRef, glassW, glassH, glassTop, glassBottom, glassSideGap,
        handleType, handleSideRef, handleLen, handleW, handleTop, handleSideGap
      },
      fileData
    };

    const res = await fetch("/api/orders", {
      method:"POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    const hint = document.getElementById("resultHint");

    if(!data.ok){
      hint.textContent = "❌ خطأ: " + (data.error || "غير معروف");
      return;
    }

    // ✅ لا يودّي لصفحة ثانية
    hint.innerHTML = "✅ تم الإرسال | رقم الطلب: <b>" + data.id + "</b><br>تقدر تفتح تفاصيل الطلب من الادمن.";

    // Reset file only
    fileInput.value = "";
  }

  function drawDoor(){
    const canvas = document.getElementById("doorCanvas");
    const ctx = canvas.getContext("2d");

    const doorW = Number(document.getElementById("doorW").value || 100);
    const doorH = Number(document.getElementById("doorH").value || 220);

    // scale to fit canvas
    const pad = 40;
    const maxW = canvas.width - pad*2;
    const maxH = canvas.height - pad*2;
    const scale = Math.min(maxW/doorW, maxH/doorH);

    const x0 = (canvas.width - doorW*scale)/2;
    const y0 = (canvas.height - doorH*scale)/2;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Door outline
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#111827";
    ctx.strokeRect(x0, y0, doorW*scale, doorH*scale);

    // Text
    ctx.fillStyle = "#111827";
    ctx.font = "16px Arial";
    ctx.fillText("عرض: " + doorW + " سم", 20, 28);
    ctx.fillText("ارتفاع: " + doorH + " سم", 20, 52);

    // Glass
    const hasGlass = document.getElementById("hasGlass").value;
    if(hasGlass === "نعم"){
      const glassW = Number(document.getElementById("glassW").value || 0);
      const glassH = Number(document.getElementById("glassH").value || 0);
      const glassTop = Number(document.getElementById("glassTop").value || 0);
      const glassSideGap = Number(document.getElementById("glassSideGap").value || 0);
      const glassSideRef = document.getElementById("glassSideRef").value;

      const gx = glassSideRef === "طرف القفل"
        ? x0 + (doorW - glassSideGap - glassW)*scale
        : x0 + (glassSideGap)*scale;

      const gy = y0 + (glassTop)*scale;

      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, glassW*scale, glassH*scale);
      ctx.fillStyle = "rgba(37,99,235,0.12)";
      ctx.fillRect(gx, gy, glassW*scale, glassH*scale);

      ctx.fillStyle = "#2563eb";
      ctx.font = "14px Arial";
      ctx.fillText("جام", gx+6, gy+18);
    }

    // Handle
    const handleType = document.getElementById("handleType").value;
    if(handleType === "مخفية"){
      const handleLen = Number(document.getElementById("handleLen").value || 0);
      const handleW = Number(document.getElementById("handleW").value || 0);
      const handleTop = Number(document.getElementById("handleTop").value || 0);
      const handleSideGap = Number(document.getElementById("handleSideGap").value || 0);
      const handleSideRef = document.getElementById("handleSideRef").value;

      const hx = handleSideRef === "طرف القفل"
        ? x0 + (doorW - handleSideGap - handleW)*scale
        : x0 + (handleSideGap)*scale;

      const hy = y0 + handleTop*scale;

      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 2;
      ctx.strokeRect(hx, hy, handleW*scale, handleLen*scale);
      ctx.fillStyle = "rgba(249,115,22,0.12)";
      ctx.fillRect(hx, hy, handleW*scale, handleLen*scale);

      ctx.fillStyle = "#f97316";
      ctx.font = "14px Arial";
      ctx.fillText("مسكة", hx+6, hy+18);
    }
  }

  // init
  clearSheets();
  drawDoor();

  // redraw on key changes
  ["doorW","doorH","hasGlass","glassSideRef","glassW","glassH","glassTop","glassBottom","glassSideGap",
   "handleType","handleSideRef","handleLen","handleW","handleTop","handleSideGap"
  ].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener("input", drawDoor);
    if(el) el.addEventListener("change", drawDoor);
  });
</script>
`,
    `<link rel="icon" href="/logo.jpg" />`
  );
}

// ============ ADMIN LOGIN ============
function adminLoginHTML(msg = "") {
  return baseHTML(
    "Admin Login | Pro Design",
    `
${headerBlock()}
<div class="card">
  <h2>🛠️ دخول الأدمن (Pro Design)</h2>

  <label>Username</label>
  <input id="u" value="prodesign" />

  <label>Password</label>
  <input id="p" type="password" placeholder="Admin Pass" />

  <div class="btnRow">
    <button class="btn black" onclick="login()">دخول</button>
  </div>

  <div class="hint" style="color:#ef4444">${msg || ""}</div>

  <div class="hr"></div>
  <a href="/client.html">رجوع لصفحة العملاء</a>
</div>

<script>
async function login(){
  const username = document.getElementById("u").value.trim();
  const password = document.getElementById("p").value.trim();
  const res = await fetch("/api/login", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({username,password})
  });
  const data = await res.json();
  if(!data.ok){
    alert("خطأ في الدخول");
    return;
  }
  location.href="/admin.html";
}
</script>
`
  );
}

// ============ ADMIN PAGE ============
function adminHTML(user) {
  return baseHTML(
    "Admin | Pro Design",
    `
${headerBlock()}

<div class="card">
  <h2>🏢 لوحة استقبال الطلبات</h2>
  <div class="hint">مرحبا: <b>${user.company}</b> | صلاحية: <b>${user.role}</b></div>

  <div class="btnRow">
    <button class="btn blue" onclick="loadOrders()">🔄 تحديث</button>
    <button class="btn red" onclick="clearAll()">🗑️ مسح الكل</button>
    <button class="btn black" onclick="logout()">🚪 خروج</button>
  </div>

  <div class="hr"></div>

  <h2>👥 إدارة العملاء (أدمن لكل عميل)</h2>
  <div class="hint">أنت تسوي الحسابات للعميل، والعميل ما يقدر يغير الباسورد إلا عن طريقك.</div>

  <div class="grid3">
    <div>
      <label>اسم الشركة</label>
      <input id="newCompany" placeholder="مثال: شركة الهاجري" />
    </div>
    <div>
      <label>Username</label>
      <input id="newUser" placeholder="hajri" />
    </div>
    <div>
      <label>Password (ثابت)</label>
      <input id="newPass" placeholder="12345" />
    </div>
  </div>
  <div class="btnRow">
    <button class="btn green" onclick="addClient()">➕ إضافة عميل</button>
  </div>

  <div class="hr"></div>
  <div id="ordersBox"></div>
</div>

<script>
async function logout(){
  await fetch("/api/logout");
  location.href="/admin-login.html";
}

async function addClient(){
  const company = document.getElementById("newCompany").value.trim();
  const username = document.getElementById("newUser").value.trim();
  const password = document.getElementById("newPass").value.trim();
  if(!company || !username || !password){
    alert("اكتب كل البيانات");
    return;
  }
  const res = await fetch("/api/users", {
    method:"POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({company,username,password})
  });
  const data = await res.json();
  if(!data.ok){
    alert("خطأ: " + (data.error || ""));
    return;
  }
  alert("تم إضافة عميل ✔️");
  document.getElementById("newCompany").value="";
  document.getElementById("newUser").value="";
  document.getElementById("newPass").value="";
}

async function clearAll(){
  if(!confirm("متأكد تمسح كل الطلبات؟")) return;
  const res = await fetch("/api/orders/clear", {method:"POST"});
  const data = await res.json();
  if(data.ok) loadOrders();
}

function escapeHtml(s){
  return (s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

async function loadOrders(){
  const box = document.getElementById("ordersBox");
  box.innerHTML = "<div class='hint'>جاري التحميل...</div>";
  const res = await fetch("/api/orders");
  const data = await res.json();
  if(!data.ok){
    box.innerHTML = "<div class='hint' style='color:#ef4444'>صار خطأ بتحميل الطلبات</div>";
    return;
  }

  if(!data.orders.length){
    box.innerHTML = "<div class='hint'>لا يوجد طلبات</div>";
    return;
  }

  box.innerHTML = data.orders.map(o=>{
    const sheetsRows = (o.sheets||[]).map(s=>\`
      <tr>
        <td>\${escapeHtml(s.size)}</td>
        <td>\${escapeHtml(s.thickness)}</td>
        <td>\${escapeHtml(s.qty)}</td>
      </tr>
    \`).join("");

    const fileBlock = o.file && o.file.url
      ? \`<a href="\${o.file.url}" target="_blank">\${escapeHtml(o.file.originalName || "ملف")}</a>\`
      : "لا يوجد";

    return \`
      <div class="card" style="border:2px solid #e5e7eb">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <div>
            <div class="pill">رقم الطلب: <b>#\${o.id}</b></div>
            <div class="hint">\${new Date(o.createdAt).toLocaleString()}</div>
          </div>
          <div class="btnRow">
            <button class="btn green" onclick="waFactory('\${o.id}')">📱 واتساب المصنع</button>
            <button class="btn purple" onclick="waDesigner('\${o.id}')">🎨 إرسال للمصمم</button>
            <button class="btn black" onclick="openInvoice('\${o.id}')">🧾 فاتورة PDF</button>
            <button class="btn orange" onclick="openSheetPdf('\${o.id}')">📦 طلب شيت PDF</button>
          </div>
        </div>

        <div class="hr"></div>

        <div class="grid2">
          <div><b>اسم العميل:</b> \${escapeHtml(o.company || "-")}</div>
          <div><b>الهاتف:</b> \${escapeHtml(o.phone || "-")}</div>
        </div>

        <div class="grid2" style="margin-top:8px">
          <div><b>العملية:</b> \${escapeHtml(o.jobType || "-")}</div>
          <div><b>نوع المادة:</b> \${escapeHtml(o.materialType || "-")}</div>
        </div>

        <div class="grid2" style="margin-top:8px">
          <div><b>اتجاه الفتحة:</b> \${escapeHtml(o.doorOpenDirection || "-")}</div>
          <div><b>عرض الخط:</b> \${escapeHtml(o.lineWidth || "-")}</div>
        </div>

        <div style="margin-top:10px">
          <b>قياسات الطلب:</b>
          <div class="card" style="margin:8px 0;padding:12px;background:#fafafa">
            \${escapeHtml(o.orderMeasurements || "-")}
          </div>
        </div>

        <div style="margin-top:10px">
          <b>تفاصيل الشيتات:</b>
          <table class="table" style="margin-top:8px">
            <thead>
              <tr><th>القياس</th><th>السماكة</th><th>الكمية</th></tr>
            </thead>
            <tbody>
              \${sheetsRows || "<tr><td colspan='3'>لا يوجد</td></tr>"}
            </tbody>
          </table>
        </div>

        <div style="margin-top:10px">
          <b>ملاحظات:</b> \${escapeHtml(o.notes || "لا يوجد")}
        </div>

        <div style="margin-top:10px">
          <b>ملف:</b> \${fileBlock}
        </div>

        <div class="hr"></div>
        <a href="/order.html?id=\${o.id}">فتح صفحة تفاصيل الطلب</a>
      </div>
    \`;
  }).join("");
}

async function waFactory(id){
  // إرسال PDF رابط (أفضل من نص طويل)
  const link = location.origin + "/pdf/invoice?id=" + id;
  const text = encodeURIComponent("طلب CNC جديد - Pro Design\\nرقم الطلب: " + id + "\\nPDF: " + link);
  window.open("https://wa.me/${FACTORY_WHATSAPP}?text=" + text, "_blank");
}

async function waDesigner(id){
  const link = location.origin + "/order.html?id=" + id;
  const text = encodeURIComponent("تصميم جديد للمصمم 🎨\\nرقم الطلب: " + id + "\\nتفاصيل: " + link);
  window.open("https://wa.me/${DESIGNER_WHATSAPP}?text=" + text, "_blank");
}

function openInvoice(id){
  window.open("/pdf/invoice?id=" + id, "_blank");
}

function openSheetPdf(id){
  window.open("/pdf/sheet?id=" + id, "_blank");
}

loadOrders();
</script>
`
  );
}

// ============ ORDER DETAILS PAGE ============
function orderHTML(order) {
  const fileBlock =
    order.file && order.file.url
      ? `<div style="margin-top:10px"><b>ملف:</b> <a href="${order.file.url}" target="_blank">${escapeHtml(
          order.file.originalName || "ملف"
        )}</a></div>`
      : `<div style="margin-top:10px"><b>ملف:</b> لا يوجد</div>`;

  const imgBlock =
    order.file && order.file.url && (order.file.url.endsWith(".jpg") || order.file.url.endsWith(".png") || order.file.url.endsWith(".jpeg"))
      ? `<div style="margin-top:12px"><img src="${order.file.url}" style="max-width:100%;border-radius:16px;border:1px solid #e5e7eb" /></div>`
      : "";

  const sheetsRows = (order.sheets || [])
    .map(
      (s) => `
      <tr>
        <td>${escapeHtml(s.size)}</td>
        <td>${escapeHtml(s.thickness)}</td>
        <td>${escapeHtml(s.qty)}</td>
      </tr>`
    )
    .join("");

  return baseHTML(
    `Order #${order.id}`,
    `
${headerBlock()}
<div class="card">
  <h2>📄 تفاصيل الطلب #${order.id}</h2>
  <div class="hint">${new Date(order.createdAt).toLocaleString()}</div>

  <div class="hr"></div>

  <div class="grid2">
    <div><b>اسم العميل:</b> ${escapeHtml(order.company || "-")}</div>
    <div><b>الهاتف:</b> ${escapeHtml(order.phone || "-")}</div>
  </div>

  <div class="grid2" style="margin-top:8px">
    <div><b>العملية:</b> ${escapeHtml(order.jobType || "-")}</div>
    <div><b>نوع المادة:</b> ${escapeHtml(order.materialType || "-")}</div>
  </div>

  <div class="grid2" style="margin-top:8px">
    <div><b>اتجاه الفتحة:</b> ${escapeHtml(order.doorOpenDirection || "-")}</div>
    <div><b>عرض الخط:</b> ${escapeHtml(order.lineWidth || "-")}</div>
  </div>

  <div class="hr"></div>

  <h2>📐 قياسات الطلب</h2>
  <div class="card" style="background:#fafafa">${escapeHtml(order.orderMeasurements || "-")}</div>

  <h2 style="margin-top:14px">📦 تفاصيل الشيتات</h2>
  <table class="table" style="margin-top:8px">
    <thead><tr><th>القياس</th><th>السماكة</th><th>الكمية</th></tr></thead>
    <tbody>
      ${sheetsRows || "<tr><td colspan='3'>لا يوجد</td></tr>"}
    </tbody>
  </table>

  <div class="hr"></div>

  <h2>🧩 مخطط الباب</h2>
  <canvas id="doorCanvas" width="520" height="700"></canvas>

  <div class="hint" style="margin-top:8px">
    عرض الباب: <b>${order.diagram?.doorW || "-"} سم</b> |
    ارتفاع الباب: <b>${order.diagram?.doorH || "-"} سم</b>
  </div>

  <div class="hr"></div>

  <div><b>ملاحظات:</b> ${escapeHtml(order.notes || "لا يوجد")}</div>
  ${fileBlock}
  ${imgBlock}

  <div class="hr"></div>

  <div class="btnRow">
    <button class="btn green" onclick="waFactory()">📱 واتساب المصنع</button>
    <button class="btn purple" onclick="waDesigner()">🎨 إرسال للمصمم</button>
    <button class="btn black" onclick="openInvoice()">🧾 فاتورة PDF</button>
    <button class="btn orange" onclick="openSheetPdf()">📦 طلب شيت PDF</button>
  </div>

  <div class="hr"></div>
  <a href="/admin.html">← رجوع للادمن</a>
</div>

<script>
  const order = ${JSON.stringify(order)};

  function waFactory(){
    const link = location.origin + "/pdf/invoice?id=" + order.id;
    const text = encodeURIComponent("طلب CNC جديد - Pro Design\\nرقم الطلب: " + order.id + "\\nPDF: " + link);
    window.open("https://wa.me/${FACTORY_WHATSAPP}?text=" + text, "_blank");
  }

  function waDesigner(){
    const link = location.href;
    const text = encodeURIComponent("تصميم جديد للمصمم 🎨\\nرقم الطلب: " + order.id + "\\nتفاصيل: " + link);
    window.open("https://wa.me/${DESIGNER_WHATSAPP}?text=" + text, "_blank");
  }

  function openInvoice(){
    window.open("/pdf/invoice?id=" + order.id, "_blank");
  }

  function openSheetPdf(){
    window.open("/pdf/sheet?id=" + order.id, "_blank");
  }

  function drawDoor(){
    const canvas = document.getElementById("doorCanvas");
    const ctx = canvas.getContext("2d");

    const doorW = Number(order.diagram?.doorW || 100);
    const doorH = Number(order.diagram?.doorH || 220);

    const pad = 40;
    const maxW = canvas.width - pad*2;
    const maxH = canvas.height - pad*2;
    const scale = Math.min(maxW/doorW, maxH/doorH);

    const x0 = (canvas.width - doorW*scale)/2;
    const y0 = (canvas.height - doorH*scale)/2;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#111827";
    ctx.strokeRect(x0, y0, doorW*scale, doorH*scale);

    // Glass
    if(order.diagram?.hasGlass === "نعم"){
      const glassW = Number(order.diagram?.glassW || 0);
      const glassH = Number(order.diagram?.glassH || 0);
      const glassTop = Number(order.diagram?.glassTop || 0);
      const glassSideGap = Number(order.diagram?.glassSideGap || 0);
      const glassSideRef = order.diagram?.glassSideRef || "طرف القفل";

      const gx = glassSideRef === "طرف القفل"
        ? x0 + (doorW - glassSideGap - glassW)*scale
        : x0 + (glassSideGap)*scale;

      const gy = y0 + (glassTop)*scale;

      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, glassW*scale, glassH*scale);
      ctx.fillStyle = "rgba(37,99,235,0.12)";
      ctx.fillRect(gx, gy, glassW*scale, glassH*scale);
    }

    // Handle
    if(order.diagram?.handleType === "مخفية"){
      const handleLen = Number(order.diagram?.handleLen || 0);
      const handleW = Number(order.diagram?.handleW || 0);
      const handleTop = Number(order.diagram?.handleTop || 0);
      const handleSideGap = Number(order.diagram?.handleSideGap || 0);
      const handleSideRef = order.diagram?.handleSideRef || "طرف القفل";

      const hx = handleSideRef === "طرف القفل"
        ? x0 + (doorW - handleSideGap - handleW)*scale
        : x0 + (handleSideGap)*scale;

      const hy = y0 + handleTop*scale;

      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 2;
      ctx.strokeRect(hx, hy, handleW*scale, handleLen*scale);
      ctx.fillStyle = "rgba(249,115,22,0.12)";
      ctx.fillRect(hx, hy, handleW*scale, handleLen*scale);
    }
  }

  drawDoor();
</script>
`
  );
}

function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// ============ PDF (Simple HTML as PDF link) ============
// ملاحظة: بدون مكتبات PDF داخل Termux صعب توليد PDF حقيقي
// الحل الأفضل: صفحة جاهزة للطباعة -> المستخدم يضغط "طباعة" ويحفظ PDF
function printableHTML(title, content) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  body{font-family:Tahoma,Arial;margin:20px}
  .box{border:1px solid #ddd;border-radius:12px;padding:16px}
  h1{margin:0 0 10px 0}
  table{width:100%;border-collapse:collapse;margin-top:10px}
  th,td{border:1px solid #ddd;padding:8px;text-align:center}
  th{background:#f5f5f5}
  .muted{color:#666;font-size:13px}
  @media print{
    button{display:none}
  }
</style>
</head>
<body>
<button onclick="window.print()">🖨️ طباعة / حفظ PDF</button>
<div class="box">
${content}
</div>
</body>
</html>`;
}

function invoicePDFPage(order) {
  const sheetsRows = (order.sheets || [])
    .map(
      (s) => `<tr><td>${escapeHtml(s.size)}</td><td>${escapeHtml(s.thickness)}</td><td>${escapeHtml(s.qty)}</td></tr>`
    )
    .join("");

  const html = `
    <h1>فاتورة (Pro Design)</h1>
    <div class="muted">رقم الطلب: #${order.id} | ${new Date(order.createdAt).toLocaleString()}</div>
    <hr/>
    <p><b>اسم العميل:</b> ${escapeHtml(order.company || "-")}</p>
    <p><b>الهاتف:</b> ${escapeHtml(order.phone || "-")}</p>
    <p><b>العملية:</b> ${escapeHtml(order.jobType || "-")}</p>
    <p><b>نوع المادة:</b> ${escapeHtml(order.materialType || "-")}</p>
    <p><b>اتجاه الفتحة:</b> ${escapeHtml(order.doorOpenDirection || "-")}</p>
    <p><b>عرض الخط:</b> ${escapeHtml(order.lineWidth || "-")}</p>
    <hr/>
    <p><b>قياسات الطلب:</b></p>
    <div class="muted">${escapeHtml(order.orderMeasurements || "-")}</div>
    <h3>تفاصيل الشيتات</h3>
    <table>
      <thead><tr><th>القياس</th><th>السماكة</th><th>الكمية</th></tr></thead>
      <tbody>${sheetsRows || "<tr><td colspan='3'>لا يوجد</td></tr>"}</tbody>
    </table>
  `;
  return printableHTML("فاتورة Pro Design", html);
}

function sheetPDFPage(order) {
  const sheetsRows = (order.sheets || [])
    .map(
      (s) => `<tr><td>${escapeHtml(s.size)}</td><td>${escapeHtml(s.thickness)}</td><td>${escapeHtml(s.qty)}</td></tr>`
    )
    .join("");

  const html = `
    <h1>طلب شيت (Pro Design)</h1>
    <div class="muted">رقم الطلب: #${order.id} | ${new Date(order.createdAt).toLocaleString()}</div>
    <hr/>
    <p><b>اسم العميل:</b> ${escapeHtml(order.company || "-")}</p>
    <p><b>نوع المادة:</b> ${escapeHtml(order.materialType || "-")}</p>
    <h3>الشيتات المطلوبة</h3>
    <table>
      <thead><tr><th>القياس</th><th>السماكة</th><th>الكمية</th></tr></thead>
      <tbody>${sheetsRows || "<tr><td colspan='3'>لا يوجد</td></tr>"}</tbody>
    </table>
  `;
  return printableHTML("طلب شيت Pro Design", html);
}

// ============ API ============
async function handleApi(req, res, pathname, query) {
  // LOGIN
  if (pathname === "/api/login" && req.method === "POST") {
    const body = await parseBody(req);
    const users = readJSON(USERS_FILE, []);
    const u = users.find((x) => x.username === body.username && x.password === body.password);
    if (!u) return sendJSON(res, 200, { ok: false });

    const sid = sha256(Date.now() + ":" + Math.random());
    SESSIONS[sid] = { username: u.username, role: u.role, company: u.company };
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sid=${sid}; Path=/; HttpOnly`,
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // LOGOUT
  if (pathname === "/api/logout") {
    const sid = getCookie(req, "sid");
    if (sid) delete SESSIONS[sid];
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": `sid=; Path=/; Max-Age=0`,
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // CREATE ORDER
  if (pathname === "/api/orders" && req.method === "POST") {
    const body = await parseBody(req);

    const orders = readJSON(ORDERS_FILE, []);
    const id = makeId();

    let fileObj = null;
    if (body.fileData && body.fileData.data && body.fileData.name) {
      const ext = path.extname(body.fileData.name || "").toLowerCase() || ".bin";
      const safeName = `${id}-${Math.random().toString(16).slice(2)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, safeName);

      const buffer = Buffer.from(body.fileData.data);
      fs.writeFileSync(filePath, buffer);

      fileObj = {
        filename: safeName,
        originalName: body.fileData.name,
        url: "/uploads/" + safeName,
      };
    }

    const order = {
      id,
      createdAt: new Date().toISOString(),
      company: (body.company || "").trim(),
      phone: (body.phone || "").trim(),
      orderMeasurements: (body.orderMeasurements || "").trim(),
      jobType: body.jobType || "",
      materialType: body.materialType || "",
      doorOpenDirection: body.doorOpenDirection || "",
      lineWidth: body.lineWidth || "",
      notes: (body.notes || "").trim(),
      sheets: Array.isArray(body.sheets) ? body.sheets : [],
      diagram: body.diagram || {},
      file: fileObj,
    };

    orders.unshift(order);
    writeJSON(ORDERS_FILE, orders);

    return sendJSON(res, 200, { ok: true, id });
  }

  // GET ORDERS (admin)
  if (pathname === "/api/orders" && req.method === "GET") {
    const user = authUser(req);
    if (!user) return sendJSON(res, 200, { ok: false, error: "unauthorized" });

    const orders = readJSON(ORDERS_FILE, []);
    return sendJSON(res, 200, { ok: true, orders });
  }

  // CLEAR ORDERS
  if (pathname === "/api/orders/clear" && req.method === "POST") {
    const user = authUser(req);
    if (!user) return sendJSON(res, 200, { ok: false, error: "unauthorized" });
    writeJSON(ORDERS_FILE, []);
    return sendJSON(res, 200, { ok: true });
  }

  // ADD CLIENT USER
  if (pathname === "/api/users" && req.method === "POST") {
    const user = authUser(req);
    if (!user || user.role !== "superadmin") {
      return sendJSON(res, 200, { ok: false, error: "unauthorized" });
    }
    const body = await parseBody(req);
    const users = readJSON(USERS_FILE, []);

    if (!body.username || !body.password || !body.company) {
      return sendJSON(res, 200, { ok: false, error: "missing" });
    }
    if (users.find((x) => x.username === body.username)) {
      return sendJSON(res, 200, { ok: false, error: "exists" });
    }

    users.push({
      username: body.username,
      password: body.password,
      role: "clientadmin",
      company: body.company,
    });

    writeJSON(USERS_FILE, users);
    return sendJSON(res, 200, { ok: true });
  }

  return sendJSON(res, 404, { ok: false, error: "not_found" });
}

// ============ STATIC ============
function serveStatic(req, res, pathname) {
  const safePath = pathname.replace(/\.\./g, "");
  const filePath = path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) return notFound(res);
  if (!fs.existsSync(filePath)) return notFound(res);

  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".css": "text/css",
    ".js": "application/javascript",
    ".html": "text/html; charset=utf-8",
  };

  const ct = map[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": ct });
  fs.createReadStream(filePath).pipe(res);
}

// ============ SERVER ============
ensureDirs();

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || "/";
  const query = parsed.query || {};

  // Static files
  if (pathname.startsWith("/uploads/") || pathname.startsWith("/logo") || pathname.startsWith("/public/")) {
    return serveStatic(req, res, pathname);
  }

  // API
  if (pathname.startsWith("/api/")) {
    return handleApi(req, res, pathname, query);
  }

  // Pages
  if (pathname === "/" || pathname === "/client" || pathname === "/client.html") {
    return send(res, 200, clientHTML());
  }

  if (pathname === "/admin-login.html") {
    return send(res, 200, adminLoginHTML());
  }

  if (pathname === "/admin.html") {
    const user = authUser(req);
    if (!user) return send(res, 200, adminLoginHTML("لازم تسجل دخول أولاً"));
    return send(res, 200, adminHTML(user));
  }

  if (pathname === "/order.html") {
    const user = authUser(req);
    if (!user) return send(res, 200, adminLoginHTML("لازم تسجل دخول أولاً"));

    const orders = readJSON(ORDERS_FILE, []);
    const order = orders.find((o) => o.id === String(query.id || ""));
    if (!order) return send(res, 404, baseHTML("Not Found", `<div class="card">الطلب غير موجود</div>`));
    return send(res, 200, orderHTML(order));
  }

  // Printable "PDF"
  if (pathname === "/pdf/invoice") {
    const user = authUser(req);
    if (!user) return send(res, 200, adminLoginHTML("لازم تسجل دخول أولاً"));

    const orders = readJSON(ORDERS_FILE, []);
    const order = orders.find((o) => o.id === String(query.id || ""));
    if (!order) return send(res, 404, "Not Found");
    return send(res, 200, invoicePDFPage(order));
  }

  if (pathname === "/pdf/sheet") {
    const user = authUser(req);
    if (!user) return send(res, 200, adminLoginHTML("لازم تسجل دخول أولاً"));

    const orders = readJSON(ORDERS_FILE, []);
    const order = orders.find((o) => o.id === String(query.id || ""));
    if (!order) return send(res, 404, "Not Found");
    return send(res, 200, sheetPDFPage(order));
  }

  return notFound(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("🚀 Server running: http://127.0.0.1:" + PORT);
});

