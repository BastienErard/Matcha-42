-- Création de la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS matcha;

USE matcha;

-- Table de test pour vérifier que tout fonctionne
CREATE TABLE IF NOT EXISTS health_check (
    id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO health_check () VALUES ();
