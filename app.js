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
function setSession(v){ saveJSON(LS.SESSION, v); }
function clearSession(){ localStorage.removeItem(LS.SESSION); }

function getOrders(){ return loadJSON(LS.ORDERS, []); }
function saveOrders(list){ saveJSON(LS.ORDERS, list); }

function nowStr(){ return new Date().toLocaleString("ar-KW"); }
function genId(prefix){ return `${prefix}-${Date.now()}`; }

function badgeClass(status){
  return status === "جاهز" ? "badge ready" : "badge working";
}

/* =========================
   DATA MODELS
========================= */

function createBlankMeasurement(){
  return {
    hCm:"",
    wCm:"",
    qty:1,

    doorType:"single", // single | oneHalf | double
    direction:"right", // right | left
    lockLeaf:"",       // rightLeaf | leftLeaf
    hasFix:false,
    fixWidth:"",
    fixHeight:"",
    fixAuto:true,
  };
}

function createBlankSheet(){
  return {
    material:"aluminum",   // aluminum | stainless | iron | acp
    thicknessMm:"",
    lengthCm:"",
    widthCm:"",
    qty:1,
    notes:"",
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

    // NEW: sheets
    sheets: [ createBlankSheet() ],

    // design confirm
    designNotes:"",
    designApproved:false,

    // invoice
    invoice: {
      cutPrice:0,
      engravePrice:0,
      sheetPrice:0,
      total:0
    }
  };
}

/* =========================
   LOGIN + ROUTING
========================= */

function initApp(){
  const session = getSession();

  $("loginBtn").onclick = ()=>{
    const role = $("roleSelect").value;
    const username = $("usernameInput").value.trim();
    const company = $("companyInput").value.trim();

    if(!username){
      alert("اكتب اسم المستخدم");
      return;
    }

    const s = { role, username, company };
    setSession(s);

    renderPortal();
  };

  $("logoutBtn").onclick = ()=>{
    clearSession();
    location.reload();
  };

  renderPortal();
}

function renderPortal(){
  const session = getSession();

  // UI topbar
  if(session){
    $("portalSubTitle").textContent = (session.role==="admin") ? "لوحة الأدمن" : "بوابة العميل";
    $("whoPill").classList.remove("hidden");
    $("logoutBtn").classList.remove("hidden");
    $("whoPill").textContent = `👤 ${session.company || session.username}`;
    $("loginCard").classList.add("hidden");
    $("portalRoot").classList.remove("hidden");

    if(session.role==="client"){
      $("adminRoot").classList.add("hidden");
      $("clientRoot").classList.remove("hidden");
      initClient();
    }else{
      $("clientRoot").classList.add("hidden");
      $("adminRoot").classList.remove("hidden");
      initAdmin();
    }
  }else{
    $("portalSubTitle").textContent = "تسجيل الدخول";
    $("whoPill").classList.add("hidden");
    $("logoutBtn").classList.add("hidden");
    $("loginCard").classList.remove("hidden");
    $("portalRoot").classList.add("hidden");
  }
}

/* =========================
   CLIENT
========================= */

function initClient(){
  const session = getSession();
  if(!session || session.role!=="client") return;

  // tabs
  document.querySelectorAll(".tab").forEach(btn=>{
    btn.onclick = ()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      const tabId = btn.dataset.tab;
      document.querySelectorAll(".tabPage").forEach(p=>p.classList.add("hidden"));
      $(tabId).classList.remove("hidden");
    };
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
    renderAll();
    alert("✅ تم نسخ الطلب");
  };

  $("copyOrderTextBtn").onclick = ()=>{
    const o = getCurrentOrder();
    navigator.clipboard.writeText(JSON.stringify(o, null, 2));
    alert("📋 تم نسخ تفاصيل الطلب");
  };

  $("sendCncBtn").onclick = ()=>{
    alert("🚀 تم إرسال أمر تشغيل CNC (نسخة MVP)\n\nلاحقاً سيتم ربطها بالسيرفر ليستقبلها الأدمن.");
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
     MEASUREMENTS UI
  ========================= */

  const mContainer = $("measurementsContainer");

  function renderMeasurements(){
    const o = getCurrentOrder();
    if(!o) return;

    const mList = o.measurements || [];
    mContainer.innerHTML = "";

    mList.forEach((m, idx)=>{
      const isDoubleLike = (m.doorType === "double" || m.doorType === "oneHalf");

      mContainer.innerHTML += `
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

          <div class="twoCols">
            <div>
              <label>الارتفاع (سم)</label>
              <input data-mi="${idx}" data-mk="hCm" value="${m.hCm||""}" placeholder="مثال: 210"/>
            </div>
            <div>
              <label>العرض (سم)</label>
              <input data-mi="${idx}" data-mk="wCm" value="${m.wCm||""}" placeholder="مثال: 110"/>
            </div>
          </div>

          <div class="twoCols">
            <div>
              <label>العدد</label>
              <input type="number" min="1" data-mi="${idx}" data-mk="qty" value="${m.qty||1}"/>
            </div>
            <div>
              <label>نوع الباب</label>
              <select data-mi="${idx}" data-mk="doorType">
                <option value="single" ${m.doorType==="single"?"selected":""}>باب مفرد</option>
                <option value="oneHalf" ${m.doorType==="oneHalf"?"selected":""}>باب ونص</option>
                <option value="double" ${m.doorType==="double"?"selected":""}>باب دبل</option>
              </select>
            </div>
          </div>

          <label>اتجاه فتحة الباب</label>
          <div class="dirBtns">
            <button class="dirBtn ${m.direction==="right"?"active":""}" data-dir="${idx}" data-v="right">
              ➡️ يمين
            </button>
            <button class="dirBtn ${m.direction==="left"?"active":""}" data-dir="${idx}" data-v="left">
              ⬅️ يسار
            </button>
          </div>

          ${isDoubleLike ? `
            <label style="margin-top:10px">مكان القفل (Lock)</label>
            <select data-mi="${idx}" data-mk="lockLeaf">
              <option value="" ${m.lockLeaf===""?"selected":""}>بدون تحديد</option>
              <option value="rightLeaf" ${m.lockLeaf==="rightLeaf"?"selected":""}>القفل على الضلفة اليمين</option>
              <option value="leftLeaf" ${m.lockLeaf==="leftLeaf"?"selected":""}>القفل على الضلفة اليسار</option>
            </select>
          ` : ``}

          ${m.hasFix ? `
            <div class="fixBox">
              <div class="fixHead">
                <div style="font-weight:900">⬆️ فكس فوق الباب</div>
                <button class="btn btn-red miniBtn" data-removefix="${idx}">حذف</button>
              </div>

              <div class="tinyHelp">تلقائي = نفس عرض الباب، أو يدوي تدخل عرض مختلف.</div>

              <label>وضع عرض الفكس</label>
              <select data-mi="${idx}" data-mk="fixAuto">
                <option value="true" ${m.fixAuto?"selected":""}>تلقائي</option>
                <option value="false" ${!m.fixAuto?"selected":""}>يدوي</option>
              </select>

              <div class="twoCols">
                <div>
                  <label>عرض الفكس (سم)</label>
                  <input data-mi="${idx}" data-mk="fixWidth" ${m.fixAuto?"disabled":""}
                    value="${m.fixAuto ? (m.wCm||"") : (m.fixWidth||"")}" placeholder="مثال: 110"/>
                </div>
                <div>
                  <label>ارتفاع الفكس (سم)</label>
                  <input data-mi="${idx}" data-mk="fixHeight" value="${m.fixHeight||""}" placeholder="مثال: 40"/>
                </div>
              </div>
            </div>
          ` : ``}
        </div>
      `;
    });

    // bind inputs
    mContainer.querySelectorAll("input[data-mi], select[data-mi]").forEach(el=>{
      const i = Number(el.dataset.mi);
      const k = el.dataset.mk;

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

        if(k === "doorType" && m2.doorType === "single"){
          m2.lockLeaf = "";
        }

        updateOrder({measurements:o2.measurements});
        renderMeasurements();
      };

      el.oninput = apply;
      el.onchange = apply;
    });

    // direction
    mContainer.querySelectorAll("button[data-dir]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.dir);
        const v = btn.dataset.v;
        const o2 = getCurrentOrder();
        o2.measurements[i].direction = v;
        updateOrder({measurements:o2.measurements});
        renderMeasurements();
      };
    });

    // add fix
    mContainer.querySelectorAll("button[data-fix]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.fix);
        const o2 = getCurrentOrder();
        const m2 = o2.measurements[i];
        m2.hasFix = true;
        m2.fixAuto = true;
        m2.fixWidth = "";
        m2.fixHeight = "";
        updateOrder({measurements:o2.measurements});
        renderMeasurements();
      };
    });

    // remove fix
    mContainer.querySelectorAll("button[data-removefix]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.removefix);
        const o2 = getCurrentOrder();
        const m2 = o2.measurements[i];
        m2.hasFix = false;
        m2.fixWidth = "";
        m2.fixHeight = "";
        updateOrder({measurements:o2.measurements});
        renderMeasurements();
      };
    });

    // delete measurement
    mContainer.querySelectorAll("button[data-del]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.del);
        const o2 = getCurrentOrder();
        if(o2.measurements.length===1){
          alert("لا يمكن حذف آخر قياس");
          return;
        }
        o2.measurements.splice(i,1);
        updateOrder({measurements:o2.measurements});
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

  /* =========================
     SHEETS UI (FULL)
  ========================= */

  const sContainer = $("sheetsContainer");

  function materialLabel(v){
    if(v==="aluminum") return "ألمنيوم";
    if(v==="stainless") return "ستانلس";
    if(v==="iron") return "حديد";
    if(v==="acp") return "ألـوكوبوند (ACP)";
    return v;
  }

  function renderSheets(){
    const o = getCurrentOrder();
    if(!o) return;

    if(!o.sheets || !Array.isArray(o.sheets) || o.sheets.length===0){
      o.sheets = [createBlankSheet()];
      updateOrder({sheets:o.sheets});
    }

    sContainer.innerHTML = "";

    o.sheets.forEach((s, idx)=>{
      sContainer.innerHTML += `
        <div class="sheet-item">
          <div class="mCardTop">
            <div class="mTitle">
              <div class="num-pill">${idx+1}</div>
              <div class="txt">شيت</div>
            </div>

            <div class="mActions">
              <button class="btn btn-red miniBtn" data-sdel="${idx}">حذف</button>
            </div>
          </div>

          <div class="dividerSoft"></div>

          <div class="twoCols">
            <div>
              <label>المادة</label>
              <select data-si="${idx}" data-sk="material">
                <option value="aluminum" ${s.material==="aluminum"?"selected":""}>ألمنيوم</option>
                <option value="stainless" ${s.material==="stainless"?"selected":""}>ستانلس</option>
                <option value="iron" ${s.material==="iron"?"selected":""}>حديد</option>
                <option value="acp" ${s.material==="acp"?"selected":""}>ألـوكوبوند (ACP)</option>
              </select>
            </div>

            <div>
              <label>السماكة (mm)</label>
              <input data-si="${idx}" data-sk="thicknessMm" value="${s.thicknessMm||""}" placeholder="مثال: 2 أو 3 أو 4"/>
            </div>
          </div>

          <div class="twoCols">
            <div>
              <label>الطول (سم)</label>
              <input data-si="${idx}" data-sk="lengthCm" value="${s.lengthCm||""}" placeholder="مثال: 300"/>
            </div>
            <div>
              <label>العرض (سم)</label>
              <input data-si="${idx}" data-sk="widthCm" value="${s.widthCm||""}" placeholder="مثال: 150"/>
            </div>
          </div>

          <div class="twoCols">
            <div>
              <label>الكمية</label>
              <input type="number" min="1" data-si="${idx}" data-sk="qty" value="${s.qty||1}"/>
            </div>
            <div>
              <label>ملاحظات</label>
              <input data-si="${idx}" data-sk="notes" value="${s.notes||""}" placeholder="مثال: لون أسود / سماكة خاصة..."/>
            </div>
          </div>

          <div class="tinyHelp">
            📌 ${materialLabel(s.material)} — ${s.thicknessMm||"؟"}mm — ${s.lengthCm||"؟"}×${s.widthCm||"؟"} سم — عدد: ${s.qty||1}
          </div>
        </div>
      `;
    });

    // bind sheet inputs
    sContainer.querySelectorAll("input[data-si], select[data-si]").forEach(el=>{
      const i = Number(el.dataset.si);
      const k = el.dataset.sk;

      const apply = ()=>{
        const o2 = getCurrentOrder();
        const s2 = o2.sheets[i];

        if(k==="qty"){
          s2[k] = Number(el.value || 1);
        }else{
          s2[k] = el.value;
        }

        updateOrder({sheets:o2.sheets});
        renderSheets();
      };

      el.oninput = apply;
      el.onchange = apply;
    });

    // delete sheet
    sContainer.querySelectorAll("button[data-sdel]").forEach(btn=>{
      btn.onclick = ()=>{
        const i = Number(btn.dataset.sdel);
        const o2 = getCurrentOrder();
        if(o2.sheets.length===1){
          alert("لا يمكن حذف آخر شيت");
          return;
        }
        o2.sheets.splice(i,1);
        updateOrder({sheets:o2.sheets});
        renderSheets();
      };
    });
  }

  $("addSheetBtn").onclick = ()=>{
    const o = getCurrentOrder();
    o.sheets.push(createBlankSheet());
    updateOrder({sheets:o.sheets});
    renderSheets();
  };

  /* =========================
     DESIGN TAB
  ========================= */
  $("designNotes").oninput = ()=>{
    const o = getCurrentOrder();
    updateOrder({designNotes: $("designNotes").value});
  };

  $("approveDesignBtn").onclick = ()=>{
    const o = getCurrentOrder();
    updateOrder({designApproved:true});
    alert("✅ تم اعتماد التنفيذ");
  };

  /* =========================
     SAVE DRAFT
  ========================= */
  $("saveDraftBtn").onclick = ()=>{
    $("clientMsg").textContent = "✅ تم حفظ المسودة";
    $("clientMsg").style.color = "#b7ffd9";
    setTimeout(()=>{ $("clientMsg").textContent=""; }, 1500);
  };

  function renderAll(){
    refreshOrders();
    renderStatus();
    bindGlobalFields();
    renderMeasurements();
    renderSheets();

    const o = getCurrentOrder();
    $("designNotes").value = o.designNotes || "";
  }

  renderAll();
}

/* =========================
   ADMIN (simple)
========================= */

function initAdmin(){
  // مبدئياً صفحة بسيطة (تقدر تطورها بعدين)
}

/* =========================
   START
========================= */
document.addEventListener("DOMContentLoaded", initApp);
