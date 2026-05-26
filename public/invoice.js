// invoice.js

document.getElementById("date").innerText =
new Date().toLocaleDateString("en-GB");

function downloadPDF(){

const element =
document.getElementById("invoice");

html2pdf()
.set({

margin:0.5,

filename:'ProDesign-Invoice.pdf',

image:{
type:'jpeg',
quality:1
},

html2canvas:{
scale:2
},

jsPDF:{
unit:'in',
format:'a4',
orientation:'portrait'
}

})

.from(element)

.save();

}

function sendWhatsApp(){

let phone = "96596765547";

let message =
`مرحباً،
تم إصدار فاتورتكم من Pro Design ✅`;

window.open(

`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,

'_blank'

);

}