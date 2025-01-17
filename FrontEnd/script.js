async function saveInvoice(pdfBlob) {
    const formData = new FormData();
    formData.append('pdf', pdfBlob);
    formData.append('date', document.querySelector('input[type="date"]').value);

    const response = await fetch('/api/saveInvoice.php', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    return data.invoiceNumber;
}

// Initialize items array
let items = [];

// Function to add new line items
function addItem() {
    const table = document.getElementById('itemsTable');
    const row = table.insertRow();
    row.innerHTML = `
        <td><input type="text" class="w-full p-2 border rounded-md" onchange="calculateTotals()"></td>
        <td><input type="number" class="w-full p-2 border rounded-md" onchange="calculateTotals()"></td>
        <td><input type="number" class="w-full p-2 border rounded-md" onchange="calculateTotals()"></td>
        <td class="p-2"></td>
    `;
    items.push({ quantity: 0, rate: 0 });
    calculateTotals();
}

// Function to calculate totals
function calculateTotals() {
    const rows = document.getElementById('itemsTable').rows;
    let subtotal = 0;

    for (let i = 0; i < rows.length; i++) {
        const quantity = parseFloat(rows[i].cells[1].querySelector('input').value) || 0;
        const rate = parseFloat(rows[i].cells[2].querySelector('input').value) || 0;
        const amount = quantity * rate;
        rows[i].cells[3].textContent = amount.toFixed(2);
        subtotal += amount;
    }

    const tax = subtotal * 0.06;
    const total = subtotal + tax;

    document.getElementById('subtotal').textContent = subtotal.toFixed(2);
    document.getElementById('tax').textContent = tax.toFixed(2);
    document.getElementById('total').textContent = total.toFixed(2);
}

// Function to generate invoice number
function generateInvoiceNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10).toString().padStart(3, '0');
    return `${year}${month}-${random}`;
}

// Helper function to get table data
function getTableData() {
    const rows = document.getElementById('itemsTable').rows;
    const data = [];
    const currency = document.querySelector('select').value;

    for (let row of rows) {
        data.push([
            row.cells[0].querySelector('input').value,
            row.cells[1].querySelector('input').value,
            `${currency} ${row.cells[2].querySelector('input').value}`,
            `${currency} ${row.cells[3].textContent}`
        ]);
    }
    return data;
}

// Initialize PDF generation when page loads
window.onload = function () {
    document.getElementById('download').addEventListener('click', function () {
        const { jsPDF } = window.jspdf;

        // Check if jsPDF is available
        if (!jsPDF) {
            console.error('jsPDF is not loaded');
            alert('Error: PDF library not loaded');
            return;
        }

        const doc = new jsPDF();
        const image = new Image();

        try {
            // Company logo - wrapped in try/catch in case logo fails to load
            const img = new Image();
            img.onload = function () {
                doc.addImage(this, 'PNG', 10, 10, 50, 50);
                doc.save('invoice.pdf');
            };
            img.onerror = function () {
                console.error('Error loading image');
            };
            img.src = './FrontEnd/images/logo.png';

            // Get invoice details
            const currency = document.querySelector('select').value;
            const date = document.querySelector('input[type="date"]').value;
            const dueDate = document.querySelectorAll('input[type="date"]')[1].value;
            const poNumber = document.querySelectorAll('input[type="text"]')[1].value;
            const billTo = document.querySelectorAll('textarea')[0].value;
            const invoiceNumber = generateInvoiceNumber();

            // Add "INVOICE" and invoice number
            doc.setFontSize(28);
            doc.text('INVOICE', 150, 30, { align: 'right' });
            doc.setFontSize(11);
            doc.text(`#${invoiceNumber}`, 150, 40, { align: 'right' });

            // Add company info - left aligned
            doc.setFontSize(11);
            doc.text('Cognosphere Dynamics Limited', 15, 70);
            doc.text('Plot 19-21 Port Bell Road', 15, 77);
            doc.text('P. O. Box 201025, Nakawa Kampala', 15, 84);
            doc.text('Email: sales@cognospheredynamics.com', 15, 91);

            // Add invoice details - right aligned
            doc.setFontSize(11);
            doc.text('Date:', 120, 70);
            doc.text(date, 150, 70);
            doc.text('Due Date:', 120, 76);
            doc.text(dueDate, 150, 76);
            doc.text('PO Number:', 120, 82);
            doc.text(poNumber, 150, 82);
            doc.text('Balance Due:', 120, 88);
            doc.text(`${currency} ${document.getElementById('total').textContent}`, 150, 88);

            // Add billing info
            doc.setFontSize(11);
            doc.text('Bill To:', 15, 120);
            const billToLines = billTo.split('\n');
            billToLines.forEach((line, index) => {
                doc.text(line, 15, 130 + (index * 10));
            });

            // Create items table with dark header
            doc.autoTable({
                startY: 160,
                head: [['Item', 'Quantity', 'Rate', 'Amount']],
                body: getTableData(),
                theme: 'grid',
                headStyles: {
                    fillColor: [51, 51, 51],
                    textColor: [255, 255, 255],
                    fontSize: 11
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 5
                },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 30, halign: 'right' },
                    2: { cellWidth: 40, halign: 'right' },
                    3: { cellWidth: 40, halign: 'right' }
                }
            });
            // Add subtotal, tax, and total
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.text(`Subtotal: ${currency} ${document.getElementById('subtotal').textContent}`, 150, finalY, { align: 'right' });
            doc.text(`Withholding Tax (6%): ${currency} ${document.getElementById('tax').textContent}`, 150, finalY + 5, { align: 'right' });
            doc.text(`Total: ${currency} ${document.getElementById('total').textContent}`, 150, finalY + 10, { align: 'right' });

            // Add terms
            doc.setFontSize(11);
            doc.text('Terms:', 15, finalY + 40);
            doc.setFontSize(10);
            doc.text('Please pay through our bank account - EQUITY BANK UGANDA Main Branch,', 15, finalY + 50);
            doc.text('ACCOUNT NAME: COGNOSPHERE DYNAMICS LIMITED', 15, finalY + 60);
            doc.text('Account Number: 1001203186634', 15, finalY + 70);

            // Save the PDF
            doc.save(`Invoice-${invoiceNumber}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
        alert('Error generating PDF. Please check the console for details.');
        }
    });
};