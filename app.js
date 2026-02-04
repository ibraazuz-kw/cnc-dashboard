function getOrders(){
 return JSON.parse(localStorage.getItem("orders")||"[]");
}
function saveOrders(o){
 localStorage.setItem("orders",JSON.stringify(o));
}

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
 قياس <input placeholder="1220x2440">
 سماكة <input>
 كمية <input type="number" value="1">
 </div>`;
}

function sendOrder(){
 const order={
 material:material.value,
 work:work.value,
 notes:notes.value,
 date:new Date().toLocaleString(),
 status:"قيد التشغيل"
 };

 const list=getOrders();
 list.push(order);
 saveOrders(list);

 alert("تم إرسال الطلب بنجاح ✔");
}

if(location.pathname.includes("admin")){
 renderAdmin();
}

function renderAdmin(){
 const list=getOrders();
 orders.innerHTML="";
 list.forEach((o,i)=>{
 orders.innerHTML+=`
 <div class="card">
 <b>طلب ${i+1}</b><br>
 المادة: ${o.material}<br>
 الشغل: ${o.work}<br>
 الحالة: ${o.status}<br>

 السعر (د.ك)
 <input type="number" onchange="setPrice(${i},this.value)">

 <button onclick="makeInvoice(${i})">📄 فاتورة</button>
 <button onclick="finish(${i})">✅ تم التنفيذ</button>
 </div>`;
 });
}

function setPrice(i,v){
 const o=getOrders();
 o[i].price=v;
 saveOrders(o);
}

function finish(i){
 const o=getOrders();
 o[i].status="جاهز";
 saveOrders(o);
 renderAdmin();
}