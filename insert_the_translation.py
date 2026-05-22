import os
import json

def main():
    translated_dir = 'translated_section_names'
    editions_dir = 'editions'

    if not os.path.exists(translated_dir):
        print(f"Error: Directory '{translated_dir}' not found.")
        return

    # Gather all translation mapping files
    translation_files = [f for f in os.listdir(translated_dir) if f.endswith('.json')]
    print(f"Found {len(translation_files)} translation files in '{translated_dir}'.")

    for trans_file in translation_files:
        edition_name = trans_file[:-5]  # Remove '.json'
        trans_path = os.path.join(translated_dir, trans_file)

        # Path to full edition json
        full_json_path = os.path.join(editions_dir, f"{edition_name}.json")
        full_min_json_path = os.path.join(editions_dir, f"{edition_name}.min.json")

        if not os.path.exists(full_json_path):
            print(f"Warning: Edition file '{full_json_path}' not found. Skipping.")
            continue

        print(f"\nProcessing edition: {edition_name}")
        
        # Load translation map
        with open(trans_path, 'r', encoding='utf-8') as f:
            trans_map = json.load(f)

        # 1. Update full edition JSON
        with open(full_json_path, 'r', encoding='utf-8') as f:
            edition_data = json.load(f)

        modified = False
        metadata = edition_data.get("metadata", {})
        section_details = metadata.get("section_details", {})
        
        for section_id, native_name in trans_map.items():
            if section_id in section_details:
                section_details[section_id]["name_native"] = native_name
                modified = True

        if modified:
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
                    section_id = sec_file[:-5]
                    if section_id in trans_map:
                        sec_path = os.path.join(sections_subdir, sec_file)
                        sec_min_path = os.path.join(sections_subdir, f"{section_id}.min.json")

                        with open(sec_path, 'r', encoding='utf-8') as f:
                            sec_data = json.load(f)

                        sec_metadata = sec_data.get("metadata", {})
                        section_detail = sec_metadata.get("section_detail", {})

                        if section_id in section_detail:
                            section_detail[section_id]["name_native"] = trans_map[section_id]
                            
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
                # We skip 'sections' directory and only look at hadith .json files (excluding .min.json)
                if file_name != 'sections' and file_name.endswith('.json') and not file_name.endswith('.min.json'):
                    hadith_path = os.path.join(edition_subdir, file_name)
                    hadith_min_path = os.path.join(edition_subdir, file_name[:-5] + '.min.json')

                    with open(hadith_path, 'r', encoding='utf-8') as f:
                        hadith_data = json.load(f)

                    h_metadata = hadith_data.get("metadata", {})
                    h_section_detail = h_metadata.get("section_detail", {})

                    h_modified = False
                    for sec_id in h_section_detail:
                        if sec_id in trans_map:
                            h_section_detail[sec_id]["name_native"] = trans_map[sec_id]
                            h_modified = True

                    if h_modified:
                        with open(hadith_path, 'w', encoding='utf-8') as f:
                            json.dump(hadith_data, f, ensure_ascii=False, indent='\t')
                        with open(hadith_min_path, 'w', encoding='utf-8') as f:
                            json.dump(hadith_data, f, ensure_ascii=False, separators=(',', ':'))
                        updated_hadiths_count += 1
            if updated_hadiths_count > 0:
                print(f"Updated {updated_hadiths_count} hadith files under {edition_subdir}.")

if __name__ == '__main__':
    main()
