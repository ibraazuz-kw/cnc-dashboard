const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static("public"));

/* =========================
   MongoDB
========================= */

mongoose.connect(
"mongodb+srv://YOUR_MONGO_URL",
{
useNewUrlParser:true,
useUnifiedTopology:true
}
).then(()=>{
console.log("MongoDB Connected");
}).catch(err=>{
console.log(err);
});

/* =========================
   Uploads
========================= */

const storage = multer.diskStorage({

destination:function(req,file,cb){

cb(null,"public/uploads");

},

filename:function(req,file,cb){

cb(null,Date.now() + path.extname(file.originalname));

}

});

const upload = multer({storage});

/* =========================
   Schema
========================= */

const OrderSchema = new mongoose.Schema({

clientName:String,
projectName:String,
projectDetails:String,
projectStatus:String,

file:String,

pricing:Object,

createdAt:{
type:Date,
default:Date.now
}

});

const Order = mongoose.model("Order",OrderSchema);

/* =========================
   Routes
========================= */

// جلب الطلبات

app.get("/orders",async(req,res)=>{

const orders = await Order.find().sort({_id:-1});

res.json(orders);

});

// إنشاء طلب

app.post("/orders",upload.single("file"),async(req,res)=>{

try{

const order = new Order({

clientName:req.body.clientName,
projectName:req.body.projectName,
projectDetails:req.body.projectDetails,
projectStatus:"بانتظار الاعتماد",

file:req.file
? "/uploads/" + req.file.filename
: ""

});

await order.save();

res.json(order);

}catch(err){

res.status(500).json({
message:"Error"
});

}

});

// تحديث التسعير

app.put("/orders/:id/pricing",async(req,res)=>{

try{

const order = await Order.findById(req.params.id);

order.pricing = req.body;

await order.save();

res.json(order);

}catch(err){

res.status(500).json({
message:"Error"
});

}

});

// اعتماد التصميم

app.put("/orders/:id/approve",async(req,res)=>{

try{

const order = await Order.findById(req.params.id);

order.projectStatus = "تم الاعتماد";

await order.save();

res.json(order);

}catch(err){

res.status(500).json({
message:"Error"
});

}

});

/* =========================
   Start
========================= */

const PORT = process.env.PORT || 10000;

app.listen(PORT,()=>{

console.log("Server Running");

});