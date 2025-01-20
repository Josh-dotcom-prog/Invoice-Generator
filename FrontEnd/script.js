// Initialize items array
let items = [];

// Function to save invoice
async function saveInvoice(pdfBlob) {
    try {
        const formData = new FormData();
        formData.append('pdf', pdfBlob);
        formData.append('date', document.querySelector('input[type="date"]').value);

        const response = await fetch('/api/saveInvoice.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.invoiceNumber;
    } catch (error) {
        console.error('Error saving invoice:', error);
        throw error;
    }
}

// Function to add new line items
function addItem() {
    const table = document.getElementById('itemsTable');
    const row = table.insertRow();
    const newItem = { description: '', quantity: 0, rate: 0, amount: 0 };
    
    row.innerHTML = `
        <td><input type="text" class="w-full p-2 border rounded-md" onchange="updateItem(${items.length}, 'description', this.value)"></td>
        <td><input type="number" class="w-full p-2 border rounded-md" onchange="updateItem(${items.length}, 'quantity', this.value)"></td>
        <td><input type="number" class="w-full p-2 border rounded-md" onchange="updateItem(${items.length}, 'rate', this.value)"></td>
        <td class="p-2"></td>
    `;
    
    items.push(newItem);
    calculateTotals();
}

function updateItem(index, field, value) {
    items[index][field] = value;
    calculateTotals();
}

//Change currency 
const exchangeRates = {
    USD: 1,
    EUR: 0.85,
};



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
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
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
window.onload = function() {
    console.log('jsPDF available:', window.jspdf);
    document.getElementById('download').addEventListener('click', async function() {
        const { jsPDF } = window.jspdf;
        
        
        if (!jsPDF) {
            console.error('jsPDF is not loaded');
            alert('Error: PDF library not loaded');
            return;
        }

        try {
            const doc = new jsPDF();
            
            // Load image first
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    doc.addImage(img, 'PNG', 10, 10, 70, 30);
                    resolve();
                };
                img.onerror = reject;
                img.src = './images/logo.png';
            });

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

            // Add company info
            doc.setFontSize(11);
            doc.text('Cognosphere Dynamics Limited', 15, 70);
            doc.text('Plot 19-21 Port Bell Road', 15, 77);
            doc.text('P. O. Box 201025, Nakawa Kampala', 15, 84);
            doc.text('Email: sales@cognospheredynamics.com', 15, 91);

            // Add invoice details
            doc.setTextColor(49, 49, 49)
            doc.text('Date:', 120, 70);
            doc.setFont(undefined, 'normal');
            doc.text(date, 150, 70);
            doc.text('Due Date:', 120, 76);
            doc.text(dueDate, 150, 76);
            doc.text('PO Number:', 120, 82);
            doc.text(poNumber, 150, 82);
            doc.setFont(undefined, 'bold');
            doc.setFillColor(230, 230, 230); // Light gray background - you can adjust RGB values
            doc.rect(115, 84, 90, 7, 'F'); 
            doc.text('Balance Due:', 120, 88);
            doc.text(`${currency} ${document.getElementById('total').textContent}`, 150, 88);
            doc.setFont(undefined, 'normal');
           
           
            // Add billing info

            doc.text('Bill To:', 15, 120);
            const billToLines = billTo.split('\n');
            billToLines.forEach((line, index) => {
                doc.text(line, 15, 130 + (index * 6));
            });

            // Create items table
            doc.autoTable({
                startY: 160,
                head: [['Item', 'Quantity', 'Rate', 'Amount']],
                body: getTableData(),
                // theme: 'grid',
                headStyles: {
                    fillColor: [51, 51, 51],
                    textColor: [255, 255, 255],
                    fontSize: 12,
                    cellPadding: 2,
                    borderRadius: 20
                },
                styles: {
                    fontSize: 10,
                    overflow: 'linebreak',
                    cellPadding: 6,
                    borderRadius: 2 
                },
                columnStyles: {
                    0: { cellWidth: 80 },
                    1: { cellWidth: 30, halign: 'right' },
                    2: { cellWidth: 40, halign: 'right' },
                    3: { cellWidth: 40, halign: 'right' }
                }
            });

            //Debug point 
            document.getElementById('download').addEventListener('click', async function() {
                console.log('Download clicked');
                const { jsPDF } = window.jspdf;
                
                if (!jsPDF) {
                    console.log('jsPDF not found');
                    return;
                }
                console.log('jsPDF initialized');
                
                try {
                    const doc = new jsPDF();
                    console.log('PDF document created');
                    // ... rest of your code
                } catch (error) {
                    console.log('Error details:', error);
                }
            });
            
            // Add totals
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.text(`Subtotal: ${currency} ${document.getElementById('subtotal').textContent}`, 180, finalY, { align: 'right' });
            doc.text(`Withholding Tax (6%): ${currency} ${document.getElementById('tax').textContent}`, 180, finalY + 5, { align: 'right' });
            doc.setFont(undefined, 'bold');
            doc.text(`Total: ${currency} ${document.getElementById('total').textContent}`, 180, finalY + 10, { align: 'right' });
            doc.setFont(undefined, 'normal');

            // Add terms
            doc.setFont(undefined, 'bold');
            doc.setFontSize(11);
            doc.text('Terms:', 10, finalY + 40);
            doc.setFont(undefined, 'normal');
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
