import { spawn } from 'child_process';
import path from 'path';

export interface RAGQueryResult {
  documents: string[];
  metadatas: Record<string, any>[];
  distances: number[];
  ids: string[];
}

export interface RAGContext {
  context: string;
  relevance: number;
  source?: string;
}

export class RAGService {
  private static instance: RAGService;
  private pythonPath: string;
  private ragScriptPath: string;

  private constructor() {
    // Assuming Python is available in PATH, adjust as needed
    this.pythonPath = 'python';

    // Even simpler: since cwd is apps/ui-tars, just use relative path from there
    const cwd = process.cwd();
    this.ragScriptPath = path
      .join(cwd, 'src/main/services/rag_utils.py')
      .replace(/\\/g, '/');

    // console.log('🔍 RAG DEBUG: Current working directory (cwd):', cwd);
    // console.log('🔍 RAG DEBUG: RAG script path:', this.ragScriptPath);
    // console.log('🔍 RAG DEBUG: __dirname:', __dirname);
  }

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Query the RAG database for relevant context
   */
  public async queryRAG(
    query: string,
    nResults: number = 5,
  ): Promise<RAGContext[]> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonPath, [
        '-c',
        `
import sys
import os
import json

# Add the directory containing rag_utils.py to Python path
script_dir = os.path.dirname('${this.ragScriptPath}')
sys.path.append(script_dir)
print(f"Python script dir: {script_dir}", file=sys.stderr)
print(f"Python path: {sys.path}", file=sys.stderr)

from rag_utils import query_collection, get_chroma_client, get_or_create_collection, format_results_as_context

try:
    # Initialize ChromaDB client - use simple absolute path
    script_dir = os.path.dirname('${this.ragScriptPath}')
    db_path = os.path.join(script_dir, '../resources/rag-data/chroma_db')
    db_path = os.path.abspath(db_path)  # Convert to absolute path
    
    print(f"Database path: {db_path}", file=sys.stderr)
    client = get_chroma_client(db_path)
    collection = get_or_create_collection(client, 'docs')
    
    # Query the collection
    results = query_collection(collection, '${query.replace(/'/g, "\\'")}', ${nResults})
    
    # Format results
    contexts = []
    for i, (doc, metadata, distance) in enumerate(zip(
        results['documents'][0],
        results['metadatas'][0],
        results['distances'][0]
    )):
        contexts.append({
            'context': doc,
            'relevance': 1 - distance,
            'source': metadata.get('source', 'Unknown') if metadata else 'Unknown'
        })
    
    print('RAG_RESULTS:' + json.dumps(contexts))
except Exception as e:
    print('RAG_ERROR:' + str(e))
    sys.exit(1)
        `,
      ]);

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const match = output.match(/RAG_RESULTS:(.+)/);
            if (match) {
              const contexts = JSON.parse(match[1]);
              resolve(contexts);
            } else {
              resolve([]);
            }
          } catch (error) {
            console.error('Failed to parse RAG results:', error);
            resolve([]);
          }
        } else {
          console.error('RAG query failed:', errorOutput);
          reject(new Error(`RAG query failed: ${errorOutput}`));
        }
      });
    });
  }

  /**
   * Get RAG context for system prompt enhancement
   */
  public async getRAGContext(instructions: string): Promise<string> {
    try {
      const contexts = await this.queryRAG(instructions, 3);

      if (contexts.length === 0) {
        return '';
      }

      let contextString = '\n\n## RELEVANT CONTEXT FROM KNOWLEDGE BASE:\n';
      contexts.forEach((ctx, index) => {
        contextString += `\n**Context ${index + 1}** (Relevance: ${ctx.relevance.toFixed(2)}, Source: ${ctx.source}):\n`;
        contextString += `${ctx.context}\n`;
      });
      contextString +=
        '\nUse this context to provide more accurate and helpful responses.\n';

      return contextString;
    } catch (error) {
      console.error('Failed to get RAG context:', error);
      return '';
    }
  }
}
