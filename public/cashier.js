// cashier.js

let total = 0;

function increase(btn){

let span = btn.parentElement.querySelector("span");

span.innerText = parseInt(span.innerText)+1;

}

function decrease(btn){

let span = btn.parentElement.querySelector("span");

if(parseInt(span.innerText)>1){

span.innerText = parseInt(span.innerText)-1;

}

}

function addToCart(name,price,btn){

let qty = parseInt(
btn.parentElement.querySelector("span").innerText
);

let cart = document.getElementById("cart-items");

let item = document.createElement("div");

item.style.marginBottom="10px";

item.innerHTML = `
${name}
× ${qty}
= ${price*qty} د.ك
`;

cart.appendChild(item);

total += price*qty;

document.getElementById("total").innerText = total;

}

function filterCategory(category){

let products = document.querySelectorAll(".product");

products.forEach(product=>{

if(category==="all"){

product.style.display="block";

}else{

product.style.display =
product.dataset.category===category
? "block"
: "none";

}

});

}

function printInvoice(){

window.print();

}

document.getElementById("search")
.addEventListener("keyup",function(){

let value = this.value.toLowerCase();

let products = document.querySelectorAll(".product");

products.forEach(product=>{

let name =
product.querySelector("h3")
.innerText
.toLowerCase();

product.style.display =
name.includes(value)
? "block"
: "none";

});

});