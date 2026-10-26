import markdown
import weasyprint
import re

md_file = "/home/sheheryar-sohail/Downloads/Property-Management-System-main/PMS_Scalability_Performance_Audit_Report.md"
pdf_file = "/home/sheheryar-sohail/Downloads/Property-Management-System-main/PMS_Scalability_Performance_Audit_Report.pdf"

with open(md_file, "r", encoding="utf-8") as f:
    text = f.read()

# Convert markdown to html with tables and fenced code blocks
html_body = markdown.markdown(text, extensions=['tables', 'fenced_code', 'nl2br'])

# Enhance badges for severity tags
html_body = re.sub(r'\[CRITICAL\]', '<span class="badge badge-critical">CRITICAL</span>', html_body)
html_body = re.sub(r'\[HIGH\]', '<span class="badge badge-high">HIGH</span>', html_body)
html_body = re.sub(r'\[MEDIUM\]', '<span class="badge badge-medium">MEDIUM</span>', html_body)
html_body = re.sub(r'\[LOW\]', '<span class="badge badge-low">LOW</span>', html_body)

css_styles = """
@page {
    size: A4 portrait;
    margin: 20mm 15mm 20mm 15mm;
    @top-right {
        content: "PMS Scalability & Performance Audit";
        font-size: 8pt;
        color: #64748b;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 8pt;
        color: #64748b;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    @bottom-right {
        content: "CONFIDENTIAL";
        font-size: 8pt;
        font-weight: bold;
        color: #dc2626;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.5;
    color: #1e293b;
    margin: 0;
    padding: 0;
}

h1 {
    font-size: 19pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2.5px solid #0f172a;
    padding-bottom: 5px;
    margin-top: 0;
    margin-bottom: 12px;
    page-break-after: avoid;
}

h2 {
    font-size: 14pt;
    font-weight: 700;
    color: #1e293b;
    border-bottom: 1.5px solid #e2e8f0;
    padding-bottom: 4px;
    margin-top: 22px;
    margin-bottom: 10px;
    page-break-after: avoid;
}

h3 {
    font-size: 11pt;
    font-weight: 700;
    color: #334155;
    margin-top: 16px;
    margin-bottom: 8px;
    page-break-after: avoid;
}

h4 {
    font-size: 10pt;
    font-weight: 600;
    color: #475569;
    margin-top: 12px;
    margin-bottom: 6px;
    page-break-after: avoid;
}

p {
    margin-top: 0;
    margin-bottom: 8px;
    text-align: justify;
}

strong {
    font-weight: 700;
    color: #0f172a;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    margin-bottom: 16px;
    font-size: 8.5pt;
    page-break-inside: avoid;
}

th, td {
    padding: 6px 8px;
    border: 1px solid #cbd5e1;
    text-align: left;
    vertical-align: top;
}

th {
    background-color: #f1f5f9;
    font-weight: 700;
    color: #0f172a;
}

tr:nth-child(even) {
    background-color: #f8fafc;
}

pre {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #0284c7;
    border-radius: 4px;
    padding: 8px 10px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    font-size: 7.5pt;
    line-height: 1.35;
    overflow-x: hidden;
    white-space: pre-wrap;
    word-break: break-all;
    margin-top: 6px;
    margin-bottom: 12px;
    page-break-inside: avoid;
}

code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    font-size: 8pt;
    background-color: #f1f5f9;
    padding: 1px 4px;
    border-radius: 3px;
    color: #0f172a;
}

pre code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
}

ul, ol {
    margin-top: 4px;
    margin-bottom: 10px;
    padding-left: 20px;
}

li {
    margin-bottom: 4px;
}

hr {
    border: 0;
    height: 1px;
    background: #e2e8f0;
    margin: 16px 0;
}

.badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 7.5pt;
    font-weight: 800;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    vertical-align: middle;
}

.badge-critical {
    background-color: #fee2e2;
    color: #991b1b;
    border: 1px solid #f87171;
}

.badge-high {
    background-color: #ffedd5;
    color: #9a3412;
    border: 1px solid #fb923c;
}

.badge-medium {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
}

.badge-low {
    background-color: #e0f2fe;
    color: #0369a1;
    border: 1px solid #7dd3fc;
}
"""

full_html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>PMS Scalability & Performance Audit</title>
<style>
{css_styles}
</style>
</head>
<body>
{html_body}
</body>
</html>
"""

print("Rendering PDF with WeasyPrint...")
html_doc = weasyprint.HTML(string=full_html)
html_doc.write_pdf(pdf_file)
print(f"SUCCESS: Rendered PDF to {pdf_file}")
