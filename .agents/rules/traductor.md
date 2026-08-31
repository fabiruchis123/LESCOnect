---
trigger: glob
glob: "src/modules/Traductor/**"
description: Convenciones para el core del producto (traducción de LESCO / Lenguaje de Señas)
---

# Reglas del Traductor LESCO (Core del Producto)

## Contexto y Alcance
Este módulo contiene el núcleo de la aplicación: el motor de interpretación y traducción de Lenguaje de Señas Costarricense (LESCO) a texto/audio y viceversa.

## Principios e Instrucciones
1. **Optimización de Procesamiento en Tiempo Real**:
   - Maximizar la eficiencia del pipeline de cámara, captura de fotogramas y procesamiento de inferencia para evitar caída de FPS o congelamientos en la UI.
   - Liberar recursos de cámara e hilos de render cuando la vista del traductor no esté en pantalla activa.

2. **Fidelidad y Modelado de Datos**:
   - Mantener una estructura de datos clara para la representación sintáctica y gramatical de LESCO.
   - Aislar los servicios de inferencia / IA de los componentes puramente visuales.

3. **Experiencia de Usuario e Inclusividad**:
   - Proveer feedback visual o háptico inmediato ante estados de carga, fallos de reconocimiento o baja iluminación de cámara.
