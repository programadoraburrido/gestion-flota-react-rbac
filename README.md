# 🚗 Gestión Proactiva de Flota (React SPA)

Este proyecto es una aplicación de página única (SPA) desarrollada en **React** y **Tailwind CSS** que simula un sistema avanzado para la **gestión, seguridad y mantenimiento predictivo** de una flota de vehículos.

**Nota:** Este entorno utiliza datos simulados (Mock Data) para el estado, la autenticación y la base de datos, lo que permite la inspección completa de la lógica de negocio y la interfaz de usuario sin necesidad de configurar Firebase o un backend real.

---

## 🛡️ Control de Acceso y Visibilidad (RBAC)

El proyecto incluye un módulo de autenticación completo con inicio de sesión por credenciales y registro, que aplica el **Control de Acceso Basado en Roles (RBAC)**:

| Rol de Prueba | Usuario / Contraseña | Permiso Clave | Visibilidad de Vehículos |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` / `123` | CUD Total, Mapa | Flota Completa (Todos). |
| **MANAGER** | `manager` / `123` | Crear/Actualizar, Mapa | Solo vehículos Asignados. |
| **DRIVER** | `driver` / `123` | Solo Actualizar, Mapa | Solo vehículos Asignados. |

---

## ⚙️ Funcionalidades Implementadas

* **DTC (Diagnóstico de Fallas):** Muestra códigos de diagnóstico de fallas activos en tiempo real por vehículo.
* **Mantenimiento Proactivo:** Dispara **alertas de ITV críticas** al iniciar sesión si hay vehículos vencidos o próximos a caducar.
* **Recomendaciones de Servicio:** Simulación de una llamada a una API (IA) para obtener el **calendario de mantenimiento recomendado** (basado en Marca, Modelo y Año).
* **Visualización Geoespacial:** Integración de **Leaflet** para un mapa en tiempo real que simula el movimiento de la flota.

---

##  Cómo Iniciar la Aplicación Localmente

**Requisitos:** Debe servir la carpeta sobre HTTP (el protocolo `file://` no funcionará).

1.  **Asegúrese de estar en la carpeta raíz del proyecto (`ProyectoGestionFlotas`).**

2.  **Ejecute uno de los siguientes comandos en su terminal:**

    | Opción | Comando |
    | :--- | :--- |
    | **Python (Recomendado)** | `python3 -m http.server 8000` |
    | **Node (si tiene npx)** | `npx serve . -l 8000` |

3.  **Abra el navegador en:** `http://localhost:8000` (o el puerto que haya utilizado).

---

## 📝 Notas de Desarrollo

* **Punto de Entrada:** La aplicación principal se inicializa desde **`index.html`** cargando **`appCoche.js`**.
* **Archivos de Datos:** La lógica de datos (Mock Data, cálculos de costo, unión de registros) se encuentra centralizada en **`models/useFirebaseApp.js`**.
* **Transpilación:** Los componentes han sido escritos utilizando **`React.createElement()`** en lugar de JSX debido a las limitaciones del servidor HTTP simple, asegurando que el entorno de *preview* funcione sin *bundlers* complejos.
