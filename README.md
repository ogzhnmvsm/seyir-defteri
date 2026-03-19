<p align="center">
  <a href="https://github.com/ogzhnmvsm/seyir-defteri">
    <img src="logo2.png" width="384" height="384" style="border-radius: 128px;">
  </a>
  <h1 align="center">Seyir Defteri</h1>
  <p align="center">Tiyatro oyunlarını, sahneleri ve etkinlikleri tek bir platformdan takip edin.</p>
</p>

<p align="center">
  <a href="https://seyir-defteri-frontend-url.vercel.app"><b>Canlı Demo (Önyüz)</b></a> · 
  <a href="https://seyir-defteri.onrender.com"><b>Backend API Sunucusu</b></a> · 
  <a href="#hızlı-başlangıç-lokal-kurulum">Kurulum</a> · 
  <a href="#yayınlama-deployment">Yayınlama Rehberi</a>
</p>

## Özellikler

- **Güncel Veri:** En yeni tiyatro takvimini kolayca inceler. Bildirimlerle güncel kalırsınız.
- **Ajanda ve Puanlama:** İzlemek istediğiniz oyunları kaydeder, izlediklerinize puan verirsiniz.
- **Otomatik Scraper:** Farklı tiyatro sitelerinden oyun verilerini toplar.
- **Modern Arayüz:** Kullanıcı dostu ve estetik bir tasarım.

## Mimari

Proje üç ana bileşen ve bir veritabanı etrafında şekillenmiştir:

- `frontend/`: Kullanıcıların etkileşime girdiği şık web arayüzü.
- `backend/`: İş mantığını ve API servislerini yöneten alt yapı.
- `scraper/`: İnternetten tiyatro verilerini periyodik olarak tarayarak veritabanına aktaran servis.
- **Veritabanı:** PostgreSQL (Supabase önerilir)

## Hızlı Başlangıç (Lokal Kurulum)

### Gereksinimler
- Açılmış tamamen boş bir PostgreSQL projesi.
- Ana dizindeki `schema.sql` dosyasının DBeaver veya benzeri bir program ile veritabanında çalıştırılarak tabloların oluşturulması.

### Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/ogzhnmvsm/seyir-defteri.git
   ```
2. Dizinlerdeki bağımlılıkları `npm install` ile kurup geliştirme ortamınızı başlatın.

## Yayınlama (Deployment)

Proje, **tamamen ücretsiz** sunucularda kendi kendine 7/24 güncellenebilecek şekilde tasarlanmıştır:

1. **Veritabanı (Supabase)**: 
   Supabase bağlantı URL'nizi (`DATABASE_URL`) kopyalayın.
2. **Otomatik Scraper (GitHub Actions)**: 
   Repo içerisindeki `.github/workflows/scraper.yml` dosyası sayesinde her gün sabaha karşı TSİ 06:00'da otomatik çalışır. Bunun için GitHub repositorysinde uygulamanın `Settings > Secrets and variables > Actions` sayfasına girip `DATABASE_URL` isimli Repository Secret'ını (**veritabanı linkinizi**) eklemeniz yeterlidir.
3. **Backend API (Render.com)**: 
   Render'da yeni bir \"Web Service\" oluşturun. 
   - `Root Directory`: `backend`
   - `Build Command`: `npm install && cd ../scraper && npm install`
   - `Start Command`: `npm start`
   - Ortam Dağılımı (`Env Variables`): `DATABASE_URL` değişkenine veritabanı linkinizi verin.
4. **Frontend UI (Vercel.com)**: 
   Vercel sayfasına giderek GitHub deponuzu bağlayın. Root Directory olarak `frontend` dizinini seçin. Environment Variables alanına Render'ın backend app linkini `VITE_API_URL` adıyla (Örn: `https://x.onrender.com`) verin ve projeyi Deploy edin.

Tebrikler, uygulamanız ücretsiz, sıfır-maliyetli ve tam otomatize şekilde çalışıyor! 🎉
