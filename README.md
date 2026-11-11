# Bitácora

Bullet journal personal en 3D: retos, hábitos, fe, trackers, resumen mensual y espacio para escribir, dibujar y pegar en cualquier página. Privado, protegido con contraseña, hecho para Vercel.

## Cómo es

Un cuaderno de cuero con anillas de latón, en 3D. En PC:

- La **portada** siempre muestra el mes, los días que quedan y el día del año. Tócala para abrir.
- **Pasa las hojas** arrastrando la esquina, con las pestañas de cada hoja, con las flechas del teclado o con los botones de abajo.
- **Arrastra el escritorio** para girar el cuaderno y usa la **rueda** para acercar o alejar. "Vista" lo endereza.
- A la izquierda están las **herramientas**: pluma, marcador y borrador para escribir o dibujar sobre cualquier página; hojas de **pegatinas**; rollos de **cinta** (kraft, negra, tela roja, lino) y **fotos** pegadas con cinta. Todo se arrastra a cualquier página o a la portada, se mueve, se gira, se agranda y se despega.

En el teléfono es una página a la vez, con las mismas secciones y las herramientas en el botón de latón.

## Secciones

| Hoja | Qué tiene |
|---|---|
| **Índice** | Dentro de la portada: a quién pertenece, el mes, los días que quedan, el año y el índice. |
| **Hoy** | Registro rápido (tareas, eventos, notas), hábitos con la semana, sueño, ánimo, gratitud, lectura bíblica y fechas importantes. |
| **Mes** | "Bienvenido noviembre", metas del mes y calendario donde escribes en cada día. |
| **Trackers** | Hábitos con puntos por día (se marcan ahí mismo), gráfica de sueño, ánimo y hora de despertar. |
| **Retos** | Rachas con marcas de conteo, caídas con reflexión y victorias. |
| **Fe** | Versículo del día (RVR1960), versículos por tema y diario de oración. |
| **Libros** | Lista de lecturas y una hoja libre. |
| **Resumen** | El mes en números y tus datos exportados de **Real** (CSV o JSON). |
| **Ajustes** | Color del cuero, papel, hábitos, razones, fechas y copia de seguridad. |

**Momento difícil** está siempre arriba a la derecha: versículo, tus razones, acciones y temporizador de 10 minutos.

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
