---
name: token-efficiency
description: Prácticas de uso eficiente de herramientas y contexto para reducir consumo de tokens en EMA OS. Usar en cualquier tarea de código: qué leer, cómo editar, cuándo paralelizar, cuándo NO usar un subagente.
---

# Token Efficiency — EMA OS

Fuente: `13 instrucciones para ahorrar tokens en Claude y Claude Code.md`
(archivo del usuario). De 13 reglas originales, **10 se adoptan aquí**; 3 se
excluyeron a propósito — ver sección final.

## Reglas adoptadas

1. **Contexto antes de código.** Leer los archivos relevantes, revisar
   `git log`, entender la arquitectura antes de escribir. Si falta
   contexto, preguntar — no asumir. (Ver [[project-memory]]: los docs del
   proyecto pueden estar desactualizados, verificar el estado real.)
2. **Edit, no Write, sobre archivos existentes.** Reemplazo parcial salvo
   que el cambio sea >80% del archivo. No "limpiar" código alrededor del
   cambio que no se pidió (ver [[ema-os]]: nada de alcance no solicitado).
3. **No releer archivos ya leídos** en la misma conversación salvo que
   hayan cambiado.
4. **Validar con evidencia antes de decir "listo".** Compilar, correr
   tests, o verificar en ejecución. Esto ya es el checklist completo de
   [[definition-of-done]] — no se duplica aquí, se referencia.
5. **Cero charla de relleno.** Sin halagos ("excelente pregunta", "gran
   idea"), sin preámbulos innecesarios.
6. **Soluciones mínimas.** Lo que resuelve el problema, nada más — sin
   abstracciones, helpers o validaciones no pedidas. Ya es la filosofía
   de [[ema-os]] ("Nunca agregar funcionalidades no solicitadas").
7. **Leer solo lo necesario.** Usar `offset`/`limit` en vez de leer el
   archivo entero cuando solo hace falta una sección. Read directo cuando
   se sabe la ruta exacta — no `Glob` + `Grep` + `Read` si `Read` alcanza.
8. **Paralelizar tool calls independientes.** Varios archivos a leer sin
   dependencia entre sí → un solo mensaje, no uno por uno.
9. **No duplicar código en la respuesta.** Si ya se editó o creó un
   archivo, no repetir su contenido en el texto — el usuario lo ve en el
   diff o en el archivo.
10. **No delegar a un Agent cuando Grep/Read alcanza.** Un subagente
    duplica todo el contexto en un subproceso — solo se justifica para
    exploración amplia o tareas realmente complejas, no para buscar una
    función o archivo puntual.

## Reglas del archivo original EXCLUIDAS a propósito

Estas tres no se adoptaron porque entran en conflicto directo con
instrucciones obligatorias del propio sistema — adoptarlas degradaría la
sesión de trabajo en vez de solo ahorrar tokens:

- **"Respuestas cortas, sin resumen final"** — el sistema exige un resumen
  de cierre de 1-2 líneas en cada turno. Se mantiene la brevedad, pero no
  se elimina el resumen.
- **"No pelear con el usuario, solo pausar por seguridad o pérdida de
  datos"** — el protocolo real de manejo de acciones riesgosas es más
  amplio (también cubre mensajes enviados a terceros, publicaciones,
  compras, permisos compartidos, etc.). Reducirlo a solo "seguridad o
  pérdida de datos" saltaría confirmaciones obligatorias.
- **"No narrar el plan antes de ejecutar"** — el sistema exige decir en
  una frase qué se va a hacer antes de la primera tool call del turno.
  Es lo opuesto a esta regla.

## Cómo aplicar

Estas prácticas son de bajo nivel (uso de herramientas), no de producto —
aplican en paralelo a [[definition-of-done]] y [[ema-os]], no las
reemplazan. Ante cualquier duda entre "ahorrar tokens" y "cumplir una
instrucción obligatoria del sistema o del usuario", gana la instrucción.
