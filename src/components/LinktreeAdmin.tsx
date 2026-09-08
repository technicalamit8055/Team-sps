import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { z } from 'zod';
import { 
  Plus, 
  Trash2, 
  Save, 
  Upload, 
  Image as ImageIcon,
  Link as LinkIcon,
  ExternalLink,
  Pencil
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  PLATFORM_OPTIONS, 
  getPlatformTheme, 
  getPlatformIcon 
} from '@/lib/platformThemes';

// Input validation schema for social links
const socialLinkSchema = z.object({
  platform: z.string().min(1, 'प्लेटफॉर्म चुनें'),
  label: z.string()
    .trim()
    .min(1, 'लेबल डालें')
    .max(100, 'लेबल 100 अक्षरों से कम होना चाहिए'),
  url: z.string()
    .trim()
    .min(1, 'URL डालें')
    .max(500, 'URL 500 अक्षरों से कम होना चाहिए')
    .refine((url) => {
      try {
        const parsed = new URL(url);
        // Prevent dangerous URL schemes
        const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
        return allowedProtocols.includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'सही URL डालें (http://, https://, mailto:, या tel: से शुरू होना चाहिए)')
});

interface CandidateProfile {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
}

interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  color: string | null;
  display_order: number | null;
  is_active: boolean | null;
}

export const LinktreeAdmin: React.FC = () => {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [newLink, setNewLink] = useState({ platform: '', label: '', url: '' });
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('candidate_profile')
        .select('*')
        .eq('is_active', true)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      setProfile(profileData);

      // Fetch links
      const { data: linksData, error: linksError } = await supabase
        .from('social_links')
        .select('*')
        .order('display_order', { ascending: true });

      if (linksError) throw linksError;
      setLinks(linksData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('डेटा लोड करने में त्रुटि');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: keyof CandidateProfile, value: string) => {
    if (profile) {
      setProfile({ ...profile, [field]: value });
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('candidate_profile')
        .update({
          name: profile.name,
          title: profile.title,
          email: profile.email,
          phone: profile.phone,
        })
        .eq('id', profile.id);

      if (error) throw error;
      toast.success('प्रोफाइल सेव हो गई');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('सेव करने में त्रुटि');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('कृपया एक इमेज फाइल चुनें');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('फाइल 5MB से छोटी होनी चाहिए');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `candidate-${profile.id}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('candidate_profile')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: urlData.publicUrl });
      toast.success('फोटो अपलोड हो गई');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error('अपलोड में त्रुटि');
    } finally {
      setUploading(false);
    }
  };

  const addLink = async () => {
    // Validate input with Zod schema
    const validationResult = socialLinkSchema.safeParse(newLink);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const validatedData = validationResult.data;

    try {
      const { data, error } = await supabase
        .from('social_links')
        .insert({
          platform: validatedData.platform,
          label: validatedData.label,
          url: validatedData.url,
          color: validatedData.platform, // Store platform as color key
          display_order: links.length,
          is_active: true,
          candidate_id: profile?.id,
        })
        .select()
        .single();

      if (error) throw error;
      setLinks([...links, data]);
      setNewLink({ platform: '', label: '', url: '' });
      setIsAddLinkOpen(false);
      toast.success('लिंक जोड़ दी गई');
    } catch (error: any) {
      console.error('Error adding link:', error);
      toast.error('लिंक जोड़ने में त्रुटि');
    }
  };

  const updateLink = async (id: string, updates: Partial<SocialLink>) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setLinks(links.map(l => l.id === id ? { ...l, ...updates } : l));
    } catch (error: any) {
      console.error('Error updating link:', error);
      toast.error('अपडेट में त्रुटि');
    }
  };

  const openEditDialog = (link: SocialLink) => {
    setEditingLink({ ...link });
    setIsEditLinkOpen(true);
  };

  const saveEditedLink = async () => {
    if (!editingLink) return;

    // Validate only label and url (platform is read-only)
    const editValidationSchema = z.object({
      label: z.string()
        .trim()
        .min(1, 'लेबल डालें')
        .max(100, 'लेबल 100 अक्षरों से कम होना चाहिए'),
      url: z.string()
        .trim()
        .min(1, 'URL डालें')
        .max(500, 'URL 500 अक्षरों से कम होना चाहिए')
        .refine((url) => {
          try {
            const parsed = new URL(url);
            const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
            return allowedProtocols.includes(parsed.protocol);
          } catch {
            return false;
          }
        }, 'सही URL डालें (http://, https://, mailto:, या tel: से शुरू होना चाहिए)')
    });

    const validationResult = editValidationSchema.safeParse({
      label: editingLink.label,
      url: editingLink.url
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    try {
      const { error } = await supabase
        .from('social_links')
        .update({
          label: editingLink.label.trim(),
          url: editingLink.url.trim()
        })
        .eq('id', editingLink.id);

      if (error) throw error;
      
      setLinks(links.map(l => l.id === editingLink.id ? { ...l, label: editingLink.label.trim(), url: editingLink.url.trim() } : l));
      setIsEditLinkOpen(false);
      setEditingLink(null);
      toast.success('लिंक अपडेट हो गई');
    } catch (error: any) {
      console.error('Error updating link:', error);
      toast.error('अपडेट में त्रुटि');
    }
  };

  const deleteLink = async (id: string) => {
    try {
      const { error } = await supabase
        .from('social_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLinks(links.filter(l => l.id !== id));
      toast.success('लिंक हटा दी गई');
    } catch (error: any) {
      console.error('Error deleting link:', error);
      toast.error('हटाने में त्रुटि');
    }
  };

  const moveLink = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const newLinks = [...links];
    [newLinks[index], newLinks[newIndex]] = [newLinks[newIndex], newLinks[index]];

    // Update display orders
    const updates = newLinks.map((link, i) => ({
      id: link.id,
      display_order: i,
    }));

    setLinks(newLinks.map((l, i) => ({ ...l, display_order: i })));

    try {
      for (const update of updates) {
        await supabase
          .from('social_links')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error reordering:', error);
      fetchData(); // Refresh on error
    }
  };

  if (loading) {
    return (
      <div className="glass-panel p-5">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="glass-panel p-5">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          प्रोफाइल सेटिंग्स
        </h2>

        {/* Avatar Upload */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border-2 border-primary">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
              <Upload className="w-4 h-4 text-primary-foreground" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          <div>
            <p className="font-medium">प्रोफाइल फोटो</p>
            <p className="text-sm text-muted-foreground">
              {uploading ? 'अपलोड हो रहा है...' : 'क्लिक करें या ड्रैग करें'}
            </p>
          </div>
        </div>

        {/* Profile Fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">नाम</Label>
            <Input
              id="name"
              value={profile?.name || ''}
              onChange={(e) => handleProfileChange('name', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="title">पद/बायो</Label>
            <Input
              id="title"
              value={profile?.title || ''}
              onChange={(e) => handleProfileChange('title', e.target.value)}
              placeholder="उम्मीदवार - वार्ड 15"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">ईमेल</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="phone">फोन</Label>
            <Input
              id="phone"
              value={profile?.phone || ''}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <Button onClick={saveProfile} disabled={saving} className="mt-4">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'सेव हो रहा है...' : 'प्रोफाइल सेव करें'}
        </Button>
      </div>

      {/* Links Section */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            सोशल लिंक्स
          </h2>
          <Dialog open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                नई लिंक
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>नई लिंक जोड़ें</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>प्लेटफॉर्म</Label>
                  <Select
                    value={newLink.platform}
                    onValueChange={(v) => setNewLink({ ...newLink, platform: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="प्लेटफॉर्म चुनें" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORM_OPTIONS.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <span 
                              className={`w-3 h-3 rounded-full ${getPlatformTheme(p.value).badgeClassName}`}
                            />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>लेबल</Label>
                  <Input
                    value={newLink.label}
                    onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                    placeholder="मुझे WhatsApp करें"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>URL</Label>
                  <Input
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    placeholder="https://wa.me/919876543210"
                    className="mt-1"
                  />
                </div>
                
                {/* Live Preview */}
                {newLink.platform && newLink.label && (
                  <div>
                    <Label className="text-muted-foreground text-xs">प्रीव्यू</Label>
                    <div 
                      className={`mt-2 flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl font-semibold text-base ${getPlatformTheme(newLink.platform).className}`}
                    >
                      <span className="flex items-center gap-2.5">
                        {getPlatformIcon(newLink.platform)}
                        {newLink.label || 'Label'}
                      </span>
                    </div>
                  </div>
                )}
                
                <Button onClick={addLink} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  लिंक जोड़ें
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {links.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            कोई लिंक नहीं है। ऊपर "नई लिंक" पर क्लिक करें।
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((link, index) => {
              const theme = getPlatformTheme(link.platform);
              return (
                <div
                  key={link.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveLink(index, 'up')}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveLink(index, 'down')}
                      disabled={index === links.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Platform color badge */}
                  <div 
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${theme.badgeClassName}`}
                  >
                    {getPlatformIcon(link.platform)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{link.label}</span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {PLATFORM_OPTIONS.find(p => p.value === link.platform)?.label || link.platform}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={link.is_active ?? true}
                      onCheckedChange={(checked) => updateLink(link.id, { is_active: checked })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(link)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLink(link.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Link Dialog */}
      <Dialog open={isEditLinkOpen} onOpenChange={(open) => {
        setIsEditLinkOpen(open);
        if (!open) setEditingLink(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Social Link</DialogTitle>
          </DialogHeader>
          {editingLink && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>प्लेटफॉर्म</Label>
                <div className="mt-1 flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <div 
                    className={`w-6 h-6 rounded flex items-center justify-center text-white ${getPlatformTheme(editingLink.platform).badgeClassName}`}
                  >
                    {getPlatformIcon(editingLink.platform)}
                  </div>
                  <span className="text-muted-foreground">
                    {PLATFORM_OPTIONS.find(p => p.value === editingLink.platform)?.label || editingLink.platform}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">(Read-only)</span>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-label">लेबल</Label>
                <Input
                  id="edit-label"
                  value={editingLink.label}
                  onChange={(e) => setEditingLink({ ...editingLink, label: e.target.value })}
                  placeholder="Follow us on Facebook"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-url">URL</Label>
                <Input
                  id="edit-url"
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  placeholder="https://facebook.com/yourpage"
                  className="mt-1"
                />
              </div>
              
              {/* Live Preview */}
              <div>
                <Label className="text-muted-foreground text-xs">प्रीव्यू</Label>
                <div 
                  className={`mt-2 flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl font-semibold text-base ${getPlatformTheme(editingLink.platform).className}`}
                >
                  <span className="flex items-center gap-2.5">
                    {getPlatformIcon(editingLink.platform)}
                    {editingLink.label || 'Label'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setIsEditLinkOpen(false);
                    setEditingLink(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={saveEditedLink} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Link */}
      <div className="text-center">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          लाइव पेज देखें
        </a>
      </div>
    </div>
  );
};
