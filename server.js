<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>لوحة تحكم CNC</title>

  <style>
    body{
      font-family: Arial, sans-serif;
      background:#f5f5f5;
      margin:0;
      padding:0;
      text-align:center;
    }
    header{
      background:#111;
      color:white;
      padding:20px;
      font-size:22px;
      font-weight:bold;
    }
    .container{
      margin:30px auto;
      width:90%;
      max-width:500px;
      background:white;
      padding:20px;
      border-radius:12px;
      box-shadow:0 0 10px rgba(0,0,0,0.1);
    }
    .logo{
      font-size:26px;
      font-weight:bold;
      margin-bottom:10px;
      color:#222;
    }
    .btn{
      display:block;
      width:100%;
      padding:15px;
      margin:10px 0;
      border:none;
      border-radius:10px;
      font-size:18px;
      cursor:pointer;
      background:#007bff;
      color:white;
    }
    .btn:hover{
      opacity:0.9;
    }
    .btn.admin{
      background:#28a745;
    }
    .note{
      margin-top:15px;
      font-size:14px;
      color:#666;
    }
  </style>
</head>

<body>

  <header>بوابة لوحة تحكم CNC</header>

  <div class="container">
    <div class="logo">Pro Design</div>
    <p>اختر نوع الدخول:</p>

    <button class="btn" onclick="location.href='/client'">دخول العميل</button>
    <button class="btn admin" onclick="location.href='/admin'">دخول الأدمن</button>

    <div class="note">
      إذا طلع لك Not Found يعني لازم نجهز صفحات /client و /admin بعد.
    </div>
  </div>

</body>
</html>
