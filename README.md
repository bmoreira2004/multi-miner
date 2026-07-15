# Multi Miner — XMR + WOW + Lightning

App React Native (Expo, dev-client) com:
- Mineração CPU real (RandomX) de **Monero (XMR)** e **Wownero (WOW)**, com
  seletor de moeda e de pool, conexão Stratum real via TCP.
- Aba **Carteira**: saldo minerado real (consultado direto na API da pool) +
  campo para transferência para outra carteira (delegada a wallet externa,
  por segurança de chave privada — ver aviso na tela).
- Aba **Lightning**: carteira Lightning real e não-custodial via **Breez SDK**
  (enviar/receber pagamentos de verdade).
- Sem anúncios.

## Versão web

Uma versão de navegador está publicada em:
**https://bmoreira2004.github.io/multi-miner/**

Ela prioriza o que é genuinamente real fora do app mobile: consulta de saldo
ao vivo, benchmark real de hashing RandomX via WASM, e pagamentos Lightning
via WebLN (extensão Alby). Código-fonte em `web/`, com README próprio
explicando por que a mineração ali não se conecta a uma pool (limitação de
navegador — veja `web/README.md`).

## Status deste pacote

✅ Testado com Jest (21 testes, 4 suítes, todos passando) — protocolo Stratum,
   lista de pools, API de saldo e bridge de mineração nativa.
✅ Lógica de UI, navegação, wallet e Lightning completas.
⚠️ **Núcleo de hashing RandomX real**: precisa ser compilado por você
   localmente via Android NDK (ver `src/native/README_NATIVE_MINING.md`).
   Sem isso, o app roda em modo "stub" — conecta na pool de verdade, recebe
   jobs de verdade, mas não gera hashrate (deixado assim de propósito, para
   nunca fingir mineração que não está acontecendo).
⚠️ **Breez API key**: crie a sua gratuitamente em
   https://breez.technology/request-api-key/ e configure em
   `src/lib/lightningClient.js` (ou variável de ambiente `BREEZ_API_KEY`).

## Por que o APK não vem pronto neste pacote

Este ambiente de geração de código não tem acesso de rede aos servidores da
Expo (EAS Build) nem ao Google Maven/Gradle necessários para compilar um
projeto Android nativo (o app usa `react-native-tcp-socket` e um módulo
nativo próprio, então **não roda no Expo Go** — precisa de dev client ou
build standalone). Isso não é uma limitação do código, é do ambiente onde
foi gerado.

## Como gerar o APK de teste (na sua máquina)

### Opção A — EAS Build (mais simples, na nuvem da Expo)
```bash
npm install -g eas-cli
cd multi-miner
eas login
eas build:configure
eas build --platform android --profile preview
```
Ao final, a Expo te dá um link de download do `.apk` (ou `.aab` para a Play
Store).

### Opção B — Build local com Android Studio
```bash
npx expo prebuild        # gera as pastas android/ e ios/
cd android
./gradlew assembleDebug  # gera o APK debug para testar no celular
```
O APK fica em `android/app/build/outputs/apk/debug/app-debug.apk`.

### Antes de qualquer build:
1. Compile o núcleo nativo RandomX (ver `src/native/README_NATIVE_MINING.md`)
   e coloque o `.so` em `android/app/src/main/jniLibs/arm64-v8a/`.
2. Configure sua `BREEZ_API_KEY` em `src/lib/lightningClient.js`.

## Publicação nas lojas

- **Google Play**: permitido, mas declare claramente que o app minera
  criptomoeda (Play Console → Conteúdo do app → Declaração de mineração).
- **App Store (iOS)**: mineração só é aceita em primeiro plano, com o app
  aberto — já implementado aqui (a mineração para sozinha ao ir para
  background). Ainda assim, a Apple analisa esses apps com rigor extra;
  não há garantia de aprovação.

## Rodar os testes
```bash
npm install
npm test
```
