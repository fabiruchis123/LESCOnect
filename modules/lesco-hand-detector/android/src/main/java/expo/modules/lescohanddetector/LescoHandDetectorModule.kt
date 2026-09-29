package expo.modules.lescohanddetector

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.util.Base64
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.handlandmarker.HandLandmarker
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileOutputStream

class LescoHandDetectorModule : Module() {
  private var handLandmarker: HandLandmarker? = null
  private var initError: String? = null

  @Synchronized
  private fun getOrCreateLandmarker(): HandLandmarker? {
    if (handLandmarker != null) return handLandmarker

    val context = appContext.reactContext
    if (context == null) {
      initError = "ReactContext es nulo"
      return null
    }

    // Intento 1: Carga directa desde assets de la aplicación
    try {
      val baseOptions = BaseOptions.builder()
        .setModelAssetPath("hand_landmarker.task")
        .build()

      val options = HandLandmarker.HandLandmarkerOptions.builder()
        .setBaseOptions(baseOptions)
        .setMinHandDetectionConfidence(0.35f)
        .setMinTrackingConfidence(0.35f)
        .setMinHandPresenceConfidence(0.35f)
        .setNumHands(1)
        .setRunningMode(RunningMode.IMAGE)
        .build()

      handLandmarker = HandLandmarker.createFromOptions(context, options)
      initError = null
      return handLandmarker
    } catch (e1: Exception) {
      // Intento 2: Copiar archivo de assets a almacenamiento interno para evitar problemas de compresión mmap
      try {
        val cacheFile = File(context.filesDir, "hand_landmarker.task")
        if (!cacheFile.exists() || cacheFile.length() < 1000L) {
          context.assets.open("hand_landmarker.task").use { input ->
            FileOutputStream(cacheFile).use { output ->
              input.copyTo(output)
            }
          }
        }

        val baseOptions = BaseOptions.builder()
          .setModelAssetPath(cacheFile.absolutePath)
          .build()

        val options = HandLandmarker.HandLandmarkerOptions.builder()
          .setBaseOptions(baseOptions)
          .setMinHandDetectionConfidence(0.35f)
          .setMinTrackingConfidence(0.35f)
          .setMinHandPresenceConfidence(0.35f)
          .setNumHands(1)
          .setRunningMode(RunningMode.IMAGE)
          .build()

        handLandmarker = HandLandmarker.createFromOptions(context, options)
        initError = null
        return handLandmarker
      } catch (e2: Exception) {
        initError = "Fallo carga: Asset (${e1.javaClass.simpleName}: ${e1.message}) | Cache (${e2.javaClass.simpleName}: ${e2.message})"
        return null
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("LescoHandDetector")

    Function("isAvailable") {
      getOrCreateLandmarker() != null
    }

    Function("getLastError") {
      initError
    }

    AsyncFunction("detectHandFromBase64") { base64Data: String, facingMode: String? ->
      val landmarker = getOrCreateLandmarker()
      if (landmarker == null) {
        return@AsyncFunction mapOf(
          "detected" to false,
          "error" to (initError ?: "No se pudo inicializar MediaPipe HandLandmarker")
        )
      }

      try {
        val cleanBase64 = if (base64Data.contains(",")) {
          base64Data.substringAfter(",")
        } else {
          base64Data
        }

        val decodedBytes = Base64.decode(cleanBase64, Base64.DEFAULT)
        val originalBitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
          ?: return@AsyncFunction mapOf(
            "detected" to false,
            "error" to "Error decodificando imagen"
          )

        // Detección de orientación EXIF
        var exifDegrees = 0
        try {
          val inputStream = ByteArrayInputStream(decodedBytes)
          val exif = ExifInterface(inputStream)
          val orientation = exif.getAttributeInt(
            ExifInterface.TAG_ORIENTATION,
            ExifInterface.ORIENTATION_NORMAL
          )
          exifDegrees = when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> 90
            ExifInterface.ORIENTATION_ROTATE_180 -> 180
            ExifInterface.ORIENTATION_ROTATE_270 -> 270
            else -> 0
          }
        } catch (_: Exception) {}

        // Determinar rotación necesaria para que la mano quede vertical
        var targetRotation = exifDegrees
        if (targetRotation == 0 && originalBitmap.width > originalBitmap.height) {
          // Si el sensor entrega imagen apaisada (width > height) en modo vertical:
          // La frontal en Android suele requerir 270° para quedar vertical; la trasera 90°
          targetRotation = if (facingMode == "back") 90 else 270
        }

        val workingBitmap = if (targetRotation != 0) {
          val matrix = Matrix()
          matrix.postRotate(targetRotation.toFloat())
          val rotated = Bitmap.createBitmap(originalBitmap, 0, 0, originalBitmap.width, originalBitmap.height, matrix, true)
          if (rotated != originalBitmap) {
            originalBitmap.recycle()
          }
          rotated
        } else {
          originalBitmap
        }

        val mpImage = BitmapImageBuilder(workingBitmap).build()
        val result = landmarker.detect(mpImage)

        val landmarksList = mutableListOf<Map<String, Float>>()
        val handLandmarks = result.landmarks()

        if (handLandmarks != null && handLandmarks.isNotEmpty()) {
          val firstHand = handLandmarks[0]
          for (landmark in firstHand) {
            landmarksList.add(
              mapOf(
                "x" to landmark.x(),
                "y" to landmark.y(),
                "z" to landmark.z()
              )
            )
          }
        }

        try {
          workingBitmap.recycle()
        } catch (_: Exception) {}

        mapOf(
          "detected" to landmarksList.isNotEmpty(),
          "landmarks" to landmarksList,
          "handsCount" to (handLandmarks?.size ?: 0),
          "rotationApplied" to targetRotation
        )
      } catch (e: Exception) {
        mapOf(
          "detected" to false,
          "error" to (e.message ?: "Error en inferencia MediaPipe")
        )
      }
    }
  }
}
