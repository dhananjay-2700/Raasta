import '../models/user_model.dart';

final UserModel currentUserData = UserModel(
  name: 'Rahul Kumar',
  email: 'rahul.kumar@example.com',
  phone: '+91 98765 43210',
  dob: '15/08/1995',
  gender: 'Male',
  occupation: 'Software Engineer',
  category: 'General',
  address: 'Flat 402, Block B, Green Glen Layout, Sector 14',
  state: 'Haryana',
  district: 'Gurugram',
  pincode: '122001',
  memberSince: 'January 2026',
  linkedIds: [
    LinkedId(title: 'Aadhaar Card', number: 'XXXX XXXX 4321', status: 'Verified', icon: '🪪'),
    LinkedId(title: 'PAN Card', number: 'ABCPK1234Q', status: 'Verified', icon: '🏦'),
    LinkedId(title: 'Voter ID', number: 'DL/02/XXX/XXXXXX', status: 'Verified', icon: '🗳️'),
    LinkedId(title: 'Driving Licence', number: 'HR-0620200012345', status: 'Expiring Soon', icon: '🚗'),
    LinkedId(title: 'Passport', number: 'P1234567', status: 'Verified', icon: '🛂'),
    LinkedId(title: 'UAN (EPFO)', number: '1001XXXXXXXX', status: 'Linked', icon: '💼'),
  ],
  recentActivity: [
    'Submitted Passport Renewal Application (Jul 02, 2026)',
    'Reported Pothole on MG Road (Jul 03, 2026)',
    'Uploaded Class 12 Marksheet to DigiLocker (Jun 25, 2026)',
    'Applied for Income Certificate (Jun 26, 2026)',
    'Checked eligibility for PM Mudra Loan (Jun 20, 2026)',
    'Updated Aadhaar Address (Jun 10, 2026)',
    'Registered on BridgeBharat (Jan 15, 2026)',
  ],
);
