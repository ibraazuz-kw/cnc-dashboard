/* =========================
   Pro Design CNC (Client)
   Stable Tabs + Measurements + Fix + Lock
   LocalStorage MVP
========================= */

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
function clearSession(){ localStorage.removeItem(LS.SESSION); }

function getOrders(){ return loadJSON(LS.ORDERS, []); }
function saveOrders(list){ saveJSON(LS.ORDERS, list); }

function nowStr(){ return new Date().toLocaleString("ar-KW"); }
function genId(prefix){ return `${prefix}-${Date.now()}`; }

function badgeClass(status){
  return status === "جاهز" ? "badge ready" : "badge working";
}

/* =========================
   Order + Measurement Models
========================= */

function createBlankMeasurement(){
  return {
    hCm:"",
    wCm:"",
    qty:1,

    doorType:"single", // single | oneHalf | double
    direction:"right", // right | left
    lockLeaf:"",       // rightLeaf | leftLeaf | ""

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

    // global order fields
    lineWidth: "",
    cutEngraveDetails:"",
    notes:"",
    files: [],

    measurements: [ createBlankMeasurement() ],
  };
}

/* =========================
   Client Init
========================= */

function initClient(){
  const root = $("clientRoot");
  if(!root) return;

  const session = getSession();
  if(!session || session.role !== "client"){
    // مهم: لازم يرجع لصفحة الدخول فقط
    location.href = "index.html";
    return;
  }

  // Top header
  $("clientCompanyTitle").textContent = `👤 ${session.company || session.username}`;

  $("clientLogoutBtn").onclick = ()=>{
    clearSession();
    location.href = "index.html";
  };

  /* =========================
     Tabs (FIXED)
  ========================= */
  const tabs = document.querySelectorAll(".tab");
  const pages = document.querySelectorAll(".tabPage");

  function openTab(tabId){
    pages.forEach(p=>p.classList.add("hidden"));
    const target = $(tabId);
    if(target) target.classList.remove("hidden");

    tabs.forEach(t=>t.classList.remove("active"));
    const activeBtn = document.querySelector(`.tab[data-tab="${tabId}"]`);
    if(activeBtn) activeBtn.classList.add("active");
  }

  tabs.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      openTab(btn.dataset.tab);
    });
  });

  // افتح أول تاب دايم
  openTab("tab_measurements");

  /* =========================
     Orders
  ========================= */
  let allOrders = getOrders();
  let myOrders = allOrders.filter(o=>o.clientUsername === session.username);

  if(myOrders.length === 0){
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
    return getOrders().find(o=>o.id === selectedId) || null;
  }

  function updateOrder(update){
    const list = getOrders();
    const idx = list.findIndex(o=>o.id === selectedId);
    if(idx === -1) return;
    list[idx] = { ...list[idx], ...update };
    saveOrders(list);
  }

  function refreshOrders(){
    allOrders = getOrders();
    myOrders = allOrders.filter(o=>o.clientUsername === session.username);

    orderSelect.innerHTML = myOrders
      .slice().reverse()
      .map(o=>`<option value="${o.id}">${o.id} | ${o.createdAt}</option>`)
      .join("");

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
    const copy = {
      ...o,
      id: genId("ORD"),
      createdAt: nowStr(),
      status: "قيد التشغيل"
    };
    list.push(copy);
    saveOrders(list);
    selectedId = copy.id;
    refreshOrders();
    renderAll();
    alert("✅ تم نسخ الطلب");
  };

  /* =========================
     Global Fields
  ========================= */
  const lineWidthSelect = $("lineWidthSelect");
  const lineWidthOther = $("lineWidthOther");
  const cutEngraveDetails = $("cutEngraveDetails");
  const notesInput = $("notesInput");
  const fileInput = $("fileInput");

  function bindGlobalFields(){
    const o = getCurrentOrder();
    if(!o) return;

    const preset = ["4","6","8","10","12","15","20","25","30","40"];
    const lw = (o.lineWidth || "").trim();

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
        updateOrder({ lineWidth: lineWidthSelect.value });
      }
    };

    lineWidthOther.oninput = ()=>{
      updateOrder({ lineWidth: lineWidthOther.value.trim() });
    };

    cutEngraveDetails.value = o.cutEngraveDetails || "";
    notesInput.value = o.notes || "";

    cutEngraveDetails.oninput = ()=> updateOrder({ cutEngraveDetails: cutEngraveDetails.value });
    notesInput.oninput = ()=> updateOrder({ notes: notesInput.value });

    fileInput.onchange = ()=>{
      const files = Array.from(fileInput.files || []).map(f=>f.name);
      updateOrder({ files });
      alert("✅ تم حفظ أسماء الملفات");
    };
  }

  /* =========================
     Measurements
  ========================= */
  const container = $("measurementsContainer");

  function renderMeasurements(){
    const o = getCurrentOrder();
    if(!o) return;

    const mList = o.measurements || [];
    container.innerHTML = "";

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
              <button class="btn btn-ghost miniBtn" data-fix="${idx}">➕ إضافة فكس</button>
              <button class="btn btn-red miniBtn" data-del="${idx}">حذف</button>
            </div>
          </div>

          <div class="dividerSoft"></div>

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

          <div class="twoCols">
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

          <label>اتجاه فتحة الباب</label>
          <div class="dirBtns">
            <button class="dirBtn ${m.direction==="right"?"active":""}" data-dir="${idx}" data-v="right">يمين</button>
            <button class="dirBtn ${m.direction==="left"?"active":""}" data-dir="${idx}" data-v="left">يسار</button>
          </div>

          ${isDoubleLike ? `
            <label style="margin-top:10px">مكان القفل (Lock)</label>
            <select data-i="${idx}" data-k="lockLeaf">
              <option value="" ${m.lockLeaf===""?"selected":""}>بدون تحديد</option>
              <option value="rightLeaf" ${m.lockLeaf==="rightLeaf"?"selected":""}>القفل على الضلفة اليمين</option>
              <option value="leftLeaf" ${m.lockLeaf==="leftLeaf"?"selected":""}>القفل على الضلفة اليسار</option>
            </select>
          ` : ``}

          ${m.hasFix ? `
            <div class="fixBox">
              <div class="fixHead">
                <div style="font-weight:900">⬆️ فكس فوق الباب</div>
                <button class="btn btn-red miniBtn" data-removefix="${idx}">حذف الفكس</button>
              </div>

              <div class="tinyHelp">يمكنك ترك العرض تلقائي (نفس عرض الباب) أو إدخال عرض يدوي.</div>

              <label>وضع عرض الفكس</label>
              <select data-i="${idx}" data-k="fixAuto">
                <option value="true" ${m.fixAuto?"selected":""}>تلقائي (نفس عرض الباب)</option>
                <option value="false" ${!m.fixAuto?"selected":""}>يدوي</option>
              </select>

              <div class="twoCols">
                <div>
                  <label>عرض الفكس (سم)</label>
                  <input data-i="${idx}" data-k="fixWidth" ${m.fixAuto?"disabled":""}
                    value="${m.fixAuto ? (m.wCm||"") : (m.fixWidth||"")}"
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
      `;
    });

    // Bind inputs/selects
    container.querySelectorAll("input[data-i], select[data-i]").forEach(el=>{
      const i = Number(el.dataset.i);
      const k = el.dataset.k;

      const apply = ()=>{
        const o2 = getCurrentOrder();
        const m2 = o2.measurements[i];

        if(k === "qty"){
          m2[k] = Number(el.value || 1);
        }else if(k === "fixAuto"){
          m2[k] = (el.value === "true");
          if(m2.fixAuto) m2.fixWidth = "";
        }else{
          m2[k] = el.value;
        }

        // door type logic
        if(k === "doorType"){
          if(m2.doorType === "single"){
            m2.lockLeaf = "";
          }
        }

        updateOrder({ measurements: o2.measurements });
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

        const o2 = getCurrentOrder();
        o2.measurements[i].direction = v;

        updateOrder({ measurements: o2.measurements });
        renderMeasurements();
      };
    });

    // Add fix
    container.querySelectorAll("button[data-fix]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.fix);
        const o2 = getCurrentOrder();
        const m2 = o2.measurements[i];

        m2.hasFix = true;
        m2.fixAuto = true;
        m2.fixWidth = "";
        m2.fixHeight = "";

        updateOrder({ measurements: o2.measurements });
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

        updateOrder({ measurements: o2.measurements });
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

        o2.measurements.splice(i, 1);
        updateOrder({ measurements: o2.measurements });
        renderMeasurements();
      };
    });
  }

  $("addMeasureBtn").onclick = ()=>{
    const o = getCurrentOrder();
    o.measurements.push(createBlankMeasurement());
    updateOrder({ measurements: o.measurements });
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
    alert("🚀 تم إرسال أمر تشغيل CNC (نسخة MVP)\n\nلاحقاً سيتم ربطها بالسيرفر ليستقبلها الأدمن.");
  };

  /* =========================
     Other Tabs (MVP)
  ========================= */
  $("addSheetBtn").onclick = ()=>{
    $("sheetsMsg").textContent = "✅ تم إضافة شيت (MVP قريباً جدول كامل)";
  };

  $("approveDesignBtn").onclick = ()=>{
    alert("✅ تم اعتماد التنفيذ (MVP)");
  };

  /* =========================
     Render All
  ========================= */
  function renderAll(){
    refreshOrders();
    renderStatus();
    bindGlobalFields();
    renderMeasurements();
  }

  renderAll();
}
