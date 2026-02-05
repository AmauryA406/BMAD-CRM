const axios = require('axios');

// Test avec l'exemple exact de la doc Scraping Dog
const api_key = '6983aa923140b3e70f546caf'; // Ta clé
const url = 'https://api.scrapingdog.com/google_maps';

console.log('🔍 Test avec exemple exact de la doc Scraping Dog')
console.log('API Key:', api_key)
console.log()

// Test 1: Exemple exact de la doc
console.log('📋 Test 1: Exemple exact coffee + coordonnées')
const params1 = {
  api_key: api_key,
  query: 'coffee',
  'll': '@40.7455096,-74.0083012,15.1z'
};

axios
  .get(url, { params: params1 })
  .then(function (response) {
    if (response.status === 200) {
      const data = response.data;
      console.log('✅ Succès! Données reçues:', data.length, 'résultats')
      if (data.length > 0) {
        console.log('Premier résultat:', {
          title: data[0].title,
          address: data[0].address,
          website: data[0].website
        })
      }
    } else {
      console.log('❌ Request failed with status code: ' + response.status);
    }
  })
  .catch(function (error) {
    console.error('❌ Error making the request: ' + error.message);
    if (error.response) {
      console.log('Status:', error.response.status)
      console.log('Response:', error.response.data)
    }
  });

// Test 2: Version simplifiée sans coordonnées
console.log('\n📋 Test 2: Version simple sans coordonnées')
const params2 = {
  api_key: api_key,
  query: 'plombier paris'
};

setTimeout(() => {
  axios
    .get(url, { params: params2 })
    .then(function (response) {
      if (response.status === 200) {
        const data = response.data;
        console.log('✅ Test 2 - Succès! Données reçues:', data.length, 'résultats')
      } else {
        console.log('❌ Test 2 - Request failed with status code: ' + response.status);
      }
    })
    .catch(function (error) {
      console.error('❌ Test 2 - Error: ' + error.message);
      if (error.response) {
        console.log('Status:', error.response.status)
        console.log('Response:', error.response.data)
      }
    });
}, 2000) // Délai pour éviter le rate limiting