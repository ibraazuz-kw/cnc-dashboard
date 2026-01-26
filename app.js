function $(id){ return document.getElementById(id); }

const LS = {
  SESSION:"pd_session",
  ORDERS:"pd_orders",
  SHEETS:"pd_sheets",
};

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

function setSession(session){
  saveJSON(LS.SESSION, session);
}
function getSession(){
  return loadJSON(LS.SESSION, null);
}
function clearSession(){
  localStorage.removeItem(LS.SESSION);
}

function getOrders(){ return loadJSON(LS.ORDERS, []); }
function saveOrders(list){ saveJSON(LS.ORDERS, list); }

function nowStr(){ return new Date().toLocaleString("ar-KW"); }
function genId(prefix){ return `${prefix}-${Date.now()}`; }

function initIndex(){
  const roleSelect = $("roleSelect");
  const usernameInput = $("usernameInput");
  const companyInput = $("companyInput");
  const loginBtn = $("loginBtn");
  const loginMsg = $("loginMsg");
  const resetBtn = $("resetBtn");

  // لو مسجل دخول قبل، دخله مباشرة
  const s = getSession();
  if(s && s.role === "client"){
    location.href = "client.html";
    return;
  }
  if(s && s.role === "admin"){
    location.href = "admin.html";
    return;
  }

  roleSelect.onchange = ()=>{
    if(roleSelect.value === "admin"){
      companyInput.value = "";
      companyInput.disabled = true;
    }else{
      companyInput.disabled = false;
    }
  };
  roleSelect.onchange();

  loginBtn.onclick = ()=>{
    const role = roleSelect.value;
    const username = (usernameInput.value || "").trim();
    const company = (companyInput.value || "").trim();

    if(!username){
      loginMsg.textContent = "⚠️ اكتب اسم المستخدم";
      return;
    }

    // Session ثابت
    const session = {
      role,
      username,
      company: role === "client" ? (company || username) : "ADMIN",
      createdAt: nowStr(),
    };

    setSession(session);

    // تأكيد الحفظ (عشان ما يرجع للدخول)
    const check = getSession();
    if(!check || check.username !== username){
      loginMsg.textContent = "❌ مشكلة في حفظ تسجيل الدخول (جرب زر تصفير النظام)";
      return;
    }

    loginMsg.textContent = "✅ تم تسجيل الدخول";

    // تحويل حسب الدور
    if(role === "client"){
      location.href = "client.html";
    }else{
      location.href = "admin.html";
    }
  };

  resetBtn.onclick = ()=>{
    localStorage.removeItem(LS.SESSION);
    localStorage.removeItem(LS.ORDERS);
    localStorage.removeItem(LS.SHEETS);
    loginMsg.textContent = "✅ تم تصفير النظام";
  };
}

/* =========================
   CLIENT PAGE (اختصار مؤقت)
   ========================= */
function initClient(){
  const root = document.getElementById("clientRoot");
  if(!root) return;

  const session = getSession();
  if(!session || session.role !== "client"){
    location.href = "index.html";
    return;
  }

  // بس تأكيد أن الصفحة تفتح
  document.getElementById("clientCompanyTitle").textContent = `👤 ${session.company || session.username}`;

  document.getElementById("clientLogoutBtn").onclick = ()=>{
    clearSession();
    location.href="index.html";
  };
}

/* =========================
   ADMIN PAGE (اختصار مؤقت)
   ========================= */
function initAdmin(){
  const root = document.getElementById("adminRoot");
  if(!root) return;

  const session = getSession();
  if(!session || session.role !== "admin"){
    location.href = "index.html";
    return;
  }

  document.getElementById("adminLogoutBtn").onclick = ()=>{
    clearSession();
    location.href="index.html";
  };
}
