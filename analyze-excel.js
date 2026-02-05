/**
 * Script pour analyser la structure du fichier Excel fourni
 */

const XLSX = require('xlsx');

function analyzeExcel() {
  console.log('📊 Analyse du fichier Excel...');

  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile('prospects_plombier_20251208_193340.xlsx');

    // Obtenir les noms des feuilles
    const sheetNames = workbook.SheetNames;
    console.log('📋 Feuilles disponibles:', sheetNames);

    // Analyser la première feuille
    const firstSheetName = sheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    console.log('\n📄 Analyse de la feuille:', firstSheetName);

    // Convertir en JSON pour analyser la structure
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    console.log('📈 Nombre de lignes:', jsonData.length);

    if (jsonData.length > 0) {
      console.log('\n🔧 Structure des colonnes:');
      const columns = Object.keys(jsonData[0]);
      columns.forEach((col, index) => {
        console.log(`  ${index + 1}. ${col}`);
      });

      console.log('\n💼 Exemple de données (3 premières lignes):');
      jsonData.slice(0, 3).forEach((row, index) => {
        console.log(`\nLigne ${index + 1}:`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });

      // Analyser les champs importants
      console.log('\n🔍 Analyse des champs:');

      const possibleMappings = {
        companyName: ['nom', 'company', 'entreprise', 'name', 'societe'],
        email: ['email', 'mail', 'e-mail'],
        phone: ['telephone', 'phone', 'tel', 'mobile'],
        address: ['adresse', 'address', 'rue'],
        city: ['ville', 'city', 'localite'],
        website: ['site', 'website', 'web', 'url']
      };

      Object.entries(possibleMappings).forEach(([field, possibleNames]) => {
        const foundColumn = columns.find(col =>
          possibleNames.some(name =>
            col.toLowerCase().includes(name.toLowerCase())
          )
        );
        console.log(`  ${field}: ${foundColumn || 'NON TROUVÉ'}`);
      });

    } else {
      console.log('⚠️ Aucune donnée trouvée dans le fichier');
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error.message);
  }
}

analyzeExcel();