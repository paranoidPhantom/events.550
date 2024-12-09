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
      "cast-options": {
        Row: {
          author: string
          description: string | null
          id: number
          image_urls: string[]
          name: string
        }
        Insert: {
          author: string
          description?: string | null
          id?: number
          image_urls: string[]
          name: string
        }
        Update: {
          author?: string
          description?: string | null
          id?: number
          image_urls?: string[]
          name?: string
        }
        Relationships: []
      }
      casts: {
        Row: {
          created_at: string
          id: string
          ip_extracted: string | null
          selection_1: number | null
          selection_2: number | null
          selection_3: number | null
        }
        Insert: {
          created_at?: string
          id: string
          ip_extracted?: string | null
          selection_1?: number | null
          selection_2?: number | null
          selection_3?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          ip_extracted?: string | null
          selection_1?: number | null
          selection_2?: number | null
          selection_3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "casts_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casts_selection_1_fkey"
            columns: ["selection_1"]
            isOneToOne: false
            referencedRelation: "cast-options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casts_selection_2_fkey"
            columns: ["selection_2"]
            isOneToOne: false
            referencedRelation: "cast-options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casts_selection_3_fkey"
            columns: ["selection_3"]
            isOneToOne: false
            referencedRelation: "cast-options"
            referencedColumns: ["id"]
          },
        ]
      }
      "fake-identities": {
        Row: {
          first_name: string
          grade: string | null
          id: string
          last_name: string
          middle_name: string | null
          restricted: boolean
        }
        Insert: {
          first_name: string
          grade?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          restricted?: boolean
        }
        Update: {
          first_name?: string
          grade?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          restricted?: boolean
        }
        Relationships: []
      }
      identities: {
        Row: {
          first_name: string
          grade: string | null
          id: string
          last_name: string
          middle_name: string | null
          restricted: boolean
        }
        Insert: {
          first_name: string
          grade?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          restricted?: boolean
        }
        Update: {
          first_name?: string
          grade?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          restricted?: boolean
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
