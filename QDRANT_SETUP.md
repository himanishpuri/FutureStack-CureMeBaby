# Qdrant Vector Database Setup

This project uses Qdrant as a vector database for storing and retrieving embeddings. This document explains how to set up and use Qdrant locally.

## Prerequisites

- Docker installed and running
- Node.js and npm installed

## Quick Start

1. Start the Qdrant container using the provided script:

   ```powershell
   # On Windows
   .\scripts\start-qdrant.ps1
   ```

   Alternatively, you can start it directly with Docker Compose:

   ```
   docker-compose up -d qdrant
   ```

2. Verify Qdrant is running:
   - REST API: http://localhost:6333
   - Web UI: http://localhost:6333/dashboard

3. Update your environment variables:
   - Copy `.env.example` to `.env.local` if you haven't already
   - Make sure the Qdrant settings are correct:
     ```
     QDRANT_HOST=localhost
     QDRANT_PORT=6333
     ```

## How It Works

1. The `utils/qdrantClient.js` utility provides a wrapper around the Qdrant REST client
2. When the application starts, it automatically:
   - Checks if the `therapy_chunks` collection exists
   - Creates it if needed with a 4096-dimension vector space
   - Configures it to use cosine similarity

## Managing the Vector Database

- **Adding vectors**: Happens through the `/api/ingest` endpoint
- **Searching vectors**: Used by the `/api/chat` endpoint
- **Clearing vectors**: Use the `/api/delete-vectors` endpoint

## Troubleshooting

1. **Cannot connect to Qdrant**:
   - Ensure Docker is running
   - Check if the Qdrant container is running: `docker ps`
   - Verify ports 6333 and 6334 are not being used by other applications

2. **Slow search performance**:
   - Consider adding payload indexes for frequently filtered fields

3. **Docker volume permissions issues**:
   - Ensure the `./qdrant_storage` directory has appropriate permissions

## Technical Details

The Qdrant collection is configured with:
- 4096-dimensional vectors (compatible with embedding-passage model)
- Cosine similarity metric
- Payload fields: text, tag, doc_id, chunk_index, timestamp 