# OMEX Treasury

Sistema web de control y tesorería de financiamientos para **OMEX ACEROS**: catálogos, líneas de crédito, TIIE de BANXICO, amortizaciones con pago bullet, cuenta corriente con interés diario y conciliación contra el banco. Basado en el *Segundo avance del proyecto* (Proyecto Integrador 1, FIME-UANL).

Es una página web **estática** (HTML + CSS + JavaScript). No necesita Node.js, servidor ni base de datos: los datos demo y los cambios se guardan en el `localStorage` del navegador.

## Cómo ejecutarlo

**Visual Studio**
1. *Archivo → Abrir → Carpeta…* y elige la carpeta del proyecto.
2. En el Explorador de soluciones, clic derecho en `index.html` → **Ver en el explorador** (o *Abrir con… → navegador*).

También funciona con doble clic en `index.html`, o con la extensión *Live Server* si usas VS Code.

> Requiere internet la primera vez: los estilos (Tailwind) y los íconos (Lucide) se cargan por CDN desde `index.html`.

### Acceso demo
| Usuario | Rol |
|---|---|
| `fernando.garcia` | admin (todas las pantallas) |
| `diego.issac`, `alejandro.carrera` | treasury (edita, sin pantalla de usuarios) |
| `esperanza.lopez`, `alejandro.armendariz` | viewer (solo lectura) |

Contraseña de todos: `Omex2025!`. La fecha de corte inicial es `2025-09-15` (los datos demo son de ago–sep 2025). El botón *Restablecer datos demo* del login borra todo lo guardado.

## Estructura

```text
index.html          Estructura de la página y orden de carga de scripts
css/styles.css      Componentes propios (tabla, campos, botón, tarjeta, menú)
js/finance.js       Motor financiero: TODAS las fórmulas (amortización, interés, conciliación)
js/store.js         "Base de datos" local, datos demo y reglas de negocio (antes backend)
js/api.js           Sesión y cliente (call, apiService) sobre el store
js/helpers.js       Utilidades de interfaz (formato de dinero, tablas, tarjetas)
js/views.js         Las pantallas (catálogos, usuarios, tasas, líneas, reportes…)
js/actions.js       Acciones de botones y formularios
js/app.js           Menú lateral, cabecera, login y arranque
tests/              Pruebas del motor financiero (opcionales, requieren Node 18+)
docs/               Arquitectura y esquema PostgreSQL para una futura versión con servidor
```

Los scripts son clásicos (sin módulos ES) para que funcionen al abrir el archivo directo desde el disco; **el orden de los `<script>` en `index.html` importa**.

## Fórmulas (`js/finance.js`)

- **Bullet:** `A = (P − B) / n`; saldo `S_k = P − Σ pagos`; última fila = `B`.
- **Interés largo plazo:** `saldo inicial × (TIIE + sobretasa) / 100 × días / 360`.
- **Cuenta corriente:** `saldo_d × (TIIE_d + sobretasa) / 100 / 360`, con cargo = disposición y abono = pago.
- **Conciliación:** `Dif = Según banco − Ints. Omex`; estados `PENDING`, `RECONCILED`, `BANK_HIGHER`, `OMEX_HIGHER`.
- **Cobro:** fin de mes, mismo día, o día hábil siguiente (fines de semana y festivos fijos LFT).

## Limitaciones de esta versión

- Los datos viven solo en el navegador donde se usan; no se comparten entre equipos.
- Las contraseñas usan un hash simple de demostración, no seguridad real.
- La sincronización de TIIE es simulada (la API de BANXICO requiere servidor y token).
- Pendientes heredados: exportación XLSX (hoy CSV), Semana Santa en festivos y confirmar con Tesorería la convención de interés de largo plazo.

## Pruebas (opcional)

```bash
node --test tests/finance.test.js
```

## Subir a GitHub

```bash
git init
git add .
git commit -m "OMEX Treasury: versión web estática"
git branch -M main
git remote add origin <URL_DEL_REPO>
git push -u origin main
```

Para publicarlo como página (GitHub Pages): *Settings → Pages → Deploy from a branch → `main` / root*.
