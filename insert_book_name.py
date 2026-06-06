import os
import json

def insert_name_native(metadata, book_name):
    new_metadata = {}
    for k, v in metadata.items():
        if k == "name_native":
            continue  # Avoid duplicate or out-of-order keys if run multiple times
        new_metadata[k] = v
        if k == "name":
            new_metadata["name_native"] = book_name
    if "name_native" not in new_metadata:
        new_metadata["name_native"] = book_name
    return new_metadata

def main():
    books_json_path = 'list_of_books.json'
    editions_dir = 'editions'

    if not os.path.exists(books_json_path):
        print(f"Error: File '{books_json_path}' not found.")
        return

    # Load list_of_books.json and build lookup map
    with open(books_json_path, 'r', encoding='utf-8') as f:
        books_list = json.load(f)
    
    books_map = {}
    for item in books_list:
        books_map.update(item)

    print(f"Loaded {len(books_map)} book name mappings from '{books_json_path}'.")

    for edition_name, book_name in books_map.items():
        # Path to full edition json
        full_json_path = os.path.join(editions_dir, f"{edition_name}.json")
        full_min_json_path = os.path.join(editions_dir, f"{edition_name}.min.json")

        if not os.path.exists(full_json_path):
            print(f"Warning: Edition file '{full_json_path}' not found. Skipping.")
            continue

        print(f"\nProcessing edition: {edition_name} -> {book_name}")
        
        # 1. Update full edition JSON
        with open(full_json_path, 'r', encoding='utf-8') as f:
            edition_data = json.load(f)

        metadata = edition_data.setdefault("metadata", {})
        edition_data["metadata"] = insert_name_native(metadata, book_name)

        with open(full_json_path, 'w', encoding='utf-8') as f:
            json.dump(edition_data, f, ensure_ascii=False, indent='\t')
        with open(full_min_json_path, 'w', encoding='utf-8') as f:
            json.dump(edition_data, f, ensure_ascii=False, separators=(',', ':'))
        print(f"Updated full edition JSON and min.json for {edition_name}.")

        # 2. Update section JSON files under editions/{edition_name}/sections/
        sections_subdir = os.path.join(editions_dir, edition_name, 'sections')
        if os.path.exists(sections_subdir):
            updated_sections_count = 0
            for sec_file in os.listdir(sections_subdir):
                if sec_file.endswith('.json') and not sec_file.endswith('.min.json'):
                    sec_path = os.path.join(sections_subdir, sec_file)
                    sec_name_base = sec_file[:-5]
                    sec_min_path = os.path.join(sections_subdir, f"{sec_name_base}.min.json")

                    with open(sec_path, 'r', encoding='utf-8') as f:
                        sec_data = json.load(f)

                    sec_metadata = sec_data.setdefault("metadata", {})
                    sec_data["metadata"] = insert_name_native(sec_metadata, book_name)
                    
                    with open(sec_path, 'w', encoding='utf-8') as f:
                        json.dump(sec_data, f, ensure_ascii=False, indent='\t')
                    with open(sec_min_path, 'w', encoding='utf-8') as f:
                        json.dump(sec_data, f, ensure_ascii=False, separators=(',', ':'))
                    updated_sections_count += 1
            if updated_sections_count > 0:
                print(f"Updated {updated_sections_count} section files under {sections_subdir}.")

        # 3. Update hadith JSON files under editions/{edition_name}/
        edition_subdir = os.path.join(editions_dir, edition_name)
        if os.path.exists(edition_subdir):
            updated_hadiths_count = 0
            for file_name in os.listdir(edition_subdir):
                # Skip 'sections' directory and only look at hadith .json files (excluding .min.json)
                if file_name != 'sections' and file_name.endswith('.json') and not file_name.endswith('.min.json'):
                    hadith_path = os.path.join(edition_subdir, file_name)
                    hadith_min_path = os.path.join(edition_subdir, file_name[:-5] + '.min.json')

                    with open(hadith_path, 'r', encoding='utf-8') as f:
                        hadith_data = json.load(f)

                    h_metadata = hadith_data.setdefault("metadata", {})
                    hadith_data["metadata"] = insert_name_native(h_metadata, book_name)

                    with open(hadith_path, 'w', encoding='utf-8') as f:
                        json.dump(hadith_data, f, ensure_ascii=False, indent='\t')
                    with open(hadith_min_path, 'w', encoding='utf-8') as f:
                        json.dump(hadith_data, f, ensure_ascii=False, separators=(',', ':'))
                    updated_hadiths_count += 1
            if updated_hadiths_count > 0:
                print(f"Updated {updated_hadiths_count} hadith files under {edition_subdir}.")

if __name__ == '__main__':
    main()
