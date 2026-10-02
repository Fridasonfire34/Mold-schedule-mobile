import axios from 'axios';
import { Platform } from 'react-native';

// tafco-main (Next.js) serves the mobile endpoints under
// src/app/api-mobile/molds. Debug builds reach the `yarn dev` server on the
// development PC: a device as localhost, forwarded over adb (`yarn wifi`,
// `yarn reverse`); the Android emulator at 10.0.2.2, its fixed alias for the
// PC — no forwarding to lose when adb restarts.
//
// Release builds (the APK) go over the Wi-Fi to RELEASE_SERVER:
//   - testPc: the development PC's `yarn dev` server (dev database),
//     to test the APK away from the computer. Its IP can change; check it
//     with `ipconfig` if the app says "No connection".
//   - plant: the plant server, which only has these endpoints once a
//     new tafco-main release is deployed there. Switch to it before handing
//     the APK to the plant.
const isAndroidEmulator =
  Platform.OS === 'android' &&
  /sdk_gphone|generic|emulator/i.test(String(Platform.constants.Fingerprint ?? ''));
const DEV_SERVER = isAndroidEmulator ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const SERVERS = {
  testPc: 'http://192.168.15.155:3000',
  plant: 'http://192.168.15.167:3000',
};
const RELEASE_SERVER = SERVERS.testPc; // SERVERS.plant for the plant

export const API_BASE_URL = `${__DEV__ ? DEV_SERVER : RELEASE_SERVER}/api-mobile/molds`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

export default api;
