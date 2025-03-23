const keyRepository = require('../repositories/keyRepository');

class KeyService {
  async getUserKey(userId) {
    const key = await keyRepository.findByUserId(userId);
    if (!key) {
      return null;
    }
    return key;
  }

  async createOrUpdateUserKey(userId, keyData) {
    const existingKey = await keyRepository.findByUserId(userId);
    
    if (existingKey) {
      return await keyRepository.update(userId, keyData);
    } else {
      keyData.user_id = userId;
      return await keyRepository.create(keyData);
    }
  }
}

module.exports = new KeyService();
