let orders = JSON.parse(
localStorage.getItem("orders")
) || [];

function saveOrders(){
localStorage.setItem(
"orders",
JSON.stringify(orders)
);
}

function createOrder(order){

order.id = Date.now();

order.date = new Date().toLocaleDateString("en-GB");

order.status = "جديد";

orders.push(order);

saveOrders();

}

function getOrders(){

return orders;

}

function updateStatus(id,newStatus){

orders = orders.map(order=>{

if(order.id == id){

order.status = newStatus;

}

return order;

});

saveOrders();

}

function getOrder(id){

return orders.find(
x => x.id == id
);

}

function deleteOrder(id){

orders = orders.filter(
x => x.id != id
);

saveOrders();

}