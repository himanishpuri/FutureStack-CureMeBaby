import { QdrantClient } from "@qdrant/js-client-rest";

/**
 * Qdrant client utility for vector operations
 */
export class QdrantClientUtil {
  constructor() {
    this.client = new QdrantClient({ 
      host: process.env.QDRANT_HOST || "localhost", 
      port: process.env.QDRANT_PORT || 6333 
    });
    this.collectionName = "therapy_chunks";
    this.vectorDimension = 4096;
  }

  /**
   * Initialize the collection if it doesn't exist
   */
  async initCollection() {
    try {
      // Check if collection exists
      const collections = await this.client.getCollections();
      const collectionExists = collections.collections.some(
        collection => collection.name === this.collectionName
      );

      if (!collectionExists) {
        // Create collection with cosine similarity
        await this.client.createCollection(this.collectionName, {
          vectors: { 
            size: this.vectorDimension, 
            distance: "Cosine" 
          },
          // Add payload indexes for filtering
          optimizers_config: {
            indexing_threshold: 0,
          },
        });
        console.log(`Collection ${this.collectionName} created successfully`);
      } else {
        console.log(`Collection ${this.collectionName} already exists`);
      }
      return true;
    } catch (error) {
      console.error("Error initializing Qdrant collection:", error);
      throw error;
    }
  }

  /**
   * Upsert vectors with metadata into the collection
   * @param {Array} points - Array of vector points with id, vector, and payload
   * @returns {Object} Operation info
   */
  async upsertVectors(points) {
    try {
      console.log('Upserting vectors:', {
        count: points.length,
        samplePoint: {
          id: points[0].id,
          vectorLength: points[0].vector.length,
          payload: points[0].payload
        }
      });

      const response = await this.client.upsert(this.collectionName, {
        wait: true,
        points: points.map(point => ({
          id: point.id,
          vector: point.vector,
          payload: point.payload
        }))
      });
      return response;
    } catch (error) {
      console.error("Error upserting vectors:", error);
      throw error;
    }
  }

  /**
   * Search for similar vectors
   * @param {Array} vector - Query vector
   * @param {Number} limit - Number of results to return
   * @param {Object} filter - Optional filter conditions
   * @returns {Array} Search results
   */
  async search(vector, limit = 15, filter = null) {
    try {
      console.log('Searching vectors:', {
        vectorLength: vector.length,
        limit,
        filter
      });

      const searchParams = {
        vector: vector,
        limit: limit,
        with_payload: true,
        with_vector: false
      };

      if (filter) {
        searchParams.filter = filter;
      }

      console.log('Search params:', searchParams);

      const results = await this.client.search(this.collectionName, searchParams);
      
      console.log('Search results:', {
        count: results.length,
        sample: results[0]
      });

      return results.map(match => ({
        score: match.score,
        payload: match.payload
      }));
    } catch (error) {
      console.error("Error searching vectors:", error);
      throw error;
    }
  }

  /**
   * Delete vectors by IDs
   * @param {Array} ids - Array of vector IDs to delete
   * @returns {Object} Operation info
   */
  async deleteVectors(ids) {
    try {
      const response = await this.client.delete(this.collectionName, {
        wait: true,
        points: ids
      });
      return response;
    } catch (error) {
      console.error("Error deleting vectors:", error);
      throw error;
    }
  }

  /**
   * Create filter for text field match
   * @param {String} field - Field name
   * @param {String} value - Value to match
   * @returns {Object} Filter object
   */
  createFieldFilter(field, value) {
    return {
      must: [
        {
          key: field,
          match: {
            value: value
          }
        }
      ]
    };
  }
}

// Export singleton instance
const qdrantClient = new QdrantClientUtil();
export default qdrantClient; 