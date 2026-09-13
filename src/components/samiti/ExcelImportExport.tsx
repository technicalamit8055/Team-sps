import React, { useState, useRef } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { SamitiDonation, DonationCategory, PaymentMode, DONATION_CATEGORIES } from '@/types/samiti';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';

export const ExcelImportExport: React.FC = () => {
  const { currentEntity, currentEvent, donations, importDonations } = useSamiti();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<Array<Omit<SamitiDonation, 'id' | 'createdAt' | 'updatedAt'>>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => {
        try {
          const rawData = results.data as Array<Record<string, string>>;

          let skippedInvalidAmount = 0;

          const cleanedData = rawData.map((row, idx) => {
            // Fuzzy match column headers from user's image
            const findKey = (candidates: string[]) => {
              for (const c of candidates) {
                const found = Object.keys(row).find(
                  k => k.trim().toUpperCase() === c.toUpperCase() || k.trim().toUpperCase().includes(c.toUpperCase())
                );
                if (found) return row[found];
              }
              return '';
            };

            const sNum = parseInt(findKey(['S.NUM', 'SN', 'SL', 'SR', 'SERIAL', 'NO'])) || idx + 1;
            const rawCat = findKey(['VIL/EMP/SHO/OTH', 'CAT', 'CATEGORY', 'TYPE']).toUpperCase().trim();
            let category: DonationCategory = 'SHO';
            if (rawCat.includes('VIL')) category = 'VIL';
            else if (rawCat.includes('EMP')) category = 'EMP';
            else if (rawCat.includes('OTH')) category = 'OTH';
            else if (rawCat.includes('SHO')) category = 'SHO';

            const name = findKey(['NAME', 'DONOR', 'PERSON']) || 'अनाम दानदाता';
            const identity = findKey(['IDENTITY', 'FATHER', 'SHOP', 'FIRM', 'POST']);
            const caste = findKey(['CASTE', 'COMMUNITY', 'SUBGROUP']);
            const village = findKey(['VILLAGE', 'GAON', 'GRAM', 'गाँव', 'गांव']);
            const address1 = findKey(['ADDRESS.1', 'ADDRESS 1', 'MOHALLA', 'WARD']);
            const address2 = findKey(['ADDRESS.2', 'ADDRESS 2', 'POST', 'DISTRICT']);
            const phone = findKey(['PHONE', 'MOBILE', 'WHATSAPP', 'CONTACT']).replace(/\D/g, '');

            const acceptedAmount = parseFloat(findKey(['ACCEPTED AMMOUNT', 'ACCEPTED AMOUNT', 'PLEDGED', 'PROMISED'])) || 0;
            const receivedAmount = parseFloat(findKey(['RECEIVABLE AMOUNT', 'RECEIVED AMOUNT', 'COLLECTED', 'PAID'])) || 0;
            const balanceAmount = Math.max(0, acceptedAmount - receivedAmount);

            const rawMode = findKey(['CASH/ONL', 'MODE', 'PAYMENT MODE']).toUpperCase();
            const paymentMode: PaymentMode = rawMode.includes('ONL') || rawMode.includes('UPI') ? 'ONL' : 'CASH';

            return {
              eventId: currentEvent.id,
              serialNumber: sNum,
              category,
              name,
              identity,
              caste,
              village,
              address1,
              address2,
              phone,
              acceptedAmount,
              receivedAmount,
              balanceAmount,
              paymentMode,
              date: new Date().toISOString().split('T')[0],
              remarks: 'CSV इम्पोर्ट द्वारा दर्ज',
            };
          }).filter(row => {
            const isValid =
              Number.isFinite(row.acceptedAmount) &&
              Number.isFinite(row.receivedAmount) &&
              row.acceptedAmount >= 0 &&
              row.receivedAmount >= 0;
            if (!isValid) skippedInvalidAmount++;
            return isValid;
          });

          setParsedRows(cleanedData);
          setIsProcessing(false);
          if (skippedInvalidAmount > 0) {
            toast.warning(
              `${cleanedData.length} रिकॉर्ड पढ़े गए, ${skippedInvalidAmount} पंक्तियाँ अमान्य (ऋणात्मक) राशि के कारण छोड़ी गईं।`
            );
          } else {
            toast.success(`${cleanedData.length} रिकॉर्ड सफलतापूर्वक पढ़े गए! नीचे प्रीव्यू देखें।`);
          }
        } catch (err) {
          console.error(err);
          setIsProcessing(false);
          toast.error('CSV फाइल पढ़ने में त्रुटि हुई! कृपया प्रारूप जांचें।');
        }
      },
      error: error => {
        setIsProcessing(false);
        toast.error(`त्रुटि: ${error.message}`);
      },
    });
  };

  // Commit imported rows
  const handleCommitImport = () => {
    if (parsedRows.length === 0) return;
    importDonations(parsedRows);
    setParsedRows([]);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1-Click Export matching exact image headers
  const handleExportCSV = () => {
    if (donations.length === 0) {
      toast.error('एक्सपोर्ट के लिए कोई डेटा नहीं है!');
      return;
    }

    const exportRows = donations.map(d => ({
      'S.NUM': d.serialNumber,
      'VIL/EMP/SHO/OTH': d.category,
      'NAME': d.name,
      'IDENTITY': d.identity || '',
      'CASTE': d.caste || '',
      'VILLAGE': d.village || '',
      'ADDRESS.1': d.address1 || '',
      'ADDRESS.2': d.address2 || '',
      'ACCEPTED AMMOUNT': d.acceptedAmount,
      'RECEIVABLE AMOUNT': d.receivedAmount,
      'BALANCE AMOUNT': d.balanceAmount,
      'CASH/ONL': d.paymentMode,
      'MOBILE/WHATSAPP': d.phone || '',
      'DATE': d.date || '',
    }));

    const csvContent = Papa.unparse(exportRows);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentEntity.name}_Chanda_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('चंदा रजिस्टर एक्सेल / CSV फाइल सफलतापूर्वक डाउनलोड हो गई!');
  };

  // Download Sample Template CSV
  const handleDownloadSampleTemplate = () => {
    const sampleRows = [
      {
        'S.NUM': 1,
        'VIL/EMP/SHO/OTH': 'SHO',
        'NAME': 'राजेश कुमार गुप्ता',
        'IDENTITY': 'प्रो०: गुप्ता वस्त्र भंडार',
        'CASTE': 'वैश्य',
        'VILLAGE': 'नारायणपुर',
        'ADDRESS.1': 'दुकान नं० 14, मुख्य बाजार',
        'ADDRESS.2': 'नारायणपुर चौराहा',
        'ACCEPTED AMMOUNT': 11000,
        'RECEIVABLE AMOUNT': 11000,
        'BALANCE AMOUNT': 0,
        'CASH/ONL': 'ONL',
        'MOBILE/WHATSAPP': '9835012345',
      },
      {
        'S.NUM': 2,
        'VIL/EMP/SHO/OTH': 'VIL',
        'NAME': 'रामनरेश सिंह',
        'IDENTITY': 'आत्मज: स्वर्गीय रामखेलावन सिंह',
        'CASTE': 'क्षत्रिय',
        'VILLAGE': 'छपरापुर',
        'ADDRESS.1': 'वार्ड नं० 4, सिंह टोला',
        'ADDRESS.2': 'पोस्ट- नारायणपुर',
        'ACCEPTED AMMOUNT': 5100,
        'RECEIVABLE AMOUNT': 3100,
        'BALANCE AMOUNT': 2000,
        'CASH/ONL': 'CASH',
        'MOBILE/WHATSAPP': '9470123456',
      },
      {
        'S.NUM': 3,
        'VIL/EMP/SHO/OTH': 'EMP',
        'NAME': 'डॉ० विकास रंजन',
        'IDENTITY': 'चिकित्सा पदाधिकारी, पीएचसी',
        'CASTE': 'ब्राह्मण',
        'VILLAGE': 'नारायणपुर',
        'ADDRESS.1': 'क्वार्टर नं० 2, पीएचसी परिसर',
        'ADDRESS.2': 'नारायणपुर',
        'ACCEPTED AMMOUNT': 5100,
        'RECEIVABLE AMOUNT': 5100,
        'BALANCE AMOUNT': 0,
        'CASH/ONL': 'ONL',
        'MOBILE/WHATSAPP': '9123456789',
      },
    ];

    const csvContent = Papa.unparse(sampleRows);
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DURGA_PUJA_SAMITI_SAMPLE_EXCEL_TEMPLATE.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('नमूना एक्सेल टेम्पलेट डाउनलोड हो गया!');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-slate-700" />
              1-क्लिक एक्सेल / CSV इम्पोर्ट एवं एक्सपोर्ट हब
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              अपनी पुरानी एक्सेल शीट (जैसे <span className="font-mono font-semibold text-slate-700">DURGA PUJA SAMITI NARAYANPUR</span>) सीधे यहाँ अपलोड करें। ऐप सभी कॉलम (<span className="font-mono">S.NUM, VIL/EMP/SHO/OTH, NAME, IDENTITY, ACCEPTED AMMOUNT</span> आदि) को स्वतः पहचान लेगा।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSampleTemplate}
              className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 h-9"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              नमूना एक्सेल टेम्पलेट
            </Button>
            <Button
              size="sm"
              onClick={handleExportCSV}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs h-9"
            >
              <Download className="w-4 h-4 mr-1.5" />
              वर्तमान रजिस्टर डाउनलोड करें (.CSV)
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-5 sm:p-8 text-center hover:bg-slate-50/50 transition-colors">
        <input
          type="file"
          accept=".csv,.txt"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          id="csv-file-input"
        />
        <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">
              एक्सेल / CSV फाइल चुनें या यहाँ ड्रैग करें
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              समर्थित प्रारूप: .CSV (UTF-8) • अधिकतम आकार 10MB
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs border-amber-400 text-amber-900 font-bold hover:bg-amber-100"
          >
            फ़ाइल ब्राउज़ करें (Browse File)
          </Button>
        </label>
        {fileName && (
          <div className="mt-4 inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            चयनित फाइल: {fileName}
          </div>
        )}
      </div>

      {/* Preview Table of Uploaded Records */}
      {parsedRows.length > 0 && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                अपलोड पूर्वावलोकन (Preview: {parsedRows.length} रिकॉर्ड्स तैयार)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                कृपया डेटा की पुष्टि करें और समिति डेटाबेस में जोड़ने के लिए "डेटाबेस में सुरक्षित करें" पर क्लिक करें।
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setParsedRows([])}
                className="text-xs"
              >
                रद्द करें
              </Button>
              <Button
                size="sm"
                onClick={handleCommitImport}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                डेटाबेस में सुरक्षित करें ({parsedRows.length} रिकॉर्ड)
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] max-h-96 border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold sticky top-0 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-2.5">S.NUM</th>
                  <th className="p-2.5">VIL/EMP/SHO/OTH</th>
                  <th className="p-2.5">NAME</th>
                  <th className="p-2.5">IDENTITY</th>
                  <th className="p-2.5">CASTE</th>
                  <th className="p-2.5">VILLAGE</th>
                  <th className="p-2.5">ADDRESS.1</th>
                  <th className="p-2.5 text-right">ACCEPTED</th>
                  <th className="p-2.5 text-right">RECEIVED</th>
                  <th className="p-2.5 text-right">BALANCE</th>
                  <th className="p-2.5 text-center">MODE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold">{row.serialNumber}</td>
                    <td className="p-2.5">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {row.category}
                      </Badge>
                    </td>
                    <td className="p-2.5 font-bold">{row.name}</td>
                    <td className="p-2.5 text-gray-600">{row.identity || '-'}</td>
                    <td className="p-2.5 text-gray-500">{row.caste || '-'}</td>
                    <td className="p-2.5 text-gray-600">{row.village || '-'}</td>
                    <td className="p-2.5 text-gray-600">{row.address1 || '-'}</td>
                    <td className="p-2.5 text-right font-mono font-semibold">₹{row.acceptedAmount}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-700">₹{row.receivedAmount}</td>
                    <td className="p-2.5 text-right font-mono font-black text-red-600">₹{row.balanceAmount}</td>
                    <td className="p-2.5 text-center">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100">
                        {row.paymentMode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
