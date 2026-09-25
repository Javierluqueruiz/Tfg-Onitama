# Experimento: calibración de la IA heurística (FEAT-14)

## Propósito

Este experimento justifica una decisión de diseño de la FEAT-14: **añadir la detección de amenaza al evaluador heurístico** (`HeuristicEvaluator`, término `opponentThreat`). Sin ella, la IA
no puede tener niveles de dificultad reales. El script que lo reproduce es `aiCalibration.ts`.

## Método

- Partidas completas con el motor real (`GameEngine`), jugando la IA de producción (`AiPlayer`).
- Límite de 200 jugadas por partida (ninguna lo alcanzó, 0% "sin terminar").
- Cada partida alterna los colores, para no favorecer a ningún bando.
- La configuración **SIN detección** es exactamente la misma IA con el peso `threat` a 0.
- El rival `random` juega jugadas legales al azar, pero **siempre escoge una victoria inmediata si la tiene**. Este detalle es crucial para castigar los errores de la IA.
- "Blunder" = jugada tras la cual el rival dispone de un movimiento que le permite ganar al instante. Se mide con código independiente del evaluador.

## Cómo reproducirlo

Desde `backend/`:

```bash
npm run experiment:ai -- 1000
```

Con 100 partidas tarda menos de un segundo; con 1000, unos 5s.

## Resultados (1000 partidas por enfrentamiento)

Ejecución de referencia sobre el código del commit `498cad0`.

### 1. Blunders de la IA difícil contra un rival aleatorio

| Configuración | Jugadas de la IA | Dejan victoria inmediata al rival | % |
|---|---|---|---|
| SIN detección de amenaza | 3108 | 632 | 20.3% |
| CON detección de amenaza | 4814 | 27 | 0.6 % |

### 2. Escalera de dificultad de la IA


**SIN detección de amenaza**

| Enfrentamiento (A vs B) | Gana A | Gana B | Sin terminar |
|---|---|---|---|
| hard vs medium | 47.7% | 52.3% | 0.0% |
| medium vs easy | 39.8% | 60.2% | 0.0% |
| hard vs easy | 38.7% | 61.3% | 0.0% |
| hard vs random | 36.2% | 63.8% | 0.0% |
| medium vs random | 40.6% | 59.4% | 0.0% |
| easy vs random | 47.4% | 52.6% | 0.0% |

**CON detección de amenaza**

| Enfrentamiento (A vs B) | Gana A | Gana B | Sin terminar |
|---|---|---|---|
| hard vs medium | 76.7% | 23.3% | 0.0% |
| medium vs easy | 76.4% | 23.6% | 0.0% |
| hard vs easy | 96.6% | 3.4% | 0.0% |
| hard vs random | 96.0% | 4.0% | 0.0% |
| medium vs random | 79.1% | 20.9% | 0.0% |
| easy vs random | 55.0% | 45.0% | 0.0% |

## Interpretación

- **Sin detección, la IA comete un blunder de cada cinco jugadas** (20,3%), y en la práctica totalidad de los casos existía una alternativa segura. Con la detección baja a menos del 1%.
- **Sin detección, la escalera de dificultad está invertida:** el nivel difícil pierde contra medio y el fácil; incluso un jugador aleatorio le gana en torno al 64% de las partidas. El "ruido" de los niveles no debilita a una IA que ya se autosabotea.
- **Con detección, hay una escalera bien definida:** difícil supera a medio (76%), el medio al fácil (76%) y el difícil casi siempre gana al azar (96%).
- 
- La detección es una **característica estática de la posición**, como la movilidad. No recorre el árbol de jugadas: el Minimax de FEAT-15 sí razonará sobre secuencias de jugadas.


## Limitaciones

- **Sin semilla aleatoria:** los repartos de cartas y las jugadas al azar cambian en cada ejecución. Dos ejecuciones de 1000 partidas difirieron hasta 4,3 puntos porcentuales (p. ej. "hard vs random SIN
  detección": 36,2 % y 31,9 %). Las conclusiones (orden de la escalera, ausencia o presencia de ella) no
  cambian, pero no deben citarse los decimales como exactos.

- Los rivales son **artificiales**: la escalera se ha medido entre versiones de la propia IA y contra un jugador aleatorio, no contra personas. Un humano castigará errores que el azar no ve.
- El nivel `easy` apenas supera al azar que aprovecha victorias (53 %): es casi aleatorio. Los valores de ε (`DIFFICULTY_EPSILON`: 0 / 0,25 / 0,85) están sin afinar y se ajustarán jugando.
- El script depende de la API de `AiPlayer` y no forma parte del build ni del CI (solo del lint): si esa API cambia, hay que actualizarlo.

# Experimento: eficiencia de la búsqueda (FEAT-15, Sub-15.2)

## Propósito

Cuantificar cuánto trabajo ahorran la poda alfa-beta y la ordenación de los movimientos respecto a Minimax puro. Las tres variantes son 
**exactamente la misma deicisión** (lo comprueban los tests de `MinimaxPlayer.test.ts`); solo cambia el coste. El script que lo reproduce es
`searchBenchmark.ts`.

## Método

- 20 posiciones de medio juego, generadas jugando entre 4 y 12 jugadas al azar desde el inicio de la partida (sin partida terminada ni descarte pendiente).
- Las tres variantes se miden con **las mismas posiciones**.
- "Nodos" es el número de veces que se invoca la función de búsqueda (`stats.nodes`); la raíz no cuenta. Las evaluaciones extra que cuesta ordenar no se cuentan como nodos, pero sí se contemplan en los milisegundos.
- Cada celda es la media por decisión.
- Cada variante se mide hasta una profundidad máxima (Minimax puro, 4; alfa-beta, 5; alfa-beta ordenada, 6): de lo contrario, el script tardaría demasiado en ejecutarse y no sería viable.

## Cómo reproducirlo

Desde `backend/`:

```bash
npm run experiment:search --20
```

Con 20 posiciones tarda unos 25 segundos aproximadamente.

## Resultados (20 posiciones)

Ejecución de referencia sobre el código del commit `0b38588`.

# Eficiencia de la búsqueda (20 posiciones de medio juego aleatorias, media por decisión)

| Profundidad | Minimax puro            | Alfa-beta               | Alfa-beta + ordenación  |
|-------------|-------------------------|-------------------------|-------------------------|
| 2           | 241 nodos · 4,5 ms      | 126 nodos · 0,7 ms      | 82 nodos · 0,7 ms       |
| 3           | 3.592 nodos · 14,4 ms   | 1.128 nodos · 5,0 ms    | 485 nodos · 3,1 ms      |
| 4           | 56.106 nodos · 218,7 ms | 6.754 nodos · 33,7 ms   | 1.963 nodos · 14,4 ms   |
| 5           | no medido               | 54.233 nodos · 250,4 ms | 14.024 nodos · 95,2 ms  |
| 6           | no medido               | no medido               | 97.933 nodos · 600,4 ms |

Tiempo total: 24.826s

- A profundidad 4, la poda reduce 8,3 veces los nodos y 6,5 veces el tiempo; con ordenación, 28,6 y 15,2 veces.
- A ~220 ms, Minimax puro llega a profundidad 4; alfa-beta llega a profundidad 5 en 95 m y a profundidad 6 en 600 ms.

## Limitaciones

- Las posiciones son aleatorias y no hay semilla: dos ejecuciones dan cifras algo distintas. La proporción de nodos es más estable que la
del tiempo.
- Son **medias**. La profundidad 6 varía mucho entre posiciones (las de muchas jugadas legales dominan la media): en otra muestra de 8 posiciones llegó a tardar
varios segundos de media. Para los niveles de dificultad habrá que tener en cuenta el peor caso, no la media (Sub-15.3).

# Experimentos: calibración del oponente Minimax (FEAT-15, Sub-15.3)

## Propósito

Responder con datos a las tres preguntas que quedaron abiertas al construir el oponente Minimax, y con ellas decidir sus niveles de dificultad:

1. **`leaf`:** ¿qué evaluador conviene en las hojas del árbol de búsqueda? (el Memorando 0034 dejó abierta la cuestión de si la integración de la amenaza seguía siendo
válida al construir un árbol).
2. **`versus`:** ¿cuánto mejor juega Minimax en comparación con la heurística de la FEAT-14, usando el mismo evaluador? Es el resultado central del Objetivo 3.
3. **`ladder`:** ¿gana cada profundidad a la anterior, y cuánto tiempo tarda cada una en partidas reales? 
4. **`discard`:** ¿con qué frecuencia se produce un descarte, y hay diferencia entre el modo de descarte de la heurística y el de Minimax?  

El script que los reproduce es `minimaxCalibration.ts`.

## Método

- Partidas completas con el motor real (`GameEngine`), colores alternados y un límite de 200 jugadas por partida.
- Bots: la heurística de la FEAT-14 (`AiPlayer` con sus tres dificultades) y el oponente Minimax (`MinimaxPlayer`, alfa-beta con ordenación).
- Tres variantes del evaluador de hoja en `leaf`: **A**, el evaluador tal cual (`evaluateWithTurn: false`); **B**, el mismo con el peso
de la amenaza a 0; **C**, el evaluador con la amenaza que sabe a quién le toca jugar (`evaluateWithTurn: true`).
- En `versus` y `ladder`, Minimax usa el evaluador de hoja **C**. 
- Los tiempos de `ladder` son los de las decisiones de la profundidad máxima de cada pareja, medidas en partidas reales, con la CPU sin carga.

## Cómo reproducirlo

Desde `backend/`:

```bash
npm run experiment:minimax -- leaf 100
npm run experiment:minimax -- versus 200
npm run experiment:minimax -- ladder 200
npm run experiment:minimax -- discard 500
```
  
Tardan unos 28, 9, 6 y unos 8 minutos respectivamente. `ladder` debe ejecutarse solo, para no falsear los tiempos de decisión.

## Resultados

Ejecuciones de referencia sobre el código del commit `bb4f240`.

### 1. Evaluador de hoja (100 partidas por enfrentamiento)

| Profundidad | A vs Heurística (difícil) | B vs Heurística (difícil) | C vs Heurística (difícil) | A vs B: gana A | C vs A: gana C | C vs B: gana C |
|-------------|---------------------------|---------------------------|---------------------------|----------------|----------------|----------------|
| 1           | 56,0%                     | 7,0%                      | 46,0%                     | 98,0%          | 53,0%          | 97,0%          |
| 2           | 39,0%                     | 65,0%                     | 87,0%                     | 25,0%          | 81,0%          | 81,0%          |
| 3           | 100,0%                    | 83,0%                     | 98,0%                     | 91,0%          | 60,0%          | 85,0%          |
| 4           | 95,0%                     | 95,0%                     | 98,0%                     | 19,0%          | 86,0%          | 86,0%          |
| 5           | 100,0%                    | 98,0%                     | 100,0%                    | 87,0%          | 48,0%          | 85,0%          |

- **En profundidades impares, C es equivalente a A** (53, 60 y 48% entre ellas): en una hoja impar le toca mover al rival, que es lo que A ya tiene en cuenta.
- **En profundidades pares, C es muy superior**: a profundidad 2 gana el 
87% de las partidas a la heurística difícil (A, 39% y B, 65%) y el 81% 
a cada una de las otras variantes; a profundidad 4 gana el 86% a las dos.
- **A gana a B en las impares y B gana a A en las pares**: es el efecto
par/impar que ya se observó en el Memorando 0034. La variante C lo resuelve, por lo que se convierte en el evaluador por defecto de Minimax.

### 2. Minimax vs heurística (200 partidas por enfrentamiento)

| Victorias de...          | Heurística (easy) | Heurística (medium) | Heurística (hard) |
|-------------------------|-------------------|---------------------|-------------------|
| Minimax (profundidad 2) | 97,0%             | 96,0%               | 91,5%             |
| Minimax (profundidad 3) | 99,5%             | 99,5%               | 96,5%             |
| Minimax (profundidad 4) | 99,5%             | 99,0%               | 99,5%             |
| Minimax (profundidad 5) | 100,0%            | 100,0%              | 100,0%            |

- Con el mismo evaluador, se observa la mejora clara al aumentar la profundidad de búsqueda: a profundidad 2 ya se gana el 91,5% de las partidas a la heurística difícil; a profundidad 5 se gana el 100% de las partidas a todos los niveles.

### 3. Escalera de dificultad de Minimax y coste (200 partidas por enfrentamiento)

| Profundidad             | Gana a la anterior | Pierde contra la anterior | Mediana (ms) | Percentil 95 (ms) | Máximo (ms) |
|-------------------------|--------------------|---------------------------|--------------|-------------------|-------------|
| Minimax (profundidad 2) | 88,5%              | 11,5%                     | 0,4          | 1,3               | 24,3        |
| Minimax (profundidad 3) | 86,5%              | 13,5%                     | 3,0          | 8,3               | 26,5        |
| Minimax (profundidad 4) | 81,0%              | 19,0%                     | 10,3         | 34,3              | 108,2       |
| Minimax (profundidad 5) | 83,5%              | 15,5%                     | 47,3         | 167,5             | 2.372,2     |

- **Cada profundidad gana a la anterior** (entre el 81,0% y el 88,5%): la escalera de dificultad está bien definida.
- **La profundidad 5 no es viable como nivel:** su percentil 95 es aceptable (167,5 ms), pero su máximo es de 2,4 s, muy por encima
del límite de 300 ms que se ha fijado para no bloquear el servidor (la búsqueda es síncrona y bloquea el hilo principal).

### 4. Descarte forzoso (500 partidas)

- **Frecuencia de descarte**

| Enfrentamiento                                     | Partidas | Partidas con descartes | Descartes totales |
|----------------------------------------------------|----------|------------------------|-------------------|
| Minimax (profundidad 3) vs Heurística (easy)       | 500      | 0                      | 0                 |
| Minimax (profundidad 3) vs Heurística (hard)       | 500      | 0                      | 0                 |
| Minimax (profundidad 3) vs Minimax (profundidad 3) | 500      | 0                      | 0                 |
| Minimax (profundidad 4) vs Minimax (profundidad 2) | 500      | 0                      | 0                 |

- **Comparación de modos de descarte** 

| Profundidad             | Gana "search" | Gana "heuristic" | Partidas con descartes |
|-------------------------|---------------|------------------|------------------------|
| Minimax (profundidad 2) | 53,0%         | 46,8%            | 0                      |
| Minimax (profundidad 3) | 46,6%         | 52,8%            | 0                      |
| Minimax (profundidad 4) | 50,0%         | 49,4%            | 0                      |

- **En 3.500 partidas no ocurrió ningún descarte.** Con 95% de confianza, su frecuencia real es menor que 3/3500, es decir, **inferior a una de cada 1.100 partidas** (regla de tres). Una búsqueda previa sobre 30.000 partidas al azar 
tampoco dio descartes.
- **Los dos modos de descarte juegan igual, porque nunca se llega a un descarte:** las diferencias (47 a 53%) son ruido del desempate aleatorio, dentro del margen de error (±4,4 puntos con 500 partidas).
- El descarte solo aparece en situaciones muy concretas. Ambos modos siguen probados con posiciones personalizadas en `MinimaxPlayer.test.ts`.

## Decisión: niveles de dificultad de Minimax

|  Nivel  | Profundidad | Máximo por decisión |
|---------|-------------|---------------------|
| Fácil   | 2           | 24 ms               |
| Medio   | 3           | 27 ms               |
| Difícil | 4           | 108 ms              |

Sin ruido aleatorio: la dificultad la da solo la profundidad de búsqueda. La profundidad 5 se descarta y se documenta como deuda técnica: usarla exigiría
un cambio de arquitectura para que la búsqueda sea asíncrona y no bloquee el hilo principal.

El modo de descarte por defecto sigue siendo 'search' (explora ambas cartas), por ser el más completo y fiel al juego real; en la práctica es irrelevante.

## Limitaciones

- Las partidas no tienen semilla: dos ejecuciones dan cifras algo distintas. Con 100 partidas el margen de error ronda los ±10 puntos porcentuales (95%); con
200 baja a ±7 puntos. Solo las diferencias grandes son concluyentes.
- Los tiempos son de un solo equipo y los máximos dependen de una única
decisión atípica, por lo que varían más que la mediana o el percentil 95.
- Los rivales son siempre otros bots: no se mide la fuerza de Minimax contra jugadores humanos. La escalera de dificultad puede variar frente a personas.
- En `ladder`, un 1% de las partidas de profundidad 5 vs 4 no llegaron a terminarse: el juego no tiene reglas de repetición y dos bots pueden entrar en bucles.
- Todas las variantes comparten el mismo evaluador salvo en `leaf`: `versus` y `ladder` miden cuánto se mira, no cómo se puntúa.
- La frecuencia de descarte solo se ha medido con los bots del experimento, no con jugadores humanos.