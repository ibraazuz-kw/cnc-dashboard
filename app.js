function $(id){ return document.getElementById(id); }

const LS = {
  SESSION:"pd_session",
  ORDERS:"pd_orders",
  VERSION:"pd_version",
};

const APP_VERSION = "2.0.0"; // change if structure changes

function loadJSON(k, fb){
  try{
    const raw = localStorage.getItem(k);
    if(!raw) return fb;
    return JSON.parse(raw);
  }catch(e){
    return fb;
  }
}
function saveJSON(k, v){ localStorage.setItem(k, JSON.stringify(v)); }

function getSession(){ return loadJSON(LS.SESSION, null); }
function clearSession(){ localStorage.removeItem(LS.SESSION); }

function getOrders(){ return loadJSON(LS.ORDERS, []); }
function saveOrders(list){ saveJSON(LS.ORDERS, list); }

function nowStr(){ return new Date().toLocaleString("ar-KW"); }
function genId(prefix){ return `${prefix}-${Date.now()}-${Math.floor(Math.random()*999)}`; }

function badgeClass(status){
  return status === "جاهز" ? "badge ready" : "badge working";
}

/* ========= Safety / Reset ========= */
function resetAll(){
  localStorage.removeItem(LS.ORDERS);
  localStorage.removeItem(LS.SESSION);
  localStorage.removeItem(LS.VERSION);
}

function ensureVersion(){
  const current = localStorage.getItem(LS.VERSION);
  if(current !== APP_VERSION){
    // reset only orders to avoid broken structures
    localStorage.removeItem(LS.ORDERS);
    localStorage.setItem(LS.VERSION, APP_VERSION);
  }
}

function urlHasReset(){
  try{
    const u = new URL(location.href);
    return u.searchParams.get("reset") === "1";
  }catch(e){
    return false;
  }
}

/* ========= Order Model ========= */
function createBlankMeasurement(){
  return {
    hCm:"",
    wCm:"",
    qty:1,

    doorType:"single", // single | oneHalf | double
    direction:"right", // right | left
    lockLeaf:"",       // rightLeaf | leftLeaf (only for double/oneHalf)
    hasFix:false,
    fixWidth:"",
    fixHeight:"",
    fixAuto:true,      // auto width = door width
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
  };
}

/* ========= Helpers ========= */
function safeText(v){ return (v ?? "").toString().replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function getById(list, id){
  return list.find(x=>x.id===id) || null;
}

function updateOrderById(orderId, patch){
  const list = getOrders();
  const idx = list.findIndex(o=>o.id===orderId);
  if(idx === -1) return;
  list[idx] = {...list[idx], ...patch};
  saveOrders(list);
}

function ensureOrderStructure(order){
  // Make sure order has measurements array
  if(!Array.isArray(order.measurements)) order.measurements = [createBlankMeasurement()];

  order.measurements = order.measurements.map(m=>{
    const mm = {...createBlankMeasurement(), ...(m||{})};

    // Normalize
    if(!mm.qty || mm.qty < 1) mm.qty = 1;
    if(mm.doorType === "single") mm.lockLeaf = "";

    // Fix width auto
    if(mm.fixAuto){
      mm.fixWidth = "";
    }

    return mm;
  });

  return order;
}

/* ========= Client Init ========= */
function initClient(){
  const root = $("clientRoot");
  if(!root) return;

  // reset from url
  if(urlHasReset()){
    localStorage.removeItem(LS.ORDERS);
    localStorage.setItem(LS.VERSION, APP_VERSION);
    alert("✅ تم تصفير بيانات الطلبات داخل هذا الجهاز فقط");
    location.href = location.pathname; // remove ?reset=1
    return;
  }

  ensureVersion();

  const session = getSession();
  if(!session || session.role !== "client"){
    location.href = "index.html";
    return;
  }

  const companyTitle = $("clientCompanyTitle");
  if(companyTitle){
    companyTitle.textContent = `👤 ${session.company || session.username}`;
  }

  const logoutBtn = $("clientLogoutBtn");
  if(logoutBtn){
    logoutBtn.onclick = ()=>{
      clearSession();
      location.href="index.html";
    };
  }

  /* Tabs */
  const tabButtons = document.querySelectorAll(".tab");
  const tabPages = document.querySelectorAll(".tabPage");

  function openTab(tabId){
    tabButtons.forEach(x=>x.classList.remove("active"));
    tabPages.forEach(p=>p.classList.add("hidden"));

    const btn = document.querySelector(`.tab[data-tab="${tabId}"]`);
    const page = $(tabId);

    if(btn) btn.classList.add("active");
    if(page) page.classList.remove("hidden");
  }

  tabButtons.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      openTab(btn.dataset.tab);
    });
  });

  // Ensure default tab
  openTab("tab_measurements");

  /* Orders */
  let allOrders = getOrders();
  let myOrders = allOrders.filter(o=>o.clientUsername===session.username).map(ensureOrderStructure);

  if(myOrders.length===0){
    const o = createBlankOrder(session);
    allOrders.push(o);
    saveOrders(allOrders);
    myOrders = [o];
  }else{
    // Save back normalized structure
    const fixed = getOrders().map(ensureOrderStructure);
    saveOrders(fixed);
  }

  let selectedId = myOrders[myOrders.length-1].id;

  const orderSelect = $("clientOrderSelect");
  const statusBadge = $("clientStatusBadge");
  const msg = $("clientMsg");

  function getCurrentOrder(){
    const list = getOrders().map(ensureOrderStructure);
    return getById(list, selectedId);
  }

  function refreshOrders(){
    const list = getOrders().map(ensureOrderStructure);
    const mine = list.filter(o=>o.clientUsername===session.username);

    if(orderSelect){
      orderSelect.innerHTML = mine
        .slice().reverse()
        .map(o=>`<option value="${o.id}">${safeText(o.id)} | ${safeText(o.createdAt)}</option>`)
        .join("");
      orderSelect.value = selectedId;
    }
  }

  function renderStatus(){
    const o = getCurrentOrder();
    if(!o || !statusBadge) return;
    statusBadge.className = badgeClass(o.status);
    statusBadge.textContent = (o.status==="جاهز") ? "✅ جاهز" : "⏳ قيد التشغيل";
  }

  if(orderSelect){
    orderSelect.onchange = ()=>{
      selectedId = orderSelect.value;
      renderAll();
    };
  }

  const newOrderBtn = $("newOrderBtn");
  if(newOrderBtn){
    newOrderBtn.onclick = ()=>{
      const list = getOrders();
      const o = createBlankOrder(session);
      list.push(o);
      saveOrders(list);
      selectedId = o.id;
      refreshOrders();
      renderAll();
    };
  }

  const copyOrderBtn = $("copyOrderBtn");
  if(copyOrderBtn){
    copyOrderBtn.onclick = ()=>{
      const o = getCurrentOrder();
      if(!o) return;
      const list = getOrders();
      const copy = {
        ...JSON.parse(JSON.stringify(o)),
        id: genId("ORD"),
        createdAt: nowStr(),
        status:"قيد التشغيل"
      };
      list.push(copy);
      saveOrders(list);
      selectedId = copy.id;
      refreshOrders();
      renderAll();
      alert("✅ تم نسخ الطلب");
    };
  }

  /* Global Fields */
  const lineWidthSelect = $("lineWidthSelect");
  const lineWidthOther = $("lineWidthOther");
  const cutEngraveDetails = $("cutEngraveDetails");
  const notesInput = $("notesInput");
  const fileInput = $("fileInput");

  function bindGlobalFields(){
    const o = getCurrentOrder();
    if(!o) return;

    // line width
    if(lineWidthSelect && lineWidthOther){
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
          updateOrderById(selectedId, {lineWidth: lineWidthSelect.value});
        }
      };

      lineWidthOther.oninput = ()=>{
        updateOrderById(selectedId, {lineWidth: lineWidthOther.value.trim()});
      };
    }

    if(cutEngraveDetails){
      cutEngraveDetails.value = o.cutEngraveDetails || "";
      cutEngraveDetails.oninput = ()=> updateOrderById(selectedId, {cutEngraveDetails: cutEngraveDetails.value});
    }

    if(notesInput){
      notesInput.value = o.notes || "";
      notesInput.oninput = ()=> updateOrderById(selectedId, {notes: notesInput.value});
    }

    if(fileInput){
      fileInput.onchange = ()=>{
        const files = Array.from(fileInput.files || []).map(f=>f.name);
        updateOrderById(selectedId, {files});
        alert("✅ تم حفظ أسماء الملفات");
      };
    }
  }

  /* Measurements UI (Cleaner / No Crowd) */
  const container = $("measurementsContainer");

  function renderMeasurements(){
    const o = getCurrentOrder();
    if(!o || !container) return;

    container.innerHTML = "";

    const mList = o.measurements || [];

    mList.forEach((m, idx)=>{
      const isDoubleLike = (m.doorType === "double" || m.doorType === "oneHalf");

      container.innerHTML += `
        <div class="measure-item">
          <div class="mCardTop">
            <div class="mTitle">
              <div class="num-pill">${idx+1}</div>
              <div class="txt">قياس الباب</div>
            </div>

            <div class="mActions">
              <button class="btn btn-ghost miniBtn" data-fix="${idx}">➕ فكس</button>
              <button class="btn btn-red miniBtn" data-del="${idx}">حذف</button>
            </div>
          </div>

          <div class="dividerSoft"></div>

          <!-- Row 1: H/W -->
          <div class="twoCols">
            <div>
              <label>الارتفاع (سم)</label>
              <input inputmode="numeric" data-i="${idx}" data-k="hCm" value="${safeText(m.hCm)}" placeholder="مثال: 210"/>
            </div>
            <div>
              <label>العرض (سم)</label>
              <input inputmode="numeric" data-i="${idx}" data-k="wCm" value="${safeText(m.wCm)}" placeholder="مثال: 110"/>
            </div>
          </div>

          <!-- Row 2: Qty / DoorType -->
          <div class="twoCols">
            <div>
              <label>العدد</label>
              <input type="number" min="1" data-i="${idx}" data-k="qty" value="${safeText(m.qty||1)}"/>
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

          <!-- Row 3: Direction + Lock (same row) -->
          <div class="twoCols" style="margin-top:6px">
            <div>
              <label>اتجاه فتحة الباب</label>
              <div class="dirBtns">
                <button type="button" class="dirBtn ${m.direction==="right"?"active":""}" data-dir="${idx}" data-v="right">يمين</button>
                <button type="button" class="dirBtn ${m.direction==="left"?"active":""}" data-dir="${idx}" data-v="left">يسار</button>
              </div>
            </div>

            <div>
              <label>مكان القفل</label>
              <select data-i="${idx}" data-k="lockLeaf" ${isDoubleLike ? "" : "disabled"}>
                <option value="" ${m.lockLeaf===""?"selected":""}>${isDoubleLike ? "بدون تحديد" : "غير متاح (مفرد)"}</option>
                <option value="rightLeaf" ${m.lockLeaf==="rightLeaf"?"selected":""}>القفل على الضلفة اليمين</option>
                <option value="leftLeaf" ${m.lockLeaf==="leftLeaf"?"selected":""}>القفل على الضلفة اليسار</option>
              </select>
            </div>
          </div>

          <!-- Fix Box -->
          ${m.hasFix ? `
            <div class="fixBox">
              <div class="fixHead">
                <div style="font-weight:900">⬆️ فكس فوق الباب</div>
                <button type="button" class="btn btn-red miniBtn" data-removefix="${idx}">حذف</button>
              </div>

              <div class="tinyHelp">العرض تلقائي = نفس عرض الباب (ويمكن تغييره يدوي).</div>

              <div class="twoCols" style="margin-top:6px">
                <div>
                  <label>وضع عرض الفكس</label>
                  <select data-i="${idx}" data-k="fixAuto">
                    <option value="true" ${m.fixAuto?"selected":""}>تلقائي (نفس عرض الباب)</option>
                    <option value="false" ${!m.fixAuto?"selected":""}>يدوي</option>
                  </select>
                </div>
                <div>
                  <label>ارتفاع الفكس (سم)</label>
                  <input inputmode="numeric" data-i="${idx}" data-k="fixHeight" value="${safeText(m.fixHeight)}" placeholder="مثال: 40"/>
                </div>
              </div>

              <div style="margin-top:6px">
                <label>عرض الفكس (سم)</label>
                <input inputmode="numeric" data-i="${idx}" data-k="fixWidth"
                  ${m.fixAuto?"disabled":""}
                  value="${safeText(m.fixAuto ? (m.wCm||"") : (m.fixWidth||""))}"
                  placeholder="مثال: 110"/>
              </div>
            </div>
          ` : ``}
        </div>
      `;
    });

    // Bind inputs/selects
    container.querySelectorAll("input[data-i], select[data-i]").forEach(el=>{
      const i = Number(el.dataset.i);
      const k = el.dataset.k;

      const apply = ()=>{
        const list = getOrders().map(ensureOrderStructure);
        const order = getById(list, selectedId);
        if(!order) return;

        const m2 = order.measurements[i];
        if(!m2) return;

        if(k === "qty"){
          m2.qty = Number(el.value || 1);
          if(m2.qty < 1) m2.qty = 1;
        }else if(k === "fixAuto"){
          m2.fixAuto = (el.value === "true");
          if(m2.fixAuto) m2.fixWidth = "";
        }else{
          m2[k] = el.value;
        }

        // If door type becomes single, lockLeaf reset
        if(k === "doorType" && m2.doorType === "single"){
          m2.lockLeaf = "";
        }

        updateOrderById(selectedId, {measurements: order.measurements});
        renderMeasurements();
      };

      el.oninput = apply;
      el.onchange = apply;
    });

    // Direction buttons
    container.querySelectorAll("button[data-dir]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.dir);
        const v = btn.dataset.v;

        const list = getOrders().map(ensureOrderStructure);
        const order = getById(list, selectedId);
        if(!order) return;

        if(order.measurements[i]){
          order.measurements[i].direction = v;
          updateOrderById(selectedId, {measurements: order.measurements});
          renderMeasurements();
        }
      };
    });

    // Add fix
    container.querySelectorAll("button[data-fix]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.fix);

        const list = getOrders().map(ensureOrderStructure);
        const order = getById(list, selectedId);
        if(!order) return;

        const m2 = order.measurements[i];
        if(!m2) return;

        m2.hasFix = true;
        m2.fixAuto = true;
        m2.fixWidth = "";
        m2.fixHeight = "";

        updateOrderById(selectedId, {measurements: order.measurements});
        renderMeasurements();
      };
    });

    // Remove fix
    container.querySelectorAll("button[data-removefix]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.removefix);

        const list = getOrders().map(ensureOrderStructure);
        const order = getById(list, selectedId);
        if(!order) return;

        const m2 = order.measurements[i];
        if(!m2) return;

        m2.hasFix = false;
        m2.fixWidth = "";
        m2.fixHeight = "";

        updateOrderById(selectedId, {measurements: order.measurements});
        renderMeasurements();
      };
    });

    // Delete measurement
    container.querySelectorAll("button[data-del]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.del);

        const list = getOrders().map(ensureOrderStructure);
        const order = getById(list, selectedId);
        if(!order) return;

        if(order.measurements.length === 1){
          alert("لا يمكن حذف آخر قياس");
          return;
        }

        order.measurements.splice(i,1);
        updateOrderById(selectedId, {measurements: order.measurements});
        renderMeasurements();
      };
    });
  }

  const addMeasureBtn = $("addMeasureBtn");
  if(addMeasureBtn){
    addMeasureBtn.onclick = ()=>{
      const list = getOrders().map(ensureOrderStructure);
      const order = getById(list, selectedId);
      if(!order) return;

      order.measurements.push(createBlankMeasurement());
      updateOrderById(selectedId, {measurements: order.measurements});
      renderMeasurements();
    };
  }

  const saveDraftBtn = $("saveDraftBtn");
  if(saveDraftBtn){
    saveDraftBtn.onclick = ()=>{
      if(msg){
        msg.textContent = "✅ تم حفظ المسودة";
        msg.style.color = "#b7ffd9";
        setTimeout(()=>{ msg.textContent=""; }, 1500);
      }else{
        alert("✅ تم حفظ المسودة");
      }
    };
  }

  const copyOrderTextBtn = $("copyOrderTextBtn");
  if(copyOrderTextBtn){
    copyOrderTextBtn.onclick = ()=>{
      const o = getCurrentOrder();
      if(!o) return;
      navigator.clipboard.writeText(JSON.stringify(o, null, 2));
      alert("📋 تم نسخ تفاصيل الطلب");
    };
  }

  const sendCncBtn = $("sendCncBtn");
  if(sendCncBtn){
    sendCncBtn.onclick = ()=>{
      alert("🚀 تم إرسال أمر تشغيل CNC (نسخة MVP)\n\nلاحقاً يتم ربطها بالسيرفر ليستقبلها الأدمن.");
    };
  }

  // Other tabs MVP
  const addSheetBtn = $("addSheetBtn");
  if(addSheetBtn){
    addSheetBtn.onclick = ()=>{
      const sheetsMsg = $("sheetsMsg");
      if(sheetsMsg) sheetsMsg.textContent = "✅ تم إضافة شيت (MVP قريباً جدول كامل)";
    };
  }

  const approveDesignBtn = $("approveDesignBtn");
  if(approveDesignBtn){
    approveDesignBtn.onclick = ()=>{
      alert("✅ تم اعتماد التنفيذ (MVP)");
    };
  }

  function renderAll(){
    refreshOrders();
    renderStatus();
    bindGlobalFields();
    renderMeasurements();
  }

  renderAll();
}
