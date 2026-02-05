/**
 * Script de test pour diagnostiquer l'API Scraping Dog
 */

const axios = require('axios')

const API_KEY = '6983aa923140b3e70f546caf'

async function testScrapingDog() {
  console.log('🔍 Test Scraping Dog API')
  console.log('API Key:', API_KEY)
  console.log()

  // Test 1: API Simple (vérifier si la clé fonctionne)
  console.log('📋 Test 1: Simple API endpoint')
  try {
    const simpleUrl = `https://api.scrapingdog.com/scrape?api_key=${API_KEY}&url=https://httpbin.org/ip`
    console.log('URL:', simpleUrl)

    const response = await axios.get(simpleUrl)
    console.log('✅ Simple API OK, Status:', response.status)
    console.log('Response length:', response.data.length)
  } catch (error) {
    console.log('❌ Simple API Error:', error.response?.status, error.response?.data)
  }
  console.log()

  // Test 2: Google Maps API
  console.log('📍 Test 2: Google Maps endpoint')
  try {
    const gmapsUrl = `https://api.scrapingdog.com/google_maps?api_key=${API_KEY}&query=plombier paris&results=5`
    console.log('URL:', gmapsUrl)

    const response = await axios.get(gmapsUrl)
    console.log('✅ Google Maps API OK, Status:', response.status)
    console.log('Prospects trouvés:', Array.isArray(response.data) ? response.data.length : 'Format inattendu')

    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('Premier prospect:', {
        title: response.data[0].title,
        address: response.data[0].address,
        website: response.data[0].website
      })
    }

  } catch (error) {
    console.log('❌ Google Maps API Error:', error.response?.status)
    console.log('Error message:', error.response?.data)
    console.log('Full error:', error.message)
  }
  console.log()

  // Test 3: Vérifier les headers
  console.log('🔧 Test 3: Headers check')
  try {
    const response = await axios.get(`https://api.scrapingdog.com/google_maps?api_key=${API_KEY}&query=test&results=1`)
    console.log('Headers reçus:', Object.keys(response.headers))
  } catch (error) {
    console.log('Headers error:', error.response?.headers)
    console.log('Status code détaillé:', error.response?.status)
    console.log('Status text:', error.response?.statusText)
  }
}

testScrapingDog().catch(console.error)