import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { AboutSection } from "@/components/landing/AboutSection";
import { InitiativesSection } from "@/components/landing/InitiativesSection";
import { JoinTeamSection } from "@/components/landing/JoinTeamSection";
import { ConnectSection } from "@/components/landing/ConnectSection";
import { Footer } from "@/components/landing/Footer";

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

  // The page never blocks on this fetch. Every field below has a hard-coded
  // fallback, so the landing page paints on the first frame and the Supabase
  // values swap in when they arrive (stale-while-revalidate). Waiting on a
  // cold Supabase instance here was the whole of the first-load delay.
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const { data: profileData } = await supabase
          .from("candidate_profile")
          .select("*")
          .eq("is_active", true)
          .maybeSingle();

        if (profileData && !cancelled) {
          setProfile(profileData);

          const { data: linksData } = await supabase
            .from("social_links")
            .select("*")
            .eq("candidate_id", profileData.id)
            .eq("is_active", true)
            .order("display_order", { ascending: true });

          if (linksData && !cancelled) {
            setLinks(linksData);
          }
        }
      } catch (error) {
        console.error("Error fetching candidate data:", error);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Graceful defaults for Suraj Pratap
  const displayName = profile?.name && !profile.name.includes('विशाल') ? profile.name : "सुरज प्रताप";
  const displayTitle = profile?.title || "संस्थापक एवं मुख्य मार्गदर्शक - Team SPS";
  const displayPhone = profile?.phone || "+91 9430588888";
  const displayEmail = profile?.email || "teamsurajpratap@gmail.com";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-victory-saffron selection:text-white">
      {/* Sticky Navigation Bar */}
      <Navbar phone={displayPhone} />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Section with Suraj Pratap's portrait, statement, CTAs, and impact stats */}
        <HeroSection
          name={displayName}
          title={displayTitle}
          phone={displayPhone}
        />

        {/* About Section: Story, Vision, Core Pillars */}
        <AboutSection
          name={displayName}
          title={displayTitle}
        />

        {/* Initiatives & Public Programs: Janta Portal, Youth Cell, Health, Infra, Samiti */}
        <div id="vision-section">
          <InitiativesSection />
        </div>

        {/* Join Team SPS Volunteer Form */}
        <JoinTeamSection phone={displayPhone} />

        {/* Connect & Social Channels, Helpline & Message Form */}
        <ConnectSection
          name={displayName}
          email={displayEmail}
          phone={displayPhone}
          links={links}
        />
      </main>

      {/* Footer */}
      <Footer
        name={displayName}
        phone={displayPhone}
        email={displayEmail}
      />
    </div>
  );
}
