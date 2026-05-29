// Chạy trước khi nạp module (setupFiles). Tắt worker BullMQ trong e2e:
// chỉ test HTTP/DB, không để processor nền tiêu thụ job lúc kiểm thử.
process.env.RUN_WORKERS = 'false';
