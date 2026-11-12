# Bitácora

Bullet journal personal en 3D: retos, hábitos, fe, trackers, resumen mensual y espacio para escribir, dibujar y pegar en cualquier página. Privado, protegido con contraseña, hecho para Vercel.

## Cómo es

Un cuaderno de cuero con anillas de latón, en 3D. En PC:

- La **portada** siempre muestra el mes, los días que quedan y el día del año. Tócala para abrir.
- **Pasa las hojas** arrastrando la esquina, con las pestañas de cada hoja, con las flechas del teclado o con los botones de abajo.
- **Arrastra el escritorio** con el botón izquierdo para girar el cuaderno 360° en cualquier dirección, con el **derecho** para moverlo de lugar, y usa la **rueda** para acercar o alejar. "Vista" lo endereza.
- Al final, la **tapa trasera** se cierra sobre las hojas (botón ›, flecha → o arrastrando el borde). Tócala para volver a abrir.
- **Limpiar** (o la tecla **H**) oculta toda la interfaz y deja solo el cuaderno; el ojo de la esquina la trae de vuelta.
- A la izquierda están las **herramientas** (se ocultan con un botón): pluma, lápiz y resaltador con colores y grosores; línea, flecha, rectángulo y círculo; texto; nota adhesiva; **cinta** que estiras sobre la página (kraft, negra, tela roja, lino, mate); fotos y borrador. Todo funciona en cualquier página o en la portada, y se mueve, gira, agranda y despega.
- **Ctrl+Z** deshace y **Ctrl+Shift+Z** (o Ctrl+Y) rehace.
- **Sonidos** de papel y cuero al pasar hojas, abrir y cerrar, escribir, dibujar, borrar, pegar cinta y marcar como hecho. Se silencian con el botón "Sonido".
- Al pasar una hoja, el papel se **curva** como en un cuaderno real.
- El **marcapáginas** (cinta roja) se pone en la hoja que quieras o se quita con "Marcar hoja" / "Quitar marca"; tocar su punta te lleva a esa hoja.
- La **letra** del cuaderno se cambia en Ajustes: clásico grabado, romano, máquina de escribir, manuscrito o moderno.

En el teléfono es una **libreta de anillas arriba**: papel a todo lo ancho, deslizas a los lados para pasar de hoja (la hoja se levanta sobre las anillas) y las pestañas de cuero de abajo saltan a cada sección. El menú ☰ tiene el índice, el marcapáginas y el sonido; la pluma abre las herramientas. Se ve mejor instalada en la pantalla de inicio ("Agregar a pantalla de inicio").

## Secciones

| Hoja | Qué tiene |
|---|---|
| **Índice** | Dentro de la portada: a quién pertenece, el mes, los días que quedan, el año y el índice. |
| **Hoy** | Pendientes (se marcan como hechos, pasan a mañana o se traen de ayer), hábitos con la semana, lo que pasó hoy y fechas importantes. |
| **Mes** | "Bienvenido noviembre", metas del mes y calendario donde escribes en cada día. |
| **Trackers** | Sueño y ánimo del día, hábitos con puntos por día, gráfica de sueño del mes y hora de despertar. |
| **Retos** | Pureza como un cerebro de fragmentos que pintas tú: eliges un color y tocas un fragmento. "Caí" lo vacía y reinicia la cuenta. Meta de días editable. Rachas de disciplina con barra por días. |
| **Vida** | Tu vida en semanas (52 por año): tócala para ampliarla y ver cada semana. "Esta semana" en anillos que se cierran con tus hábitos. |
| **Fe** | Versículo del día (RVR1960), lectura bíblica, gratitud, versículos por tema y diario de oración (toca una petición para abrirla, marca "Oré por esto hoy" o "Respondida"). |
| **Resumen** | El mes en números, tu resumen y "Mirando atrás": lo que aprendiste, lo que agradeces y lo que viene. |
| **Ajustes** | Color del cuero, letra, papel, mostrar u ocultar indicaciones, hábitos, razones, fechas, copia de seguridad y "Empezar de cero" (borra todo tras escribir BORRAR). |

**Momento difícil** está arriba a la derecha y en la página de Pureza: versículo, tus razones, acciones y temporizador de 10 minutos.

## Publicar en Vercel

1. En [vercel.com](https://vercel.com) → **Add New… → Project** → importa este repositorio.
2. En el proyecto: **Storage → Create Database → Neon (Postgres)** → conéctala al proyecto. Vercel agrega `DATABASE_URL` sola.
3. **Settings → Environment Variables**, agrega:
   - `APP_PASSWORD`: tu contraseña para abrir el cuaderno.
   - `AUTH_SECRET`: una cadena larga y aleatoria (por ejemplo, la salida de `openssl rand -base64 32`).
4. **Deployments → Redeploy**. Abre la URL e introduce tu contraseña.

La tabla se crea sola la primera vez. Para instalarlo como app en el teléfono: ábrelo en el navegador → "Agregar a pantalla de inicio".

## Desarrollo local

```bash
npm install
npm run dev
```

Sin base de datos, en local los datos se guardan en `.data/store.json` y la contraseña es `bitacora`.

## Privacidad

Todo pasa por la contraseña: las páginas y la API responden 401 sin sesión. La sesión dura 120 días en ese dispositivo. Descarga una copia de seguridad desde Ajustes de vez en cuando.
