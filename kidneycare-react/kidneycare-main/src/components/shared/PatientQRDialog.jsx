import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, X } from 'lucide-react';
import { format } from 'date-fns';

function QRImage({ value, size = 180 }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&margin=10`;
  return <img src={url} alt="Patient QR Code" className="rounded-2xl shadow-md" width={size} height={size} />;
}

export default function PatientQRDialog({ patient, open, onOpenChange }) {
  if (!patient) return null;

  const qrValue = `${window.location.origin}/PatientDetail?id=${patient.id}`;
  const appUrl = `${window.location.origin}/ClinicianDashboard?scan=${patient.id}`;

  const handleShare = () => {
    const text = `KidneyCare — Patient Profile\n${patient.name}\nCR: ${patient.cr_number || 'N/A'}\nScan QR or visit:\n${appUrl}`;
    if (navigator.share) {
      navigator.share({ title: 'KidneyCare Patient QR', text });
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Patient QR Code</DialogTitle>
        </DialogHeader>

        {/* Blue header strip */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-indigo-200 font-medium">KidneyCare — AIIMS Patna</p>
              <h2 className="text-lg font-bold">{patient.name}</h2>
              {patient.cr_number && (
                <p className="text-indigo-200 text-xs font-mono">{patient.cr_number}</p>
              )}
            </div>
            <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* QR + info */}
        <div className="flex gap-4 p-5 items-start">
          <QRImage value={qrValue} size={140} />
          <div className="flex-1 space-y-2">
            {[
              { label: 'Name', value: patient.name },
              { label: 'DOB', value: patient.dob ? format(new Date(patient.dob), 'dd MMM yyyy') : '—' },
              { label: 'Gender', value: patient.gender || '—' },
              { label: 'Type', value: patient.ns_classification || '—' },
            ].map(r => (
              <div key={r.label}>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">{r.label}</p>
                <p className="text-sm font-semibold text-gray-900">{r.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 pb-2">
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <p className="text-xs text-amber-700 leading-relaxed">
              📱 Show this QR to your clinician. They scan it to link your health data.
            </p>
          </div>
        </div>

        <div className="px-5 pb-2">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Or share link</p>
          <p className="text-xs font-mono text-indigo-600 break-all">{appUrl}</p>
        </div>

        <div className="p-5 pt-3">
          <Button onClick={handleShare} className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700">
            <Share2 className="w-4 h-4 mr-2" /> Share QR Card
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}