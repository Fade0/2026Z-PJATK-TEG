# Projekt

W semestrze jest jeden projekt zespołowy: system oparty na LLM, który łączy kilka technik z zajęć. Temat proponuje zespół, a prowadzący go zatwierdza. Na ostatnich zajęciach zespoły prezentują działające systemy.

| Element | Ustalenia |
|---|---|
| **Zespół** | 2 osoby; 3 tylko wtedy, gdy liczba osób w grupie zajęciowej jest nieparzysta |
| **Temat** | do wyboru: własny, do zatwierdzenia przez prowadzącego, albo jedna z [trzech propozycji](#przykładowe-projekty) poniżej |
| **Zakres** | co najmniej **8 z 12** [zagadnień](#zagadnienia) z zajęć; zespół 3-osobowy: co najmniej **10 z 12** |
| **Zgłoszenie zespołu i tematu** | mailem do **19.12.2026** (zajęcia 6), temat `[TEG] propozycja-projektu`; **mail wysyła jedna osoba, pozostałe osoby z zespołu muszą być w DW** |
| **Oddanie** | mailem do **22.01.2027, 23:59**, temat `[TEG] projekt`: prezentacja (PDF), dokumentacja (PDF) i folder z kodem |
| **Prezentacja** | zajęcia 8, **23.01.2027**, około 10 minut na zespół i pytania |

## Zagadnienia

Lista obejmuje tematy wszystkich zajęć. Projekt zespołu 2-osobowego musi wykorzystywać co najmniej osiem z nich, a zespołu 3-osobowego co najmniej dziesięć. Zagadnienia wybiera zespół. Zagadnienie liczy się wtedy, gdy działa w systemie i wpływa na wynik. Sam import biblioteki albo opis w dokumentacji nie wystarcza.

| # | Zagadnienie | Co oznacza w projekcie | Zajęcia |
|---|---|---|---|
| 1 | Ekstrakcja danych przez LLM | dane nieustrukturyzowane (PDF, HTML, tekst) zamieniane na rekordy albo graf przez structured output (np. Pydantic) | 1, 4 |
| 2 | Embeddingi i wyszukiwanie semantyczne | wyszukiwanie po wektorach (podobieństwo embeddingów) w bazie wektorowej, filtrowanie po metadanych | 1, 2 |
| 3 | RAG z odwołaniami do źródeł | chunking, kontekst w prompcie, odpowiedź wskazuje dokument lub fragment | 2 |
| 4 | Wyszukiwanie hybrydowe i reranking | BM25 razem z wyszukiwaniem wektorowym, reranker (cross-encoder albo LLM) | 2 |
| 5 | Ewaluacja | własny zbiór pytań z oczekiwanymi odpowiedziami, metryki (hit@k, RAGAS, DeepEval, LLM-as-judge), porównanie co najmniej dwóch wariantów systemu | 2 |
| 6 | Agent z narzędziami | tool calling, pętla ReAct, kilka osobnych narzędzi zamiast jednego ogólnego, limit kroków | 3 |
| 7 | Pamięć i stan rozmowy | historia rozmowy, pytania uzupełniające („a w marcu?”), checkpointer w LangGraph | 3 |
| 8 | Workflow z człowiekiem w pętli | graf stanów w LangGraph, krawędzie warunkowe, `interrupt()` i akceptacja przed wykonaniem działania | 3 |
| 9 | Graf wiedzy i GraphRAG | Neo4j, schemat encji i relacji, zapytania Cypher: multi-hop, agregacje, zapytania czasowe | 4 |
| 10 | Własny serwer MCP | narzędzia, zasoby albo prompty udostępnione przez MCP; z serwera korzysta agent projektu i drugi klient (np. MCP Inspector, Claude Desktop) | 5 |
| 11 | System wieloagentowy | supervisor albo inny podział ról między agentami, porównanie z pojedynczym agentem | 5 |
| 12 | Jawna logika decyzyjna | deterministyczny silnik decyzyjny w kodzie, niezależny od LLM: decyzję (dopasowanie, ranking, akceptacja) podejmuje kod według reguł albo wzoru z wagami, a wynik ma uzasadnienie; LLM interpretuje zapytanie i wyciąga dane, ale nie decyduje | 3, 4 |

**Jawna logika decyzyjna (12)** dotyczy systemów, które coś wybierają albo rozstrzygają: dobierają osoby do projektu, układają ranking przepisów, wskazują, kto musi zatwierdzić rabat. Wynik wygenerowany przez LLM na podstawie samego promptu („wybierz najlepszego kandydata”) trudno sprawdzić i powtórzyć. W tym zagadnieniu decyzję podejmuje **deterministyczny silnik w kodzie, niezależny od LLM**: te same dane wejściowe zawsze dają ten sam wynik. Reguły zapisane w prompcie i przekazane modelowi się nie liczą, nawet jeśli są dokładne. Przykłady silnika:

- wzór scoringowy: `wynik = 0,5 · pokrycie umiejętności + 0,3 · dostępność + 0,2 · doświadczenie w branży`,
- reguły: „rabat powyżej 12% zatwierdza dyrektor handlowy”,
- twarde filtry: „bez glutenu”, „dostępny od marca”.

System pokazuje, z czego wynika wynik, np. rozbicie punktów na czynniki. LLM może zamienić pytanie użytkownika na parametry i wyciągnąć cechy z dokumentów, ale nie wybiera wyniku.

## Wymagania wspólne

Niezależnie od tematu każdy projekt ma:

- **interfejs użytkownika**; sam notebook albo CLI nie wystarcza. Interfejs może być prosty: Streamlit, Gradio albo FastAPI z prostą stroną HTML. Przy pracy z agentem kodującym zalecany jest Next.js z Tailwind CSS i design systemem (zajęcia 6). Zamiast aplikacji webowej można zbudować integrację z komunikatorem (Messenger, Discord, Telegram, aplikacja w Teams itp.), ale preferowana jest aplikacja webowa: pozwala pokazać wyniki w dowolnej formie (tabele, wykresy, graf, ranking z uzasadnieniem), a nie tylko jako tekst,
- **kod podzielony na moduły** (np. ingestion, wyszukiwanie, agent, interfejs), a nie jeden skrypt albo notebook,
- **kod w repozytorium Git** od początku pracy; historia commitów pokazuje, jak projekt powstawał,
- **co najmniej jedno źródło danych nieustrukturyzowanych** (PDF, HTML, swobodny tekst); dane ustrukturyzowane (CSV, JSON, odpowiedzi API) mogą je uzupełniać, ale nie zastępują; dane syntetyczne, np. wygenerowane przez LLM, są dozwolone, jeśli dokumentacja opisuje, jak powstały,
- **README** z instrukcją uruchomienia, plik `.env.example` i `.gitignore`; w kodzie nie może być kluczy API ani pliku `.env`,
- **konfigurację agenta kodującego**\*, jeśli zespół z niego korzysta,
- **dokumentację** w osobnym pliku PDF (zalecany LaTeX, np. w [Overleaf](https://www.overleaf.com)), która zawiera:
  - opis problemu i schemat architektury,
  - tabelę wybranych zagadnień: numer, sposób użycia i plik w kodzie,
  - przykłady działania systemu i wnioski: co działa, co nie i dlaczego,
  - ograniczenia i możliwe kierunki rozwoju.

\* Korzystanie z agenta kodującego jest dozwolone. Zespół, który z niego korzysta, konfiguruje go w projekcie: skille, design system, reguły i instrukcje dla agenta (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` albo odpowiednik) oraz opis sposobu pracy. Struktura tych plików zależy od wybranego agenta (temat zajęć 6). Zespół, który nie korzysta z agenta, pomija ten punkt.

## Zgłoszenie zespołu i tematu

Mail z propozycją tematu jest jednocześnie zgłoszeniem zespołu. Temat maila: `[TEG] propozycja-projektu`, termin: 19.12.2026.

> **Mail wysyła jedna osoba. Pozostałe osoby z zespołu muszą być w DW.** Na tej podstawie zespół zostaje zapisany. Osoby, której nie ma w DW, nie ma w zespole.

W treści:

1. skład zespołu: imiona, nazwiska i numery indeksów,
2. problem, który system rozwiązuje (3–5 zdań),
3. dane: skąd pochodzą, które są nieustrukturyzowane,
4. wybrane zagadnienia z listy, każde z jednym zdaniem o sposobie użycia,
5. trzy przykładowe pytania albo scenariusze, które system ma obsłużyć.

Zespół 3-osobowy jest dopuszczalny tylko wtedy, gdy grupy zajęciowej nie da się podzielić na pary; wtedy mail zawiera krótką informację o tym, a lista wybranych zagadnień ma co najmniej dziesięć pozycji.

Prowadzący odpowiada do wszystkich osób z maila: zatwierdza temat albo prosi o uzupełnienie. Zatwierdzenie oznacza, że zespół i temat są zapisane. Temat można doprecyzować w trakcie pracy, ale zmianę zagadnień trzeba zgłosić w tym samym wątku.

## Przykładowe projekty

Trzy propozycje pokazują oczekiwaną skalę i sposób opisu. Każdą z nich można wybrać jako temat projektu.

### Przykład 1. TalentMatch AI: dopasowanie programistów do projektów

Firma programistyczna dostaje od klientów zapytania ofertowe (RFP) i musi szybko odpowiedzieć, czy ma pracowników o odpowiednich kompetencjach, żeby obsadzić projekt. Wiedza o pracownikach jest rozproszona w CV, a o ich dostępności w arkuszach przydziałów. Klasyczny RAG radzi sobie z pytaniem „kto zna Kubernetesa?”, ale nie policzy osób ani nie sprawdzi dostępności w zadanym okresie, bo odpowiada na podstawie kilku znalezionych fragmentów.

**Dane**

- około 30 CV programistów w PDF (dane nieustrukturyzowane): doświadczenie, umiejętności, certyfikaty, uczelnie,
- zapytania ofertowe w PDF: wymagane umiejętności z poziomem, liczba osób, termin rozpoczęcia, budżet,
- przydziały do projektów w JSON (dane ustrukturyzowane): kto, gdzie i do kiedy pracuje.

Dane można wygenerować przez LLM, np. pisząc do tego skill w wybranym agencie kodującym.

**Jak działa**

1. LLM wyciąga z każdego CV i RFP encje i relacje według ustalonego schematu, a kod sprawdza je przed zapisem (np. normalizacja nazw: „JS” i „JavaScript” to jedna umiejętność).
2. Graf w Neo4j: `Person`, `Skill`, `Certification`, `Company`, `University`, `Project`, `RFP` oraz relacje `HAS_SKILL {level, years}`, `WORKED_AT`, `ASSIGNED_TO {from, to}`, `REQUIRES {level}`.
3. Algorytm dopasowania w kodzie: dla każdej osoby i RFP liczy wynik z wagami (pokrycie wymaganych umiejętności, poziom, dostępność w terminie, doświadczenie w branży) i zwraca ranking z rozbiciem wyniku na czynniki.
4. Agent w LangGraph ma osobne narzędzia: zapytanie Cypher z szablonu, wyszukiwanie w treści CV, dopasowanie zespołu do RFP, sprawdzenie dostępności. Pamięta rozmowę, więc rozumie pytania uzupełniające.
5. Interfejs (minimum): czat oraz widok RFP z proponowanym zespołem i uzasadnieniem każdej osoby.

W projekcie powstają dwa rozwiązania: klasyczny RAG po treści CV i GraphRAG. Ten sam zbiór pytań trafia do obu, a metryki pokazują, które odpowiada dokładniej i na jakich typach pytań.

**Przykładowe pytania**

- „Ilu programistów Pythona z certyfikatem AWS jest dostępnych od marca?” (liczenie, filtrowanie, czas)
- „Kto pracował z Anną Nowak w tej samej firmie?” (multi-hop)
- „Jaka jest średnia liczba lat doświadczenia osób znających Reacta?” (agregacja)
- „Dobierz dwuosobowy zespół do RFP-003. A gdyby projekt zaczynał się miesiąc później?” (dopasowanie i pytanie uzupełniające)

**Pokryte zagadnienia: 8 z 12**

| # | Zagadnienie | Sposób użycia |
|---|---|---|
| 1 | Ekstrakcja danych przez LLM | encje i relacje z CV i RFP zapisywane w grafie |
| 2 | Embeddingi i wyszukiwanie semantyczne | wektorowy indeks treści CV, używany przez agenta i przez klasyczny RAG |
| 3 | RAG z odwołaniami do źródeł | klasyczny RAG po CV, pierwsze z dwóch rozwiązań |
| 5 | Ewaluacja | 20–30 pytań z odpowiedziami policzonymi z danych, zadanych obu rozwiązaniom; trafność i czas odpowiedzi |
| 6 | Agent z narzędziami | narzędzia: Cypher, wyszukiwanie, dopasowanie, dostępność |
| 7 | Pamięć i stan rozmowy | historia rozmowy i pytania uzupełniające |
| 9 | Graf wiedzy i GraphRAG | graf w Neo4j i zapytania Cypher, drugie rozwiązanie |
| 12 | Jawna logika decyzyjna | wzór scoringowy z wagami i wyjaśnieniem rankingu |

### Przykład 2. Przepisy z lodówki

Użytkownik ma w lodówce kilka produktów, ograniczony czas i dietę z wykluczeniami (np. bez glutenu). Wyszukiwarki przepisów szukają po nazwie dania, a nie po tym, co jest w domu, i nie mówią, czego brakuje.

**Dane**

- przepisy pobrane ze stron WWW (HTML) i z PDF-ów (dane nieustrukturyzowane), od kilkudziesięciu do kilkuset przepisów,
- zawartość lodówki wpisywana przez użytkownika w formularzu albo zwykłym tekstem („mam pół cukinii, 4 jajka i fetę”),
- opcjonalnie tabela wartości odżywczych w CSV.

**Jak działa**

1. LLM zamienia przepis na rekord: składniki z ilościami i jednostkami, czas, technika, kuchnia, dieta. Kod ujednolica nazwy składników (np. „pomidory krojone z puszki” i „pomidory z puszki” to ten sam składnik).
2. Graf: `Recipe`, `Ingredient`, `Cuisine`, `Diet`, `Technique` oraz relacje `CONTAINS {amount, unit}`, `BELONGS_TO`, `EXCLUDES`, `SUBSTITUTES`.
3. Algorytm dopasowania w kodzie: twarde filtry (alergie, dieta, maksymalny czas), potem wynik z wagami: odsetek składników z lodówki, liczba brakujących, wykorzystanie produktów, które szybko się psują. Wynik zawiera listę brakujących składników i możliwe zamienniki.
4. Wyszukiwanie hybrydowe po opisach przepisów: BM25 dla dokładnych nazw („shakshuka”) i embeddingi dla opisów („coś rozgrzewającego na zimny wieczór”).
5. Agent z narzędziami: wyszukiwanie przepisów, dopasowanie do lodówki, zamienniki, lista zakupów. Pamięta preferencje z rozmowy („nie lubię kolendry”).
6. Serwer MCP udostępnia lodówkę jako zasób i narzędzia dopasowania, dzięki czemu z systemu można korzystać także z Claude Desktop.
7. Interfejs (minimum): czat i formularz z zawartością lodówki.

**Przykładowe pytania**

- „Co ugotować z cukinii, jajek i fety w 30 minut, bez glutenu?”
- „Których składników najczęściej brakuje mi do dań kuchni tajskiej?” (agregacja)
- „Czym zastąpić śmietanę w tym przepisie?” (relacja w grafie, pytanie uzupełniające)
- „Zaplanuj trzy obiady na ten tydzień tak, żeby zużyć otwarty jogurt i nie powtarzać kuchni.”

**Pokryte zagadnienia: 8 z 12**

| # | Zagadnienie | Sposób użycia |
|---|---|---|
| 1 | Ekstrakcja danych przez LLM | składniki, ilości i metadane z HTML i PDF |
| 2 | Embeddingi i wyszukiwanie semantyczne | embeddingi opisów przepisów |
| 4 | Wyszukiwanie hybrydowe i reranking | BM25 i embeddingi połączone w jednym rankingu |
| 6 | Agent z narzędziami | wyszukiwanie, dopasowanie, zamienniki, lista zakupów |
| 7 | Pamięć i stan rozmowy | pamięć preferencji i pytania uzupełniające |
| 9 | Graf wiedzy i GraphRAG | graf przepisów, składników i zamienników w Neo4j |
| 10 | Własny serwer MCP | zasób „lodówka” i narzędzia dopasowania |
| 12 | Jawna logika decyzyjna | filtry i wzór scoringowy z listą brakujących składników |

### Przykład 3. Asystent decyzyjny dla firmy

Kovalo Distribution to fikcyjny dystrybutor żywności z Warszawy. Menedżerowie codziennie podejmują drobne decyzje: czy można udzielić rabatu, czy dostawca łamie umowę, co postanowił komitet cenowy. Informacje są w politykach, umowach, notatkach ze spotkań i raportach, a odpowiedzi „z pamięci” prowadzą do błędów, np. do rabatu zatwierdzonego przez osobę bez uprawnień. Asystent odpowiada na podstawie dokumentów firmy, pokazuje źródła i liczby, a decyzje zostawia ludziom.

Gotowe dane do tego scenariusza są w repozytorium [wodecki/TEG_PL_Project_2026](https://github.com/wodecki/TEG_PL_Project_2026) (folder `data/`). Można z nich skorzystać albo przygotować podobny zestaw dla innej firmy.

**Dane**

- 18 dokumentów firmy w Markdown (dane nieustrukturyzowane): polityki (m.in. akceptacja rabatów, limity kredytowe, zwroty), umowy z dostawcami i podwykonawcą logistycznym, procedury, notatki ze spotkań, raporty kwartalne; jeden dokument jest po angielsku,
- katalog dokumentów w CSV: typ, dział, właściciel, data wejścia w życie,
- dane operacyjne w CSV: miesięczny OTIF dostawców i wartości faktur.

**Jak działa**

1. Indeks dokumentów: chunki z tytułem dokumentu i nazwą sekcji, embeddingi, filtrowanie po typie i dziale. Wyszukiwanie hybrydowe, bo embeddingi słabo odróżniają identyfikatory, np. `SUP-114` od `SUP-207`.
2. RAG odpowiada z odwołaniami do dokumentów i odmawia, gdy w dokumentach nie ma odpowiedzi.
3. Polityka rabatowa zapisana w kodzie jako silnik reguł: przedziały rabatu, wyjątki, minimalna marża. Silnik zwraca listę osób zatwierdzających razem z uzasadnieniem.
4. Agent z narzędziami tylko do odczytu: wyszukiwanie w dokumentach, warunki umowy, OTIF za okres, wartość faktury, kalkulator kary umownej, sprawdzenie polityki rabatowej. Liczby pochodzą z narzędzi, a nie z modelu.
5. Workflow w LangGraph: wniosek o rabat jest uzupełniany w rozmowie, a potem zatrzymany (`interrupt()`) do akceptacji przez osoby wskazane przez politykę. Zmiana wniosku tworzy nową wersję i unieważnia wcześniejsze akceptacje.
6. Narzędzia są udostępnione przez serwer MCP, z którego korzysta asystent i np. MCP Inspector.
7. Interfejs (minimum): czat ze źródłami odpowiedzi i lista wniosków czekających na akceptację.

**Przykładowe pytania**

- „Czy Mleczna Dolina dotrzymała OTIF z umowy w III kwartale? Jeśli nie, ile wynosi kara?” (dane, umowa i obliczenia)
- „Kto musi zatwierdzić rabat 15% dla klienta strategicznego?” (reguły w kodzie)
- „Co komitet cenowy postanowił w sprawie wody?” (RAG ze źródłem)
- „Złóż wniosek o 22% rabatu dla sklepu w Gdańsku. A gdyby to była wyprzedaż końcówek?” (workflow, nowa wersja wniosku)

**Pokryte zagadnienia: 9 z 12**

| # | Zagadnienie | Sposób użycia |
|---|---|---|
| 2 | Embeddingi i wyszukiwanie semantyczne | embeddingi chunków z kontekstem, filtrowanie po metadanych z katalogu |
| 3 | RAG z odwołaniami do źródeł | odpowiedzi z odwołaniami do dokumentów i odmowa przy braku źródła |
| 4 | Wyszukiwanie hybrydowe i reranking | BM25 dla identyfikatorów dostawców i umów |
| 5 | Ewaluacja | pytania z oczekiwanymi źródłami i odpowiedziami; hit@k, poprawność odpowiedzi i odwołań, porównanie wyszukiwania wektorowego z hybrydowym |
| 6 | Agent z narzędziami | narzędzia do danych i obliczeń |
| 7 | Pamięć i stan rozmowy | stan rozmowy, pytania uzupełniające, wersje wniosku |
| 8 | Workflow z człowiekiem w pętli | wstrzymanie wniosku do akceptacji przez człowieka |
| 10 | Własny serwer MCP | narzędzia Kovalo udostępnione przez MCP |
| 12 | Jawna logika decyzyjna | silnik reguł polityki rabatowej i kalkulator kar |

## Oddanie

Jeden mail na zespół, temat `[TEG] projekt`, do **22.01.2027, 23:59**, czyli dzień przed prezentacjami. Wysyła jedna osoba, pozostałe są w DW. W załącznikach:

1. prezentacja w PDF, ta sama, która zostanie pokazana na zajęciach,
2. dokumentacja w PDF (zalecany LaTeX, np. w Overleaf),
3. folder z kodem spakowany do zip, razem z folderem `.git`, żeby była widoczna historia zmian; bez `.env`, `.venv`, `__pycache__` i `node_modules`.

Oceniany jest stan w chwili wysłania maila; zmiany po terminie nie są brane pod uwagę.

## Ocena

Projekt razem z prezentacją to 50 punktów. Oceniane będą:

- wybrane zagadnienia: liczba i jakość wdrożenia,
- architektura i jakość kodu,
- dane i proces ich przetwarzania,
- dokumentacja, w tym wnioski i opis pracy z agentem kodującym,
- prezentacja, demo i odpowiedzi na pytania.

Oceniane jest to, co działa w kodzie i wynikach, a nie deklaracje w dokumentacji. Zagadnienia ponad wymagane minimum mogą zrównoważyć słabsze elementy.

## Prezentacja

Zajęcia 8, 23.01.2027, z wykorzystaniem slajdów wysłanych przy oddaniu. Każdy zespół ma około 10 minut:

1. problem i dane,
2. architektura i wybrane zagadnienia,
3. demo działającego systemu,
4. wyniki i wnioski, także o tym, co nie zadziałało.
