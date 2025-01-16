<?php
$servername = "localhost";
$username = "invoice_user";
$password = "Invoice123";
$dbname = "invoice_system";

// Creating connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Checking connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
