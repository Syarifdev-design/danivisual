# Danivisual MySQL Database

File utama:

```bash
database/danivisual_mysql.sql
```

Import ke MySQL:

```bash
mysql -u root -p < database/danivisual_mysql.sql
```

Kalau MySQL lokal tanpa password:

```bash
mysql -u root < database/danivisual_mysql.sql
```

Database yang dibuat:

```sql
danivisual_db
```

Contoh cek data:

```sql
USE danivisual_db;
SELECT * FROM pages ORDER BY sort_order;
SELECT * FROM v_page_content;
SELECT * FROM v_service_packages;
SELECT * FROM portfolio_albums ORDER BY sort_order;
SELECT fc.title, fi.question
FROM faq_categories fc
JOIN faq_items fi ON fi.category_id = fc.id
ORDER BY fc.sort_order, fi.sort_order;
```

Catatan:

- Project saat ini masih frontend Vite/React static, jadi database ini belum otomatis dipakai oleh UI.
- Semua konten public page, paket layanan, portfolio, FAQ, form labels, dan mock dashboard dimasukkan ke seed SQL.
- Untuk membuat web membaca data ini, langkah berikutnya adalah menambahkan backend API Node/PHP/Laravel yang mengambil data dari `danivisual_db`.
