<p align="center">
  <img src="logo.png" width="96" height="96" style="border-radius: 20px;">
</p>

# Seyir Defteri
Tiyatro oyunlarını, sahneleri ve etkinlikleri tek bir platformdan takip edin.

[Canlı Demo](#) · [Hızlı Başlangıç](#hızlı-başlangıç) · [Mimari](#mimari)

## Özellikler

- **Güncel Veri:** En yeni tiyatro takvimini kolayca inceler. Bildirimlerle (Çan) güncel kalırsınız.
- **Ajanda ve Puanlama:** İzlemek istediğiniz oyunları kaydeder, izlediklerinize puan (Yıldız) verirsiniz.
- **Otomatik Scraper:** Farklı biletleme ve tiyatro sitelerinden oyun verilerini toplar.
- **Modern Arayüz:** Kullanıcı dostu ve estetik bir tasarım.

## Mimari

Proje üç ana servis etrafında şekillenmiştir:

- `frontend/`: Kullanıcıların etkileşime girdiği şık web arayüzü.
- `backend/`: İş mantığını, puanlama sistemini ve API servislerini yöneten alt yapı.
- `scraper/`: Tiyatro verilerini internetten tarayarak veritabanına aktaran bot servisi.

## Hızlı Başlangıç

### Kurulum

1. Projeyi klonlayın:
   ```bash
   git clone https://github.com/kullanici-adi/seyir-defteri.git
   ```
   
2. Kurulum ve Çalıştırma:
   Backend ve Frontend dizinlerine girerek ilgili projenin kurulum komutlarını çalıştırıp geliştirme ortamını başlatabilirsiniz.
