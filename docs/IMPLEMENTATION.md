# Tombol Hadiah 2.0 — laporan implementasi

## Audit dan keputusan
Lihat AUDIT.md. Dikembangkan pada repository existing, commit awal 5e12b5a. Tetap vanilla JavaScript dan server Node existing. Halaman public/index.html tetap menjadi entry point; root redirect tidak berubah. UI direstrukturisasi untuk memisahkan mode anak/orang tua dan menghindari mutation/API lama yang belum memahami ledger.

## File utama
- public/index.html: shell 2.0 dengan asset relatif.
- public/v2/domain.js: repository, adapter localStorage, migrasi, validasi, autentikasi, layanan misi/poin/wallet/gacha/target.
- public/v2/ui.js: navigasi anak/orang tua, form, approval, riwayat, backup.
- public/v2/style.css: tokens, dark theme, mobile navigation, animasi dan reduced motion.
- public/sw.js: cache shell V2, tidak cache API.
- public/legacy.html: salinan HTML awal untuk referensi. Jangan gunakan aplikasi lama bersamaan untuk mengelola data V2.
- tests/domain.test.js, tests/browser.cjs, tests/build.js; package.json.

## Arsitektur
LocalStorageAdapter menangani persistence; Repository memusatkan operasi domain. Operasi membuat draft, memvalidasi, lalu menulis satu snapshot; kegagalan tidak mengubah state tersimpan. Total wallet selalu dihitung dari transaksi posted, bukan field saldo total. Goal menyimpan currentAmount sebagai projection kontribusi dan penggunaan. XP terpisah dari poin belanja gacha. Weighted gacha, eligibility, eksekusi dan redemption berada di domain, bukan kalkulasi UI. Supabase belum dipasang; adapter dan otorisasi server merupakan tahap berikutnya.

## Migrasi
Legacy memakai schemaVersion 3 sehingga V2 menggunakan dataVersion 2 terpisah. Startup memprioritaskan tombolHadiahV2. Jika belum ada, tombolHadiahState dimigrasi tanpa dihapus, dan snapshot ditulis ke tombolHadiahBackup-<timestamp>-<uuid>. Bila cache tidak tersedia, pengguna dapat mengambil GET state dari backend existing; tidak mengirim mutasi. Kegagalan fetch tidak membuat keluarga kosong otomatis. Snapshot legacy lengkap juga disimpan di state baru. saldo lama berarti POIN, bukan uang; wallet mulai nol. XP historis mulai nol agar tidak menebak achievement. History harian dan gacha digabung/deduplikasi; struktur detail lama tetap dalam legacy. Nama tidak menjadi primary key. Nilai uang hadiah lama tidak ditebak dari nama: orang tua harus mengisi nilai/jenis hadiah. Import memvalidasi dahulu dan membackup state aktif sebelum menggantinya.

## Dibangun
- Multi child, profil, beranda saldo/XP/level/poin/progress, misi dan target.
- Misi daily/weekly/one-time dengan kategori, scope anak/semua, poin/XP, approval, edit dan arsip.
- Poin tambah/kurang beralasan dan tidak mengurangi XP.
- Gacha berbobot, pool aktif/stok, idempotency key, tombol terkunci selama animasi, snapshot reward dan redemption sekali.
- Hadiah CRUD melalui create/edit/archive; konfigurasi nilai/konversi/jenis/bobot/stok/batas tujuan. Probabilitas relatif terlihat di mode orang tua.
- Empat bucket, income manual, alokasi tervalidasi realtime, transfer, belanja, berbagi, koreksi saldo dengan ledger.
- Tabungan free/parent-approval/locked; goal contribution, completion, penggunaan/approval dan tetap simpan.
- Dashboard, detail anak dengan enam tab, approval misi/wallet, PIN PBKDF2 SHA-256 dengan salt (100.000 iterasi).
- Timeline filter kategori/tanggal, export/import JSON, fondasi badge, ambang level configurable, theme tokens dan cache offline.

## Belum dibangun / batasan
- Backend V2 dan sinkronisasi multi perangkat; Google Sheet existing tidak menerima perubahan V2.
- Kontrol akses kuat, pemulihan/change PIN, rate limit PIN, audit identitas beberapa orang tua. Setup PIN pertama perlu dilakukan orang tua pada perangkatnya.
- Scheduler allowance dan pemberian badge otomatis (struktur tersedia).
- Upload/render gambar hadiah/target (URL hadiah baru metadata), edit target, penghapusan/arsip profil anak.
- Tombol tandai semua dan reset tersedia di mode orang tua; reset hanya membalik poin penyelesaian V2 hari ini dan tetap menjaga XP. Shortcut preset penalti lama belum tersedia; pengurangan poin beralasan tetap tersedia. Data detail lama tersimpan dalam backup.
- Koreksi yang menghasilkan saldo negatif sengaja tidak tersedia; semua operasi menolak saldo negatif.
- Migrasi cache tidak membandingkan versi terbaru Google Sheet; export legacy dari perangkat paling mutakhir sebelum perpindahan.
- Transaksi satu tab atomik pada snapshot, tetapi dua tab yang menulis tepat bersamaan masih bisa saling menimpa; hindari pengeditan bersamaan sampai locking/server transactions ditambahkan.
- Nilai reward legacy perlu diatur manual; hadiah item lama tetap dapat diambil.
- Build memeriksa syntax dan asset statis, bukan bundling.

## Verifikasi
22 unit/domain tests: migrasi, poin/XP, approval/idempotency, bobot/stok, wallet conservation/nonnegative, alokasi, auto saving/sharing, konversi, goal approval, auth, rollback dan import validation. Test browser memakai fixture lokal terisolasi (bukan data keluarga): migrasi → misi → gacha → claim → PIN → income → allocation. Semua enam menu anak diuji lebar 360/390/430/1280; tanpa horizontal overflow dan tanpa pageerror. Screenshot hasil ada di test-results (tidak di-commit).

## Menjalankan
1. Jalankan `npm start` lalu buka http://localhost:3000.
2. Pada perangkat dengan cache lama, migrasi otomatis. Perangkat baru: pilih Ambil data existing dan tunggu koneksi backend.
3. Orang tua: masuk tombol Orang tua, buat PIN pertama, atur Hadiah dan Misi. Tambah/koreksi poin melalui Anak > Overview. Tambah uang melalui Dompet.
4. Anak: selesaikan misi, buka hadiah saat poin cukup, pilih ambil/konversi; atur saldo dan target.
5. Lakukan Export Backup berkala di Pengaturan.
6. Acceptance: `npm test` dan `npm run build`. Browser: `npm install`, pastikan Edge terpasang, lalu `npm run test:browser`.

## Deployment
URL existing tetap https://agung3956.github.io/hadiah-anak/public/index.html. Implementasi dipublikasikan melalui commit fbd7799 ke main. Verifikasi 14 September 2026: URL public/index.html HTTP 200 dengan title Tombol Hadiah 2.0 dan referensi v2/domain.js; aset domain juga HTTP 200. Path publik tidak berubah. Tidak ada workflow baru yang diperlukan. Identitas commit diberikan pengguna: agung3956 <agung3956@gmail.com>. Pengujian transaksi menggunakan fixture lokal; tidak memutasi data keluarga di URL publik.

## Tahap berikutnya
Prioritaskan uji migrasi dengan export data keluarga nyata (tanpa menghapus sumber), transaksi/locking lintas tab, penyempurnaan kontrol PIN dan backend otoritatif. Setelah itu lengkapi pengelolaan target/profil, badge, serta shortcut fitur legacy. Jangan menambahkan bunga, uang menjadi poin, atau pembayaran nyata.


