# El Tablero Regio

Mapa interactivo del dominio inmobiliario de Monterrey. Proyecto hobby, fan-made, sin fines comerciales ni afiliación con las empresas. Los territorios son una simulación, no propiedad real ni límites oficiales.

Publicado en [Railway](https://el-tablero-regio-production.up.railway.app/). Código en [GitHub](https://github.com/vazqua/el-tablero-regio).

## Arranque

Node.js 22.12 o posterior compatible y pnpm. También se pueden ejecutar los scripts con npm; el lockfile incluido corresponde a pnpm.

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm test:e2e
```

Vite muestra la dirección local disponible. Abrir `/?edit=1` para editar, exclusivamente con el servidor de desarrollo. Las pruebas de navegador usan Microsoft Edge instalado y levantan servidores aislados en puertos libres, que se cierran al terminar. Ejecutar el build antes de esas pruebas.

## Datos

La aplicación consume exclusivamente los archivos proporcionados por el usuario:

- `src/data/desarrollos.json`
- `src/data/desarrolladoras.json`

El conjunto actual contiene 84 desarrollos ubicados y 14 desarrolladoras. No se modificaron ni inventaron coordenadas. Las muestras sintéticas de las pruebas nunca se incorporan a los datos reales.

## Tablero

- Mapa desaturado, fronteras oscuras e iconos por tipo de desarrollo. Municipios y vialidades conservan las etiquetas del mapa base.
- Hover de territorios con empresa y porcentaje; clic para abrir el desarrollo más cercano de esa empresa. Los marcadores abren su propio desarrollo.
- Fichas de desarrollos y desarrolladoras enlazadas, búsqueda por nombre o municipio, ranking y leyenda.
- Alcance de 0.5 a 2.5 veces el radio base. La geometría se calcula en un Web Worker; los cambios rápidos conservan solo la solicitud más reciente. El mapa anterior permanece visible hasta recibir el resultado.
- Transición cruzada entre polígonos durante 320 ms; se respeta la preferencia de movimiento reducido. Las disputas son una superposición y no se contabilizan dos veces.
- Hasta 900 px de ancho, el ranking se abre como un panel desplazable desde el mapa. Las fichas permiten ampliar la lectura; en pantallas cortas usan automáticamente toda el área disponible. El alcance permanece visible con la ficha compacta y vuelve al cerrar la lectura ampliada. La orientación horizontal conserva todos los controles dentro de la pantalla.
- Macondo y Nunito se sirven localmente desde Fontsource con `display=swap`, sin peticiones a Google Fonts durante la carga. Sus licencias se distribuyen en `public/fonts/`. Iconos Lucide. Sin backend ni librerías de componentes.

`src/types.ts` define el esquema. `validarDatos` verifica campos, enumeraciones, IDs únicos, referencia a desarrolladora, colores, rangos y tipos numéricos. Un registro con cualquiera de las dos coordenadas nula queda pendiente y se lista en consola. Un registro mal formado impide cargar el mapa y muestra el error; no se descarta silenciosamente. La validación no verifica las afirmaciones de las descripciones ni el estado de construcción.

## Navegación y créditos

- React Router conserva el mapa en `/`, el catálogo en `/desarrolladoras` y los créditos en `/creditos`. El header permanece visible; las páginas tienen desplazamiento independiente.
- Cada tarjeta enlaza a `/?empresa=ID`. La empresa elegida conserva su color y los territorios y marcadores rivales se atenúan. Cerrar la ficha o pulsar Mapa elimina la selección. También se conserva `desarrollo=ID` al abrir una ficha individual. Las selecciones admiten recarga y navegación Atrás/Adelante.
- El alcance, el cálculo y las coordenadas editadas en memoria se comparten entre rutas. Recargar reinicia el alcance a 1 y restaura los JSON del repositorio.
- `src/data/proyecto.json` contiene el autor, David Vázquez Moreno, y sus perfiles: GitHub `@vazqua` y LinkedIn `@davidvazquezmore`. Créditos muestra su fotografía y enlaces HTTPS activos; un enlace ausente o inválido se presenta como no disponible.
- Créditos reproduce el campo `fuente` de cada desarrollo sin convertir referencias incompletas en enlaces inventados.

## Sistema visual

- `src/design/tokens.ts` es la fuente única de la paleta: las cinco familias completas y los diez alias semánticos. `tailwind.config.ts` las registra en `theme.extend.colors` y genera sus variables CSS. MapLibre consume los mismos alias desde TypeScript.
- Tailwind 3 se integra con PostCSS y sin Preflight para conservar los estilos funcionales del mapa. Los componentes usan alias semánticos, nunca tonos de las familias directamente. `color-scheme: light` permanece fijo.
- Macondo Regular 400 da carácter a la identidad, los titulares y las cifras de dominio. Nunito Bold organiza etiquetas y navegación; Nunito Regular lleva el texto y la interfaz. No se sintetiza negrita de Macondo.
- Los colores de las Casas siguen en `src/data/desarrolladoras.json`, separados de los tokens. `crown` identifica la corona de la marca y el distintivo del primer lugar de La Corona.
- `/estilo` muestra las muestras semánticas, la escala tipográfica y componentes. Se importa exclusivamente en desarrollo; no se incluye en el build público. La muestra de `crown` en esta guía es una referencia del token, no una segunda posición del ranking.
- Los paneles usan bordes de 2-3 px y sombras sin desenfoque. Las esquinas usan `corner-shape: bevel` donde existe soporte y esquinas rectas como alternativa. Las tarjetas llevan particiones diagonales.
- La interfaz usa Casas, Bastiones, Dominio, Tierras sin reclamar, Frontera en disputa y La Corona. Los nombres y descripciones originales de los JSON permanecen intactos.

## Geometría

`src/lib/territorios.ts` no usa DOM, React ni MapLibre. Exporta `calcularTerritorios(desarrollos, factorRadio)`, `RADIO_BASE`, `BBOX_METROPOLITANA` y `BUFFER_DISPUTA_METROS`.

- Radios en metros: hito 4000, grande 2500, mediano 1500, chico 800. El factor multiplica el radio, no pondera el Voronoi. Cero deja todo libre; negativos y valores no finitos se rechazan.
- Bounding box editable: oeste -100.85, sur 25.35, este -99.85, norte 26.10. Es una ventana de estudio aproximada, no un polígono administrativo. Su extensión influye en todos los porcentajes.
- D3 calcula Voronoi en una proyección local equirectangular en metros. Las celdas se convierten a lon/lat, con precisión submilimétrica en sus vértices, y se recortan con círculos geodésicos de Turf de 96 segmentos.
- Turf une las celdas de cada empresa. Hay una sola feature por empresa con área: Polygon si es continua, MultiPolygon si tiene islas. No se inventan conexiones entre territorios separados.
- El territorio libre es el bounding box menos la unión de todos los territorios.
- Se declara `polyclip-ts`, el motor que ya usa Turf, para ajustar su tolerancia numérica durante cada recorte. El ajuste se restablece inmediatamente, también ante errores; no hay estado de mapa ni cambios en los datos de entrada. La tolerancia de orientación al cuadrado es 1e-26 y evita picos casi colineales al encadenar uniones.
- Las disputas parten de aristas realmente compartidas por dos empresas distintas. Se conserva solo la porción alcanzada por ambos círculos, se aplica un buffer de 300 m a cada lado (franja aproximada de 600 m) y se recorta a los territorios involucrados. Las franjas se disuelven entre sí.
- Las disputas son una capa superpuesta, no una tercera categoría de reparto. No se suman otra vez a los porcentajes.
- El área por empresa usa `turf.area` y el área total del bounding box como denominador. El porcentaje libre se cierra por conservación hasta 100 %. Esto absorbe el pequeño residuo de área esférica que aparece al subdividir aristas en lon/lat.
- Se excluyen y reportan IDs fuera del bounding box. Ubicaciones idénticas de una empresa usan el mayor radio; ubicaciones idénticas de empresas rivales producen un error explícito para corregirlas. No se desplazan coordenadas de forma automática.

El resultado contiene `territorios`, `libre`, `disputadas`, `areaTotalM2`, `porcentajes`, `porcentajeLibre`, `pendientes` y `fueraDeLimites`. Las empresas sin territorio que aparecen en la entrada reciben 0 %.

## Editor

1. Seleccionar un pendiente y pulsar **Ubicar en el centro**. Se usa la ubicación actual del centro del mapa.
2. Arrastrar los marcadores para corregir coordenadas. También admiten las flechas del teclado cuando tienen foco.
3. Los marcadores sin verificar tienen contorno discontinuo. Al ubicar o mover un desarrollo se marca como verificado.
4. **Exportar JSON** descarga todos los registros con las correcciones en memoria. Los registros no editados conservan sus valores y su estado.
5. Incorporar el archivo exportado a `src/data/desarrollos.json` para persistirlo en el repositorio.

Recargar descarta los cambios en memoria. No hay backend ni escritura del navegador al repo. El editor se importa dinámicamente bajo `import.meta.env.DEV`; sus controles y su CSS se eliminan del build, incluso al abrir producción con `?edit=1`.

## Verificación

Vitest cubre el conjunto real en los alcances 0.5, 1 y 2.5; validación de esquema y pendientes; puntos únicos y colineales, vecinos aliados y rivales, islas, radios diferentes, coordenadas coincidentes, bordes, entradas inválidas, invariancia al orden y una población sintética densa con distintos factores.

Se comprueban ausencia de traslapes, huecos y geometría fuera del bounding box con tolerancia de 0.01 m² en el plano del recorte; validez de las superficies; disputas fuera del suelo libre; suma del reparto a 100 %; y acuerdo con el área esférica libre con tolerancia de 0.0001 puntos porcentuales. Las tolerancias representan cálculo numérico, no precisión catastral.

Playwright verifica píxeles coloreados del mapa, escritorio y móvil, La Corona y Simbología, búsqueda, navegación entre fichas con restablecimiento del desplazamiento y foco, hover y clic en territorios, iconos de marcadores, cambios rápidos del alcance, edición, arrastre, JSON exportado y ausencia del editor en producción.

También verifica las tarjetas contra los JSON, selección desde el catálogo, atenuación real de los polígonos mediante píxeles y de los marcadores mediante opacidad, URLs compartibles, Atrás/Adelante, alcance compartido, navegación con teclado, créditos, referencias, rutas desconocidas y entrada directa con recarga en el build de producción.

La matriz táctil adicional cubre 320×568, 390×844, 844×390, 568×320, 768×1024 y una ventana reducida de 390×420: alcance con gesto táctil, controles sin solaparse, desplazamiento del ranking, búsqueda, expansión y cierre de fichas, foco y rotación. También se verifican las fuentes locales y el aviso cuando fallan las teselas. Son pruebas de navegador emulado, no sustituyen una revisión en Safari y Android físicos. Los ajustes móviles se concentran en `src/mobile.css`, cargado después del sistema visual.

## Escudos de las Casas

Los emblemas son interpretaciones ficticias, no logotipos oficiales. El armorial de desarrollo se abre en `/escudos`; esa ruta y su componente no se incluyen en producción.

```tsx
import { Escudo, Estandarte } from './components/escudo/Escudo';

<Escudo casaId="gm-desarrollos" size={24} variante="completo" />
<Escudo casaId="gm-desarrollos" size={200} variante="silueta" />
<Estandarte casaId="gm-desarrollos" size={88} />
```

`size` es la altura en píxeles; la anchura mantiene la proporción 4:5. La variante `silueta` usa una sola tinta heredada de `color`, con campo transparente. Los SVG no contienen texto, imágenes externas, filtros ni degradados.

En `src/components/escudo/`, `blasones.ts` asigna particiones, figuras y lemas; `siluetas.ts`, `particiones.ts` y `figuras.ts` definen el vocabulario cerrado. `tintas.ts` elige argén o sable por contraste con el color original del JSON. Las figuras que cruzan una partición cambian de tinta para conservar el contraste.

Cada blasón conserva `lemaOriginal` en español, `lemaLatin` y `lemaTraduccion`. La interfaz muestra el latín con su traducción de apoyo; el armorial también conserva el original. Las equivalencias y notas están en [Lemas latinos](docs/lemas-latinos.md).

Los estandartes del mapa se anclan al centro de masa del componente territorial más grande. Si ese centro cae en un hueco o fuera de un campo cóncavo, se usa el Bastión interior más cercano. La entrada dura 150 ms y respeta movimiento reducido. Los marcadores de Bastiones conservan sus iconos por tipo.

Las pruebas cubren correspondencia con las 14 Casas, combinaciones únicas, tintas, IDs de recorte independientes, escalas, píxeles renderizados, anclaje del hover y exclusión del armorial en producción.

## Imágenes de castillos

Los 14 PNG originales se conservan en `src/components/castillos/` como fuentes de edición. La aplicación importa únicamente las variantes WebP de `optimized/`: 160, 384, 768 y 1280 píxeles de ancho. Los tooltips usan la variante de 160 px; las fichas y el catálogo usan `srcset` y `sizes` para que el navegador elija según el espacio disponible y la densidad de pantalla. Se mantiene la imagen completa y el recorte octagonal de la interfaz.

Las 56 variantes suman aproximadamente 2.47 MB frente a 55.68 MB de los originales. Cada imagen descarga solo la variante seleccionada, no todas. Las variantes se incluyen en Git; después de cambiar un original o añadir una Casa, regenerarlas con:

```sh
pnpm images:castillos
pnpm build
pnpm test:e2e
```

Sharp se usa exclusivamente como herramienta de desarrollo. No se procesan imágenes en Railway ni en cada petición del usuario. El build no incluye los PNG originales.

## Publicación en Railway

El sitio está publicado en Railway y vinculado a la rama `main` del repositorio de GitHub. `pnpm build` genera `dist/`; Railway debe servir ese directorio como sitio estático, no ejecutar el servidor de desarrollo. No hay backend de aplicación.

Railpack detecta aplicaciones Vite y puede servirlas con Caddy. Si la detección no configura la salida SPA, la variable `RAILPACK_SPA_OUTPUT_DIR=dist` permite indicarla explícitamente. Las rutas que no corresponden a archivos deben resolver a `index.html`, para poder abrir y recargar `/desarrolladoras` y `/creditos`. Referencias: [Node en Railpack](https://railpack.com/languages/node/) y [rutas SPA en Railway](https://docs.railway.com/guides/spa-routing-configuration).

La conexión con GitHub, el despliegue automático y los dominios se administran en Railway; no se configuran desde este repositorio. Después de un push a `main`, comprobar que el despliegue usa el commit nuevo. Si el despliegue automático está desactivado, desplegar el último commit desde Railway; volver a desplegar una versión anterior no incorpora los cambios nuevos.

Se conservan `vercel.json` y `public/_redirects` como alternativas para otros proveedores; no configuran Railway. Las pruebas locales verifican entrada directa y recarga del build. Tras publicar, comprobar también las rutas, el favicon y las imágenes en la URL pública; esas pruebas locales no sustituyen la verificación del hosting.

El mapa usa teselas raster de OpenStreetMap con atribución visible y sin API key. Los JSON y la geometría son locales; el fondo cartográfico requiere conexión. Si fallan las teselas, se mantiene el fondo local con los territorios y se muestra un aviso. Antes de un despliegue con tráfico alto, revisar las condiciones del proveedor de teselas.

Referencias técnicas: [Vite](https://vite.dev/guide/), [Voronoi de D3](https://d3js.org/d3-delaunay/voronoi), [Turf union](https://turfjs.org/docs/api/union), [marcadores MapLibre](https://maplibre.org/maplibre-gl-js/docs/examples/drag-a-marker/), [política de teselas OSM](https://operations.osmfoundation.org/policies/tiles/).
