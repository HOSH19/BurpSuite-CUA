#!/usr/bin/env python3
"""
Simple test script to verify RAG functionality works with the existing ChromaDB setup.
Run this first to ensure the Python side is working correctly.
"""

import os
import sys
from pathlib import Path

# Add the current directory to Python path
current_dir = Path(__file__).parent
sys.path.append(str(current_dir))

from rag_utils import query_collection, get_chroma_client, get_or_create_collection

def test_rag_functionality():
        print("🧪 Testing RAG Python functionality...\n")
        
        # Test 1: Check if we can connect to ChromaDB
        print("1️⃣ Testing ChromaDB connection...")
        db_path = current_dir / "../resources/rag-data/chroma_db"
        
        if not db_path.exists():
            print(f"❌ ChromaDB directory does not exist: {db_path}")
            print("   Please ensure the RAG database is set up correctly.")
            return False
            
        print(f"✅ ChromaDB directory found: {db_path}")
        
        try:
            client = get_chroma_client(str(db_path))
            print("✅ ChromaDB client created successfully")
        except Exception as e:
            print(f"❌ Failed to create ChromaDB client: {e}")
            return False
        
        # Test 2: Get or create collection
        print("\n2️⃣ Testing collection access...")
        try:
            collection = get_or_create_collection(client, 'docs')
            print("✅ Collection accessed successfully")
            
            # Check collection count
            count = collection.count()
            print(f"   Collection contains {count} documents")
            
        except Exception as e:
            print(f"❌ Failed to access collection: {e}")
            return False
        
        # Test 3: Query the collection
        print("\n3️⃣ Testing query functionality...")
        try:
            results = query_collection(collection, "test", 3)
            print("✅ Query executed successfully")
            
            if results['documents'][0]:
                print(f"   Found {len(results['documents'][0])} results")
                
                # Show sample results
                print("\n📄 Sample results:")
                for i, (doc, metadata, distance) in enumerate(zip(
                    results['documents'][0],
                    results['metadatas'][0],
                    results['distances'][0]
                )):
                    print(f"   Result {i+1}:")
                    print(f"   - Distance: {distance:.4f}")
                    print(f"   - Source: {metadata.get('source', 'Unknown') if metadata else 'Unknown'}")
                    print(f"   - Content preview: {doc[:100]}...")
                    print()
            else:
                print("   No results found (this might be normal if the database is empty)")
                
        except Exception as e:
            print(f"❌ Query failed: {e}")
            return False
        
        # Test 4: Test with a more specific query
        print("\n4️⃣ Testing specific query...")
        try:
            specific_results = query_collection(collection, "documentation", 2)
            print("✅ Specific query executed successfully")
            print(f"   Found {len(specific_results['documents'][0])} results")
            
        except Exception as e:
            print(f"❌ Specific query failed: {e}")
            return False
        
        print("\n🎉 All Python RAG tests passed!")
        return True

if __name__ == "__main__":
    try:
        success = test_rag_functionality()
        sys.exit(0 if success else 1)
    except ImportError as e:
        print(f"❌ Failed to import rag_utils: {e}")
        print("\n🔍 Debugging information:")
        print("- Make sure rag_utils.py is in the same directory")
        print("- Verify ChromaDB dependencies are installed:")
        print("  pip install chromadb sentence-transformers more-itertools")
        sys.exit(1) 