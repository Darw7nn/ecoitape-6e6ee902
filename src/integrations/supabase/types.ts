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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      materials: {
        Row: {
          group_name: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          group_name: string
          id: string
          name: string
          sort_order?: number
        }
        Update: {
          group_name?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      point_materials: {
        Row: {
          accepted: boolean
          material_id: string
          point_id: string
        }
        Insert: {
          accepted?: boolean
          material_id: string
          point_id: string
        }
        Update: {
          accepted?: boolean
          material_id?: string
          point_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_materials_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "points"
            referencedColumns: ["id"]
          },
        ]
      }
      points: {
        Row: {
          accepts_dropoff: boolean
          cep: string | null
          city: string
          cnpj: string | null
          cond_cleaning: string | null
          cond_costs: string | null
          cond_min_quantity: string | null
          cond_packaging: string | null
          cond_scheduling: string | null
          created_at: string
          description: string | null
          email: string | null
          hours: string | null
          id: string
          image_url: string | null
          is_demo: boolean
          lat: number | null
          lng: number | null
          name: string
          neighborhood: string | null
          number: string | null
          offers_pickup: boolean
          phone: string | null
          pricing: Database["public"]["Enums"]["point_pricing"]
          pricing_notes: string | null
          slug: string
          state: string
          status: Database["public"]["Enums"]["point_status"]
          street: string | null
          submitter_contact: string | null
          submitter_name: string | null
          type: Database["public"]["Enums"]["point_type"]
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          accepts_dropoff?: boolean
          cep?: string | null
          city?: string
          cnpj?: string | null
          cond_cleaning?: string | null
          cond_costs?: string | null
          cond_min_quantity?: string | null
          cond_packaging?: string | null
          cond_scheduling?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          neighborhood?: string | null
          number?: string | null
          offers_pickup?: boolean
          phone?: string | null
          pricing?: Database["public"]["Enums"]["point_pricing"]
          pricing_notes?: string | null
          slug: string
          state?: string
          status?: Database["public"]["Enums"]["point_status"]
          street?: string | null
          submitter_contact?: string | null
          submitter_name?: string | null
          type: Database["public"]["Enums"]["point_type"]
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          accepts_dropoff?: boolean
          cep?: string | null
          city?: string
          cnpj?: string | null
          cond_cleaning?: string | null
          cond_costs?: string | null
          cond_min_quantity?: string | null
          cond_packaging?: string | null
          cond_scheduling?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          image_url?: string | null
          is_demo?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          neighborhood?: string | null
          number?: string | null
          offers_pickup?: boolean
          phone?: string | null
          pricing?: Database["public"]["Enums"]["point_pricing"]
          pricing_notes?: string | null
          slug?: string
          state?: string
          status?: Database["public"]["Enums"]["point_status"]
          street?: string | null
          submitter_contact?: string | null
          submitter_name?: string | null
          type?: Database["public"]["Enums"]["point_type"]
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          message: string
          point_id: string
          resolved: boolean
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          message: string
          point_id: string
          resolved?: boolean
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          message?: string
          point_id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "reports_point_id_fkey"
            columns: ["point_id"]
            isOneToOne: false
            referencedRelation: "points"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_point: { Args: { mats: string[]; p: Json }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
      point_pricing: "gratuito" | "compra" | "cobra" | "nao_informado"
      point_status: "pendente" | "aprovado" | "inativo"
      point_type: "empresa" | "cooperativa" | "ecoponto" | "ponto_coleta"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
      point_pricing: ["gratuito", "compra", "cobra", "nao_informado"],
      point_status: ["pendente", "aprovado", "inativo"],
      point_type: ["empresa", "cooperativa", "ecoponto", "ponto_coleta"],
    },
  },
} as const
