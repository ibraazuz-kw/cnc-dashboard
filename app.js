const user = localStorage.getItem("pd_user");
if(!user) location.href="/";

document.getElementById("client").innerText="👤 "+user;

function saveOrder(){
 const h=hInput=h=document.getElementById("h").value;
 const w=document.getElementById("w").value;
 const d=document.getElementById("dir").value;

 const orders=JSON.parse(localStorage.getItem("pd_orders")||"[]");
 orders.push({user,h,w,d,time:new Date().toLocaleString()});
 localStorage.setItem("pd_orders",JSON.stringify(orders));
 show();
}

function show(){
 const list=JSON.parse(localStorage.getItem("pd_orders")||"[]");
 const box=document.getElementById("list");
 box.innerHTML="";
 list.filter(o=>o.user===user).forEach(o=>{
   box.innerHTML+=`<div class="card">${o.h}×${o.w} سم — ${o.d}<br>${o.time}</div>`;
 });
}

show();