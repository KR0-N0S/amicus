const { query } = require('../config/db');

class AnimalRepository {
  async findById(id) {
    // Najpierw pobieramy podstawowe dane ze zwierzęcia
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
      const farmAnimalResult = await query(
        'SELECT * FROM farm_animals WHERE animal_id = $1',
        [animal.id]
      );
      
      if (farmAnimalResult.rows.length > 0) {
        animal.farm_animal = farmAnimalResult.rows[0];
      }
    } else if (animal.animal_type === 'companion') {
      const companionAnimalResult = await query(
        'SELECT * FROM companion_animals WHERE animal_id = $1',
        [animal.id]
      );
      
      if (companionAnimalResult.rows.length > 0) {
        animal.companion_animal = companionAnimalResult.rows[0];
      }
    }
    
    return animal;
  }

  async findByOwnerId(ownerId, limit = 10, offset = 0, animalType = null) {
    // Budujemy bazowe zapytanie
    let sql = `
      SELECT a.*, 
             CASE 
               WHEN a.animal_type = 'farm' THEN json_build_object(
                 'id', fa.id,
                 'identifier', fa.identifier,
                 'additional_number', fa.additional_number,
                 'herd_number', fa.herd_number,
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
    
    // Przekształcamy wyniki, aby dane szczegółowe były w odpowiednim polu (farm_animal lub companion_animal)
    return result.rows.map(row => {
      const animal = {...row};
      delete animal.animal_details;
      
      if (row.animal_type === 'farm' && row.animal_details) {
        animal.farm_animal = row.animal_details;
      } else if (row.animal_type === 'companion' && row.animal_details) {
        animal.companion_animal = row.animal_details;
      }
      
      return animal;
    });
  }

  async countByOwnerId(ownerId, animalType = null) {
    let sql = 'SELECT COUNT(*) FROM animals WHERE owner_id = $1';
    const params = [ownerId];
    
    // Filtrowanie według typu zwierzęcia jeśli podano
    if (animalType) {
      sql += ' AND animal_type = $2';
      params.push(animalType);
    }
    
    const result = await query(sql, params);
    return parseInt(result.rows[0].count);
  }

  async create(animalBaseData, animalType, specificData) {
    // Rozpoczęcie transakcji
    await query('BEGIN');
    
    try {
      // Wstawiamy podstawowe dane do tabeli animals
      const { 
        owner_id, 
        species,
        animal_type,
        age, 
        sex, 
        breed, 
        birth_date,
        weight,
        notes,
        photo 
      } = animalBaseData;
      
      const animalResult = await query(
        `INSERT INTO animals 
         (owner_id, species, animal_type, age, sex, breed, birth_date, photo) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING *`,
        [owner_id, species, animal_type, age, sex, breed, birth_date, photo]
      );
      
      const animal = animalResult.rows[0];
      
      // Wstawiamy dane specyficzne dla typu
      if (animalType === 'farm' && specificData) {
        const { 
          identifier,
          additional_number,
          herd_number,
          registration_date,
          origin
        } = specificData;
        
        const farmAnimalResult = await query(
          `INSERT INTO farm_animals 
           (animal_id, identifier, additional_number, herd_number, registration_date, origin) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [animal.id, identifier, additional_number, herd_number, registration_date, origin]
        );
        
        animal.farm_animal = farmAnimalResult.rows[0];
      } else if (animalType === 'companion' && specificData) {
        const { 
          chip_number,
          sterilized,
          passport_number,
          special_needs
        } = specificData;
        
        const companionAnimalResult = await query(
          `INSERT INTO companion_animals 
           (animal_id, chip_number, sterilized, passport_number, special_needs) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING *`,
          [animal.id, chip_number, sterilized, passport_number, special_needs]
        );
        
        animal.companion_animal = companionAnimalResult.rows[0];
      }
      
      // Zatwierdzenie transakcji
      await query('COMMIT');
      return animal;
      
    } catch (error) {
      // Wycofanie transakcji w przypadku błędu
      await query('ROLLBACK');
      throw error;
    }
  }

  async update(id, animalBaseData, animalType, specificData) {
    // Rozpoczęcie transakcji
    await query('BEGIN');
    
    try {
      // Aktualizujemy podstawowe dane w tabeli animals
      const { 
        species,
        age, 
        sex, 
        breed, 
        birth_date,
        weight,
        notes,
        photo 
      } = animalBaseData;
      
      const animalResult = await query(
        `UPDATE animals 
         SET species = $1, age = $2, sex = $3, breed = $4, 
             birth_date = $5, photo = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [species, age, sex, breed, birth_date, photo, id]
      );
      
      const animal = animalResult.rows[0];
      
      // Aktualizujemy dane specyficzne dla typu
      if (animalType === 'farm' && specificData) {
        const { 
          identifier,
          additional_number,
          herd_number,
          registration_date,
          origin
        } = specificData;
        
        // Sprawdzamy, czy istnieje rekord w farm_animals
        const checkResult = await query(
          'SELECT id FROM farm_animals WHERE animal_id = $1',
          [id]
        );
        
        if (checkResult.rows.length > 0) {
          // Aktualizacja istniejącego rekordu
          const farmAnimalResult = await query(
            `UPDATE farm_animals 
             SET identifier = $1, additional_number = $2, herd_number = $3, 
                 registration_date = $4, origin = $5, updated_at = NOW()
             WHERE animal_id = $6
             RETURNING *`,
            [identifier, additional_number, herd_number, registration_date, origin, id]
          );
          
          animal.farm_animal = farmAnimalResult.rows[0];
        } else {
          // Tworzenie nowego rekordu
          const farmAnimalResult = await query(
            `INSERT INTO farm_animals 
             (animal_id, identifier, additional_number, herd_number, registration_date, origin) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING *`,
            [id, identifier, additional_number, herd_number, registration_date, origin]
          );
          
          animal.farm_animal = farmAnimalResult.rows[0];
        }
      } else if (animalType === 'companion' && specificData) {
        const { 
          chip_number,
          sterilized,
          passport_number,
          special_needs
        } = specificData;
        
        // Sprawdzamy, czy istnieje rekord w companion_animals
        const checkResult = await query(
          'SELECT id FROM companion_animals WHERE animal_id = $1',
          [id]
        );
        
        if (checkResult.rows.length > 0) {
          // Aktualizacja istniejącego rekordu
          const companionAnimalResult = await query(
            `UPDATE companion_animals 
             SET chip_number = $1, sterilized = $2, passport_number = $3, 
                 special_needs = $4, updated_at = NOW()
             WHERE animal_id = $5
             RETURNING *`,
            [chip_number, sterilized, passport_number, special_needs, id]
          );
          
          animal.companion_animal = companionAnimalResult.rows[0];
        } else {
          // Tworzenie nowego rekordu
          const companionAnimalResult = await query(
            `INSERT INTO companion_animals 
             (animal_id, chip_number, sterilized, passport_number, special_needs) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [id, chip_number, sterilized, passport_number, special_needs]
          );
          
          animal.companion_animal = companionAnimalResult.rows[0];
        }
      }
      
      // Zatwierdzenie transakcji
      await query('COMMIT');
      return animal;
      
    } catch (error) {
      // Wycofanie transakcji w przypadku błędu
      await query('ROLLBACK');
      throw error;
    }
  }

  async delete(id) {
    // Usunięcie z tabeli głównej spowoduje kaskadowe usunięcie z tabel rozszerzających
    // dzięki ograniczeniom klucza obcego z ON DELETE CASCADE
    return await query('DELETE FROM animals WHERE id = $1', [id]);
  }
}

module.exports = new AnimalRepository();