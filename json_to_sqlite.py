import json
import json
import sqlite3
import os



from dataclasses import dataclass


@dataclass
class HadithSection:
    section_name: str
    start_hadith_number: int
    end_hadith_number: int
    hadith_count: int

    def to_json(self):
        return {
            "section_name": self.section_name,
            "start_hadith_number": self.start_hadith_number,
            "end_hadith_number": self.end_hadith_number,
            "hadith_count": self.hadith_count
        }

@dataclass
class HadithGrade:
    name: str
    grade: str

    def to_json(self):
        return {
            "name": self.name,
            "grade": self.grade
        }


@dataclass
class Hadith:
    hadith_number: int
    text: str
    grades: list[HadithGrade]

    def to_json(self):
        return {
            "hadith_number": self.hadith_number,
            "text": self.text,
            "grades": [grade.to_json() for grade in self.grades],
        }


def get_list_of_hadith_folder() -> list[str]:
    list_of_all = os.listdir("editions/")
    list_of_hadith_folder = []
    for item in list_of_all:
        if item.endswith(".json") == False:
            list_of_hadith_folder.append(item)
    return list_of_hadith_folder

def get_sections_list(hadith_folder_path: str) -> list[dict]:
    list_of_sections_all = os.listdir(hadith_folder_path)
    list_of_sections = []
    for item in list_of_sections_all:
        if item != "0.json" and item.endswith(".min.json") == False:
            list_of_sections.append(item)
    return list_of_sections

def get_section_metadata(section_path:str) -> HadithSection:
    with open(section_path, "r") as f:
        row_meta = (dict(json.load(f)))["metadata"]
    section_number = list(dict(row_meta["section"]).keys())[0]
    hadithSection = HadithSection(
        section_name= row_meta["section"][section_number], 
        start_hadith_number= row_meta["section_detail"][section_number]["hadithnumber_first"], 
        end_hadith_number= row_meta["section_detail"][section_number]["hadithnumber_last"], 
        hadith_count= row_meta["section_detail"][section_number]["arabicnumber_last"] - row_meta["section_detail"][section_number]["arabicnumber_first"] + 1
    )
    return hadithSection

def get_book_name(section_path:str):
    with open(section_path, "r") as f:
        row_meta = (dict(json.load(f)))["metadata"]
    return row_meta["name"]
    
def get_hadith_list(section_path:str):
    with open(section_path, "r") as f:
        list_of_row_hadith = (dict(json.load(f)))["hadiths"]
    list_of_hadith: list[Hadith] = []
    for row_hadith in list_of_row_hadith:
        grades = []
        for row_grade in row_hadith["grades"]:
            grades.append(HadithGrade(name=row_grade["name"], grade=row_grade["grade"]))

        list_of_hadith.append(
            Hadith(
                hadith_number= row_hadith["hadithnumber"],
                text= row_hadith["text"],
                grades= grades,
            )
        )
    return list_of_hadith

if __name__ == "__main__":
    base_path = "editions/"
    list_of_folder = get_list_of_hadith_folder()
    for hadith_folder in list_of_folder:
        hadith_folder_path = os.path.join(base_path, hadith_folder, "sections")
        list_of_sections_path = get_sections_list(hadith_folder_path)
        for section in list_of_sections_path:
            section_path = os.path.join(hadith_folder_path, section)
            hadithSection = get_section_metadata(section_path)
            hadiths = get_hadith_list(section_path)
            print(section_path,"->", len(hadiths))
            