---
trigger: glob
glob: "src/modules/Emergencias/**"
description: Convenciones de seguridad y respuesta para el módulo de despacho SOS y geolocalización
---

# Reglas de Emergencias (SOS y Geolocalización)

## Contexto y Alcance
Este módulo gestiona la funcionalidad crítica de despacho de emergencias SOS, geolocalización del usuario y alertas de socorro en LESCOnect.

## Principios e Instrucciones
1. **Precisión y Permisos de Ubicación**:
   - Solicitar y verificar explicítamente los permisos de ubicación en primer y segundo plano según las directrices de Expo Location.
   - Manejar siempre casos de GPS desactivado o señal débil con fallbacks de degradación elegante.

2. **Rendimiento y Resiliencia**:
   - Garantizar un tiempo de respuesta mínimo en el disparo del botón SOS.
   - Las peticiones de auxilio deben incluir mecanismos de reintento automático y cola offline en caso de baja conectividad.

3. **Privacidad y Registro**:
   - Tratar las coordenadas GPS e información del incidente con estricta confidencialidad.
   - No almacenar historiales de ubicación persistentes no autorizados por el usuario.
