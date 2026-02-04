const doors = document.getElementById("doors")
const sheets = document.getElementById("sheets")

function addDoor(){
const div = document.createElement("div")
div.className="block"
div.innerHTML=`
<div class="row">
<input placeholder="الارتفاع cm">
<input placeholder="العرض cm">
</div>

<select>
<option>باب مفرد</option>
<option>باب دبل</option>
<option>باب ونص</option>
</select>

<div class="dir">
<button onclick="setDir(this)">يمين</button>
<button onclick="setDir(this)">يسار</button>
</div>

<label>فكس فوق الباب</label>
<div class="row">
<input placeholder="عرض الفكس cm">
<input placeholder="ارتفاع الفكس cm">
</div>
`
doors.appendChild(div)
}

function setDir(btn){
const parent = btn.parentElement.querySelectorAll("button")
parent.forEach(b=>b.classList.remove("active"))
btn.classList.add("active")
}

function addSheet(){
const div = document.createElement("div")
div.className="block"
div.innerHTML=`
<select>
<option>122x244</option>
<option>122x300</option>
<option>150x300</option>
<option>100x200</option>
<option>122x350</option>
<option>122x400</option>
<option>150x400</option>
</select>

<select>
<option>2 mm</option>
<option>3 mm</option>
<option>4 mm</option>
<option>5 mm</option>
<option>6 mm</option>
<option>8 mm</option>
<option>10 mm</option>
<option>12 mm</option>
</select>

<input type="number" placeholder="الكمية">
`
sheets.appendChild(div)
}

function sendOrder(){
alert("✅ تم إرسال أمر التشغيل (نسخة تجريبية — جاهزة للربط بالأدمن)")
}