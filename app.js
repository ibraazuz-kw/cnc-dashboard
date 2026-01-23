/* =========================
   Pro Design CNC (Client)
   Door Direction + Lock Side + Fix
   LocalStorage MVP
========================= */

function $(id){ return document.getElementById(id); }
function safe(v){ return (v ?? "").toString().trim(); }

const LS = {
  SESSION:"pd_session",
  ORDERS:"pd_orders",
  INVOICES:"pd_invoices",
};

const SHEET_SIZES = ["122x244","122x300","150x300","100x300","100x200","122x350","122x400","150x400"];
const THICKNESS = Array.from({length:11},(_,i)=>String(i+2)); //2..12

function loadJSON(k, fb){
  try{ return JSON.parse(localStorage.getItem(k) || "") ?? fb; }
  catch(e){ return fb; }
}
function saveJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

function getSession(){ return loadJSON(LS.SESSION, null); }
function clearSession(){ localStorage.removeItem(LS.SESSION); }

function getOrders(){ return loadJSON(LS.ORDERS, []); }
function saveOrders(list){ saveJSON(LS.ORDERS, list); }

function nowStr(){
  const d = new Date();
  return d.toLocaleString("ar-KW");
}
function genId(prefix){ return `${prefix}-${Date.now()}`; }

function badgeClass(status){
  return status === "جاهز" ? "badge ready" : "badge working";
}

function doorDiagram(type="single", dir="right"){
  // Simple SVG like your drawing
  // type: single/double
  // dir: right/left/in/out (for double)
  if(type === "double"){
    // double in/out
    const isIn = dir === "in";
    return `
    <div class="door-box">
      <svg width="90" height="70" viewBox="0 0 100 80">
        <rect x="10" y="10" width="80" height="60" rx="10" fill="none" stroke="#fff" stroke-width="3"/>
        <line x1="50" y1="10" x2="50" y2="70" stroke="#fff" stroke-width="3"/>
        ${isIn
          ? `<path d="M50 40 L20 20 L20 60 Z" fill="rgba(47,123,255,.55)"/>
             <path d="M50 40 L80 20 L80 60 Z" fill="rgba(47,123,255,.55)"/>`
          : `<path d="M50 40 L20 10 L20 70 Z" fill="rgba(47,123,255,.25)"/>
             <path d="M50 40 L80 10 L80 70 Z" fill="rgba(47,123,255,.25)"/>`
        }
      </svg>
    </div>`;
  }

  // single right/left
  const isRight = dir === "right";
  return `
  <div class="door-box">
    <svg width="90" height="70" viewBox="0 0 100 80">
      <rect x="10" y="10" width="80" height="60" rx="10" fill="none" stroke="#fff" stroke-width="3"/>
      <line x1="${isRight?85:15}" y1="15" x2="${isRight?85:15}" y2="65" stroke="#fff" stroke-width="4"/>
      ${isRight
        ? `<path d="M85 40 L25 15 L25 65 Z" fill="rgba(47,123,255,.55)"/>`
        : `<path d="M15 40 L75 15 L75 65 Z" fill="rgba(47,123,255,.55)"/>`
      }
    </svg>
  </div>`;
}

function createBlankOrder(session){
  return {
    id: genId("ORD"),
    createdAt: nowStr(),
    clientUsername: session.username,
    clientCompany: session.company || "عميل",
    status: "قيد التشغيل",
    locked: false,

    doorType: "",
    doorDirection: "right", // single: right/left | double: in/out
    lockSide: "",

    hasFix: false,
    fixAuto: true,
    fixWidthCm: "",
    fixHeightCm: "",

    lineWidth: "",
    sizes: [{hCm:"", wCm:"", qty:1}],
    sheetItems: [{size:"122x244", thicknessMm:"2", qty:1}],
    cutEngraveDetails:"",
    notes:"",
    files: [],
    designApproved:false,
    designNotes:"",
    invoiceId:null,
  };
}

/* ---------------- Client Init ---------------- */
function initClient(){
  const root = $("clientRoot");
  if(!root) return;

  const session = getSession();
  if(!session || session.role!=="client"){ location.href="/"; return; }

  $("clientCompanyTitle").textContent = `👤 ${session.company || session.username}`;

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

  // Load orders
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

  /* ---- Door type & direction ---- */
  const doorTypeSelect = $("doorTypeSelect");
  const doorDirectionArea = $("doorDirectionArea");
  const lockSideSelect = $("lockSideSelect");

  function renderDoorDirectionUI(){
    const o = currentOrder(); if(!o) return;

    // If doorType empty -> show single right/left as default UI
    const type = o.doorType || "single";

    if(type === "double"){
      doorDirectionArea.innerHTML = `
        <div class="row">
          <button class="btn btn-ghost" id="dd_in">مزدوج للداخل ${doorDiagram("double","in")}</button>
          <button class="btn btn-ghost" id="dd_out">مزدوج للخارج ${doorDiagram("double","out")}</button>
        </div>
      `;
      $("dd_in").onclick = ()=>{ if(o.locked) return; saveCurrentOrder({doorDirection:"in"}); renderDoorDirectionUI(); };
      $("dd_out").onclick = ()=>{ if(o.locked) return; saveCurrentOrder({doorDirection:"out"}); renderDoorDirectionUI(); };
    } else {
      doorDirectionArea.innerHTML = `
        <div class="row">
          <button class="btn btn-ghost" id="dd_right">يمين ${doorDiagram("single","right")}</button>
          <button class="btn btn-ghost" id="dd_left">يسار ${doorDiagram("single","left")}</button>
        </div>
      `;
      $("dd_right").onclick = ()=>{ if(o.locked) return; saveCurrentOrder({doorDirection:"right"}); renderDoorDirectionUI(); };
      $("dd_left").onclick = ()=>{ if(o.locked) return; saveCurrentOrder({doorDirection:"left"}); renderDoorDirectionUI(); };
    }
  }

  doorTypeSelect.onchange = ()=>{
    const o = currentOrder(); if(!o || o.locked) return;
    const v = doorTypeSelect.value;
    saveCurrentOrder({
      doorType: v,
      doorDirection: v==="double" ? "in" : "right",
    });
    renderDoorDirectionUI();
  };

  lockSideSelect.onchange = ()=>{
    const o = currentOrder(); if(!o || o.locked) return;
    saveCurrentOrder({lockSide: lockSideSelect.value});
  };

  /* ---- Fix (فكس) ---- */
  const addFixBtn = $("addFixBtn");
  addFixBtn.onclick = ()=>{
    const o = currentOrder(); if(!o || o.locked) return;
    saveCurrentOrder({hasFix:true, fixAuto:true});
    alert("✅ تم إضافة فكس فوق الباب");
  };

  /* ---- Sizes ---- */
  const sizesContainer = $("sizesContainer");

  function renderSizes(){
    const o = currentOrder();
    if(!o) return;

    sizesContainer.innerHTML = "";

    // Fix block if exists
    if(o.hasFix){
      const doorWidth = Number(o.sizes?.[0]?.wCm || 0);
      const autoWidth = doorWidth ? doorWidth : "";

      sizesContainer.innerHTML += `
      <div class="measure-item">
        <div class="measure-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="num-pill">F</div>
            <div>
              <div style="font-weight:800">فكس فوق الباب</div>
              <div class="help">عرض تلقائي = عرض الباب (مع خيار قياس مختلف)</div>
            </div>
          </div>
          <button class="btn btn-red" id="removeFixBtn" style="width:auto;padding:10px 12px">حذف</button>
        </div>

        <label>اختيار قياس الفكس</label>
        <select id="fixMode">
          <option value="auto" ${o.fixAuto?"selected":""}>تلقائي (نفس عرض الباب)</option>
          <option value="manual" ${!o.fixAuto?"selected":""}>قياس آخر (يدوي)</option>
        </select>

        <div class="row">
          <div>
            <label>عرض الفكس (سم)</label>
            <input id="fixWidth" ${o.fixAuto?"disabled":""} value="${o.fixAuto ? autoWidth : (o.fixWidthCm||"")}" placeholder="مثال: 110"/>
          </div>
          <div>
            <label>ارتفاع الفكس (سم)</label>
            <input id="fixHeight" value="${o.fixHeightCm||""}" placeholder="مثال: 40"/>
          </div>
        </div>
      </div>
      `;

      $("removeFixBtn").onclick = ()=>{
        const o = currentOrder(); if(!o || o.locked) return;
        saveCurrentOrder({hasFix:false, fixWidthCm:"", fixHeightCm:""});
        renderSizes();
      };

      $("fixMode").onchange = ()=>{
        const o = currentOrder(); if(!o || o.locked) return;
        const isAuto = $("fixMode").value === "auto";
        saveCurrentOrder({fixAuto:isAuto});
        renderSizes();
      };

      $("fixWidth").oninput = ()=>{
        const o = currentOrder(); if(!o || o.locked) return;
        saveCurrentOrder({fixWidthCm: $("fixWidth").value});
      };

      $("fixHeight").oninput = ()=>{
        const o = currentOrder(); if(!o || o.locked) return;
        saveCurrentOrder({fixHeightCm: $("fixHeight").value});
      };
    }

    // Door size items
    (o.sizes || []).forEach((s,i)=>{
      sizesContainer.innerHTML += `
      <div class="measure-item">
        <div class="measure-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="num-pill">${i+1}</div>
            <div style="font-weight:800">قياس الباب</div>
          </div>
          <button class="btn btn-red" data-del="${i}" style="width:auto;padding:10px 12px">حذف</button>
        </div>

        <div class="row">
          <div>
            <label>الارتفاع (سم)</label>
            <input ${o.locked?"disabled":""} data-i="${i}" data-k="hCm" value="${s.hCm||""}" placeholder="مثال: 210"/>
          </div>
          <div>
            <label>العرض (سم)</label>
            <input ${o.locked?"disabled":""} data-i="${i}" data-k="wCm" value="${s.wCm||""}" placeholder="مثال: 110"/>
          </div>
        </div>

        <label>العدد</label>
        <input ${o.locked?"disabled":""} type="number" min="1" data-i="${i}" data-k="qty" value="${s.qty||1}"/>
      </div>
      `;
    });

    sizesContainer.querySelectorAll("input[data-i]").forEach(el=>{
      el.oninput = ()=>{
        const o = currentOrder(); if(!o || o.locked) return;
        const i = Number(el.dataset.i);
        const k = el.dataset.k;
        o.sizes[i][k] = el.value;
        saveCurrentOrder({sizes:o.sizes});
        renderSizes(); // update fix auto width if needed
      };
    });

    sizesContainer.querySelectorAll("button[data-del]").forEach(btn=>{
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
    o.sizes.push({hCm:"", wCm:"", qty:1});
    saveCurrentOrder({sizes:o.sizes});
    renderSizes();
  };

  /* ---- Line width ---- */
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

  /* ---- Details / notes / files ---- */
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

  /* ---- Sheets ---- */
  const sheetContainer = $("sheetContainer");

  function renderSheets(){
    const o = currentOrder(); if(!o) return;

    sheetContainer.innerHTML = `
      <div style="display:grid;grid-template-columns:1.2fr .8fr .6fr .4fr;gap:10px;
                  background:rgba(47,123,255,.18);border:1px solid rgba(47,123,255,.35);
                  padding:10px;border-radius:16px;font-weight:800;margin-bottom:10px">
        <div>قياس الشيت</div>
        <div>السماكة</div>
        <div>الكمية</div>
        <div>حذف</div>
      </div>
    `;

    (o.sheetItems || []).forEach((it,i)=>{
      sheetContainer.innerHTML += `
      <div style="display:grid;grid-template-columns:1.2fr .8fr .6fr .4fr;gap:10px;margin-bottom:10px">
        <select ${o.locked?"disabled":""} data-i="${i}" data-k="size">
          ${SHEET_SIZES.map(s=>`<option value="${s}" ${s===it.size?"selected":""}>${s}</option>`).join("")}
        </select>
        <select ${o.locked?"disabled":""} data-i="${i}" data-k="thicknessMm">
          ${THICKNESS.map(t=>`<option value="${t}" ${t===it.thicknessMm?"selected":""}>${t} mm</option>`).join("")}
        </select>
        <input ${o.locked?"disabled":""} data-i="${i}" data-k="qty" type="number" min="1" value="${it.qty||1}"/>
        <button class="btn btn-red" ${o.locked?"disabled":""} data-del="${i}" style="padding:10px 12px">حذف</button>
      </div>
      `;
    });

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

    sheetContainer.querySelectorAll("button[data-del]").forEach(btn=>{
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
    window.print();
  };

  /* ---- Build Order Text ---- */
  function buildOrderText(o){
    const lines = [];
    lines.push("📌 أمر تشغيل CNC - Pro Design");
    lines.push("--------------------------------");
    lines.push(`العميل: ${o.clientCompany}`);
    lines.push(`رقم الطلب: ${o.id}`);
    lines.push(`التاريخ: ${o.createdAt}`);
    lines.push(`الحالة: ${o.status}`);
    lines.push("--------------------------------");
    lines.push(`نوع الباب: ${o.doorType || "-"}`);
    lines.push(`اتجاه الفتحة: ${o.doorDirection || "-"}`);
    lines.push(`القفل: ${o.lockSide || "-"}`);
    if(o.hasFix){
      lines.push(`فكس فوق الباب: نعم`);
      lines.push(`قياس الفكس: ${o.fixAuto ? "تلقائي" : "يدوي"} | عرض: ${o.fixAuto ? (o.sizes?.[0]?.wCm||"-") : (o.fixWidthCm||"-")} | ارتفاع: ${o.fixHeightCm||"-"}`);
    }else{
      lines.push(`فكس فوق الباب: لا`);
    }
    lines.push("--------------------------------");
    lines.push("📏 قياسات الباب (سم):");
    (o.sizes||[]).forEach((s,i)=>{
      lines.push(`${i+1}) ارتفاع ${s.hCm} × عرض ${s.wCm} | العدد: ${s.qty}`);
    });
    lines.push("--------------------------------");
    lines.push(`⚙️ عرض الخط (mm): ${o.lineWidth || "-"}`);
    lines.push("--------------------------------");
    lines.push("🧾 الشيتات:");
    (o.sheetItems||[]).forEach((x,i)=>{
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

  $("saveDraftBtn").onclick = ()=>{
    alert("✅ تم حفظ المسودة");
  };

  $("sendToAdminBtn").onclick = ()=>{
    const o = currentOrder(); if(!o) return;
    saveCurrentOrder({locked:true});
    const updated = currentOrder();
    $("generatedOrderBox").value = buildOrderText(updated);
    alert("✅ تم إرسال أمر التشغيل للأدمن وتم قفل الطلب للتعديل");
    renderStatus();
    renderSizes(); renderSheets(); bindTextAreas(); renderDoorDirectionUI();
  };

  $("copyOrderBtn").onclick = async ()=>{
    const txt = $("generatedOrderBox").value;
    if(!safe(txt)){ alert("لا يوجد أمر تشغيل"); return; }
    await navigator.clipboard.writeText(txt);
    alert("✅ تم النسخ");
  };

  $("downloadOrderPdfBtn").onclick = ()=>{
    alert("سيتم فتح الطباعة، اختر Save as PDF");
    window.print();
  };

  /* ---- New order ---- */
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

  // Design
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

  $("downloadInvoicePdfBtn").onclick = ()=>{
    const o = currentOrder(); if(!o || !o.invoiceId){ alert("لا توجد فاتورة"); return; }
    alert("سيتم فتح الطباعة، اختر Save as PDF");
    window.print();
  };

  function loadSelected(){
    refreshOrdersList();
    const o = currentOrder(); if(!o) return;

    renderStatus();

    // door type
    doorTypeSelect.value = o.doorType || "";
    lockSideSelect.value = o.lockSide || "";

    // line width
    if(o.lineWidth && ["4","6","8","10","12","15","20","25","30","40"].includes(o.lineWidth)){
      lineWidthSelect.value = o.lineWidth;
      lineWidthOther.value = "";
      lineWidthOther.disabled = true;
    }else if(o.lineWidth){
      lineWidthSelect.value = "other";
      lineWidthOther.disabled = o.locked ? true : false;
      lineWidthOther.value = o.lineWidth;
    }else{
      lineWidthSelect.value = "";
      lineWidthOther.value = "";
      lineWidthOther.disabled = true;
    }

    $("generatedOrderBox").value = buildOrderText(o);

    renderDoorDirectionUI();
    renderSizes();
    renderSheets();
    bindTextAreas();
    renderInvoice();
  }

  loadSelected();
}

/* Init */
document.addEventListener("DOMContentLoaded",()=>{
  initClient();
});
