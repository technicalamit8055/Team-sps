import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { z } from 'zod';
import { 
  MapPin, FileText, Image, MessageSquare, Send, 
  CheckCircle, Clock, AlertCircle, User, LogOut 
} from 'lucide-react';

// Input validation schema for grievances
const grievanceSchema = z.object({
  subject: z.string()
    .trim()
    .min(3, 'विषय कम से कम 3 अक्षर का होना चाहिए')
    .max(200, 'विषय 200 अक्षरों से कम होना चाहिए'),
  description: z.string()
    .trim()
    .max(2000, 'विवरण 2000 अक्षरों से कम होना चाहिए')
    .optional()
    .or(z.literal(''))
});

interface Scheme {
  id: string;
  title: string;
  description: string | null;
  eligibility: string | null;
  ward_numbers: number[] | null;
}

interface CampaignAd {
  id: string;
  title: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
}

interface Grievance {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  created_at: string;
}

export default function JantaPortal() {
  const { profile, signOut } = useAuth();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [ads, setAds] = useState<CampaignAd[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [newGrievance, setNewGrievance] = useState({ subject: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [profile?.ward_number]);

  const fetchData = async () => {
    try {
      // Fetch schemes (filter by ward if applicable)
      const { data: schemesData } = await supabase
        .from('schemes')
        .select('*')
        .eq('is_active', true);

      // Filter schemes for user's ward
      const filteredSchemes = schemesData?.filter(scheme => 
        !scheme.ward_numbers?.length || 
        scheme.ward_numbers.includes(profile?.ward_number || 0)
      ) || [];
      setSchemes(filteredSchemes);

      // Fetch campaign ads
      const { data: adsData } = await supabase
        .from('campaign_ads')
        .select('*')
        .eq('is_active', true);
      setAds(adsData || []);

      // Fetch user's grievances
      const { data: grievancesData } = await supabase
        .from('grievances')
        .select('*')
        .order('created_at', { ascending: false });
      setGrievances(grievancesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input with Zod schema
    const validationResult = grievanceSchema.safeParse(newGrievance);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const validatedData = validationResult.data;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('grievances')
        .insert({
          subject: validatedData.subject,
          description: validatedData.description || null,
          ward: profile?.ward_number,
          submitted_by: user.id
        });

      if (error) throw error;

      toast.success('शिकायत सफलतापूर्वक दर्ज हो गई');
      setNewGrievance({ subject: '', description: '' });
      fetchData();
    } catch (error) {
      toast.error('शिकायत दर्ज करने में त्रुटि');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { class: string; icon: any; label: string }> = {
      pending: { class: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
      in_progress: { class: 'bg-blue-100 text-blue-700', icon: AlertCircle, label: 'In Progress' },
      resolved: { class: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Resolved' }
    };
    const config = styles[status] || styles.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.class}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-victory-green/5 via-background to-victory-saffron/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-victory-green/20 flex items-center justify-center">
              <User className="w-5 h-5 text-victory-green" />
            </div>
            <div>
              <h1 className="font-bold text-victory-navy">Janta Portal</h1>
              <p className="text-xs text-muted-foreground">
                {profile?.full_name} • Ward {profile?.ward_number || 'N/A'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Tabs defaultValue="ward" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="ward" className="text-xs sm:text-sm">
              <MapPin className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">My Ward</span>
            </TabsTrigger>
            <TabsTrigger value="schemes" className="text-xs sm:text-sm">
              <FileText className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Schemes</span>
            </TabsTrigger>
            <TabsTrigger value="ads" className="text-xs sm:text-sm">
              <Image className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Campaign</span>
            </TabsTrigger>
            <TabsTrigger value="grievance" className="text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Grievance</span>
            </TabsTrigger>
          </TabsList>

          {/* My Ward */}
          <TabsContent value="ward">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-victory-navy">
                  <MapPin className="w-5 h-5" />
                  Ward {profile?.ward_number || 'N/A'} की जानकारी
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MapPin className="w-16 h-16 text-victory-green/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    आपके Ward के लिए विशेष योजनाएं और घोषणाएं यहां दिखाई जाएंगी।
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="outline" className="border-victory-saffron text-victory-saffron">
                      विकास कार्य
                    </Badge>
                    <Badge variant="outline" className="border-victory-navy text-victory-navy">
                      सड़क निर्माण
                    </Badge>
                    <Badge variant="outline" className="border-victory-green text-victory-green">
                      स्वच्छता
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Government Schemes */}
          <TabsContent value="schemes">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-victory-navy">सरकारी योजनाएं</h2>
              {schemes.length > 0 ? (
                schemes.map(scheme => (
                  <Card key={scheme.id} className="glass-card">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">{scheme.title}</h3>
                      {scheme.description && (
                        <p className="text-sm text-muted-foreground mb-3">{scheme.description}</p>
                      )}
                      {scheme.eligibility && (
                        <div className="bg-victory-green/10 rounded-lg p-3">
                          <p className="text-xs font-medium text-victory-green mb-1">पात्रता:</p>
                          <p className="text-sm">{scheme.eligibility}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="glass-card">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">अभी कोई योजना उपलब्ध नहीं है</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Campaign Ads */}
          <TabsContent value="ads">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-victory-navy">चुनाव प्रचार</h2>
              {ads.length > 0 ? (
                <div className="grid gap-4">
                  {ads.map(ad => (
                    <Card key={ad.id} className="glass-card overflow-hidden">
                      {ad.media_url && (
                        <div className="aspect-video bg-muted">
                          <img 
                            src={ad.media_url} 
                            alt={ad.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-foreground mb-2">{ad.title}</h3>
                        {ad.content && (
                          <p className="text-sm text-muted-foreground">{ad.content}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="glass-card">
                  <CardContent className="p-8 text-center">
                    <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">अभी कोई प्रचार सामग्री उपलब्ध नहीं है</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Grievance */}
          <TabsContent value="grievance">
            <div className="space-y-6">
              {/* Submit New Grievance */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg text-victory-navy">शिकायत दर्ज करें</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitGrievance} className="space-y-4">
                    <div className="space-y-2">
                      <Label>विषय *</Label>
                      <Input
                        placeholder="शिकायत का विषय लिखें"
                        value={newGrievance.subject}
                        onChange={(e) => setNewGrievance(prev => ({ ...prev, subject: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>विवरण</Label>
                      <Textarea
                        placeholder="शिकायत का विस्तृत विवरण लिखें..."
                        value={newGrievance.description}
                        onChange={(e) => setNewGrievance(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="w-full btn-saffron" disabled={isSubmitting}>
                      <Send className="w-4 h-4 mr-2" />
                      {isSubmitting ? 'जमा हो रहा है...' : 'शिकायत जमा करें'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Previous Grievances */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-victory-navy">मेरी शिकायतें</h2>
                {grievances.length > 0 ? (
                  grievances.map(grievance => (
                    <Card key={grievance.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-foreground">{grievance.subject}</h3>
                          {getStatusBadge(grievance.status)}
                        </div>
                        {grievance.description && (
                          <p className="text-sm text-muted-foreground mb-2">{grievance.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(grievance.created_at).toLocaleDateString('hi-IN')}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="glass-card">
                    <CardContent className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">आपने अभी तक कोई शिकायत दर्ज नहीं की है</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
