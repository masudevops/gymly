
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "body_measurements": {
                  Row: {
                    "body_fat_pct": number | null,"created_at": string,"id": string,"measured_on": string,"notes": string | null,"user_id": string,"weight_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body_fat_pct"?: number | null,"created_at"?: string,"id"?: string,"measured_on": string,"notes"?: string | null,"user_id"?: string,"weight_kg"?: number | null
                  }
                  Update: {
                    "body_fat_pct"?: number | null,"created_at"?: string,"id"?: string,"measured_on"?: string,"notes"?: string | null,"user_id"?: string,"weight_kg"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"exercises": {
                  Row: {
                    "created_at": string,"equipment": Database["public"]['Enums']["equipment"],"id": string,"instructions": string | null,"kind": Database["public"]['Enums']["exercise_kind"],"name": string,"owner_id": string | null,"primary_muscle": Database["public"]['Enums']["muscle_group"],"secondary_muscles": (Database["public"]['Enums']["muscle_group"])[]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"equipment": Database["public"]['Enums']["equipment"],"id"?: string,"instructions"?: string | null,"kind"?: Database["public"]['Enums']["exercise_kind"],"name": string,"owner_id"?: string | null,"primary_muscle": Database["public"]['Enums']["muscle_group"],"secondary_muscles"?: (Database["public"]['Enums']["muscle_group"])[]
                  }
                  Update: {
                    "created_at"?: string,"equipment"?: Database["public"]['Enums']["equipment"],"id"?: string,"instructions"?: string | null,"kind"?: Database["public"]['Enums']["exercise_kind"],"name"?: string,"owner_id"?: string | null,"primary_muscle"?: Database["public"]['Enums']["muscle_group"],"secondary_muscles"?: (Database["public"]['Enums']["muscle_group"])[]
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"display_name": string | null,"experience": Database["public"]['Enums']["experience_level"] | null,"goal": Database["public"]['Enums']["training_goal"] | null,"id": string,"onboarded_at": string | null,"rest_seconds": number,"training_days": number | null,"unit": Database["public"]['Enums']["unit_system"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"display_name"?: string | null,"experience"?: Database["public"]['Enums']["experience_level"] | null,"goal"?: Database["public"]['Enums']["training_goal"] | null,"id": string,"onboarded_at"?: string | null,"rest_seconds"?: number,"training_days"?: number | null,"unit"?: Database["public"]['Enums']["unit_system"],"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"display_name"?: string | null,"experience"?: Database["public"]['Enums']["experience_level"] | null,"goal"?: Database["public"]['Enums']["training_goal"] | null,"id"?: string,"onboarded_at"?: string | null,"rest_seconds"?: number,"training_days"?: number | null,"unit"?: Database["public"]['Enums']["unit_system"],"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"template_exercises": {
                  Row: {
                    "exercise_id": string,"id": string,"notes": string | null,"position": number,"rest_seconds": number | null,"target_reps_max": number | null,"target_reps_min": number | null,"target_sets": number,"template_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "exercise_id": string,"id"?: string,"notes"?: string | null,"position": number,"rest_seconds"?: number | null,"target_reps_max"?: number | null,"target_reps_min"?: number | null,"target_sets"?: number,"template_id": string
                  }
                  Update: {
                    "exercise_id"?: string,"id"?: string,"notes"?: string | null,"position"?: number,"rest_seconds"?: number | null,"target_reps_max"?: number | null,"target_reps_min"?: number | null,"target_sets"?: number,"template_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "template_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "template_exercises_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "workout_templates"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_exercises": {
                  Row: {
                    "exercise_id": string,"id": string,"notes": string | null,"position": number,"workout_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "exercise_id": string,"id"?: string,"notes"?: string | null,"position": number,"workout_id": string
                  }
                  Update: {
                    "exercise_id"?: string,"id"?: string,"notes"?: string | null,"position"?: number,"workout_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_exercises_exercise_id_fkey"
      columns: ["exercise_id"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_exercises_workout_id_fkey"
      columns: ["workout_id"]
isOneToOne: false
      referencedRelation: "workouts"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_sets": {
                  Row: {
                    "duration_seconds": number | null,"id": string,"is_warmup": boolean,"position": number,"reps": number | null,"rpe": number | null,"weight_kg": number | null,"workout_exercise_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "duration_seconds"?: number | null,"id"?: string,"is_warmup"?: boolean,"position": number,"reps"?: number | null,"rpe"?: number | null,"weight_kg"?: number | null,"workout_exercise_id": string
                  }
                  Update: {
                    "duration_seconds"?: number | null,"id"?: string,"is_warmup"?: boolean,"position"?: number,"reps"?: number | null,"rpe"?: number | null,"weight_kg"?: number | null,"workout_exercise_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_sets_workout_exercise_id_fkey"
      columns: ["workout_exercise_id"]
isOneToOne: false
      referencedRelation: "workout_exercises"
      referencedColumns: ["id"]
    }
                  ]
                },"workout_templates": {
                  Row: {
                    "created_at": string,"id": string,"name": string,"notes": string | null,"position": number,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"name": string,"notes"?: string | null,"position"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"position"?: number,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"workouts": {
                  Row: {
                    "created_at": string,"finished_at": string,"id": string,"name": string,"notes": string | null,"started_at": string,"template_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"finished_at": string,"id"?: string,"name": string,"notes"?: string | null,"started_at": string,"template_id"?: string | null,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"finished_at"?: string,"id"?: string,"name"?: string,"notes"?: string | null,"started_at"?: string,"template_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workouts_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "workout_templates"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "delete_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"e1rm":
{ Args: { "reps": number,"weight": number }; Returns: number
                           },
"exercise_history":
{ Args: { "p_exercise_id": string }; Returns: {
              "best_e1rm": number,"longest_seconds": number,"started_at": string,"top_reps": number,"top_weight_kg": number,"total_reps": number,"volume_kg": number,"working_sets": number,"workout_id": string
            }[]
                           },
"last_sets_for_exercises":
{ Args: { "exercise_ids": (string)[] }; Returns: {
              "duration_seconds": number,"exercise_id": string,"is_warmup": boolean,"reps": number,"set_position": number,"weight_kg": number,"workout_started_at": string
            }[]
                           },
"personal_records":
{ Args: Record<PropertyKey, never>; Returns: {
              "best_e1rm": number,"best_e1rm_at": string,"exercise_id": string,"heaviest_kg": number,"kind": Database["public"]['Enums']["exercise_kind"],"last_done": string,"longest_seconds": number,"most_reps": number,"name": string,"primary_muscle": Database["public"]['Enums']["muscle_group"],"sessions": number
            }[]
                           },
"save_template":
{ Args: { "payload": Json }; Returns: string
                           },
"save_workout":
{ Args: { "payload": Json }; Returns: string
                           },
"training_days":
{ Args: { "p_from": string,"p_tz": string }; Returns: {
              "day": string,"volume_kg": number,"workouts": number
            }[]
                           },
"weekly_muscle_sets":
{ Args: { "p_tz": string,"p_weeks": number }; Returns: {
              "muscle": Database["public"]['Enums']["muscle_group"],"sets": number,"week_start": string
            }[]
                           },
"workout_prs":
{ Args: { "p_workout_id": string }; Returns: {
              "exercise_id": string,"name": string,"previous": number,"record": string,"value": number
            }[]
                           }
          }
          Enums: {
            "equipment": "barbell"|"dumbbell"|"machine"|"cable"|"bodyweight"|"kettlebell"|"band"|"smith_machine"|"other","exercise_kind": "weight_reps"|"reps_only"|"duration","experience_level": "beginner"|"intermediate"|"advanced","muscle_group": "chest"|"back"|"shoulders"|"biceps"|"triceps"|"forearms"|"quads"|"hamstrings"|"glutes"|"calves"|"core"|"full_body"|"cardio","training_goal": "strength"|"muscle"|"general_fitness"|"endurance","unit_system": "kg"|"lb"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "equipment": ["barbell", "dumbbell", "machine", "cable", "bodyweight", "kettlebell", "band", "smith_machine", "other"],"exercise_kind": ["weight_reps", "reps_only", "duration"],"experience_level": ["beginner", "intermediate", "advanced"],"muscle_group": ["chest", "back", "shoulders", "biceps", "triceps", "forearms", "quads", "hamstrings", "glutes", "calves", "core", "full_body", "cardio"],"training_goal": ["strength", "muscle", "general_fitness", "endurance"],"unit_system": ["kg", "lb"]
          }
        }
} as const
