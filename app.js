/* =========================
   Pro Design CNC Dashboard
   Full app.js
========================= */

function $(id){ return document.getElementById(id); }
function safe(v){ return (v ?? "").toString().trim(); }

const LS = {
  SESSION:"pd_session",
  ORDERS:"pd_orders",
  INVOICES:"pd_invoices",
  DESIGNS:"pd_designs",
};

const USERS = [
  { username:"client1", password:"1234", company:"شركة العميل 1" },
  { username:"client2", password:"1234", company:"شركة العميل 2" },
];

const ADMIN = { username:"admin", password:"admin123", name:"Pro Design Admin" };

const SHEET_SIZES = ["122x244","122x300","150x300","100x300","100x200","122x350","122x400","150x400"];
const THICKNESS = Array.from({length:11},(_,i)=>String(i+2)); //2..12
const OPEN_DIR = [
  {key:"right", label:"يمين (من داخل البيت)"},
  {key:"left", label:"يسار (من داخل البيت)"},
];

function loadJSON(k, fb){
  try{ return JSON.parse(localStorage.getItem(k) || "") ?? fb; }
  catch(e){ return fb; }
}
function saveJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

function setSession(s){ saveJSON(LS.SESSION, s); }
function getSession(){ return loadJSON(LS.SESSION, null); }
function clearSession(){ localStorage.removeItem(LS.SESSION); }

function nowStr(){
  const d = new Date();
  return d.toLocaleString("ar-KW");
}

function genId(prefix){
  return `${prefix}-${Date.now()}`;
}

function badgeClass(status){
  return status === "جاهز" ? "badge badgeReady" : "badge badgeWorking";
}

function doorArrowSVG(directionKey="right"){
  const isRight = directionKey === "right";
  const hingeX = isRight ? 15 : 85;
  const hingeLine = `M${hingeX} 18 L${hingeX} 88`;

  const topArrowLine = isRight ? "M20 12 L80 12" : "M80 12 L20 12";
  const topArrowHead = isRight
    ? "M80 12 L72 6 M80 12 L72 18"
    : "M20 12 L28 6 M20 12 L28 18";

  const doorSwing = isRight ? "M25 85 L75 25" : "M75 85 L25 25";
  const knob = isRight ? `<circle cx="70" cy="58" r="4" fill="#111"/>` : `<circle cx="30" cy="58" r="4" fill="#111"/>`;

  return `
  <svg width="60" height="60" viewBox="0 0 100 100">
    <rect x="10" y="14" width="80" height="80" rx="10" fill="#fff" stroke="#111" stroke-width="4"/>
    <path d="${hingeLine}" stroke="#111" stroke-width="6"/>
    <path d="${topArrowLine}" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="${topArrowHead}" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="${doorSwing}" stroke="#111" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${knob}
  </svg>`;
}

function printPDF(title){
  const old = document.title;
  document.title = title;
  window.print();
  setTimeout(()=>document.title=old, 300);
}

/* ---------------- Login ---------------- */
function initLogin(){
  const form = $("loginForm");
  if(!form) return;

  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    const u = safe($("username").value);
    const p = safe($("password").value);

    if(u===ADMIN.username && p===ADMIN.password){
      setSession({role:"admin", username:u, name:ADMIN.name});
      location.href="/admin.html";
      return;
    }

    const user = USERS.find(x=>x.username===u && x.password===p);
    if(!user){ alert("❌ بيانات الدخول غير صحيحة"); return; }

    setSession({role:"client", username:user.username, company:user.company});
    location.href="/client.html";
  });
}

/* ---------------- Orders Model ---------------- */
function getOrders(){ return loadJSON(LS.ORDERS, []); }
function saveOrders(list){ saveJSON(LS.ORDERS, list); }

function createBlankOrder(session){
  return {
    id: genId("ORD"),
    createdAt: nowStr(),
    clientUsername: session.username,
    clientCompany: session.company,
    status: "قيد التشغيل",
    locked: false, // بعد الإرسال يصير true
    lineWidth: "",
    sizes: [{hCm:"", wCm:"", qty:1, openDir:"right"}],
    sheetItems: [{size:"122x244", thicknessMm:"2", qty:1}],
    cutEngraveDetails:"",
    notes:"",
    files: [],
    designApproved:false,
    designNotes:"",
    invoiceId:null,
  };
}

/* ---------------- Client ---------------- */
function initClient(){
  const root = $("clientRoot");
  if(!root) return;

  const session = getSession();
  if(!session || session.role!=="client"){ location.href="/"; return; }

  $("clientCompanyTitle").textContent = session.company;

  $("clientLogoutBtn").onclick = ()=>{
    clearSession();
    location.href="/";
  };

  // Tabs
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      const t = btn.dataset.tab;
      document.querySelectorAll(".tabPage").forEach(p=>p.classList.add("hidden"));
      $(t).classList.remove("hidden");
    });
  });

  let orders = getOrders().filter(o=>o.clientUsername===session.username);
  if(orders.length===0){
    const o = createBlankOrder(session);
    const all = getOrders();
    all.push(o);
    saveOrders(all);
    orders = [o];
  }

  let selectedId = orders[orders.length-1].id;

  const orderSelect = $("clientOrderSelect");
  const statusBadge = $("clientStatusBadge");

  function refreshOrdersList(){
    orders = getOrders().filter(o=>o.clientUsername===session.username);
    orderSelect.innerHTML = orders
      .slice().reverse()
      .map(o=>`<option value="${o.id}">${o.id} | ${o.createdAt}</option>`)
      .join("");
    orderSelect.value = selectedId;
  }

  function currentOrder(){
    const all = getOrders();
    return all.find(o=>o.id===selectedId) || null;
  }

  function saveCurrentOrder(update){
    const all = getOrders();
    const idx = all.findIndex(o=>o.id===selectedId);
    if(idx===-1) return;
    all[idx] = {...all[idx], ...update};
    saveOrders(all);
  }

  function renderStatus(){
    const o = currentOrder();
    if(!o) return;
    statusBadge.className = badgeClass(o.status);
    statusBadge.textContent = o.status==="جاهز" ? "✅ جاهز" : "⏳ قيد التشغيل";
  }

  // Sizes
  const sizesContainer = $("sizesContainer");
  function renderSizes(){
    const o = currentOrder();
    if(!o) return;

    sizesContainer.innerHTML = o.sizes.map((s,i)=>{
      return `
      <div class="card mt" style="background:rgba(255,255,255,.02);border-radius:16px">
        <div class="row between">
          <div class="h2" style="margin:0">قياس ${i+1}</div>
          <div>${doorArrowSVG(s.openDir)}</div>
        </div>

        <div class="row gap mt">
          <div class="col w50">
            <label>الارتفاع (سم)</label>
            <input ${o.locked?"disabled":""} data-i="${i}" data-k="hCm" value="${s.hCm}" placeholder="مثال: 210"/>
          </div>
          <div class="col w50">
            <label>العرض (سم)</label>
            <input ${o.locked?"disabled":""} data-i="${i}" data-k="wCm" value="${s.wCm}" placeholder="مثال: 110"/>
          </div>
        </div>

        <div class="row gap mt">
          <div class="col w50">
            <label>العدد</label>
            <input ${o.locked?"disabled":""} type="number" min="1" data-i="${i}" data-k="qty" value="${s.qty}"/>
          </div>
          <div class="col w50">
            <label>اتجاه الفتحة</label>
            <select ${o.locked?"disabled":""} data-i="${i}" data-k="openDir">
              ${OPEN_DIR.map(d=>`<option value="${d.key}" ${d.key===s.openDir?"selected":""}>${d.label}</option>`).join("")}
            </select>
          </div>
        </div>

        <button class="btn btnGhost mt" ${o.locked?"disabled":""} data-del="${i}">حذف القياس</button>
      </div>
      `;
    }).join("");

    sizesContainer.querySelectorAll("input,select").forEach(el=>{
      el.oninput = ()=>{
        const o = currentOrder(); if(!o || o.locked) return;
        const i = Number(el.dataset.i);
        const k = el.dataset.k;
        o.sizes[i][k] = el.value;
        saveCurrentOrder({sizes:o.sizes});
        if(k==="openDir") renderSizes();
      };
      el.onchange = el.oninput;
    });

    sizesContainer.querySelectorAll("[data-del]").forEach(btn=>{
      btn.onclick = ()=>{
        const o = currentOrder(); if(!o || o.locked) return;
        if(o.sizes.length===1){ alert("لا يمكن حذف آخر قياس"); return; }
        o.sizes.splice(Number(btn.dataset.del),1);
        saveCurrentOrder({sizes:o.sizes});
        renderSizes();
      };
    });
  }

  $("addSizeBtn").onclick = ()=>{
    const o = currentOrder(); if(!o || o.locked) return;
    o.sizes.push({hCm:"", wCm:"", qty:1, openDir:"right"});
    saveCurrentOrder({sizes:o.sizes});
    renderSizes();
  };

  // Line width
  const lineWidthSelect = $("lineWidthSelect");
  const lineWidthOther = $("lineWidthOther");

  lineWidthSelect.onchange = ()=>{
    const o = currentOrder(); if(!o || o.locked) return;
    if(lineWidthSelect.value==="other"){
      lineWidthOther.disabled = false;
      lineWidthOther.focus();
    }else{
      lineWidthOther.disabled = true;
      lineWidthOther.value = "";
      saveCurrentOrder({lineWidth: lineWidthSelect.value});
    }
  };

  lineWidthOther.oninput = ()=>{
    const o = currentOrder(); if(!o || o.locked) return;
    saveCurrentOrder({lineWidth: safe(lineWidthOther.value)});
  };

  // Details / notes / files
  const cutEngraveDetails = $("cutEngraveDetails");
  const notesInput = $("notesInput");
  const fileInput = $("fileInput");

  function bindTextAreas(){
    const o = currentOrder(); if(!o) return;
    cutEngraveDetails.value = o.cutEngraveDetails || "";
    notesInput.value = o.notes || "";
    cutEngraveDetails.disabled = o.locked;
    notesInput.disabled = o.locked;

    cutEngraveDetails.oninput = ()=>{ if(o.locked) return; saveCurrentOrder({cutEngraveDetails: cutEngraveDetails.value}); };
    notesInput.oninput = ()=>{ if(o.locked) return; saveCurrentOrder({notes: notesInput.value}); };
  }

  fileInput.onchange = ()=>{
    const o = currentOrder(); if(!o || o.locked) return;
    const names = Array.from(fileInput.files || []).map(f=>f.name);
    saveCurrentOrder({files: names});
    alert("تم حفظ أسماء الملفات (نسخة تجريبية)");
  };

  // Sheets
  const sheetContainer = $("sheetContainer");
  function renderSheets(){
    const o = currentOrder(); if(!o) return;

    sheetContainer.innerHTML = o.sheetItems.map((it,i)=>{
      return `
      <div class="row gap mt">
        <select ${o.locked?"disabled":""} data-i="${i}" data-k="size" class="w50">
          ${SHEET_SIZES.map(s=>`<option value="${s}" ${s===it.size?"selected":""}>${s}</option>`).join("")}
        </select>
        <select ${o.locked?"disabled":""} data-i="${i}" data-k="thicknessMm" class="w50">
          ${THICKNESS.map(t=>`<option value="${t}" ${t===it.thicknessMm?"selected":""}>${t}</option>`).join("")}
        </select>
        <input ${o.locked?"disabled":""} data-i="${i}" data-k="qty" type="number" min="1" value="${it.qty}" class="w50"/>
        <button class="btn btnGhost w50" ${o.locked?"disabled":""} data-del="${i}">حذف</button>
      </div>
      `;
    }).join("");

    sheetContainer.querySelectorAll("select,input").forEach(el=>{
      el.oninput = ()=>{
        const o = currentOrder(); if(!o || o.locked) return;
        const i = Number(el.dataset.i);
        const k = el.dataset.k;
        o.sheetItems[i][k] = el.value;
        saveCurrentOrder({sheetItems:o.sheetItems});
      };
      el.onchange = el.oninput;
    });

    sheetContainer.querySelectorAll("[data-del]").forEach(btn=>{
      btn.onclick = ()=>{
        const o = currentOrder(); if(!o || o.locked) return;
        if(o.sheetItems.length===1){ alert("لا يمكن حذف آخر شيت"); return; }
        o.sheetItems.splice(Number(btn.dataset.del),1);
        saveCurrentOrder({sheetItems:o.sheetItems});
        renderSheets();
      };
    });
  }

  $("addSheetBtn").onclick = ()=>{
    const o = currentOrder(); if(!o || o.locked) return;
    o.sheetItems.push({size:"122x244", thicknessMm:"2", qty:1});
    saveCurrentOrder({sheetItems:o.sheetItems});
    renderSheets();
  };

  $("downloadSheetPdfBtn").onclick = ()=>{
    const o = currentOrder(); if(!o) return;
    alert("سيتم فتح الطباعة، اختر Save as PDF");
    printPDF(`طلب شيت - ${o.clientCompany} - ${o.id}`);
  };

  // Draft / Send
  $("saveDraftBtn").onclick = ()=>{
    alert("✅ تم حفظ المسودة");
  };

  function buildOrderText(o){
    const lines = [];
    lines.push("📌 أمر تشغيل CNC - Pro Design");
    lines.push("--------------------------------");
    lines.push(`العميل: ${o.clientCompany}`);
    lines.push(`رقم الطلب: ${o.id}`);
    lines.push(`التاريخ: ${o.createdAt}`);
    lines.push(`الحالة: ${o.status}`);
    lines.push("--------------------------------");
    lines.push("📏 القياسات (سم):");
    o.sizes.forEach((s,i)=>{
      const dir = s.openDir==="right" ? "يمين" : "يسار";
      lines.push(`${i+1}) ارتفاع ${s.hCm} × عرض ${s.wCm} | العدد: ${s.qty} | الفتحة: ${dir}`);
    });
    lines.push("--------------------------------");
    lines.push(`⚙️ عرض الخط (mm): ${o.lineWidth || "-"}`);
    lines.push("--------------------------------");
    lines.push("🧾 الشيتات:");
    o.sheetItems.forEach((x,i)=>{
      lines.push(`${i+1}) ${x.size} | ${x.thicknessMm}mm | كمية: ${x.qty}`);
    });
    lines.push("--------------------------------");
    lines.push("✂️ تفاصيل القص/الحفر:");
    lines.push(o.cutEngraveDetails || "-");
    lines.push("--------------------------------");
    lines.push("📎 ملفات:");
    lines.push((o.files && o.files.length) ? o.files.join(", ") : "لا يوجد");
    lines.push("--------------------------------");
    lines.push("📝 ملاحظات:");
    lines.push(o.notes || "-");
    return lines.join("\n");
  }

  $("sendToAdminBtn").onclick = ()=>{
    const o = currentOrder(); if(!o) return;
    // lock after send
    saveCurrentOrder({locked:true});
    const updated = currentOrder();
    $("generatedOrderBox").value = buildOrderText(updated);
    alert("✅ تم إرسال أمر التشغيل للأدمن وتم قفل الطلب للتعديل");
    renderStatus();
    renderSizes(); renderSheets(); bindTextAreas();
  };

  $("copyOrderBtn").onclick = async ()=>{
    const txt = $("generatedOrderBox").value;
    if(!safe(txt)){ alert("لا يوجد أمر تشغيل"); return; }
    await navigator.clipboard.writeText(txt);
    alert("✅ تم النسخ");
  };

  $("downloadOrderPdfBtn").onclick = ()=>{
    const o = currentOrder(); if(!o) return;
    alert("سيتم فتح الطباعة، اختر Save as PDF");
    printPDF(`أمر تشغيل - ${o.clientCompany} - ${o.id}`);
  };

  // New order
  $("newOrderBtn").onclick = ()=>{
    const all = getOrders();
    const o = createBlankOrder(session);
    all.push(o);
    saveOrders(all);
    selectedId = o.id;
    refreshOrdersList();
    loadSelected();
  };

  orderSelect.onchange = ()=>{
    selectedId = orderSelect.value;
    loadSelected();
  };

  // Design approval
  $("approveDesignBtn").onclick = ()=>{
    const o = currentOrder(); if(!o) return;
    saveCurrentOrder({designApproved:true});
    alert("✅ تم اعتماد التصميم");
  };

  $("sendDesignNotesBtn").onclick = ()=>{
    const o = currentOrder(); if(!o) return;
    saveCurrentOrder({designNotes: $("designNotes").value});
    alert("✅ تم إرسال الملاحظات");
  };

  // Invoice view
  function getInvoices(){ return loadJSON(LS.INVOICES, []); }
  function getInvoiceById(id){ return getInvoices().find(x=>x.id===id) || null; }

  $("downloadInvoicePdfBtn").onclick = ()=>{
    const o = currentOrder(); if(!o || !o.invoiceId){ alert("لا توجد فاتورة"); return; }
    alert("سيتم فتح الطباعة، اختر Save as PDF");
    printPDF(`فاتورة - ${o.clientCompany} - ${o.id}`);
  };

  function renderInvoice(){
    const o = currentOrder(); if(!o) return;
    const box = $("invoiceBox");
    if(!o.invoiceId){
      box.value = "لا توجد فاتورة بعد";
      return;
    }
    const inv = getInvoiceById(o.invoiceId);
    if(!inv){ box.value="لا توجد فاتورة بعد"; return; }
    box.value = inv.text;
  }

  // Load selected order
  function loadSelected(){
    refreshOrdersList();
    const o = currentOrder(); if(!o) return;

    renderStatus();

    // line width
    lineWidthSelect.disabled = o.locked;
    lineWidthOther.disabled = true;

    if(o.lineWidth && ["4","6","8","10","12","15","20","25","30","40"].includes(o.lineWidth)){
      lineWidthSelect.value = o.lineWidth;
      lineWidthOther.value = "";
    }else if(o.lineWidth){
      lineWidthSelect.value = "other";
      lineWidthOther.disabled = o.locked ? true : false;
      lineWidthOther.value = o.lineWidth;
    }else{
      lineWidthSelect.value = "";
      lineWidthOther.value = "";
    }

    $("generatedOrderBox").value = buildOrderText(o);

    renderSizes();
    renderSheets();
    bindTextAreas();
    renderInvoice();

    // design box
    $("designBox").textContent = "لا يوجد تصميم حالياً (سيضاف لاحقاً)";
  }

  loadSelected();
}

/* ---------------- Admin ---------------- */
function initAdmin(){
  const root = $("adminRoot");
  if(!root) return;

  const session = getSession();
  if(!session || session.role!=="admin"){ location.href="/"; return; }

  $("adminLogoutBtn").onclick = ()=>{
    clearSession();
    location.href="/";
  };

  const ordersList = $("ordersList");
  const search = $("adminSearch");
  let selectedId = null;

  function getAllOrders(){ return getOrders(); }

  function renderList(){
    const q = safe(search.value).toLowerCase();
    const list = getAllOrders()
      .slice().reverse()
      .filter(o=>{
        if(!q) return true;
        return o.id.toLowerCase().includes(q) || o.clientCompany.toLowerCase().includes(q);
      });

    if(list.length===0){
      ordersList.innerHTML = `<div class="muted">لا يوجد طلبات</div>`;
      return;
    }

    ordersList.innerHTML = list.map(o=>{
      return `
      <div class="orderItem" data-id="${o.id}">
        <div class="orderTop">
          <div class="orderCompany">${o.clientCompany}</div>
          <span class="${badgeClass(o.status)}">${o.status}</span>
        </div>
        <div class="orderMeta">${o.id} • ${o.createdAt}</div>
      </div>`;
    }).join("");

    ordersList.querySelectorAll(".orderItem").forEach(it=>{
      it.onclick = ()=>{
        selectedId = it.dataset.id;
        renderDetails();
      };
    });
  }

  function findOrder(){
    const all = getAllOrders();
    return all.find(o=>o.id===selectedId) || null;
  }

  function saveOrder(update){
    const all = getAllOrders();
    const idx = all.findIndex(o=>o.id===selectedId);
    if(idx===-1) return;
    all[idx] = {...all[idx], ...update};
    saveOrders(all);
  }

  function buildAdminText(o){
    const lines = [];
    lines.push("📌 تفاصيل الطلب (الأدمن)");
    lines.push("--------------------------------");
    lines.push(`العميل: ${o.clientCompany}`);
    lines.push(`رقم الطلب: ${o.id}`);
    lines.push(`التاريخ: ${o.createdAt}`);
    lines.push(`الحالة: ${o.status}`);
    lines.push(`عرض الخط (mm): ${o.lineWidth || "-"}`);
    lines.push("--------------------------------");
    lines.push("📏 القياسات:");
    o.sizes.forEach((s,i)=>{
      lines.push(`${i+1}) ${s.hCm}×${s.wCm} | عدد: ${s.qty} | فتحة: ${s.openDir==="right"?"يمين":"يسار"}`);
    });
    lines.push("--------------------------------");
    lines.push("🧾 الشيتات:");
    o.sheetItems.forEach((x,i)=>{
      lines.push(`${i+1}) ${x.size} | ${x.thicknessMm}mm | كمية: ${x.qty}`);
    });
    lines.push("--------------------------------");
    lines.push("✂️ تفاصيل:");
    lines.push(o.cutEngraveDetails || "-");
    lines.push("--------------------------------");
    lines.push("📎 ملفات:");
    lines.push((o.files && o.files.length) ? o.files.join(", ") : "لا يوجد");
    lines.push("--------------------------------");
    lines.push("📝 ملاحظات:");
    lines.push(o.notes || "-");
    return lines.join("\n");
  }

  function getInvoices(){ return loadJSON(LS.INVOICES, []); }
  function saveInvoices(v){ saveJSON(LS.INVOICES, v); }

  function makeInvoiceText(inv){
    return `
Pro Design CNC — فاتورة
--------------------------------
العميل: ${inv.clientCompany}
رقم الطلب: ${inv.orderId}
رقم الفاتورة: ${inv.id}
التاريخ: ${inv.createdAt}
--------------------------------
سعر القص: KD ${inv.priceCut.toFixed(3)}
سعر الحفر: KD ${inv.priceEngrave.toFixed(3)}
سعر الشيت/المادة: KD ${inv.priceSheet.toFixed(3)}
--------------------------------
الإجمالي قبل الخصم: KD ${inv.totalBefore.toFixed(3)}
الخصم: KD ${inv.discount.toFixed(3)}
الإجمالي النهائي: KD ${inv.totalAfter.toFixed(3)}
--------------------------------
ملاحظة: ${inv.note || "-"}
الهاتف: 96765547
`;
  }

  function renderDetails(){
    const o = findOrder();
    if(!o){
      $("orderDetailsBox").value = "اختر طلب من القائمة";
      return;
    }
    $("orderDetailsBox").value = buildAdminText(o);
    $("adminStatusSelect").value = o.status;

    // load invoice if exists
    if(o.invoiceId){
      const inv = getInvoices().find(x=>x.id===o.invoiceId);
      if(inv) $("invoicePreviewBox").value = inv.text;
    }else{
      $("invoicePreviewBox").value = "لا توجد فاتورة";
    }
  }

  $("saveStatusBtn").onclick = ()=>{
    if(!selectedId){ alert("اختر طلب"); return; }
    saveOrder({status: $("adminStatusSelect").value});
    alert("✅ تم تحديث الحالة");
    renderList();
    renderDetails();
  };

  $("createInvoiceBtn").onclick = ()=>{
    if(!selectedId){ alert("اختر طلب"); return; }
    const o = findOrder(); if(!o) return;

    const priceCut = Number($("priceCut").value||0);
    const priceEngrave = Number($("priceEngrave").value||0);
    const priceSheet = Number($("priceSheet").value||0);
    const discount = Number($("discount").value||0);
    const note = safe($("invoiceNote").value);

    const totalBefore = priceCut + priceEngrave + priceSheet;
    const totalAfter = Math.max(0, totalBefore - discount);

    const inv = {
      id: genId("INV"),
      orderId: o.id,
      clientUsername: o.clientUsername,
      clientCompany: o.clientCompany,
      createdAt: nowStr(),
      priceCut, priceEngrave, priceSheet, discount,
      totalBefore, totalAfter,
      note,
    };
    inv.text = makeInvoiceText(inv);

    // save invoice
    const invs = getInvoices();
    invs.push(inv);
    saveInvoices(invs);

    // attach to order
    saveOrder({invoiceId: inv.id});

    $("invoicePreviewBox").value = inv.text;
    alert("✅ تم إنشاء الفاتورة");
    renderList();
    renderDetails();
  };

  $("sendInvoiceToClientBtn").onclick = ()=>{
    if(!selectedId){ alert("اختر طلب"); return; }
    const o = findOrder(); if(!o || !o.invoiceId){ alert("أنشئ فاتورة أولاً"); return; }
    alert("✅ تم إرسال الفاتورة للعميل (ستظهر عنده في تبويب الفاتورة)");
  };

  $("downloadInvoicePdfAdminBtn").onclick = ()=>{
    if(!selectedId){ alert("اختر طلب"); return; }
    const o = findOrder(); if(!o || !o.invoiceId){ alert("لا توجد فاتورة"); return; }
    alert("سيتم فتح الطباعة، اختر Save as PDF");
    printPDF(`فاتورة - ${o.clientCompany} - ${o.id}`);
  };

  search.oninput = renderList;

  // init
  const all = getAllOrders();
  if(all.length>0) selectedId = all[0].id;
  renderList();
  renderDetails();
}

/* ---------------- Init ---------------- */
document.addEventListener("DOMContentLoaded",()=>{
  initLogin();
  initClient();
  initAdmin();
});
