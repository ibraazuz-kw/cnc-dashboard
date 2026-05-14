let orders = JSON.parse(
localStorage.getItem("orders")
) || [

{
id:1,

company:"PRO DESIGN",

design:"باب خارجي مودرن",

sheets:"3 شيت ألمنيوم",

size:"300 × 100",

price:"450",

status:"بانتظار الاعتماد"

},

{
id:2,

company:"PRO DESIGN",

design:"بوابة CNC",

sheets:"5 شيتات",

size:"400 × 220",

price:"780",

status:"قيد التصنيع"

}

];

/* =========================
   Save Orders
========================= */

function saveOrders(){

localStorage.setItem(
"orders",
JSON.stringify(orders)
);

}