function $(id){ return document.getElementById(id); }

const LS = {
  SESSION:"pd_session",
  ORDERS:"pd_orders",
};

function loadJSON(k, fb){
  try{ return JSON.parse(localStorage.getItem(k) || "") ?? fb; }
  catch(e){ return fb; }
}
function saveJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

function getSession(){ return loadJSON(LS.SESSION, null); }
function saveSession(v){ saveJSON(LS.SESSION, v); }
function clearSession(){ localStorage.removeItem(LS.SESSION); }

function getOrders(){ return loadJSON(LS.ORDERS, []); }
function saveOrders(list){ saveJSON(LS.ORDERS, list); }

function nowStr(){ return new Date().toLocaleString("ar-KW"); }
function genId(prefix){ return `${prefix}-${Date.now()}`; }

function badgeClass(status){
  return status === "جاهز" ? "badge ready" : "badge working";
}

function goTo(path){
  location.href = path;
}

function ensureRole(requiredRole){
  const session = getSession();
  if(!session || session.role !== requiredRole){
    clearSession();
    goTo("/");
    return null;
  }
  return session;
}

/* =========================
   Models
========================= */
function createBlankMeasurement(){
  return {
    hCm:"",
    wCm:"",
    qty:1,

    doorType:"single",   // single | oneHalf | double
    direction:"right",   // right | left
    lockLeaf:"",         // rightLeaf | leftLeaf (for double only)

    hasFix:false,
    fixMode:"auto",      // auto | custom
    fixWidth:"",
    fixHeight:"",
  };
}

function createBlankOrder(session){
  return {
    id: genId("ORD"),
    createdAt: nowStr(),
    clientUsername: session.username,
    clientCompany: session.company || session.username,
    status: "قيد التشغيل",

    lineWidth: "",
    cutEngraveDetails:"",
    notes:"",
    files: [],

    measurements: [ createBlankMeasurement() ],

    invoice:{
      cut:0,
      engrave:0,
      sheet:0,
      notes:""
    }
  };
}

/* =========================
   INDEX
========================= */
function initIndex(){
  const roleSelect = $("roleSelect");
  const usernameInput = $("usernameInput");
  const companyInput = $("companyInput");
  const loginBtn = $("loginBtn");

  if(!roleSelect || !usernameInput || !loginBtn) return;

  const session = getSession();
  if(session?.role === "client") return goTo("/client.html");
  if(session?.role === "admin") return goTo("/admin.html");

  roleSelect.onchange = ()=>{
    const role = roleSelect.value;
    companyInput.disabled = (role !== "client");
    if(role !== "client") companyInput.value = "";
  };
  roleSelect.dispatchEvent(new Event("change"));

  loginBtn.onclick = ()=>{
    const role = roleSelect.value;
    const username = (usernameInput.value || "").trim();
    if(!username){
      alert("⚠️ اكتب اسم المستخدم");
      return;
    }

    const sessionObj = {
      role,
      username,
      company: role==="client" ? (companyInput.value || "").trim() : ""
    };

    saveSession(sessionObj);

    if(role==="client") goTo("/client.html");
    else goTo("/admin.html");
  };
}

/* =========================
   CLIENT
========================= */
function initClient(){
  const root = $("clientRoot");
  if(!root) return;

  const session = ensureRole("client");
  if(!session) return;

  $("clientCompanyTitle").textContent = `👤 ${session.company || session.username}`;

  $("clientLogoutBtn").onclick = ()=>{
    clearSession();
    goTo("/");
  };

  // Tabs
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");

      const tabId = btn.dataset.tab;
      document.querySelectorAll(".tabPage").forEach(p=>p.classList.add("hidden"));
      $(tabId).classList.remove("hidden");
      window.scrollTo({top:0, behavior:"smooth"});
    });
  });

  // Orders
  let allOrders = getOrders();
  let myOrders = allOrders.filter(o=>o.clientUsername===session.username);

  if(myOrders.length===0){
    const o = createBlankOrder(session);
    allOrders.push(o);
    saveOrders(allOrders);
    myOrders = [o];
  }

  let selectedId = myOrders[myOrders.length-1].id;

  const orderSelect = $("clientOrderSelect");
  const statusBadge = $("clientStatusBadge");
  const msg = $("clientMsg");

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

  function refreshOrders(){
    allOrders = getOrders();
    myOrders = allOrders.filter(o=>o.clientUsername===session.username);

    orderSelect.innerHTML = myOrders
      .slice().reverse()
      .map(o=>`<option value="${o.id}">${o.id} | ${o.createdAt}</option>`)
      .join("");

    if(!myOrders.find(x=>x.id===selectedId)){
      selectedId = myOrders[myOrders.length-1]?.id || "";
    }
    orderSelect.value = selectedId;
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

  // Global fields
  const lineWidthSelect = $("lineWidthSelect");
  const lineWidthOther = $("lineWidthOther");
  const cutEngraveDetails = $("cutEngraveDetails");
  const notesInput = $("notesInput");
  const fileInput = $("fileInput");

  function bindGlobalFields(){
    const o = getCurrentOrder();
    if(!o) return;

    const lw = o.lineWidth || "";
    const preset = ["4","6","8","10","12","15","20","25","30","40"];

    if(preset.includes(lw)){
      lineWidthSelect.value = lw;
      lineWidthOther.value = "";
      lineWidthOther.disabled = true;
    }else if(lw){
      lineWidthSelect.value = "other";
      lineWidthOther.disabled = false;
      lineWidthOther.value = lw;
    }else{
      lineWidthSelect.value = "";
      lineWidthOther.value = "";
      lineWidthOther.disabled = true;
    }

    lineWidthSelect.onchange = ()=>{
      if(lineWidthSelect.value === "other"){
        lineWidthOther.disabled = false;
        lineWidthOther.focus();
      }else{
        lineWidthOther.disabled = true;
        lineWidthOther.value = "";
        updateOrder({lineWidth: lineWidthSelect.value});
      }
    };

    lineWidthOther.oninput = ()=>{
      updateOrder({lineWidth: lineWidthOther.value.trim()});
    };

    cutEngraveDetails.value = o.cutEngraveDetails || "";
    notesInput.value = o.notes || "";

    cutEngraveDetails.oninput = ()=> updateOrder({cutEngraveDetails: cutEngraveDetails.value});
    notesInput.oninput = ()=> updateOrder({notes: notesInput.value});

    fileInput.onchange = ()=>{
      const files = Array.from(fileInput.files || []).map(f=>f.name);
      updateOrder({files});
      alert("✅ تم حفظ أسماء الملفات");
    };
  }

  /* =========================
     Door CAD Arrow (Modern)
  ========================= */
  function doorCadArrowSVG(dir){
    // dir: right | left
    const hingeX = (dir === "right") ? 14 : 86;
    const leafToX = (dir === "right") ? 82 : 18;
    const arcSweep = (dir === "right") ? 0 : 1;

    // NOTE: pure SVG no external libs
    return `
      <svg viewBox="0 0 100 70" width="100%" height="64" aria-hidden="true">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="rgba(47,123,255,.75)"/>
            <stop offset="1" stop-color="rgba(47,123,255,.20)"/>
          </linearGradient>
        </defs>

        <!-- frame -->
        <rect x="6" y="8" width="88" height="54" rx="12"
          fill="rgba(0,0,0,.20)" stroke="rgba(255,255,255,.16)" stroke-width="1.2"/>

        <!-- hinge line -->
        <line x1="${hingeX}" y1="16" x2="${hingeX}" y2="54"
          stroke="rgba(255,255,255,.35)" stroke-width="2" stroke-linecap="round"/>

        <!-- door leaf -->
        <line x1="${hingeX}" y1="54" x2="${leafToX}" y2="28"
          stroke="url(#g)" stroke-width="5" stroke-linecap="round"/>

        <!-- swing arc -->
        <path d="M ${hingeX} 54 A 26 26 0 0 ${arcSweep} ${leafToX} 28"
          fill="none" stroke="rgba(47,123,255,.55)" stroke-width="2.2" stroke-dasharray="3 3"/>

        <!-- handle dot -->
        <circle cx="${dir==="right" ? 64 : 36}" cy="40" r="2.6" fill="rgba(255,255,255,.65)"/>
      </svg>
    `;
  }

  /* =========================
     Measurements (NO CROWD)
     Direction CAD + Lock + Fix
  ========================= */
  const container = $("measurementsContainer");

  function renderMeasurements(){
    const o = getCurrentOrder();
    if(!o) return;

    const mList = o.measurements || [];
    container.innerHTML = "";

    mList.forEach((m, idx)=>{
      const showLock = (m.doorType === "double"); // as requested

      container.innerHTML += `
        <div class="measure-item">
          <div class="mCardTop">
            <div class="mTitle">
              <div class="num-pill">${idx+1}</div>
              <div class="txt">قياس الباب</div>
            </div>

            <div class="mActions">
              <button class="btn btn-ghost miniBtn" data-togglefix="${idx}">
                ${m.hasFix ? "⬆️ تعديل الفكس" : "➕ إضافة فكس"}
              </button>
              <button class="btn btn-red miniBtn" data-del="${idx}">حذف</button>
            </div>
          </div>

          <div class="dividerSoft"></div>

          <div class="measureGrid" style="display:grid;grid-template-columns:1.25fr .95fr;gap:12px;">
            <!-- LEFT: القياسات -->
            <div>
              <div class="twoCols">
                <div>
                  <label>الارتفاع (سم)</label>
                  <input data-i="${idx}" data-k="hCm" value="${m.hCm||""}" placeholder="مثال: 210"/>
                </div>
                <div>
                  <label>العرض (سم)</label>
                  <input data-i="${idx}" data-k="wCm" value="${m.wCm||""}" placeholder="مثال: 110"/>
                </div>
              </div>

              <div class="twoCols" style="margin-top:8px">
                <div>
                  <label>العدد</label>
                  <input type="number" min="1" data-i="${idx}" data-k="qty" value="${m.qty||1}"/>
                </div>
                <div>
                  <label>نوع الباب</label>
                  <select data-i="${idx}" data-k="doorType">
                    <option value="single" ${m.doorType==="single"?"selected":""}>باب مفرد</option>
                    <option value="oneHalf" ${m.doorType==="oneHalf"?"selected":""}>باب ونص</option>
                    <option value="double" ${m.doorType==="double"?"selected":""}>باب دبل</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- RIGHT: اتجاه + قفل + فكس -->
            <div class="sideBox" style="
              border:1px solid rgba(255,255,255,.08);
              background: rgba(255,255,255,.03);
              border-radius: 16px;
              padding: 10px;
            ">
              <label>اتجاه فتحة الباب</label>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <button class="dirCad ${m.direction==="right"?"active":""}" data-dir="${idx}" data-v="right"
                  style="
                    border-radius:16px;
                    border:1px solid rgba(255,255,255,.10);
                    background:${m.direction==="right" ? "rgba(47,123,255,.14)" : "rgba(0,0,0,.18)"};
                    padding:10px;
                    cursor:pointer;
                    color:inherit;
                    text-align:center;
                  ">
                  <div style="font-weight:900;margin-bottom:6px;">يمين</div>
                  ${doorCadArrowSVG("right")}
                </button>

                <button class="dirCad ${m.direction==="left"?"active":""}" data-dir="${idx}" data-v="left"
                  style="
                    border-radius:16px;
                    border:1px solid rgba(255,255,255,.10);
                    background:${m.direction==="left" ? "rgba(47,123,255,.14)" : "rgba(0,0,0,.18)"};
                    padding:10px;
                    cursor:pointer;
                    color:inherit;
                    text-align:center;
                  ">
                  <div style="font-weight:900;margin-bottom:6px;">يسار</div>
                  ${doorCadArrowSVG("left")}
                </button>
              </div>

              ${showLock ? `
                <label style="margin-top:10px">مكان القفل (للـ دبل)</label>
                <select data-i="${idx}" data-k="lockLeaf">
                  <option value="" ${m.lockLeaf===""?"selected":""}>بدون تحديد</option>
                  <option value="rightLeaf" ${m.lockLeaf==="rightLeaf"?"selected":""}>القفل على الضلفة اليمين</option>
                  <option value="leftLeaf" ${m.lockLeaf==="leftLeaf"?"selected":""}>القفل على الضلفة اليسار</option>
                </select>
              ` : ``}

              ${m.hasFix ? `
                <div class="fixBox" style="
                  border:1px dashed rgba(47,123,255,.35);
                  background: rgba(47,123,255,.08);
                  border-radius:16px;
                  padding:12px;
                  margin-top:10px;
                ">
                  <div class="fixHead" style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
                    <div style="font-weight:900">⬆️ فكس فوق الباب</div>
                    <button class="btn btn-red miniBtn" data-removefix="${idx}">حذف الفكس</button>
                  </div>

                  <div style="font-size:12px;color: rgba(234,241,255,.60);margin-top:6px;">
                    الفكس دائماً فوق الباب (مفرد / باب ونص / دبل)
                  </div>

                  <label>عرض الفكس</label>
                  <select data-i="${idx}" data-k="fixMode">
                    <option value="auto" ${m.fixMode==="auto"?"selected":""}>تلقائي (نفس عرض الباب)</option>
                    <option value="custom" ${m.fixMode==="custom"?"selected":""}>يدوي</option>
                  </select>

                  <div class="twoCols" style="margin-top:8px">
                    <div>
                      <label>عرض الفكس (سم)</label>
                      <input data-i="${idx}" data-k="fixWidth"
                        ${m.fixMode==="auto" ? "disabled" : ""}
                        value="${m.fixMode==="auto" ? (m.wCm||"") : (m.fixWidth||"")}"
                        placeholder="مثال: 110"/>
                    </div>
                    <div>
                      <label>ارتفاع الفكس (سم)</label>
                      <input data-i="${idx}" data-k="fixHeight" value="${m.fixHeight||""}" placeholder="مثال: 40"/>
                    </div>
                  </div>
                </div>
              ` : ``}
            </div>
          </div>
        </div>
      `;
    });

    // Bind inputs & selects
    container.querySelectorAll("input[data-i], select[data-i]").forEach(el=>{
      const i = Number(el.dataset.i);
      const k = el.dataset.k;

      const apply = ()=>{
        const o2 = getCurrentOrder();
        const m2 = o2.measurements[i];

        if(k === "qty"){
          m2[k] = Number(el.value || 1);
        }else{
          m2[k] = el.value;
        }

        // if doorType not double => remove lock
        if(k === "doorType"){
          if(m2.doorType !== "double"){
            m2.lockLeaf = "";
          }
        }

        // fix auto width
        if(k === "fixMode"){
          if(m2.fixMode === "auto"){
            m2.fixWidth = "";
          }
        }

        updateOrder({measurements: o2.measurements});
        renderMeasurements();
      };

      el.oninput = apply;
      el.onchange = apply;
    });

    // Direction CAD buttons
    container.querySelectorAll("button[data-dir]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.dir);
        const v = btn.dataset.v;

        const o2 = getCurrentOrder();
        o2.measurements[i].direction = v;

        updateOrder({measurements: o2.measurements});
        renderMeasurements();
      };
    });

    // Fix toggle/add
    container.querySelectorAll("button[data-togglefix]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.togglefix);
        const o2 = getCurrentOrder();
        const m2 = o2.measurements[i];

        m2.hasFix = true;
        if(!m2.fixMode) m2.fixMode = "auto";

        updateOrder({measurements: o2.measurements});
        renderMeasurements();
      };
    });

    // Remove fix
    container.querySelectorAll("button[data-removefix]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.removefix);
        const o2 = getCurrentOrder();
        const m2 = o2.measurements[i];

        m2.hasFix = false;
        m2.fixWidth = "";
        m2.fixHeight = "";

        updateOrder({measurements: o2.measurements});
        renderMeasurements();
      };
    });

    // Delete measurement
    container.querySelectorAll("button[data-del]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.del);
        const o2 = getCurrentOrder();

        if(o2.measurements.length === 1){
          alert("لا يمكن حذف آخر قياس");
          return;
        }

        o2.measurements.splice(i,1);
        updateOrder({measurements: o2.measurements});
        renderMeasurements();
      };
    });
  }

  $("addMeasureBtn").onclick = ()=>{
    const o = getCurrentOrder();
    o.measurements.push(createBlankMeasurement());
    updateOrder({measurements:o.measurements});
    renderMeasurements();
  };

  $("saveDraftBtn").onclick = ()=>{
    msg.textContent = "✅ تم حفظ المسودة";
    msg.style.color = "#b7ffd9";
    setTimeout(()=>{ msg.textContent=""; }, 1500);
  };

  $("copyOrderTextBtn").onclick = ()=>{
    const o = getCurrentOrder();
    navigator.clipboard.writeText(JSON.stringify(o, null, 2));
    alert("📋 تم نسخ تفاصيل الطلب");
  };

  $("sendCncBtn").onclick = ()=>{
    alert("🚀 تم إرسال أمر تشغيل CNC (نسخة MVP)");
  };

  $("addSheetBtn").onclick = ()=>{
    $("sheetsMsg").textContent = "✅ تم إضافة شيت (MVP قريباً)";
  };

  $("approveDesignBtn").onclick = ()=>{
    alert("✅ تم اعتماد التنفيذ (MVP)");
  };

  function renderAll(){
    refreshOrders();
    renderStatus();
    bindGlobalFields();
    renderMeasurements();
  }

  renderAll();
}

/* =========================
   ADMIN
========================= */
function initAdmin(){
  const root = $("adminRoot");
  if(!root) return;

  const session = ensureRole("admin");
  if(!session) return;

  $("adminLogoutBtn").onclick = ()=>{
    clearSession();
    goTo("/");
  };

  const adminSearchInput = $("adminSearchInput");
  const adminOrderSelect = $("adminOrderSelect");
  const adminStatusSelect = $("adminStatusSelect");
  const adminSaveStatusBtn = $("adminSaveStatusBtn");
  const adminMsg = $("adminMsg");

  const invCut = $("invCut");
  const invEngrave = $("invEngrave");
  const invSheet = $("invSheet");
  const invNotes = $("invNotes");
  const saveInvoiceBtn = $("saveInvoiceBtn");
  const invoiceMsg = $("invoiceMsg");

  let selectedId = "";

  function listOrdersFiltered(){
    const q = (adminSearchInput.value || "").trim().toLowerCase();
    const list = getOrders();

    if(!q) return list;

    return list.filter(o=>{
      return (o.id || "").toLowerCase().includes(q)
        || (o.clientCompany || "").toLowerCase().includes(q)
        || (o.clientUsername || "").toLowerCase().includes(q);
    });
  }

  function refreshSelect(){
    const list = listOrdersFiltered();

    adminOrderSelect.innerHTML = list
      .slice().reverse()
      .map(o=>`<option value="${o.id}">${o.id} | ${o.clientCompany} | ${o.createdAt}</option>`)
      .join("");

    if(!selectedId && list.length) selectedId = list[list.length-1].id;

    adminOrderSelect.value = selectedId;
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

  function renderOrder(){
    const o = getCurrentOrder();
    if(!o) return;

    adminStatusSelect.value = o.status || "قيد التشغيل";

    const inv = o.invoice || {cut:0, engrave:0, sheet:0, notes:""};
    invCut.value = inv.cut ?? 0;
    invEngrave.value = inv.engrave ?? 0;
    invSheet.value = inv.sheet ?? 0;
    invNotes.value = inv.notes ?? "";
  }

  adminSearchInput.oninput = ()=>{
    refreshSelect();
    renderOrder();
  };

  adminOrderSelect.onchange = ()=>{
    selectedId = adminOrderSelect.value;
    renderOrder();
  };

  adminSaveStatusBtn.onclick = ()=>{
    const o = getCurrentOrder();
    if(!o) return;
    updateOrder({status: adminStatusSelect.value});
    adminMsg.textContent = "✅ تم حفظ الحالة";
    setTimeout(()=> adminMsg.textContent="", 1200);
  };

  saveInvoiceBtn.onclick = ()=>{
    const o = getCurrentOrder();
    if(!o) return;

    const invoice = {
      cut: Number(invCut.value || 0),
      engrave: Number(invEngrave.value || 0),
      sheet: Number(invSheet.value || 0),
      notes: (invNotes.value || "").trim()
    };

    updateOrder({invoice});
    invoiceMsg.textContent = "✅ تم حفظ الفاتورة";
    setTimeout(()=> invoiceMsg.textContent="", 1200);
  };

  refreshSelect();
  renderOrder();
}
