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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["activity_entity"]
          id: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["activity_entity"]
          id?: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["activity_entity"]
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      borrowers: {
        Row: {
          address: string | null
          archived_at: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          mobile: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          mobile?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          mobile?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      loan_custom_schedule: {
        Row: {
          loan_id: string
          period: number
          planned_amount: number
        }
        Insert: {
          loan_id: string
          period: number
          planned_amount: number
        }
        Update: {
          loan_id?: string
          period?: number
          planned_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_custom_schedule_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          after_maturity: Database["public"]["Enums"]["after_maturity"]
          agreement_in_writing: boolean
          borrower_id: string
          closed_at: string | null
          created_at: string
          grace_days: number
          id: string
          interest_method: Database["public"]["Enums"]["interest_method"]
          monthly_rate: number
          notes: string | null
          principal: number
          reference_no: string | null
          repayment_type: Database["public"]["Enums"]["repayment_type"]
          start_date: string
          status: Database["public"]["Enums"]["loan_status"]
          tenure_months: number
          updated_at: string
          user_id: string
        }
        Insert: {
          after_maturity?: Database["public"]["Enums"]["after_maturity"]
          agreement_in_writing?: boolean
          borrower_id: string
          closed_at?: string | null
          created_at?: string
          grace_days?: number
          id?: string
          interest_method?: Database["public"]["Enums"]["interest_method"]
          monthly_rate: number
          notes?: string | null
          principal: number
          reference_no?: string | null
          repayment_type?: Database["public"]["Enums"]["repayment_type"]
          start_date: string
          status?: Database["public"]["Enums"]["loan_status"]
          tenure_months: number
          updated_at?: string
          user_id: string
        }
        Update: {
          after_maturity?: Database["public"]["Enums"]["after_maturity"]
          agreement_in_writing?: boolean
          borrower_id?: string
          closed_at?: string | null
          created_at?: string
          grace_days?: number
          id?: string
          interest_method?: Database["public"]["Enums"]["interest_method"]
          monthly_rate?: number
          notes?: string | null
          principal?: number
          reference_no?: string | null
          repayment_type?: Database["public"]["Enums"]["repayment_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["loan_status"]
          tenure_months?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_borrower_id_fkey"
            columns: ["borrower_id"]
            isOneToOne: false
            referencedRelation: "borrowers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          deleted_at: string | null
          id: string
          loan_id: string
          method: Database["public"]["Enums"]["payment_method"]
          note: string | null
          paid_on: string
          reference_no: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          loan_id: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on: string
          reference_no?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          loan_id?: string
          method?: Database["public"]["Enums"]["payment_method"]
          note?: string | null
          paid_on?: string
          reference_no?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          default_grace_days: number
          default_interest_method: Database["public"]["Enums"]["interest_method"]
          default_repayment_type: Database["public"]["Enums"]["repayment_type"]
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_grace_days?: number
          default_interest_method?: Database["public"]["Enums"]["interest_method"]
          default_repayment_type?: Database["public"]["Enums"]["repayment_type"]
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_grace_days?: number
          default_interest_method?: Database["public"]["Enums"]["interest_method"]
          default_repayment_type?: Database["public"]["Enums"]["repayment_type"]
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_action: "create" | "update" | "delete"
      activity_entity: "borrower" | "loan" | "payment" | "loan_custom_schedule"
      after_maturity: "continue_accruing" | "stop_accruing"
      interest_method: "compound" | "simple"
      loan_status: "active" | "paid" | "written_off" | "cancelled"
      payment_method:
        | "cash"
        | "gcash"
        | "maya"
        | "bank_transfer"
        | "check"
        | "other"
      repayment_type: "lump_sum" | "equal_installments" | "custom"
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
      activity_action: ["create", "update", "delete"],
      activity_entity: ["borrower", "loan", "payment", "loan_custom_schedule"],
      after_maturity: ["continue_accruing", "stop_accruing"],
      interest_method: ["compound", "simple"],
      loan_status: ["active", "paid", "written_off", "cancelled"],
      payment_method: [
        "cash",
        "gcash",
        "maya",
        "bank_transfer",
        "check",
        "other",
      ],
      repayment_type: ["lump_sum", "equal_installments", "custom"],
    },
  },
} as const
