# FiveM Ekip Discord Botu

- Bu bot, FiveM ekipleri için moderasyon, etkinlik ve basit OT (puan) yönetimi sağlar.
- Bu bot oyun amaçlı yapılmıştır!

## Özellikler
- Toplu mesaj gönder (belirli roldeki herkese DM)
- Etkinlik başlat (butona tıklayanları süre sonunda listele)
- Ban / Unban (ID üzerinden de ban)
- Autorol (sunucuya girene otomatik rol)
- OT sistemi: `otekkle`, `otsil`, `siralama`, `envanter`
- Moderasyon: `/kilit`, `/kilitac`, `/rolbilgi`

## Kurulum
1. Node.js 18+ kurulu olmalı.
2. Depoyu/klasörü açın.
3. Bağımlılıkları kurun:
   
   npm install

4. `.env` dosyası oluşturup aşağıyı doldurun:
   
   DISCORD_TOKEN=Bot_Tokeniniz
   GUILD_ID=SunucuID
   AUTOROLE_ID=Sunucuya_gelene_verilecek_RolID

5. Slash komutlarını deploy edin:
   
   npm run deploy:commands

6. Botu başlatın:
   
   npm start

## Notlar
- Toplu DM özelliği, kullanıcıların DM'leri kapalıysa iletemez; rapor verir.
- `/rolbilgi` çok kullanıcıda çıktıyı dosya olarak ekleyebilir.
- OT verileri `data/bot.db` içinde SQLite olarak saklanır.
