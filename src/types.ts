/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type QRDataType = 'url' | 'text' | 'wifi' | 'email' | 'phone';

export interface WiFiData {
  ssid: string;
  password?: string;
  encryption: 'WEP' | 'WPA' | 'nopass';
}

export interface EmailData {
  recipient: string;
  subject?: string;
  body?: string;
}

export interface PhoneData {
  phoneNumber: string;
}

export interface QRConfig {
  text: string;
  dataType: QRDataType;
  fgColor: string;
  bgColor: string;
  eyeColor: string;
  logoType: 'none' | 'preset' | 'custom';
  presetLogoId?: string;
  customLogoUrl?: string; // base64 string
  logoSize: number; // 0.1 to 0.3
  logoPadding: number; // 0 to 12 px
  drawBadge: boolean;
  badgeBgColor: string;
  badgeBorderRadius: number; // radius in px
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

export interface PresetTheme {
  id: string;
  name: string;
  fgColor: string;
  bgColor: string;
  eyeColor: string;
  badgeBgColor: string;
  description: string;
}

export interface SavedQRCode {
  id: string;
  title: string;
  text: string;
  dataType: QRDataType;
  config: QRConfig;
  createdAt: string;
}

export interface UserSubscription {
  isPremium: boolean;
  generationsCount: number;
  maxFreeGenerations: number;
  resetDate: string; // ISO String
}
