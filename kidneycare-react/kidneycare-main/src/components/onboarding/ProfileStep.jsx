import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Upload, Calendar, Phone, Stethoscope } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from '../shared/LanguageContext';
import { base44 } from '@/api/base44Client';

export default function ProfileStep({ profile, onUpdate, onPrescriptionUpload }) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onPrescriptionUpload(file_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Please login first to upload files');
    }
    setUploading(false);
  };

  return (
    <div className="px-6 py-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-blue-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">{t('profile_title')}</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-5 max-w-sm mx-auto"
      >
        <div className="space-y-2">
          <Label className="text-gray-700">{t('patient_name')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={profile.name || ''}
              onChange={(e) => onUpdate({ ...profile, name: e.target.value })}
              className="pl-10 h-12 rounded-xl border-gray-200"
              placeholder={t('patient_name')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">{t('caregiver_name')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={profile.caregiver_name || ''}
              onChange={(e) => onUpdate({ ...profile, caregiver_name: e.target.value })}
              className="pl-10 h-12 rounded-xl border-gray-200"
              placeholder={t('caregiver_name')}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-700">{t('date_of_birth')}</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="date"
                value={profile.dob || ''}
                onChange={(e) => onUpdate({ ...profile, dob: e.target.value })}
                className="pl-10 h-12 rounded-xl border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700">{t('gender')}</Label>
            <Select
              value={profile.gender || ''}
              onValueChange={(value) => onUpdate({ ...profile, gender: value })}
            >
              <SelectTrigger className="h-12 rounded-xl border-gray-200">
                <SelectValue placeholder={t('gender')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">{t('male')}</SelectItem>
                <SelectItem value="Female">{t('female')}</SelectItem>
                <SelectItem value="Other">{t('other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">{t('phone')}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="tel"
              value={profile.phone || ''}
              onChange={(e) => onUpdate({ ...profile, phone: e.target.value })}
              className="pl-10 h-12 rounded-xl border-gray-200"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">{t('diagnosis')}</Label>
          <div className="relative">
            <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={profile.diagnosis || ''}
              onChange={(e) => onUpdate({ ...profile, diagnosis: e.target.value })}
              className="pl-10 h-12 rounded-xl border-gray-200"
              placeholder={t('diagnosis')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-700">{t('upload_prescription')}</Label>
          <div className="relative">
            <input
              type="file"
              id="prescription"
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="prescription"
              className={`flex items-center justify-center gap-3 h-14 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                profile.prescription_url
                  ? 'border-green-300 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {uploading ? (
                <span className="text-gray-500">{t('loading')}</span>
              ) : profile.prescription_url ? (
                <>
                  <span className="text-green-500">✓</span>
                  <span>Prescription Uploaded</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-500">{t('upload_prescription')}</span>
                </>
              )}
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );
}