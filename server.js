const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let ORDERS = [];

app.post("/api/order", (req,res)=>{
  ORDERS.push(req.body);
  res.json({ok:true});
});

app.get("/api/orders", (req,res)=>{
  res.json(ORDERS);
});

app.listen(PORT, ()=>console.log("Running on",PORT));