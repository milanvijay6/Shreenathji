import React, { useState } from 'react';
import { X, Upload, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { Importer, LeadStatus, Channel } from '../types';
import { getInitialValidationState, validateContactFormat } from '../services/validationService';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newImporters: Importer[]) => void;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [csvText, setCsvText] = useState('');
  const [previewData, setPreviewData] = useState<Importer[]>([]);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  if (!isOpen) return null;

  const parseCSV = () => {
    // Simple CSV parser: Name,Company,Country,Contact,Product,Quantity,Price
    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    const parsed: Importer[] = lines.map((line, index) => {
      // Handle potential quotes in CSV in a basic way, or just split by comma
      const cols = line.split(',').map(c => c.trim());
      
      // Safety check for columns
      const name = cols[0] || `Unknown Importer ${index}`;
      const companyName = cols[1] || 'Unknown Co';
      const country = cols[2] || 'Unknown';
      const contactDetail = cols[3] || '';
      const productsImported = cols[4] || 'General Goods';
      const quantity = cols[5] || '-';
      const priceRange = cols[6] || '-';

      const { channel } = validateContactFormat(contactDetail);
      const validation = getInitialValidationState(contactDetail);

      return {
        id: `imported-${Date.now()}-${index}`,
        name,
        companyName,
        country,
        contactDetail,
        productsImported,
        quantity,
        priceRange,
        status: LeadStatus.PENDING,
        chatHistory: [],
        activityLog: [{
          id: `log-init-${index}`,
          timestamp: Date.now(),
          type: 'system',
          description: 'Lead imported via Bulk CSV'
        }],
        preferredChannel: channel,
        validation
      };
    });

    setPreviewData(parsed);
    setStep('preview');
  };

  const handleImport = () => {
    onImport(previewData);
    setCsvText('');
    setPreviewData([]);
    setStep('input');
    onClose();
  };

  const validCount = previewData.filter(i => i.validation.isValid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Bulk Lead Import
            </h2>
            <p className="text-sm text-slate-500">Import leads from Excel/CSV</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 'input' ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <strong>Format:</strong> Name, Company, Country, Contact, Product, Quantity, Price
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="David Chen, Tok Inc, New Zealand, +64211234567, Corn Poha, 10 NOS, 7.50 USD..."
                className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-lg text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> {validCount} Valid
                </div>
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg text-sm font-medium">
                  <AlertTriangle className="w-4 h-4" /> {invalidCount} Issues
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-600 font-medium">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Company</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Product</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.map((item) => (
                      <tr key={item.id} className={item.validation.isValid ? 'bg-white' : 'bg-red-50/50'}>
                        <td className="p-3">
                          {item.validation.isValid ? (
                            <span className="text-green-500"><CheckCircle className="w-4 h-4" /></span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1 text-xs font-bold">
                              <AlertTriangle className="w-4 h-4" /> {item.validation.errors[0]}
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-800">{item.companyName}</td>
                        <td className="p-3 text-slate-600">{item.contactDetail}</td>
                        <td className="p-3 text-slate-600 truncate max-w-[200px]">{item.productsImported}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
          {step === 'input' ? (
            <>
              <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                Cancel
              </button>
              <button 
                onClick={parseCSV}
                disabled={!csvText.trim()}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Analyze Data
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep('input')} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                Back to Input
              </button>
              <button 
                onClick={handleImport}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-green-600/20"
              >
                Import {previewData.length} Leads
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;