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
let lastInvoiceNumber = 1000; // Initialize with the starting invoice number
function generateInvoiceNumber() {
    lastInvoiceNumber += 1;
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${lastInvoiceNumber}`;
}


// Initialize PDF generation when page loads
window.onload = function() {
    document.getElementById('download').addEventListener('click', function() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        //Company logo
        doc.addImage('logo.png', 'PNG', 10, 10, 50, 20);

        // Get company details
        const currency = document.querySelector('select').value;
        const date = document.querySelector('input[type="date"]').value;
        const dueDate = document.querySelectorAll('input[type="date"]')[1].value;
        const poNumber = document.querySelectorAll('input[type="text"]')[1].value;
        const billTo = document.querySelectorAll('textarea')[0].value;
        const lastInvoiceNumber = generateInvoiceNumber();
        

        // Add header
        doc.setFontSize(20);
        doc.text('INVOICE', 150, 20, { align: 'right' });

        // Add company info
        doc.setFontSize(12);
        doc.text('Cognosphere Dynamics Ltd', 10, 45);
        doc.text('Plot 19-21 Port Bell Road', 10, 50);
        doc.text('P. O. Box 201025, Nakawa Kampala', 10, 55);
        doc.text('Email: sales@cognospheredynamics.com', 10, 60);

        
        // Add invoice details
       
doc.setTextColor(100, 100, 100); // Use a lighter gray for static labels

// Align labels (static text) on the right
const pageWidth = doc.internal.pageSize.getWidth(); // Get the page width dynamically
doc.text(`Invoice Number: ${lastInvoiceNumber}`, 150, 45, { align: 'right' });
doc.text('Date:', pageWidth - 50, 50, { align: 'right' });
doc.text('Due Date:', pageWidth - 50, 55, { align: 'right' });
doc.text('PO Number:', pageWidth - 50, 60, { align: 'right' });

// Set text color for input values (dynamic text)
doc.setTextColor(0, 0, 0); // Use black for darker dynamic values

// Align input values (dynamic text) on the right
doc.text(date, pageWidth - 10, 50, { align: 'right' });
doc.text(dueDate, pageWidth - 10, 55, { align: 'right' });
doc.text(poNumber, pageWidth - 10, 60, { align: 'right' });



        // Add billing info
        doc.text('Bill To:', 10, 80);
        doc.text(billTo.split('\n'), 10, 85);

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
            startY: 110,
            head: [['Item', 'Quantity', 'Rate', 'Amount']],
            body: items,
            theme: 'grid',
            headStyles: {
                fillColor: [128, 128, 128],
                textColor: [255, 255, 255]
            }
        });

        // Add totals
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(`Subtotal: ${currency} ${document.getElementById('subtotal').textContent}`, 150, finalY, { align: 'right' });
        doc.text(`Withholding Tax (6%): ${currency} ${document.getElementById('tax').textContent}`, 150, finalY + 5, { align: 'right' });
        doc.text(`Total: ${currency} ${document.getElementById('total').textContent}`, 150, finalY + 10, { align: 'right' });

        // Add terms
        doc.text('Terms:', 10, finalY + 20);
        doc.setFontSize(10);
        doc.text('Please pay through our bank account - EQUITY BANK UGANDA Main Branch,', 10, finalY + 25);
        doc.text('ACCOUNT NAME: COGNOSPHERE DYNAMICS LIMITED', 10, finalY + 30);
        doc.text('Account Number: 1001203186634', 10, finalY + 35);

        // Add footer with page numbers
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        // Save the PDF
        doc.save(`Invoice-${lastInvoiceNumber}.pdf`);
    });
};
