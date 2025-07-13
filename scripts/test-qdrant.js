/**
 * Test script to verify Qdrant integration
 * 
 * Run with: node scripts/test-qdrant.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const qdrantClient = require('../utils/qdrantClient').default;

// Test example vector data
const testVectors = [
  {
    id: 'test-1',
    vector: Array(4096).fill(0).map(() => Math.random()), // Random 4096-d vector
    payload: {
      text: 'This is a test document for Qdrant integration',
      tag: 'test',
      doc_id: 'test-doc',
      chunk_index: 0,
      timestamp: new Date().toISOString()
    }
  },
  {
    id: 'test-2',
    vector: Array(4096).fill(0).map(() => Math.random()), // Random 4096-d vector
    payload: {
      text: 'Another test document to verify search functionality',
      tag: 'test',
      doc_id: 'test-doc',
      chunk_index: 1,
      timestamp: new Date().toISOString()
    }
  }
];

async function runTests() {
  try {
    console.log('Starting Qdrant integration tests...');
    
    // 1. Initialize collection
    console.log('1. Initializing collection...');
    await qdrantClient.initCollection();
    console.log('✅ Collection initialized');
    
    // 2. Upsert test vectors
    console.log('2. Upserting test vectors...');
    const upsertResult = await qdrantClient.upsertVectors(testVectors);
    console.log('✅ Test vectors upserted:', upsertResult);
    
    // 3. Search for similar vectors
    console.log('3. Searching for vectors...');
    const searchResults = await qdrantClient.search(testVectors[0].vector, 5);
    console.log('✅ Search results:', JSON.stringify(searchResults, null, 2));
    
    // 4. Filter search
    console.log('4. Testing filtered search...');
    const filter = qdrantClient.createFieldFilter('doc_id', 'test-doc');
    const filteredResults = await qdrantClient.search(testVectors[0].vector, 5, filter);
    console.log('✅ Filtered results:', JSON.stringify(filteredResults, null, 2));
    
    // 5. Delete test vectors
    console.log('5. Cleaning up test vectors...');
    const deleteResult = await qdrantClient.deleteVectors(testVectors.map(v => v.id));
    console.log('✅ Test vectors deleted:', deleteResult);
    
    console.log('\n🎉 All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests(); 