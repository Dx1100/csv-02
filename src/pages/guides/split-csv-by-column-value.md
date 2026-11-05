---
layout: ../../layouts/Guide.astro
title: How to Split a CSV by Column Value
description: "Split one CSV into separate files per country, category, or any column value automatically. Free browser tool, no signup, no Excel formulas."
date: 2026-06-11
---

**Quick answer:** open the free [CSV Splitter](/split-csv/), drop in your file, switch the split mode to **By column value**, pick the column, and click Split. You get one CSV per unique value in that column, each with the original header row.

## When you need this

Splitting by column value is one of the most common data-prep tasks:

- A sales export split into **one file per region** for regional managers
- An order list split **per status** (pending, shipped, refunded)
- A product catalog split **per category** for separate marketplace uploads
- A contact list split **per owner** before importing into a CRM

Doing this manually means filtering in Excel, copying rows, and saving each subset, slow and error-prone with more than a few values.

## Step by step

1. Open the [CSV Splitter](/split-csv/).
2. Drag in your CSV. The tool reads the header row and shows a preview.
3. Set split mode to **By column value** and choose the column, e.g. `Country`.
4. Click **Split CSV**. The tool streams through the file and groups rows by each unique value.
5. Download the files individually, named after each value (like `orders-Germany.csv`), or grab everything as one ZIP.

Empty cells are grouped into their own `(empty)` file so no rows are silently dropped.

## Tips for clean results

- **Watch for inconsistent values.** `USA`, `U.S.A.` and `usa` are three different groups. Standardize the column first if needed.
- **Trim whitespace.** Trailing spaces create duplicate groups that look identical.
- **High-cardinality columns** (like email address) create one file per row, usually not what you want. Pick a column with a manageable number of unique values.
- **Deduplicate first** with the [Duplicate Remover](/remove-duplicates-csv/) if your export contains repeated rows.

## Privacy note

The entire grouping happens inside your browser. Your file is never uploaded, making this safe for customer data that must not leave your machine.
