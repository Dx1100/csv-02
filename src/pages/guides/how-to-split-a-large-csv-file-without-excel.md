---
layout: ../../layouts/Guide.astro
title: How to Split a Large CSV File Without Excel
description: "Excel can't open CSVs beyond 1,048,576 rows. Learn three free ways to split a large CSV file into smaller parts in seconds, without installing anything."
date: 2026-06-11
---

**Quick answer:** open the free [CSV Splitter](/split-csv/), drop in your file, choose how many rows you want per part, and click Split. Every part keeps the header row and downloads instantly. The file is processed in your browser, so nothing is uploaded and there is no fixed server upload limit.

## Why Excel fails on large CSV files

Excel has a hard limit of **1,048,576 rows** per worksheet. Open a bigger CSV and Excel silently truncates the data, which is a common cause of broken reports and incomplete imports. Even below the limit, files with hundreds of thousands of rows make Excel slow, and saving from Excel can mangle encodings, dates and leading zeros.

## Option 1: a browser-based splitter (easiest)

The fastest method that works on any operating system:

1. Open the [CSV Splitter](/split-csv/).
2. Drag your file into the drop zone. A preview confirms the file parsed correctly.
3. Choose **By number of rows** and enter a value, for example `1000000` so every part opens in Excel, or `50000` for easy email/CRM imports.
4. Click **Split CSV** and download the parts individually or as a ZIP.

Because the splitter streams the file inside your browser, large files split smoothly without server upload wait times and your data never leaves your device, which matters for customer lists and financial exports.

## Option 2: the command line

On macOS or Linux, `split` can divide a file by line count:

```bash
tail -n +2 big.csv | split -l 50000 - part_ --additional-suffix=.csv
```

The catch: this strips the header from all parts (the `tail` skips it), so you must re-add headers to each part yourself, and quoted fields containing newlines will be cut mid-record. It is fine for simple files, risky for real-world exports.

## Option 3: a Python script

`pandas.read_csv(..., chunksize=50000)` lets you write each chunk to its own file with headers intact. This is the right choice when splitting is part of an automated pipeline, but for a one-off task, installing Python and writing a script is overkill.

## Which should you use?

For a one-time split, the [browser splitter](/split-csv/) is the fastest and safest: headers are preserved automatically, quoted multi-line fields are handled correctly, and there is nothing to install. Need to combine the parts again later? Use the [CSV Merger](/merge-csv/).
