function logout(){
localStorage.removeItem("pd_session");
location.href="index.html";
}

function getOrders(){
return JSON.parse(localStorage.getItem("pd_orders")||"[]");
}
function saveOrders(o){
localStorage.setItem("pd_orders",JSON.stringify(o));
}

const session=JSON.parse(localStorage.getItem("pd_session")||"null");

if(location.pathname.includes("client")){
if(!session || session.role!=="client") location.href="index.html";
company.innerText=session.company;
}

if(location.pathname.includes("admin")){
if(!session || session.role!=="admin") location.href="index.html";
renderAdmin();
}

/* CLIENT */

function addDoor(){
doors.innerHTML+=`
<div class="card">
ارتفاع <input>
عرض <input>
اتجاه
<select><option>يمين</option><option>يسار</option></select>
</div>`;
}

function addSheet(){
sheets.innerHTML+=`
<div class="card">
قياس
<select>
<option>122x244</option>
<option>150x300</option>
</select>
سماكة
<select>
<option>2</option><option>4</option><option>6</option><option>8</option>
</select>
كمية <input type="number" value="1">
</div>`;
}

function sendOrder(){
const o=getOrders();
o.push({
client:session.company,
date:new Date().toLocaleString(),
status:"قيد التشغيل"
});
saveOrders(o);
alert("تم إرسال الطلب");
}

/* ADMIN */

function renderAdmin(){
const list=getOrders();
orders.innerHTML="";
list.forEach((o,i)=>{
orders.innerHTML+=`
<div class="card">
<b>${o.client}</b><br>
${o.date}<br>
الحالة: ${o.status}<br>
<button class="btn btn-green" onclick="finish(${i})">تم التنفيذ</button>
</div>`;
});
}

function finish(i){
const o=getOrders();
o[i].status="جاهز";
saveOrders(o);
renderAdmin();
}