import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Share2, Download, Loader2, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

// Minimal inline QR code using a free API (no package needed)
function QRImage({ value, size = 200 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
  return <img src={url} alt="QR Code" className="rounded-2xl shadow-md" width={size} height={size} />;
}

export default function PatientQR() {
  const urlParams = new URLSearchParams(window.location.search);
  const patientIdParam = urlParams.get('id');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['qrPatient', patientIdParam],
    queryFn: async () => {
      if (patientIdParam) {
        const pts = await base44.entities.Patient.filter({ id: patientIdParam });
        return pts[0];
      }
      const user = await base44.auth.me();
      const pts = await base44.entities.Patient.filter({ created_by: user.email });
      return pts.find(p => p.onboarding_complete) || pts[0];
    }
  });

  // QR value encodes app deep-link for clinician onboarding
  const qrValue = patient
    ? `kidneycare://onboard-patient?id=${patient.id}&cr=${patient.cr_number || ''}&name=${encodeURIComponent(patient.name)}`
    : '';

  const appUrl = patient
    ? `${window.location.origin}/ClinicianDashboard?scan=${patient.id}`
    : '';

  const handleShare = () => {
    const text = `KidneyCare — Patient Profile\n${patient?.name}\nCR: ${patient?.cr_number || 'N/A'}\nScan QR or visit:\n${appUrl}`;
    if (navigator.share) {
      navigator.share({ title: 'KidneyCare Patient QR', text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
    }
  };

  if (isLoading || !patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 pt-4 pb-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/">
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
          </Link>
          <div>
            <h1 className="font-bold text-base">My Patient QR Card</h1>
            <p className="text-indigo-200 text-xs">Show to your doctor to link your profile</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-8">
        {/* Patient card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Blue top strip */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white">
            <p className="text-xs text-indigo-200 font-medium mb-0.5">KidneyCare — AIIMS Patna</p>
            <h2 className="text-xl font-bold">{patient.name}</h2>
            {patient.cr_number && (
              <p className="text-indigo-200 text-sm font-mono mt-0.5">{patient.cr_number}</p>
            )}
          </div>

          {/* QR + info */}
          <div className="flex gap-4 p-5 items-start">
            <QRImage value={qrValue || appUrl} size={140} />
            <div className="flex-1 space-y-2">
              {[
                { label: 'Name', value: patient.name },
                { label: 'DOB', value: patient.dob ? format(new Date(patient.dob), 'dd MMM yyyy') : '—' },
                { label: 'Gender', value: patient.gender || '—' },
                { label: 'Type', value: patient.ns_classification || '—' },
                { label: 'CR No.', value: patient.cr_number || '—' },
              ].map(r => (
                <div key={r.label}>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{r.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 text-center">
            <p className="text-xs text-gray-400">Generated {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-amber-800 mb-1">📱 How to use this QR code</p>
          <div className="space-y-1">
            {[
              '1. Show this screen to your doctor at the clinic',
              '2. Doctor scans the QR code with the clinician app',
              '3. Your health data is automatically linked to their dashboard',
              '4. You get a notification when linked — approve to share data',
            ].map((s, i) => <p key={i} className="text-xs text-amber-700">{s}</p>)}
          </div>
        </div>

        {/* Clinician link */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">Or share this link with your doctor:</p>
          <p className="text-xs font-mono text-indigo-600 break-all">{appUrl}</p>
        </div>

        {/* Share button */}
        <button onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold rounded-2xl py-4">
          <Share2 className="w-5 h-5" />
          Share QR Card
        </button>
      </div>
    </div>
  );
}