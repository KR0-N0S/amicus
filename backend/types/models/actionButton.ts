/**
 * Interfejs reprezentujący przycisk akcji
 */
export interface ActionButton {
  id: number;
  user_id: number;
  name: string;
  icon?: string;
  color?: string;
  action_type: string;
  action_data?: object;
  default_values?: Record<string, any>; // Zmieniony typ na bardziej precyzyjny
  order?: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Dane do utworzenia przycisku akcji
 */
export interface ActionButtonCreateData {
  user_id: number;
  name: string;
  icon?: string;
  color?: string;
  action_type: string;
  action_data?: object;
  default_values?: Record<string, any>; // Zmieniony typ na bardziej precyzyjny
  order?: number;
}

/**
 * Dane do aktualizacji przycisku akcji
 */
export interface ActionButtonUpdateData {
  user_id: number; // Usunięto opcjonalność żeby spełnić wymagania repozytorium
  name?: string;
  icon?: string;
  color?: string;
  action_type?: string;
  action_data?: object;
  default_values?: Record<string, any>; // Zmieniony typ na bardziej precyzyjny
  order?: number;
}