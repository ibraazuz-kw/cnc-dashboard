function makeInvoice(i){
 const o=getOrders()[i];

 const w=window.open("");
 w.document.write(`
 <h1>Pro Design CNC</h1>
 <h3>فاتورة رسمية</h3>
 <hr>
 المادة: ${o.material}<br>
 نوع الشغل: ${o.work}<br>
 السعر: ${o.price} د.ك<br>
 <hr>
 لا يتم التنفيذ إلا بعد اعتماد الفاتورة
 `);

 w.print();
}