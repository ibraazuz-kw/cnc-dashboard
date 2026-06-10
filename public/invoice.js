let grandTotal = 0;
let rowNumber = 1;

/* رقم الفاتورة */
document.getElementById("invoiceNo").innerText =
"INV-" + Date.now();

/* التاريخ */
document.getElementById("todayDate").innerText =
new Date().toLocaleDateString("en-GB");

/* إضافة بند */
function addItem(){

const service =
document.getElementById("service").value.trim();

const thickness =
document.getElementById("thickness").value.trim();

const qty =
Number(document.getElementById("qty").value);

const price =
Number(document.getElementById("price").value);

if(
service === "" ||
qty <= 0 ||
price <= 0
){
alert("أدخل البيانات كاملة");
return;
}

const total = qty * price;

grandTotal += total;

const row = `

<tr>

<td>${rowNumber}</td>

<td>${service}</td>

<td>${thickness}</td>

<td>${qty}</td>

<td>${price.toFixed(3)}</td>

<td>${total.toFixed(3)}</td>

</tr>

`;

document
.getElementById("invoiceRows")
.insertAdjacentHTML("beforeend",row);

document.getElementById("grandTotal").innerText =
grandTotal.toFixed(3);

rowNumber++;

document.getElementById("service").value = "";
document.getElementById("thickness").value = "";
document.getElementById("qty").value = "";
document.getElementById("price").value = "";

}

/* Enter للتنقل السريع */

document.addEventListener("keydown",(e)=>{

if(e.key==="Enter"){

const active =
document.activeElement;

if(active.id==="price"){

addItem();

}else{

const inputs =
Array.from(
document.querySelectorAll("input")
);

const index =
inputs.indexOf(active);

if(index > -1 &&
index < inputs.length-1){

inputs[index+1].focus();

}

}

}

});