---
layout: ../../layouts/Guide.astro
title: How to Convert CSV to JSON (and Back)
description: "Convert a CSV file to a JSON array of objects in one click, or turn JSON back into CSV. Free browser tool, no coding, no signup, fully private."
date: 2026-06-11
---

**Quick answer:** open the free [CSV ⇄ JSON Converter](/csv-to-json/), drop in your CSV, and click Convert. Each row becomes a JSON object whose keys are your column headers, output as a pretty-printed array. Switch the direction to convert JSON back to CSV.

## What the output looks like

Given this CSV:

```csv
name,email,plan
Ada,ada@example.com,pro
Lin,lin@example.com,free
```

the converter produces:

```json
[
  { "name": "Ada", "email": "ada@example.com", "plan": "pro" },
  { "name": "Lin", "email": "lin@example.com", "plan": "free" }
]
```

This array-of-objects shape is what most APIs, NoSQL databases (like MongoDB imports) and JavaScript applications expect.

## Step by step

1. Open the [CSV ⇄ JSON Converter](/csv-to-json/).
2. Make sure the direction is **CSV → JSON** and drop in your file. The first row is used as the keys.
3. Click **Convert** and download the `.json` file.

For the reverse, choose **JSON → CSV** and drop in a JSON file containing an array of objects. Keys become column headers; objects become rows. If your objects have different keys, the columns are unified automatically.

## Things to know

- **All values are strings.** CSV has no types, so `42` becomes `"42"`. If your destination needs numbers or booleans, cast them on import.
- **Nested JSON flattens poorly.** JSON → CSV works best with flat objects. Nested objects are serialized as text in a single cell.
- **Memory considerations.** Parsing runs in your browser, so file sizes are governed by your device's memory.
- **Privacy:** conversion happens entirely in your browser. Nothing is uploaded, so API keys or customer data in your files stay on your machine.

## Related tasks

Cleaning data before converting it usually pays off: [remove duplicate rows](/remove-duplicates-csv/) first, [merge multiple exports](/merge-csv/) into one file, or [split a large CSV](/split-csv/) into manageable parts.
