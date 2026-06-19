<div align="center">

# Hadith API

<img width="460" height="300" src="https://github.com/fawazahmed0/hadith-api/raw/1/hadith.jpg" alt="Hadith API banner">

*In the name of God, who has guided me to do this work.*

</div>

---

## ✨ Features

- 🚀 **Free & blazing fast** response times
- 🔓 **No rate limits**
- 🌍 **Multiple languages** supported
- 📊 **Multiple grades** included

---

## 🔗 URL Structure

```
https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@{apiVersion}/{endpoint}
```

## 📦 Formats

Every endpoint supports the HTTP `GET` method and returns data in two formats:

| Format | Example |
|---|---|
| Standard | `/{endpoint}.json` |
| Minified | `/{endpoint}.min.json` |

Both formats work as fallbacks for each other — i.e., if `.min.json` fails, fall back to `.json`, and vice versa.

> **⚠️ Warning:** Always include a fallback mechanism in your code [to avoid issues](https://github.com/fawazahmed0/hadith-api/issues/3).

---

## 📚 Endpoints

### List all editions

Returns every available edition in prettified JSON.

```
https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.json
```

Minified version:

```
https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions.min.json
```

### Get a specific edition

Returns an entire hadith collection or translation.

```
/editions/{editionName}
```

**Example:**
```
https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-abudawud.json
```

### Get a specific hadith

Returns a single hadith by number from an edition.

```
/editions/{editionName}/{hadithNo}
```

**Example — Hadith #1035:**
```
https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-abudawud/1035.json
```

**Minified version:**
```
https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-abudawud/1035.min.json
```

### Get a specific section

Returns all hadiths within a given section number.

```
/editions/{editionName}/sections/{sectionNo}
```

**Example — Section 7:**
```
https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/eng-abudawud/sections/7.json
```

### Get collection info

Returns metadata for a hadith book — grades, book references, etc.

```
/info
```

**Example:**
```
https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/info.json
```

---

## 🤝 Contribution

This project survives because of community contributions. If you find an issue, please [let me know](https://github.com/fawazahmed0/hadith-api/issues/new) so it can be fixed for everyone.

You can contribute by:

- **Submitting a translation** — [share it here](https://github.com/fawazahmed0/hadith-api/issues/new) and it will be added
- **Adding it yourself** — follow the [Contributing Guide](https://github.com/fawazahmed0/hadith-api/blob/1/CONTRIBUTING.md) to submit directly to the repo

---

## ⬇️ Download

Get the full dataset → [**Download here**](https://github.com/fawazahmed0/hadith-api/blob/1/download.md)

## 🐛 Issues

Found a bug or have a request? → [**Raise an issue**](https://github.com/fawazahmed0/hadith-api/issues/new)

---

## 🌐 Community Projects

Built with Hadith API:

| Project | Description |
|---|---|
| [Hadiths](https://fawazahmed0.github.io/hadiths) | Hadith browsing web app |
| [Quran Hadith Search Engine](https://fawazahmed0.github.io/quran-hadith-search/) | Combined Quran & Hadith search |
| [Al Hadith App](https://github.com/IsmailHosenIsmailJames/al_hadith) | Mobile hadith app |
| [Hadiths SQLite Data](https://github.com/IsmailHosenIsmailJames/compressed_hadith_sqlite) | Compressed SQLite dataset |

## 🔁 Related Projects

- [Quran API](https://github.com/fawazahmed0/quran-api) — the companion project for Quranic text and translations

---

## ⭐ Support This Project

If you find this useful, please **star the repo** and share it with others who might benefit.

## 📖 References

All open-source projects and dawah/Islamic organizations referenced in this work are listed in [**References.md**](https://github.com/fawazahmed0/hadith-api/blob/1/References.md).

---

<div align="center">

[✏️ Improve this page](https://github.com/fawazahmed0/hadith-api/edit/1/README.md)

</div>
