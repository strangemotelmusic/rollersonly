// Hand-authored from a live schema introspection query run in the Supabase
// SQL Editor (columns + FK constraints), not from `supabase gen types`.
// Regenerate with the real CLI once the project is linked, for full
// accuracy (this omits enum/check-constraint value sets, view/function
// types, and unique-constraint-derived isOneToOne flags).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          location: string | null;
          bio: string | null;
          tier: string;
          is_verified: boolean | null;
          is_admin: boolean;
          stripe_customer_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          location?: string | null;
          bio?: string | null;
          tier?: string;
          is_verified?: boolean | null;
          is_admin?: boolean;
          stripe_customer_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      lofts: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          location: string | null;
          country: string | null;
          description: string | null;
          logo_url: string | null;
          banner_url: string | null;
          is_elite: boolean | null;
          elite_verified_at: string | null;
          total_birds_sold: number | null;
          total_championships: number | null;
          rating: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          location?: string | null;
          country?: string | null;
          description?: string | null;
          logo_url?: string | null;
          banner_url?: string | null;
          is_elite?: boolean | null;
          elite_verified_at?: string | null;
          total_birds_sold?: number | null;
          total_championships?: number | null;
          rating?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lofts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "lofts_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      birds: {
        Row: {
          id: string;
          platform_id: string;
          loft_id: string | null;
          owner_id: string;
          name: string | null;
          ring_number: string | null;
          sex: string | null;
          color: string | null;
          mutation: string | null;
          birth_year: number | null;
          birth_month: number | null;
          sire_id: string | null;
          dam_id: string | null;
          fly_score: number | null;
          kit_score: number | null;
          roll_quality: string | null;
          health_certified: boolean | null;
          health_cert_date: string | null;
          health_cert_url: string | null;
          dna_certified: boolean | null;
          dna_cert_date: string | null;
          dna_cert_url: string | null;
          primary_photo_url: string | null;
          is_active: boolean | null;
          notes: string | null;
          certification_status: string;
          certification_requested_at: string | null;
          certified_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          platform_id: string;
          loft_id?: string | null;
          owner_id: string;
          name?: string | null;
          ring_number?: string | null;
          sex?: string | null;
          color?: string | null;
          mutation?: string | null;
          birth_year?: number | null;
          birth_month?: number | null;
          sire_id?: string | null;
          dam_id?: string | null;
          fly_score?: number | null;
          kit_score?: number | null;
          roll_quality?: string | null;
          health_certified?: boolean | null;
          health_cert_date?: string | null;
          health_cert_url?: string | null;
          dna_certified?: boolean | null;
          dna_cert_date?: string | null;
          dna_cert_url?: string | null;
          primary_photo_url?: string | null;
          is_active?: boolean | null;
          notes?: string | null;
          certification_status?: string;
          certification_requested_at?: string | null;
          certified_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["birds"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "birds_loft_id_fkey";
            columns: ["loft_id"];
            isOneToOne: false;
            referencedRelation: "lofts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "birds_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "birds_sire_id_fkey";
            columns: ["sire_id"];
            isOneToOne: false;
            referencedRelation: "birds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "birds_dam_id_fkey";
            columns: ["dam_id"];
            isOneToOne: false;
            referencedRelation: "birds";
            referencedColumns: ["id"];
          },
        ];
      };
      bird_photos: {
        Row: {
          id: string;
          bird_id: string;
          url: string;
          is_primary: boolean | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          bird_id: string;
          url: string;
          is_primary?: boolean | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bird_photos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bird_photos_bird_id_fkey";
            columns: ["bird_id"];
            isOneToOne: false;
            referencedRelation: "birds";
            referencedColumns: ["id"];
          },
        ];
      };
      bird_results: {
        Row: {
          id: string;
          bird_id: string;
          competition_name: string;
          competition_date: string | null;
          placement: number | null;
          score: number | null;
          category: string | null;
          organization: string | null;
          verified: boolean | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          bird_id: string;
          competition_name: string;
          competition_date?: string | null;
          placement?: number | null;
          score?: number | null;
          category?: string | null;
          organization?: string | null;
          verified?: boolean | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bird_results"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bird_results_bird_id_fkey";
            columns: ["bird_id"];
            isOneToOne: false;
            referencedRelation: "birds";
            referencedColumns: ["id"];
          },
        ];
      };
      competitions: {
        Row: {
          id: string;
          name: string;
          organization: string;
          season: string | null;
          location: string | null;
          competition_date: string | null;
          category: string | null;
          is_verified: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          organization: string;
          season?: string | null;
          location?: string | null;
          competition_date?: string | null;
          category?: string | null;
          is_verified?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["competitions"]["Insert"]>;
        Relationships: [];
      };
      leaderboard_entries: {
        Row: {
          id: string;
          competition_id: string;
          loft_id: string;
          bird_id: string | null;
          placement: number;
          score: number | null;
          kit_size: number | null;
          notes: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          competition_id: string;
          loft_id: string;
          bird_id?: string | null;
          placement: number;
          score?: number | null;
          kit_size?: number | null;
          notes?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["leaderboard_entries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leaderboard_entries_loft_id_fkey";
            columns: ["loft_id"];
            isOneToOne: false;
            referencedRelation: "lofts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leaderboard_entries_bird_id_fkey";
            columns: ["bird_id"];
            isOneToOne: false;
            referencedRelation: "birds";
            referencedColumns: ["id"];
          },
        ];
      };
      auctions: {
        Row: {
          id: string;
          bird_id: string;
          seller_id: string;
          loft_id: string | null;
          title: string;
          description: string | null;
          reserve_price: number;
          starting_bid: number;
          current_bid: number | null;
          buy_now_price: number | null;
          bid_increment: number;
          starts_at: string;
          ends_at: string;
          status: string;
          video_url: string | null;
          video_submitted_at: string | null;
          winner_id: string | null;
          final_price: number | null;
          escrow_held: boolean | null;
          escrow_released: boolean | null;
          escrow_released_at: string | null;
          shipping_confirmed_at: string | null;
          buyer_confirmed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          bird_id: string;
          seller_id: string;
          loft_id?: string | null;
          title: string;
          description?: string | null;
          reserve_price?: number;
          starting_bid: number;
          current_bid?: number | null;
          buy_now_price?: number | null;
          bid_increment?: number;
          starts_at: string;
          ends_at: string;
          status?: string;
          video_url?: string | null;
          video_submitted_at?: string | null;
          winner_id?: string | null;
          final_price?: number | null;
          escrow_held?: boolean | null;
          escrow_released?: boolean | null;
          escrow_released_at?: string | null;
          shipping_confirmed_at?: string | null;
          buyer_confirmed_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["auctions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "auctions_bird_id_fkey";
            columns: ["bird_id"];
            isOneToOne: false;
            referencedRelation: "birds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "auctions_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "auctions_loft_id_fkey";
            columns: ["loft_id"];
            isOneToOne: false;
            referencedRelation: "lofts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "auctions_winner_id_fkey";
            columns: ["winner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bids: {
        Row: {
          id: string;
          auction_id: string;
          bidder_id: string;
          amount: number;
          is_winning: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          auction_id: string;
          bidder_id: string;
          amount: number;
          is_winning?: boolean | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["bids"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bids_auction_id_fkey";
            columns: ["auction_id"];
            isOneToOne: false;
            referencedRelation: "auctions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bids_bidder_id_fkey";
            columns: ["bidder_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fly_videos: {
        Row: {
          id: string;
          loft_id: string;
          uploader_id: string;
          title: string;
          video_url: string;
          thumbnail_url: string | null;
          competition_id: string | null;
          description: string | null;
          view_count: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          loft_id: string;
          uploader_id: string;
          title: string;
          video_url: string;
          thumbnail_url?: string | null;
          competition_id?: string | null;
          description?: string | null;
          view_count?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["fly_videos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "fly_videos_loft_id_fkey";
            columns: ["loft_id"];
            isOneToOne: false;
            referencedRelation: "lofts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fly_videos_uploader_id_fkey";
            columns: ["uploader_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fly_videos_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
        ];
      };
      loft_reviews: {
        Row: {
          id: string;
          loft_id: string;
          reviewer_id: string;
          auction_id: string | null;
          rating: number;
          body: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          loft_id: string;
          reviewer_id: string;
          auction_id?: string | null;
          rating: number;
          body?: string | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["loft_reviews"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "loft_reviews_loft_id_fkey";
            columns: ["loft_id"];
            isOneToOne: false;
            referencedRelation: "lofts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loft_reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "loft_reviews_auction_id_fkey";
            columns: ["auction_id"];
            isOneToOne: false;
            referencedRelation: "auctions";
            referencedColumns: ["id"];
          },
        ];
      };
      matchmaking_requests: {
        Row: {
          id: string;
          requester_id: string;
          bird_a_id: string;
          bird_b_id: string;
          ai_analysis: string | null;
          inbreeding_coefficient: number | null;
          recommendation: string | null;
          common_ancestors: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          requester_id: string;
          bird_a_id: string;
          bird_b_id: string;
          ai_analysis?: string | null;
          inbreeding_coefficient?: number | null;
          recommendation?: string | null;
          common_ancestors?: Json | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["matchmaking_requests"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "matchmaking_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matchmaking_requests_bird_a_id_fkey";
            columns: ["bird_a_id"];
            isOneToOne: false;
            referencedRelation: "birds";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matchmaking_requests_bird_b_id_fkey";
            columns: ["bird_b_id"];
            isOneToOne: false;
            referencedRelation: "birds";
            referencedColumns: ["id"];
          },
        ];
      };
      auction_messages: {
        Row: {
          id: string;
          auction_id: string;
          user_id: string;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          auction_id: string;
          user_id: string;
          message: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["auction_messages"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "auction_messages_auction_id_fkey";
            columns: ["auction_id"];
            isOneToOne: false;
            referencedRelation: "auctions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "auction_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      magazine_issues: {
        Row: {
          id: string;
          issue_number: number;
          title: string;
          description: string | null;
          cover_image_url: string | null;
          content: string | null;
          published_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_number: number;
          title: string;
          description?: string | null;
          cover_image_url?: string | null;
          content?: string | null;
          published_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["magazine_issues"]["Insert"]>;
        Relationships: [];
      };
      magazine_reservations: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["magazine_reservations"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
