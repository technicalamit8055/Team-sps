import React, { useState, useMemo } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Printer, Calendar, CheckCircle2, Wallet, FileText, UserCheck, Shield } from 'lucide-react';

interface DailyCashierSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyCashierSheetModal: React.FC<DailyCashierSheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentEntity, currentEvent, donations } = useSamiti();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Filter donations for the selected date
  const dayDonations = useMemo(() => {
    return donations.filter(d => d.date === selectedDate);
  }, [donations, selectedDate]);

  // Aggregate stats
  const daySummary = useMemo(() => {
    let totalCash = 0;
    let totalOnline = 0;
    let totalAccepted = 0;
    let handedOverCount = 0;

    dayDonations.forEach(d => {
      totalAccepted += d.acceptedAmount || 0;
      if (d.paymentMode === 'CASH') {
        totalCash += d.receivedAmount || 0;
      } else if (d.paymentMode === 'ONL') {
        totalOnline += d.receivedAmount || 0;
      } else {
        totalCash += (d.receivedAmount || 0) / 2;
        totalOnline += (d.receivedAmount || 0) / 2;
      }

      if (d.isHandoverDone) {
        handedOverCount++;
      }
    });

    return {
      totalCash,
      totalOnline,
      totalReceived: totalCash + totalOnline,
      totalAccepted,
      count: dayDonations.length,
      handedOverCount,
    };
  }, [dayDonations]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden bg-white border-amber-300 rounded-3xl shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-4 bg-gradient-to-r from-amber-700 via-orange-700 to-amber-800 text-white flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-white">
              <FileText className="w-4 h-4 text-amber-200" />
              <span>दैनिक रोकड़ मिलान एवं हस्तांतरण पर्ची</span>
            </DialogTitle>
            <p className="text-[11px] text-amber-100 font-medium mt-0.5">
              Daily Cash Reconciliation & Treasurer Handover Voucher
            </p>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto print:max-h-none print:p-8">
          {/* Date Selector Bar */}
          <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs print:hidden">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-700">तारीख चुनें:</span>
              <Input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="h-8 text-xs font-mono w-36 bg-white"
              />
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              प्रविष्टियाँ: <span className="font-bold text-slate-900">{dayDonations.length}</span>
            </div>
          </div>

          {/* Printable Letterhead & Handover Voucher */}
          <div className="border-2 border-slate-300 rounded-2xl p-5 bg-white shadow-xs space-y-4">
            {/* Letterhead */}
            <div className="text-center border-b-2 border-slate-300 pb-3">
              <h2 className="text-xl font-extrabold text-slate-900 font-serif">
                {currentEntity.name}
              </h2>
              <p className="text-xs text-slate-600 font-medium">
                📍 {currentEntity.location || 'नारायणपुर'} • {currentEvent.title}
              </p>
              <div className="mt-2 inline-block bg-slate-900 text-white font-bold text-xs px-3 py-0.5 rounded-full">
                दैनिक रोकड़ पर्ची (Daily Cash Register) • दिनांक: {selectedDate}
              </div>
            </div>

            {/* Daily Financial Summary Cards */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <span className="text-[10px] text-amber-800 uppercase font-bold block">
                  दैनिक नकद संकलन (CASH)
                </span>
                <span className="text-base font-black font-mono text-amber-900 mt-1 block">
                  ₹{daySummary.totalCash.toLocaleString('hi-IN')}
                </span>
              </div>

              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                <span className="text-[10px] text-blue-800 uppercase font-bold block">
                  दैनिक UPI संकलन (ONLINE)
                </span>
                <span className="text-base font-black font-mono text-blue-900 mt-1 block">
                  ₹{daySummary.totalOnline.toLocaleString('hi-IN')}
                </span>
              </div>

              <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                  कुल दैनिक संकलन (TOTAL)
                </span>
                <span className="text-base font-black font-mono text-emerald-900 mt-1 block">
                  ₹{daySummary.totalReceived.toLocaleString('hi-IN')}
                </span>
              </div>
            </div>

            {/* Donor breakdown table for the day */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2 border-r border-slate-200 text-center">क्र०</th>
                    <th className="p-2 border-r border-slate-200">दाता का नाम व विवरण</th>
                    <th className="p-2 border-r border-slate-200 text-right">स्वीकृत</th>
                    <th className="p-2 border-r border-slate-200 text-right">प्राप्त</th>
                    <th className="p-2 border-r border-slate-200 text-center">माध्यम</th>
                    <th className="p-2 text-center">संग्रहकर्ता</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dayDonations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        इस तिथि ({selectedDate}) को कोई चंदा दर्ज नहीं है।
                      </td>
                    </tr>
                  ) : (
                    dayDonations.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-100 text-center font-mono font-bold text-slate-600">
                          #{row.serialNumber}
                        </td>
                        <td className="p-2 border-r border-slate-100 font-medium text-slate-900">
                          <span>{row.name}</span>
                          {row.identity && (
                            <span className="block text-[10px] text-slate-500 font-normal">
                              {row.identity}
                            </span>
                          )}
                        </td>
                        <td className="p-2 border-r border-slate-100 text-right font-mono text-slate-700">
                          ₹{row.acceptedAmount.toLocaleString('hi-IN')}
                        </td>
                        <td className="p-2 border-r border-slate-100 text-right font-mono font-bold text-emerald-700">
                          ₹{row.receivedAmount.toLocaleString('hi-IN')}
                        </td>
                        <td className="p-2 border-r border-slate-100 text-center font-mono text-[10px]">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold ${
                              row.paymentMode === 'ONL'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {row.paymentMode}
                          </span>
                        </td>
                        <td className="p-2 text-center text-[11px] text-slate-600">
                          {row.collectorName || 'कार्यकर्ता'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Handover & Reconciliation Declarations */}
            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>रोकड़ सत्यापन एवं संदूक सुपुर्दगी घोषणा:</span>
              </p>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                प्रमाणित किया जाता है कि आज दिनांक <strong>{selectedDate}</strong> को कुल नकद राशि{' '}
                <strong>₹{daySummary.totalCash.toLocaleString('hi-IN')}</strong> एवं UPI राशि{' '}
                <strong>₹{daySummary.totalOnline.toLocaleString('hi-IN')}</strong> (कुल योग ₹
                {daySummary.totalReceived.toLocaleString('hi-IN')}) प्राप्त हुई। नकद राशि समिति के
                कोषाध्यक्ष को संदूक में जमा करवा दी गई है।
              </p>
            </div>

            {/* Signature Block */}
            <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs text-slate-600">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900">संग्रहकर्ता / कैशियर</p>
                <p className="text-[10px] text-slate-500">हस्ताक्षर</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900">सचिव (महासचिव)</p>
                <p className="text-[10px] text-slate-500">हस्ताक्षर एवं मुहर</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold text-slate-900">कोषाध्यक्ष (मनोज कुमार)</p>
                <p className="text-[10px] text-slate-500">रोकड़ प्राप्तकर्ता हस्ताक्षर</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-9 text-xs border-slate-200 text-slate-700 hover:bg-white"
          >
            बंद करें
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            दैनिक पर्ची प्रिंट करें (Print Voucher)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
