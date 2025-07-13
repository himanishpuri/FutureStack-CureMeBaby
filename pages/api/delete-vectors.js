import qdrantClient from '../../utils/qdrantClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Qdrant collection
    await qdrantClient.initCollection();
    
    const { documentId } = req.body;
    
    // If documentId is provided, delete vectors for that specific document
    if (documentId) {
      try {
        // Create filter for document ID
        const filter = qdrantClient.createFieldFilter('documentId', documentId);
        
        // First search for all vectors that match the document ID
        const searchResults = await qdrantClient.client.scroll(
          qdrantClient.collectionName,
          {
            filter: filter,
            limit: 1000, // Set a reasonable limit for the number of vectors to retrieve
            with_payload: false,
            with_vector: false
          }
        );
        
        if (!searchResults.points || searchResults.points.length === 0) {
          return res.status(200).json({
            success: true,
            message: 'No vectors found for this document',
          });
        }
        
        // Extract the IDs of the vectors to delete
        const vectorIds = searchResults.points.map(point => point.id);
        
        // Delete the vectors
        await qdrantClient.deleteVectors(vectorIds);
        
        return res.status(200).json({
          success: true,
          message: `Successfully deleted ${vectorIds.length} vectors for document: ${documentId}`,
          deletedCount: vectorIds.length
        });
      } catch (error) {
        console.error('Error deleting document vectors:', error);
        throw error;
      }
    } 
    // If no documentId is provided, delete all vectors by recreating the collection
    else {
      try {
        const client = qdrantClient.client;
        const collectionName = qdrantClient.collectionName;
        
        // First check if the collection exists
        const collections = await client.getCollections();
        const collectionExists = collections.collections.some(
          collection => collection.name === collectionName
        );
        
        if (collectionExists) {
          // Delete the existing collection
          await client.deleteCollection(collectionName);
          
          // Recreate the collection with the same settings
          await client.createCollection(collectionName, {
            vectors: { 
              size: qdrantClient.vectorDimension, 
              distance: "Cosine" 
            },
            optimizers_config: {
              indexing_threshold: 0,
            },
          });
          
          return res.status(200).json({
            success: true,
            message: 'All vectors deleted successfully by recreating collection',
          });
        } else {
          return res.status(200).json({
            success: true,
            message: 'Collection does not exist, nothing to delete',
          });
        }
      } catch (deleteError) {
        console.error('Error deleting collection:', deleteError);
        throw deleteError;
      }
    }
  } catch (error) {
    console.error('Error deleting vectors:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to delete vectors',
      error: error.message
    });
  }
} 