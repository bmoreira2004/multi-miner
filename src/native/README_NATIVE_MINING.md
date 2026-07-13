# Núcleo de mineração real (RandomX) — build nativo obrigatório

## Por que isso não vem pré-compilado

RandomX (o algoritmo do Monero e Wownero) é projetado para rodar bem em CPU,
mas só tem performance útil quando compilado nativamente em C++ com otimizações
específicas de arquitetura (AES-NI, JIT de VM RandomX). Não existe forma de
rodar isso em JavaScript/WASM puro com hashrate que valha a pena minerar —
por isso qualquer "minerador" que só usa JS/WebView está, na prática, decorativo.

O caminho real, usado por todo minerador Android sério, é:

```
XMRig (C++) --[Android NDK / CMake]--> libxmrig-core.so (arm64-v8a)
                                            |
                                    JNI bridge (Kotlin/Java)
                                            |
                              React Native TurboModule / Native Module
                                            |
                                    JS (este projeto)
```

## Passo a passo para você compilar (na sua máquina, com Android Studio + NDK)

1. Clone o XMRig oficial:
   ```
   git clone https://github.com/xmrig/xmrig.git
   ```

2. Instale o Android NDK (via Android Studio > SDK Manager > SDK Tools > NDK).

3. Compile para arm64-v8a usando o toolchain do NDK:
   ```
   cd xmrig
   mkdir build && cd build
   cmake .. -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
            -DANDROID_ABI=arm64-v8a \
            -DANDROID_PLATFORM=android-24 \
            -DXMRIG_OS=android
   make -j$(nproc)
   ```
   Isso gera uma lib estática/compartilhada com o núcleo de hashing RandomX.

4. Copie o `.so` resultante para:
   ```
   android/app/src/main/jniLibs/arm64-v8a/libxmrig-core.so
   ```

5. Use o esqueleto `android/RandomXBridge.kt` (neste diretório) como ponte JNI —
   ele expõe `startMining()`, `stopMining()` e um callback de hashrate/share
   para o lado JS via `NativeEventEmitter`.

6. No JS, o `src/lib/nativeMiningBridge.js` (neste projeto) já está preparado
   para chamar esse módulo nativo assim que ele existir — hoje ele cai no modo
   `stub` (ver arquivo) e apenas simula, deixando isso bem visível na UI.

## Aviso importante sobre bateria e políticas de loja

Mineração contínua em segundo plano é pesada (CPU 100%, aquecimento, bateria).
A Google Play tem políticas específicas contra apps que minerem criptomoeda
sem que isso seja o propósito central e transparente do app (Play Console >
Restricted Content > Mobile Unwanted Software). Como aqui a mineração É o
propósito declarado do app, isso é permitido, mas o app precisa:
- Deixar claríssimo para o usuário que a mineração consome bateria/CPU.
- Não minerar em segundo plano escondido do usuário.
- Ter um botão visível de start/stop (implementado neste projeto).

A Apple, por outro lado, **proíbe mineração de criptomoeda em background** nas
diretrizes da App Store (seção 2.4.2). Um app assim pode ser aprovado para
iOS apenas se a mineração ocorrer somente em primeiro plano, com o app aberto
e visível — o que este projeto já respeita (mineração para automaticamente
se o app vai para background, ver `MiningScreen.js`).
