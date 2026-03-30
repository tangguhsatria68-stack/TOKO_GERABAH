# 📸 Image Management Guide - Toko Gerabah

## Format Gambar Produk

Semua gambar produk harus berupa **URL public** yang dapat diakses dari browser.

## Opsi 1: Menggunakan Unsplash (Rekomendasi ✅)

**Format URL:** `https://images.unsplash.com/photo-[ID]?w=500&h=500&fit=crop`

Keuntungan:
- ✅ Gratis dan unlimited
- ✅ Tidak perlu login
- ✅ Kualitas tinggi
- ✅ Fast CDN
- ✅ Responsif

**Cara mendapatkan:**
1. Buka https://unsplash.com
2. Cari "pottery", "ceramic", "vase" dll
3. Klik gambar → lihat link di developer console
4. Format: `https://images.unsplash.com/photo-[ID]?w=500&h=500&fit=crop`

---

## Opsi 2: Menggunakan Google Drive

**Format URL:** `https://drive.google.com/uc?id=FILE_ID`

**Cara:**

### Step 1: Upload gambar ke Google Drive
1. Buka Google Drive
2. Upload foto produk Anda
3. Klik kanan → "Share"
4. Ubah menjadi "Anyone with the link" → "Viewer"

### Step 2: Dapatkan File ID
- Link share: `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
- Contoh URL gambar: `https://drive.google.com/uc?id=1a2b3c4d5e6f7g8h9i0j&export=download`

### Step 3: Gunakan di database
```sql
UPDATE products 
SET image = 'https://drive.google.com/uc?id=YOUR_FILE_ID&export=download'
WHERE id = 1;
```

---

## Opsi 3: Menggunakan Pexels/Pixabay

**Pexels:** `https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg`
**Pixabay:** `https://pixabay.com/get/[ID]`

---

## Opsi 4: Menggunakan CDN Sendiri

Jika punya server sendiri:
```
https://yourserver.com/images/product-1.jpg
```

---

## Update Gambar di Database

### Via Supabase Dashboard:
1. Buka Supabase Console
2. Ke Table "products"
3. Klik kolom "image"
4. Paste URL gambar

### Via SQL Query:
```sql
UPDATE products 
SET image = 'https://images.unsplash.com/photo-[ID]?w=500&h=500&fit=crop'
WHERE id = 1;
```

---

## Testing & Troubleshooting

### Cek apakah URL valid:
```bash
curl -I "https://images.unsplash.com/photo-[ID]?w=500&h=500&fit=crop"
```

### Gambar tidak tampil?
1. ✅ Pastikan URL public (tidak perlu login)
2. ✅ Cek CORS headers dari server
3. ✅ Refresh browser (hard refresh: Ctrl+F5)
4. ✅ Buka DevTools → Network → cek response dari image URL

### Format URL harus:
- ✅ Dimulai dengan `http://` atau `https://`
- ✅ Berakhir dengan format gambar (`.jpg`, `.png`, `.webp`)
- ✅ Bisa diakses tanpa autentikasi
- ✅ CORS-enabled atau dari trusted CDN

---

## Gambar Default

Jika gambar tidak tersedia:
- Fallback ke: `/placeholder.jpg`
- Edit di `frontend/src/pages/Dashboard.jsx`

```jsx
<img src={product.image || '/placeholder.jpg'} alt={product.name} />
```

---

## Current Images

Database sekarang menggunakan Unsplash URLs:
- ✅ Vas Keramik: `https://images.unsplash.com/photo-1527789050526-3df378b6dba7`
- ✅ Piring Batik: `https://images.unsplash.com/photo-1578749556568-bc2c40e68b61`
- ✅ Kendi: `https://images.unsplash.com/photo-1578500494198-246f612d03b3`
- ✅ Mangkuk: `https://images.unsplash.com/photo-1610701596007-11502861dcfa`
- ✅ Guci Beras: `https://images.unsplash.com/photo-1578749556568-bc2c40e68b61`
- ✅ Pot Tanaman: `https://images.unsplash.com/photo-1578500494198-246f612d03b3`
- ✅ Ceret Teh: `https://images.unsplash.com/photo-1610701596007-11502861dcfa`
- ✅ Hiasan Dinding: `https://images.unsplash.com/photo-1527789050526-3df378b6dba7`

---

## Tips Untuk Hasil Terbaik

1. **Ukuran gambar:** Min 500x500px
2. **Format:** JPG, PNG, WebP
3. **Rasio:** Square (1:1) atau landscape (16:10)
4. **Brightness:** Terang, mudah dilihat
5. **Background:** Solid / blur background

---

## Ganti Gambar Massal

Script SQL untuk update semua gambar:

```sql
UPDATE products 
SET image = CASE 
  WHEN id = 1 THEN 'https://images.unsplash.com/photo-1527789050526-3df378b6dba7?w=500&h=500&fit=crop'
  WHEN id = 2 THEN 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&h=500&fit=crop'
  WHEN id = 3 THEN 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop'
  ELSE image
END;
```

---

## Quick Copy URLs

### Pottery/Ceramic References:
```
1. Vase: https://images.unsplash.com/photo-1527789050526-3df378b6dba7?w=500&h=500&fit=crop
2. Plate: https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=500&h=500&fit=crop
3. Pot: https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop
4. Bowl: https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&h=500&fit=crop
```

---

**Siap! Sekarang produk Anda akan menampilkan gambar dengan indah.** 🎨
