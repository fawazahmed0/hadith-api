import os
import json
import sqlite3
import zipfile
import hashlib
from typing import Dict, List, Any

def get_sha256(file_path: str) -> str:
    """Calculates the SHA256 checksum of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def get_db_metadata(db_path: str) -> Dict[str, Any]:
    """Extracts metadata from the SQLite database."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get book info
    cursor.execute("SELECT book_name, hadith_count FROM book_info LIMIT 1")
    book_row = cursor.fetchone()
    book_name = book_row[0] if book_row else "Unknown"
    hadith_count = book_row[1] if book_row else 0
    
    # Get section count
    cursor.execute("SELECT COUNT(*) FROM sections")
    section_count = cursor.fetchone()[0]
    
    conn.close()
    return {
        "name": book_name,
        "hadith_count": hadith_count,
        "section_count": section_count
    }

def compress_file(src_path: str, dest_path: str):
    """Compresses a file into a ZIP archive."""
    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
    with zipfile.ZipFile(dest_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(src_path, os.path.basename(src_path))

def process_all():
    src_dir = "sqlite_files"
    dest_base_dir = "compressed_hadith_sqlite"
    
    if not os.path.exists(src_dir):
        print(f"Error: {src_dir} not found.")
        return
    
    if not os.path.exists(dest_base_dir):
        os.makedirs(dest_base_dir)
        
    db_files = [f for f in os.listdir(src_dir) if f.endswith(".sqlite")]
    languages: Dict[str, List[Dict[str, Any]]] = {}
    
    for db_file in db_files:
        # Assuming filename format is [lang]-[edition].sqlite
        lang = db_file.split('-')[0]
        db_path = os.path.join(src_dir, db_file)
        
        print(f"Processing {db_file} (Language: {lang})...")
        
        # 1. Get metadata and checksum
        metadata = get_db_metadata(db_path)
        checksum = get_sha256(db_path)
        
        # 2. Compress
        zip_filename = f"{db_file}.zip"
        zip_path = os.path.join(dest_base_dir, lang, zip_filename)
        compress_file(db_path, zip_path)
        
        # 3. Add to language info
        if lang not in languages:
            languages[lang] = []
            
        languages[lang].append({
            "book": db_file.replace(".sqlite", ""),
            "name": metadata["name"],
            "hadith_count": metadata["hadith_count"],
            "section_count": metadata["section_count"],
            "checksum": checksum,
            "zip_path": f"{lang}/{zip_filename}",
            "file_size": os.path.getsize(db_path),
            "zip_size": os.path.getsize(zip_path)
        })
        
    # 4. Generate info.json for each language
    for lang, books in languages.items():
        lang_dir = os.path.join(dest_base_dir, lang)
        info_json_path = os.path.join(lang_dir, "info.json")
        
        with open(info_json_path, "w", encoding="utf-8") as f:
            json.dump({
                "language": lang,
                "books": books
            }, f, indent=4, ensure_ascii=False)
            
        print(f"Generated info.json for {lang} in {lang_dir}")

    # 5. Generate master info.json for all languages
    master_info_path = os.path.join(dest_base_dir, "all_info.json")
    with open(master_info_path, "w", encoding="utf-8") as f:
        json.dump(languages, f, indent=4, ensure_ascii=False)
    print(f"Generated master info file: {master_info_path}")

if __name__ == "__main__":
    process_all()
    print("Done!")
