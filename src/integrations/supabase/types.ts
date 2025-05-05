export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      check_in_locations: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          latitude: number
          location_name: string | null
          longitude: number
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          latitude: number
          location_name?: string | null
          longitude: number
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          latitude?: number
          location_name?: string | null
          longitude?: number
          user_id?: string
        }
        Relationships: []
      }
      delivered_messages: {
        Row: {
          condition_id: string
          delivered_at: string
          delivery_id: string
          device_info: string | null
          id: string
          message_id: string
          recipient_id: string
          viewed_at: string | null
          viewed_count: number | null
        }
        Insert: {
          condition_id: string
          delivered_at?: string
          delivery_id: string
          device_info?: string | null
          id?: string
          message_id: string
          recipient_id: string
          viewed_at?: string | null
          viewed_count?: number | null
        }
        Update: {
          condition_id?: string
          delivered_at?: string
          delivery_id?: string
          device_info?: string | null
          id?: string
          message_id?: string
          recipient_id?: string
          viewed_at?: string | null
          viewed_count?: number | null
        }
        Relationships: []
      }
      message_conditions: {
        Row: {
          active: boolean
          check_in_code: string | null
          condition_type: string
          confirmation_required: number | null
          confirmations_received: number | null
          created_at: string
          expiry_hours: number | null
          hours_threshold: number
          id: string
          last_checked: string
          message_id: string
          minutes_threshold: number | null
          next_check: string | null
          panic_config: Json | null
          pin_code: string | null
          recipients: Json
          recurring_pattern: Json | null
          reminder_hours: number[] | null
          secondary_condition_type: string | null
          secondary_recurring_pattern: Json | null
          secondary_trigger_date: string | null
          trigger_date: string | null
          unlock_delay_hours: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          check_in_code?: string | null
          condition_type: string
          confirmation_required?: number | null
          confirmations_received?: number | null
          created_at?: string
          expiry_hours?: number | null
          hours_threshold: number
          id?: string
          last_checked?: string
          message_id: string
          minutes_threshold?: number | null
          next_check?: string | null
          panic_config?: Json | null
          pin_code?: string | null
          recipients: Json
          recurring_pattern?: Json | null
          reminder_hours?: number[] | null
          secondary_condition_type?: string | null
          secondary_recurring_pattern?: Json | null
          secondary_trigger_date?: string | null
          trigger_date?: string | null
          unlock_delay_hours?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          check_in_code?: string | null
          condition_type?: string
          confirmation_required?: number | null
          confirmations_received?: number | null
          created_at?: string
          expiry_hours?: number | null
          hours_threshold?: number
          id?: string
          last_checked?: string
          message_id?: string
          minutes_threshold?: number | null
          next_check?: string | null
          panic_config?: Json | null
          pin_code?: string | null
          recipients?: Json
          recurring_pattern?: Json | null
          reminder_hours?: number[] | null
          secondary_condition_type?: string | null
          secondary_recurring_pattern?: Json | null
          secondary_trigger_date?: string | null
          trigger_date?: string | null
          unlock_delay_hours?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_conditions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string | null
          created_at: string
          id: string
          location_latitude: number | null
          location_longitude: number | null
          location_name: string | null
          message_type: string
          share_location: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          message_type?: string
          share_location?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          message_type?: string
          share_location?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          backup_contact: string | null
          backup_email: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          backup_contact?: string | null
          backup_email?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          backup_contact?: string | null
          backup_email?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      recipients: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sent_reminders: {
        Row: {
          condition_id: string
          created_at: string
          deadline: string
          id: string
          message_id: string
          sent_at: string
          user_id: string
        }
        Insert: {
          condition_id: string
          created_at?: string
          deadline: string
          id?: string
          message_id: string
          sent_at?: string
          user_id: string
        }
        Update: {
          condition_id?: string
          created_at?: string
          deadline?: string
          id?: string
          message_id?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_reminders_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "message_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_reminders_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      message_has_delivery: {
        Args: { msg_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
