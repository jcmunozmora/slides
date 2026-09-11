# slides — repositorio central de presentaciones

Todas las diapositivas de **Juan Carlos Muñoz-Mora** (Universidad EAFIT) en un solo lugar, con
una landing pública que las lista y permite abrirlas o descargarlas.

**Hub:** <https://jcmunozmora.github.io/slides/>

## Cómo funciona

| Pieza | Qué es |
|---|---|
| `slides.yml` | El manifiesto: título, fecha, tipo, evento y archivos de cada presentación. **Es la fuente de verdad.** |
| `index.html` | La landing. **Generada** — no se edita a mano; el siguiente build pisa el cambio. |
| `decks/<YYYY-MM>_<slug>/` | Una carpeta por presentación nueva, con su `index.html` y su `slides.pdf`. |
| `pdfs/`, archivos en la raíz | Presentaciones históricas. Se quedan donde están para no romper enlaces ya compartidos. |

Una entrada del manifiesto puede apuntar a un HTML y a un PDF a la vez: el hub muestra **Abrir**
para navegarlo y **PDF** para descargarlo. Es una sola presentación, no dos.

## Publicar una presentación

Desde Claude Code, con el skill `/slides`:

```
/slides ruta/al/deck.qmd
```

Renderiza si hace falta, copia el resultado a `decks/`, escribe la ficha, regenera el hub y pide
confirmación antes del push.

## Regenerar el hub a mano

```bash
python3 ~/.claude/commands/slides_assets/build_index.py .          # regenera index.html
python3 ~/.claude/commands/slides_assets/build_index.py . --seed   # + escribe las fichas que falten
python3 ~/.claude/commands/slides_assets/build_index.py . --check  # exit 1 si está desactualizado
```

El generador falla si una ficha apunta a un archivo inexistente: es la red contra enlaces rotos.

## Editar metadatos

Todo lo que se ve en el hub sale de `slides.yml`. Para mejorar un título, añadir el evento,
etiquetar o destacar una presentación, se edita ahí y se regenera.

- `featured: true` la sube a la sección **Destacadas**.
- `hidden: true` la saca del listado sin borrar el archivo, que sigue accesible por su URL.
