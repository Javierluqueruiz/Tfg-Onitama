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