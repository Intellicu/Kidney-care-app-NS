/**
 * BLE Telemetry Parsers for Blood Pressure (0x1810) and Weight Scale (0x181D)
 * Conforming to Bluetooth SIG Standard GATT Profiles and IEEE-11073 16-bit SFLOAT specs
 * Inspired by MedM Health telemetry engine architecture
 */

/**
 * Decode 16-bit SFLOAT (IEEE-11073)
 * High 4 bits: exponent in 2's complement (-8 to +7)
 * Low 12 bits: mantissa in 2's complement (-2048 to +2047)
 */
export function decodeSFloat(raw16) {
  let mantissa = raw16 & 0x0FFF;
  if ((mantissa & 0x0800) !== 0) {
    // Negative mantissa (sign extend 12-bit to 32-bit integer)
    mantissa -= 0x1000;
  }
  let exponent = (raw16 >> 12) & 0x0F;
  if ((exponent & 0x08) !== 0) {
    // Negative exponent (sign extend 4-bit to 32-bit integer)
    exponent -= 0x10;
  }

  // Handle special IEEE-11073 values
  if (mantissa === 0x07FE) return NaN; // Positive infinity / reserved
  if (mantissa === 0x07FF) return NaN; // NaN
  if (mantissa === 0x0800) return NaN; // NRes
  if (mantissa === 0x0802) return NaN; // Negative infinity

  return mantissa * Math.pow(10, exponent);
}

/**
 * Decode Blood Pressure Measurement (0x2A35)
 * Service UUID: 0x1810
 * Flags (Byte 0):
 *   Bit 0: 0 = mmHg, 1 = kPa
 *   Bit 1: 0 = No timestamp, 1 = Timestamp present (7 bytes)
 *   Bit 2: 0 = No pulse rate, 1 = Pulse rate present (2 bytes)
 *   Bit 3: 0 = No user ID, 1 = User ID present (1 byte)
 *   Bit 4: 0 = No measurement status, 1 = Measurement status present (2 bytes)
 */
export function parseBloodPressureMeasurement(dataView) {
  if (!dataView || dataView.byteLength < 7) {
    throw new Error('DataView too short for standard Blood Pressure Measurement');
  }

  const flags = dataView.getUint8(0);
  const isKpa = (flags & 0x01) !== 0;
  const hasTimestamp = (flags & 0x02) !== 0;
  const hasPulseRate = (flags & 0x04) !== 0;
  const hasUserId = (flags & 0x08) !== 0;
  const hasStatus = (flags & 0x10) !== 0;

  // Systolic, Diastolic, MAP (all SFLOAT 16-bit little endian)
  const rawSys = dataView.getUint16(1, true);
  const rawDia = dataView.getUint16(3, true);
  const rawMap = dataView.getUint16(5, true);

  let systolic = decodeSFloat(rawSys);
  let diastolic = decodeSFloat(rawDia);
  let meanArterialPressure = decodeSFloat(rawMap);

  // If in kPa, convert to mmHg (1 kPa = 7.50062 mmHg)
  if (isKpa) {
    systolic = systolic * 7.50062;
    diastolic = diastolic * 7.50062;
    meanArterialPressure = meanArterialPressure * 7.50062;
  }

  let offset = 7;
  let timestamp = new Date();

  if (hasTimestamp && dataView.byteLength >= offset + 7) {
    const year = dataView.getUint16(offset, true);
    const month = dataView.getUint8(offset + 2) - 1; // 0-indexed in JS
    const day = dataView.getUint8(offset + 3);
    const hour = dataView.getUint8(offset + 4);
    const minute = dataView.getUint8(offset + 5);
    const second = dataView.getUint8(offset + 6);
    timestamp = new Date(year, month, day, hour, minute, second);
    offset += 7;
  }

  let pulseRate = null;
  if (hasPulseRate && dataView.byteLength >= offset + 2) {
    const rawPulse = dataView.getUint16(offset, true);
    pulseRate = Math.round(decodeSFloat(rawPulse));
    offset += 2;
  }

  let userId = null;
  if (hasUserId && dataView.byteLength >= offset + 1) {
    userId = dataView.getUint8(offset);
    offset += 1;
  }

  return {
    type: 'BP',
    systolic: Math.round(systolic),
    diastolic: Math.round(diastolic),
    meanArterialPressure: Math.round(meanArterialPressure),
    pulseRate,
    userId,
    unit: 'mmHg',
    timestamp: timestamp.toISOString()
  };
}

/**
 * Decode Weight Scale Measurement (0x2A9D)
 * Service UUID: 0x181D
 * Flags (Byte 0):
 *   Bit 0: 0 = SI (kg, resolution 0.005kg or 0.01kg), 1 = Imperial (lbs)
 *   Bit 1: 0 = No timestamp, 1 = Timestamp present (7 bytes)
 *   Bit 2: 0 = No user ID, 1 = User ID present (1 byte)
 *   Bit 3: 0 = No BMI and height, 1 = BMI and height present (4 bytes)
 */
export function parseWeightMeasurement(dataView) {
  if (!dataView || dataView.byteLength < 3) {
    throw new Error('DataView too short for Weight Measurement');
  }

  const flags = dataView.getUint8(0);
  const isImperial = (flags & 0x01) !== 0;
  const hasTimestamp = (flags & 0x02) !== 0;
  const hasUserId = (flags & 0x04) !== 0;
  const hasBmiAndHeight = (flags & 0x08) !== 0;

  // Weight is 16-bit unsigned integer (multiplier depends on unit)
  // For kg, resolution is usually 0.005 kg (standard) or 0.01 kg (some consumer scales)
  // If value is in 0.005kg steps: raw * 0.005. If raw / 100 or raw * 0.005
  // Common consumer scales send in 0.01 kg or 0.005 kg.
  const rawWeight = dataView.getUint16(1, true);
  let weightKg;

  if (isImperial) {
    // raw * 0.01 lbs or 0.005 lbs converted to kg
    const weightLbs = rawWeight * 0.01;
    weightKg = weightLbs * 0.45359237;
  } else {
    // Check standard GATT 0.005 kg vs consumer 0.01 kg / 0.1 kg
    if (rawWeight > 1000) {
      // Typically either 0.005 kg (e.g. 5000 = 25kg) or 0.01 kg (e.g. 2500 = 25.00kg, 4500 = 45.0kg)
      // If consumer scale 45.2 kg -> 4520 with factor 0.01
      // Standard GATT spec uses multiplier 0.005 kg:
      weightKg = rawWeight * 0.005;
      // If that produces an abnormally low weight (<10kg for older child), check if 0.01 or 0.1
      if (weightKg < 10 && rawWeight > 1000) {
        weightKg = rawWeight * 0.01;
      }
    } else {
      // direct 0.1 kg representation
      weightKg = rawWeight * 0.1;
    }
  }

  let offset = 3;
  let timestamp = new Date();

  if (hasTimestamp && dataView.byteLength >= offset + 7) {
    const year = dataView.getUint16(offset, true);
    const month = dataView.getUint8(offset + 2) - 1;
    const day = dataView.getUint8(offset + 3);
    const hour = dataView.getUint8(offset + 4);
    const minute = dataView.getUint8(offset + 5);
    const second = dataView.getUint8(offset + 6);
    timestamp = new Date(year, month, day, hour, minute, second);
    offset += 7;
  }

  let userId = null;
  if (hasUserId && dataView.byteLength >= offset + 1) {
    userId = dataView.getUint8(offset);
    offset += 1;
  }

  let bmi = null;
  let heightM = null;
  if (hasBmiAndHeight && dataView.byteLength >= offset + 4) {
    const rawBmi = dataView.getUint16(offset, true);
    const rawHeight = dataView.getUint16(offset + 2, true);
    bmi = Number((rawBmi * 0.1).toFixed(1));
    heightM = Number((rawHeight * 0.001).toFixed(2));
    offset += 4;
  }

  return {
    type: 'Weight',
    weight: Number(weightKg.toFixed(2)),
    unit: 'kg',
    userId,
    bmi,
    height: heightM,
    timestamp: timestamp.toISOString()
  };
}

/**
 * Standard GATT Service and Characteristic UUID constants
 */
export const BLE_SERVICES = {
  BLOOD_PRESSURE: '00001810-0000-1000-8000-00805f9b34fb', // 0x1810
  WEIGHT_SCALE: '0000181d-0000-1000-8000-00805f9b34fb',   // 0x181D
  BODY_COMPOSITION: '0000181b-0000-1000-8000-00805f9b34fb', // 0x181B
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb'       // 0x180D
};

export const BLE_CHARACTERISTICS = {
  BP_MEASUREMENT: '00002a35-0000-1000-8000-00805f9b34fb',   // 0x2A35
  INTERMEDIATE_CUFF_PRESSURE: '00002a36-0000-1000-8000-00805f9b34fb', // 0x2A36
  WEIGHT_MEASUREMENT: '00002a9d-0000-1000-8000-00805f9b34fb', // 0x2A9D
  BODY_COMPOSITION_MEASUREMENT: '00002a9c-0000-1000-8000-00805f9b34fb' // 0x2A9C
};
