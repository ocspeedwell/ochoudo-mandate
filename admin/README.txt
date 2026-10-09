OMG ID Card Printing Module

Copy these three files into the existing /admin/ directory:
- card-printing.html
- card-printing.css
- card-printing.js

Required existing assets:
../assets/ochoudo-logo.png
../assets/ochoudo-logo3.png

Add these two new assets:
../assets/ochoudo-card-watermark.jpg
../assets/ochoudo-signature.png

The page reuses:
- Supabase members table
- is_omg_admin RPC
- get-member-photo Edge Function
- existing admin.css/admin.js

Important:
The initial print-sheet dimensions and card gap are a calibration starting point.
Use the on-page X, Y and Gap controls with a test sheet/tray, then save calibration.
