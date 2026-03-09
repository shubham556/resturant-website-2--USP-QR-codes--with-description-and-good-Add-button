# Project Documentation: Hotel Sri Vaari Website

## 1. Project Overview
The "Hotel Sri Vaari" website is designed to provide a seamless dining experience for customers. It allows users to:
- View the restaurant's menu.
- Place orders directly from their table using QR codes.
- Receive WhatsApp confirmations for reservations.
- Manage orders efficiently in the kitchen.

### Purpose
The website aims to modernize the dining experience by integrating technology for order management and customer communication.

### Target Audience
- Customers dining at the restaurant.
- Restaurant staff managing orders and reservations.

---

## 2. File Structure
### HTML Files
- **index.html**: The main landing page with sections for the menu, reservations, gallery, and contact information.
- **form.html**: A form for collecting customer details.
- **kitchen.html**: A dashboard for kitchen staff to manage active and completed orders.
- **qr-codes.html**: Displays QR codes for tables.

### CSS Files
- **style.css**: Contains the main styles for the website.
- **kitchen.css**: Styles specific to the kitchen dashboard.

### JavaScript Files
- **script.js**: Handles cart management, WhatsApp API integration, and dynamic UI updates.
- **firebase-config.js**: Configures Firebase for real-time database operations.
- **kitchen.js**: Manages the kitchen dashboard, including order notifications and history.
- **menu.js**: Defines the restaurant's menu structure.

### Assets
- **Images/**: Contains images used across the website.
- **Payment Method/**: Stores payment-related resources.

---

## 3. Key Features
### Customer-Facing Features
- **Menu Display**: Customers can browse the menu categorized by meal types.
- **Table-Specific Orders**: QR codes identify the table number for orders.
- **WhatsApp Confirmation**: Sends automated reservation confirmations via WhatsApp.

### Staff-Facing Features
- **Kitchen Dashboard**: Displays active orders, order history, and real-time updates.
- **Order Notifications**: Plays a sound when new orders are received.

---

## 4. Code Architecture
### Firebase Integration
- **firebase-config.js**: Initializes Firebase and connects to the real-time database.
- **Usage**: Stores and retrieves order data dynamically.

### WhatsApp API Integration
- **script.js**: Sends reservation confirmations using the Green API for WhatsApp.
- **Setup**: Requires an instance ID and API token.

### Modular Design
- **menu.js**: Defines the menu as a structured JavaScript object.
- **script.js**: Handles customer interactions and cart management.
- **kitchen.js**: Manages kitchen operations and notifications.

---

## 5. Setup Instructions
### Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com).
2. Create a project and add a web app.
3. Copy the `firebaseConfig` object into `firebase-config.js`.
4. Enable the Realtime Database in test mode.

### WhatsApp API Configuration
1. Create an account at [Green API](https://green-api.com).
2. Set up an instance and scan the QR code with WhatsApp.
3. Copy the instance ID and API token into `script.js`.

---

## 6. Future Enhancements
1. **Payment Integration**: Add online payment options.
2. **Analytics Dashboard**: Provide insights into order trends.
3. **Multi-Language Support**: Cater to a diverse audience.
4. **Mobile App**: Develop a companion app for customers.

---

This documentation provides a comprehensive overview of the "Hotel Sri Vaari" website, its architecture, and its functionality. For further assistance, refer to the code comments in each file.