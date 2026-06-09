let grandTotal = 0;
let rowNumber = 1;

function addItem(){

const service =
document.getElementById("service").value;

const thickness =
document.getElementById("thickness").value;

const qty =
Number(document.getElementById("qty").value);

const price =
Number(document.getElementById("price").value);

if(!service || qty <= 0 || price <= 0){

alert("أدخل البيانات كاملة");

return;

}

const total = qty * price;

grandTotal += total;

document.getElementById("invoiceRows").innerHTML += `

<tr>

<td>${rowNumber}</td>

<td>${service}</td>

<td>${thickness}</td>

<td>${qty}</td>

<td>${price.toFixed(3)}</td>

<td>${total.toFixed(3)}</td>

</tr>

`;

document.getElementById("grandTotal").innerText =
grandTotal.toFixed(3);

rowNumber++;

document.getElementById("service").value = "";
document.getElementById("thickness").value = "";
document.getElementById("qty").value = "";
document.getElementById("price").value = "";

}