# Revisión de los lemas latinos

Los textos de `lemaOriginal` se conservan exactamente como estaban antes de la migración. Las versiones latinas son formulaciones para este proyecto, no citas de lemas históricos. Cada una tiene entre dos y cuatro palabras y utiliza una frase nominal, un participio o un imperativo breve.

En Casas y en la ficha del mapa se muestra `lemaLatin` con `lemaTraduccion` debajo. El armorial de desarrollo `/escudos` permite consultar también el original.

## Tabla de revisión

| Casa | lemaOriginal | lemaLatin | lemaTraduccion | Nota de sentido y gramática |
| --- | --- | --- | --- | --- |
| GM Desarrollos | Fiesta en el Valle de Oriente | Festum Orientis | La fiesta de Oriente | `Festum`: nominativo neutro singular; `Orientis`: genitivo singular. Condensa el lugar en Oriente y conserva la celebración; omite «valle» para reservar esa raíz a U-Calli. |
| IDEI | El cielo queda de vecino | Caelum propinquum | El cielo cercano | Sustantivo y adjetivo en nominativo neutro singular. Condensa la personificación del vecino en cercanía. |
| Grupo Acosta Verde | Todos los senderos llevan aquí | Omnes semitae huc ducentes | Todos los senderos que conducen aquí | `Omnes`, `semitae` y `ducentes`: nominativo femenino plural; `huc`: adverbio de dirección. Conserva todos los elementos mediante un participio. |
| FINSA | Este reino mueve la máquina | Regnum machinam movens | El reino que mueve la máquina | `Regnum`: nominativo neutro; `machinam`: acusativo, objeto de `movens`, que concuerda con el reino. Se omite el demostrativo. |
| GP Vivienda | Hogares que avanzan al horizonte | Domus ad horizontem tendentes | Hogares que se extienden hacia el horizonte | `Domus` y `tendentes`: nominativo femenino plural. `Ad` rige el acusativo `horizontem`. La expansión sustituye el avance personificado. |
| Grupo Javer | De cuadra en cuadra conquistamos | Singulae insulae expugnatae | Manzanas conquistadas una a una | Las tres palabras están en nominativo femenino plural. `Singulae` aporta distribución; `insulae` se interpreta como manzanas urbanas. La acción se condensa en el resultado conquistado. |
| Ruba | Del norte para el barrio | Ab aquilone pro vico | Desde el norte para el barrio | `Ab` + ablativo `aquilone` expresa origen; `pro` + ablativo `vico`, destinatario o beneficio. `Aquilo` admite la acepción geográfica norte. |
| Vidusa | Vivienda masiva, gente contenta | Aedes multae, populus laetus | Muchas viviendas, pueblo contento | `Aedes multae`: nominativo femenino plural; `populus laetus`: nominativo masculino singular. «Masiva» se expresa como abundancia de viviendas. |
| Grupo Sadasi | Heroico hogar, heroica cuna | Focus heroum, cunae fortium | Hogar de héroes, cuna de valientes | `Focus` es nominativo masculino singular; `heroum`, genitivo plural de `heros`. `Cunae` es un plural con sentido de cuna; `fortium`, genitivo plural sustantivado. Dos construcciones nominales conservan la idea heroica sin repetir raíz. |
| Proyectos 9 | El centro reclama su corona | Centrum coronam vindicans | El centro que reclama la corona | `Centrum`: nominativo neutro; `coronam`: acusativo; `vindicans` concuerda con el centro y conserva la reclamación mediante un participio. |
| DM Desarrolladora | El lujo tiene un punto | Punctum luxus | El punto del lujo | `Punctum`: nominativo neutro; `luxus`: genitivo singular de cuarta declinación (con cantidad marcada, `luxūs`). Conserva el juego con «punto» como una relación nominal. |
| GIM | La garza de la alta moda | Ardea summae elegantiae | La garza de la máxima elegancia | `Ardea`: nominativo femenino; `summae elegantiae`: genitivo de cualidad, con concordancia femenina singular. «Alta moda» se condensa en elegancia máxima. |
| Altea Desarrollos | Movemos el norte | Septentriones cie | Pon en movimiento el norte | `Septentriones`: acusativo plural en su acepción norte; `cie`: imperativo singular de `cieo`. La declaración se convierte en exhortación. |
| U-Calli | El valle se traza aquí | Vallis delineata | El valle trazado | Sustantivo y participio en nominativo femenino singular. Se conserva la idea de trazar el valle y se omite el deíctico «aquí». |

## Auditoría de raíces

Se comparan familias léxicas latinas, incluyendo flexiones y derivados; no simples coincidencias de letras ni prefijos compartidos. No hay raíces léxicas compartidas entre Casas en esta versión. Las formas se registran en un inventario manual en `lemas.test.ts`; añadir una palabra exige revisar ese inventario.

| Casa | Raíces o familias reservadas |
| --- | --- |
| GM Desarrollos | fest-, orient- |
| IDEI | cael-, propinqu- |
| Grupo Acosta Verde | omn-, semit-, hic/huc, duc- |
| FINSA | reg-, machin-, mov- |
| GP Vivienda | dom-, ad, horizont-, tend- |
| Grupo Javer | singul-, insul-, pugn- |
| Ruba | ab, aquilon-, pro, vic- |
| Vidusa | aed-, mult-, popul-, laet- |
| Grupo Sadasi | foc-, hero-, cun-, fort- |
| Proyectos 9 | centr-, coron-, vindic- |
| DM Desarrolladora | punct-, lux- |
| GIM | arde-, summ-, elegant- |
| Altea Desarrollos | septentrion-, ci- |
| U-Calli | vall-, line- |

La revisión de sentido y de gramática es manual. Las pruebas automatizadas comprueban conservación de originales, longitud, raíces del inventario y presentación de los tres campos, pero no sustituyen esa revisión lingüística.

## Referencias consultadas

- [Allen y Greenough: concordancia de adjetivos y participios](https://dcc.dickinson.edu/grammar/latin/agreement-adjectives).
- [The National Archives: participios latinos](https://www.nationalarchives.gov.uk/latin/stage-2-latin/lessons/lesson-19-participles-present-past-and-future/).
- Lewis y Short: [festum](https://alatius.com/ls/index.php?l=festum), [propinquus](https://cld.bbaw.de/lemma/lat/propinquus), [horizon](https://alatius.com/ls/index.php?l=horizon), [aquilo](https://alatius.com/ls/index.php?l=aquilo) y [vicus](https://cld.bbaw.de/lemma/lat/vicus).
- [Indiana University: insula como edificio o manzana urbana](https://exhibits.library.indianapolis.iu.edu/aw3d/insula).
- Lewis y Short: [aedes](https://classics.andrewgadsden.com/lewisandshort/entry/n1130), [focus](https://alatius.com/ls/index.php?l=focus), [cunae](https://alatius.com/ls/index.php?l=cunae), [luxus](https://cld.bbaw.de/lemma/lat/luxus) y [elegantia](https://alatius.com/ls/index.php?l=elegantia).
- Lewis y Short: [septentriones](https://classics.andrewgadsden.com/lewisandshort/entry/n43748) y [cieo](https://alatius.com/ls/index.php?l=cieo), con un ejemplo atestiguado del imperativo `cie`.
