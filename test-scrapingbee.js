const axios = require('axios')

// ScrapingBee - alternative à Scraping Dog
// Inscription rapide : https://app.scrapingbee.com/account/register

async function testScrapingBee() {
  console.log('🐝 Test ScrapingBee API (Alternative)')

  // Plan gratuit : 1000 requêtes
  const API_KEY = 'YOUR_SCRAPINGBEE_KEY_HERE'

  try {
    const url = `https://app.scrapingbee.com/api/v1/?api_key=${API_KEY}&url=https://httpbin.org/ip&render_js=false`
    const response = await axios.get(url)
    console.log('✅ ScrapingBee fonctionne!')
    console.log('Status:', response.status)
  } catch (error) {
    console.log('❌ Erreur:', error.message)
  }
}

console.log('📝 Pour tester ScrapingBee:')
console.log('1. Va sur https://app.scrapingbee.com/account/register')
console.log('2. Inscription rapide (généralement sans pb de verification)')
console.log('3. Copie ta clé API dans ce script')
console.log('4. Lance: node test-scrapingbee.js')

testScrapingBee()