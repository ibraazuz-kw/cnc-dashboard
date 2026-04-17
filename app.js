const doorsBox=document.getElementById("doors");
const sheetsBox=document.getElementById("sheets");

function addDoor(){
 const d=document.createElement("div");
 d.className="card";
 d.innerHTML=`
 <input placeholder="ارتفاع">
 <input placeholder="عرض">
 <select><option>يمين</option><option>يسار</option></select>
 `;
 doorsBox.appendChild(d);
}

function addSheet(){
 const s=document.createElement("div");
 s.className="card";

 let sizeOptions=SIZES.map(x=>`<option>${x}</option>`).join("");
 let thickOptions=THICK.map(x=>`<option>${x}</option>`).join("");

 s.innerHTML=`
 <div class="row">
  <select class="size">${sizeOptions}</select>
  <select class="thick">${thickOptions}</select>
  <input type="number" value="1" class="qty">
 </div>
 `;
 sheetsBox.appendChild(s);
}

addDoor();
addSheet();

async function send(){

 const doors=[...doorsBox.children].map(d=>({
  h:d.children[0].value,
  w:d.children[1].value,
  dir:d.children[2].value
 }));

 const sheets=[...sheetsBox.children].map(s=>({
  size:s.querySelector(".size").value,
  thick:s.querySelector(".thick").value,
  qty:s.querySelector(".qty").value
 }));

 await fetch("/api/order",{
  method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({
    material:material.value,
    type:type.value,
    doors,
    sheets,
    notes:notes.value
  })
 });

 alert("✅ تم إرسال الطلب");

 // 🔥 يفضي الفورم (اختيارك A)
 doorsBox.innerHTML="";
 sheetsBox.innerHTML="";
 notes.value="";

 addDoor();
 addSheet();
}