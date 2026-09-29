import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

// ── Ref pública ─────────────────────────────────────────────────────────────
export interface MediaPipeNativeVisionRef {
  toggleCamera: () => void;
  flipFacing: (facing: 'front' | 'back') => void;
  reload: () => void;
  /** Envía un frame base64 al WebView para que MediaPipe lo procese */
  sendFrame: (imageDataUrl: string) => void;
}

interface MediaPipeNativeVisionProps {
  onHandDetected: (result: {
    detected: boolean;
    letter?: string;
    confidence?: number;
    landmarks?: Array<{ x: number; y: number }>;
    status?: string;
    error?: string;
    type?: string;
  }) => void;
  isCameraActive?: boolean;
  facing?: 'front' | 'back';
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML del procesador MediaPipe — NO abre cámara, procesa frames vía Canvas
// inyectados como base64 desde React Native vía postMessage
// ─────────────────────────────────────────────────────────────────────────────
const MEDIAPIPE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MediaPipe Processor</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    #canvas { width: 100%; height: 100%; object-fit: cover; }
    #input-frame { position: fixed; top: -9999px; left: -9999px; opacity: 0; }
  </style>
</head>
<body>
  <canvas id="canvas" width="320" height="240"></canvas>
  <img id="input-frame" crossorigin="anonymous" />

  <script>
    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    var inputImg = document.getElementById('input-frame');

    var handsDetector = null;
    var isProcessing = false;
    var isReady = false;
    var frameCount = 0;
    var voteBuffer = [];
    var VOTE_WINDOW = 4;

    function sendToRN(data) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        }
      } catch(e) {}
    }

    function setStatus(msg) {
      sendToRN({ type: 'STATUS', status: msg });
    }

    function loadScript(url) {
      return new Promise(function(resolve, reject) {
        var s = document.createElement('script');
        s.src = url;
        s.crossOrigin = 'anonymous';
        s.onload = resolve;
        s.onerror = function() { reject(new Error('Fallo cargando: ' + url)); };
        document.head.appendChild(s);
      });
    }

    var CDN_BASE = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/';

    async function loadAndInit() {
      try {
        setStatus('⏳ Descargando MediaPipe...');
        try {
          await loadScript(CDN_BASE + 'hands.js');
        } catch(e) {
          await loadScript('https://unpkg.com/@mediapipe/hands@0.4.1646424915/hands.js');
        }

        var HandsClass = window.Hands;
        if (!HandsClass) throw new Error('Hands no disponible en ventana');

        handsDetector = new HandsClass({
          locateFile: function(file) {
            return CDN_BASE + file;
          }
        });

        handsDetector.setOptions({
          maxNumHands: 1,
          modelComplexity: 0,
          minDetectionConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });

        handsDetector.onResults(onResults);
        isReady = true;

        setStatus('⚡ Motor local listo — Muestra tu mano');
        sendToRN({ type: 'READY' });
      } catch(err) {
        var msg = err.message || String(err);
        setStatus('⚠️ Error MediaPipe: ' + msg);
        sendToRN({ type: 'ERROR', error: msg });
      }
    }

    // Clasificador geométrico LESCO dentro de WebView
    function dist(a, b) {
      return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    }
    function isExtended(tip, pip, mcp) {
      return tip.y < pip.y - 0.01;
    }
    function classifyLesco(lm) {
      if (!lm || lm.length < 21) return null;
      var thumb  = { tip: lm[4],  ip: lm[3],  mcp: lm[2]  };
      var index  = { tip: lm[8],  pip: lm[6], mcp: lm[5]  };
      var middle = { tip: lm[12], pip: lm[10], mcp: lm[9] };
      var ring   = { tip: lm[16], pip: lm[14], mcp: lm[13] };
      var pinky  = { tip: lm[20], pip: lm[18], mcp: lm[17] };

      var ie = isExtended(index.tip,  index.pip,  index.mcp);
      var me = isExtended(middle.tip, middle.pip, middle.mcp);
      var re = isExtended(ring.tip,   ring.pip,   ring.mcp);
      var pe = isExtended(pinky.tip,  pinky.pip,  pinky.mcp);

      if (!ie && !me && !re && !pe) {
        var d = dist(thumb.tip, index.tip);
        if (d < 0.07) return { letter: 'A', confidence: 88 };
        return { letter: 'S', confidence: 80 };
      }
      if (ie && !me && !re && !pe) return { letter: 'D', confidence: 85 };
      if (ie && me && !re && !pe) return { letter: 'U', confidence: 85 };
      if (ie && me && re && !pe) return { letter: 'W', confidence: 85 };
      if (ie && me && re && pe)  return { letter: 'B', confidence: 90 };
      if (!ie && !me && !re && pe) return { letter: 'I', confidence: 85 };
      if (ie && !me && !re && pe) return { letter: 'H', confidence: 80 };
      if (!ie && me && !re && !pe) return { letter: 'M', confidence: 75 };
      return { letter: '?', confidence: 50 };
    }

    function onResults(results) {
      if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        voteBuffer = [];
        sendToRN({ detected: false });
        return;
      }
      var lm = results.multiHandLandmarks[0];
      var classification = classifyLesco(lm);
      if (classification && classification.letter !== '?') {
        voteBuffer.push(classification.letter);
        if (voteBuffer.length > VOTE_WINDOW) voteBuffer.shift();

        var freq = {};
        var best = voteBuffer[0], bestCount = 0;
        for (var i = 0; i < voteBuffer.length; i++) {
          var l = voteBuffer[i];
          freq[l] = (freq[l] || 0) + 1;
          if (freq[l] > bestCount) { bestCount = freq[l]; best = l; }
        }
        var conf = Math.round((bestCount / voteBuffer.length) * 100);

        sendToRN({
          detected: true,
          letter: best,
          confidence: conf,
          landmarks: lm.map(function(p) { return { x: p.x, y: p.y }; }),
        });
      } else {
        sendToRN({
          detected: true,
          letter: null,
          confidence: 0,
          landmarks: lm.map(function(p) { return { x: p.x, y: p.y }; }),
        });
      }
    }

    async function processFrame(imageDataUrl) {
      if (!isReady || !handsDetector) {
        return;
      }
      if (isProcessing) return;
      isProcessing = true;
      frameCount++;

      try {
        await new Promise(function(resolve, reject) {
          var timer = setTimeout(function() { reject(new Error('Timeout de imagen')); }, 3000);
          inputImg.onload = function() {
            clearTimeout(timer);
            resolve();
          };
          inputImg.onerror = function() {
            clearTimeout(timer);
            reject(new Error('Error de decodificación'));
          };
          inputImg.src = imageDataUrl;
        });

        canvas.width = inputImg.naturalWidth || 320;
        canvas.height = inputImg.naturalHeight || 240;
        ctx.drawImage(inputImg, 0, 0, canvas.width, canvas.height);

        await handsDetector.send({ image: canvas });
      } catch(e) {
        // Enviar feedback solo si es error real de procesamiento
        if (frameCount % 10 === 0) {
          sendToRN({ type: 'STATUS', status: '⚡ Local: Analizando... (frame ' + frameCount + ')' });
        }
      } finally {
        isProcessing = false;
      }
    }

    function handleMsg(event) {
      try {
        var rawData = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        var msg = JSON.parse(rawData);
        if (msg.type === 'PROCESS_FRAME' && msg.imageData) {
          processFrame(msg.imageData);
        } else if (msg.type === 'RELOAD') {
          loadAndInit();
        }
      } catch(e) {}
    }
    window.addEventListener('message', handleMsg);
    document.addEventListener('message', handleMsg);

    if (document.readyState === 'complete') {
      loadAndInit();
    } else {
      window.addEventListener('load', loadAndInit);
    }
  </script>
</body>
</html>
`;

export const MediaPipeNativeVision = forwardRef<MediaPipeNativeVisionRef, MediaPipeNativeVisionProps>(
  ({ onHandDetected, isCameraActive = true }, ref) => {
    const webViewRef = useRef<WebView>(null);

    useImperativeHandle(ref, () => ({
      toggleCamera: () => {},
      flipFacing: (_facing: 'front' | 'back') => {},
      reload: () => {
        if (webViewRef.current) {
          webViewRef.current.postMessage(JSON.stringify({ type: 'RELOAD' }));
        }
      },
      sendFrame: (imageDataUrl: string) => {
        if (webViewRef.current && isCameraActive) {
          webViewRef.current.postMessage(
            JSON.stringify({ type: 'PROCESS_FRAME', imageData: imageDataUrl })
          );
        }
      },
    }));

    if (!isCameraActive) return null;

    return (
      <View style={styles.hiddenContainer} pointerEvents="none">
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: MEDIAPIPE_HTML, baseUrl: 'https://cdn.jsdelivr.net' }}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowUniversalAccessFromFileURLs={true}
          androidLayerType="hardware"
          mixedContentMode="always"
          onError={(e: any) => {
            console.warn('[MediaPipe WebView Error]', e.nativeEvent);
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
  hiddenContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    opacity: 0.05,
    zIndex: 1,
  },
  webview: {
    width: 8,
    height: 8,
    backgroundColor: '#000',
  },
});
