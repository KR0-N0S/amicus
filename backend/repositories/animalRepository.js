const { query } = require('../config/db');

class AnimalRepository {
  async findById(id) {
    // Pobieramy podstawowe dane zwierzęcia
    const animalResult = await query(
      'SELECT * FROM animals WHERE id = $1',
      [id]
    );

    if (animalResult.rows.length === 0) {
      return null;
    }

    const animal = animalResult.rows[0];

    // Następnie, w zależności od typu, pobieramy dodatkowe dane
    if (animal.animal_type === 'farm') {
      // Zmodyfikowane zapytanie - bez additional_number i herd_number
      const farmAnimalResult = await query(
        'SELECT id, animal_id, identifier, additional_id, registration_date, origin, created_at, updated_at FROM farm_animals WHERE animal_id = $1',
        [animal.id]
      );
      
      if (farmAnimalResult.rows.length > 0) {
        animal.farm_animal = farmAnimalResult.rows[0];
      }
    } else if (animal.animal_type === 'companion') {
      // Bez zmian dla companion_animals
      const companionAnimalResult = await query(
        'SELECT * FROM companion_animals WHERE animal_id = $1',
        [animal.id]
      );
      
      if (companionAnimalResult.rows.length > 0) {
        animal.companion_animal = companionAnimalResult.rows[0];
      }
    }

    // Wyliczenie wieku na podstawie daty urodzenia
    if (animal.birth_date) {
      const birthDate = new Date(animal.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();

      if (
        today.getMonth() < birthDate.getMonth() || 
        (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      animal.age = age < 0 ? 0 : age;
    } else {
      animal.age = null;
    }

    return animal;
  }

  async findByOwnerId(ownerId, limit = 10, offset = 0, animalType = null) {
    // Budujemy bazowe zapytanie - ZMODYFIKOWANE bez additional_number i herd_number
    let sql = `
      SELECT a.*, 
             CASE 
               WHEN a.animal_type = 'farm' THEN json_build_object(
                 'id', fa.id,
                 'identifier', fa.identifier,
                 'additional_id', fa.additional_id,
                 'registration_date', fa.registration_date,
                 'origin', fa.origin
               )
               WHEN a.animal_type = 'companion' THEN json_build_object(
                 'id', ca.id,
                 'chip_number', ca.chip_number,
                 'sterilized', ca.sterilized,
                 'passport_number', ca.passport_number,
                 'special_needs', ca.special_needs
               )
             END AS animal_details
      FROM animals a
      LEFT JOIN farm_animals fa ON a.id = fa.animal_id AND a.animal_type = 'farm'
      LEFT JOIN companion_animals ca ON a.id = ca.animal_id AND a.animal_type = 'companion'
      WHERE a.owner_id = $1
    `;
    
    const params = [ownerId];
    
    // Filtrowanie według typu zwierzęcia jeśli podano
    if (animalType) {
      sql += ' AND a.animal_type = $2';
      params.push(animalType);
    }
    
    sql += ' ORDER BY a.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Przekształcamy wyniki i dodajemy wyliczony wiek
    return result.rows.map(row => {
      const animal = {...row};
      delete animal.animal_details;
      
      // Wyliczanie wieku na podstawie daty urodzenia
      if (animal.birth_date) {
        const birthDate = new Date(animal.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        
        // Korekta wieku jeśli urodziny jeszcze nie nastąpiły w tym roku
        if (
          today.getMonth() < birthDate.getMonth() || 
          (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        
        animal.age = age < 0 ? 0 : age;
      } else {
        animal.age = null;
      }
      
      if (row.animal_type === 'farm' && row.animal_details) {
        animal.farm_animal = row.animal_details;
        // Dodaj numer identyfikacyjny jako animal_number dla łatwiejszego dostępu
        animal.animal_number = row.animal_details.identifier;
      } else if (row.animal_type === 'companion' && row.animal_details) {
        animal.companion_animal = row.animal_details;
      }
      
      return animal;
    });
  }

  /**
   * Pobiera zwierzęta należące do wszystkich użytkowników danej organizacji
   * @param {number} organizationId - ID organizacji
   * @param {number} limit - Limit wyników na stronę
   * @param {number} offset - Offset dla paginacji
   * @param {string} animalType - Opcjonalny typ zwierzęcia do filtrowania
   * @returns {Array} - Tablica zwierząt
   */
  async findByOrganizationId(organizationId, limit = 10, offset = 0, animalType = null) {
    // Budujemy bazowe zapytanie łączące zwierzęta z ich właścicielami w organizacji
    let sql = `
      SELECT DISTINCT ON (a.id) a.*, 
             u.first_name as owner_first_name,
             u.last_name as owner_last_name,
             u.city as owner_city,
             u.street as owner_street,
             u.house_number as owner_house_number,
             CONCAT(u.first_name, ' ', u.last_name) as owner_name,
             fa.identifier, fa.registration_date, fa.origin, fa.additional_id
      FROM animals a
      JOIN users u ON a.owner_id = u.id
      JOIN organization_user ou ON u.id = ou.user_id
      LEFT JOIN farm_animals fa ON a.id = fa.animal_id AND a.animal_type = 'farm'
      WHERE ou.organization_id = $1
    `;
    
    const params = [organizationId];
    
    // Filtrowanie według typu zwierzęcia jeśli podano
    if (animalType) {
      sql += ' AND a.animal_type = $2';
      params.push(animalType);
    }
    
    sql += ' ORDER BY a.id, a.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await query(sql, params);
    
    // Przekształcamy wyniki i dodajemy wyliczony wiek
    return result.rows.map(row => {
      const animal = {...row};
      
      // Wyliczanie wieku na podstawie daty urodzenia
      if (animal.birth_date) {
        const birthDate = new Date(animal.birth_date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        
        if (
          today.getMonth() < birthDate.getMonth() || 
          (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        
        animal.age = age < 0 ? 0 : age;
      } else {
        animal.age = null;
      }
      
      // Upewniamy się, że dane z farm_animals są dostępne
      if (animal.animal_type === 'farm') {
        if (animal.identifier) {
          animal.animal_number = animal.identifier; // Dla wstecznej kompatybilności
          
          animal.farm_animal = {
            identifier: animal.identifier,
            registration_date: animal.registration_date,
            origin: animal.origin,
            additional_id: animal.additional_id
          };
        }
        
        // Usuwamy zduplikowane pola
        delete animal.identifier;
        delete animal.registration_date;
        delete animal.origin;
        delete animal.additional_id;
      }
      
      return animal;
    });
  }

  async countByOwnerId(ownerId, animalType = null) {
    let sql = 'SELECT COUNT(*) FROM animals WHERE owner_id = $1';
    const params = [ownerId];
    
    if (animalType) {
      sql += ' AND animal_type = $2';
      params.push(animalType);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Zlicza zwierzęta należące do wszystkich użytkowników danej organizacji
   * @param {number} organizationId - ID organizacji
   * @param {string} animalType - Opcjonalny typ zwierzęcia do filtrowania
   * @returns {number} - Ilość zwierząt
   */
  async countByOrganizationId(organizationId, animalType = null) {
    let sql = `
      SELECT COUNT(*) 
      FROM animals a
      JOIN users u ON a.owner_id = u.id
      JOIN organization_user ou ON u.id = ou.user_id
      WHERE ou.organization_id = $1
    `;
    const params = [organizationId];
    
    if (animalType) {
      sql += ' AND a.animal_type = $2';
      params.push(animalType);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  async create(animalBaseData, animalType, specificData) {
    // Pozostała część metody create jest bez zmian
    // (kod pozostawiony dla zwięzłości)
  }
  
  async update(id, animalBaseData, animalType, specificData) {
    // Pozostała część metody update jest bez zmian
    // (kod pozostawiony dla zwięzłości)
  }

  // Metoda delete bez zmian
  async delete(id) {
    return await query('DELETE FROM animals WHERE id = $1', [id]);
  }
}

module.exports = new AnimalRepository();