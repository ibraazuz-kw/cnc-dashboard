let orders = JSON.parse(localStorage.getItem("orders")) || [];

const modal = document.getElementById("modal");

const ordersContainer =
document.getElementById("ordersContainer");

/* =========================
   Modal
========================= */

function openModal(){

modal.style.display = "flex";

}

function closeModal(){

modal.style.display = "none";

clearForm();

}

window.onclick = function(e){

if(e.target === modal){

closeModal();

}

}

/* =========================
   Upload Preview
========================= */

document
.getElementById("projectImage")
.addEventListener("change", function(e){

const file = e.target.files[0];

if(!file) return;

const reader = new FileReader();

reader.onload = function(){

const preview =
document.getElementById("previewImage");

preview.src = reader.result;

preview.style.display = "block";

}

reader.readAsDataURL(file);

});

/* =========================
   Save Order
========================= */

function saveOrder(){

const order = {

id: Date.now(),

clientName:
document.getElementById("clientName").value,

clientPhone:
document.getElementById("clientPhone").value,

projectName:
document.getElementById("projectName").value,

projectDetails:
document.getElementById("projectDetails").value,

projectStatus:
document.getElementById("projectStatus").value,

image:
document.getElementById("previewImage").src,

price: 0,

createdAt:
new Date().toLocaleDateString()

};

orders.unshift(order);

localStorage.setItem(
"orders",
JSON.stringify(orders)
);

closeModal();

renderOrders();

updateStats();

}

/* =========================
   Render Orders
========================= */

function renderOrders(list = orders){

ordersContainer.innerHTML = "";

list.forEach(order => {

let statusClass = "";

if(order.projectStatus === "بانتظار الاعتماد"){

statusClass = "pending";

}

if(order.projectStatus === "قيد التصميم"){

statusClass = "design";

}

if(order.projectStatus === "يوجد تعديل"){

statusClass = "edit";

}

if(order.projectStatus === "تم الاعتماد"){

statusClass = "approved";

}

ordersContainer.innerHTML += `

<div class="order-card">

<img
src="${order.image || 'https://via.placeholder.com/600x400'}"
class="order-image"
>

<div class="order-content">

<div class="order-top">

<div>

<div class="client-name">
${order.clientName}
</div>

<div class="project-name">
${order.projectName}
</div>

</div>

<div class="order-status ${statusClass}">
${order.projectStatus}
</div>

</div>

<div class="order-details">

📱 ${order.clientPhone}<br>

📅 ${order.createdAt}<br>

📝 ${order.projectDetails}

</div>

<div class="order-footer">

<div class="order-price">
${order.price || 0} KD
</div>

</div>

<div class="order-actions">

<button
class="client-btn"
onclick="openClient(${order.id})"
>

👤 العميل

</button>

<button
class="price-btn"
onclick="openPricing(${order.id})"
>

💰 التسعير

</button>

<button
class="invoice-btn"
onclick="openInvoice(${order.id})"
>

🧾 الفاتورة

</button>

<button
class="delete-btn"
onclick="deleteOrder(${order.id})"
>

🗑

</button>

</div>

</div>

</div>

`;

});

}

/* =========================
   Delete
========================= */

function deleteOrder(id){

if(!confirm("حذف الطلب؟")) return;

orders = orders.filter(order => order.id !== id);

localStorage.setItem(
"orders",
JSON.stringify(orders)
);

renderOrders();

updateStats();

}

/* =========================
   Open Pages
========================= */

function openClient(id){

window.location.href =
`client.html?id=${id}`;

}

function openPricing(id){

window.location.href =
`pricing.html?id=${id}`;

}

function openInvoice(id){

window.location.href =
`invoice.html?id=${id}`;

}

/* =========================
   Search
========================= */

document
.getElementById("searchInput")
.addEventListener("input", function(){

const value =
this.value.toLowerCase();

const filtered = orders.filter(order =>

order.clientName
.toLowerCase()
.includes(value)

||

order.projectName
.toLowerCase()
.includes(value)

);

renderOrders(filtered);

});

/* =========================
   Stats
========================= */

function updateStats(){

document.getElementById(
"totalOrders"
).innerText = orders.length;

const pending =
orders.filter(order =>
order.projectStatus ===
"بانتظار الاعتماد"
).length;

document.getElementById(
"pendingOrders"
).innerText = pending;

const approved =
orders.filter(order =>
order.projectStatus ===
"تم الاعتماد"
).length;

document.getElementById(
"approvedOrders"
).innerText = approved;

let revenue = 0;

orders.forEach(order => {

revenue += Number(order.price || 0);

});

document.getElementById(
"totalRevenue"
).innerText =
revenue + " KD";

}

/* =========================
   Clear Form
========================= */

function clearForm(){

clientName.value = "";

clientPhone.value = "";

projectName.value = "";

projectDetails.value = "";

previewImage.style.display = "none";

}

/* =========================
   Init
========================= */

renderOrders();

updateStats();