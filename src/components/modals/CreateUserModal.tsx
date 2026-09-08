import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserPlus, Copy, Share2, User, Shield, MapPin, Phone, Key, Check } from 'lucide-react';

interface CreateUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreatedUser {
  id: string;
  username: string;
  full_name: string;
  role: string;
  ward_number?: number;
  password: string;
}

export function CreateUserModal({ open, onOpenChange }: CreateUserModalProps) {
  const { role, session } = useAuth();
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [wardNumber, setWardNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [copied, setCopied] = useState(false);

  const generateUsername = (name: string, ward: string) => {
    const cleanName = name.split(' ')[0].replace(/[^a-zA-Z]/g, '');
    const wardSuffix = ward ? `_W${ward}` : '';
    const randomNum = Math.floor(Math.random() * 100);
    return `${cleanName}${wardSuffix}_${randomNum}`;
  };

  const generatePassword = () => {
    // Strong password: 12 chars with uppercase, lowercase, numbers, and special chars
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%&*';
    const allChars = uppercase + lowercase + numbers + special;
    
    // Ensure at least one of each type
    let password = 
      uppercase[Math.floor(Math.random() * uppercase.length)] +
      lowercase[Math.floor(Math.random() * lowercase.length)] +
      numbers[Math.floor(Math.random() * numbers.length)] +
      special[Math.floor(Math.random() * special.length)];
    
    // Fill remaining 8 characters randomly
    for (let i = 0; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !selectedRole) {
      toast.error('कृपया नाम और भूमिका दर्ज करें');
      return;
    }

    setIsLoading(true);
    const username = generateUsername(fullName, wardNumber);
    const password = generatePassword();

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          username,
          password,
          full_name: fullName,
          role: selectedRole,
          ward_number: wardNumber ? parseInt(wardNumber) : null,
          phone: phone || null
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Password is kept client-side only - not returned from server
      setCreatedUser({
        ...data.user,
        password: password // Use the client-generated password
      });
      toast.success('User सफलतापूर्वक बनाया गया!');
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast.error(err.message || 'User बनाने में त्रुटि');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCredentials = () => {
    if (createdUser) {
      const text = `Victory OS Login Details:\nUsername: ${createdUser.username}\nPassword: ${createdUser.password}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Credentials copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnWhatsApp = () => {
    if (createdUser) {
      const text = encodeURIComponent(
        `🗳️ Victory OS Login Details\n\n` +
        `नमस्कार ${createdUser.full_name} जी,\n\n` +
        `आपका Victory OS अकाउंट तैयार है:\n` +
        `👤 Username: ${createdUser.username}\n` +
        `🔑 Password: ${createdUser.password}\n\n` +
        `कृपया इस जानकारी को सुरक्षित रखें।`
      );
      window.open(`https://wa.me/?text=${text}`, '_blank');
    }
  };

  const resetForm = () => {
    setFullName('');
    setSelectedRole('');
    setWardNumber('');
    setPhone('');
    setCreatedUser(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Available roles based on current user's role
  const availableRoles = role === 'admin' 
    ? ['manager', 'worker', 'citizen']
    : ['worker', 'citizen'];

  const getRoleLabel = (r: string) => {
    const labels: Record<string, string> = {
      admin: 'Admin (प्रशासक)',
      manager: 'Manager (प्रबंधक)',
      worker: 'Worker (कार्यकर्ता)',
      citizen: 'Citizen (नागरिक)'
    };
    return labels[r] || r;
  };

  const getRoleBadgeColor = (r: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500',
      manager: 'bg-victory-saffron',
      worker: 'bg-victory-navy',
      citizen: 'bg-victory-green'
    };
    return colors[r] || 'bg-gray-500';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-victory-navy">
            <UserPlus className="w-5 h-5" />
            नया User बनाएं
          </DialogTitle>
        </DialogHeader>

        {!createdUser ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4 text-victory-saffron" />
                पूरा नाम *
              </Label>
              <Input
                placeholder="जैसे: राजू कुमार"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-victory-saffron" />
                भूमिका (Role) *
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="भूमिका चुनें" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r} value={r}>
                      {getRoleLabel(r)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-victory-saffron" />
                वार्ड नंबर
              </Label>
              <Select value={wardNumber} onValueChange={setWardNumber}>
                <SelectTrigger>
                  <SelectValue placeholder="वार्ड चुनें (वैकल्पिक)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 13 }, (_, i) => i + 1).map((w) => (
                    <SelectItem key={w} value={w.toString()}>
                      Ward {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-victory-saffron" />
                मोबाइल नंबर
              </Label>
              <Input
                type="tel"
                placeholder="जैसे: 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                रद्द करें
              </Button>
              <Button type="submit" className="flex-1 btn-saffron" disabled={isLoading}>
                {isLoading ? 'बना रहा है...' : 'User बनाएं'}
              </Button>
            </div>
          </form>
        ) : (
          /* Success - Digital ID Card */
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-victory-saffron/10 to-victory-navy/10 rounded-xl p-6 border border-victory-saffron/30">
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full bg-victory-green/20 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-victory-green" />
                </div>
                <h3 className="font-bold text-lg text-victory-navy">Digital Identity Card</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-white text-xs mt-2 ${getRoleBadgeColor(createdUser.role)}`}>
                  {getRoleLabel(createdUser.role)}
                </span>
              </div>

              <div className="space-y-3 bg-white/50 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-victory-saffron" />
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-semibold">{createdUser.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-victory-navy" />
                  <div>
                    <p className="text-xs text-muted-foreground">Username</p>
                    <p className="font-mono font-bold text-victory-navy">{createdUser.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Key className="w-5 h-5 text-victory-green" />
                  <div>
                    <p className="text-xs text-muted-foreground">Password</p>
                    <p className="font-mono font-bold text-victory-green text-lg">{createdUser.password}</p>
                  </div>
                </div>

                {createdUser.ward_number && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Ward</p>
                      <p className="font-semibold">Ward {createdUser.ward_number}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={copyCredentials} variant="outline" className="flex-1">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={shareOnWhatsApp} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <Share2 className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
            </div>

            <Button onClick={resetForm} variant="outline" className="w-full">
              + एक और User बनाएं
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
