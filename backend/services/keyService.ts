import * as keyRepository from '../repositories/keyRepository';
import { Key, KeyCreateData, KeyUpdateData } from '../types/models/key';

class KeyService {
  /**
   * Pobiera klucz API użytkownika
   * @param userId ID użytkownika
   */
  async getUserKey(userId: number): Promise<Key | null> {
    const key = await (keyRepository as any).findByUserId(userId);
    if (!key) {
      return null;
    }
    return key;
  }

  /**
   * Tworzy lub aktualizuje klucz API dla użytkownika
   * @param userId ID użytkownika
   * @param keyData Dane klucza API
   */
  async createOrUpdateUserKey(userId: number, keyData: KeyCreateData | KeyUpdateData): Promise<Key> {
    const existingKey = await (keyRepository as any).findByUserId(userId);
    
    if (existingKey) {
      return await (keyRepository as any).update(userId, keyData);
    } else {
      const newKeyData = {
        ...keyData,
        user_id: userId
      } as KeyCreateData;
      return await (keyRepository as any).create(newKeyData);
    }
  }
}

export default new KeyService();