let orders = JSON.parse(localStorage.getItem("orders")) || [];

const modal = document.getElementById("modal");
const ordersBox = document.getElementById("orders");

function openModal(){
modal.style.display = "flex";
}

window.onclick = function(e){
if(e.target === modal){
modal.style.display = "none";
}
}

// رفع الصورة / PDF

document.getElementById("projectFile").addEventListener("change", function(e){

const file = e.target.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = function(){

const preview = document.getElementById("preview");

preview.src = reader.result;
preview.style.display = "block";

}

reader.readAsDataURL(file);

});

// حفظ الطلب

function saveOrder(){

const order = {

id: Date.now(),

clientName: document.getElementById("clientName").value,

projectName: document.getElementById("projectName").value,

projectDetails: document.getElementById("projectDetails").value,

projectStatus: document.getElementById("projectStatus").value,

file: document.getElementById("preview").src,

createdAt: new Date().toLocaleDateString()

};

orders.push(order);

localStorage.setItem("orders", JSON.stringify(orders));

modal.style.display = "none";

renderOrders();

clearForm();

}

// تنظيف الفورم

function clearForm(){

clientName.value = "";
projectName.value = "";
projectDetails.value = "";
preview.style.display = "none";

}

// عرض الطلبات

function renderOrders(){

ordersBox.innerHTML = "";

orders.reverse().forEach(order => {

let statusClass = "";

if(order.projectStatus === "جديد"){
statusClass = "new";
}

if(order.projectStatus === "تحت التصميم"){
statusClass = "design";
}

if(order.projectStatus === "بانتظار الاعتماد"){
statusClass = "wait";
}

if(order.projectStatus === "جاهز للتصنيع"){
statusClass = "ready";
}

ordersBox.innerHTML += `

<div class="card">

<img src="${order.file || 'https://via.placeholder.com/400x300'}">

<div class="card-content">

<div class="client-name">
${order.clientName}
</div>

<div class="project-name">
${order.projectName}
</div>

<div class="project-details">
${order.projectDetails}
</div>

<div class="status ${statusClass}">
${order.projectStatus}
</div>

<div class="project-details">
📅 ${order.createdAt}
</div>

<div class="actions">

<button class="client-btn" onclick="openClient(${order.id})">
👤 العميل
</button>

<button class="price-btn" onclick="openPricing(${order.id})">
💰 التسعير
</button>

<button class="delete-btn" onclick="deleteOrder(${order.id})">
🗑 حذف
</button>

</div>

</div>

</div>

`;

});

}

// حذف الطلب

function deleteOrder(id){

orders = orders.filter(order => order.id !== id);

localStorage.setItem("orders", JSON.stringify(orders));

renderOrders();

}

// صفحة العميل

function openClient(id){

window.location.href = `client.html?id=${id}`;

}

// صفحة التسعير

function openPricing(id){

window.location.href = `pricing.html?id=${id}`;

}

renderOrders();