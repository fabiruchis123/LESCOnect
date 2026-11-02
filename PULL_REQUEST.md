# 🚀 Pull Request — LESCOnect

## 📝 Descripción
Este Pull Request consolida una actualización integral de estabilidad, accesibilidad visual, seguridad y funcionalidad para la preparación de la versión Alpha de **LESCOnect**:
1. **Limpieza Visual en Videos (Swipe Up)**: Se eliminaron las sombras y viñetas oscuras que cubrían un tercio del video en la pantalla de bienvenida y tutoriales, manteniendo subtítulos accesibles limpios y flotantes sincronizados con el habla.
2. **Splash de Inicialización Profesional**: Pantalla de carga continua de 10 segundos con barra de progreso, mensajes rotativos inclusivos y precarga en segundo plano del catálogo para modo offline.
3. **Gestión Unificada de Permisos en Arranque**: Solicitud secuencial al iniciar la app de Ubicación Satelital GPS, Agenda de Contactos, Cámara, Almacenamiento y SMS.
4. **Despacho Satelital SOS a Contactos (Exclusión del 9-1-1)**: Reenfoque absoluto del sistema de auxilio para transmitir coordenadas satelitales GPS en tiempo real exclusivamente a la red de contactos SOS del usuario, eliminando cualquier despacho o fallback hacia el 9-1-1 sin homologación. Botón interactivo para importar contactos directamente desde la libreta del teléfono.
5. **Autenticación Telefónica OTP en Servidor (Zero-Cost / Open Source)**: Arquitectura Zero-Trust Client con código generado en backend/PostgreSQL, microservidor local gratuito utilizando el propio teléfono físico (WhatsApp Multi-Device / SMS) con $0 de inversión inicial, y veredicto arbitral de telecomunicaciones.
6. **Módulos de Traducción e Inteligencia LESCO**: Motores de coherencia gramatical LESCO -> Español, entrenador de abecedario, intérprete 3D Avatar y pipeline cinemático de señas.
7. **Organización del Repositorio**: Limpieza y archivo de markdowns históricos en la carpeta `md-olds/`.

---

## 🛠️ Tipo de Cambio
- [x] ✨ **feat**: Nueva funcionalidad o pantalla (Permisos en arranque, selector de agenda SOS, arquitectura OTP servidor, microgateway local)
- [x] 🎨 **style / ui**: Cambios visuales o maquetado de alta fidelidad (Eliminación de sombras en video, splash de 10s, subtítulos flotantes)
- [x] 🐛 **fix**: Corrección de un error o bug (Eliminación de Require Cycle entre Home y Ayuda, exclusión de 9-1-1)
- [x] ♻️ **refactor**: Refactorización de código sin cambiar comportamiento (Limpieza de mockups en useAuthStore, arquitectura modular)
- [x] 📚 **docs**: Cambios en la documentación (Veredicto de arbitraje de telecomunicaciones, reporte de telefonía, manual de gateway local)
- [x] 🔧 **chore / config**: Ajuste de configuración o dependencias (app.json con permisos y plugins, tsconfig.json optimizado)

---

## 📦 Módulos Afectados
- [x] 🤟 **Traductor**
- [x] 🚨 **Emergencias**
- [x] 🏠 **Home**
- [x] 🔐 **Auth**
- [x] 👤 **Perfil**
- [x] 📋 **TramitesRapidos**
- [x] 📜 **Historial**
- [x] ❓ **Ayuda**
- [x] 🧩 **Shared Components / Theme**

---

## 🔍 Cambios Realizados
- **Módulo Auth & Login**:
  - Eliminado el usuario mock inicial (`INITIAL_DEFAULT_USER`); arranque limpio en estado desautenticado (`null`).
  - Modal reactivo de verificación OTP (`SmsOtpVerificationModal.tsx`) con autocompletado y botón prominente de confirmación.
  - Servicio `otpService.ts` adaptado a la arquitectura Zero-Trust.
- **Módulo Emergencias**:
  - Creado `emergencyLocationService.ts` con geolocalización GPS satelital de alta precisión (`expo-location`).
  - Eliminadas todas las menciones y envíos a la central 9-1-1; el mensaje se envía a familiares y contactos SOS con enlace de Google Maps y coordenadas numéricas exactas.
  - En `AddSosContactScreen.tsx`, incorporado botón "📱 Elegir de mi Agenda Telefónica" para importar contactos de la libreta con un solo toque (`appPermissionsService.pickPhoneContact()`).
- **Módulo Home & Bienvenida**:
  - En `WelcomeScreen.tsx`, removidas las viñetas oscuras superior e inferior y el cajón de swipe up; subtítulos flotantes limpios al pie del video.
  - Resuelto el Require Cycle entre `HomeScreen.tsx` y `HelpScreen.tsx`.
- **Módulo Shared & Arranque**:
  - En `app/_layout.tsx`, configurado splash de 10 segundos y solicitud ordenada de permisos con `appPermissionsService.ts`.
  - En `AppLoadingSplash.tsx`, barra de progreso continua y mensajes rotativos inclusivos.
  - Servicios de soporte: `videoCacheService.ts`, `videoSubtitlesService.ts`, `security.ts`.
- **Infraestructura & Backend**:
  - Paquete `local-otp-gateway` con microservidor Open Source (`server.js`) para envío de OTP gratuito por WhatsApp Multi-Device (vía Baileys) o SMS (vía Capcom6).
  - Scripts SQL en `LESCOnect-backend/supabase/` para validación de OTP en PostgreSQL.
  - Reportes y veredictos en `LESCOnect-backend/docs/`.
  - Carpeta `md-olds/` con los markdowns y reportes históricos archivados.

---

## 📸 Evidencia Visual / Capturas
- Splash de 10s con barra de progreso continua al 100%.
- Videos limpios sin viñetas oscuras en bienvenida y módulos.
- Modal de verificación OTP con 6 casillas y botón reactivo.
- Botón de importación desde la libreta de contactos en Agregar Contacto SOS.
- Despacho satelital de alerta SOS con coordenadas satelitales en tiempo real.

---

## ✅ Lista de Verificación (Checklist)
- [x] Se ejecutó `npx tsc --noEmit` sin errores de compilación TypeScript (**0 errores**).
- [x] Se respetó la arquitectura de módulos (6 subcarpetas por módulo y barrera pública `index.ts`).
- [x] Se evitó el uso de importaciones profundas cruzadas entre módulos.
- [x] Los componentes respetan la Paleta Tierra (`#FBF6EE`, `#B5551A`, `#5C7A5C`, `#C0392B`, `#2B241C`, `#7A6E5C`).
- [x] Se verificaron los márgenes y áreas seguras para dispositivos móviles (compilación APK / Expo Go).
