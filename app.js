function doorArrowSVG(directionKey = "right") {
  const isRight = directionKey === "right";

  // مكان المفصلة (يمين/يسار)
  const hingeX = isRight ? 15 : 85;

  // خط المفصلة
  const hingeLine = `M${hingeX} 15 L${hingeX} 85`;

  // السهم فوق الباب (يوضح اتجاه الفتح)
  // يمين: السهم فوق من اليسار لليمين
  // يسار: السهم فوق من اليمين لليسار
  const topArrowLine = isRight
    ? "M20 12 L80 12"
    : "M80 12 L20 12";

  const topArrowHead = isRight
    ? "M80 12 L72 6 M80 12 L72 18"
    : "M20 12 L28 6 M20 12 L28 18";

  // شكل فتح الباب (خط مائل داخل الباب)
  const doorSwing = isRight
    ? "M25 80 L75 20"
    : "M75 80 L25 20";

  // نقطة المقبض (مثل الورقة)
  const knob = isRight
    ? `<circle cx="70" cy="55" r="4" fill="#111" />`
    : `<circle cx="30" cy="55" r="4" fill="#111" />`;

  return `
  <svg width="70" height="70" viewBox="0 0 100 100" style="display:block;margin:auto;">
    <!-- إطار الباب -->
    <rect x="10" y="10" width="80" height="80" rx="8" ry="8" fill="#fff" stroke="#111" stroke-width="4"/>

    <!-- خط المفصلة -->
    <path d="${hingeLine}" stroke="#111" stroke-width="6" />

    <!-- سهم الاتجاه فوق الباب -->
    <path d="${topArrowLine}" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="${topArrowHead}" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>

    <!-- خط الفتح داخل الباب -->
    <path d="${doorSwing}" stroke="#111" stroke-width="5" fill="none" stroke-linecap="round"/>

    <!-- المقبض -->
    ${knob}
  </svg>`;
}
