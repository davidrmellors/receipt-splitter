export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          nickname: string | null
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          nickname?: string | null
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          nickname?: string | null
          joined_at?: string
        }
      }
      receipts: {
        Row: {
          id: string
          group_id: string
          uploaded_by: string
          image_url: string
          store_name: string | null
          total_amount: number | null
          receipt_date: string | null
          raw_text: string | null
          created_at: string
          processed_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          uploaded_by: string
          image_url: string
          store_name?: string | null
          total_amount?: number | null
          receipt_date?: string | null
          raw_text?: string | null
          created_at?: string
          processed_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          uploaded_by?: string
          image_url?: string
          store_name?: string | null
          total_amount?: number | null
          receipt_date?: string | null
          raw_text?: string | null
          created_at?: string
          processed_at?: string | null
        }
      }
      receipt_items: {
        Row: {
          id: string
          receipt_id: string
          name: string
          price: number
          quantity: number
          category: string | null
          line_number: number | null
          created_at: string
        }
        Insert: {
          id?: string
          receipt_id: string
          name: string
          price: number
          quantity?: number
          category?: string | null
          line_number?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          receipt_id?: string
          name?: string
          price?: number
          quantity?: number
          category?: string | null
          line_number?: number | null
          created_at?: string
        }
      }
      item_assignments: {
        Row: {
          id: string
          item_id: string
          assigned_to: string
          amount: number
          split_type: 'full' | 'split' | 'custom'
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          assigned_to: string
          amount: number
          split_type: 'full' | 'split' | 'custom'
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          assigned_to?: string
          amount?: number
          split_type?: 'full' | 'split' | 'custom'
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          from_user: string
          to_user: string
          group_id: string
          amount: number
          description: string | null
          receipt_id: string | null
          paid_at: string
          created_at: string
        }
        Insert: {
          id?: string
          from_user: string
          to_user: string
          group_id: string
          amount: number
          description?: string | null
          receipt_id?: string | null
          paid_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          from_user?: string
          to_user?: string
          group_id?: string
          amount?: number
          description?: string | null
          receipt_id?: string | null
          paid_at?: string
          created_at?: string
        }
      }
      balances: {
        Row: {
          id: string
          group_id: string
          debtor_id: string
          creditor_id: string
          amount: number
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          debtor_id: string
          creditor_id: string
          amount?: number
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          debtor_id?: string
          creditor_id?: string
          amount?: number
          updated_at?: string
        }
      }
    }
  }
}