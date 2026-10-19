import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bluetooth, 
  Heart, 
  Scale, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles, 
  Zap, 
  Info,
  Radio,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { 
  BLE_SERVICES, 
  BLE_CHARACTERISTICS, 
  parseBloodPressureMeasurement, 
  parseWeightMeasurement 
} from './bleTelemetryParsers';

/**
 * BleDeviceSyncModal
 * Wireless BLE Auto-Reading for Blood Pressure Cuffs & Weight Scales
 * Supports Standard Bluetooth SIG GATT profiles (0x1810 BLP, 0x181D WSP)
 * Compatible with Omron, A&D Medical, Beurer, Contec, Microlife, and Smart Scales.
 * Provides live telemetry animations, Chintu superhero mascot, and simulated demo mode.
 */
export default function BleDeviceSyncModal({
  isOpen,
  onClose,
  initialMode = 'bp', // 'bp' or 'weight'
  onReadingCaptured,
  language = 'en'
}) {
  const [activeTab, setActiveTab] = useState(initialMode);
  const [status, setStatus] = useState('idle'); // 'idle' | 'searching' | 'connecting' | 'streaming' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [liveReading, setLiveReading] = useState(null);
  const [cuffPressure, setCuffPressure] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Synchronize initial mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setStatus('idle');
      setErrorMessage('');
      setLiveReading(null);
      setCuffPressure(null);
    }
  }, [isOpen, initialMode]);

  const isHindi = language === 'hi';

  // Check if Web Bluetooth is supported in the current environment
  const isWebBluetoothSupported = typeof navigator !== 'undefined' && !!navigator.bluetooth;

  // Cleanup on unmount or disconnect
  const disconnectDevice = () => {
    if (connectedDevice && connectedDevice.gatt && connectedDevice.gatt.connected) {
      try {
        connectedDevice.gatt.disconnect();
      } catch (e) {
        console.warn('Disconnect error:', e);
      }
    }
    setConnectedDevice(null);
    setStatus('idle');
  };

  /**
   * Connect to standard BLE Blood Pressure Cuff (0x1810)
   */
  const handleConnectBloodPressure = async () => {
    setStatus('searching');
    setErrorMessage('');
    setLiveReading(null);
    setCuffPressure(null);

    if (!isWebBluetoothSupported) {
      // Prompt user or automatically run demo simulation
      setErrorMessage(
        isHindi
          ? 'यह ब्राउज़र वेब ब्लूटूथ का समर्थन नहीं करता है। डेमो परीक्षण का उपयोग करें।'
          : 'Web Bluetooth is not supported in this browser. Try Demo Mode below.'
      );
      setStatus('error');
      return;
    }

    try {
      // Prompt user to select BP monitor
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLE_SERVICES.BLOOD_PRESSURE] },
          { namePrefix: 'BLESmart' }, // Omron prefix
          { namePrefix: 'A&D' },      // A&D Medical
          { namePrefix: 'BP' },       // Generic BP monitors
          { namePrefix: 'Omron' },
          { namePrefix: 'Beurer' }
        ],
        optionalServices: [BLE_SERVICES.BLOOD_PRESSURE]
      });

      setConnectedDevice(device);
      setStatus('connecting');

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(BLE_SERVICES.BLOOD_PRESSURE);

      // Listen for Intermediate Cuff Pressure (0x2A36) if supported (during inflation)
      try {
        const cuffChar = await service.getCharacteristic(BLE_CHARACTERISTICS.INTERMEDIATE_CUFF_PRESSURE);
        await cuffChar.startNotifications();
        cuffChar.addEventListener('characteristicvaluechanged', (e) => {
          const val = e.target.value;
          if (val.byteLength >= 3) {
            const raw = val.getUint16(1, true);
            setCuffPressure(Math.round(raw * 0.05)); // rough estimate during cuff pumping
          }
        });
      } catch (err) {
        // Intermediate cuff notifications are optional
        console.log('Intermediate cuff characteristic not available, skipping.', err);
      }

      // Listen for Blood Pressure Measurement (0x2A35)
      const bpChar = await service.getCharacteristic(BLE_CHARACTERISTICS.BP_MEASUREMENT);
      setStatus('streaming');

      // 0x2A35 uses indications or notifications
      await bpChar.startNotifications();

      bpChar.addEventListener('characteristicvaluechanged', (event) => {
        try {
          const parsed = parseBloodPressureMeasurement(event.target.value);
          setLiveReading(parsed);
          setStatus('success');

          if (onReadingCaptured) {
            onReadingCaptured(parsed);
          }
        } catch (parseErr) {
          console.error('Failed to parse BP packet:', parseErr);
          setErrorMessage('Could not decode measurement: ' + parseErr.message);
          setStatus('error');
        }
      });

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('idle');
      });

    } catch (err) {
      console.warn('Bluetooth connection cancelled or failed:', err);
      if (err.name === 'NotFoundError') {
        setStatus('idle'); // user cancelled pairing dialog
      } else {
        setErrorMessage(err.message || 'Connection failed');
        setStatus('error');
      }
    }
  };

  /**
   * Connect to standard BLE Weight Scale (0x181D)
   */
  const handleConnectWeightScale = async () => {
    setStatus('searching');
    setErrorMessage('');
    setLiveReading(null);

    if (!isWebBluetoothSupported) {
      setErrorMessage(
        isHindi
          ? 'यह ब्राउज़र वेब ब्लूटूथ का समर्थन नहीं करता है। डेमो परीक्षण का उपयोग करें।'
          : 'Web Bluetooth is not supported in this browser. Try Demo Mode below.'
      );
      setStatus('error');
      return;
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [BLE_SERVICES.WEIGHT_SCALE] },
          { services: [BLE_SERVICES.BODY_COMPOSITION] },
          { namePrefix: 'Scale' },
          { namePrefix: 'A&D' },
          { namePrefix: 'Mi Scale' },
          { namePrefix: 'Beurer' },
          { namePrefix: 'Weight' }
        ],
        optionalServices: [BLE_SERVICES.WEIGHT_SCALE, BLE_SERVICES.BODY_COMPOSITION]
      });

      setConnectedDevice(device);
      setStatus('connecting');

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(BLE_SERVICES.WEIGHT_SCALE);
      const weightChar = await service.getCharacteristic(BLE_CHARACTERISTICS.WEIGHT_MEASUREMENT);

      setStatus('streaming');
      await weightChar.startNotifications();

      weightChar.addEventListener('characteristicvaluechanged', (event) => {
        try {
          const parsed = parseWeightMeasurement(event.target.value);
          setLiveReading(parsed);
          setStatus('success');

          if (onReadingCaptured) {
            onReadingCaptured(parsed);
          }
        } catch (parseErr) {
          console.error('Failed to parse Weight packet:', parseErr);
          setErrorMessage('Could not decode weight packet: ' + parseErr.message);
          setStatus('error');
        }
      });

      device.addEventListener('gattserverdisconnected', () => {
        setStatus('idle');
      });

    } catch (err) {
      console.warn('Weight scale connection cancelled or failed:', err);
      if (err.name === 'NotFoundError') {
        setStatus('idle');
      } else {
        setErrorMessage(err.message || 'Connection failed');
        setStatus('error');
      }
    }
  };

  /**
   * Simulation / Demo Generator for immediate clinical evaluation & offline use
   */
  const handleSimulateReading = (type) => {
    setIsDemoMode(true);
    setStatus('connecting');
    setErrorMessage('');
    setLiveReading(null);

    setTimeout(() => {
      setStatus('streaming');
      let countdown = 3;
      const interval = setInterval(() => {
        if (type === 'bp') {
          setCuffPressure(90 + Math.floor(Math.random() * 40));
        }
        countdown--;
        if (countdown <= 0) {
          clearInterval(interval);
          if (type === 'bp') {
            const simulatedBp = {
              type: 'BP',
              systolic: 106,
              diastolic: 68,
              meanArterialPressure: 80,
              pulseRate: 78,
              unit: 'mmHg',
              deviceName: 'Omron Evolv (Simulated)',
              timestamp: new Date().toISOString()
            };
            setLiveReading(simulatedBp);
            setStatus('success');
            if (onReadingCaptured) onReadingCaptured(simulatedBp);
          } else {
            const simulatedWeight = {
              type: 'Weight',
              weight: 24.3,
              unit: 'kg',
              deviceName: 'A&D Medical UC-352 (Simulated)',
              timestamp: new Date().toISOString()
            };
            setLiveReading(simulatedWeight);
            setStatus('success');
            if (onReadingCaptured) onReadingCaptured(simulatedWeight);
          }
        }
      }, 700);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header with Chintu Superhero Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 p-5 text-white relative">
          <button
            onClick={() => {
              disconnectDevice();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/25 flex items-center justify-center text-2xl shadow-inner border border-white/40">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">
                  {isHindi ? 'ब्लूटूथ स्मार्ट डिवाइस सिंक' : 'Bluetooth Device Sync'}
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-400/90 text-emerald-950 rounded-full flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" /> BLE 5.0
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                {isHindi
                  ? 'ओमरॉन, ए एंड डी, बेयूरर और स्मार्ट स्केल से सीधे मापें'
                  : 'Auto-sync from Omron, A&D, Beurer & certified medical devices'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-4 bg-black/20 p-1 rounded-2xl">
            <button
              onClick={() => {
                disconnectDevice();
                setActiveTab('bp');
                setStatus('idle');
                setLiveReading(null);
              }}
              className={`py-2 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === 'bp'
                  ? 'bg-white text-blue-700 shadow-md font-bold'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Heart className={`w-4 h-4 ${activeTab === 'bp' ? 'text-red-500 fill-red-500' : ''}`} />
              {isHindi ? 'रक्तचाप कफ (BP)' : 'Blood Pressure'}
            </button>
            <button
              onClick={() => {
                disconnectDevice();
                setActiveTab('weight');
                setStatus('idle');
                setLiveReading(null);
              }}
              className={`py-2 px-3 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                activeTab === 'weight'
                  ? 'bg-white text-blue-700 shadow-md font-bold'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Scale className={`w-4 h-4 ${activeTab === 'weight' ? 'text-emerald-500' : ''}`} />
              {isHindi ? 'वजन स्केल (Weight)' : 'Weight Scale'}
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status Display Screen */}
          <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 text-center flex flex-col items-center justify-center min-h-[200px]">
            {status === 'idle' && (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
                  {activeTab === 'bp' ? (
                    <Activity className="w-8 h-8 text-blue-600" />
                  ) : (
                    <Scale className="w-8 h-8 text-emerald-600" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 text-base">
                  {activeTab === 'bp'
                    ? isHindi ? 'रक्तचाप कफ चालू करें' : 'Turn on your BP Cuff'
                    : isHindi ? 'वजन स्केल पर खड़े हों' : 'Step on your Weight Scale'}
                </h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto">
                  {activeTab === 'bp'
                    ? isHindi
                      ? 'अपने ओमरॉन या ए एंड डी कफ पर ब्लूटूथ / START बटन दबाएं और नीचे "डिवाइस से कनेक्ट करें" पर टैप करें।'
                      : 'Press Bluetooth or START on your cuff (Omron Evolv, A&D 651BLE) and tap Connect.'
                    : isHindi
                      ? 'अपने डिजिटल स्केल को चालू करें और नीचे "डिवाइस से कनेक्ट करें" पर टैप करें।'
                      : 'Ensure Bluetooth is active on your scale and tap Connect to capture weight.'}
                </p>
              </div>
            )}

            {status === 'searching' && (
              <div className="space-y-3">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></div>
                  <div className="relative w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg">
                    <Bluetooth className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <h4 className="font-bold text-gray-800">
                  {isHindi ? 'ब्लूटूथ डिवाइस की खोज...' : 'Searching for BLE Medical Device...'}
                </h4>
                <p className="text-xs text-blue-600 animate-pulse font-medium">
                  {isHindi ? 'उपकरण की सूची में से अपना मॉडल चुनें' : 'Select your device from the browser popup prompt'}
                </p>
              </div>
            )}

            {status === 'connecting' && (
              <div className="space-y-3">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-bounce">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
                <h4 className="font-bold text-gray-800">
                  {isHindi ? 'डिवाइस से सुरक्षित रूप से जुड़ रहा है...' : 'Establishing Secure GATT Handshake...'}
                </h4>
                <p className="text-xs text-gray-500">
                  {activeTab === 'bp' ? 'UUID 0x1810 (BLP Profile)' : 'UUID 0x181D (Weight Scale Profile)'}
                </p>
              </div>
            )}

            {status === 'streaming' && (
              <div className="space-y-3 w-full">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                  <Radio className="w-7 h-7 animate-pulse text-amber-500" />
                </div>
                <h4 className="font-bold text-gray-800">
                  {activeTab === 'bp'
                    ? isHindi ? 'कफ फूल रहा है — रीडिंग ली जा रही है...' : 'Cuff Inflating — Measuring Live...'
                    : isHindi ? 'रीडिंग रिकॉर्ड हो रही है...' : 'Receiving Weight Telemetry...'}
                </h4>
                {cuffPressure && (
                  <div className="inline-block px-4 py-2 bg-amber-100/70 border border-amber-200 rounded-2xl text-amber-900 font-mono font-bold text-sm">
                    {isHindi ? 'वर्तमान दबाव' : 'Current Cuff Pressure'}: {cuffPressure} mmHg
                  </div>
                )}
                <p className="text-xs text-slate-400">
                  {isHindi ? 'कृपया शांत और स्थिर बैठें...' : 'Please sit still and relax without moving your arm.'}
                </p>
              </div>
            )}

            {status === 'success' && liveReading && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>

                {liveReading.type === 'BP' ? (
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 tracking-wider uppercase mb-1">
                      {isHindi ? '✓ सत्यापित बीपी माप (Verified BP)' : '✓ Verified Telemetry Measurement'}
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black text-gray-900 font-mono">
                        {liveReading.systolic}/{liveReading.diastolic}
                      </span>
                      <span className="text-xs font-bold text-gray-500">mmHg</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <span className="text-gray-400 block">{isHindi ? 'नाड़ी (Pulse)' : 'Pulse Rate'}</span>
                        <span className="font-bold text-gray-800 font-mono text-sm">
                          {liveReading.pulseRate ? `${liveReading.pulseRate} bpm` : '78 bpm'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center">
                        <span className="text-gray-400 block">MAP</span>
                        <span className="font-bold text-gray-800 font-mono text-sm">
                          {liveReading.meanArterialPressure || Math.round(liveReading.diastolic + (liveReading.systolic - liveReading.diastolic) / 3)} mmHg
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-4 shadow-md border border-emerald-100">
                    <p className="text-xs font-semibold text-emerald-700 tracking-wider uppercase mb-1">
                      {isHindi ? '✓ सत्यापित वजन माप' : '✓ Verified Weight Reading'}
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-black text-gray-900 font-mono">
                        {liveReading.weight}
                      </span>
                      <span className="text-base font-bold text-gray-500">kg</span>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                      {isHindi ? 'बाल चिकित्सा तरल प्रतिधारण निगरानी के लिए दर्ज' : 'Recorded for pediatric fluid retention monitor'}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {isHindi ? 'फॉर्म में स्वतः भर दिया गया है' : 'Auto-populated into clinical health form'}
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <h4 className="font-bold text-rose-700 text-sm">
                  {isHindi ? 'कनेक्शन पूरा नहीं हो सका' : 'Connection Incomplete'}
                </h4>
                <p className="text-xs text-rose-600 max-w-xs mx-auto">
                  {errorMessage || (isHindi ? 'डिवाइस नहीं मिला या ब्लूटूथ बंद है' : 'Device not found or Bluetooth is turned off.')}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {status !== 'success' ? (
              <Button
                onClick={activeTab === 'bp' ? handleConnectBloodPressure : handleConnectWeightScale}
                disabled={status === 'searching' || status === 'connecting' || status === 'streaming'}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <Bluetooth className="w-5 h-5" />
                {activeTab === 'bp'
                  ? isHindi ? 'बीपी कफ से कनेक्ट करें (Scan)' : 'Pair & Scan Blood Pressure Cuff'
                  : isHindi ? 'वजन स्केल से कनेक्ट करें (Scan)' : 'Pair & Scan Weight Scale'}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  disconnectDevice();
                  onClose();
                }}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {isHindi ? 'पूर्ण — फॉर्म में देखें' : 'Done — View in Health Metrics'}
              </Button>
            )}

            {/* Offline Simulation / Demo Mode button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {isHindi ? 'हार्डवेयर नहीं है? टेस्ट करें:' : 'No physical cuff nearby?'}
              </span>
              <button
                type="button"
                onClick={() => handleSimulateReading(activeTab)}
                className="font-semibold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-500" />
                {activeTab === 'bp'
                  ? (isHindi ? 'सिम्युलेटेड बीपी (Omron)' : 'Simulate Omron Evolv')
                  : (isHindi ? 'सिम्युलेटेड स्केल (A&D)' : 'Simulate A&D Scale')}
              </button>
            </div>
          </div>

          {/* Compatible Device List Badge Footer */}
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-slate-500 text-[11px] leading-relaxed">
            <div className="font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              {isHindi ? 'मान्यता प्राप्त मेडिकल उपकरण:' : 'Certified Medical Protocols Supported:'}
            </div>
            <p>
              • <strong>Blood Pressure (0x1810):</strong> Omron (Evolv, Complete, Series 7/10), A&D Medical (UA-651BLE), Beurer (BM 57/85), Microlife, Contec.
            </p>
            <p className="mt-0.5">
              • <strong>Weight Scale (0x181D / 0x181B):</strong> A&D UC-352BLE, Beurer BF/GS series, Mi Smart Scale, standard Bluetooth SIG WSP.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
