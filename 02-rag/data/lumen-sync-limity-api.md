# Lumen Sync: limity API
dział: Produkt | rok: 2026

Lumen Sync to usługa synchronizacji plików i dokumentów dla firm, sprzedawana przez firmę klientom zewnętrznym. API Lumen Sync ma limity zapytań zależne od planu:
- plan Start: 60 zapytań na minutę, pliki do 100 MB,
- plan Zespół: 600 zapytań na minutę, pliki do 2 GB,
- plan Firma: 6000 zapytań na minutę, pliki do 20 GB, limit można zwiększyć w umowie.

Po przekroczeniu limitu API zwraca błąd LS-429 i nagłówek Retry-After z liczbą sekund do odczekania. Klient powinien ponawiać zapytania z wykładniczo rosnącym odstępem.

Klucze API tworzy administrator konta klienta w panelu. Klucz ma zakres uprawnień (odczyt, zapis, administracja) i wygasa po roku.

Limity nie dotyczą webhooków, które Lumen Sync wysyła do systemów klienta.
