# Lumen Sync: kody błędów
dział: Produkt | rok: 2026

Kody błędów zwracane przez API i aplikację Lumen Sync:
- LS-401: brak albo nieważny klucz API. Należy sprawdzić, czy klucz nie wygasł.
- LS-403: klucz nie ma uprawnień do operacji, np. klucz tylko do odczytu przy próbie zapisu.
- LS-409: konflikt wersji. Plik zmieniono na innym urządzeniu, zanim zapisano lokalną zmianę. Aplikacja tworzy kopię z dopiskiem „konflikt” i obie wersje trzeba porównać ręcznie.
- LS-413: plik przekracza limit rozmiaru dla planu.
- LS-429: przekroczony limit zapytań na minutę.
- LS-503: usługa chwilowo niedostępna. Zgłoszenia od klientów z tym błędem dział wsparcia eskaluje jako P1.

W treści każdego błędu jest identyfikator żądania (request id), który klient podaje w zgłoszeniu do wsparcia.
