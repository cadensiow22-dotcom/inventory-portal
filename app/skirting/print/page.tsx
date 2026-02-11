export default function SkirtingPrintPage() {
  // ✅ Prefilled rows (matches your screenshot)
  const rows = [
    { no: 1, desc: "GS Table Skirting (Black) - Big" },
    { no: 2, desc: "GS Table Skirting (Black) - Small" },
    { no: 3, desc: "GS Table Skirting (Black) - Thin" },
    { no: 4, desc: "Rectangle Table Cloth (Beige)" },
    { no: 5, desc: "Cocktail Table Skirting (Black) - Round" },
    { no: 6, desc: "Chair Cloth (Pearl white)" },
    { no: 7, desc: "Curtains" },
    { no: 8, desc: "Kids Uniform" },
    { no: 9, desc: "PPE (Jump Suit)" },
  ];

  return (
    <main className="print-page">
      {/* Print CSS */}
      <style>{`
        @page { size: A4; margin: 12mm; }

        .print-page {
          background: white;
          color: #000;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 12px;
        }

        .sheet {
          max-width: 794px; /* A4-ish width on screen */
          margin: 0 auto;
        }

        .company-header {
  text-align: center;
  margin-bottom: 26px;
}

.company-header .name {
  font-weight: 900;
  font-size: 28px;
  letter-spacing: 0.6px;
}

.company-header .addr {
  font-size: 18px;
  margin-top: 6px;
}

.company-header .contact {
  font-size: 18px;
  margin-top: 4px;
}

        .title {
          text-align: center;
          font-weight: 800;
          font-size: 22px;
          padding: 10px 0 10px 0;
        }

        table.form {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        table.form td, table.form th {
          border: 1px solid #000;
          padding: 6px 6px;
          vertical-align: middle;
          word-wrap: break-word;
        }

        .label {
          width: 190px;
          font-weight: 600;
        }

        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 700; }

        /* Items table header */
        .items th {
          font-weight: 700;
          text-align: center;
          background: #f3f3f3;
        }

        /* Total row styling like Excel highlight */
        .total-row td {
          background: #f6e3a3;
          font-weight: 700;
        }

        /* signature line inside a cell */
        .sig-line {
          height: 22px;
          border-bottom: 1px solid #000;
          width: 100%;
        }

        .instruction {
  font-weight: 800;
  font-size: 16px;
  margin-top: 12px;
  margin-bottom: 10px;
  text-decoration: underline;
}

        .print-hint {
          margin-top: 10px;
          text-align: center;
          font-size: 11px;
          color: #666;
        }

        @media print {
          .print-hint { display: none; }
          .sheet { max-width: none; margin: 0; }
        }
      `}</style>

      <div className="sheet">

<div className="company-header">
  <div className="name">DEFENCE COLLECTIVE SINGAPORE LTD</div>
  <div className="addr">510 Upper Jurong Road, Singapore 638365</div>
</div>

{/* Form Title */}
<div className="title">Laundry Request Form</div>

        {/* Top details */}
        <table className="form" aria-label="Laundry Request Form Header">
          <colgroup>
            <col style={{ width: "38%" }} />
            <col style={{ width: "62%" }} />
          </colgroup>

          <tbody>
            <tr>
              <td className="label">Date of Request</td>
              <td>&nbsp;</td>
            </tr>
            <tr>
              <td className="label">Name of Requestor</td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* Items table */}
        <table className="form items" style={{ marginTop: 10 }} aria-label="Items Table">
          <colgroup>
            <col style={{ width: "10%" }} />
            <col style={{ width: "60%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "18%" }} />
          </colgroup>

          <thead>
            <tr>
              <th>S/No.</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.no}>
                <td className="center">{r.no}</td>
                <td>{r.desc}</td>
                <td className="center">&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}

            {/* Total row */}
            <tr className="total-row">
              <td colSpan={2} className="right">Total:</td>
              <td className="center">&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>

<table className="form" style={{ marginTop: 10 }} aria-label="Approval Section">
  <colgroup>
    <col style={{ width: "38%" }} />
    <col style={{ width: "62%" }} />
  </colgroup>

  <tbody>
    <tr>
      <td className="label bold">Filled by</td>
      <td className="bold">CM Full Time Staff</td>
    </tr>

    <tr>
      <td className="label">Approved By</td>
      <td>&nbsp;</td>
    </tr>

    <tr>
      <td className="label">Date</td>
      <td>&nbsp;</td>
    </tr>
  </tbody>
</table>

        {/* ✅ Instruction line 1 (bold + larger) */}
        <div className="instruction">1. To be filled by vendor upon collection</div>

        {/* Vendor fill section */}
        <table className="form" aria-label="Vendor Section">
          <colgroup>
            <col style={{ width: "38%" }} />
            <col style={{ width: "62%" }} />
          </colgroup>

          <tbody>
            <tr>
              <td className="label">Received By</td>
              <td>&nbsp;</td>
            </tr>

            <tr>
              <td className="label">Signature</td>
              <td>
                <div className="sig-line" />
              </td>
            </tr>
          </tbody>
        </table>

        <table className="form" aria-label="Vendor Date Row">
          <colgroup>
            <col style={{ width: "38%" }} />
            <col style={{ width: "62%" }} />
          </colgroup>

          <tbody>
            <tr>
              <td className="label">Date</td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <div className="instruction">2. To be filled by CM once received</div>

        <table className="form" style={{ marginTop: 10 }} aria-label="Collected Section">
          <colgroup>
            <col style={{ width: "38%" }} />
            <col style={{ width: "62%" }} />
          </colgroup>

          <tbody>
            <tr>
              <td className="label">Collected By</td>
              <td className="center">(CM Staff)</td>
            </tr>
            <tr>
              <td className="label">Signature</td>
              <td>
                <div className="sig-line" />
              </td>
            </tr>
            <tr>
              <td className="label">Date</td>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        <div className="print-hint">Tip: Press Ctrl + P (or Command + P) to print / save as PDF.</div>
      </div>
    </main>
  );
}
