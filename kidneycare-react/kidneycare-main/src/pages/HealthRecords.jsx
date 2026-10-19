import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, FileText, Download, Eye, Calendar, User, Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';

function HealthRecordsContent() {
  const { language } = useLanguage();
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedType, setSelectedType] = useState('all');

  const { data: patient } = useQuery({
    queryKey: ['currentPatient'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const patients = await base44.entities.Patient.filter({ created_by: user.email });
      return patients[0];
    }
  });

  const { data: records = [] } = useQuery({
    queryKey: ['healthRecords', patient?.id],
    queryFn: () => patient 
      ? base44.entities.HealthRecord.filter({ patient_id: patient.id }, '-created_date')
      : [],
    enabled: !!patient
  });

  const recordTypes = ['all', 'Medical History', 'Diagnosis', 'Treatment Plan', 'Lab Result', 'Prescription', 'Progress Note'];
  const filteredRecords = selectedType === 'all' 
    ? records 
    : records.filter(r => r.record_type === selectedType);

  const typeColors = {
    'Medical History': 'bg-purple-100 text-purple-700',
    'Diagnosis': 'bg-red-100 text-red-700',
    'Treatment Plan': 'bg-blue-100 text-blue-700',
    'Lab Result': 'bg-green-100 text-green-700',
    'Prescription': 'bg-orange-100 text-orange-700',
    'Progress Note': 'bg-gray-100 text-gray-700'
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 relative">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-semibold text-gray-900">
            {language === 'hi' ? 'स्वास्थ्य रिकॉर्ड' : 'Health Records'}
          </h1>
        </div>
        <Link to="/DocScanner">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs gap-1.5 shadow-sm">
            <Camera className="w-3.5 h-3.5" />
            {language === 'hi' ? 'दस्तावेज़ स्कैन करें' : 'Scan Document'}
          </Button>
        </Link>
      </div>

      {/* Floating Action Button for Scanner */}
      <div className="fixed bottom-6 right-6 z-40">
        <Link to="/DocScanner">
          <Button className="h-14 px-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <span className="font-semibold text-sm">Scan Doc</span>
          </Button>
        </Link>
      </div>

      {/* Type filters */}
      <div className="px-4 py-4 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {recordTypes.map(type => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full whitespace-nowrap ${
                selectedType === type 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-white'
              }`}
              onClick={() => setSelectedType(type)}
            >
              {type === 'all' ? (language === 'hi' ? 'सभी' : 'All') : type}
            </Button>
          ))}
        </div>
      </div>

      {/* Records list */}
      <div className="px-4 space-y-3">
        {filteredRecords.length === 0 ? (
          <Card className="p-8 text-center bg-gray-50 border-none">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">
              {language === 'hi' ? 'कोई रिकॉर्ड नहीं मिला' : 'No records found'}
            </p>
          </Card>
        ) : (
          filteredRecords.map((record, idx) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card 
                className="p-4 bg-white border-none hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedRecord(record)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{record.title}</h3>
                      <Badge className={typeColors[record.record_type]}>
                        {record.record_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2">{record.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(record.visit_date || record.created_date), 'MMM d, yyyy')}
                      </div>
                      {record.clinician_id && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Dr.
                        </div>
                      )}
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Record Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-lg mx-auto rounded-2xl max-h-[80vh] overflow-y-auto">
          {selectedRecord && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={typeColors[selectedRecord.record_type]}>
                    {selectedRecord.record_type}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {format(new Date(selectedRecord.visit_date || selectedRecord.created_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <DialogTitle>{selectedRecord.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                {selectedRecord.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600 whitespace-pre-line">{selectedRecord.description}</p>
                  </div>
                )}

                {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Medications</h4>
                    <div className="space-y-2">
                      {selectedRecord.medications.map((med, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <p className="font-medium text-gray-900">{med.name}</p>
                          <p className="text-sm text-gray-500">{med.dosage} - {med.frequency}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRecord.lab_values && Object.keys(selectedRecord.lab_values).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Lab Values</h4>
                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                      {Object.entries(selectedRecord.lab_values).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key}:</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRecord.follow_up_date && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                      <span className="font-medium">Follow-up: </span>
                      {format(new Date(selectedRecord.follow_up_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}

                {selectedRecord.attachments && selectedRecord.attachments.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Attachments</h4>
                    <div className="space-y-2">
                      {selectedRecord.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                        >
                          <Download className="w-4 h-4 text-blue-500" />
                          <span className="text-sm text-blue-600">Attachment {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HealthRecords() {
  return (
    <LanguageProvider>
      <HealthRecordsContent />
    </LanguageProvider>
  );
}