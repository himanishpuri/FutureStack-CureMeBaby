import qdrantClient from '../../utils/qdrantClient';

export default async function handler(req, res) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({ error: 'Missing required field: documentId' });
    }

    // Initialize Qdrant collection
    await qdrantClient.initCollection();

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
      return res.status(404).json({ message: 'No vectors found for this document' });
    }

    console.log(`Found ${searchResults.points.length} vectors for document ID: ${documentId}`);

    // Extract the IDs of the vectors to delete
    const vectorIds = searchResults.points.map(point => point.id);

    // Delete the vectors
    const deleteResponse = await qdrantClient.deleteVectors(vectorIds);

    console.log(`Successfully deleted ${vectorIds.length} vectors for document ID: ${documentId}`);

    return res.status(200).json({
      message: `Successfully deleted ${vectorIds.length} vectors for document: ${documentId}`,
      deletedCount: vectorIds.length
    });

  } catch (error) {
    console.error('Error deleting document vectors:', error);
    
    return res.status(500).json({
      error: 'Failed to delete document vectors',
      message: error.message
    });
  }
} 