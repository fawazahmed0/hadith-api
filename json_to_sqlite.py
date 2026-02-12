import json
import sqlite3
import os
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class HadithSection:
    section_name: str
    start_hadith_number: int
    end_hadith_number: int
    hadith_count: int

@dataclass
class HadithGrade:
    name: str
    grade: str

@dataclass
class HadithReference:
    book: int
    hadith: int

@dataclass
class Hadith:
    hadith_number: int
    text: str
    grades: List[HadithGrade]
    reference: HadithReference

def create_database(db_path: str):
    """Creates the SQLite database with the required 4-table schema and FTS5."""
    if os.path.exists(db_path):
        os.remove(db_path)
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Hadith sections info
    cursor.execute('''
    CREATE TABLE sections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section_name TEXT,
        start_hadith_number INTEGER,
        end_hadith_number INTEGER,
        hadith_count INTEGER
    )
    ''')
    
    # 2. For All hadith table
    cursor.execute('''
    CREATE TABLE hadiths (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hadith_number INTEGER,
        text TEXT,
        section_id INTEGER,
        book_id INTEGER,
        FOREIGN KEY (section_id) REFERENCES sections (id)
    )
    ''')
    
    # 3. a grades table
    cursor.execute('''
    CREATE TABLE grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hadith_id INTEGER,
        scholar_name TEXT,
        grade TEXT,
        FOREIGN KEY (hadith_id) REFERENCES hadiths (id)
    )
    ''')
    
    # 4. basic info of hadith book
    cursor.execute('''
    CREATE TABLE book_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_name TEXT,
        hadith_count INTEGER
    )
    ''')
    
    # FTS5 Optimization for search
    cursor.execute('''
    CREATE VIRTUAL TABLE hadiths_fts USING fts5(
        text,
        content='hadiths',
        content_rowid='id'
    )
    ''')
    
    # Triggers to keep FTS index in sync
    cursor.execute('''
    CREATE TRIGGER hadiths_ai AFTER INSERT ON hadiths BEGIN
        INSERT INTO hadiths_fts(rowid, text) VALUES (new.id, new.text);
    END;
    ''')
    
    cursor.execute('''
    CREATE TRIGGER hadiths_ad AFTER DELETE ON hadiths BEGIN
        INSERT INTO hadiths_fts(hadiths_fts, rowid, text) VALUES('delete', old.id, old.text);
    END;
    ''')
    
    cursor.execute('''
    CREATE TRIGGER hadiths_au AFTER UPDATE ON hadiths BEGIN
        INSERT INTO hadiths_fts(hadiths_fts, rowid, text) VALUES('delete', old.id, old.text);
        INSERT INTO hadiths_fts(rowid, text) VALUES (new.id, new.text);
    END;
    ''')
    
    conn.commit()
    return conn

def get_list_of_hadith_folder(base_path: str) -> List[str]:
    list_of_all = os.listdir(base_path)
    return [item for item in list_of_all if os.path.isdir(os.path.join(base_path, item))]

def get_sections_list(hadith_folder_path: str) -> List[str]:
    sections_path = os.path.join(hadith_folder_path, "sections")
    if not os.path.exists(sections_path):
        return []
    list_of_sections_all = os.listdir(sections_path)
    # Sort numerically to maintain order if possible
    sections = [item for item in list_of_sections_all if item.endswith(".json") and not item.endswith(".min.json") and item != "0.json"]
    return sorted(sections, key=lambda x: int(x.split('.')[0]))

def process_edition(base_path: str, edition_folder: str):
    edition_path = os.path.join(base_path, edition_folder)
    output_dir = "sqlite_files"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    db_path = os.path.join(output_dir, f"{edition_folder}.sqlite")
    print(f"Processing {edition_folder} -> {db_path}...")
    
    conn = create_database(db_path)
    cursor = conn.cursor()
    
    sections_list = get_sections_list(edition_path)
    total_hadiths = 0
    book_name = ""
    
    for section_file in sections_list:
        section_path = os.path.join(edition_path, "sections", section_file)
        with open(section_path, "r", encoding='utf-8') as f:
            data = json.load(f)
            metadata = data["metadata"]
            hadiths_data = data["hadiths"]
            
            if not book_name:
                book_name = metadata.get("name", edition_folder)
            
            # Extract section metadata
            section_index = section_file.split('.')[0]
            section_name = metadata["section"].get(section_index, "Unknown Section")
            section_detail = metadata["section_detail"].get(section_index, {})
            
            start_hadith = section_detail.get("hadithnumber_first", 0)
            end_hadith = section_detail.get("hadithnumber_last", 0)
            # Use arabicnumber_last - arabicnumber_first + 1 if available, otherwise len of hadiths
            count = section_detail.get("arabicnumber_last", 0) - section_detail.get("arabicnumber_first", 0) + 1
            if count <= 0:
                count = len(hadiths_data)

            # Insert section
            cursor.execute('''
                INSERT INTO sections (section_name, start_hadith_number, end_hadith_number, hadith_count)
                VALUES (?, ?, ?, ?)
            ''', (section_name, start_hadith, end_hadith, count))
            section_id = cursor.lastrowid
            
            # Insert hadiths and grades
            for h in hadiths_data:
                hadith_num = h.get("hadithnumber", 0)
                text = h.get("text", "")
                
                cursor.execute('''
                    INSERT INTO hadiths (hadith_number, text, section_id, book_id)
                    VALUES (?, ?, ?, ?)
                ''', (hadith_num, text, section_id, 1)) # book_id is dummy for now
                hadith_id = cursor.lastrowid
                
                for g in h.get("grades", []):
                    cursor.execute('''
                        INSERT INTO grades (hadith_id, scholar_name, grade)
                        VALUES (?, ?, ?)
                    ''', (hadith_id, g["name"], g["grade"]))
                
                total_hadiths += 1
                
    # Update book info
    cursor.execute('INSERT INTO book_info (book_name, hadith_count) VALUES (?, ?)', (book_name, total_hadiths))
    
    conn.commit()
    conn.close()
    print(f"Finished {edition_folder}. Total Hadiths: {total_hadiths}")

if __name__ == "__main__":
    base_path = "editions/"
    if not os.path.exists(base_path):
        print(f"Error: {base_path} not found.")
        exit(1)
        
    editions = get_list_of_hadith_folder(base_path)
    for edition in editions:
        try:
            process_edition(base_path, edition)
        except Exception as e:
            print(f"Error processing {edition}: {e}")