import os
import json

pathOfSections = "extracted_section_names"

listOfSectionMap = os.listdir(pathOfSections)

for sectionMap in listOfSectionMap:
    count = 0
    secondJsonName = ""
    for _sectionMap in listOfSectionMap:
        if(_sectionMap.count(sectionMap.split(".")[0]) > 0):
            count+=1
            secondJsonName = _sectionMap
            break
    if(count > 1):
        with open(f"{pathOfSections}/{sectionMap}") as f:
            data1 = json.load(f)
        with open(f"{pathOfSections}/{secondJsonName}") as f:
            data2 = json.load(f)
            
        for key in data1:
            if(key in data2):
                if(data1[key] != data2[key]):
                    print(f"[CRITICAL] Section ID {key} has different names: {data1[key]} and {data2[key]}")
        
        if(len(data1) != len(data2)):
            print(f"[CRITICAL] Section ID {key} has different names: {data1[key]} and {data2[key]}")
            
            for key in data2:
                if(key not in data1):
                    print(f"[CRITICAL] Section ID {key} is in {secondJsonName} but not in {sectionMap}")
        
        
            
        