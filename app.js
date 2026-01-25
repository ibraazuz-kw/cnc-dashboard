function $(id){ return document.getElementById(id); }

const LS = {
  SESSION:"pd_session",
  ORDERS:"pd_orders",
  INVOICES:"pd_invoices",
};

function loadJSON(k, fb){
  try{ return JSON.parse(localStorage.getItem(k) || "") ?? fb; }
  catch(e){ return fb; }
}
function saveJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

function getSession(){ return loadJSON(LS.SESSION, null); }
function clearSession(){ localStorage.removeItem(LS.SESSION); }

function getOrders(){ return loadJSON(LS.ORDERS, []); }
function saveOrders(list){ saveJSON(LS.ORDERS, list); }

function nowStr(){ return new Date().toLocaleString("ar-KW"); }
function genId(prefix){ return `${prefix}-${Date.now()}`; }

function badgeClass(status){
  return status === "جاهز" ? "badge ready" : "badge working";
}

function doorDiagram(type="single", dir="right"){
  if(type === "double"){
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
    clientCompany: session.company || session.username,
    status: "قيد التشغيل",
    locked: false,

    doorType: "",
    doorDirection: "right",
    lockSide: "",

    hasFix: false,

    sizes: [{hCm:"", wCm:"", qty:1}],
    sheetItems: [{size:"122x244", thicknessMm:"2", qty:1}],

    lineWidth: "",
    cutEngraveDetails:"",
    notes:"",
    files: [],

    designApproved:false,
    designNotes:"",

    invoiceId:null,
  };
}

/* =========================
   CLIENT PAGE
========================= */
function initClient(){
  const root = $("clientRoot");
  if(!root) return;

  const session = getSession();
  if(!session || session.role !== "client"){
    location.href = "index.html";
    return;
  }

  $("clientCompanyTitle").textContent = `👤 ${session.company || session.username}`;

  $("clientLogoutBtn").onclick = ()=>{
    clearSession();
    location.href="index.html";
  };

  // Tabs
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");

      const tabId = btn.dataset.tab;
      document.querySelectorAll(".tabPage").forEach(p=>p.classList.add("hidden"));
      $(tabId).classList.remove("hidden");
    });
  });

  // Orders
  let all = getOrders();
  let myOrders = all.filter(o=>o.clientUsername===session.username);

  if(myOrders.length===0){
    const o = createBlankOrder(session);
    all.push(o);
    saveOrders(all);
    myOrders = [o];
  }

  let selectedId = myOrders[myOrders.length-1].id;

  const orderSelect = $("clientOrderSelect");
  const statusBadge = $("clientStatusBadge");

  function refreshOrders(){
    all = getOrders();
    myOrders = all.filter(o=>o.clientUsername===session.username);

    orderSelect.innerHTML = myOrders
      .slice().reverse()
      .map(o=>`<option value="${o.id}">${o.id} | ${o.createdAt}</option>`)
      .join("");

    orderSelect.value = selectedId;
  }

  function getCurrentOrder(){
    return getOrders().find(o=>o.id===selectedId) || null;
  }

  function updateOrder(update){
    const list = getOrders();
    const idx = list.findIndex(o=>o.id===selectedId);
    if(idx === -1) return;
    list[idx] = {...list[idx], ...update};
    saveOrders(list);
  }

  function renderStatus(){
    const o = getCurrentOrder();
    if(!o) return;
    statusBadge.className = badgeClass(o.status);
    statusBadge.textContent = (o.status==="جاهز") ? "✅ جاهز" : "⏳ قيد التشغيل";
  }

  orderSelect.onchange = ()=>{
    selectedId = orderSelect.value;
    renderAll();
  };

  $("newOrderBtn").onclick = ()=>{
    const list = getOrders();
    const o = createBlankOrder(session);
    list.push(o);
    saveOrders(list);
    selectedId = o.id;
    refreshOrders();
    renderAll();
  };

  $("copyOrderBtn").onclick = ()=>{
    const o = getCurrentOrder();
    if(!o) return;
    const list = getOrders();
    const copy = {...o, id: genId("ORD"), createdAt: nowStr(), status:"قيد التشغيل"};
    list.push(copy);
    saveOrders(list);
    selectedId = copy.id;
    refreshOrders();
    renderAll();
    alert("✅ تم نسخ الطلب");
  };

  // Door UI
  const doorTypeSelect = $("doorTypeSelect");
  const doorDirectionArea = $("doorDirectionArea");
  const lockSideSelect = $("lockSideSelect");

  function renderDoor(){
    const o = getCurrentOrder();
    if(!o) return;

    doorTypeSelect.value = o.doorType || "";
    lockSideSelect.value = o.lockSide || "";

    const type = o.doorType || "single";

    if(type === "double"){
      doorDirectionArea.innerHTML = `
        <div class="row">
          <button class="btn btn-ghost" id="dd_in">مزدوج للداخل ${doorDiagram("double","in")}</button>
          <button class="btn btn-ghost" id="dd_out">مزدوج للخارج ${doorDiagram("double","out")}</button>
        </div>
      `;
      $("dd_in").onclick = ()=>{ updateOrder({doorDirection:"in"}); renderDoor(); };
      $("dd_out").onclick = ()=>{ updateOrder({doorDirection:"out"}); renderDoor(); };
    }else{
      doorDirectionArea.innerHTML = `
        <div class="row">
          <button class="btn btn-ghost" id="dd_right">يمين ${doorDiagram("single","right")}</button>
          <button class="btn btn-ghost" id="dd_left">يسار ${doorDiagram("single","left")}</button>
        </div>
      `;
      $("dd_right").onclick = ()=>{ updateOrder({doorDirection:"right"}); renderDoor(); };
      $("dd_left").onclick = ()=>{ updateOrder({doorDirection:"left"}); renderDoor(); };
    }
  }

  doorTypeSelect.onchange = ()=>{
    const v = doorTypeSelect.value;
    updateOrder({
      doorType: v,
      doorDirection: v==="double" ? "in" : "right"
    });
    renderDoor();
  };

  lockSideSelect.onchange = ()=>{
    updateOrder({lockSide: lockSideSelect.value});
  };

  $("addFixBtn").onclick = ()=>{
    updateOrder({hasFix:true});
    alert("✅ تم إضافة فكس فوق الباب");
    renderSizes();
  };

  // Sizes
  const sizesContainer = $("sizesContainer");

  function renderSizes(){
    const o = getCurrentOrder();
    if(!o) return;

    sizesContainer.innerHTML = "";

    if(o.hasFix){
      sizesContainer.innerHTML += `
      <div class="measure-item">
        <div class="measure-head">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="num-pill">F</div>
            <div style="font-weight:800">فكس فوق الباب</div>
          </div>
          <button class="btn btn-red" id="removeFixBtn" style="width:auto;padding:10px 12px">حذف</button>
        </div>
        <div class="help">تم إضافة فكس (التفاصيل لاحقاً)</div>
      </div>
      `;
      $("removeFixBtn").onclick = ()=>{
        updateOrder({hasFix:false});
        renderSizes();
      };
    }

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
            <input data-i="${i}" data-k="hCm" value="${s.hCm||""}" placeholder="مثال: 210"/>
          </div>
          <div>
            <label>العرض (سم)</label>
            <input data-i="${i}" data-k="wCm" value="${s.wCm||""}" placeholder="مثال: 110"/>
          </div>
        </div>

        <label>العدد</label>
        <input type="number" min="1" data-i="${i}" data-k="qty" value="${s.qty||1}"/>
      </div>
      `;
    });

    sizesContainer.querySelectorAll("input[data-i]").forEach(el=>{
      el.oninput = ()=>{
        const o = getCurrentOrder();
        const i = Number(el.dataset.i);
        const k = el.dataset.k;
        o.sizes[i][k] = el.value;
        updateOrder({sizes:o.sizes});
      };
    });

    sizesContainer.querySelectorAll("button[data-del]").forEach(btn=>{
      btn.onclick = ()=>{
        const o = getCurrentOrder();
        if(o.sizes.length===1){ alert("لا يمكن حذف آخر قياس"); return; }
        o.sizes.splice(Number(btn.dataset.del),1);
        updateOrder({sizes:o.sizes});
        renderSizes();
      };
    });
  }

  $("addSizeBtn").onclick = ()=>{
    const o = getCurrentOrder();
    o.sizes.push({hCm:"", wCm:"", qty:1});
    updateOrder({sizes:o.sizes});
    renderSizes();
  };

  // Line width
  const lineWidthSelect = $("lineWidthSelect");
  const lineWidthOther = $("lineWidthOther");

  lineWidthSelect.onchange = ()=>{
    if(lineWidthSelect.value==="other"){
      lineWidthOther.disabled = false;
      lineWidthOther.focus();
    }else{
      lineWidthOther.disabled = true;
      lineWidthOther.value = "";
      updateOrder({lineWidth: lineWidthSelect.value});
    }
  };

  lineWidthOther.oninput = ()=>{
    updateOrder({lineWidth: lineWidthOther.value});
  };

  // Textareas
  const cutEngraveDetails = $("cutEngraveDetails");
  const notesInput = $("notesInput");

  function bindText(){
    const o = getCurrentOrder();
    cutEngraveDetails.value = o.cutEngraveDetails || "";
    notesInput.value = o.notes || "";

    cutEngraveDetails.oninput = ()=> updateOrder({cutEngraveDetails: cutEngraveDetails.value});
    notesInput.oninput = ()=> updateOrder({notes: notesInput.value});
  }

  // Files
  $("fileInput").onchange = ()=>{
    const files = Array.from($("fileInput").files || []).map(f=>f.name);
    updateOrder({files});
    alert("✅ تم حفظ أسماء الملفات");
  };

  // Buttons
  $("saveDraftBtn").onclick = ()=>{
    alert("✅ تم حفظ المسودة");
  };

  $("sendToAdminBtn").onclick = ()=>{
    alert("📩 تم إرسال أمر تشغيل CNC للأدمن (نسخة MVP)");
  };

  $("copyTextBtn").onclick = ()=>{
    const o = getCurrentOrder();
    navigator.clipboard.writeText(JSON.stringify(o, null, 2));
    alert("📋 تم نسخ بيانات الطلب");
  };

  $("downloadPdfBtn").onclick = ()=>{
    alert("📄 PDF سيتم ربطه لاحقاً");
  };

  // Sheets (مبدئي)
  const sheetContainer = $("sheetContainer");

  function renderSheets(){
    const o = getCurrentOrder();
    sheetContainer.innerHTML = `
      <div class="help">طلب الشيتات (نسخة MVP)</div>
      <div class="badge">عدد الشيتات: ${(o.sheetItems||[]).length}</div>
    `;
  }

  $("addSheetBtn").onclick = ()=>{
    const o = getCurrentOrder();
    o.sheetItems.push({size:"122x244", thicknessMm:"2", qty:1});
    updateOrder({sheetItems:o.sheetItems});
    renderSheets();
  };

  $("downloadSheetPdfBtn").onclick = ()=>{
    alert("📄 PDF طلب الشيت سيتم ربطه لاحقاً");
  };

  // Design
  $("approveDesignBtn").onclick = ()=>{
    updateOrder({designApproved:true});
    alert("✅ تم تأكيد التنفيذ");
  };

  $("designNotes").oninput = ()=>{
    updateOrder({designNotes: $("designNotes").value});
  };

  function renderAll(){
    refreshOrders();
    renderStatus();
    renderDoor();
    renderSizes();
    renderSheets();
    bindText();
  }

  renderAll();
}

/* =========================
   ADMIN PAGE
========================= */
function initAdmin(){
  const root = $("adminRoot");
  if(!root) return;

  const session = getSession();
  if(!session || session.role !== "admin"){
    location.href = "index.html";
    return;
  }

  $("adminLogoutBtn").onclick = ()=>{
    clearSession();
    location.href="index.html";
  };

  const orderSelect = $("adminOrderSelect");
  const details = $("adminOrderDetails");

  function refreshOrders(){
    const orders = getOrders();
    orderSelect.innerHTML = orders
      .slice().reverse()
      .map(o=>`<option value="${o.id}">${o.clientCompany} | ${o.id}</option>`)
      .join("");
  }

  function getSelected(){
    const id = orderSelect.value;
    return getOrders().find(o=>o.id===id) || null;
  }

  function renderDetails(){
    const o = getSelected();
    if(!o){
      details.textContent = "اختر طلب من القائمة 👆";
      return;
    }
    details.textContent = `العميل: ${o.clientCompany} | الحالة: ${o.status} | تاريخ: ${o.createdAt}`;
    $("adminStatus").value = o.status || "قيد التشغيل";
  }

  $("saveStatusBtn").onclick = ()=>{
    const o = getSelected();
    if(!o) return;
    const list = getOrders();
    const idx = list.findIndex(x=>x.id===o.id);
    list[idx].status = $("adminStatus").value;
    saveOrders(list);
    alert("✅ تم حفظ الحالة");
    renderDetails();
  };

  orderSelect.onchange = renderDetails;

  refreshOrders();
  renderDetails();
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", ()=>{
  initClient();
  initAdmin();
});
