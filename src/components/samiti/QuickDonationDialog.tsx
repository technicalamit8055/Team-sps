import React, { useState } from 'react';
import { useSamiti } from '@/contexts/SamitiContext';
import { DonationCategory, PaymentMode, DONATION_CATEGORIES, SamitiDonation } from '@/types/samiti';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, IndianRupee, Sparkles, CheckCircle, Smartphone } from 'lucide-react';
import { WhatsAppReceiptModal } from './WhatsAppReceiptModal';

interface QuickDonationDialogProps {
  initialData?: SamitiDonation | null;
  onSuccess?: () => void;
  triggerButton?: React.ReactNode;
}

const PRESET_AMOUNTS = [501, 1100, 2100, 5100, 11000, 21000];

export const QuickDonationDialog: React.FC<QuickDonationDialogProps> = ({
  initialData,
  onSuccess,
  triggerButton,
}) => {
  const { addDonation, updateDonation, currentEvent } = useSamiti();

  const [isOpen, setIsOpen] = useState(false);
  const [createdDonation, setCreatedDonation] = useState<SamitiDonation | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState(initialData?.name || '');
  const [category, setCategory] = useState<DonationCategory>(initialData?.category || 'SHO');
  const [identity, setIdentity] = useState(initialData?.identity || '');
  const [caste, setCaste] = useState(initialData?.caste || '');
  const [address1, setAddress1] = useState(initialData?.address1 || '');
  const [address2, setAddress2] = useState(initialData?.address2 || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [acceptedAmount, setAcceptedAmount] = useState<string>(
    initialData?.acceptedAmount ? String(initialData.acceptedAmount) : '2100'
  );
  const [receivedAmount, setReceivedAmount] = useState<string>(
    initialData?.receivedAmount ? String(initialData.receivedAmount) : '2100'
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(initialData?.paymentMode || 'CASH');
  const [collectorName, setCollectorName] = useState(initialData?.collectorName || 'कार्यकर्ता');
  const [remarks, setRemarks] = useState(initialData?.remarks || '');
  const [openReceiptAfterSave, setOpenReceiptAfterSave] = useState(true);

  // Quick preset amount click
  const handlePresetClick = (amount: number) => {
    setAcceptedAmount(String(amount));
    setReceivedAmount(String(amount));
  };

  const parsedAccepted = parseFloat(acceptedAmount) || 0;
  const parsedReceived = parseFloat(receivedAmount) || 0;
  const calculatedBalance = Math.max(0, parsedAccepted - parsedReceived);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (initialData) {
      updateDonation(initialData.id, {
        name: name.trim(),
        category,
        identity: identity.trim(),
        caste: caste.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        phone: phone.trim(),
        acceptedAmount: parsedAccepted,
        receivedAmount: parsedReceived,
        paymentMode,
        collectorName: collectorName.trim(),
        remarks: remarks.trim(),
      });
      setIsOpen(false);
      onSuccess?.();
    } else {
      const newDonation = addDonation({
        eventId: currentEvent.id,
        name: name.trim(),
        category,
        identity: identity.trim(),
        caste: caste.trim(),
        address1: address1.trim(),
        address2: address2.trim(),
        phone: phone.trim(),
        acceptedAmount: parsedAccepted,
        receivedAmount: parsedReceived,
        paymentMode,
        collectorName: collectorName.trim(),
        isHandoverDone: false,
        date: new Date().toISOString().split('T')[0],
        remarks: remarks.trim(),
      });

      // Reset form
      setName('');
      setIdentity('');
      setPhone('');
      setAddress1('');
      setAddress2('');
      setCaste('');
      setRemarks('');
      setAcceptedAmount('2100');
      setReceivedAmount('2100');
      setIsOpen(false);
      onSuccess?.();

      if (openReceiptAfterSave) {
        setCreatedDonation(newDonation);
        setIsReceiptModalOpen(true);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {triggerButton || (
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs h-9 px-3">
              <Plus className="w-3.5 h-3.5 mr-1" />
              + नई चंदा प्रविष्टि
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-lg w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto bg-white border-slate-200 p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="pb-3 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {initialData ? 'चंदा प्रविष्टि संपादित करें' : 'नई चंदा प्रविष्टि (Quick Entry)'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Category Selector Chips */}
            <div>
              <Label className="text-xs font-semibold text-slate-700">
                सहयोगकर्ता की श्रेणी (Category: VIL/EMP/SHO/OTH) *
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                {(Object.keys(DONATION_CATEGORIES) as DonationCategory[]).map(catKey => {
                  const cat = DONATION_CATEGORIES[catKey];
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey)}
                      className={`min-h-[44px] p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[11px] font-mono font-extrabold">{cat.code}</span>
                      <span className="text-[10px] text-center opacity-90">{cat.labelHi.split('/')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contributor Name & Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-700">
                  सहयोगकर्ता का नाम (Donor Name) *
                </Label>
                <Input
                  placeholder="उदा० राजेश कुमार गुप्ता"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="mt-1 font-medium"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">
                  पहचान / पिता / दुकान का नाम (Identity / Shop)
                </Label>
                <Input
                  placeholder="उदा० प्रो०: गुप्ता वस्त्र भंडार / S/o रामदास"
                  value={identity}
                  onChange={e => setIdentity(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Mobile & Caste */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span>व्हाट्सएप मोबाइल नंबर (WhatsApp Phone)</span>
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                </Label>
                <Input
                  placeholder="उदा० 9835012345 (रसीद भेजने हेतु)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">
                  जाति / समुदाय (Caste / Demographic Tag)
                </Label>
                <Input
                  placeholder="उदा० वैश्य, क्षत्रिय, ब्राह्मण, आदि"
                  value={caste}
                  onChange={e => setCaste(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Address 1 & 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-gray-700">
                  पता 1: मोहल्ला / वार्ड / गली (ADDRESS.1)
                </Label>
                <Input
                  placeholder="उदा० दुकान नं० 14, मुख्य बाजार"
                  value={address1}
                  onChange={e => setAddress1(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-700">
                  पता 2: पोस्ट / थाना / लैंडमार्क (ADDRESS.2)
                </Label>
                <Input
                  placeholder="उदा० नारायणपुर चौराहा"
                  value={address2}
                  onChange={e => setAddress2(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Preset Amount Chips */}
            <div>
              <Label className="text-xs font-semibold text-gray-700">
                त्वरित राशि बटन (Preset Amount Chips)
              </Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {PRESET_AMOUNTS.map(amt => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetClick(amt)}
                    className="text-xs font-mono font-bold hover:bg-amber-100 hover:text-amber-900 border-amber-300"
                  >
                    ₹{amt.toLocaleString('hi-IN')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Amounts: Accepted, Received, Balance */}
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-gray-800">
                    स्वीकृत राशि (Accepted Amount) *
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-2.5 text-xs text-gray-500 font-bold">₹</span>
                    <Input
                      type="number"
                      value={acceptedAmount}
                      onChange={e => setAcceptedAmount(e.target.value)}
                      required
                      className="pl-7 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-emerald-800">
                    प्राप्त राशि (Receivable Amount) *
                  </Label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-2.5 text-xs text-emerald-600 font-bold">₹</span>
                    <Input
                      type="number"
                      value={receivedAmount}
                      onChange={e => setReceivedAmount(e.target.value)}
                      required
                      className="pl-7 font-mono font-bold text-emerald-800 border-emerald-300 focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold text-red-800">
                    शेष बकाया (Balance Amount)
                  </Label>
                  <div className="mt-1 h-9 px-3 rounded-md bg-white border border-red-200 flex items-center font-mono font-extrabold text-red-600">
                    ₹{calculatedBalance.toLocaleString('hi-IN')}
                  </div>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-amber-200">
                <div className="flex items-center gap-4">
                  <Label className="text-xs font-bold text-gray-800">माध्यम (CASH/ONL):</Label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={paymentMode === 'CASH'}
                        onChange={() => setPaymentMode('CASH')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      💵 नकद (CASH)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={paymentMode === 'ONL'}
                        onChange={() => setPaymentMode('ONL')}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      📲 ऑनलाइन (UPI / QR)
                    </label>
                  </div>
                </div>

                <div className="text-xs text-gray-600">
                  <span className="font-semibold">संग्रहकर्ता: </span>
                  <input
                    type="text"
                    value={collectorName}
                    onChange={e => setCollectorName(e.target.value)}
                    className="border-b border-gray-300 bg-transparent px-1 py-0.5 text-xs font-medium focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox: Open receipt directly */}
            {!initialData && (
              <label className="flex items-center gap-2 text-xs font-medium text-amber-950 cursor-pointer bg-amber-100/50 p-2.5 rounded-lg border border-amber-200">
                <input
                  type="checkbox"
                  checked={openReceiptAfterSave}
                  onChange={e => setOpenReceiptAfterSave(e.target.checked)}
                  className="rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <span>प्रविष्टि सुरक्षित होते ही व्हाट्सएप डिजिटल रसीद खोलें (Auto-open receipt)</span>
              </label>
            )}

            {/* Submit */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-10 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
              >
                रद्द करें
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                {initialData ? 'अपडेट करें' : 'चंदा प्रविष्टि सुरक्षित करें (Save)'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Receipt Modal for newly created record */}
      <WhatsAppReceiptModal
        donation={createdDonation}
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </>
  );
};
