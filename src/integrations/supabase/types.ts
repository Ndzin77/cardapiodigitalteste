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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          store_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          store_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_fee: number
          delivery_type: string
          id: string
          items: Json
          notes: string | null
          payment_method: string | null
          status: string
          store_id: string
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_fee?: number
          delivery_type?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string | null
          status?: string
          store_id: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_fee?: number
          delivery_type?: string
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string | null
          status?: string
          store_id?: string
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean | null
          category_id: string | null
          created_at: string
          description: string | null
          featured: boolean | null
          has_options: boolean | null
          id: string
          image_url: string | null
          min_order_quantity: number | null
          name: string
          options: Json | null
          original_price: number | null
          price: number
          sort_order: number | null
          stock_enabled: boolean | null
          stock_quantity: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          has_options?: boolean | null
          id?: string
          image_url?: string | null
          min_order_quantity?: number | null
          name: string
          options?: Json | null
          original_price?: number | null
          price: number
          sort_order?: number | null
          stock_enabled?: boolean | null
          stock_quantity?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          available?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          has_options?: boolean | null
          id?: string
          image_url?: string | null
          min_order_quantity?: number | null
          name?: string
          options?: Json | null
          original_price?: number | null
          price?: number
          sort_order?: number | null
          stock_enabled?: boolean | null
          stock_quantity?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          accepted_payments: string[] | null
          address: string | null
          checkout_link: string | null
          cover_image_url: string | null
          created_at: string
          custom_payments: Json | null
          delivery_fee: number | null
          description: string | null
          estimated_time: string | null
          google_maps_url: string | null
          help_button_enabled: boolean | null
          help_button_message: string | null
          id: string
          instagram: string | null
          is_open: boolean | null
          logo_url: string | null
          min_order: number | null
          name: string
          opening_hours: Json | null
          payment_icons: Json | null
          phone: string | null
          rating: number | null
          review_count: number | null
          slug: string
          theme_color: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
          whatsapp_message: string | null
        }
        Insert: {
          accepted_payments?: string[] | null
          address?: string | null
          checkout_link?: string | null
          cover_image_url?: string | null
          created_at?: string
          custom_payments?: Json | null
          delivery_fee?: number | null
          description?: string | null
          estimated_time?: string | null
          google_maps_url?: string | null
          help_button_enabled?: boolean | null
          help_button_message?: string | null
          id?: string
          instagram?: string | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order?: number | null
          name: string
          opening_hours?: Json | null
          payment_icons?: Json | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug: string
          theme_color?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
          whatsapp_message?: string | null
        }
        Update: {
          accepted_payments?: string[] | null
          address?: string | null
          checkout_link?: string | null
          cover_image_url?: string | null
          created_at?: string
          custom_payments?: Json | null
          delivery_fee?: number | null
          description?: string | null
          estimated_time?: string | null
          google_maps_url?: string | null
          help_button_enabled?: boolean | null
          help_button_message?: string | null
          id?: string
          instagram?: string | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order?: number | null
          name?: string
          opening_hours?: Json | null
          payment_icons?: Json | null
          phone?: string | null
          rating?: number | null
          review_count?: number | null
          slug?: string
          theme_color?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
          whatsapp_message?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
