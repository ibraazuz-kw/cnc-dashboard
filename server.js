const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let ORDERS = [];

app.post("/api/order",(req,res)=>{
  ORDERS.push({
    id:Date.now(),
    ...req.body,
    status:"قيد التشغيل"
  });
  res.json({ok:true});
});

app.get("/api/orders",(req,res)=>{
  res.json(ORDERS);
});

app.post("/api/status",(req,res)=>{
  const o=ORDERS.find(x=>x.id==req.body.id);
  if(o) o.status=req.body.status;
  res.json({ok:true});
});

app.listen(PORT,()=>console.log("Running",PORT));