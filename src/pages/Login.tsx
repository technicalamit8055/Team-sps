import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock, Phone } from 'lucide-react';
import teamLogo from '@/assets/team-logo.png';
import { toast } from 'sonner';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {
    signIn
  } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error('कृपया Username और Password दोनों दर्ज करें');
      return;
    }
    setIsLoading(true);
    const { error, role } = await signIn(username, password);
    setIsLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('स्वागत है! Login सफल।');
      if (role === 'admin') {
        navigate('/master');
      } else if (role === 'citizen') {
        navigate('/janta');
      } else {
        navigate('/election');
      }
    }
  };
  return <div className="min-h-screen bg-gradient-to-br from-victory-saffron/20 via-background to-victory-navy/10 flex items-center justify-center p-4">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-20 left-20 w-32 h-32 border-4 border-victory-saffron rounded-full" />
      <div className="absolute bottom-20 right-20 w-48 h-48 border-4 border-victory-navy rounded-full" />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 border-4 border-victory-green rounded-full" />
    </div>

    <Card className="w-full max-w-md glass-card border-victory-saffron/30 relative z-10">
      <CardHeader className="text-center space-y-4">
        {/* Logo */}
        <div className="mx-auto">
          <img src={teamLogo} alt="Team Suraj Pratap Logo" className="w-48 h-auto object-contain" />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-victory-saffron" />
              Username (उपयोगकर्ता नाम)
            </Label>
            <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} className="border-border/50 focus:border-victory-saffron" autoComplete="username" placeholder="@Username" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-medium flex items-center gap-2">
              <Lock className="w-4 h-4 text-victory-saffron" />
              Password (पासवर्ड)
            </Label>
            <Input id="password" type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} className="border-border/50 focus:border-victory-saffron" autoComplete="current-password" />
          </div>

          <Button type="submit" className="w-full btn-saffron text-lg py-6" disabled={isLoading}>
            {isLoading ? <span className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Login हो रहा है...
            </span> : 'Login करें'}
          </Button>
        </form>

        {/* Help Section */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">अकाउंट नहीं है?</p>
            <div className="flex items-center justify-center gap-2 text-victory-navy font-medium">
              <Phone className="w-4 h-4" />
              <span> कार्यालय से संपर्क करें</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-victory-saffron" />
            <span className="w-2 h-2 rounded-full bg-victory-navy" />
            <span className="w-2 h-2 rounded-full bg-victory-green" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            पंचायत चुनाव 2026
          </p>
        </div>
      </CardContent>
    </Card>
  </div>;
}