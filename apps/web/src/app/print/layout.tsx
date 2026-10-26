import React from 'react';

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-page-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 0 !important;
        }
        @media print {
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, nav, header, footer {
            display: none !important;
          }
          .print-page-wrapper {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            height: 297mm !important;
            max-height: 297mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          .a4-sheet, .a4-print-sheet, .a4-page-sheet {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding-top: 1.5in !important;
            padding-bottom: 1.0in !important;
            padding-left: 0.75in !important;
            padding-right: 0.75in !important;
            margin: 0 !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
          .no-letterhead-sheet {
            width: 210mm !important;
            height: 297mm !important;
            max-height: 297mm !important;
            padding-top: 0.4in !important;
            padding-bottom: 0.4in !important;
            padding-left: 0.5in !important;
            padding-right: 0.5in !important;
            margin: 0 !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
        }
        @media screen {
          .print-page-wrapper {
            padding: 24px 0;
            min-height: 100vh;
            background-color: #f1f5f9;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .a4-sheet, .a4-print-sheet, .a4-page-sheet {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            padding-top: 1.5in;
            padding-bottom: 1.0in;
            padding-left: 0.75in;
            padding-right: 0.75in;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .no-letterhead-sheet {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            padding-top: 0.4in;
            padding-bottom: 0.4in;
            padding-left: 0.5in;
            padding-right: 0.5in;
            margin: 0 auto;
            background: #ffffff;
            box-shadow: 0 4px 25px rgba(0, 0, 0, 0.15);
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
        }
      `}} />
      {children}
    </div>
  );
}
