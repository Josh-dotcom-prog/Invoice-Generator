<?php
include 'db.php';  // Include the database connection file

$invoice_date = $_POST['invoice_date'];  // Retrieve invoice date from form input
$invoice_number = 'INV-' . str_pad(rand(1, 99999), 5, '0', STR_PAD_LEFT);  // Generate invoice number

// Insert invoice data into the database
// Note: 'created_at' will be automatically set by the database due to the TIMESTAMP default
$sql = "INSERT INTO invoices (invoice_date, invoice_number, invoice_file) VALUES ('$invoice_date', '$invoice_number', '$invoice_file')";

if ($conn->query($sql) === TRUE) {
    echo "New record created successfully";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

$conn->close();  // Close the database connection
?>
