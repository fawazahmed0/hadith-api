## Contribute:


### Prerequisite Steps:
1.  Go to [web editor](https://github.dev/fawazahmed0/hadith-api "web editor")

### Add new translations:
The [database/originals](https://github.com/fawazahmed0/hadith-api/tree/1/database/originals "database/originals") folder have different translations that were used as an input to apiscript.js, please refer those files to check whether your translation file will work fine or not. You may want to [preprocess](https://github.com/fawazahmed0/hadith-api/blob/1/Preprocessing.md) the file, if it is in other than text format(pdf, Images, docx, etc).

    [Example 1](https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/database/originals/englishtirmidhiscrapped.txt "Example 1")

    [Example 2](https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/database/originals/englishmalikscrapped.txt "Example 2")

    [Example 3](https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/database/originals/englishnasaiscrapped.txt "Example 3")

2.  Add JSON data at end of the file in following format:
    ```json
    {
    "book":"Name of the book",
    "author":"Name of the translator",
    "language":"Name of the language",
    "source":"Specify source here if any",
    "comments":"Add any comments here"
    }
    ```  
    Please see [database/originals](https://github.com/fawazahmed0/hadith-api/tree/1/database/originals "database/originals") , all the files have the json data at end of file.
When specifying the language, please use proper [iso name of language](https://github.com/fawazahmed0/quran-api/blob/1/isocodes/iso-codes.json "iso name of language")

3. Drag & drop the translations to the [start](https://github.com/fawazahmed0/hadith-api/tree/1/start "start") directory, you can paste any number of translations.

4. And then, edit [command.txt](https://github.com/fawazahmed0/hadith-api/blob/1/command.txt) file with the following line:<br>
`create`

5. Now commit the changes and create pull request.


If you got stuck somewhere, Let me  [Know](https://github.com/fawazahmed0/hadith-api/issues/new "Know")

### Update translations:

Let say there is a spelling mistake in the edition and you would like to correct:

1. Copy the file to be edited, from [database/linebyline](https://github.com/fawazahmed0/hadith-api/tree/1/database/linebyline) directory and paste it into start directory

3. Update the text, Please do not modify the JSON values which are stored at the end of file,specifically the name and language json values

4. And then, edit [command.txt](https://github.com/fawazahmed0/hadith-api/blob/1/command.txt) file with the following line:<br>
`update`

5. Now commit the changes and create pull request.

### Searching Translation:

Lets say you what to know whether a translation exists in the database or not, or you want to find the edition which have a specific verse

1. Edit [command.txt](https://github.com/fawazahmed0/hadith-api/blob/1/command.txt) file with the following line:<br>
`search`
And next line with:
`"text to be searched1" "text to be searched2"`

2. Now commit the changes and create pull request.



### Deleting Translation:
1. Translations should not be deleted, otherwise it will break the api, but if there is a need, it can be done by editing [command.txt](https://github.com/fawazahmed0/hadith-api/blob/1/command.txt) file with the following line:
`delete`<br>
And next line with editions to be deleted<br>
`editionNameToDelete editionName2ToDelete`

2. Now commit the changes and create pull request.

<br>

Facing any issue? [Let me Know](https://github.com/fawazahmed0/hadith-api/issues/new "Let me Know ")

<br>

The above given details are enough to contribute to this repo, incase you want to know how the underlying things work or want to add new features to the repo then see [Local Contribute](https://github.com/fawazahmed0/hadith-api/blob/1/CONTRIBUTING-LOCAL.md "Implementation details") and [Development details](https://github.com/fawazahmed0/hadith-api/blob/1/dev.md "Development details")

<br>
<br>
<br>

[:pencil2:*Improve this page*](https://github.com/fawazahmed0/hadith-api/edit/1/CONTRIBUTING.md)
