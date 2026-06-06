import json
import os

def getMapOfSections(path:str) -> dict:
    mapOfSections = {}
    listOfSectionJson = os.listdir(path)
    for jsonFile in listOfSectionJson:
        if(jsonFile.endswith(".min.json")):
            with open(os.path.join(path,jsonFile),"r") as f:
                data=json.load(f)
                sectionMap = dict(data["metadata"]["section"])
                sectionID = list(sectionMap.keys())[0]
                sectionName = list(sectionMap.values())[0]
                if(sectionID in mapOfSections):
                    if(mapOfSections[sectionID] != sectionName):
                        print(f"[CRITICAL] Section ID {sectionID} has different names: {mapOfSections[sectionID]} and {sectionName}")
                    continue
                mapOfSections[sectionID] = sectionName
    return mapOfSections

listOfBooks = [
"editions/ara-abudawud",
"editions/ara-abudawud1",
"editions/ara-bukhari",
"editions/ara-bukhari1",
"editions/ara-dehlawi",
"editions/ara-dehlawi1",
"editions/ara-ibnmajah",
"editions/ara-ibnmajah1",
"editions/ara-malik",
"editions/ara-malik1",
"editions/ara-muslim",
"editions/ara-muslim1",
"editions/ara-nasai",
"editions/ara-nasai1",
"editions/ara-nawawi",
"editions/ara-nawawi1",
"editions/ara-qudsi",
"editions/ara-qudsi1",
"editions/ara-tirmidhi",
"editions/ara-tirmidhi1",
"editions/ben-abudawud",
"editions/ben-bukhari",
"editions/ben-ibnmajah",
"editions/ben-malik",
"editions/ben-muslim",
"editions/ben-nasai",
"editions/ben-nawawi",
"editions/ben-tirmidhi",
"editions/eng-abudawud",
"editions/eng-bukhari",
"editions/eng-dehlawi",
"editions/eng-ibnmajah",
"editions/eng-malik",
"editions/eng-muslim",
"editions/eng-nasai",
"editions/eng-nawawi",
"editions/eng-qudsi",
"editions/eng-tirmidhi",
"editions/fra-abudawud",
"editions/fra-bukhari",
"editions/fra-dehlawi",
"editions/fra-ibnmajah",
"editions/fra-malik",
"editions/fra-muslim",
"editions/fra-nasai",
"editions/fra-nawawi",
"editions/fra-qudsi",
"editions/ind-abudawud",
"editions/ind-bukhari",
"editions/ind-ibnmajah",
"editions/ind-malik",
"editions/ind-muslim",
"editions/ind-nasai",
"editions/ind-tirmidhi",
"editions/rus-abudawud",
"editions/rus-bukhari",
"editions/rus-muslim",
"editions/tam-bukhari",
"editions/tam-muslim",
"editions/tur-abudawud",
"editions/tur-bukhari",
"editions/tur-ibnmajah",
"editions/tur-malik",
"editions/tur-muslim",
"editions/tur-nasai",
"editions/tur-nawawi",
"editions/tur-tirmidhi",
"editions/urd-abudawud",
"editions/urd-bukhari",
"editions/urd-ibnmajah",
"editions/urd-malik",
"editions/urd-muslim",
"editions/urd-nasai",
"editions/urd-tirmidhi",
]

for bookPath in listOfBooks:
    bookName = bookPath.split("/")[1]
    mapOfSections = getMapOfSections(bookPath)

    mapFolderName = "extracted_section_names"
    if not os.path.exists(mapFolderName):
        os.makedirs(mapFolderName)

    if(os.path.exists(f"{mapFolderName}/{bookName}.json")):
        continue

    with open(f"{mapFolderName}/{bookName}.json", "w", encoding="utf-8") as f:
        json.dump(mapOfSections, f, ensure_ascii=False, indent=4)
    
    print(f"Done for {bookName}")
