# Bitácora

Diario personal estilo bullet journal: retos, hábitos, fe, dinero, progreso día a día y un lienzo libre para dibujar. Privado, protegido con contraseña, hecho para Vercel.

## Secciones

| Sección | Qué hace |
|---|---|
| **Hoy** | Registro rápido (tareas, eventos, notas), hábitos con la semana, sueño, ánimo, gratitud, lectura bíblica, pegatinas y cuenta regresiva de fechas importantes. |
| **Retos** | Rachas con marcas de conteo. "Dejar algo" (pureza) cuenta días y horas; si caes, lo registras con reflexión y vuelve a empezar. "Cumplir un hábito" cuenta días seguidos. |
| **Momento difícil** | Botón siempre visible: versículo, tus razones, acciones inmediatas, temporizador de 10 minutos y "Vencí esta tentación". |
| **Progreso** | Tu año en cuadritos y estadísticas por hábito (racha, mejor racha, % de 30 días), sueño y ánimo promedio. |
| **Fe** | Versículo del día (RVR1960), versículos por tema, diario de oración con peticiones respondidas. |
| **Dinero** | Saldo, cuánto puedes gastar por día hasta el próximo cobro, libro de entradas/salidas, clientes y fondo de emergencia. |
| **Lienzo** | Tableros libres tipo pizarra (Excalidraw) para dibujar, escribir y pegar imágenes. |
| **Ajustes** | Color del cuero, tipo de papel, hábitos, razones, fechas, copia de seguridad y cerrar sesión. |

Atajos en PC: `Alt+1` … `Alt+7` cambian de sección.

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
