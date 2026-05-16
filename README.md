# Tombol Hadiah

Aplikasi tugas harian dan gacha hadiah untuk anak-anak. Data tersimpan lewat backend Node sederhana, jadi bisa dipakai dari perangkat berbeda selama mengakses server yang sama.

Fitur utama:

- Progres harian berbasis tanggal, lengkap dengan poin didapat, poin pengurang, dan riwayat gacha.
- Reset hari ini menghapus progres hari itu dan mengoreksi perjalanan menuju hadiah.
- Setiap kelipatan 1000 saldo poin memberi 1 kesempatan gacha.
- Nilai pengurang dibuat kecil dan jelas agar tetap seimbang dengan reward positif.

## Jalankan lokal

```bash
npm start
```

Buka:

```text
http://localhost:3000
```

## Deploy

Project ini tidak membutuhkan package eksternal. Bisa dipasang di layanan Node seperti Render, Railway, Fly.io, VPS, atau layanan lain yang menjalankan `npm start`.

Data tersimpan di `data/store.json` pada server. Untuk produksi jangka panjang, gunakan storage persisten dari platform hosting.
