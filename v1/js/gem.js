/* WayHome V1 (aligned with the system deck, v3)
   Round Ping An Gem + the three workflows:
     WF1 normal trip home (GPS check, route check, landmark by landmark, "Are you home?")
     WF2 something seems wrong (gentle check-in, notify caregiver within T1, backup contact after T2)
     WF3 SOS (REQUESTED > QUEUED > SENT > DELIVERED > ACKNOWLEDGED > SAFE, honest status words)
   Nothing advances without a real tap, except the simulated walking itself and system checks. */
(function () {
  const WH = window.WH, S = WH.S, $ = WH.$, $$ = WH.$$, E = WH.esc;
  const M = 1000 / WH.CITY.KM; // metres per world unit

  /* ───────────── words ───────────── */
  const L = {
    en: {
      home: 'GO HOME', contact: 'CONTACT MY FAMILY', back: 'BACK', start: 'START', done: 'DONE', yes: 'YES', no: 'NO',
      seeIt: 'I SEE IT', cantSee: "CAN'T SEE", lookAgain: 'LOOK AGAIN', pause: 'PAUSE', go: 'KEEP WALKING', tryAgain: 'TRY AGAIN', cont: 'CONTINUE',
      imOk: "I'M OK", takeHome: 'TAKE ME HOME', help: 'I NEED HELP', cancel: 'CANCEL',
      safeNow: 'You are safe', routeReady: 'Route ready · {n} landmarks', noRoute: 'No route set up yet', hintHold: 'Press and hold the gold bar to ask for help',
      noRouteH: 'GO HOME is off', noRouteP: 'No verified route yet. Ask your family to set one up.',
      atHomeH: 'You are home', atHomeP: 'You are already at your door.',
      chkGps: 'Checking GPS…', chkRoute: 'Checking your route…', gpsOk: 'GPS is good', routeOk: 'On a prepared route', gpsBad: 'GPS is not clear', routeBad: 'Not a prepared route',
      stopGpsH: "I'm not sure where we are.", stopGpsP: "I won't guess. Last known place: {pos} at {time}. Still trying GPS…", gpsBack: 'GPS is back',
      stopRouteH: "This isn't a route your family set up.", stopRouteP: "I can't guide you here. Stay where you are.",
      readyH: 'Route found', readyP: '{n} landmarks · about {m} m',
      walkH: 'Toward {name}', walkHome: 'Toward your door', walkP: 'walking (simulated)', paused: 'Paused',
      lookH: 'Do you see {name}?', askedAgain: 'Asking again',
      reH: "That's okay. Stay here.", reP: 'Look again: {cue}', re2P: "Let's ask your family to help.",
      homeqH: 'Are you home?', homeqP: 'Tap YES when you are at your door.',
      homenoH: "Let's get help", homenoP: 'Your family can help you find the way.',
      closedH: 'Trip closed ✓', closedP: 'You are home. Your family was told.',
      ciH: 'Are you okay?', ciAgain: 'Are you okay? Asking again', ciWait: 'Answer in {s}s',
      why: 'Why: {r}',
      r_outside: 'you are outside the safe zone', r_divergence: 'this is not the usual route', r_stopped: 'you have stopped for a while', r_noconfirm: 'no answer about the landmark', r_caregiver: 'your family wants to check on you', r_gps: 'GPS is not clear',
      notiH: 'I told your family', notiP: 'Stay where you are. They are checking.',
      onwayH: '{who} is on it', onwayP: 'Stay where you are. Help is coming.',
      safeH: 'You are safe', safeP: 'Your family confirmed it.',
      sosH: 'Asking your family', sosQ: 'Not sent yet, still trying.', sosQn: 'Retry {n}', sosSent: 'Sent. Waiting…', sosDel: 'Your family has it. Waiting for an answer…',
      sosAckH: 'Your family is coming', sosAckP: 'Stay where you are.',
      s_requested: 'REQUESTED', s_queued: 'QUEUED', s_sent: 'SENT', s_delivered: 'DELIVERED', s_ack: 'ACKNOWLEDGED', s_safe: 'SAFE',
      voiceLook: 'Can you see {name}?', voiceAgain: 'Do you see {name}? Take your time.', voiceCheck: 'Are you okay?', voiceHome: 'Are you home?', voiceSafe: 'You are safe now.', voiceStart: 'Let us walk home together.',
      // phone
      pAt: 'Safe at home', pOut: 'Outside the safe zone', pWalk: 'Walking home · landmark {a}/{b}', pWalkSub: 'Guided by photos and voice', pHome: 'Back home',
      pStop: 'Guidance stopped', pStopGps: 'GPS not clear: last known position shown', pStopRoute: 'Not on a prepared route',
      pQuiet: '{n} answered "I\'m OK". Position: {loc}',
      aCheck: 'Check-in not answered', aSos: '{n} is asking for help', aContact: '{n} asked to contact the family',
      aWhy: 'Why this alert', aLoc: 'Position', live: 'live', last: 'last known', aNoAck: 'Waiting for someone to acknowledge…',
      bOn: "I'M ON IT", bSafe: 'CONFIRM SAFE', ackBy: 'Acknowledged by {who}', safeBy: 'Case closed. {n} is safe.',
      escL: 'No answer in {t}s. Backup contact {who} is alerted next.', escD: 'Backup contact {who} alerted. The alert stays open until someone confirms SAFE.', backupOn: '{who} taps I\'M ON IT',
      pHonest: 'Shown as delivered only when the phone really got it',
      fTripStart: 'Trip started', fTripEnd: 'Trip closed: wearer confirmed home', fCheck: 'Check-in: {r}', fNoAns: 'Check-in not answered. Caregiver notified', fOk: 'Wearer answered "I\'m OK"', fSafe: 'Caregiver confirmed SAFE', fAck: 'Caregiver acknowledged', fEsc: 'Backup contact alerted', fStopGps: 'Guidance stopped: GPS not clear', fStopRoute: 'Guidance stopped: not a prepared route', fSos: 'SOS: {s}',
      // director
      d_setup: 'Before the walk', d_route: 'Route prepared', d_gps: 'GPS', d_sig: 'Mobile signal', on: 'ON', off: 'OFF', good: 'GOOD', stale: 'STALE',
      d_out: 'Wearer is out, away from home', d_wf2: 'Workflow 2: something seems wrong', d_leave: 'Leaves the safe zone', d_offroute: 'Goes off the prepared route', d_stop: 'Stops, does not confirm',
      d_tim: 'Timers (demo seconds)', d_speed: 'Speed', d_color: 'Gem colour', d_extra: 'Extra ideas (not in V1)', d_garden: 'Memory Garden', d_momo: 'Talk to Momo', d_reset: 'Reset everything',
      d_note: 'Caregiver actions are on the phone. SOS: hold the gold bar on the Gem.'
    },
    vi: {
      home: 'VỀ NHÀ', contact: 'LIÊN LẠC GIA ĐÌNH', back: 'QUAY LẠI', start: 'BẮT ĐẦU', done: 'XONG', yes: 'CÓ', no: 'KHÔNG',
      seeIt: 'TÔI THẤY', cantSee: 'KHÔNG THẤY', lookAgain: 'NHÌN LẠI', pause: 'DỪNG', go: 'ĐI TIẾP', tryAgain: 'THỬ LẠI', cont: 'TIẾP TỤC',
      imOk: 'TÔI ỔN', takeHome: 'ĐƯA TÔI VỀ', help: 'TÔI CẦN GIÚP', cancel: 'HUỶ',
      safeNow: 'Bạn đang an toàn', routeReady: 'Đã có lộ trình · {n} điểm mốc', noRoute: 'Chưa có lộ trình', hintHold: 'Nhấn giữ thanh vàng để gọi giúp đỡ',
      noRouteH: 'Nút VỀ NHÀ đang tắt', noRouteP: 'Chưa có lộ trình đã xác nhận. Nhờ gia đình cài đặt.',
      atHomeH: 'Bạn đã ở nhà', atHomeP: 'Bạn đang ở trước cửa nhà.',
      chkGps: 'Đang kiểm tra GPS…', chkRoute: 'Đang kiểm tra lộ trình…', gpsOk: 'GPS tốt', routeOk: 'Đúng lộ trình đã chuẩn bị', gpsBad: 'GPS chưa rõ', routeBad: 'Không phải lộ trình đã chuẩn bị',
      stopGpsH: 'Tôi không chắc mình đang ở đâu.', stopGpsP: 'Tôi sẽ không đoán. Vị trí biết gần nhất: {pos} lúc {time}. Vẫn đang thử GPS…', gpsBack: 'GPS đã có lại',
      stopRouteH: 'Đây không phải lộ trình gia đình đã cài.', stopRouteP: 'Tôi không thể dẫn đường ở đây. Hãy đứng yên.',
      readyH: 'Đã tìm thấy lộ trình', readyP: '{n} điểm mốc · khoảng {m} m',
      walkH: 'Hướng tới {name}', walkHome: 'Hướng về cửa nhà', walkP: 'đang đi (mô phỏng)', paused: 'Tạm dừng',
      lookH: 'Bạn có thấy {name} không?', askedAgain: 'Hỏi lại',
      reH: 'Không sao. Hãy đứng yên.', reP: 'Nhìn lại: {cue}', re2P: 'Nhờ gia đình giúp nhé.',
      homeqH: 'Bạn đã về nhà chưa?', homeqP: 'Bấm CÓ khi bạn đứng trước cửa.',
      homenoH: 'Nhờ giúp đỡ nhé', homenoP: 'Gia đình có thể giúp bạn tìm đường.',
      closedH: 'Đã kết thúc chuyến ✓', closedP: 'Bạn đã về nhà. Gia đình đã được báo.',
      ciH: 'Bạn có ổn không?', ciAgain: 'Bạn có ổn không? Hỏi lại', ciWait: 'Trả lời trong {s}s',
      why: 'Lý do: {r}',
      r_outside: 'bạn ở ngoài vùng an toàn', r_divergence: 'đây không phải đường quen', r_stopped: 'bạn đã dừng khá lâu', r_noconfirm: 'chưa trả lời về điểm mốc', r_caregiver: 'gia đình muốn hỏi thăm bạn', r_gps: 'GPS chưa rõ',
      notiH: 'Tôi đã báo gia đình', notiP: 'Hãy đứng yên. Họ đang kiểm tra.',
      onwayH: '{who} đang xử lý', onwayP: 'Hãy đứng yên. Có người đang đến.',
      safeH: 'Bạn đã an toàn', safeP: 'Gia đình đã xác nhận.',
      sosH: 'Đang gọi gia đình', sosQ: 'Chưa gửi được, đang thử lại.', sosQn: 'Thử lại {n}', sosSent: 'Đã gửi. Đang chờ…', sosDel: 'Gia đình đã nhận. Đang chờ trả lời…',
      sosAckH: 'Gia đình đang đến', sosAckP: 'Hãy đứng yên.',
      s_requested: 'ĐÃ YÊU CẦU', s_queued: 'ĐÃ LƯU HÀNG CHỜ', s_sent: 'ĐÃ GỬI', s_delivered: 'ĐÃ NHẬN', s_ack: 'ĐÃ XÁC NHẬN', s_safe: 'AN TOÀN',
      voiceLook: 'Bạn có thấy {name} không?', voiceAgain: 'Bạn có thấy {name} không? Cứ từ từ.', voiceCheck: 'Bạn có ổn không?', voiceHome: 'Bạn về nhà chưa?', voiceSafe: 'Bạn an toàn rồi.', voiceStart: 'Chúng ta cùng về nhà nhé.',
      pAt: 'An toàn ở nhà', pOut: 'Ngoài vùng an toàn', pWalk: 'Đang về nhà · điểm mốc {a}/{b}', pWalkSub: 'Dẫn đường bằng ảnh và giọng nói', pHome: 'Đã về nhà',
      pStop: 'Đã dừng dẫn đường', pStopGps: 'GPS chưa rõ: hiển thị vị trí gần nhất', pStopRoute: 'Không ở trên lộ trình đã chuẩn bị',
      pQuiet: '{n} trả lời "Tôi ổn". Vị trí: {loc}',
      aCheck: 'Chưa trả lời kiểm tra', aSos: '{n} đang cần giúp đỡ', aContact: '{n} nhờ liên lạc gia đình',
      aWhy: 'Vì sao có cảnh báo', aLoc: 'Vị trí', live: 'trực tiếp', last: 'biết gần nhất', aNoAck: 'Đang chờ người xác nhận…',
      bOn: 'TÔI XỬ LÝ', bSafe: 'XÁC NHẬN AN TOÀN', ackBy: '{who} đã xác nhận', safeBy: 'Đã đóng. {n} an toàn.',
      escL: 'Không trả lời sau {t}s. Người liên hệ dự phòng {who} sẽ được báo.', escD: 'Đã báo người dự phòng {who}. Cảnh báo mở đến khi có người xác nhận AN TOÀN.', backupOn: '{who} bấm TÔI XỬ LÝ',
      pHonest: 'Chỉ hiện "đã nhận" khi điện thoại thật sự nhận',
      fTripStart: 'Bắt đầu chuyến đi', fTripEnd: 'Kết thúc: người đeo xác nhận đã về nhà', fCheck: 'Kiểm tra: {r}', fNoAns: 'Chưa trả lời kiểm tra. Đã báo người chăm sóc', fOk: 'Người đeo trả lời "Tôi ổn"', fSafe: 'Người chăm sóc xác nhận AN TOÀN', fAck: 'Người chăm sóc đã xác nhận', fEsc: 'Đã báo người liên hệ dự phòng', fStopGps: 'Dừng dẫn đường: GPS chưa rõ', fStopRoute: 'Dừng dẫn đường: không phải lộ trình đã chuẩn bị', fSos: 'SOS: {s}',
      d_setup: 'Trước khi đi', d_route: 'Đã chuẩn bị lộ trình', d_gps: 'GPS', d_sig: 'Sóng di động', on: 'BẬT', off: 'TẮT', good: 'TỐT', stale: 'MẤT',
      d_out: 'Người đeo đang ở ngoài, xa nhà', d_wf2: 'Quy trình 2: có điều bất thường', d_leave: 'Ra khỏi vùng an toàn', d_offroute: 'Đi lệch lộ trình', d_stop: 'Dừng lại, không xác nhận',
      d_tim: 'Bộ đếm (giây demo)', d_speed: 'Tốc độ', d_color: 'Màu Gem', d_extra: 'Ý tưởng thêm (không thuộc V1)', d_garden: 'Vườn ký ức', d_momo: 'Nói chuyện với Momo', d_reset: 'Đặt lại tất cả',
      d_note: 'Người chăm sóc thao tác trên điện thoại. SOS: nhấn giữ thanh vàng trên Gem.'
    },
    id: {
      home: 'PULANG', contact: 'HUBUNGI KELUARGA', back: 'KEMBALI', start: 'MULAI', done: 'SELESAI', yes: 'YA', no: 'TIDAK',
      seeIt: 'SAYA LIHAT', cantSee: 'TAK LIHAT', lookAgain: 'LIHAT LAGI', pause: 'JEDA', go: 'LANJUT JALAN', tryAgain: 'COBA LAGI', cont: 'LANJUTKAN',
      imOk: 'SAYA BAIK', takeHome: 'ANTAR SAYA PULANG', help: 'SAYA BUTUH BANTUAN', cancel: 'BATAL',
      safeNow: 'Anda aman', routeReady: 'Rute siap · {n} penanda', noRoute: 'Belum ada rute', hintHold: 'Tekan dan tahan bilah emas untuk minta bantuan',
      noRouteH: 'PULANG dimatikan', noRouteP: 'Belum ada rute terverifikasi. Minta keluarga menyiapkannya.',
      atHomeH: 'Anda di rumah', atHomeP: 'Anda sudah di depan pintu.',
      chkGps: 'Memeriksa GPS…', chkRoute: 'Memeriksa rute…', gpsOk: 'GPS baik', routeOk: 'Di rute yang disiapkan', gpsBad: 'GPS tidak jelas', routeBad: 'Bukan rute yang disiapkan',
      stopGpsH: 'Saya tidak yakin kita di mana.', stopGpsP: 'Saya tidak menebak. Lokasi terakhir: {pos} pukul {time}. Masih mencoba GPS…', gpsBack: 'GPS kembali',
      stopRouteH: 'Ini bukan rute yang disiapkan keluarga.', stopRouteP: 'Saya tidak bisa memandu di sini. Tetap di tempat.',
      readyH: 'Rute ditemukan', readyP: '{n} penanda · sekitar {m} m',
      walkH: 'Menuju {name}', walkHome: 'Menuju pintu rumah', walkP: 'berjalan (simulasi)', paused: 'Dijeda',
      lookH: 'Apakah Anda melihat {name}?', askedAgain: 'Bertanya lagi',
      reH: 'Tidak apa-apa. Tetap di sini.', reP: 'Lihat lagi: {cue}', re2P: 'Mari minta keluarga membantu.',
      homeqH: 'Apakah Anda di rumah?', homeqP: 'Tekan YA saat di depan pintu.',
      homenoH: 'Mari minta bantuan', homenoP: 'Keluarga bisa membantu menemukan jalan.',
      closedH: 'Perjalanan selesai ✓', closedP: 'Anda di rumah. Keluarga sudah diberi tahu.',
      ciH: 'Apakah Anda baik-baik saja?', ciAgain: 'Apakah Anda baik? Bertanya lagi', ciWait: 'Jawab dalam {s}d',
      why: 'Alasan: {r}',
      r_outside: 'Anda di luar zona aman', r_divergence: 'ini bukan rute biasa', r_stopped: 'Anda berhenti cukup lama', r_noconfirm: 'tidak ada jawaban soal penanda', r_caregiver: 'keluarga ingin menanyakan kabar', r_gps: 'GPS tidak jelas',
      notiH: 'Saya sudah memberi tahu keluarga', notiP: 'Tetap di tempat. Mereka sedang memeriksa.',
      onwayH: '{who} menangani', onwayP: 'Tetap di tempat. Bantuan datang.',
      safeH: 'Anda aman', safeP: 'Keluarga sudah memastikan.',
      sosH: 'Meminta bantuan keluarga', sosQ: 'Belum terkirim, masih mencoba.', sosQn: 'Percobaan {n}', sosSent: 'Terkirim. Menunggu…', sosDel: 'Keluarga menerimanya. Menunggu jawaban…',
      sosAckH: 'Keluarga sedang datang', sosAckP: 'Tetap di tempat.',
      s_requested: 'DIMINTA', s_queued: 'ANTRE', s_sent: 'TERKIRIM', s_delivered: 'DITERIMA', s_ack: 'DIKONFIRMASI', s_safe: 'AMAN',
      voiceLook: 'Apakah Anda melihat {name}?', voiceAgain: 'Apakah Anda melihat {name}? Pelan-pelan saja.', voiceCheck: 'Apakah Anda baik?', voiceHome: 'Apakah Anda di rumah?', voiceSafe: 'Anda aman sekarang.', voiceStart: 'Ayo kita pulang bersama.',
      pAt: 'Aman di rumah', pOut: 'Di luar zona aman', pWalk: 'Berjalan pulang · penanda {a}/{b}', pWalkSub: 'Dipandu foto dan suara', pHome: 'Sudah di rumah',
      pStop: 'Panduan dihentikan', pStopGps: 'GPS tidak jelas: tampil posisi terakhir', pStopRoute: 'Tidak di rute yang disiapkan',
      pQuiet: '{n} menjawab "Saya baik". Posisi: {loc}',
      aCheck: 'Pemeriksaan tidak dijawab', aSos: '{n} meminta bantuan', aContact: '{n} meminta menghubungi keluarga',
      aWhy: 'Alasan peringatan', aLoc: 'Posisi', live: 'langsung', last: 'terakhir diketahui', aNoAck: 'Menunggu seseorang mengonfirmasi…',
      bOn: 'SAYA TANGANI', bSafe: 'KONFIRMASI AMAN', ackBy: 'Dikonfirmasi oleh {who}', safeBy: 'Kasus ditutup. {n} aman.',
      escL: 'Tidak ada jawaban dalam {t}d. Kontak cadangan {who} akan diberi tahu.', escD: 'Kontak cadangan {who} diberi tahu. Peringatan tetap terbuka sampai ada yang konfirmasi AMAN.', backupOn: '{who} menekan SAYA TANGANI',
      pHonest: 'Ditampilkan terkirim hanya jika ponsel benar-benar menerima',
      fTripStart: 'Perjalanan dimulai', fTripEnd: 'Selesai: pemakai mengonfirmasi di rumah', fCheck: 'Pemeriksaan: {r}', fNoAns: 'Pemeriksaan tidak dijawab. Pengasuh diberi tahu', fOk: 'Pemakai menjawab "Saya baik"', fSafe: 'Pengasuh mengonfirmasi AMAN', fAck: 'Pengasuh mengonfirmasi', fEsc: 'Kontak cadangan diberi tahu', fStopGps: 'Panduan berhenti: GPS tidak jelas', fStopRoute: 'Panduan berhenti: bukan rute yang disiapkan', fSos: 'SOS: {s}',
      d_setup: 'Sebelum berjalan', d_route: 'Rute disiapkan', d_gps: 'GPS', d_sig: 'Sinyal seluler', on: 'NYALA', off: 'MATI', good: 'BAIK', stale: 'HILANG',
      d_out: 'Pemakai di luar, jauh dari rumah', d_wf2: 'Alur 2: ada yang tidak biasa', d_leave: 'Keluar zona aman', d_offroute: 'Keluar dari rute', d_stop: 'Berhenti, tidak konfirmasi',
      d_tim: 'Timer (detik demo)', d_speed: 'Kecepatan', d_color: 'Warna Gem', d_extra: 'Ide tambahan (bukan V1)', d_garden: 'Taman Kenangan', d_momo: 'Bicara dengan Momo', d_reset: 'Atur ulang semua',
      d_note: 'Aksi pengasuh ada di ponsel. SOS: tahan bilah emas di Gem.'
    }
  };
  const t = (k, v) => {
    let s = (L[S.lang] && L[S.lang][k] != null) ? L[S.lang][k] : (L.en[k] != null ? L.en[k] : k);
    if (v) for (const a in v) s = s.split('{' + a + '}').join(v[a]);
    return s;
  };

  /* ───────────── state ───────────── */
  const V = (WH.Gem = WH.V1 = {
    cfg: { route: true, gps: true, signal: true, T1: 10, T2: 12, Tlm: 16, Tstop: 6, scale: 1, color: 'navy' },
    s: 'idle', x: {}, trip: null, walking: false, paused: false, sos: null, alert: null, prev: null,
    lastFix: null, timers: [], fails: 0, quiet: null, closedNote: null, stopMid: false
  });
  const G = () => WH.Guide;

  /* timers (scaled, deterministic, cancellable by key) */
  V.after = (sec, fn, key) => { V.timers.push({ left: sec, fn, key: key || '' }); };
  V.clear = (key) => { V.timers = V.timers.filter((tm) => (key ? tm.key !== key : false)); };
  V.clearScreen = () => V.clear('screen');
  V.tickTimers = (dt) => {
    const due = [];
    V.timers.forEach((tm) => { tm.left -= dt; if (tm.left <= 0) due.push(tm); });
    V.timers = V.timers.filter((tm) => tm.left > 0);
    due.forEach((tm) => { try { tm.fn(); } catch (e) { console.error(e); } });
  };

  /* ───────────── position helpers ───────────── */
  function streets() { return WH.whereText ? WH.whereText() : ''; }
  function nowTime() { return WH.nowStr(); }
  V.updateFix = () => { if (V.cfg.gps) V.lastFix = { pos: streets(), time: nowTime() }; };
  V.locText = () => {
    if (V.cfg.gps) return { text: streets(), live: true, time: nowTime() };
    const f = V.lastFix || { pos: streets(), time: nowTime() };
    return { text: f.pos, live: false, time: f.time };
  };
  V.atHome = () => WH.distHomeKm() < 0.08;

  V.pickStart = function () {
    if (V._start) return V._start;
    let best = null; const g = G();
    for (let i = 1; i <= 11; i++) for (let j = 1; j <= 11; j++) {
      const p = WH.node(i, j);
      const route = g.buildRoute(p), steps = g.buildSteps(route), looks = steps.filter((s) => s.type === 'look').length;
      const km = Math.hypot(p.x - WH.HOME_POS.x, p.z - WH.HOME_POS.z) / WH.CITY.KM;
      if (km < 0.2 || km > 0.5) continue;
      const score = Math.min(looks, 3) * 100 - Math.abs(route.total - 34);
      if (!best || score > best.score) best = { p, score, looks, total: route.total };
    }
    V._start = best ? best.p : WH.node(8, 6);
    return V._start;
  };
  V.pickFar = function () {
    if (V._far) return V._far;
    let best = null;
    for (let i = 0; i <= 12; i++) for (let j = 0; j <= 12; j++) {
      const p = WH.node(i, j), km = Math.hypot(p.x - WH.HOME_POS.x, p.z - WH.HOME_POS.z) / WH.CITY.KM;
      if (km > S.radiusKm + 0.18 && (!best || km < best.km)) best = { p, km };
    }
    V._far = best ? best.p : WH.node(12, 12);
    return V._far;
  };

  /* ───────────── DOM ───────────── */
  V.mount = function () {
    const fit = $('#devFit'); if (!fit || $('#gem')) return;
    const g = document.createElement('div');
    g.className = 'gem'; g.id = 'gem'; g.dataset.color = V.cfg.color;
    g.innerHTML = `
      <div class="g-strap top"><div class="g-buckle"></div></div>
      <div class="g-lug top"></div>
      <div class="g-case">
        <div class="g-body"></div>
        <div class="g-ring"><div class="g-face" id="gemFace"><div class="g-st" id="gSt"></div><div class="g-screen" id="gScreen"></div></div></div>
        <svg class="g-sosarc" viewBox="0 0 360 360" aria-hidden="true"><defs>
          <linearGradient id="sosg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F8E4B0"/><stop offset=".55" stop-color="#D9A862"/><stop offset="1" stop-color="#A9783A"/></linearGradient>
          <path id="sosTxt" d="M 46.2 286.6 A 174.7 174.7 0 0 0 313.8 286.6"/></defs>
          <path class="sos-band" d="M 52.6 280.7 A 166 166 0 0 0 307.4 280.7" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="34" stroke-linecap="round" transform="translate(0,3)"/>
          <path class="sos-band" d="M 52.6 280.7 A 166 166 0 0 0 307.4 280.7" fill="none" stroke="url(#sosg)" stroke-width="32" stroke-linecap="round"/>
          <path class="sos-fill" id="sosFill" d="M 52.6 280.7 A 166 166 0 0 0 307.4 280.7" fill="none" stroke="#B3322A" stroke-width="32" stroke-linecap="round" stroke-dasharray="1000" stroke-dashoffset="1000" opacity=".92"/>
          <text font-family="Be Vietnam Pro,Arial" font-weight="900" font-size="16" letter-spacing="6" fill="#5a3a12"><textPath href="#sosTxt" startOffset="50%" text-anchor="middle">SOS</textPath></text>
        </svg>
        <button class="g-sosbtn" id="gSos" aria-label="SOS: press and hold"></button>
      </div>
      <div class="g-lug bot"></div>
      <div class="g-strap bot"><i style="top:30px"></i><i style="top:62px"></i><i style="top:94px"></i></div>`;
    fit.insertBefore(g, fit.firstChild);
    const face = $('#gemFace');
    ['#devLayer', '#chatSheet'].forEach((sel) => { const n = $(sel); if (n) face.appendChild(n); });
    const col = $('#devCol');
    const voice = document.createElement('div'); voice.className = 'g-voice'; voice.id = 'gVoice'; voice.hidden = true;
    const hint = document.createElement('div'); hint.className = 'g-hint'; hint.id = 'gHint';
    col.appendChild(voice); col.appendChild(hint);
    // Phone card
    const head = $('.ptab[data-pane="overview"] .p-head');
    if (head && !$('#v1Card')) { const c = document.createElement('div'); c.id = 'v1Card'; head.after(c); }
    $('#gScreen').addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (b) V.act(b.dataset.act, b); });
    V.bindSos();
  };

  V.setVoice = function (text) {
    const el = $('#gVoice'); if (!el) return;
    if (!text) { el.hidden = true; return; }
    el.hidden = false; el.innerHTML = ic('volume', 16) + '<span>' + E(text) + '</span>';
    WH.sysLog('<b>Voice prompt</b>: "' + E(text) + '"');
    if (S.voiceOn && 'speechSynthesis' in window) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = { vi: 'vi-VN', id: 'id-ID' }[S.lang] || 'en-US'; u.rate = 0.92; speechSynthesis.speak(u); } catch (e) { /* ignore */ } }
  };

  /* SOS bar: press and hold */
  V.bindSos = function () {
    const b = $('#gSos'), fill = $('#sosFill'); let t0 = 0, raf = 0, holding = false; const HOLD = 1300;
    const len = 400;
    fill.setAttribute('stroke-dasharray', len); fill.setAttribute('stroke-dashoffset', len);
    const step = () => {
      if (!holding) return;
      const p = Math.min(1, (performance.now() - t0) / HOLD);
      fill.setAttribute('stroke-dashoffset', String(len * (1 - p)));
      if (p >= 1) { holding = false; b.classList.remove('hold'); fill.setAttribute('stroke-dashoffset', String(len)); V.sosStart('button'); return; }
      raf = requestAnimationFrame(step);
    };
    const down = (e) => { if (holding) return; e.preventDefault(); holding = true; t0 = performance.now(); b.classList.add('hold'); try { b.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } raf = requestAnimationFrame(step); };
    const up = () => { holding = false; cancelAnimationFrame(raf); b.classList.remove('hold'); fill.setAttribute('stroke-dashoffset', String(len)); };
    b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
    b.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) down(e); });
    b.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') up(); });
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  };

  /* ───────────── rendering the face ───────────── */
  const btn = (act, label, cls) => `<button class="g-btn ${cls || ''}" data-act="${act}">${label}</button>`;
  const st = () => `<span class="gps ${V.cfg.gps ? 'ok' : 'bad'}">${ic('gps', 12)}GPS</span><span>${ic(S.batt <= 20 ? 'batteryLow' : 'battery', 12)}${Math.round(S.batt)}%</span>`;
  const lmPhoto = (lm) => (lm && lm.photo) || window.landmarkArt(lm ? lm.type : 'market', lm ? lm.name : '');
  const whyText = (r) => t('why', { r: t('r_' + r) });
  const lad = (cur) => {
    const keys = ['requested', 'queued', 'sent', 'delivered', 'ack', 'safe'], i = keys.indexOf(cur);
    return '<div class="g-lad">' + keys.map((k, n) => `<div class="${n < i ? 'on' : n === i ? (k === 'safe' ? 'on' : 'on cur') : ''}"><i></i>${t('s_' + k)}</div>`).join('') + '</div>';
  };

  V.go = function (s, x) {
    V.clearScreen();
    if (V.alert && V.alert.status === 'safe' && s !== 'safe') V.alert = null;
    V.s = s; V.x = x || {};
    V.render();
    V.renderPhone();
  };

  V.render = function () {
    const sc = $('#gScreen'); if (!sc) return;
    const x = V.x, tr = V.trip;
    let h = '';
    switch (V.s) {
      case 'idle': {
        const n = V.marksFor().length;
        h = `<div class="g-ic big gold">${ic('home', 64)}</div><div class="g-time" id="gTime">${nowTime()}</div>
          <div class="g-p sm">${V.cfg.route ? t('routeReady', { n }) : t('noRoute')}</div>
          <div class="g-col">${btn('home', t('home'), 'gold w')}</div>`;
        break;
      }
      case 'noroute':
        h = `<div class="g-ic amber">${ic('route', 44)}</div><div class="g-h sm">${t('noRouteH')}</div><div class="g-p">${t('noRouteP')}</div><div class="g-col">${btn('contact', t('contact'), 'blue w')}${btn('toIdle', t('back'), 'sm')}</div>`;
        break;
      case 'athome':
        h = `<div class="g-ic big green">${ic('home', 64)}</div><div class="g-h">${t('atHomeH')}</div><div class="g-p">${t('atHomeP')}</div><div class="g-col">${btn('toIdle', t('done'), 'gold w')}</div>`;
        break;
      case 'check': {
        const r = (k, label, state) => `<div class="${state}"><span class="dot">${state === 'ok' ? ic('check', 13) : state === 'bad' ? ic('close', 13) : ''}</span>${label}</div>`;
        const g1 = x.gps === undefined ? 'run' : x.gps ? 'ok' : 'bad';
        const g2 = x.gps === undefined || x.gps === false ? '' : x.route === undefined ? 'run' : x.route ? 'ok' : 'bad';
        h = `<div class="g-tag">${t('home')}</div>
          <div class="g-chk">${r('g', x.gps === undefined ? t('chkGps') : x.gps ? t('gpsOk') : t('gpsBad'), g1)}${g2 ? r('r', x.route === undefined ? t('chkRoute') : x.route ? t('routeOk') : t('routeBad'), g2) : ''}</div>`;
        break;
      }
      case 'stopgps': {
        const f = V.lastFix || { pos: streets(), time: nowTime() };
        const back = V.cfg.gps;
        h = `<div class="g-ic red">${ic('gps', 40)}</div><div class="g-h sm">${back ? t('gpsBack') : t('stopGpsH')}</div>
          <div class="g-p sm">${back ? '' : t('stopGpsP', { pos: E(f.pos), time: f.time })}</div>
          <div class="g-col">${back ? btn(V.stopMid ? 'resume' : 'startChecks', t('cont'), 'green w') : btn('contact', t('contact'), 'blue w')}${back ? '' : btn('startChecks', t('tryAgain'), 'sm')}${btn('toIdle', t('back'), 'sm')}</div>`;
        break;
      }
      case 'stoproute':
        h = `<div class="g-ic big amber">${ic('route', 56)}</div><div class="g-h sm">${t('stopRouteH')}</div><div class="g-p">${t('stopRouteP')}</div><div class="g-col">${btn('contact', t('contact'), 'blue w')}${btn('toIdle', t('back'), 'sm')}</div>`;
        break;
      case 'ready': {
        const n = tr.marks.length;
        h = `<div class="g-ic big green">${ic('route', 56)}</div><div class="g-h">${t('readyH')}</div><div class="g-p">${t('readyP', { n, m: Math.round(tr.route.total * M / 10) * 10 })}</div><div class="g-col">${btn('begin', t('start'), 'gold w')}</div>`;
        break;
      }
      case 'walk': {
        const tg = V.target();
        const mk = tg.mark;
        h = `<div class="g-tag">${V.paused ? t('paused') : t('walkP')}</div>
          ${mk ? `<img class="g-photo sm" src="${E(lmPhoto(mk.lm))}" alt="">` : `<div class="g-ic gold">${ic('home', 40)}</div>`}
          <div class="g-h xs">${mk ? t('walkH', { name: E(mk.lm.name) }) : t('walkHome')}</div>
          <div class="g-dist" id="gDist">${Math.max(0, Math.round((tg.s - tr.s) * M / 5) * 5)} m</div>
          <div class="g-row">${V.paused ? btn('resume', t('go'), 'green sm') : btn('pause', t('pause'), 'sm')}</div>`;
        break;
      }
      case 'look': {
        const mk = tr.marks[tr.idx];
        h = `<div class="g-tag">${x.again ? `<span class="g-asked">${t('askedAgain')}</span>` : t('home') + ' · ' + (tr.idx + 1) + '/' + tr.marks.length}</div>
          <img class="g-photo ${x.again ? 'g-pulse' : ''}" src="${E(lmPhoto(mk.lm))}" alt="${E(mk.lm.name)}">
          <div class="g-h sm">${t('lookH', { name: E(mk.lm.name) })}</div>
          <div class="g-row">${btn('see', t('seeIt'), 'green half')}${btn('cant', t('cantSee'), 'half')}</div>`;
        break;
      }
      case 'reorient': {
        const mk = tr.marks[tr.idx];
        h = `<div class="g-ic big blue">${ic('eye', 56)}</div><div class="g-h sm">${t('reH')}</div><div class="g-p">${V.fails >= 2 ? t('re2P') : t('reP', { cue: E(mk.lm.recognitionCue || mk.lm.name) })}</div>
          <div class="g-col">${V.fails >= 2 ? btn('contact', t('contact'), 'blue w') : ''}${btn('lookAgain', t('lookAgain'), V.fails >= 2 ? 'sm' : 'green w')}</div>`;
        break;
      }
      case 'homeq':
        h = `<img class="g-photo" src="${E(window.landmarkArt('home', ''))}" alt=""><div class="g-h">${t('homeqH')}</div><div class="g-p sm">${t('homeqP')}</div><div class="g-row">${btn('homeYes', t('yes'), 'green half')}${btn('homeNo', t('no'), 'half')}</div>`;
        break;
      case 'homeno':
        h = `<div class="g-ic big blue">${ic('users', 52)}</div><div class="g-h sm">${t('homenoH')}</div><div class="g-p">${t('homenoP')}</div><div class="g-col">${btn('contact', t('contact'), 'blue w')}${btn('lookAgain2', t('back'), 'sm')}</div>`;
        break;
      case 'closed':
        h = `<div class="g-ic big green">${ic('check', 60)}</div><div class="g-h">${t('closedH')}</div><div class="g-p">${t('closedP')}</div><div class="g-col">${btn('toIdle', t('done'), 'gold w')}</div>`;
        break;
      case 'checkin':
      case 'notified': {
        const noti = V.s === 'notified';
        h = `<div class="g-ic blue">${ic('bell', 44)}</div><div class="g-h">${noti ? t('notiH') : (x.again ? t('ciAgain') : t('ciH'))}</div>
          <div class="g-p sm">${noti ? t('notiP') : whyText(x.reason)}</div>
          ${noti ? '' : `<div class="g-count" id="gCount">${t('ciWait', { s: Math.max(0, Math.ceil(x.left)) })}</div>`}
          <div class="g-row">${btn('imOk', t('imOk'), 'green half')}${btn('takeHome', t('takeHome'), 'blue half')}</div>
          <div class="g-row">${btn('help', t('help'), 'red half sm')}</div>`;
        break;
      }
      case 'onway': {
        const who = (WH.contact(0) || {}).name || 'Family';
        h = `<div class="g-ic big green">${ic('walk', 56)}</div><div class="g-h sm">${t('onwayH', { who: E(who) })}</div><div class="g-p">${t('onwayP')}</div>`;
        break;
      }
      case 'safe':
        h = `<div class="g-ic big green">${ic('shield', 60)}</div><div class="g-h">${t('safeH')}</div><div class="g-p">${t('safeP')}</div><div class="g-col">${btn('toIdle', t('done'), 'gold w')}</div>`;
        break;
      case 'sos': {
        const so = V.sos, headline = so.st === 'queued' ? t('sosQ') + (so.retry ? ' ' + t('sosQn', { n: so.retry }) : '') : so.st === 'sent' ? t('sosSent') : so.st === 'delivered' ? t('sosDel') : t('sosH');
        h = `<div class="g-ic red">${ic('sos', 44)}</div><div class="g-h sm">${t('sosH')}</div>${lad(so.st)}<div class="g-p sm" id="gSosLine">${E(headline)}</div>
          ${['requested', 'queued'].includes(so.st) ? `<div class="g-row">${btn('sosCancel', t('cancel'), 'sm')}</div>` : ''}`;
        break;
      }
      case 'sosack':
        h = `<div class="g-ic big green">${ic('walk', 56)}</div><div class="g-h sm">${t('sosAckH')}</div>${lad('ack')}<div class="g-p sm">${t('sosAckP')}</div>`;
        break;
    }
    $('#gSt').innerHTML = st();
    sc.innerHTML = h;
    const hint = $('#gHint'); if (hint) hint.textContent = t('hintHold');
  };

  /* ───────────── trip engine ───────────── */
  V.marksFor = function () {
    const g = G(), p = V.atHome() ? V.pickStart() : { x: S.pos.x, z: S.pos.z };
    if (!V.cfg.route) return [];
    const r = g.buildRoute(p); return g.buildSteps(r).filter((s) => s.type === 'look');
  };
  V.target = function () {
    const tr = V.trip, mk = tr.marks[tr.idx];
    return { mark: mk || null, s: mk ? mk.s : tr.endS };
  };

  V.pressHome = function () {
    if (V.sos || ['check', 'walk', 'look', 'ready', 'homeq'].includes(V.s)) return;
    if (!V.cfg.route) { V.go('noroute'); return; }
    if (V.atHome()) { V.go('athome'); return; }
    V.startChecks();
  };

  V.startChecks = function () {
    V.fails = 0; V.paused = false; V.walking = false; V.clear('walk');
    V.go('check', {});
    V.after(1.1 / V.cfg.scale, () => {
      if (V.s !== 'check') return;
      V.x.gps = V.cfg.gps; V.render();
      if (!V.cfg.gps) { V.after(0.9 / V.cfg.scale, () => V.stopGps(false), 'screen'); return; }
      V.after(1.1 / V.cfg.scale, () => {
        if (V.s !== 'check') return;
        V.x.route = !V.cfg.offRoute; V.render();
        V.after(0.9 / V.cfg.scale, () => {
          if (V.s !== 'check') return;
          if (V.cfg.offRoute) { V.feed('fStopRoute', 'amber', 'route'); V.go('stoproute'); return; }
          V.buildTrip(); V.go('ready');
        }, 'screen');
      }, 'screen');
    }, 'screen');
    WH.sysLog('WF1: GO HOME pressed, checking GPS then route', 'ok');
  };

  V.stopGps = function (mid) {
    V.stopMid = !!mid; V.walking = false;
    V.feed('fStopGps', 'amber', 'gps');
    V.go('stopgps');
    WH.sysLog('WF1 STOP: GPS not fresh/accurate. No directions. Last fix kept.', 'warn');
  };

  V.buildTrip = function () {
    const g = G(), p = V.atHome() ? V.pickStart() : { x: S.pos.x, z: S.pos.z };
    if (V.atHome()) WH.setAvatar(p.x, p.z, 0, false);
    const route = g.buildRoute({ x: S.pos.x, z: S.pos.z }), steps = g.buildSteps(route);
    const marks = steps.filter((s) => s.type === 'look'), arrive = steps[steps.length - 1];
    V.trip = { route, marks, idx: 0, s: 0, endS: arrive.s, started: false };
    WH.worlds.forEach((w) => { w.setRoute(route.pts); });
  };

  V.begin = function () {
    const tr = V.trip; if (!tr) return;
    tr.started = true; V.walking = true; V.paused = false; V.pauseT = 0;
    V.feed('fTripStart', 'blue', 'walk');
    V.setVoice(t('voiceStart'));
    V.go('walk');
  };

  V.arriveAtTarget = function () {
    const tr = V.trip; V.walking = false;
    if (tr.marks[tr.idx]) { V.fails = 0; V.go('look'); V.setVoice(t('voiceLook', { name: tr.marks[tr.idx].lm.name })); V.armLookTimers(); }
    else { V.go('homeq'); V.setVoice(t('voiceHome')); }
  };
  V.armLookTimers = function () {
    const T = V.cfg.Tlm / V.cfg.scale;
    V.after(T * 0.5, () => { if (V.s === 'look') { V.x.again = true; V.render(); V.setVoice(t('voiceAgain', { name: V.trip.marks[V.trip.idx].lm.name })); WH.buzz && WH.buzz('soft'); } }, 'screen');
    V.after(T, () => { if (V.s === 'look') V.checkin('noconfirm'); }, 'screen');
  };

  /* ───────────── WF2: check-in ───────────── */
  V.checkin = function (reason) {
    if (V.sos) return;
    if (V.s === 'checkin' || V.s === 'notified') return;
    V.prev = (['walk', 'look', 'reorient'].includes(V.s) && V.trip) ? { s: V.s === 'walk' ? 'walk' : 'look', paused: V.paused } : null;
    V.walking = false;
    const T1 = V.cfg.T1 / V.cfg.scale;
    V.go('checkin', { reason, left: V.cfg.T1, again: false });
    V.checkinT0 = V.cfg.T1;
    V.setVoice(t('voiceCheck'));
    WH.buzz && WH.buzz('strong');
    V.feed('fCheck', 'amber', 'eye', { r: t('r_' + reason) });
    WH.sysLog('WF2: gentle check-in (' + reason + '). T1 = ' + V.cfg.T1 + 's', 'warn');
    V.after(T1 * 0.5, () => { if (V.s === 'checkin') { V.x.again = true; V.render(); V.setVoice(t('ciAgain')); } }, 'screen');
    V.after(T1, () => { if (V.s === 'checkin') V.noAnswer(); }, 'screen');
  };

  V.noAnswer = function () {
    const reason = V.x.reason;
    V.go('notified', { reason });
    V.raiseAlert('checkin', reason);
    V.feed('fNoAns', 'red', 'bell');
  };

  V.imOk = function () {
    const lt = V.locText();
    V.quiet = { text: t('pQuiet', { n: S.callName, loc: lt.text + (lt.live ? '' : ' (' + t('last') + ' ' + lt.time + ')') }), at: Date.now() };
    V.feed('fOk', 'green', 'check');
    if (V.alert && V.alert.kind === 'checkin' && V.alert.status === 'delivered') { V.closeAlert(false); }
    V.resumePrev();
  };
  V.resumePrev = function () {
    const p = V.prev; V.prev = null;
    if (p && V.trip && V.trip.started) {
      if (p.s === 'look') { V.go('look'); V.fails = V.fails || 0; V.armLookTimers(); }
      else { V.walking = true; V.paused = false; V.go('walk'); }
    } else V.go('idle');
  };

  /* alert (caregiver side) */
  V.raiseAlert = function (kind, reason) {
    const lt = V.locText();
    const tm = V.cfg.T2; V.clear('alert');
    V.alert = { kind, reason, loc: lt, status: 'delivered', ackBy: null, escalated: false, t0: performance.now(), left: tm, backupAck: false };
    WH.famBanner({ ic: kind === 'sos' ? 'siren' : 'bell', tone: kind === 'sos' ? 'red' : 'amber', title: V.alertTitle(), body: lt.text + ' · ' + (lt.live ? t('live') : t('last') + ' ' + lt.time) });
    V.after(V.cfg.T2 / V.cfg.scale, () => {
      if (V.alert && V.alert.status === 'delivered' && !V.alert.escalated) { V.alert.escalated = true; V.feed('fEsc', 'red', 'users'); WH.Inbox && WH.Inbox.dispatch({ tone: 'red', ic: 'siren', title: V.alertTitle(), body: t('fEsc'), to: [1] }); WH.sysLog('Escalated to backup contact ' + ((WH.contact(1) || {}).name || ''), 'bad'); V.renderPhone(); }
    }, 'alert');
    if (V.sos) { V.sos.st = 'delivered'; if (V.s === 'sos') V.render(); }
    V.renderPhone();
  };
  V.alertTitle = function () {
    const a = V.alert; if (!a) return '';
    if (a.kind === 'sos') return t('aSos', { n: S.callName });
    if (a.kind === 'contact') return t('aContact', { n: S.callName });
    return t('aCheck');
  };
  V.ack = function (who) {
    const a = V.alert; if (!a || a.status !== 'delivered') return;
    a.status = 'ack'; a.ackBy = who || (WH.contact(0) || {}).name; V.clear('alert');
    V.feed('fAck', 'blue', 'check');
    if (V.sos) { V.sos.st = 'ack'; V.go('sosack'); } else if (V.s === 'notified' || V.s === 'checkin') V.go('onway');
    V.setVoice(((WH.contact(0) || {}).name || '') + ': ' + t('onwayP'));
    V.renderPhone();
  };
  V.safe = function () {
    const a = V.alert; if (!a || a.status !== 'ack') return;
    a.status = 'safe'; V.clear('alert');
    V.feed('fSafe', 'green', 'shield');
    V.sos = null; V.walking = false; V.prev = null; V.trip = null;
    WH.worlds.forEach((w) => w.setRoute(null));
    V.go('safe'); V.setVoice(t('voiceSafe'));
    V.renderPhone();
  };
  V.closeAlert = function () { V.alert = null; V.clear('alert'); V.renderPhone(); };

  /* ───────────── WF3: SOS ───────────── */
  V.sosStart = function (reason) {
    if (V.sos) return;
    V.clearScreen(); V.clear('walk'); V.walking = false; V.prev = null;
    V.sos = { st: 'requested', reason: reason || 'button', retry: 0, loc: V.locText() };
    WH.buzz && WH.buzz('sos'); WH.beep && WH.beep('alert');
    V.feed('fSos', 'red', 'siren', { s: t('s_requested') });
    V.go('sos');
    WH.sysLog('WF3: REQUESTED. Saving to memory first, then attaching location.', 'bad');
    V.after(0.8 / V.cfg.scale, () => V.sosQueue(), 'sos');
  };
  V.sosQueue = function () {
    if (!V.sos) return;
    V.sos.st = 'queued'; V.sos.loc = V.locText(); V.go('sos');
    V.sosTrySend();
  };
  V.sosTrySend = function () {
    const so = V.sos; if (!so || so.st !== 'queued') return;
    if (!V.cfg.signal) {
      so.retry++; if (V.s === 'sos') V.render();
      WH.sysLog('SOS QUEUED: no mobile signal. Retry ' + so.retry, 'warn');
      V.after(3 / V.cfg.scale, () => V.sosTrySend(), 'sos'); return;
    }
    V.after(0.8 / V.cfg.scale, () => {
      if (!V.sos) return; V.sos.st = 'sent'; V.render(); V.feed('fSos', 'amber', 'siren', { s: t('s_sent') });
      V.after(1.0 / V.cfg.scale, () => {
        if (!V.sos) return; V.sos.st = 'delivered';
        V.raiseAlert(V.sos.reason === 'contact' ? 'contact' : 'sos', 'sos');
        V.feed('fSos', 'red', 'siren', { s: t('s_delivered') });
        V.render();
      }, 'sos');
    }, 'sos');
  };
  V.sosCancel = function () { if (!V.sos || !['requested', 'queued'].includes(V.sos.st)) return; V.clear('sos'); V.sos = null; V.feed('fSos', 'blue', 'close', { s: 'cancelled' }); if (V.trip && V.trip.started) { V.walking = true; V.go('walk'); } else V.go('idle'); };

  /* ───────────── actions from the face ───────────── */
  V.act = function (a) {
    const tr = V.trip;
    switch (a) {
      case 'home': V.pressHome(); break;
      case 'toIdle': V.walking = false; V.go('idle'); break;
      case 'startChecks': V.startChecks(); break;
      case 'begin': V.begin(); break;
      case 'pause': V.paused = true; V.walking = false; V.pauseT = 0; V.render(); break;
      case 'resume':
        if (V.stopMid) { V.stopMid = false; V.resumeAfterStop(); break; }
        V.paused = false; V.walking = true; V.render(); break;
      case 'see':
        tr.idx++; V.clearScreen(); V.fails = 0; V.walking = true; V.paused = false; V.setVoice(null); V.go('walk'); break;
      case 'cant':
        V.fails++; V.clearScreen(); V.go('reorient'); break;
      case 'lookAgain': V.clearScreen(); V.x = {}; V.go('look'); V.armLookTimers(); V.setVoice(t('voiceLook', { name: tr.marks[tr.idx].lm.name })); break;
      case 'lookAgain2': V.go('homeq'); break;
      case 'homeYes': V.closeTrip(); break;
      case 'homeNo': V.go('homeno'); break;
      case 'imOk': V.clearScreen(); V.imOk(); break;
      case 'takeHome': V.clearScreen(); V.prev = null; if (V.alert && V.alert.kind === 'checkin' && V.alert.status === 'delivered') V.closeAlert(); V.trip = null; V.go('idle'); V.pressHome(); break;
      case 'help': V.sosStart('help'); break;
      case 'contact': V.sosStart('contact'); break;
      case 'sosCancel': V.sosCancel(); break;
    }
  };
  V.resumeAfterStop = function () {
    V.stopMid = false;
    if (V.trip && V.trip.started) { V.walking = true; V.paused = false; const tg = V.trip.marks[V.trip.idx]; V.go('walk'); } else V.startChecks();
  };
  V.closeTrip = function () {
    V.walking = false; V.trip = null; V.paused = false;
    WH.worlds.forEach((w) => w.setRoute(null));
    V.feed('fTripEnd', 'green', 'home');
    WH.setAvatar(WH.DOOR.x, WH.DOOR.z, 0, false);
    V.go('closed'); V.setVoice(null);
    WH.beep && WH.beep('ok');
  };

  /* ───────────── director scenarios ───────────── */
  V.wearerOut = function () {
    V.reset(true);
    const p = V.pickStart(); WH.setAvatar(p.x, p.z, 0, false); V.updateFix();
    WH.sysLog('Demo: wearer is out, on a street near a prepared route', 'ok');
    V.renderPhone(); V.render();
  };
  V.scLeave = function () {
    const p = V.pickFar(); V.trip = null; WH.worlds.forEach((w) => w.setRoute(null)); WH.setAvatar(p.x, p.z, 0, false); V.walking = false; V.updateFix();
    V.checkin('outside');
  };
  V.scOffRoute = function () {
    if (!V.trip || !V.trip.started) { WH.toast(ic('route', 18) + ' ' + (S.lang === 'vi' ? 'Hãy bắt đầu chuyến đi trước' : 'Start the trip first (GO HOME, then START)'), 'warn', 3000); return; }
    const p = S.pos; WH.setAvatar(p.x + 2.4, p.z + 1.6, 0, false);
    V.checkin('divergence');
  };
  V.scStop = function () {
    if (!V.trip || !V.trip.started) { WH.toast(ic('stop', 18) + ' ' + (S.lang === 'vi' ? 'Hãy bắt đầu chuyến đi trước' : 'Start the trip first (GO HOME, then START)'), 'warn', 3000); return; }
    V.walking = false; V.checkin('stopped');
  };

  V.reset = function (keepCfg) {
    V.timers = []; V.s = 'idle'; V.x = {}; V.trip = null; V.walking = false; V.paused = false; V.sos = null; V.alert = null; V.prev = null; V.fails = 0; V.quiet = null; V.stopMid = false;
    WH.worlds && WH.worlds.forEach((w) => w.setRoute(null));
    try { WH.Sim.reset(); } catch (e) { /* ignore */ }
    V.sosDisarm();
    if (!keepCfg) { Object.assign(V.cfg, { route: true, gps: true, signal: true, offRoute: false }); }
    V.setVoice(null);
    V.buildDirector();
    V.go('idle');
  };
  V.sosDisarm = function () { const f = $('#sosFill'); if (f) f.setAttribute('stroke-dashoffset', '400'); };

  /* ───────────── feed (caregiver activity) ───────────── */
  V.feed = function (key, tone, icon, vars) { WH.feed(E(t(key, vars)), tone, icon); WH.sysLog(E(t(key, vars)), tone === 'red' ? 'bad' : tone === 'amber' ? 'warn' : 'ok'); };

  /* ───────────── caregiver phone card ───────────── */
  V.renderPhone = function () {
    const box = $('#v1Card'); if (!box) return;
    const a = V.alert, tr = V.trip;
    let cls = 'safe', icn = 'shield', title = t('pAt'), sub = '', bar = '';
    const out = WH.distHomeKm() > S.radiusKm;
    if (V.s === 'stopgps' || V.s === 'stoproute') { cls = 'warn'; icn = 'alert'; title = t('pStop'); sub = V.s === 'stopgps' ? t('pStopGps') : t('pStopRoute'); }
    else if (tr && tr.started) { cls = 'walk'; icn = 'walk'; title = t('pWalk', { a: Math.min(tr.idx + 1, tr.marks.length || 1), b: tr.marks.length || 1 }); sub = t('pWalkSub'); bar = `<div class="v1c-bar"><i style="width:${Math.min(100, tr.s / tr.endS * 100)}%"></i></div>`; }
    else if (out) { cls = 'warn'; icn = 'pin'; title = t('pOut'); sub = WH.distHomeKm().toFixed(2) + ' km'; }
    else if (V.s === 'closed') { title = t('pHome'); }
    if (a) { cls = a.status === 'safe' ? 'safe' : 'alert'; icn = a.status === 'safe' ? 'shield' : 'siren'; title = a.status === 'safe' ? t('safeBy', { n: S.callName }) : V.alertTitle(); sub = ''; bar = ''; }
    let body = '';
    if (a) {
      const ackOn = a.status === 'ack' || a.status === 'safe', safeOn = a.status === 'safe';
      const chips = `<i class="on">${t('s_sent')}</i><i class="on">${t('s_delivered')}</i><i class="${ackOn ? 'on' : 'cur'}">${t('s_ack')}</i><i class="${safeOn ? 'on' : ackOn ? 'cur' : ''}">${t('s_safe')}</i>`;
      body += `<div class="v1c-why"><b>${t('aWhy')}:</b> ${a.reason === 'sos' ? t('s_requested') + ' · SOS' : t('r_' + a.reason)}<br><b>${t('aLoc')}:</b> ${E(a.loc.text)} · ${a.loc.live ? t('live') : t('last') + ' ' + a.loc.time}</div><div class="v1c-chips">${chips}</div>`;
      if (a.status === 'delivered') {
        const c1 = WH.contact(1) || { name: 'Mei' };
        body += `<div class="v1c-btns"><button class="go" id="v1Ack">${t('bOn')}</button></div>`;
        if (a.escalated) body += `<div class="v1c-esc hot">${t('escD', { who: E(c1.name) })}<br><button class="mini" id="v1Backup">${t('backupOn', { who: E(c1.name) })}</button></div>`;
        else body += `<div class="v1c-esc"><span id="v1Left">${t('escL', { t: Math.max(0, Math.ceil(a.left)), who: E(c1.name) })}</span></div>`;
      } else if (a.status === 'ack') {
        body += `<div class="v1c-quiet">${t('ackBy', { who: E(a.ackBy || '') })}</div><div class="v1c-btns"><button class="ok" id="v1Safe">${t('bSafe')}</button></div>`;
      }
    } else if (V.quiet && Date.now() - V.quiet.at < 20000) body += `<div class="v1c-quiet">${E(V.quiet.text)}</div>`;
    box.innerHTML = `<div class="v1c ${cls}"><div class="v1c-top"><div class="v1c-dot">${ic(icn, 18)}</div><div class="v1c-t"><b>${E(title)}</b>${sub ? `<span>${E(sub)}</span>` : ''}</div></div>${bar}${body}</div>`;
    const ak = $('#v1Ack'); if (ak) ak.onclick = () => V.ack();
    const sf = $('#v1Safe'); if (sf) sf.onclick = () => V.safe();
    const bk = $('#v1Backup'); if (bk) bk.onclick = () => V.ack((WH.contact(1) || {}).name);
    const chip = a ? (a.status === 'safe' ? [t('pAt'), 'ok'] : [t('s_' + (a.status === 'delivered' ? 'delivered' : 'ack')), 'red']) : tr && tr.started ? [t('pWalk', { a: Math.min(tr.idx + 1, tr.marks.length || 1), b: tr.marks.length || 1 }).split(' · ')[0], 'blue'] : out ? [t('pOut'), 'red'] : [t('safeNow'), 'ok'];
    WH._chipLocked = true; WH.setChip(chip[0], chip[1]);
  };

  /* ───────────── director ───────────── */
  V.buildDirector = function () {
    const c = V.cfg, G_ = $('#dirGroups'); if (!G_) return;
    const tog = (id, label, on, a, b, bad) => `<div class="dgrow"><span>${label}</span><div class="tog" data-tog="${id}"><button class="${on ? 'on' : ''}" data-v="1">${a}</button><button class="${!on ? 'on' : ''} ${bad ? 'bad' : ''}" data-v="0">${b}</button></div></div>`;
    const opts = (id, vals, cur, suf) => `<div class="opts" data-opt="${id}">${vals.map((v) => `<button class="${v === cur ? 'on' : ''}" data-v="${v}">${v}${suf || ''}</button>`).join('')}</div>`;
    G_.innerHTML = `
      <div class="dg"><h4><span class="wf">SETUP</span>${t('d_setup')}</h4>
        ${tog('route', t('d_route'), c.route, t('on'), t('off'), true)}
        ${tog('gps', t('d_gps'), c.gps, t('good'), t('stale'), true)}
        ${tog('signal', t('d_sig'), c.signal, t('on'), t('off'), true)}
        <button class="dbtn" id="dOut">${ic('pin', 20)}<span>${t('d_out')}</span></button>
      </div>
      <div class="dg"><h4><span class="wf">WF2</span>${t('d_wf2')}</h4>
        <button class="dbtn" id="dLeave">${ic('alert', 20)}<span>${t('d_leave')}</span></button>
        <button class="dbtn" id="dOff">${ic('route', 20)}<span>${t('d_offroute')}</span></button>
        <button class="dbtn" id="dStop">${ic('stop', 20)}<span>${t('d_stop')}</span></button>
      </div>
      <div class="dg"><h4>${t('d_tim')}</h4>
        <div class="dgrow"><span>T1</span>${opts('T1', [6, 10, 20], c.T1, 's')}</div>
        <div class="dgrow"><span>T2</span>${opts('T2', [6, 12, 20], c.T2, 's')}</div>
        <div class="dgrow"><span>${t('d_speed')}</span>${opts('scale', [1, 2, 3], c.scale, '×')}</div>
      </div>
      <div class="dg extras"><h4>${t('d_extra')}</h4>
        <button class="dbtn" id="dGarden">${ic('image', 20)}<span>${t('d_garden')}</span></button>
        <button class="dbtn" id="dMomo">${ic('chat', 20)}<span>${t('d_momo')}</span></button>
      </div>
      <div class="dg"><button class="dbtn" id="dReset">${ic('refresh', 20)}<span>${t('d_reset')}</span></button><p class="dir-sub" style="margin-top:6px">${t('d_note')}</p></div>`;
    $$('#dirGroups [data-tog]').forEach((el) => $$('button', el).forEach((b) => (b.onclick = () => { const on = b.dataset.v === '1'; const id = el.dataset.tog; if (id === 'gps') { V.cfg.gps = on; if (!on) { V.lastFix = V.lastFix || { pos: streets(), time: nowTime() }; } } else V.cfg[id] = on; V.buildDirector(); if (V.s === 'idle' || V.s === 'stopgps') V.render(); V.renderPhone(); WH.sysLog('Demo: ' + id + ' = ' + (on ? 'ON/GOOD' : 'OFF/STALE'), 'warn'); })));
    $$('#dirGroups [data-opt]').forEach((el) => $$('button', el).forEach((b) => (b.onclick = () => { V.cfg[el.dataset.opt] = +b.dataset.v; V.buildDirector(); })));
    $('#dOut').onclick = () => V.wearerOut(); $('#dLeave').onclick = () => V.scLeave(); $('#dOff').onclick = () => V.scOffRoute(); $('#dStop').onclick = () => V.scStop();
    $('#dGarden').onclick = () => WH.Memory.open(); $('#dMomo').onclick = () => WH.openChat(); $('#dReset').onclick = () => V.reset(false);
  };

  /* ───────────── frame tick ───────────── */
  let acc = 0, secAcc = 0;
  V.tick = function (dt) {
    const sc = V.cfg.scale; dt = Math.min(dt, 0.1);
    V.tickTimers(dt);
    if (V.cfg.gps) V.updateFix();
    // GPS goes stale while guiding: stop giving directions
    if (!V.cfg.gps && V.trip && V.trip.started && ['walk', 'look', 'reorient', 'homeq'].includes(V.s)) { V.clearScreen(); V.stopGps(true); }
    const tr = V.trip;
    if (V.walking && tr && V.s === 'walk') {
      const tg = V.target(); const speed = 2.2 * sc;
      tr.s = Math.min(tg.s, tr.s + speed * dt);
      const p = G().posAt(tr.route, tr.s);
      WH.setAvatar(p.x, p.z, Math.atan2(p.dx, p.dz), true);
      const d = $('#gDist'), pr = $('#gProg');
      if (d) d.textContent = Math.max(0, Math.round((tg.s - tr.s) * M / 5) * 5) + ' m';
      if (pr) pr.style.width = Math.min(100, tr.s / tr.endS * 100) + '%';
      if (tr.s >= tg.s - 1e-3) { WH.setAvatar(p.x, p.z, undefined, false); V.arriveAtTarget(); }
    }
    // user paused: after Tstop without resuming, ask gently
    if (V.s === 'walk' && V.paused) { V.pauseT = (V.pauseT || 0) + dt * sc; if (V.pauseT >= V.cfg.Tstop) { V.pauseT = 0; V.checkin('stopped'); } }
    // check-in countdown label
    if (V.s === 'checkin') { V.x.left = Math.max(0, V.x.left - dt * sc); const c = $('#gCount'); if (c) c.textContent = t('ciWait', { s: Math.ceil(V.x.left) }); }
    // phone countdown
    if (V.alert && V.alert.status === 'delivered' && !V.alert.escalated) { V.alert.left = Math.max(0, V.alert.left - dt * sc); const l = $('#v1Left'); if (l) l.textContent = t('escL', { t: Math.ceil(V.alert.left), who: E((WH.contact(1) || { name: 'Mei' }).name) }); }
    acc += dt; secAcc += dt; V._rf = (V._rf || 0) + dt; if (V._rf > 0.4) { V._rf = 0; if (S.screen === 'stage') WH.refresh(); }
    if (acc > 0.35) { acc = 0; if (V.trip && V.trip.started) V.renderPhone(); }
    if (secAcc > 1) { secAcc = 0; const tm = $('#gTime'); if (tm) tm.textContent = nowTime(); const sb = $('#gSt'); if (sb && V.s !== 'check') sb.innerHTML = st(); }
  };

  /* ───────────── wire into the existing app ───────────── */
  V.init = function () {
    V.mount();
    // route + zone logic of the old demo is replaced
    WH.onFrame = function (dt) { V.tick(dt); };
    WH.Sim.pressHome = () => V.pressHome();
    WH.Sim.pressSos = () => V.sosStart('button');
    WH.Sim.sos = (r) => V.sosStart(r);
    WH.Sim.checkIn = () => { if (V.s === 'idle' || V.s === 'walk' || V.s === 'look') V.checkin('caregiver'); };
    WH.Sim.buildDirector = () => V.buildDirector();
    const pc = $('#pCheck'); if (pc) pc.onclick = () => WH.Sim.checkIn();
    // fit the round Gem instead of the rectangular band
    const oldFit = WH.fit;
    WH.fit = function () {
      const g = $('#gem'), df = $('#devFit');
      if (g && df && df.clientHeight > 50) {
        const k = Math.max(0.3, Math.min(1, (df.clientHeight - 6) / g.offsetHeight, df.clientWidth / g.offsetWidth));
        g.style.transform = 'scale(' + k.toFixed(3) + ')';
      }
      const ph = $('#phone'), pf = $('.phone-fit');
      if (ph && pf && pf.clientHeight > 50) {
        const k = Math.max(0.35, Math.min(1, (pf.clientHeight - 4) / ph.offsetHeight, pf.clientWidth / ph.offsetWidth));
        ph.style.transform = 'scale(' + k.toFixed(3) + ')';
      }
    };
    // language change
    const oldLang = WH.onLang;
    WH.onLang = function () { oldLang && oldLang.apply(this, arguments); V.buildDirector(); V.render(); V.renderPhone(); };
    V.updateFix();
    V.buildDirector();
    V.go('idle');
    // default view: both, director on
    $('.stage') && ($('.stage').dataset.view = 'both');
    setTimeout(WH.fit, 100);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') V.sosDisarm(); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(V.init, 0)); else setTimeout(V.init, 0);
})();
