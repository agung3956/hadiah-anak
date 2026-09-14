# Audit awal
Repository existing: agung3956/hadiah-anak. Vanilla JavaScript/CSS/HTML, tanpa dependency runtime; server Node HTTP dan alternatif Apps Script. Routing berupa halaman statis; root mengarah public/index.html. PWA sudah ada. Tidak ada test/build pipeline awal.

Fitur lama: tiga anak, misi harian, poin saldo, pengurang preset/custom, reset/tandai semua, gacha biaya 1000 dengan random seragam, CRUD misi/hadiah, history berdasarkan tanggal. Cache memakai tombolHadiahState, backend mengembalikan {ok,data}. Legacy schemaVersion sudah 3; versi produk baru menggunakan dataVersion 2 agar tidak bentrok.

Risiko: normalizeData lama mereset Ahmad sekali dan memasukkan kembali misi default; API lama tidak memiliki otorisasi; penulisan seluruh state dapat konflik. V2 tidak menjalankan normalisasi lama dan tidak menulis backend lama. Snapshot asli dipertahankan dalam backup migrasi. UI baru diperlukan karena mode, approval, ledger dan lifecycle hadiah tidak dapat disisipkan aman ke handler lama yang memutasi data langsung. Aset, dataset default, server, dan deployment existing dipakai kembali. Sumber lama tetap di git dan legacy.html untuk referensi, bukan jalur pengelolaan V2.
