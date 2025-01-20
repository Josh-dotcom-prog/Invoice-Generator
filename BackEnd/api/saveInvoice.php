<?php
require_once '../config/db.php';
function getNextInvoiceNumber() {
    // Get last invoice number from database
    $query = "SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1";
    $result = $db->query($query);
    
    if ($result->num_rows > 0) {
        $lastNumber = $result->fetch_assoc()['invoice_number'];
        $number = intval(substr($lastNumber, -4)) + 1;
    } else {
        $number = 1;
    }
    
    return 'INV-' . date('Ym') . '-' . str_pad($number, 4, '0', STR_PAD_LEFT);
}

// Save invoice details
$invoiceNumber = getNextInvoiceNumber();
$invoiceDate = $_POST['date'];
$filePath = 'invoices/' . $invoiceNumber . '.pdf';

$query = "INSERT INTO invoices (invoice_number, invoice_date, file_path) 
          VALUES (?, ?, ?)";
$stmt = $db->prepare($query);
$stmt->bind_param('sss', $invoiceNumber, $invoiceDate, $filePath);
$stmt->execute();
