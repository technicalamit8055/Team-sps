import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getPlatformTheme, getPlatformIcon } from "@/lib/platformThemes";

interface CandidateProfile {
  id: string;
  name: string;
  title: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
}

interface SocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  color: string | null;
  display_order: number;
}

export default function LandingPage() {
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: profileData } = await supabase
          .from("candidate_profile")
          .select("*")
          .eq("is_active", true)
          .maybeSingle();

        if (profileData) {
          setProfile(profileData);

          const { data: linksData } = await supabase
            .from("social_links")
            .select("*")
            .eq("candidate_id", profileData.id)
            .eq("is_active", true)
            .order("display_order", { ascending: true });

          if (linksData) {
            setLinks(linksData);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-victory-saffron/30 via-background to-indian-green/20 flex items-center justify-center p-4">
        <div className="w-full max-w-sm backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="w-28 h-28 rounded-full bg-white/20" />
            <Skeleton className="h-7 w-40 bg-white/20" />
            <Skeleton className="h-4 w-52 bg-white/20" />
          </div>
          <div className="space-y-3 mt-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-victory-saffron/30 via-background to-indian-green/20 flex items-center justify-center p-4">
        <div className="w-full max-w-sm backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Profile not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-victory-saffron/30 via-background to-indian-green/20 flex items-center justify-center p-4">
      {/* Glassmorphism Card */}
      <div className="w-full max-w-sm backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6">
          {/* Avatar with tricolor ring */}
          <div className="relative mb-4">
            <div
              className="w-28 h-28 rounded-full p-1"
              style={{
                background: "linear-gradient(135deg, hsl(30,100%,50%) 0%, hsl(30,100%,50%) 33%, hsl(0,0%,100%) 33%, hsl(0,0%,100%) 66%, hsl(142,70%,35%) 66%)"
              }}
            >
              <div className="w-full h-full rounded-full bg-background/80 backdrop-blur-sm p-0.5">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-victory-saffron/20 to-indian-green/20 flex items-center justify-center">
                    <span className="text-3xl font-bold text-foreground/70">
                      {profile.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-foreground mb-1 text-center">
            {profile.name}
          </h1>

          {/* Title */}
          {profile.title && (
            <p className="text-base text-victory-saffron font-medium text-center">
              {profile.title}
            </p>
          )}
        </div>

        {/* Social Links */}
        <div className="space-y-2.5 mb-6">
          {links.map((link) => {
            const theme = getPlatformTheme(link.platform);
            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${theme.className}`}
              >
                <span className="flex items-center gap-2.5">
                  {getPlatformIcon(link.platform)}
                  {link.label}
                </span>
              </a>
            );
          })}
        </div>

        {/* Contact Section */}
        <div className="space-y-2.5">
          {/* Email */}
          {profile.email && (
            <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Mail className="w-4 h-4" />
                <span className="text-xs">Email:</span>
              </div>
              <a
                href={`mailto:${profile.email}`}
                className="block text-center text-foreground text-sm font-medium hover:text-victory-saffron transition-colors"
              >
                {profile.email}
              </a>
            </div>
          )}

          {/* Phone */}
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl font-semibold text-base backdrop-blur-md bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <Phone className="w-5 h-5 text-indian-green" />
              <span>Call: {profile.phone}</span>
            </a>
          )}
        </div>

        {/* Master Samiti / Event Dashboard Direct Link */}
        <div className="pt-2">
          <Link
            to="/samiti"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>🚩 दुर्गा पूजा एवं उत्सव समिति मास्टर डैशबोर्ड</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/60">
            Powered by Victory OS
          </p>
        </div>
      </div>
    </div>
  );
}
