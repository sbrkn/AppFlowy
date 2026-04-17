# AppFlowy'yi Hem Offline Hem İnternet Üzerinden Kullanma Rehberi

Bu rehber, AppFlowy'yi **tek cihazda internetsiz (offline)** kullanmak ve isterseniz **internet üzerinden çoklu cihaz ile** erişilebilir hale getirmek için pratik bir yol haritası sunar.

## 1) Hedef Mimari (Özet)

- **Offline kullanım (yerel mod):**
  - AppFlowy Desktop uygulamasını kurarsınız.
  - Veriler cihazınızda yerel olarak saklanır.
  - İnternet olmadan çalışır.

- **Online kullanım (self-hosted mod):**
  - Kendi sunucunuzda AppFlowy servislerini ayağa kaldırırsınız.
  - Uygulama internete açık bir domain üzerinden senkronize çalışır.
  - Birden fazla cihazdan aynı workspace'e erişirsiniz.

## 2) Offline (Yerel) Kurulum Direktifleri

1. İşletim sisteminize uygun AppFlowy Desktop sürümünü indirin:
   - GitHub Releases: <https://github.com/AppFlowy-IO/AppFlowy/releases>
2. Uygulamayı kurup açın.
3. Workspace'inizi oluşturun ve çalışmaya başlayın.
4. Yerel yedek stratejisi uygulayın:
   - Haftalık dışa aktarma (export)
   - Disk yedekleme (Time Machine, Windows Backup, vb.)

> Not: Bu modda internet gerekmez; ancak bulut senkronizasyon ve ekip paylaşımı için self-hosted veya AppFlowy Cloud gerekir.

## 3) Online (Self-Hosted) Kurulum Direktifleri

Kendi altyapınızda internetten erişim için önerilen yaklaşım Docker tabanlı kurulumdur.

1. Sunucu hazırlığı:
   - Ubuntu 22.04+ (öneri)
   - En az 2 vCPU / 4 GB RAM
   - Domain (örn. `appflowy.sirketiniz.com`)
2. Sunucuda Docker ve Docker Compose kurun.
3. Resmi self-hosting rehberini adım adım uygulayın:
   - <https://appflowy.com/docs/Step-by-step-Self-Hosting-Guide---From-Zero-to-Production>
4. Reverse proxy + TLS (HTTPS) yapılandırın:
   - Nginx veya Caddy + Let's Encrypt
5. Güvenlik direktifleri:
   - Sadece 80/443 portlarını açın
   - Düzenli güncelleme (OS + container image)
   - Güçlü admin parolası ve mümkünse SSO

## 4) Aynı Anda Offline + Online Çalışma Stratejisi

En sağlıklı yaklaşım:

1. **Ana çalışma alanı:** self-hosted sunucudaki online workspace
2. **Kesinti planı:** internet kesintisinde yerel geçici not alanı (offline)
3. **Düzenli aktarım:** internet geldiğinde offline notları online workspace'e taşıma
4. **Yedekleme:**
   - Sunucu tarafı günlük snapshot
   - İstemci tarafı periyodik export

## 5) Operasyonel Direktifler (Önerilen)

- Günlük:
  - Uygulama açılışında senkronizasyon durumunu kontrol et
- Haftalık:
  - Workspace export al
  - Sunucu loglarında hata taraması yap
- Aylık:
  - Güvenlik yamalarını uygula
  - Geri yükleme testini (restore drill) çalıştır

## 6) Sorun Giderme Hızlı Kontrol Listesi

- Offline'da açılmıyor:
  - Uygulama sürümünü güncelle
  - Yerel disk doluluğunu kontrol et
- Online senkron olmuyor:
  - Domain DNS kaydı doğru mu?
  - HTTPS sertifikası geçerli mi?
  - Sunucu servisleri ayakta mı (`docker compose ps`)
- Performans düşük:
  - Sunucu CPU/RAM kullanımını kontrol et
  - Büyük medya dosyalarını arşivle

## 7) Resmi Referanslar

- AppFlowy Releases:
  - <https://github.com/AppFlowy-IO/AppFlowy/releases>
- Self-hosting (resmi):
  - <https://appflowy.com/docs/Step-by-step-Self-Hosting-Guide---From-Zero-to-Production>
- From source (geliştirme):
  - <https://docs.appflowy.io/docs/documentation/appflowy/from-source>

## 8) “Bu özellikleri kazandırabilir miyiz?” — Kısa cevap

Evet, kazandırabiliriz; ancak **internetten çoklu cihaz senkronizasyonu, kullanıcı yönetimi, paylaşım ve merkezi yedekleme** için AppFlowy'nin self-hosted sunucu bileşenlerine ihtiyaç vardır.

Gerekenler:

- Sunucu altyapısı (VM veya bare metal)
- Domain + HTTPS sertifikası
- Docker/Docker Compose ile servis orkestrasyonu
- Kalıcı depolama ve düzenli yedekleme
- İzleme/loglama (uptime + hata takibi)
- Güncelleme ve güvenlik yama süreci

Eğer yalnızca tek cihazda çalışacaksanız, offline desktop kurulum yeterlidir; fakat ekipçe internet üzerinden kullanım için self-hosted kurulum zorunludur.
