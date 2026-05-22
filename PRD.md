# PRD — Firewall (retro grid shmup / promka utworu)

## Problem Statement

Mam utwór muzyczny **„Firewall" (3:15)** i chcę, żeby ludzie go usłyszeli i kliknęli w niego na YouTube. Sam link do piosenki nikogo nie przyciąga — potrzebuję czegoś, co zatrzyma człowieka na kilka minut, da mu frajdę, puści utwór w tle jako podkład, a na końcu naturalnie skieruje go do tracka na YT. Klasyczna „posłuchaj mojej piosenki" nie działa; interaktywna, krótka gra w klimacie utworu — może.

## Solution

Krótka (2–6 min) przeglądarkowa gra arcade **shoot-'em-up** w estetyce retro-neon, z motywem cyberbezpieczeństwa, w której utwór „Firewall" leci jako podkład (zapętlony, nigdy nieucinany). Gracz pilotuje **statek-tarczę** broniący sieci przed malware — rdzeniem nie jest strzelanie, lecz **odpychanie wrogów polem tarczy** (strzał to power-up, nie domyślny tryb). Runda kończy się wygraną (100 pkt), utratą 3 żyć albo limitem czasu (6:30 = 2 pętle utworu). Na ekranie końcowym zawsze jest wynik + **przycisk „Obejrzyj na YouTube"** prowadzący do utworu. Gra jest środkiem; muzyka jest celem.

## User Stories

### Rdzeń rozgrywki
1. Jako gracz chcę sterować statkiem-tarczą klawiaturą (← → / A D w poziomie, ↑ ↓ / W S w dozwolonej dolnej strefie), aby unikać i odpychać wrogów.
2. Jako gracz chcę, aby moja tarcza była aktywna domyślnie i odpychała wrogów w jej promieniu, aby obrona była główną mechaniką bez konieczności strzelania.
3. Jako gracz chcę nacisnąć Spację, aby wywołać „Pulse" (2× siła odpychu, cooldown ~1.5 s), aby ratować się w trudnej sytuacji.
4. Jako gracz chcę, aby wrogowie w polu tarczy dostawali obrażenia i wektor odpychu, aby dało się ich eliminować bez broni.
5. Jako gracz chcę widzieć wyraźną informację zwrotną przy trafieniu (screen shake, flash, particles), aby gra była „soczysta".

### Wrogowie (malware)
6. Jako gracz chcę mierzyć się z różnymi typami malware (Virus, Trojan, Worm, Spyware), z których każdy ma inne zachowanie, aby rozgrywka była zróżnicowana.
7. Jako gracz chcę, aby Virus leciał prosto w dół z małym HP, jako podstawowy, łatwy cel.
8. Jako gracz chcę, aby Trojan był wolniejszy, większy i raz na jakiś czas „szarżował" w moją stronę, aby stanowił większe zagrożenie.
9. Jako gracz chcę, aby Worm poruszał się sinusoidalnie, aby trudniej było go trafić tarczą.
10. Jako gracz chcę, aby Spyware strzelał małymi pakietami-pociskami, aby zmuszał mnie do uników.
11. Jako gracz chcę, aby trudność rosła z czasem i postępem (więcej/szybsi/twardsi wrogowie), aby końcówka była wymagająca.
12. Jako gracz chcę napotkać mini-bossa po osiągnięciu 90 pkt, lecącego równolegle do zwykłych wrogów (bonus punktowy, możliwy do minięcia), aby końcówka miała akcent.

### Punktacja, życia, koniec rundy
13. Jako gracz chcę zdobywać punkty za eliminację wrogów (Virus 10, Trojan 20, Worm/Spyware 15), aby zbliżać się do celu 100 pkt.
14. Jako gracz chcę budować combo (kolejne zabójstwa w 2 s, mnożnik do ×3), aby nagradzana była agresywna, sprawna gra.
15. Jako gracz chcę wygrać rundę po osiągnięciu **100 pkt**, aby mieć jasny cel.
16. Jako dobry gracz chcę móc dobić 100 pkt **poniżej 3 minut**, aby umiejętność była nagradzana szybszym czasem.
17. Jako gracz chcę mieć **3 życia**, każde z pełnym HP 100, aby błąd nie kończył od razu rundy.
18. Jako gracz chcę, aby śmierć kosztowała mnie **punkty i reset combo** (a nie czas), aby respawn miał realną stawkę.
19. Jako gracz chcę, aby po stracie 3. życia gra definitywnie się kończyła, aby porażka była możliwa.
20. Jako gracz chcę, aby runda kończyła się także po przekroczeniu **6:30** (2 pętle utworu), aby sesja nie ciągnęła się w nieskończoność.
21. Jako gracz chcę widzieć na ekranie końcowym powód zakończenia (wygrana / koniec żyć / czas) oraz mój wynik i czas.

### Power-upy
22. Jako gracz chcę, aby wrogowie czasem upuszczali power-upy, aby dawało to dodatkowy cel taktyczny.
23. Jako gracz chcę power-upu „PacketStream" (chwilowy auto-fire w przód), aby na moment dostać tryb ofensywny.
24. Jako gracz chcę power-upu „Immunity" (chwilowa nieśmiertelność z aurą), aby przebić się przez tłok.
25. Jako gracz chcę power-upu „ShieldBoost" (większy promień + 2× obrażenia tarczy), aby zwiększyć skuteczność rdzenia.
26. Jako gracz chcę power-upu „FirewallRepair" (+HP / przywrócenie), aby odzyskać przewagę.

### Muzyka i audio
27. Jako autor chcę, aby utwór „Firewall" leciał jako podkład przez całą rozgrywkę, zapętlony, nigdy nieucinany, aby gracz usłyszał muzykę niezależnie od stylu gry.
28. Jako gracz chcę móc wyciszyć muzykę klawiszem M, a ustawienie ma być zapamiętane między sesjami.
29. Jako autor chcę, aby gra działała nawet bez pliku mp3 (wyciszona, z ostrzeżeniem w konsoli), aby brak assetu nie blokował dewelopmentu/deployu.

### Ekran końcowy i konwersja na YouTube
30. Jako autor chcę, aby na każdym ekranie końcowym był widoczny przycisk „Obejrzyj na YouTube" otwierający utwór w nowej karcie, aby skierować gracza do tracka.
31. Jako gracz chcę móc zagrać jeszcze raz jednym kliknięciem/Enterem, aby replay był bezfrykcyjny.
32. Jako autor chcę móc podmienić URL YouTube w jednym miejscu w konfiguracji przed publikacją.

### Leaderboard
33. Jako gracz chcę, aby moje najlepsze wyniki zapisywały się lokalnie (localStorage), aby móc się ścigać sam ze sobą.
34. Jako gracz, który wygrał, chcę być sklasyfikowany według **czasu** (szybciej = wyżej), aby nagradzana była biegłość.
35. Jako gracz, któremu skończył się czas, chcę być sklasyfikowany według **punktów** (jak blisko 100 dobiłem), aby porażka też miała miarę.

### Menu, HUD, jakość życia
36. Jako gracz chcę ekranu startowego (START, HIGH SCORE), aby wejść w grę i zobaczyć rekordy.
37. Jako gracz chcę widzieć na HUD pasek HP, licznik punktów z progresem do 100 oraz upływający czas — przy czym HP=100 i cel=100 mają być **wizualnie wyraźnie różne**, aby ich nie mylić.
38. Jako gracz na urządzeniu mobilnym chcę zobaczyć komunikat „użyj klawiatury", aby wiedzieć, że v1 jest pod klawiaturę.
39. Jako gracz chcę, aby gra zaczynała się od krótkiego ekranu ładowania (preload assetów), aby start był płynny.

### Estetyka
40. Jako gracz chcę animowanej, neonowej siatki perspektywicznej w tle i scanline overlay, aby poczuć klimat retro/cyber.
41. Jako gracz chcę, aby wszystkie postacie były czytelnymi kształtami geometrycznymi w spójnej palecie, aby gra wyglądała stylowo bez zewnętrznych assetów.

## Implementation Decisions

### Charakter produktu
- Gra jest **promką utworu „Firewall" (3:15)**; sukces = gracz dochodzi do ekranu końcowego i klika link do YT. Każda decyzja projektowa służy temu celowi.
- Sesja krótka (cel ~2 min do 100 pkt dla typowego gracza, <3 min dla dobrego), twardy limit 6:30. Nie endless.

### Stack i platforma (zadeklarowane przez stakeholdera)
- **Vite + TypeScript + Phaser 3**, build statyczny.
- **Hosting: Cloudflare Pages** (statyczny `npm run build`). MVP **nie wymaga backendu ani bazy** — leaderboard w localStorage, muzyka jako asset statyczny, link YT przez `window.open`.
- **Gdyby backend był potrzebny** (poza zakresem MVP): **Hono** na Cloudflare Workers + baza **Neon**. Dotyczy wyłącznie ewentualnego globalnego leaderboardu lub pomiaru konwersji (patrz Out of Scope / Further Notes).
- Przeglądarka, **tylko klawiatura** w v1.
- Rozdzielczość logiczna 480×800 (portrait), `Scale.FIT`.
- Testy czystej logiki: **Vitest** (bez renderu Phasera).

### Architektura — moduły głębokie (czysta logika, testowalne niezależnie)
- **ScoreSystem** — punkty za typ wroga, okno combo (2 s) i mnożnik (do ×3), bonus za boss, kara za śmierć (−punkty + reset combo). Interfejs: dodanie zabójstwa, zdarzenie śmierci, odczyt score/combo.
- **RunController** — stan rundy: 3 życia, HP 100 na życie (pełny restore na respawnie), upływ czasu, wyznaczenie stanu końcowego (win @100 / death @3 życia / timeout @6:30) i powodu zakończenia.
- **DifficultyCurve** — funkcja mnożnika trudności z czasu/fali (HP, prędkość, częstotliwość spawnu).
- **Leaderboard** — zapis/odczyt wyników w localStorage; ranking: wygrani po czasie (rosnąco), timeouty po punktach (malejąco).

### Architektura — moduły sprzężone z Phaserem (weryfikacja wizualna/manualna)
- **ShieldSystem** — odpych + obrażenia w promieniu, Pulse (Spacja, cooldown).
- **SpawnSystem** — data-driven z `waves.json`, korzysta z poolingu obiektów.
- **PowerUpSystem** — dropy (~12%), timery buffów, brak konfliktów z i-frames.
- **AudioSystem** — loop mp3, mute z persystencją w localStorage, graceful brak pliku.
- **HUD / RetroGridBackground** — render paska HP, licznika pkt + progresu, czasu, tła siatki i scanline.

### Sceny
- Boot (preload) → Menu (START/HIGH SCORE) → Game (+ HUD overlay) → End (wynik + powód + retry + link YT).

### Decyzje liczbowe (defaulty w konfiguracji, do tuningu w playteście)
- Wygrana: 100 pkt. Limit: 6:30 (2× pętla 3:15). Życia: 3. HP/życie: 100.
- Punkty: Virus 10, Trojan 20, Worm/Spyware 15, przejście fali +25, mini-boss +30.
- Combo: okno 2 s, mnożnik do ×3.
- Kara za śmierć: −15 pkt + reset combo (czas bez zmian).
- Mini-boss: wejście przy 90 pkt, równolegle do zwykłych spawnów, własny mały pasek HP (~40 HP), do minięcia.
- Power-upy: drop ~12%; PacketStream 8 s, Immunity 5 s, ShieldBoost 10 s, FirewallRepair natychmiast.
- Gracz: prędkość ~280 px/s, shieldRadius ~70 px, pushForce ~320, i-frames ~1.5 s.

### Audio i konwersja
- Jeden plik `firewall.mp3` (3:15) w `public/audio/`; loop w grze, mute na M (persist). Bez pliku — gra działa wyciszona + ostrzeżenie w konsoli.
- URL YouTube jako pojedyncza stała w konfiguracji (placeholder do podmiany przed deployem); `window.open` z `rel=noopener`, nowa karta. Link tylko na ekranie końcowym — nigdy nie przerywa rozgrywki.

### Estetyka (brief obowiązujący)
- Tło `#0a0e17`, neon: cyan `#00f0ff`, magenta `#ff00aa`, ostrzegawczy żółty `#ffcc00`, „OK" zielony `#00ff88`.
- Postacie: proceduralne kształty geometryczne (Graphics → generateTexture), pixel font (Press Start 2P). Brak zewnętrznych assetów graficznych w MVP.
- Efekty: animowana siatka perspektywiczna, scanline overlay, screen shake przy trafieniu, flash przy power-upie.
- UI po polsku („START", „WYNIK", „KONIEC GRY").

### Zasady spójności (dla implementujących)
- Tarcza domyślna; strzał wyłącznie jako power-up — **nigdy** domyślny auto-fire.
- Nowi wrogowie = metafora malware (nazwa + zachowanie opisane w komentarzu).
- Bez zmiany motywu na generic space.
- Każda nowa mechanika musi przejść test „czy da się wygrać w ~2–4 min".

## Validation Strategy

### Moduły z twardymi kryteriami (testy jednostkowe Vitest)

**ScoreSystem**
- Zabicie wrogów daje punkty zgodne z tabelą (Virus 10, Trojan 20, Worm/Spyware 15).
- Combo: ≥2 zabójstwa w oknie 2 s podnoszą mnożnik; mnożnik nie przekracza ×3; przerwa >2 s resetuje combo.
- 10× Virus bez kar i bez combo = dokładnie próg wygranej (100) — sanity check balansu.
- `onDeath()` odejmuje 15 pkt (nie schodzi poniżej 0) i resetuje combo do bazy.
- Done: 100% gałęzi powyższych reguł pokryte testami, zielony przebieg.

**RunController**
- Osiągnięcie 100 pkt ustawia stan końcowy „win" i zapisuje czas.
- Trzecia śmierć (po wykorzystaniu 3 żyć) ustawia stan „death"; wcześniejsze śmierci tylko respawnują (HP→100), nie kończą.
- Przekroczenie 6:30 bez 100 pkt ustawia stan „timeout".
- Respawn nie modyfikuje pozostałego czasu (potwierdzenie decyzji „czas bez zmian").
- Done: każdy z trzech stanów końcowych i poprawny `endReason` pokryty testem.

**Leaderboard**
- Dwa wpisy „win" sortują się rosnąco po czasie (szybszy wyżej).
- Dwa wpisy „timeout" sortują się malejąco po punktach (więcej pkt wyżej).
- Wpisy przeżywają reload (poprawny zapis/odczyt z localStorage; brak danych = pusta lista, bez wyjątku).
- Done: powyższe pokryte testami; brak crasha przy pustym/uszkodzonym localStorage.

### Moduły weryfikowane manualnie / wizualnie
- **ShieldSystem:** wróg w promieniu jest odpychany (wektor od gracza) i traci HP; Pulse wyraźnie zwiększa odpych i respektuje cooldown.
- **SpawnSystem:** fale spawnują się zgodnie z `waves.json`; brak spadków FPS dzięki poolingowi (subiektywnie płynnie na typowym laptopie).
- **PowerUpSystem:** każdy power-up daje deklarowany efekt przez deklarowany czas; Immunity i i-frames nie kolidują.
- **AudioSystem:** muzyka leci w pętli i nie urywa się przy wygranej/śmierci; M wycisza i stan przeżywa reload; brak pliku → gra działa + log ostrzeżenia.
- **HUD:** pasek HP i licznik pkt są wizualnie nie do pomylenia; progres do 100 czytelny; czas widoczny.

### Walidacja całościowa (playtest)
- Typowy gracz dobija 100 pkt w ~90–150 s; dobry gracz <3 min; jeśli <90 s → rzadszy spawn, jeśli >3 min → więcej wrogów lub +pkt za Virus (tuning `waves.json`).
- Ścieżka konwersji działa: po każdym z 3 stanów końcowych przycisk YT otwiera poprawny URL w nowej karcie.
- Gra w pełni grywalna od Boot do End bez błędów w konsoli (poza opcjonalnym ostrzeżeniem o braku mp3).

## Out of Scope

- Sterowanie dotykowe / mobilne (v1 = tylko klawiatura; mobile dostaje jedynie komunikat).
- Tryb endless / długie sesje 20+ min.
- Rozbudowany system bossów (wiele faz, raidy, `bosses.json`) — w MVP tylko jeden mini-boss przy 90 pkt.
- Zewnętrzne assety graficzne / sprite sheety (wszystko proceduralne).
- Backend, konta, online/globalny leaderboard (tylko localStorage). Gdyby kiedyś wszedł — stack to Hono na CF Workers + Neon.
- Pomiar konwersji (ilu graczy doszło do końca / kliknęło YT) — wymagałby endpointu (Hono) + zapisu (Neon/D1/KV); poza MVP.
- Wiele utworów / playlist (jeden track „Firewall").
- Osadzanie wideo w grze (link do YT wyłącznie zewnętrzny, tylko na ekranie końcowym).
- Lokalizacja na inne języki (UI po polsku).

## Further Notes

- Plik `firewall.mp3` (3:15) dostarcza autor; do czasu dostarczenia placeholder + `.gitkeep`, gra działa wyciszona.
- `YOUTUBE_URL` to placeholder do podmiany na link do utworu przed publikacją.
- Repo nie jest jeszcze gitem ani nie ma remote — PRD zapisany lokalnie; do konwersji na GitHub issue po `git init` + konfiguracji `gh`.
- Istnieje agent `shmup-expert` (`.claude/agents/shmup-expert.md`) z wpisanymi wszystkimi powyższymi decyzjami — do implementacji faz.
- Rekomendowany następny krok: rozbicie na fazy/tracer-bullety (`/carve`) albo bezpośrednia implementacja Fazy 1 przez `shmup-expert`.
