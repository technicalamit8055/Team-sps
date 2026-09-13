export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string | null
          id: string
          message: string
          type: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          type: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          type?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      booths: {
        Row: {
          agent: string | null
          created_at: string | null
          id: string
          name: string
          number: number
          total_voters: number | null
          updated_at: string | null
          ward: number | null
        }
        Insert: {
          agent?: string | null
          created_at?: string | null
          id?: string
          name: string
          number: number
          total_voters?: number | null
          updated_at?: string | null
          ward?: number | null
        }
        Update: {
          agent?: string | null
          created_at?: string | null
          id?: string
          name?: string
          number?: number
          total_voters?: number | null
          updated_at?: string | null
          ward?: number | null
        }
        Relationships: []
      }
      campaign_ads: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          media_type: string | null
          media_url: string | null
          title: string
          ward_numbers: number[] | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          media_url?: string | null
          title: string
          ward_numbers?: number[] | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          media_type?: string | null
          media_url?: string | null
          title?: string
          ward_numbers?: number[] | null
        }
        Relationships: []
      }
      campaign_settings: {
        Row: {
          candidate_name: string | null
          constituency: string | null
          created_at: string | null
          election_date: string | null
          id: string
          total_voters: number | null
          updated_at: string | null
          winning_goal: number | null
        }
        Insert: {
          candidate_name?: string | null
          constituency?: string | null
          created_at?: string | null
          election_date?: string | null
          id?: string
          total_voters?: number | null
          updated_at?: string | null
          winning_goal?: number | null
        }
        Update: {
          candidate_name?: string | null
          constituency?: string | null
          created_at?: string | null
          election_date?: string | null
          id?: string
          total_voters?: number | null
          updated_at?: string | null
          winning_goal?: number | null
        }
        Relationships: []
      }
      candidate_profile: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          event_date: string | null
          id: string
          location: string | null
          title: string
          ward: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          title: string
          ward?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          id?: string
          location?: string | null
          title?: string
          ward?: number | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          created_by: string
          date: string | null
          description: string
          id: string
          ward: number | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          created_by: string
          date?: string | null
          description: string
          id?: string
          ward?: number | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          created_by?: string
          date?: string | null
          description?: string
          id?: string
          ward?: number | null
        }
        Relationships: []
      }
      grievances: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          status: string | null
          subject: string
          submitted_by: string
          ward: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          subject: string
          submitted_by: string
          ward?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          status?: string | null
          subject?: string
          submitted_by?: string
          ward?: number | null
        }
        Relationships: []
      }
      influencers: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          influence: string | null
          name: string
          phone: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          ward: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          influence?: string | null
          name: string
          phone?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          ward?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          influence?: string | null
          name?: string
          phone?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          ward?: number | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          quantity: number | null
          unit: string | null
          updated_at: string | null
          ward: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          ward?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          quantity?: number | null
          unit?: string | null
          updated_at?: string | null
          ward?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string | null
          username: string
          ward_number: number | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
          username: string
          ward_number?: number | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
          username?: string
          ward_number?: number | null
        }
        Relationships: []
      }
      schemes: {
        Row: {
          created_at: string | null
          description: string | null
          eligibility: string | null
          id: string
          is_active: boolean | null
          title: string
          ward_numbers: number[] | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          ward_numbers?: number[] | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          eligibility?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          ward_numbers?: number[] | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          candidate_id: string | null
          color: string | null
          created_at: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          label: string
          platform: string
          url: string
        }
        Insert: {
          candidate_id?: string | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label: string
          platform: string
          url: string
        }
        Update: {
          candidate_id?: string | null
          color?: string | null
          created_at?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          label?: string
          platform?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_links_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidate_profile_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          title: string
          ward: number | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          title: string
          ward?: number | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          title?: string
          ward?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voter_conversions: {
        Row: {
          converted_at: string | null
          id: string
          new_status: string
          points_awarded: number | null
          previous_status: string
          voter_id: string | null
          worker_id: string | null
        }
        Insert: {
          converted_at?: string | null
          id?: string
          new_status: string
          points_awarded?: number | null
          previous_status: string
          voter_id?: string | null
          worker_id?: string | null
        }
        Update: {
          converted_at?: string | null
          id?: string
          new_status?: string
          points_awarded?: number | null
          previous_status?: string
          voter_id?: string | null
          worker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voter_conversions_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "voters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voter_conversions_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      voters: {
        Row: {
          address_1: string | null
          address_2: string | null
          address_3: string | null
          age: number | null
          assigned_worker_id: string | null
          booth: string | null
          caste: string | null
          created_at: string | null
          created_by: string | null
          epic_no: string | null
          gender: string | null
          guardian_name_english: string | null
          guardian_name_hindi: string | null
          has_voted: boolean | null
          house_no: string | null
          id: string
          impact_level: string | null
          is_alive: boolean | null
          linked_user_id: string | null
          main_man_family: string | null
          name: string
          name_english: string | null
          name_hindi: string | null
          phone: string | null
          relation_type: string | null
          sl_no: number | null
          status: string | null
          updated_at: string | null
          voter_status: string | null
          ward: number | null
        }
        Insert: {
          address_1?: string | null
          address_2?: string | null
          address_3?: string | null
          age?: number | null
          assigned_worker_id?: string | null
          booth?: string | null
          caste?: string | null
          created_at?: string | null
          created_by?: string | null
          epic_no?: string | null
          gender?: string | null
          guardian_name_english?: string | null
          guardian_name_hindi?: string | null
          has_voted?: boolean | null
          house_no?: string | null
          id?: string
          impact_level?: string | null
          is_alive?: boolean | null
          linked_user_id?: string | null
          main_man_family?: string | null
          name: string
          name_english?: string | null
          name_hindi?: string | null
          phone?: string | null
          relation_type?: string | null
          sl_no?: number | null
          status?: string | null
          updated_at?: string | null
          voter_status?: string | null
          ward?: number | null
        }
        Update: {
          address_1?: string | null
          address_2?: string | null
          address_3?: string | null
          age?: number | null
          assigned_worker_id?: string | null
          booth?: string | null
          caste?: string | null
          created_at?: string | null
          created_by?: string | null
          epic_no?: string | null
          gender?: string | null
          guardian_name_english?: string | null
          guardian_name_hindi?: string | null
          has_voted?: boolean | null
          house_no?: string | null
          id?: string
          impact_level?: string | null
          is_alive?: boolean | null
          linked_user_id?: string | null
          main_man_family?: string | null
          name?: string
          name_english?: string | null
          name_hindi?: string | null
          phone?: string | null
          relation_type?: string | null
          sl_no?: number | null
          status?: string | null
          updated_at?: string | null
          voter_status?: string | null
          ward?: number | null
        }
        Relationships: []
      }
      worker_rewards: {
        Row: {
          awarded_by: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          points: number | null
          reward_type: string
          worker_id: string
        }
        Insert: {
          awarded_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          points?: number | null
          reward_type: string
          worker_id: string
        }
        Update: {
          awarded_by?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          points?: number | null
          reward_type?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_rewards_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worker_rewards_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      samiti_entities: {
        Row: {
          created_at: string | null
          established_year: number | null
          id: string
          location: string | null
          name: string
          registration_no: string | null
          tagline: string | null
          type: string
          updated_at: string | null
          upi_id: string | null
        }
        Insert: {
          created_at?: string | null
          established_year?: number | null
          id: string
          location?: string | null
          name: string
          registration_no?: string | null
          tagline?: string | null
          type: string
          updated_at?: string | null
          upi_id?: string | null
        }
        Update: {
          created_at?: string | null
          established_year?: number | null
          id?: string
          location?: string | null
          name?: string
          registration_no?: string | null
          tagline?: string | null
          type?: string
          updated_at?: string | null
          upi_id?: string | null
        }
        Relationships: []
      }
      samiti_events: {
        Row: {
          created_at: string | null
          end_date: string | null
          entity_id: string
          fiscal_year: string
          id: string
          is_active: boolean | null
          start_date: string | null
          target_budget: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          entity_id: string
          fiscal_year: string
          id: string
          is_active?: boolean | null
          start_date?: string | null
          target_budget?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          entity_id?: string
          fiscal_year?: string
          id?: string
          is_active?: boolean | null
          start_date?: string | null
          target_budget?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "samiti_events_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "samiti_entities"
            referencedColumns: ["id"]
          }
        ]
      }
      samiti_donations: {
        Row: {
          accepted_amount: number
          address1: string | null
          address2: string | null
          balance_amount: number
          caste: string | null
          category: string
          collector_name: string | null
          created_at: string | null
          date: string
          event_id: string
          id: string
          identity: string | null
          is_handover_done: boolean | null
          name: string
          payment_mode: string
          payments: Json
          phone: string | null
          receipt_url: string | null
          received_amount: number
          remarks: string | null
          serial_number: number
          village: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_amount?: number
          address1?: string | null
          address2?: string | null
          balance_amount?: number
          caste?: string | null
          category: string
          collector_name?: string | null
          created_at?: string | null
          date: string
          event_id: string
          id: string
          identity?: string | null
          is_handover_done?: boolean | null
          name: string
          payment_mode?: string
          payments?: Json
          phone?: string | null
          receipt_url?: string | null
          received_amount?: number
          remarks?: string | null
          serial_number: number
          village?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_amount?: number
          address1?: string | null
          address2?: string | null
          balance_amount?: number
          caste?: string | null
          category?: string
          collector_name?: string | null
          created_at?: string | null
          date?: string
          event_id?: string
          id?: string
          identity?: string | null
          is_handover_done?: boolean | null
          name?: string
          payment_mode?: string
          payments?: Json
          phone?: string | null
          receipt_url?: string | null
          received_amount?: number
          remarks?: string | null
          serial_number?: number
          village?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "samiti_donations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "samiti_events"
            referencedColumns: ["id"]
          }
        ]
      }
      samiti_expenses: {
        Row: {
          amount_paid: number
          balance_due: number
          bill_receipt_url: string | null
          category: string
          created_at: string | null
          event_id: string
          expense_date: string
          id: string
          notes: string | null
          paid_by: string | null
          payment_mode: string
          total_amount: number
          vendor_name: string
          vendor_phone: string | null
          voucher_no: string
        }
        Insert: {
          amount_paid?: number
          balance_due?: number
          bill_receipt_url?: string | null
          category: string
          created_at?: string | null
          event_id: string
          expense_date: string
          id: string
          notes?: string | null
          paid_by?: string | null
          payment_mode?: string
          total_amount?: number
          vendor_name: string
          vendor_phone?: string | null
          voucher_no: string
        }
        Update: {
          amount_paid?: number
          balance_due?: number
          bill_receipt_url?: string | null
          category?: string
          created_at?: string | null
          event_id?: string
          expense_date?: string
          id?: string
          notes?: string | null
          paid_by?: string | null
          payment_mode?: string
          total_amount?: number
          vendor_name?: string
          vendor_phone?: string | null
          voucher_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "samiti_expenses_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "samiti_events"
            referencedColumns: ["id"]
          }
        ]
      }
      samiti_cash_handovers: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          event_id: string
          handed_at: string | null
          id: string
          notes: string | null
          status: string
          volunteer_name: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          event_id: string
          handed_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          volunteer_name: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          event_id?: string
          handed_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          volunteer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "samiti_cash_handovers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "samiti_events"
            referencedColumns: ["id"]
          }
        ]
      }
      master_staff: {
        Row: {
          avatar_color: string | null
          created_at: string | null
          designation: string | null
          email: string | null
          id: string
          joined_date: string
          name: string
          password_hash: string | null
          phone: string
          primary_role: string
          status: string
          upi_id: string | null
          user_id: string | null
          username: string
          workspace_permissions: Json
        }
        Insert: {
          avatar_color?: string | null
          created_at?: string | null
          designation?: string | null
          email?: string | null
          id: string
          joined_date?: string
          name: string
          password_hash?: string | null
          phone: string
          primary_role: string
          status?: string
          upi_id?: string | null
          user_id?: string | null
          username: string
          workspace_permissions?: Json
        }
        Update: {
          avatar_color?: string | null
          created_at?: string | null
          designation?: string | null
          email?: string | null
          id?: string
          joined_date?: string
          name?: string
          password_hash?: string | null
          phone?: string
          primary_role?: string
          status?: string
          upi_id?: string | null
          user_id?: string | null
          username?: string
          workspace_permissions?: Json
        }
        Relationships: []
      }
    }
    Views: {
      candidate_profile_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_worker_leaderboard: {
        Args: { days_back?: number }
        Returns: {
          has_priority_logistics: boolean
          total_conversions: number
          total_points: number
          worker_id: string
          worker_name: string
        }[]
      }
      get_worker_stats: {
        Args: { worker_uuid: string }
        Returns: {
          conversions_30_days: number
          conversions_7_days: number
          current_rank: number
          has_priority_logistics: boolean
          total_conversions: number
          total_points: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "worker" | "citizen"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "worker", "citizen"],
    },
  },
} as const
