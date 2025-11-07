# Journal Checker Agent

Journal Checker is a lightweight agent whose sole job is to scan FedWiki pages after we edit them and report structural issues in the `journal` (out-of-order entries, missing create events, impossible revisions). It doesn’t fix pages automatically; it just emits warnings so we can repair the JSON ourselves.

## Responsibilities
1. After any page edit, run the Journal Checker script.
2. Look for errors such as:
   - “CREATION page creation is not first action, or missing.”
   - “CHRONOLOGY journal contains items out of chronological order.”
   - “REVISION journal cannot construct the current version.”
3. Summarize findings in the FedWiki page (e.g., “*Journal Checker: no errors detected…*”).
4. If errors exist, flag them so editors can rewrite the journal blocks manually (ensuring create → add → edit order).

## Usage
- Invoke Journal Checker manually after editing a page.
- If it reports no issues, append a note to the page.
- If it reports errors, rewrite the page JSON (create/factory/edit order) and rerun.

## Future Ideas
- Add a small CLI helper that pipes a page file through the checker.
- Build an Iceberg/GT command to open the current page in a FedWiki editor, run the checker, and display results inline.
