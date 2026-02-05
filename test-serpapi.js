/**
 * Test SerpAPI Google Maps
 */

const { getJson } = require('serpapi')

async function testSerpAPI() {
  console.log('🔍 Test SerpAPI Google Maps')

  // Inscris-toi sur https://serpapi.com/users/sign_up
  // Plan gratuit: 100 recherches/mois
  const API_KEY = '09f1d8deb57ac4f84ab115dbc5dcfc60570486413fc86f787b1ea140e5127bc7'

  const params = {
    api_key: API_KEY,
    engine: 'google_maps',
    q: 'plombier paris',
    type: 'search',
    num: 10
  }

  try {
    console.log('Paramètres:', params)
    const response = await getJson(params)

    if (response.local_results && response.local_results.length > 0) {
      console.log('✅ SerpAPI fonctionne!')
      console.log(`Trouvé ${response.local_results.length} résultats`)

      const first = response.local_results[0]
      console.log('Premier résultat:', {
        title: first.title,
        address: first.address,
        phone: first.phone,
        website: first.website
      })
    } else {
      console.log('⚠️ Aucun résultat trouvé')
    }

  } catch (error) {
    console.error('❌ Erreur SerpAPI:', error.message)
  }
}

console.log('📋 Pour tester SerpAPI:')
console.log('1. Va sur https://serpapi.com/users/sign_up')
console.log('2. Inscription gratuite (100 requêtes/mois)')
console.log('3. Copie ta clé API dans ce script')
console.log('4. Lance: node test-serpapi.js')
console.log()

testSerpAPI()