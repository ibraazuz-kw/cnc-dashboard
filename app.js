const box = document.getElementById("sheetBox");

function addSheet(){
  const row = document.createElement("div");
  row.className="card";

  row.innerHTML=`
    <div class="row">
      <select class="size"></select>
      <select class="thick"></select>
      <input type="number" min="1" value="1" class="qty">
    </div>
    <button onclick="this.parentElement.remove()">حذف</button>
  `;

  const sizeSel=row.querySelector(".size");
  SHEET_SIZES.forEach(s=>{
    sizeSel.innerHTML+=`<option>${s}</option>`;
  });

  const thickSel=row.querySelector(".thick");
  THICKNESS.forEach(t=>{
    thickSel.innerHTML+=`<option>${t}</option>`;
  });

  box.appendChild(row);
}

addSheet();

async function sendOrder(){
  const sheets=[...document.querySelectorAll(".card")].map(c=>({
    size:c.querySelector(".size").value,
    thickness:c.querySelector(".thick").value,
    qty:c.querySelector(".qty").value
  }));

  await fetch("/api/order",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({sheets})
  });

  alert("✅ تم إرسال الطلب");
}