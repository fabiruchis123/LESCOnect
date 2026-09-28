import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MediaPipeNativeVisionRef {
  toggleCamera: () => void;
  flipFacing: (facing: 'front' | 'back') => void;
  reload: () => void;
}

interface MediaPipeNativeVisionProps {
  onHandDetected: (result: {
    detected: boolean;
    letter?: string;
    confidence?: number;
    landmarks?: Array<{ x: number; y: number }>;
    status?: string;
    error?: string;
  }) => void;
  isCameraActive?: boolean;
  facing?: 'front' | 'back';
}

const MEDIAPIPE_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>MediaPipe LESCO Vision</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #1E1712;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    #container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #1E1712;
    }
    video {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
      border-radius: 24px;
      z-index: 1;
    }
    canvas {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
      border-radius: 24px;
      z-index: 2;
      pointer-events: none;
    }
    #status-overlay {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(30, 23, 18, 0.88);
      color: #FBF6EE;
      font-size: 11px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      z-index: 100;
      border: 1px solid rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    #status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #F1C40F;
      box-shadow: 0 0 6px #F1C40F;
    }
    #sign-badge {
      position: absolute;
      bottom: 16px;
      right: 16px;
      background: rgba(46, 204, 113, 0.95);
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 800;
      padding: 8px 18px;
      border-radius: 16px;
      z-index: 100;
      display: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
</head>
<body>
  <div id="container">
    <video id="webcam" autoplay playsinline webkit-playsinline muted></video>
    <canvas id="output_canvas"></canvas>
    <div id="status-overlay">
      <div id="status-dot"></div>
      <span id="status-text">Iniciando cámara y MediaPipe...</span>
    </div>
    <div id="sign-badge">--</div>
  </div>

  <script>
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('output_canvas');
    const ctx = canvas.getContext('2d');
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    const signBadge = document.getElementById('sign-badge');

    let currentFacing = 'user';
    let handsDetector = null;
    let isProcessing = false;

    function sendToRN(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    function setStatus(msg, color = '#F1C40F') {
      statusText.innerText = msg;
      statusDot.style.backgroundColor = color;
      statusDot.style.boxShadow = '0 0 8px ' + color;
      sendToRN({ type: 'STATUS', status: msg });
    }

    // =========================================================================
    // CLASIFICADOR GEOMÉTRICO LESCO DE ALTA VELOCIDAD (ON-DEVICE 30 FPS)
    // =========================================================================
    function classifyLesco(landmarks) {
      if (!landmarks || landmarks.length < 21) return null;

      const rawDist = (i, j) => {
        const dx = landmarks[i].x - landmarks[j].x;
        const dy = landmarks[i].y - landmarks[j].y;
        return Math.sqrt(dx * dx + dy * dy);
      };

      const handScale = rawDist(0, 9);
      if (handScale < 0.05) return null;
      const dist = (i, j) => rawDist(i, j) / handScale;

      const isIndexExt = dist(8, 0) > dist(6, 0) * 1.15 && landmarks[8].y < landmarks[6].y;
      const isIndexCurled = dist(8, 0) < dist(6, 0) * 0.95 || landmarks[8].y > landmarks[6].y;

      const isMiddleExt = dist(12, 0) > dist(10, 0) * 1.15 && landmarks[12].y < landmarks[10].y;
      const isMiddleCurled = dist(12, 0) < dist(10, 0) * 0.95 || landmarks[12].y > landmarks[10].y;

      const isRingExt = dist(16, 0) > dist(14, 0) * 1.15 && landmarks[16].y < landmarks[14].y;
      const isRingCurled = dist(16, 0) < dist(14, 0) * 0.95 || landmarks[16].y > landmarks[14].y;

      const isPinkyExt = dist(20, 0) > dist(18, 0) * 1.15 && landmarks[20].y < landmarks[18].y;
      const isPinkyCurled = dist(20, 0) < dist(18, 0) * 0.95 || landmarks[20].y > landmarks[18].y;

      const isThumbOpenLateral = dist(4, 5) > 0.55 && dist(4, 9) > 0.65;
      const isThumbUpright = dist(4, 5) < 0.45 && landmarks[4].y < landmarks[5].y;
      const isThumbTucked = dist(4, 9) < 0.42 || dist(4, 13) < 0.45;

      const dThumbIndex = dist(4, 8);
      const dThumbMiddle = dist(4, 12);
      const dIndexMiddle = dist(8, 12);
      const dIndexHoriz = Math.abs(landmarks[8].y - landmarks[5].y) < 0.12 && Math.abs(landmarks[8].x - landmarks[5].x) > 0.25;

      // 1. L: Índice arriba, pulgar a 90°
      if (isIndexExt && isMiddleCurled && isRingCurled && isPinkyCurled && isThumbOpenLateral) {
        return { letter: 'L', confidence: 99 };
      }
      // 2. I: Solo meñique arriba
      if (!isIndexExt && isMiddleCurled && isRingCurled && isPinkyExt && !isThumbOpenLateral) {
        return { letter: 'I', confidence: 98 };
      }
      // 3. Y: Shaka (pulgar y meñique abiertos)
      if (isPinkyExt && isThumbOpenLateral && isIndexCurled && isMiddleCurled && isRingCurled) {
        return { letter: 'Y', confidence: 98 };
      }
      // 4. V: Índice y medio en V abierta
      if (isIndexExt && isMiddleExt && isRingCurled && isPinkyCurled && dIndexMiddle > 0.35) {
        return { letter: 'V', confidence: 98 };
      }
      // 5. U: Índice y medio juntos pegados
      if (isIndexExt && isMiddleExt && isRingCurled && isPinkyCurled && dIndexMiddle <= 0.35) {
        return { letter: 'U', confidence: 96 };
      }
      // 6. K: V con pulgar en el medio
      if (isIndexExt && isMiddleExt && isRingCurled && isPinkyCurled && dist(4, 9) > 0.3 && dist(4, 9) < 0.6) {
        return { letter: 'K', confidence: 97 };
      }
      // 7. W: 3 dedos arriba
      if (isIndexExt && isMiddleExt && isRingExt && isPinkyCurled) {
        return { letter: 'W', confidence: 98 };
      }
      // 8. B: 4 dedos arriba juntos, pulgar doblado sobre palma
      if (isIndexExt && isMiddleExt && isRingExt && isPinkyExt && isThumbTucked) {
        return { letter: 'B', confidence: 99 };
      }
      // 9. F: Círculo índice-pulgar, 3 dedos arriba
      if (dThumbIndex < 0.30 && isMiddleExt && isRingExt && isPinkyExt) {
        return { letter: 'F', confidence: 98 };
      }
      // 10. D: Solo índice arriba
      if (isIndexExt && isMiddleCurled && isRingCurled && isPinkyCurled && (dThumbMiddle < 0.40 || !isThumbOpenLateral)) {
        return { letter: 'D', confidence: 97 };
      }
      // 11. O: Círculo cerrado
      if (isIndexCurled && isMiddleCurled && dThumbIndex < 0.28 && dThumbMiddle < 0.32) {
        return { letter: 'O', confidence: 97 };
      }
      // 12. C: Curva en C
      if (!isIndexExt && !isMiddleExt && dThumbIndex >= 0.35 && dThumbIndex <= 0.90) {
        return { letter: 'C', confidence: 96 };
      }
      // 13. A: Puño cerrado con pulgar erguido
      if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && isThumbUpright) {
        return { letter: 'A', confidence: 97 };
      }
      // 14. S: Puño cerrado con pulgar al frente
      if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && dist(4, 10) < 0.35) {
        return { letter: 'S', confidence: 96 };
      }
      // 15. E: Dedos doblados sobre el pulgar
      if (isIndexCurled && isMiddleCurled && isRingCurled && isPinkyCurled && dThumbIndex < 0.32) {
        return { letter: 'E', confidence: 95 };
      }
      // 16. CH / H: Horizontales
      if (dIndexHoriz && isRingCurled && isPinkyCurled) {
        return { letter: 'CH', confidence: 95 };
      }
      // 17. M: 3 dedos hacia abajo
      if (landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y && landmarks[16].y > landmarks[14].y && isPinkyCurled) {
        return { letter: 'M', confidence: 95 };
      }
      // 18. N / Ñ: 2 dedos hacia abajo
      if (landmarks[8].y > landmarks[6].y && landmarks[12].y > landmarks[10].y && isRingCurled && isPinkyCurled) {
        return { letter: 'N', confidence: 95 };
      }

      return null;
    }

    const HAND_CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4],
      [0, 5], [5, 6], [6, 7], [7, 8],
      [5, 9], [9, 10], [10, 11], [11, 12],
      [9, 13], [13, 14], [14, 15], [15, 16],
      [13, 17], [17, 18], [18, 19], [19, 20],
      [0, 17]
    ];

    function drawSkeleton(landmarks, letter) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!landmarks || landmarks.length < 21) return;

      const w = canvas.width;
      const h = canvas.height;

      // Líneas
      ctx.lineWidth = 4;
      ctx.strokeStyle = letter ? '#2ECC71' : '#5C7A5C';
      for (const [s, e] of HAND_CONNECTIONS) {
        ctx.beginPath();
        ctx.moveTo(landmarks[s].x * w, landmarks[s].y * h);
        ctx.lineTo(landmarks[e].x * w, landmarks[e].y * h);
        ctx.stroke();
      }

      // Puntos
      for (let i = 0; i < landmarks.length; i++) {
        const isTip = [4, 8, 12, 16, 20].includes(i);
        ctx.beginPath();
        ctx.arc(landmarks[i].x * w, landmarks[i].y * h, isTip ? 7 : 4, 0, 2 * Math.PI);
        ctx.fillStyle = isTip ? '#B5551A' : '#FFFFFF';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = letter ? '#2ECC71' : '#5C7A5C';
        ctx.stroke();
      }
    }

    let voteBuffer = [];

    function onResults(results) {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const raw = results.multiHandLandmarks[0];
        const classification = classifyLesco(raw);
        const letter = classification ? classification.letter : null;

        drawSkeleton(raw, letter);

        statusDot.style.backgroundColor = '#2ECC71';
        statusDot.style.boxShadow = '0 0 8px #2ECC71';

        if (classification) {
          voteBuffer.push(classification.letter);
          if (voteBuffer.length > 4) voteBuffer.shift();

          const counts = {};
          let maxChar = classification.letter;
          let maxCount = 0;
          for (const char of voteBuffer) {
            counts[char] = (counts[char] || 0) + 1;
            if (counts[char] > maxCount) {
              maxCount = counts[char];
              maxChar = char;
            }
          }

          if (maxCount >= 2) {
            statusText.innerText = '⚡ Seña: ' + maxChar + ' (' + classification.confidence + '%)';
            signBadge.style.display = 'block';
            signBadge.innerText = maxChar;

            sendToRN({
              detected: true,
              letter: maxChar,
              confidence: classification.confidence,
              landmarks: raw.map(p => ({ x: p.x, y: p.y }))
            });
          }
        } else {
          statusText.innerText = '✋ Mano detectada (30 FPS)';
          signBadge.style.display = 'none';
          sendToRN({
            detected: true,
            confidence: 50,
            landmarks: raw.map(p => ({ x: p.x, y: p.y }))
          });
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        statusDot.style.backgroundColor = '#F1C40F';
        statusDot.style.boxShadow = '0 0 6px #F1C40F';
        statusText.innerText = 'Coloca tu mano frente a la cámara';
        signBadge.style.display = 'none';
        voteBuffer = [];
        sendToRN({ detected: false });
      }
    }

    async function initDetector() {
      try {
        setStatus('Abriendo cámara...', '#F1C40F');

        video.setAttribute('autoplay', '');
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.muted = true;

        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: currentFacing,
              width: { ideal: 640 },
              height: { ideal: 480 }
            },
            audio: false
          });
        } catch (e1) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: currentFacing },
              audio: false
            });
          } catch (e2) {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false
            });
          }
        }

        video.srcObject = stream;
        await video.play();

        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        setStatus('Cargando MediaPipe...', '#F1C40F');

        handsDetector = new Hands({
          locateFile: (file) => 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file,
        });

        handsDetector.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        handsDetector.onResults(onResults);
        setStatus('⚡ MediaPipe Activo (30 FPS)', '#2ECC71');

        async function processFrameLoop() {
          if (!video.paused && video.readyState >= 2 && !isProcessing && handsDetector) {
            isProcessing = true;
            try {
              await handsDetector.send({ image: video });
            } catch (e) {}
            isProcessing = false;
          }
          requestAnimationFrame(processFrameLoop);
        }

        requestAnimationFrame(processFrameLoop);
      } catch (err) {
        const errStr = err.name ? (err.name + ': ' + err.message) : String(err);
        setStatus('⚠️ Error de cámara: ' + errStr, '#E74C3C');
        sendToRN({ type: 'ERROR', error: errStr });
      }
    }

    // Receptor de mensajes desde React Native
    window.addEventListener('message', function(event) {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'FLIP_CAMERA') {
          currentFacing = currentFacing === 'user' ? 'environment' : 'user';
          if (video.srcObject) {
            video.srcObject.getTracks().forEach(t => t.stop());
          }
          initDetector();
        } else if (msg.type === 'RELOAD') {
          initDetector();
        }
      } catch (e) {}
    });

    // Iniciar
    if (document.readyState === 'complete') {
      initDetector();
    } else {
      window.addEventListener('load', initDetector);
    }
  </script>
</body>
</html>
`;

export const MediaPipeNativeVision = forwardRef<MediaPipeNativeVisionRef, MediaPipeNativeVisionProps>(
  ({ onHandDetected, isCameraActive = true, facing = 'front' }, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      toggleCamera: () => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: 'FLIP_CAMERA' }));
        }
      },
      flipFacing: (nextFacing: 'front' | 'back') => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: 'FLIP_CAMERA', facing: nextFacing }));
        }
      },
      reload: () => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: 'RELOAD' }));
        }
      },
    }));

    if (!isCameraActive) {
      return (
        <View style={styles.pausedContainer}>
          <Text style={styles.pausedIcon}>📹</Text>
          <Text style={styles.pausedText}>Cámara pausada</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: MEDIAPIPE_HTML, baseUrl: 'https://localhost' }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          // @ts-ignore
          mediaCapturePermissionGrantType="grant"
          androidLayerType="hardware"
          mixedContentMode="always"
          // @ts-ignore
          onPermissionRequest={(event: any) => {
            try {
              if (event?.nativeEvent?.grant) {
                event.nativeEvent.grant(event.nativeEvent.resources || []);
              } else if (event?.grant) {
                event.grant(event.resources || []);
              }
            } catch (e) {
              console.warn('onPermissionRequest error:', e);
            }
          }}
          onMessage={(event: any) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (onHandDetected) {
                onHandDetected(data);
              }
            } catch (e) {}
          }}
        />
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1E1712',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pausedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1E1712',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  pausedIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  pausedText: {
    color: '#EDE3D2',
    fontSize: 14,
    fontWeight: '700',
  },
});
