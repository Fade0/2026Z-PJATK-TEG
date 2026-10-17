# VPN i dostęp do sieci firmowej
dział: IT | rok: 2026

Dostęp do systemów wewnętrznych spoza biura wymaga połączenia VPN. Firma używa klienta WireGuard; plik konfiguracyjny pobiera się z portalu samoobsługowego IT po zalogowaniu kluczem sprzętowym.

Najczęstsze błędy:
- VPN-719: certyfikat urządzenia wygasł. Należy otworzyć portal samoobsługowy, wybrać „Odnów certyfikat” i ponownie zaimportować konfigurację. Certyfikat jest ważny 180 dni.
- VPN-502: serwer bramy jest niedostępny. Zwykle oznacza prace serwisowe; ich harmonogram jest na stronie statusu IT.
- VPN-305: niezgodna wersja klienta. Trzeba zaktualizować WireGuard do wersji wskazanej w portalu.

W sieciach publicznych (hotel, lotnisko, kawiarnia) połączenie VPN jest obowiązkowe przed otwarciem jakiegokolwiek systemu firmowego. W biurze VPN nie jest potrzebny, a sieć dla gości (Goscie-WiFi) nie ma dostępu do systemów wewnętrznych.
