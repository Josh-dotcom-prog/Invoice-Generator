function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Get company details
    const currency = document.querySelector('select').value;
    const date = document.querySelector('input[type="date"]').value;
    const dueDate = document.querySelectorAll('input[type="date"]')[1].value;
    const poNumber = document.querySelectorAll('input[type="text"]')[1].value;
    const billTo = document.querySelectorAll('textarea')[0].value;

    // Add company logo
    doc.addImage('logo.png', 'PNG', 10, 10, 50, 20);

    // Add header
    doc.setFontSize(30);
    doc.text('INVOICE', 150, 20, { align: 'right'});

    // Add company info
    doc.setFontSize(12);
    doc.text('Cognosphere Dynamics Ltd', 10, 30);
    doc.text('Plot 19-21 Port Bell Road', 10, 35);
    doc.text('P. O. Box 201025, Nakawa Kampala', 10, 40);
    doc.text('Email: sales@cognospheredynamics.com', 10, 45);

    // Add invoice details
    doc.text(`Date: ${date}`, 150, 30, { align: 'right' });
    doc.text(`Due Date: ${dueDate}`, 150, 35, { align: 'right' });
    doc.text(`PO Number: ${poNumber}`, 150, 40, { align: 'right' });

    // Add billing and shipping info
    doc.text('Bill To:', 10, 60);
    doc.text(billTo.split('\n'), 10, 65);
    doc.text('Ship To:', 100, 60);
    doc.text(shipTo.split('\n'), 100, 65);

    // Get items from table
    const items = [];
    const itemRows = document.getElementById('itemsTable').rows;
    for (let row of itemRows) {
        items.push([
            row.cells[0].querySelector('input').value,
            row.cells[1].querySelector('input').value,
            row.cells[2].querySelector('input').value,
            row.cells[3].textContent
        ]);
    }

    // Add items table
    doc.autoTable({
        startY: 90,
        head: [['Item', 'Quantity', 'Rate', 'Amount']],
        body: items,
        theme: 'grid'
    });

    // Add totals
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: ${currency} ${document.getElementById('subtotal').textContent}`, 150, finalY, { align: 'right' });
    doc.text(`Tax (6%): ${currency} ${document.getElementById('tax').textContent}`, 150, finalY + 5, { align: 'right' });
    doc.text(`Total: ${currency} ${document.getElementById('total').textContent}`, 150, finalY + 10, { align: 'right' });

    // Add terms
    doc.text('Terms:', 10, finalY + 20);
    doc.setFontSize(10);
    doc.text('Please pay through our bank account - EQUITY BANK UGANDA Main Branch,', 10, finalY + 25);
    doc.text('ACCOUNT NAME: COGNOSPHERE DYNAMICS LIMITED', 10, finalY + 30);
    doc.text('Account Number: 1001203186634', 10, finalY + 35);

    // Save the PDF
    doc.save(`Invoice-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Add click event listener to download button
document.getElementById('download').addEventListener('click', generatePDF);
