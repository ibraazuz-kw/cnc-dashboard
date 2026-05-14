let orders = JSON.parse(localStorage.getItem("orders")) || [

  {
    id: 1,
    company: "شركة باب السيف",
    design: "باب خارجي مودرن",
    sheets: "3 شيت ألمنيوم",
    size: "300 × 100",
    price: "450",
    status: "بانتظار الاعتماد"
  },

  {
    id: 2,
    company: "شركة الهاجري",
    design: "بوابة CNC",
    sheets: "5 شيتات",
    size: "400 × 220",
    price: "780",
    status: "قيد التصنيع"
  }

];

function saveOrders() {
  localStorage.setItem("orders", JSON.stringify(orders));
}