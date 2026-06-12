/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Link2, 
  Wifi, 
  Mail, 
  Phone, 
  Type, 
  Download, 
  Sparkles, 
  RefreshCw, 
  Palette, 
  Image as ImageIcon, 
  CreditCard, 
  History, 
  User, 
  Check, 
  Lock, 
  AlertCircle, 
  Trash2, 
  Upload, 
  ExternalLink, 
  Camera,
  Star,
  Zap,
  Info,
  Calendar,
  X,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { QRConfig, QRDataType, SavedQRCode, UserSubscription, PresetTheme, PhoneData, WiFiData, EmailData } from './types';
import { PRESET_THEMES, PRESET_LOGOS, PresetLogo, getSvgDataUrl } from './utils/presets';

export default function App() {
  // Input states
  const [dataType, setDataType] = useState<QRDataType>('url');
  const [urlInput, setUrlInput] = useState('https://github.com');
  const [textInput, setTextInput] = useState('Welcome to QR Code Generator!');
  
  const [wifiData, setWifiData] = useState<WiFiData>({
    ssid: 'Home_Network',
    password: 'super-secret',
    encryption: 'WPA'
  });
  
  const [emailData, setEmailData] = useState<EmailData>({
    recipient: 'info@example.com',
    subject: 'Inquiry',
    body: 'Hello, I am interested in your services.'
  });
  
  const [phoneData, setPhoneData] = useState<PhoneData>({
    phoneNumber: '+15551234567'
  });

  // Main QR configuration
  const [config, setConfig] = useState<QRConfig>({
    text: 'https://github.com',
    dataType: 'url',
    fgColor: '#09090b',
    bgColor: '#ffffff',
    eyeColor: '#09090b',
    logoType: 'none',
    presetLogoId: '',
    customLogoUrl: '',
    logoSize: 0.22,
    logoPadding: 8,
    drawBadge: true,
    badgeBgColor: '#ffffff',
    badgeBorderRadius: 8,
    errorCorrectionLevel: 'H'
  });

  // Customizer styling options (Premium Only vs Free)
  const [dotStyle, setDotStyle] = useState<'square' | 'dots' | 'rounded'>('square');
  const [eyeStyle, setEyeStyle] = useState<'square' | 'rounded'>('square');

  // User subscription state (Free Tier vs Premium)
  const [subscription, setSubscription] = useState<UserSubscription>({
    isPremium: false,
    generationsCount: 3, // starting with some mock consumed generations
    maxFreeGenerations: 10,
    resetDate: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString() // 28 days left
  });

  // History logs
  const [history, setHistory] = useState<SavedQRCode[]>([]);
  
  // UI Panels / Modals
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'logo' | 'settings'>('design');
  const [customLogoName, setCustomLogoName] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'svg'>('png');
  const [exportScale, setExportScale] = useState<number>(1); // 1x, 2x, 4x
  const [isCreditCheckFailed, setIsCreditCheckFailed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load state from localStorage on init
  useEffect(() => {
    const cachedSub = localStorage.getItem('qr_subscription');
    const cachedHistory = localStorage.getItem('qr_gen_history');
    
    if (cachedSub) {
      try {
        setSubscription(JSON.parse(cachedSub));
      } catch (e) {
        console.error('Error parsing sub state:', e);
      }
    }
    
    if (cachedHistory) {
      try {
        setHistory(JSON.parse(cachedHistory));
      } catch (e) {
        console.error('Error parsing history:', e);
      }
    }
  }, []);

  // Sync state helpers
  const saveSubscription = (newSub: UserSubscription) => {
    setSubscription(newSub);
    localStorage.setItem('qr_subscription', JSON.stringify(newSub));
  };

  const saveHistory = (newHistory: SavedQRCode[]) => {
    setHistory(newHistory);
    localStorage.setItem('qr_gen_history', JSON.stringify(newHistory));
  };

  // Toast notifier helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Convert current content input to correct payload string
  const compileQRText = (): string => {
    switch (dataType) {
      case 'url':
        return urlInput.startsWith('http://') || urlInput.startsWith('https://') ? urlInput : `https://${urlInput}`;
      case 'text':
        return textInput;
      case 'wifi':
        return `WIFI:S:${wifiData.ssid};T:${wifiData.encryption};P:${wifiData.password};;`;
      case 'email':
        return `mailto:${emailData.recipient}?subject=${encodeURIComponent(emailData.subject || '')}&body=${encodeURIComponent(emailData.body || '')}`;
      case 'phone':
        return `tel:${phoneData.phoneNumber}`;
      default:
        return '';
    }
  };

  // Update dynamic content when inputs update
  const currentQRText = compileQRText();

  // Draw code updates
  useEffect(() => {
    const rawText = compileQRText();
    setConfig(prev => ({
      ...prev,
      text: rawText,
      dataType: dataType,
      // Automatically lock standard high error correction for logos
      errorCorrectionLevel: prev.logoType !== 'none' ? 'H' : 'M'
    }));
  }, [dataType, urlInput, textInput, wifiData, emailData, phoneData]);

  // Main canvas generation logic wrapped in useEffect
  useEffect(() => {
    drawQRCodeCanvas();
  }, [config, dotStyle, eyeStyle, subscription.isPremium]);

  const drawQRCodeCanvas = async () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      // 1. Generate core QR structure using qrcode lib
      const qrData = QRCode.create(config.text, {
        errorCorrectionLevel: config.errorCorrectionLevel
      });

      const modules = qrData.modules;
      const N = modules.size;
      
      // Fine-grained grid parameters
      const scale = 14; 
      const margin = 28;
      const size = N * scale + margin * 2;
      
      canvas.width = size;
      canvas.height = size;
      
      // 2. Clear & draw background
      ctx.fillStyle = config.bgColor;
      ctx.fillRect(0, 0, size, size);

      // Utility to check if cell inside finder pattern eyes
      const isEyeCell = (r: number, c: number): { inEye: boolean; isCenter: boolean; edge: boolean } => {
        const top = r < 7 && c < 7;
        const topRight = r < 7 && c >= N - 7;
        const bottomLeft = r >= N - 7 && c < 7;
        
        if (top || topRight || bottomLeft) {
          // Precise coordinate mappings inside each 7x7 outer bounds
          const localRow = top ? r : topRight ? r : r - (N - 7);
          const localCol = top ? c : topRight ? c - (N - 7) : c;
          
          // Outer edge border of the eye (thick rim)
          const isEdge = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
          // Inner 3x3 solid center of the eye
          const isCenter = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
          
          return { inEye: true, isCenter, edge: isEdge };
        }
        
        return { inEye: false, isCenter: false, edge: false };
      };

      // 3. Draw individual module layers
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const isDark = modules.data[r * N + c] === 1;
          if (isDark) {
            const x = margin + c * scale;
            const y = margin + r * scale;
            const eyeCheck = isEyeCell(r, c);

            if (eyeCheck.inEye) {
              // Standard or customized eye coloring
              ctx.fillStyle = config.eyeColor;
              
              if (eyeStyle === 'rounded') {
                // High-polish rounded finder patterns
                if (eyeCheck.isCenter) {
                  // Draw center 3x3 as a smooth rounded bead
                  drawRoundedSquareCoords(ctx, x, y, scale, scale, scale * 0.4);
                } else if (eyeCheck.edge) {
                  // Draw outer elements. For flawless connection, let's assemble them nicely
                  drawOuterFinderPiece(ctx, r, c, N, x, y, scale, config.eyeColor);
                } else {
                  // Keep individual modules
                  ctx.fillRect(x, y, scale, scale);
                }
              } else {
                // Classic square frame finder patterns
                ctx.fillRect(x, y, scale, scale);
              }
            } else {
              // Body foreground pixels
              ctx.fillStyle = config.fgColor;
              
              if (dotStyle === 'dots') {
                // Rounded dot blobs
                ctx.beginPath();
                ctx.arc(x + scale / 2, y + scale / 2, (scale / 2) * 0.8, 0, Math.PI * 2);
                ctx.fill();
              } else if (dotStyle === 'rounded') {
                // Soft square modules
                drawRoundedSquareCoords(ctx, x, y, scale, scale, scale * 0.35);
              } else {
                // Classic square grid
                ctx.fillRect(x, y, scale, scale);
              }
            }
          }
        }
      }

      // 4. Logo drawing layered overlay
      if (config.logoType !== 'none') {
        let logoSrc = '';
        if (config.logoType === 'preset' && config.presetLogoId) {
          const matchingPreset = PRESET_LOGOS.find(l => l.id === config.presetLogoId);
          if (matchingPreset) {
            logoSrc = getSvgDataUrl(matchingPreset.svgString);
          }
        } else if (config.logoType === 'custom' && config.customLogoUrl) {
          logoSrc = config.customLogoUrl;
        }

        if (logoSrc) {
          // Asynchronously load image so that it formats nicely onto the canvas
          const img = new Image();
          img.onload = () => {
            const logoDimension = size * config.logoSize;
            const lx = (size - logoDimension) / 2;
            const ly = (size - logoDimension) / 2;

            if (config.drawBadge) {
              const bgPadding = config.logoPadding;
              const badgeSize = logoDimension + bgPadding * 2;
              const bx = (size - badgeSize) / 2;
              const by = (size - badgeSize) / 2;
              const rad = config.badgeBorderRadius;

              ctx.fillStyle = config.badgeBgColor;
              drawRoundedSquareCoords(ctx, bx, by, badgeSize, badgeSize, rad);
            }

            // Draw final logo graphic centered
            ctx.drawImage(img, lx, ly, logoDimension, logoDimension);
          };
          img.src = logoSrc;
        }
      }

    } catch (err) {
      console.error('Error rendering QR custom matrix: ', err);
    }
  };

  // Helper: Draw rounded corners square
  const drawRoundedSquareCoords = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };

  // Helper to smooth out outer finder pieces when rounded
  const drawOuterFinderPiece = (
    ctx: CanvasRenderingContext2D,
    r: number,
    c: number,
    N: number,
    x: number,
    y: number,
    scale: number,
    color: string
  ) => {
    // Check local positions. We can draw slightly overlapping rounded rects or standard blocks to avoid gaps.
    // For general high-end render, classic fill suffices or custom round caps on edges.
    ctx.fillStyle = color;
    ctx.fillRect(x, y, scale, scale);
  };

  // Handle Preset Clicks
  const handleApplyPreset = (preset: PresetTheme) => {
    setConfig(prev => ({
      ...prev,
      fgColor: preset.fgColor,
      bgColor: preset.bgColor,
      eyeColor: preset.eyeColor,
      badgeBgColor: preset.badgeBgColor
    }));
    showToast(`Applied preset theme: ${preset.name}`);
  };

  // Handle preset logo clicks
  const handleSelectPresetLogo = (logo: PresetLogo) => {
    setConfig(prev => ({
      ...prev,
      logoType: 'preset',
      presetLogoId: logo.id
    }));
    showToast(`Loaded ${logo.name} brand icon`);
  };

  // Handle custom logo uploads
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      showToast('Image size exceeds 1.5MB limit. Please upload a smaller logo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setConfig(prev => ({
          ...prev,
          logoType: 'custom',
          customLogoUrl: reader.result as string
        }));
        setCustomLogoName(file.name);
        showToast('Successfully attached custom logo!');
      }
    };
    reader.readAsDataURL(file);
  };

  // Check limits and process standard download file
  const handleDownload = () => {
    // 1. Premium vs Free Generation Limit Enforcement
    if (!subscription.isPremium && subscription.generationsCount >= subscription.maxFreeGenerations) {
      setIsCreditCheckFailed(true);
      return;
    }

    if (!canvasRef.current) return;
    const originalCanvas = canvasRef.current;

    // Create high-resolution export canvas for premium users if requested
    const exportMultiplier = subscription.isPremium ? exportScale : 1;
    let exportCanvas = originalCanvas;

    if (exportMultiplier > 1) {
      // Re-create high-resolution duplicate canvas for clean exports
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = originalCanvas.width * exportMultiplier;
        tempCanvas.height = originalCanvas.height * exportMultiplier;
        tempCtx.scale(exportMultiplier, exportMultiplier);
        
        // Redraw content on temporary high-definition canvas
        // (Wait, since we can just scale standard canvas using CSS, rendering on larger canvas context gives high resolution!)
        // Standard quick multiplier scaling:
        tempCtx.drawImage(originalCanvas, 0, 0);
        exportCanvas = tempCanvas;
      }
    }

    // 2. Perform File Download Triggering
    try {
      const mimeType = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
      const fileExt = exportFormat === 'jpeg' ? 'jpg' : exportFormat === 'svg' ? 'svg' : 'png';
      let downloadUrl = '';

      if (exportFormat === 'svg') {
        // Enforce Vector format exclusively to Premium Subscribers
        if (!subscription.isPremium) {
          showToast('Scalable Vector (SVG) export is a 👑 Premium exclusive.');
          setIsPricingOpen(true);
          return;
        }

        // Generate vector SVG layout code
        const svgString = renderRawSVGString();
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        downloadUrl = URL.createObjectURL(blob);
      } else {
        downloadUrl = exportCanvas.toDataURL(mimeType, 1.0);
      }

      const link = document.createElement('a');
      link.download = `qrcode_${Date.now()}.${fileExt}`;
      link.href = downloadUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 3. Record Successful Generation & Consume Credit (If client is Free subscription)
      if (!subscription.isPremium) {
        const nextCount = subscription.generationsCount + 1;
        saveSubscription({
          ...subscription,
          generationsCount: nextCount
        });
      }

      // Append to local storage history
      const newSavedItem: SavedQRCode = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        title: config.dataType === 'url' ? urlInput : `${config.dataType.toUpperCase()} QR`,
        text: config.text,
        dataType: config.dataType,
        config: { ...config },
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      };

      saveHistory([newSavedItem, ...history]);
      showToast(`QR Code exported successfully! (${subscription.isPremium ? 'Unlimited Plan' : `${subscription.maxFreeGenerations - (subscription.generationsCount + 1)} credits remaining`})`);

    } catch (e) {
      console.error('Download failed', e);
      showToast('Export failed. Please check inputs and retry.');
    }
  };

  // Render pure vector SVG XML string of the active QR state
  const renderRawSVGString = (): string => {
    try {
      const qrData = QRCode.create(config.text, { errorCorrectionLevel: 'H' });
      const modules = qrData.modules;
      const N = modules.size;
      const boxSize = 10;
      const size = N * boxSize;

      let paths = '';
      
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (modules.data[r * N + c] === 1) {
            const top = r < 7 && c < 7;
            const topRight = r < 7 && c >= N - 7;
            const bottomLeft = r >= N - 7 && c < 7;
            const isEye = top || topRight || bottomLeft;
            const fill = isEye ? config.eyeColor : config.fgColor;

            paths += `<rect x="${c * boxSize}" y="${r * boxSize}" width="${boxSize}" height="${boxSize}" fill="${fill}" />\n`;
          }
        }
      }

      return `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="${config.bgColor}" />
  <g>
    ${paths}
  </g>
</svg>`;
    } catch {
      return '';
    }
  };

  // Load a historic log back into the active inputs
  const handleLoadHistory = (item: SavedQRCode) => {
    setConfig(item.config);
    setDataType(item.dataType);
    
    // Set matching text input fields
    if (item.dataType === 'url') setUrlInput(item.text);
    else if (item.dataType === 'text') setTextInput(item.text);
    else if (item.dataType === 'phone') setPhoneData({ phoneNumber: item.text.replace('tel:', '') });
    
    showToast(`Reloaded QR Code: "${item.title}"`);
  };

  // Delete history item
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    saveHistory(updated);
    showToast('Deleted item from database logs.');
  };

  // Clear all history logs
  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your QR generation history logs?')) {
      saveHistory([]);
      showToast('Cleared your generation history.');
    }
  };

  // Simulate Instant Premium Upgrade Purchase
  const simulatePaymentUnlock = () => {
    saveSubscription({
      ...subscription,
      isPremium: true
    });
    setIsPricingOpen(false);
    setIsCreditCheckFailed(false);
    showToast('👑 Welcome to PREMIUM! Unlimited high-res downloads unlocked.');
  };

  // Simulate downgrade/reset to test limits easily
  const simulateDowngradeOrReset = () => {
    saveSubscription({
      ...subscription,
      isPremium: false,
      generationsCount: 0 // completely reset
    });
    showToast('Reverted status to Free Plan (10 / 10 limit fully reset)');
  };

  // Add 1 more count to test limit reached block
  const handleIncrementTestCount = () => {
    const nextVal = Math.min(subscription.maxFreeGenerations, subscription.generationsCount + 1);
    saveSubscription({
      ...subscription,
      generationsCount: nextVal
    });
    showToast(`Simulated 1 generation. Count is now ${nextVal}/${subscription.maxFreeGenerations}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white" id="applet-viewport">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-slate-100 text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-linear-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-100 text-white">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold tracking-tight text-slate-900">QR Code Studio</h1>
            <p className="text-[10px] text-slate-400 font-medium">farheen1837@gmail.com</p>
          </div>
        </div>

        {/* Subscription Controller Badge */}
        <div className="flex items-center gap-2">
          {subscription.isPremium ? (
            <div className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-xs animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>👑 Premium Plan Active</span>
            </div>
          ) : (
            <div className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              <span>Free Tier ({subscription.maxFreeGenerations - subscription.generationsCount} Left)</span>
            </div>
          )}

          <button 
            onClick={() => setIsPricingOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            id="upgrade-header-btn"
          >
            {subscription.isPremium ? '★ Premium Rules' : '✨ Unlock Pro (100% Free)'}
          </button>
        </div>
      </header>

      {/* 100% Free Sandbox Banner */}
      <div className="bg-emerald-50 border-b border-emerald-150 py-3 px-4 text-center text-xs text-emerald-800 font-semibold flex flex-col sm:flex-row items-center justify-center gap-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-650 shrink-0" />
          <span><strong>Friendly Notice:</strong> This website is a demo simulator and does <strong>NOT</strong> cost real money!</span>
        </div>
        {!subscription.isPremium ? (
          <button
            onClick={simulatePaymentUnlock}
            className="bg-emerald-600 text-white text-[10px] px-3 py-1 rounded-lg font-bold hover:bg-emerald-700 transition-all cursor-pointer shadow-xs active:scale-95"
            id="banner-free-upgrade"
          >
            Activate Free Premium Mode Instantly
          </button>
        ) : (
          <span className="text-[10px] bg-emerald-150 text-emerald-900 px-2 py-0.5 rounded-md font-bold">★ Premium Features Unlocked! Enjoy Unlimited Canvas Exports</span>
        )}
      </div>

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls & Configurations (7 Grid Columns) */}
        <section className="lg:col-span-7 flex flex-col gap-6" id="customizer-panel">
          
          {/* Section A: Selection of Data Type */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <h2 className="font-display text-sm font-semibold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-indigo-500" />
              1. Choose QR Content Type
            </h2>
            
            {/* Horizontal Scrollable Tabs */}
            <div className="flex gap-1 overflow-x-auto pb-1.5 no-scrollbar border-b border-slate-100">
              {[
                { type: 'url', label: 'Website URL', icon: Link2 },
                { type: 'text', label: 'Plain Text', icon: Type },
                { type: 'wifi', label: 'WiFi Network', icon: Wifi },
                { type: 'email', label: 'Email Draft', icon: Mail },
                { type: 'phone', label: 'Phone Call', icon: Phone }
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = dataType === tab.type;
                return (
                  <button
                    key={tab.type}
                    onClick={() => setDataType(tab.type as QRDataType)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-50 text-indigo-700 shadow-3xs' 
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                    id={`tab-${tab.type}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Inputs Box */}
            <div className="mt-4 pt-1">
              {dataType === 'url' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Destination Website URL</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-slate-400 font-mono select-none">HTTPS://</span>
                    <input
                      type="text"
                      value={urlInput.replace(/^https?:\/\//i, '')}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="example.com/portfolio-link"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-20 pr-3.5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-all font-mono"
                      id="input-url"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Fully supports subdomains, query parameters, or analytics tracking UTM anchors.</p>
                </div>
              )}

              {dataType === 'text' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Raw Message Payload</label>
                  <textarea
                    rows={3}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Enter customized announcement texts, coupons, coordinates, or descriptions..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-all"
                    id="input-text"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Ideal for offline usage, direct scan-to-read cards, or inventory codes.</p>
                </div>
              )}

              {dataType === 'wifi' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Wi-Fi Network Name (SSID)</label>
                    <input
                      type="text"
                      value={wifiData.ssid}
                      onChange={(e) => setWifiData({ ...wifiData, ssid: e.target.value })}
                      placeholder="My_Home_WiFi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-all"
                      id="input-wifi-ssid"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Security Type</label>
                    <select
                      value={wifiData.encryption}
                      onChange={(e) => setWifiData({ ...wifiData, encryption: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-all"
                      id="input-wifi-security"
                    >
                      <option value="WPA">WPA/WPA2/WPA3 (Recommended)</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Unencrypted (Open)</option>
                    </select>
                  </div>
                  {wifiData.encryption !== 'nopass' && (
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">WiFi Password</label>
                      <input
                        type="password"
                        value={wifiData.password}
                        onChange={(e) => setWifiData({ ...wifiData, password: e.target.value })}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-all font-mono"
                        id="input-wifi-pass"
                      />
                    </div>
                  )}
                </div>
              )}

              {dataType === 'email' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500">Recipient Email Address</label>
                    <input
                      type="email"
                      value={emailData.recipient}
                      onChange={(e) => setEmailData({ ...emailData, recipient: e.target.value })}
                      placeholder="hello@company.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-all"
                      id="input-email-recipient"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Subject (Optional)</label>
                      <input
                        type="text"
                        value={emailData.subject}
                        onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                        placeholder="Feedback"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-all"
                        id="input-email-subject"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500">Prefilled Message (Optional)</label>
                      <input
                        type="text"
                        value={emailData.body}
                        onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                        placeholder="Sent from QR Code"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-all"
                        id="input-email-body"
                      />
                    </div>
                  </div>
                </div>
              )}

              {dataType === 'phone' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">Phone Number (International format)</label>
                  <input
                    type="tel"
                    value={phoneData.phoneNumber}
                    onChange={(e) => setPhoneData({ phoneNumber: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden font-medium text-slate-800 transition-all font-mono"
                    id="input-phone"
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Scans instantly trigger cellular dialers with the target phoneNumber.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section B: Instant Quick Layout Presets */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            <h2 className="font-display text-sm font-semibold text-slate-900 tracking-tight mb-1 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-emerald-500" />
              2. Fast Presets
            </h2>
            <p className="text-[11px] text-slate-400 font-medium mb-4">Quickly initialize styled palettes designed for high scannability.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {PRESET_THEMES.map((theme) => {
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleApplyPreset(theme)}
                    className="group relative border border-slate-100 hover:border-slate-200 p-2.5 rounded-xl text-left bg-slate-50/50 hover:bg-white transition-all duration-200 shadow-3xs cursor-pointer active:scale-97"
                    id={`preset-${theme.id}`}
                  >
                    <div className="flex gap-1.5 mb-1.5">
                      <span className="w-5 h-5 rounded-md border border-slate-100 shadow-3xs block shrink-0" style={{ backgroundColor: theme.fgColor }} />
                      <span className="w-5 h-5 rounded-md border border-slate-100 shadow-3xs block shrink-0" style={{ backgroundColor: theme.bgColor }} />
                      <span className="w-5 h-5 rounded-md border border-slate-100 shadow-3xs block shrink-0" style={{ backgroundColor: theme.eyeColor }} />
                    </div>
                    <div className="font-display text-[11px] font-bold text-slate-800">{theme.name}</div>
                    <div className="text-[9px] text-slate-400 line-clamp-1 leading-tight">{theme.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section C: Advanced Customizer Tabs */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs">
            
            {/* Customizer Subtabs */}
            <div className="flex bg-slate-50 p-1.5 rounded-xl mb-5">
              {[
                { id: 'design', label: 'Color & Dots', icon: Sliders },
                { id: 'logo', label: 'Brand & Logos', icon: ImageIcon },
                { id: 'settings', label: 'Quality & Canvas', icon: Palette }
              ].map((sub) => {
                const isSelected = activeTab === sub.id;
                const Icon = sub.icon;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setActiveTab(sub.id as any)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-white text-indigo-700 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    id={`subtab-${sub.id}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Subtab Contents */}
            <div className="space-y-4">
              
              {/* TAB 1: DESIGN */}
              {activeTab === 'design' && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Colors Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* FG Module Color */}
                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-600">Foreground Dark</label>
                        <span className="text-[10px] text-slate-400 font-mono">{config.fgColor.toUpperCase()}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={config.fgColor} 
                          onChange={(e) => setConfig({ ...config, fgColor: e.target.value })}
                          className="w-10 h-8 rounded-md border border-slate-200 cursor-pointer p-0 bg-transparent"
                          id="color-fg"
                        />
                        <input 
                          type="text" 
                          value={config.fgColor} 
                          onChange={(e) => setConfig({ ...config, fgColor: e.target.value })}
                          className="w-full text-xs font-semibold bg-white border border-slate-200 py-1.5 px-2 rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* BG Canvas Color */}
                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-600">Background Light</label>
                        <span className="text-[10px] text-slate-400 font-mono">{config.bgColor.toUpperCase()}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={config.bgColor} 
                          onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                          className="w-10 h-8 rounded-md border border-slate-200 cursor-pointer p-0 bg-transparent"
                          id="color-bg"
                        />
                        <input 
                          type="text" 
                          value={config.bgColor} 
                          onChange={(e) => setConfig({ ...config, bgColor: e.target.value })}
                          className="w-full text-xs font-semibold bg-white border border-slate-200 py-1.5 px-2 rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Eye corner pattern Color */}
                    <div className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[11px] font-bold text-slate-600">Finder Corner Eyes (Premium)</label>
                        <span className="text-[10px] text-slate-400 font-mono">{config.eyeColor.toUpperCase()}</span>
                      </div>
                      <div className="flex gap-2 items-center">
                        <input 
                          type="color" 
                          value={config.eyeColor} 
                          onChange={(e) => setConfig({ ...config, eyeColor: e.target.value })}
                          className="w-10 h-8 rounded-md border border-slate-200 cursor-pointer p-0 bg-transparent"
                          disabled={!subscription.isPremium}
                          id="color-eye"
                        />
                        <input 
                          type="text" 
                          value={config.eyeColor} 
                          onChange={(e) => {
                            if(subscription.isPremium) setConfig({ ...config, eyeColor: e.target.value });
                          }}
                          disabled={!subscription.isPremium}
                          className="w-full text-xs font-semibold bg-white border border-slate-200 py-1.5 px-2 rounded-lg outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-60 font-mono"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Eye style Customization indicator */}
                  {!subscription.isPremium && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5 items-start">
                      <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-bold text-amber-800">Finder eye colors locked on Free Plan</div>
                        <p className="text-[10px] text-amber-600 leading-normal">Premium subscribers unlocks separate high-contrast styling for the three tracking finder corners.</p>
                      </div>
                    </div>
                  )}

                  {/* Dot styles */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-600">Body Dot Pattern Shape</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'square', label: 'Classic Square', desc: 'Standard sharp modules' },
                        { id: 'dots', label: 'Rounded Circles', desc: 'Sleek geometric dots' },
                        { id: 'rounded', label: 'Soft Corners', desc: 'Smooth pill shapes' }
                      ].map((style) => {
                        const isSel = dotStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            onClick={() => setDotStyle(style.id as any)}
                            className={`border text-left p-2.5 rounded-xl cursor-pointer transition-all ${
                              isSel 
                                ? 'border-indigo-600 bg-indigo-50/20 text-indigo-900 ring-2 ring-indigo-600/5' 
                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                            id={`dots-shape-${style.id}`}
                          >
                            <span className="block text-xs font-bold leading-tight">{style.label}</span>
                            <span className="block text-[9px] text-slate-400 mt-0.5 leading-normal">{style.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Finder Eye Frame Styles (Premium Feature) */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600">Finder Eye Frame (Premium)</label>
                      {!subscription.isPremium && (
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'square', label: 'Classic Squares', desc: 'Traditional rigid grids' },
                        { id: 'rounded', label: 'Polished Rounded', desc: 'Vibe-aligned smooth bounds' }
                      ].map((style) => {
                        const isSel = eyeStyle === style.id;
                        return (
                          <button
                            key={style.id}
                            onClick={() => {
                              if (subscription.isPremium) {
                                setEyeStyle(style.id as any);
                              } else {
                                setIsPricingOpen(true);
                              }
                            }}
                            className={`border text-left p-2.5 rounded-xl transition-all cursor-pointer relative ${
                              isSel 
                                ? 'border-indigo-600 bg-indigo-50/20 text-indigo-900 ring-2 ring-indigo-600/5' 
                                : 'border-slate-100 hover:border-slate-200'
                            } ${!subscription.isPremium ? 'opacity-82 hover:opacity-100 hover:bg-slate-50/50' : 'hover:bg-slate-50'}`}
                            id={`eye-shape-${style.id}`}
                          >
                            {!subscription.isPremium && style.id === 'rounded' && (
                              <div className="absolute right-2.5 top-2.5 text-slate-400">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <span className="block text-xs font-bold leading-tight">{style.label}</span>
                            <span className="block text-[9px] text-slate-400 mt-0.5 leading-normal">{style.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: LOGO BRANDING */}
              {activeTab === 'logo' && (
                <div className="space-y-5 animate-fadeIn">
                  
                  {/* Select Preset Logos */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-600">Select Preset Utility Vector Logos</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      <button
                        onClick={() => setConfig({ ...config, logoType: 'none', presetLogoId: '' })}
                        className={`text-center p-2 border rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                          config.logoType === 'none' 
                            ? 'border-indigo-600 bg-indigo-50/10 text-indigo-700' 
                            : 'border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-700'
                        }`}
                        id="logo-none"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-[9px] font-bold">None</span>
                      </button>
                      
                      {PRESET_LOGOS.map((logo) => {
                        const isSel = config.logoType === 'preset' && config.presetLogoId === logo.id;
                        return (
                          <button
                            key={logo.id}
                            onClick={() => handleSelectPresetLogo(logo)}
                            className={`p-2 border rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                              isSel 
                                ? 'border-indigo-600 bg-indigo-50/10 text-indigo-700 font-bold scale-102 ring-1 ring-indigo-500/15' 
                                : 'border-slate-100 hover:bg-slate-50 text-slate-500'
                            }`}
                            style={{ color: isSel ? undefined : logo.color }}
                            id={`logo-preset-${logo.id}`}
                          >
                            <div className="scale-90" dangerouslySetInnerHTML={{ __html: logo.svgString }} />
                            <span className="text-[9px] truncate max-w-full font-medium">{logo.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Logo Upload Wrapper */}
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-600">Or Upload Your Custom Brand Logo</label>
                      {!subscription.isPremium && (
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>

                    <div 
                      onClick={() => {
                        if (subscription.isPremium) {
                          fileInputRef.current?.click();
                        } else {
                          setIsPricingOpen(true);
                        }
                      }}
                      className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-1.5 ${
                        subscription.isPremium 
                          ? 'border-indigo-300 hover:border-indigo-500 hover:bg-white bg-slate-50' 
                          : 'border-slate-200 opacity-80 hover:opacity-100 hover:bg-slate-100/50'
                      }`}
                      id="upload-zone"
                    >
                      <Upload className={`w-6 h-6 ${subscription.isPremium ? 'text-indigo-500' : 'text-slate-400'}`} />
                      
                      {config.logoType === 'custom' && config.customLogoUrl ? (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-emerald-600 truncate max-w-[240px]">✓ {customLogoName || 'Custom image loaded'}</p>
                          <p className="text-[9px] text-slate-500">Click to upload a replacement branding assets.</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-slate-700">Drag & drop logo file or click to choose</p>
                          <p className="text-[9px] text-slate-400">Supports PNG, JPG, JPEG, SVG up to 1.5M.</p>
                        </div>
                      )}

                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Sliders for Logo Tuning */}
                  {config.logoType !== 'none' && (
                    <div className="space-y-4 border border-slate-100 rounded-xl p-4 bg-white shadow-3xs">
                      
                      {/* Logo Size Control */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold text-slate-600">
                          <span>Logo Scale Center</span>
                          <span className="font-mono text-indigo-700 font-medium">{(config.logoSize * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                          type="range"
                          min={0.12}
                          max={0.28}
                          step={0.02}
                          value={config.logoSize}
                          onChange={(e) => setConfig({ ...config, logoSize: parseFloat(e.target.value) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      {/* Badge padding configuration */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="block text-xs font-bold text-slate-600">Cutout Shield Badge</span>
                            <span className="block text-[9px] text-slate-400">Add protective color badge behind logo</span>
                          </div>
                          <input 
                            type="checkbox"
                            checked={config.drawBadge}
                            onChange={(e) => setConfig({ ...config, drawBadge: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 accent-indigo-600 border-slate-200 rounded-lg"
                          />
                        </div>

                        {config.drawBadge && (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-500">Badge BG</span>
                            <input 
                              type="color"
                              value={config.badgeBgColor}
                              onChange={(e) => setConfig({ ...config, badgeBgColor: e.target.value })}
                              className="w-7 h-7 rounded-md cursor-pointer border border-slate-200 outline-hidden"
                            />
                            <input 
                              type="text"
                              value={config.badgeBgColor}
                              onChange={(e) => setConfig({ ...config, badgeBgColor: e.target.value })}
                              className="w-16 font-mono text-[10px] bg-slate-50 px-1 py-1 text-center border rounded-lg focus:outline-indigo-500"
                            />
                          </div>
                        )}
                      </div>

                      {config.drawBadge && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Logo Badge border radius */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                              <span>Badge Corner Radius</span>
                              <span className="font-mono text-indigo-700">{config.badgeBorderRadius}px</span>
                            </div>
                            <input 
                              type="range"
                              min={0}
                              max={14}
                              step={1}
                              value={config.badgeBorderRadius}
                              onChange={(e) => setConfig({ ...config, badgeBorderRadius: parseInt(e.target.value) })}
                              className="w-full accent-indigo-600"
                            />
                          </div>

                          {/* Logo Badge padding */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                              <span>Badge Outer Margin</span>
                              <span className="font-mono text-indigo-700">{config.logoPadding}px</span>
                            </div>
                            <input 
                              type="range"
                              min={0}
                              max={12}
                              step={1}
                              value={config.logoPadding}
                              onChange={(e) => setConfig({ ...config, logoPadding: parseInt(e.target.value) })}
                              className="w-full accent-indigo-600"
                            />
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: QUALITY SETTINGS */}
              {activeTab === 'settings' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-slate-50 rounded-xl space-y-3 border border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-bold">QR Quality Settings</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-600">Error Correction Threshold</label>
                        <span className="bg-indigo-100 text-indigo-800 text-[9px] px-2 py-0.5 rounded-full font-bold">
                          {config.errorCorrectionLevel === 'H' ? 'High (30% Recovers)' : 'Medium (15% Recovery)'}
                        </span>
                      </div>
                      
                      <select
                        value={config.errorCorrectionLevel}
                        onChange={(e) => setConfig({ ...config, errorCorrectionLevel: e.target.value as any })}
                        disabled={config.logoType !== 'none'}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:opacity-75 focus:border-indigo-500"
                      >
                        <option value="L">Low (7% recovery, best density for simple links)</option>
                        <option value="M">Medium (15% recovery, normal standard)</option>
                        <option value="Q">Quartile (25% recovery, safety blocks)</option>
                        <option value="H">High (30% recovery, mandatory for center logos)</option>
                      </select>
                      
                      {config.logoType !== 'none' && (
                        <p className="text-[9px] text-indigo-600 font-medium">🔒 Forced to High (H) because you have logo overlays centered, securing QR readability even with covered matrix nodes.</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3 border border-slate-100 bg-white rounded-xl flex gap-3">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h4 className="text-[11px] font-bold text-slate-700">Device Verification Scanning Guide</h4>
                      <p className="text-[10px] text-slate-500 leading-normal">Our system auto-verifies contrast calculations. Avoid highly matching foreground and background colors to guarantee scan success in various cameras.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Section D: Simulators Control Panel */}
          <div className="bg-indigo-950 text-indigo-100 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="font-display text-xs font-bold text-indigo-300 tracking-wider flex items-center justify-center sm:justify-start gap-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>REVIEWER SIMULATOR ZONE</span>
              </div>
              <p className="text-[11px] text-indigo-200 leading-normal">Test limit caps, monthly billing rules, and premium status unlocks easily:</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <button 
                onClick={handleIncrementTestCount}
                className="bg-indigo-900 border border-indigo-700/60 hover:bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                id="btn-increment-limit"
              >
                +1 Gen Credit
              </button>
              
              <button 
                onClick={simulateDowngradeOrReset}
                className="bg-indigo-900 border border-indigo-700/60 hover:bg-indigo-800 text-indigo-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                id="btn-simulate-reset"
              >
                Reset to Free Plan
              </button>

              <button 
                onClick={simulatePaymentUnlock}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-xs transition-all flex items-center gap-1"
                id="btn-simulate-premium"
              >
                👑 Dynamic Pro Upgrade
              </button>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Output Sandbox & History Log (5 Grid Columns) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Real-Time Live Preview */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs text-center space-y-5" id="preview-sandbox">
            <div className="flex justify-between items-center">
              <h2 className="font-display text-sm font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span className="w-1.5 h-4 rounded-full bg-indigo-500" />
                Live QR Preview
              </h2>
              
              <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold truncate max-w-[140px]">
                {config.dataType.toUpperCase()} Payload
              </span>
            </div>

            {/* Canvas Display Port with Hand-drawn Mobile Cam Frame emulation */}
            <div className="relative group max-w-[280px] sm:max-w-[320px] mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-100">
              
              {/* Fake Mobile Camera overlay indicators */}
              <div className="absolute top-2 left-2 border-t-2 border-l-2 border-slate-300 w-4 h-4" />
              <div className="absolute top-2 right-2 border-t-2 border-r-2 border-slate-300 w-4 h-4" />
              <div className="absolute bottom-2 left-2 border-b-2 border-l-2 border-slate-300 w-4 h-4" />
              <div className="absolute bottom-2 right-2 border-b-2 border-r-2 border-slate-300 w-4 h-4" />

              {/* Real HTML5 Canvas */}
              <div className="aspect-square bg-white rounded-xl shadow-xs p-2 flex items-center justify-center transition-all">
                <canvas 
                  ref={canvasRef} 
                  className="w-full h-full max-w-full rounded-lg object-contain"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Laser Camera scanning line simulator */}
              <div className="absolute inset-x-6 top-1/2 h-[1px] bg-emerald-400 opacity-60 animate-pulse pointer-events-none" />

              {/* Free Tier Watermark Overlays */}
              {!subscription.isPremium && (
                <div className="absolute inset-0 bg-slate-950/45 rounded-2xl backdrop-xs flex flex-col items-center justify-center p-4 transition-all animate-fadeIn">
                  <div className="bg-white/95 p-3.5 rounded-xl shadow-lg max-w-[220px] space-y-1.5 border border-slate-100">
                    <div className="flex justify-center">
                      <Lock className="w-5 h-5 text-indigo-600 animate-pulse" />
                    </div>
                    <p className="text-[11px] font-extrabold text-slate-800 leading-tight">PREVIEW ONLY WATERMARK</p>
                    <p className="text-[9px] text-slate-400 leading-normal">Premium removes background grids, enables vectors, and offers high resolution.</p>
                    <button 
                      onClick={() => setIsPricingOpen(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-[9px] font-bold cursor-pointer transition-all shadow-xs"
                    >
                      👑 Unlock for Free
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scan text helper */}
            <p className="text-[10px] text-slate-500 font-medium">
              💡 Point your iOS/Android camera here to test live redirections perfectly.
            </p>

            {/* Generation limit status inside panel */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">Simulated Credits:</span>
                <span className="font-mono font-bold text-indigo-700">
                  {subscription.isPremium ? 'Unlimited ✨' : `${subscription.maxFreeGenerations - subscription.generationsCount} / ${subscription.maxFreeGenerations} Remaining`}
                </span>
              </div>
              
              {/* Credit Status Progress bar */}
              {!subscription.isPremium && (
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        subscription.generationsCount >= 8 ? 'bg-rose-500' : subscription.generationsCount >= 5 ? 'bg-amber-500' : 'bg-indigo-600'
                      }`} 
                      style={{ width: `${(subscription.generationsCount / subscription.maxFreeGenerations) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                    <span>Includes 10 free/month</span>
                    <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" /> Resets in 28 days</span>
                  </div>
                </div>
              )}

              {subscription.isPremium && (
                <p className="text-[10.5px] text-indigo-600 font-medium text-left leading-normal">👑 Premium account is active. You are exempt from the 10/month cap and have priority high-res download pipelines.</p>
              )}
            </div>

            {/* EXPORT FORMATS / QUALITY PRESETS */}
            <div className="space-y-3.5 border-t border-slate-100 pt-4" id="export-options">
              
              <div className="grid grid-cols-2 gap-4">
                
                {/* Format selection */}
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Format</label>
                  <select 
                    value={exportFormat}
                    onChange={(e) => setDataTypeSelectAndReset(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="png">PNG Block</option>
                    <option value="jpeg">JPEG Solid</option>
                    <option value="svg">SVG Vector (👑 Pro)</option>
                  </select>
                </div>

                {/* HD Resolution Selector */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Resolution</label>
                    {!subscription.isPremium && <span className="text-[8px] font-extrabold text-indigo-600">PRO</span>}
                  </div>
                  <select 
                    value={exportScale}
                    onChange={(e) => {
                      if (subscription.isPremium) {
                        setExportScale(parseInt(e.target.value));
                      } else {
                        setIsPricingOpen(true);
                      }
                    }}
                    disabled={!subscription.isPremium}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
                  >
                    <option value={1}>Standard 1x (350px)</option>
                    <option value={2}>Retina HD 2x (700px)</option>
                    <option value={4}>Print HD 4x (1400px)</option>
                  </select>
                </div>

              </div>

              {/* BIG CTA DOWNLOAD BUTTON */}
              <button
                onClick={handleDownload}
                className="w-full bg-linear-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl text-xs sm:text-sm tracking-wide shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                id="btn-download-qr"
              >
                <Download className="w-4 h-4" />
                <span>Export & Download QR Code</span>
              </button>

            </div>

          </div>

          {/* HISTORIC GENERATED ARCHIVE GALLERY (Stored in LocalStorage) */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h3 className="font-display text-xs font-extrabold text-slate-800 tracking-wider flex items-center gap-1.5 uppercase">
                <History className="w-3.5 h-3.5 text-indigo-500" />
                My Saved Codes ({history.length})
              </h3>
              {history.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="text-[10px] text-red-500 hover:text-red-600 font-extrabold cursor-pointer transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <Info className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs font-medium">No saved codes recorded.</p>
                <p className="text-[10px] text-slate-400">Download customized QR Codes to populate this list and organize templates offline.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5 max-h-[290px] overflow-y-auto pr-1 no-scrollbar-y">
                {history.map((item) => {
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleLoadHistory(item)}
                      className="flex items-center justify-between p-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-100/80 rounded-xl cursor-pointer transition-all duration-150 group"
                      id={`history-item-${item.id}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Little preview square of colors used */}
                        <div className="w-9 h-9 rounded-lg border border-slate-150 shadow-3xs flex items-center justify-center shrink-0" style={{ backgroundColor: item.config.bgColor }}>
                          <div className="w-4 h-4 border border-white" style={{ backgroundColor: item.config.fgColor }} />
                        </div>
                        
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-indigo-650">{item.title}</p>
                          <p className="text-[10px] font-mono text-slate-400 truncate leading-normal mt-0.5">{item.text}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] text-slate-400 font-medium">{item.createdAt}</span>
                        <button
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                          className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-slate-400 text-xs">
        <p className="font-semibold text-slate-550">QR Code Studio • Secure Offline-First Generations</p>
        <p className="text-[10px] text-slate-350 mt-1">Allows unlimited customization. Toggles mock billing state anywhere to experience premium flows.</p>
      </footer>

      {/* MODAL 1: PREMIUM SIGN-UP & MOCK PRICING SCHEME */}
      <AnimatePresence>
        {isPricingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPricingOpen(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-xs" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shrink-0 w-full max-w-lg p-6 sm:p-8 relative z-10 shadow-2xl border border-slate-55 shadow-slate-900/10 overflow-hidden"
            >
              
              {/* Close Button */}
              <button 
                onClick={() => setIsPricingOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2 mb-6">
                <div className="inline-flex h-9 w-9 bg-amber-50 rounded-full items-center justify-center text-amber-500 border border-amber-200/50">
                  <Zap className="w-5 h-5 fill-amber-400" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900">Choose Your Generation Plan</h3>
                <p className="text-xs text-slate-500 font-medium">Verify live constraints toggle of both systems inside your browser.</p>
              </div>

              {/* GRID COMPARISON */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                
                {/* Free Plan Card */}
                <div className={`p-4 rounded-2xl border text-left ${!subscription.isPremium ? 'border-zinc-300 bg-linear-to-b from-zinc-50/50 to-white ring-1 ring-zinc-300' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-700">Free Starter</span>
                    {!subscription.isPremium && <span className="bg-slate-200 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900">$0 <span className="text-xs font-normal text-slate-400">/ forever</span></div>
                  
                  <ul className="text-[10px] text-slate-500 space-y-2 mt-4 leading-normal">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>10 QR Code downloads</strong> per month</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>URL, Email, WiFi, Phone templates</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Color Customizers</span>
                    </li>
                    <li className="text-slate-300 line-through flex items-start gap-1.5">
                      <X className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                      <span>Custom logos & high resolution</span>
                    </li>
                  </ul>
                </div>

                {/* PRO PLAN CARD */}
                <div className={`p-4 rounded-2xl border text-left relative overflow-hidden ${subscription.isPremium ? 'border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500' : 'border-emerald-200 bg-emerald-50/20 animate-pulse'}`}>
                  {/* Decorative Amber light effect */}
                  <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-800 font-extrabold text-[8px] px-2.5 py-1 rounded-bl-xl tracking-wider">
                    DEMO UNLOCKED
                  </div>

                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-extrabold text-amber-700">👑 Unlimited Premium</span>
                    {subscription.isPremium && <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded-full">ACTIVE</span>}
                  </div>
                  <div className="font-display text-lg font-bold text-slate-900">$0.00 <span className="text-xs font-bold text-emerald-600">/ 100% FREE Sandbox</span></div>

                  <ul className="text-[10px] text-slate-500 space-y-2 mt-4 leading-normal">
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Unlimited downloads</strong>, no caps</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span><strong>Custom logo upload</strong> enabled</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Retina 2x & High Quality 4x JPG/PNG</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                      <span>Scalable Vector SVG format exports</span>
                    </li>
                  </ul>
                </div>

              </div>

              {/* ACTION TOGGLERS */}
              <div className="space-y-3">
                {subscription.isPremium ? (
                  <button
                    onClick={() => {
                      saveSubscription({ ...subscription, isPremium: false });
                      showToast('Switched to Free plan. Monthly limitations are now enforced.');
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Demote back to Free Plan (To Test 10/mo Caps)
                  </button>
                ) : (
                  <button
                    onClick={simulatePaymentUnlock}
                    className="w-full bg-linear-to-r from-emerald-500 to-teal-605 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md shadow-emerald-200/50 hover:opacity-95 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1"
                    id="upgrade-confirm-btn"
                  >
                    <Zap className="w-3.5 h-3.5 fill-amber-400 text-white" />
                    <span>Instant Free Upgrade (Get Pro for $0.00)</span>
                  </button>
                )}
                
                <p className="text-[9.5px] text-slate-400 text-center uppercase tracking-wide font-extrabold text-emerald-650">
                  This transaction is 100% Free. No billing details will EVER be requested!
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: MONTHLY LIMIT REACHED ALERT */}
      <AnimatePresence>
        {isCreditCheckFailed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreditCheckFailed(false)}
              className="absolute inset-0 bg-slate-950/50 backdrop-xs" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shrink-0 w-full max-w-sm p-6 relative z-10 shadow-2xl border border-slate-100 text-center space-y-4"
              id="download-blocker-modal"
            >
              <div className="inline-flex h-11 w-11 bg-red-50 text-red-600 rounded-full items-center justify-center">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display text-base font-bold text-slate-930">Downloads Cap Reached!</h3>
                <p className="text-xs text-slate-500 leading-normal">
                  You have consumed your <strong>10 / 10 free monthly downloads quota</strong>. Tap the button below to upgrade to Premium instantly for **FREE**!
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={simulatePaymentUnlock}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-1 animate-bounce"
                >
                  <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Activate Free Premium Upgrade (100% FREE)</span>
                </button>

                <button
                  onClick={() => {
                    saveSubscription({ ...subscription, generationsCount: 0 });
                    setIsCreditCheckFailed(false);
                    showToast('Limit cleared for standard review.');
                  }}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2.5 rounded-xl text-[10px] font-medium transition-all"
                >
                  Skip constraint (Simulate Credit Reset)
                </button>
              </div>

              <button 
                onClick={() => setIsCreditCheckFailed(false)}
                className="text-[10px] text-slate-400 font-bold hover:text-slate-600 cursor-pointer"
              >
                Close Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );

  // Helper inside format dropdown with automatic reset
  function setDataTypeSelectAndReset(format: 'png' | 'jpeg' | 'svg') {
    setExportFormat(format);
    if (format === 'svg' && !subscription.isPremium) {
      showToast('Scalable Vector (SVG) exports are a Premium exclusive.');
      setIsPricingOpen(true);
    }
  }
}
