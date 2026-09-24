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

Ejecución de referencia sobre el código del commit `<0b38588>`.

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