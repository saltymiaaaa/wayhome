/* WayHome icon set. Two-tone: solid accents + soft translucent body, all drawn on a 32x32 grid. */
(function () {
  const S = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
  const SOFT = 'fill="currentColor" opacity=".26"';
  const SOLID = 'fill="currentColor"';
  const I = {
    home: `<path d="M6.5 14.5V27h19V14.5L16 6z" ${SOFT}/><path d="M3 15.5 16 4l13 11.5" ${S}/><rect x="13" y="18.5" width="6" height="8.5" rx="1.6" ${SOLID}/><rect x="21.2" y="6.8" width="3" height="6" rx=".8" ${SOLID}/><circle cx="17.6" cy="23" r=".8" fill="#fff"/>`,
    phone: `<path d="M9.2 4h3.6c.6 0 1 .4 1.1 1l.7 4c.1.5-.1 1-.5 1.3l-2.2 1.6a15 15 0 0 0 6.2 6.2l1.6-2.2c.3-.4.8-.6 1.3-.5l4 .7c.6.1 1 .5 1 1.1v3.6a2.6 2.6 0 0 1-2.8 2.6C13.6 25.800 6.200 18.400 6.600 6.800A2.600 2.600 0 0 1 9.200 4z" ${SOFT}/><path d="M9.2 4h3.6c.6 0 1 .4 1.1 1l.7 4c.1.5-.1 1-.5 1.3l-2.2 1.6a15 15 0 0 0 6.2 6.2l1.6-2.2c.3-.4.8-.6 1.3-.5l4 .7c.6.1 1 .5 1 1.1v3.6a2.6 2.6 0 0 1-2.8 2.6C13.6 25.800 6.200 18.400 6.600 6.800A2.600 2.600 0 0 1 9.200 4z" ${S}/><path d="M20 5.500a7 7 0 0 1 6.500 6.500M20 9.500a3.300 3.300 0 0 1 2.500 2.500" ${S}/>`,
    assistant: `<rect x="4.500" y="9" width="23" height="16" rx="6.500" ${SOFT}/><rect x="4.500" y="9" width="23" height="16" rx="6.500" ${S}/><path d="M16 9V5" ${S}/><circle cx="16" cy="4.200" r="1.800" ${SOLID}/><circle cx="11.500" cy="16.500" r="2.200" ${SOLID}/><circle cx="20.500" cy="16.500" r="2.200" ${SOLID}/><path d="M12 21.200c2.500 1.600 5.500 1.600 8 0" ${S}/><path d="M2 15v4M30 15v4" ${S}/>`,
    sos: `<path d="M16 3 5 7.200v8.300c0 6.500 4.300 11 11 13.500 6.700-2.500 11-7 11-13.500V7.200z" ${SOFT}/><path d="M16 3 5 7.200v8.300c0 6.500 4.300 11 11 13.500 6.700-2.500 11-7 11-13.500V7.200z" ${S}/><path d="M16 10v7" ${S}/><circle cx="16" cy="21.300" r="1.400" ${SOLID}/>`,
    heart: `<path d="M16 28S3.500 20.500 3.500 11.800A6.300 6.300 0 0 1 16 9.400a6.300 6.300 0 0 1 12.500 2.400C28.500 20.500 16 28 16 28z" ${SOFT}/><path d="M16 28S3.500 20.500 3.500 11.800A6.300 6.300 0 0 1 16 9.400a6.300 6.300 0 0 1 12.500 2.400C28.500 20.500 16 28 16 28z" ${S}/>`,
    pulse: `<path d="M2 17h6l3-8 5 15 4-11 2 4h8" ${S}/>`,
    pin: `<path d="M16 29S6 20 6 12.500a10 10 0 0 1 20 0C26 20 16 29 16 29z" ${SOFT}/><path d="M16 29S6 20 6 12.500a10 10 0 0 1 20 0C26 20 16 29 16 29z" ${S}/><circle cx="16" cy="12.500" r="3.800" ${SOLID}/>`,
    bell: `<path d="M7 22c1.500-2 2.300-4 2.300-8a6.700 6.700 0 0 1 13.400 0c0 4 .8 6 2.300 8z" ${SOFT}/><path d="M7 22c1.500-2 2.300-4 2.300-8a6.700 6.700 0 0 1 13.400 0c0 4 .8 6 2.300 8zM13 26a3 3 0 0 0 6 0" ${S}/>`,
    battery: `<rect x="3" y="9" width="22" height="14" rx="3.500" ${SOFT}/><rect x="3" y="9" width="22" height="14" rx="3.500" ${S}/><path d="M28.500 13.500v5" ${S}/><rect x="6.500" y="12.500" width="12" height="7" rx="1.400" ${SOLID}/>`,
    batteryLow: `<rect x="3" y="9" width="22" height="14" rx="3.500" ${SOFT}/><rect x="3" y="9" width="22" height="14" rx="3.500" ${S}/><path d="M28.500 13.500v5" ${S}/><rect x="6.500" y="12.500" width="4" height="7" rx="1.200" ${SOLID}/>`,
    pill: `<g transform="rotate(-40 16 16)"><rect x="3.500" y="10.500" width="25" height="11" rx="5.500" ${SOFT}/><rect x="3.500" y="10.500" width="25" height="11" rx="5.500" ${S}/><path d="M16 10.500v11" ${S}/><rect x="16" y="10.500" width="12.500" height="11" rx="5.500" ${SOLID} opacity=".55"/></g>`,
    camera: `<path d="M3.500 11a2.500 2.500 0 0 1 2.500-2.500h2.800l1.700-2.800h8l1.700 2.800H26a2.500 2.500 0 0 1 2.500 2.500v12.500A2.500 2.500 0 0 1 26 26H6a2.500 2.500 0 0 1-2.500-2.500z" ${SOFT}/><path d="M3.500 11a2.500 2.500 0 0 1 2.500-2.500h2.800l1.700-2.800h8l1.700 2.800H26a2.500 2.500 0 0 1 2.500 2.500v12.500A2.500 2.500 0 0 1 26 26H6a2.500 2.500 0 0 1-2.500-2.500z" ${S}/><circle cx="16" cy="17" r="4.600" ${S}/><circle cx="16" cy="17" r="1.800" ${SOLID}/>`,
    nav: `<path d="M27 4.500 4.500 14l9 3.500 3.500 9z" ${SOFT}/><path d="M27 4.500 4.500 14l9 3.500 3.500 9z" ${S}/>`,
    mic: `<rect x="11" y="3" width="10" height="16" rx="5" ${SOFT}/><rect x="11" y="3" width="10" height="16" rx="5" ${S}/><path d="M6.500 15a9.500 9.500 0 0 0 19 0M16 24.500V29M11.500 29h9" ${S}/>`,
    send: `<path d="M28 4 13 19" ${S}/><path d="M28 4 19.500 28l-6.500-9L4 12.500z" ${SOFT}/><path d="M28 4 19.500 28l-6.500-9L4 12.500z" ${S}/>`,
    close: `<path d="M7 7l18 18M25 7 7 25" ${S}/>`,
    shield: `<path d="M16 3 5 7.200v8.300c0 6.500 4.300 11 11 13.500 6.700-2.500 11-7 11-13.500V7.200z" ${SOFT}/><path d="M16 3 5 7.200v8.300c0 6.500 4.300 11 11 13.500 6.700-2.500 11-7 11-13.500V7.200z" ${S}/><path d="m11 16 3.600 3.600L21.500 12" ${S}/>`,
    user: `<circle cx="16" cy="10.500" r="5.500" ${SOFT}/><circle cx="16" cy="10.500" r="5.500" ${S}/><path d="M5 28c.8-6 5-9 11-9s10.200 3 11 9z" ${SOFT}/><path d="M5 28c.8-6 5-9 11-9s10.200 3 11 9" ${S}/>`,
    users: `<circle cx="12" cy="11" r="4.600" ${SOFT}/><circle cx="12" cy="11" r="4.600" ${S}/><path d="M3 27c.6-5.200 4-8 9-8s8.400 2.800 9 8" ${S}/><path d="M21.500 6.800a4.600 4.600 0 0 1 0 8.600M24.500 19.500c2.600 1.200 4 3.500 4.500 7.500" ${S}/>`,
    watch: `<rect x="8" y="8" width="16" height="16" rx="5" ${SOFT}/><rect x="8" y="8" width="16" height="16" rx="5" ${S}/><path d="M11 8l1-5h8l1 5M11 24l1 5h8l1-5" ${S}/><path d="M16 12.500V16l2.500 1.800" ${S}/>`,
    pendant: `<path d="M8 3l8 11 8-11" ${S}/><circle cx="16" cy="20.500" r="7.500" ${SOFT}/><circle cx="16" cy="20.500" r="7.500" ${S}/><path d="M16 16.500v4l2.500 1.500" ${S}/>`,
    alert: `<path d="M16 4 2.500 27.500h27z" ${SOFT}/><path d="M16 4 2.500 27.500h27z" ${S}/><path d="M16 12.500v7" ${S}/><circle cx="16" cy="23.600" r="1.400" ${SOLID}/>`,
    power: `<path d="M16 4v11" ${S}/><path d="M8.600 8.800a11 11 0 1 0 14.800 0" ${S}/>`,
    flag: `<path d="M7 29V4" ${S}/><path d="M7 5h17l-4 5.500 4 5.500H7z" ${SOFT}/><path d="M7 5h17l-4 5.500 4 5.500H7" ${S}/>`,
    spark: `<path d="M16 3l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" ${SOFT}/><path d="M16 3l3 9 9 3-9 3-3 9-3-9-9-3 9-3z" ${S}/><path d="M26 3v5M23.500 5.500h5" ${S}/>`,
    map: `<path d="M3.500 8.500 11 5.500l10 3 7.500-3v18l-7.500 3-10-3-7.500 3z" ${SOFT}/><path d="M3.500 8.500 11 5.500l10 3 7.500-3v18l-7.500 3-10-3-7.500 3zM11 5.500v18M21 8.500v18" ${S}/>`,
    check: `<path d="m6 17 6.500 6.500L26 9.500" ${S}/>`,
    walk: `<circle cx="18" cy="5.500" r="2.800" ${SOLID}/><path d="M16 29l2-8-4-4 1.500-7.500 5 3 3.500 1M17.500 21 22 29M14.700 11.500 10 13.500" ${S}/>`,
    settings: `<circle cx="16" cy="16" r="4.400" ${SOFT}/><circle cx="16" cy="16" r="4.400" ${S}/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.800 6.800l2.800 2.800M22.400 22.400l2.800 2.800M25.200 6.800l-2.800 2.800M9.600 22.400l-2.800 2.800" ${S}/>`,
    chat: `<path d="M28 15.500c0 5.500-5 9.500-11 9.500-1.300 0-2.600-.2-3.800-.5L6 27.500l2-5.200C5.800 20.500 4 18.200 4 15.500 4 10 9 6 16 6s12 4 12 9.500z" ${SOFT}/><path d="M28 15.500c0 5.500-5 9.500-11 9.500-1.300 0-2.600-.2-3.800-.5L6 27.500l2-5.200C5.800 20.500 4 18.200 4 15.500 4 10 9 6 16 6s12 4 12 9.500z" ${S}/><path d="M11 15.500h.1M16 15.500h.1M21 15.500h.1" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`,
    refresh: `<path d="M27 5v7h-7M5 27v-7h7" ${S}/><path d="M6.200 13a10.500 10.500 0 0 1 18.800-3.500L27 12M25.800 19a10.500 10.500 0 0 1-18.800 3.500L5 20" ${S}/>`,
    image: `<rect x="3.500" y="5.500" width="25" height="21" rx="4" ${SOFT}/><rect x="3.500" y="5.500" width="25" height="21" rx="4" ${S}/><circle cx="11" cy="12.500" r="2.400" ${SOLID}/><path d="m4.500 23.500 7-7 5 5 4-4 7 7" ${S}/>`,
    eye: `<path d="M2.500 16S7 7.500 16 7.500 29.500 16 29.500 16 25 24.500 16 24.500 2.500 16 2.500 16z" ${SOFT}/><path d="M2.500 16S7 7.500 16 7.500 29.500 16 29.500 16 25 24.500 16 24.500 2.500 16 2.500 16z" ${S}/><circle cx="16" cy="16" r="4.200" ${SOLID}/><circle cx="17.500" cy="14.500" r="1.200" fill="#fff"/>`,
    hand: `<path d="M10 17V7.500a2 2 0 0 1 4 0V15m0-8.500V5a2 2 0 0 1 4 0v10m0-8a2 2 0 0 1 4 0v9.500m0-5.500a2 2 0 0 1 4 0v8c0 6-4 10-10 10h-1c-4 0-6.500-1.500-8.500-4.500L5 19.500a2 2 0 0 1 3.300-2.200L10 19.500" ${S}/>`,
    volume: `<path d="M14 7 8.500 12H4v8h4.500L14 25z" ${SOFT}/><path d="M14 7 8.500 12H4v8h4.500L14 25z" ${S}/><path d="M19 11.500a6 6 0 0 1 0 9M22.500 8a11 11 0 0 1 0 16" ${S}/>`,
    clock: `<circle cx="16" cy="16" r="12.500" ${SOFT}/><circle cx="16" cy="16" r="12.500" ${S}/><path d="M16 9v7l4.500 3" ${S}/>`,
    moon: `<path d="M26 19.500A11 11 0 0 1 12.500 6 11 11 0 1 0 26 19.500z" ${SOFT}/><path d="M26 19.500A11 11 0 0 1 12.500 6 11 11 0 1 0 26 19.500z" ${S}/>`,
    sun: `<circle cx="16" cy="16" r="6" ${SOFT}/><circle cx="16" cy="16" r="6" ${S}/><path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.800 6.800l2 2M23.200 23.200l2 2M25.200 6.800l-2 2M8.800 23.200l-2 2" ${S}/>`,
    skip: `<path d="M6 7l11 9-11 9zM17 7l11 9-11 9z" ${SOFT}/><path d="M6 7l11 9-11 9zM17 7l11 9-11 9z" ${S}/>`,
    left: `<path d="M26 28V14.500a4 4 0 0 0-4-4H8" ${S}/><path d="m13 4.500-6 6 6 6" ${S}/>`,
    right: `<path d="M6 28V14.500a4 4 0 0 1 4-4h14" ${S}/><path d="m19 4.500 6 6-6 6" ${S}/>`,
    straight: `<path d="M16 29V6" ${S}/><path d="m8 13 8-8 8 8" ${S}/>`,
    uturn: `<path d="M9 28V12a7 7 0 0 1 14 0v6" ${S}/><path d="m17.500 13.500 5.500 5.500 5.500-5.500" ${S}/>`,
    crossing: `<path d="M4 8h24M4 14h24M4 20h24M4 26h24" ${S} stroke-width="3.400"/>`,
    traffic: `<rect x="10" y="3" width="12" height="26" rx="4.500" ${SOFT}/><rect x="10" y="3" width="12" height="26" rx="4.500" ${S}/><circle cx="16" cy="9.500" r="2.300" ${SOLID}/><circle cx="16" cy="16" r="2.300" ${SOLID} opacity=".35"/><circle cx="16" cy="22.500" r="2.300" ${SOLID} opacity=".35"/>`,
    stop: `<path d="M11 4h10l7 7v10l-7 7H11l-7-7V11z" ${SOFT}/><path d="M11 4h10l7 7v10l-7 7H11l-7-7V11z" ${S}/><path d="M11 16h10" ${S}/>`,
    plus: `<path d="M16 6v20M6 16h20" ${S}/>`,
    trash: `<path d="M7 9h18l-1.500 18h-15z" ${SOFT}/><path d="M5 9h22M12 9V5h8v4M8 9l1.500 18h13L24 9M13 14v8M19 14v8" ${S}/>`,
    ring: `<path d="M7 22c1.500-2 2.300-4 2.300-8a6.700 6.700 0 0 1 13.400 0c0 4 .8 6 2.300 8z" ${SOFT}/><path d="M7 22c1.500-2 2.300-4 2.300-8a6.700 6.700 0 0 1 13.400 0c0 4 .8 6 2.300 8z" ${S}/><path d="M3 10c.8-2.500 2.200-4.300 4.200-5.600M29 10c-.8-2.500-2.200-4.300-4.200-5.600M13 26a3 3 0 0 0 6 0" ${S}/>`,
    route: `<circle cx="7" cy="25" r="3" ${SOLID}/><circle cx="25" cy="7" r="3" ${SOLID}/><path d="M7 22c0-8 18-2 18-12" ${S} stroke-dasharray="1 4.500"/>`,
    wifioff: `<path d="M3 11.500a19 19 0 0 1 8-4M29 11.500a19 19 0 0 0-5-3.300M8 17a12 12 0 0 1 4.500-2.600M24 17a12 12 0 0 0-2-1.700M12.500 22.500a6.500 6.500 0 0 1 7 0" ${S}/><circle cx="16" cy="26.500" r="1.400" ${SOLID}/><path d="M4 4l24 24" ${S}/>`,
    gps: `<circle cx="16" cy="16" r="8.500" ${SOFT}/><circle cx="16" cy="16" r="8.500" ${S}/><circle cx="16" cy="16" r="3" ${SOLID}/><path d="M16 2.500v5M16 24.500v5M2.500 16h5M24.500 16h5" ${S}/>`,
    bulb: `<path d="M16 3a9 9 0 0 0-5 16.500c.8.700 1 1.500 1 2.500h8c0-1 .2-1.800 1-2.500A9 9 0 0 0 16 3z" ${SOFT}/><path d="M16 3a9 9 0 0 0-5 16.500c.8.700 1 1.500 1 2.500h8c0-1 .2-1.800 1-2.500A9 9 0 0 0 16 3zM12.500 26h7M13.500 29h5" ${S}/>`,
    ladder: `<path d="M9 3v26M23 3v26M9 8h14M9 14h14M9 20h14M9 26h14" ${S}/>`,
    link: `<path d="M13.500 18.500a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-1.500 1.500M18.500 13.500a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l1.500-1.500" ${S}/>`,
    star: `<path d="m16 3.500 3.900 8 8.800 1.200-6.400 6.200 1.600 8.800-7.900-4.200-7.900 4.200 1.600-8.800-6.400-6.200 8.800-1.200z" ${SOFT}/><path d="m16 3.500 3.900 8 8.800 1.200-6.400 6.200 1.600 8.800-7.900-4.200-7.900 4.200 1.600-8.800-6.400-6.200 8.800-1.200z" ${S}/>`,
    siren: `<path d="M7 26v-9a9 9 0 0 1 18 0v9z" ${SOFT}/><path d="M7 26v-9a9 9 0 0 1 18 0v9zM4 26h24M16 3v3M5 8l2 2M27 8l-2 2" ${S}/><path d="M12 17a4 4 0 0 1 4-4" ${S}/>`,
    ambulance: `<path d="M2 11h17v13H2zM19 15h6l5 5v4H19z" ${SOFT}/><path d="M2 11h17v13H2zM19 15h6l5 5v4H19z" ${S}/><circle cx="8" cy="25.500" r="2.600" fill="#fff" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="25.500" r="2.600" fill="#fff" stroke="currentColor" stroke-width="2"/><path d="M10.500 14v6M7.500 17h6" ${S}/>`,
    chart: `<path d="M4 26V6M4 26h24" ${S}/><path d="m8 20 5-6 4 3 7-9" ${S}/>`,
    lock: `<rect x="6" y="14" width="20" height="14" rx="4" ${SOFT}/><rect x="6" y="14" width="20" height="14" rx="4" ${S}/><path d="M10.500 14V10a5.500 5.500 0 0 1 11 0v4" ${S}/>`,
    qr: `<rect x="4" y="4" width="9" height="9" rx="1.500" ${S}/><rect x="19" y="4" width="9" height="9" rx="1.500" ${S}/><rect x="4" y="19" width="9" height="9" rx="1.500" ${S}/><path d="M19 19h3v3h-3zM25 19h3v3M19 25h3M25 25h3v3" ${S}/>`,
    sparkle: `<path d="M16 4c.8 6.500 3.500 9.200 10 10-6.500.8-9.200 3.500-10 10-.8-6.500-3.500-9.200-10-10 6.500-.8 9.200-3.500 10-10z" ${SOLID}/>`
  };
  window.ICONS = I;
  window.ic = function (name, size, cls) {
    return `<svg class="ic ${cls || ''}" width="${size || 22}" height="${size || 22}" viewBox="0 0 32 32" aria-hidden="true">${I[name] || I.spark}</svg>`;
  };
  // fill every [data-ic] placeholder (also called after dynamic renders)
  window.paintIcons = function (root) {
    (root || document).querySelectorAll('[data-ic]').forEach(function (el) {
      if (el.dataset.painted === el.dataset.ic + el.dataset.sz) return;
      el.innerHTML = ic(el.dataset.ic, el.dataset.sz || 22) + (el.dataset.keep ? el.dataset.keep : '');
      el.dataset.painted = el.dataset.ic + el.dataset.sz;
    });
  };
})();
