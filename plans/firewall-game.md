# Plan: Firewall — retro grid shmup (promka utworu)

> Source PRD: `PRD.md` (firewall_game). Cel: krótka przeglądarkowa gra arcade jako promka utworu „Firewall" (3:15) → link do YT na ekranie końcowym.

## Architectural decisions

Trwałe decyzje obowiązujące we wszystkich fazach:

- **Architecture style**: statyczna gra przeglądarkowa, Vite + TypeScript + Phaser 3 (Arcade physics). Brak backendu i bazy w MVP. Hosting: Cloudflare Pages.
- **Rdzeń mechaniki** (AKTUALIZACJA 2026-05-23): tarcza **aktywowana przytrzymaniem Spacji** (NIE domyślna), łuk nad statkiem, zużywa energię (regen po puszczeniu). Tarcza **bazowo mała**, powiększana wyłącznie bonusem ShieldBoost. Kontakt z wrogiem bez tarczy rani HP. Strzał wyłącznie jako power-up (nigdy domyślny auto-fire).
- **Moduły głębokie (czysta logika, testowalne Vitest bez Phasera)**: ScoreSystem, RunController, DifficultyCurve, Leaderboard.
- **Moduły sprzężone z Phaserem (weryfikacja wizualna)**: ShieldSystem, SpawnSystem, PowerUpSystem, AudioSystem, HUD/RetroGridBackground.
- **Kluczowe encje**: Player (statek-tarcza), Enemy (Virus/Trojan/Worm/Spyware), Boss (mini), PowerUp, Wave, RunResult (wynik + czas + powód końca), LeaderboardEntry.
- **Stany końcowe rundy**: win @100 pkt · death @3 życia · timeout @6:30 (2 pętle tracku).
- **Konfiguracja**: stałe balansu, `YOUTUBE_URL`, ścieżka audio — w jednym miejscu konfiguracyjnym, do tuningu/podmiany.
- **Persystencja**: localStorage (leaderboard, mute). Brak online.
- **Estetyka**: retro neon grid na `#0a0e17` (cyan/magenta/żółty/zielony), scanline, proceduralne kształty, pixel font, UI po polsku. 480×800 portrait, `Scale.FIT`. Klawiatura (desktop) + sterowanie dotykowe (mobile, GH issue #8 — zmiana zakresu 2026-05-23). Dev po LAN: `npm run dev` (server.host=true) → `http://<IP>:5173`.
- **Stack na zapas (poza MVP)**: gdyby wszedł globalny leaderboard lub pomiar konwersji → Hono na CF Workers + Neon.

---

## Phase 1: Grywalny rdzeń (tracer bullet)

**User stories**: 1, 2, 3, 4, 5, 7, 13, 15, 21, 30, 31, 39, 40, 41

### What to build

Kompletna, grywalna pętla end-to-end: ekran ładowania → minimalne menu (START) → rozgrywka → ekran końcowy. Gracz steruje statkiem-tarczą (poziom + lekki pion w dolnej strefie); tarcza NIE jest domyślna — gracz **przytrzymuje Spację**, by włączyć **łuk tarczy nad statkiem** (zużywa energię, regen po puszczeniu), który odpycha i niszczy wrogów. Tarcza jest **bazowo mała** (powiększana wyłącznie bonusem ShieldBoost). Kontakt z wrogiem **bez aktywnej tarczy** zabiera HP (i-frames); 0 HP = porażka. Na planszy spawnuje się jeden typ wroga (Virus) lecący w dół; eliminacja daje punkty; osiągnięcie 100 pkt = wygrana. Tło to animowana siatka neon ze scanline; trafienia mają screen shake i flash. Ekran końcowy pokazuje wynik, przycisk „Zagraj jeszcze raz" i przycisk „Obejrzyj na YouTube" (URL z konfiguracji, nowa karta).

### Acceptance criteria

- [ ] Gra startuje od preloadu i przechodzi Boot → Menu → Game → End bez błędów w konsoli.
- [ ] Statek porusza się klawiaturą w dozwolonej strefie; nie wychodzi poza ekran.
- [ ] Wróg w promieniu tarczy dostaje wektor odpychu od gracza i traci HP aż do eliminacji.
- [ ] Pulse (Spacja) wyraźnie zwiększa odpych i respektuje cooldown.
- [ ] Eliminacja Virusa dodaje punkty; licznik widoczny na HUD.
- [ ] Osiągnięcie 100 pkt kończy rundę jako wygrana; kontakt zabójczy kończy jako porażka.
- [ ] Trafienia dają screen shake + flash; tło to scrollująca siatka neon ze scanline.
- [ ] Ekran końcowy pokazuje wynik, działa „Zagraj jeszcze raz" i przycisk YT otwiera URL w nowej karcie.

---

## Phase 2: Życia, kara za śmierć, limit czasu i stany końcowe

**User stories**: 16, 17, 18, 19, 20, 21, 37

### What to build

Pełny model przebiegu rundy (RunController) wpięty w rozgrywkę. Gracz ma 3 życia; każde życie to pełne HP 100, w pełni odnawiane po respawnie. Śmierć kosztuje punkty (−15) i resetuje combo, ale nie zmienia czasu; dopiero utrata 3. życia kończy grę. Niezależnie od żyć runda kończy się po przekroczeniu 6:30. Ekran końcowy rozróżnia trzy powody końca (wygrana / koniec żyć / czas) i pokazuje wynik oraz czas. HUD prezentuje pasek HP i licznik punktów z progresem do 100 w sposób wizualnie nie do pomylenia, plus upływający czas.

### Acceptance criteria

- [ ] Gracz ma 3 życia; respawn przywraca HP do 100 i odejmuje 15 pkt oraz resetuje combo.
- [ ] Respawn nie zmienia pozostałego czasu.
- [ ] Utrata 3. życia kończy grę ze stanem „death".
- [ ] Przekroczenie 6:30 bez 100 pkt kończy grę ze stanem „timeout".
- [ ] Ekran końcowy pokazuje poprawny powód końca (win/death/timeout), wynik i czas.
- [ ] HUD wyraźnie odróżnia pasek HP od licznika celu 100; czas jest widoczny.
- [ ] Testy jednostkowe RunController pokrywają wszystkie trzy stany końcowe i poprawny powód.

---

## Phase 3: Roster wrogów, fale i głębia scoringu

**User stories**: 6, 8, 9, 10, 11, 14

### What to build

Wprowadzenie zróżnicowanych wrogów i napędu trudności. SpawnSystem czyta definicje fal z danych (`waves.json`) i spawnuje przez pooling. Dochodzą Trojan (wolny, większy, okresowa szarża), Worm (ruch sinusoidalny) i Spyware (strzela pakietami). DifficultyCurve skaluje HP/prędkość/częstotliwość spawnu z czasem i numerem fali. ScoreSystem zyskuje pełne combo (okno 2 s, mnożnik do ×3) i bonus za przejście fali. Punktacja zgodna z tabelą (Virus 10, Trojan 20, Worm/Spyware 15).

### Acceptance criteria

- [ ] Każdy typ wroga ma odrębne, rozpoznawalne zachowanie (prosty / szarża / sinus / strzał).
- [ ] Fale spawnują się zgodnie z danymi; pooling zapobiega spadkom płynności.
- [ ] Trudność rośnie z czasem/falą (HP, prędkość lub częstotliwość spawnu).
- [ ] Combo rośnie przy zabójstwach w oknie 2 s, nie przekracza ×3 i resetuje się po przerwie.
- [ ] Przejście fali daje bonus punktowy.
- [ ] Testy jednostkowe ScoreSystem pokrywają punkty per typ, combo/mnożnik i karę za śmierć.

---

## Phase 4: Power-upy (w tym strzał)

**User stories**: 22, 23, 24, 25, 26

### What to build

System power-upów wpięty w rozgrywkę: wrogowie z szansą ~12% upuszczają power-up, który gracz zbiera. PacketStream włącza chwilowy auto-fire w przód (jedyny tryb strzału w grze). Immunity daje chwilową nieśmiertelność z aurą, bez konfliktu z i-frames. ShieldBoost **znacząco powiększa bazowo małą tarczę** (większy promień/łuk) i podwaja jej obrażenia — to kluczowy bonus, bo bazowa tarcza jest celowo mała. FirewallRepair przywraca HP. Każdy buff ma własny timer i czytelną sygnalizację.

### Acceptance criteria

- [ ] Wrogowie upuszczają power-upy z deklarowaną szansą; gracz je zbiera.
- [ ] PacketStream daje czasowy auto-fire; poza nim brak domyślnego strzału.
- [ ] Immunity chroni przez swój czas i nie koliduje z i-frames po respawnie.
- [ ] ShieldBoost zwiększa promień i obrażenia tarczy na czas trwania.
- [ ] FirewallRepair przywraca HP.
- [ ] Każdy power-up ma widoczną sygnalizację i poprawnie wygasa.

---

## Phase 5: Mini-boss

**User stories**: 12

### What to build

Po osiągnięciu 90 pkt na planszę wchodzi mini-boss, lecący równolegle do zwykłych spawnów (zwykli wrogowie nadal się pojawiają). Boss ma własny, mały pasek HP i wzorzec ruchu/ataku; jest do minięcia (gracz może dobić 100 pkt bez niego), a jego pokonanie daje bonus punktowy.

### Acceptance criteria

- [ ] Mini-boss pojawia się dokładnie po przekroczeniu 90 pkt.
- [ ] Zwykli wrogowie spawnują się dalej równolegle do bossa.
- [ ] Boss ma własny widoczny pasek HP.
- [ ] Gracz może wygrać (100 pkt) ignorując bossa.
- [ ] Pokonanie bossa dodaje bonus punktowy.

---

## Phase 6: Audio, leaderboard, menu i QoL

**User stories**: 27, 28, 29, 32, 33, 34, 35, 36, 38

### What to build

Domknięcie produktu i celu konwersji. AudioSystem odtwarza utwór „Firewall" w pętli przez całą rozgrywkę (nigdy nieucinany przy wygranej/śmierci); klawisz M wycisza z zapisem stanu w localStorage; brak pliku mp3 nie blokuje gry (działa wyciszona + ostrzeżenie w konsoli). Leaderboard zapisuje wyniki w localStorage i klasyfikuje: wygranych po czasie (szybciej = wyżej), timeouty po punktach. Menu pokazuje HIGH SCORE i START. `YOUTUBE_URL` gotowy do podmiany. Dochodzą: ostrzeżenie dla urządzeń mobilnych („użyj klawiatury") i pauza (P).

### Acceptance criteria

- [ ] Muzyka leci w pętli i nie urywa się przy żadnym stanie końcowym.
- [ ] M wycisza/odcisza; stan przeżywa reload.
- [ ] Brak pliku mp3 → gra działa wyciszona z ostrzeżeniem w konsoli (bez crasha).
- [ ] Leaderboard: wygrani sortowani po czasie rosnąco, timeouty po punktach malejąco; dane przeżywają reload.
- [ ] Menu pokazuje HIGH SCORE i START.
- [ ] Na urządzeniu mobilnym pojawia się komunikat o klawiaturze; pauza (P) zatrzymuje i wznawia grę.
- [ ] Testy jednostkowe Leaderboard pokrywają oba tryby sortowania i pusty/uszkodzony localStorage.

---

## Kolejność i uwagi

- Fazy 1–2 dają w pełni grywalną, „przegrywalną" pętlę; reszta dokłada szerokość.
- **Audio (Faza 6)** można przesunąć wcześniej (Faza 1/2), bo to niezależny moduł, a utwór jest celem produktu — decyzja przy starcie implementacji.
- Implementacja przez agenta `shmup-expert` (`.claude/agents/shmup-expert.md`), który ma wpisane wszystkie decyzje.
