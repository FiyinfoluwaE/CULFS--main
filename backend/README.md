
# CULfs Backend API

This is the Flask backend for the Covenant University Lost and Found System (CULfs).

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Database Setup

1. Install MySQL on your system
2. Create a MySQL database named `culfs_database`
3. Update the database connection string in `app.py`:
   ```python
   app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql://username:password@localhost/culfs_database'
   ```
4. Run the SQL script to create tables:
   ```bash
   mysql -u your_username -p culfs_database < db.sql
   ```

### 3. Email Configuration

Update the email configuration in `app.py`:
```python
smtp_username = "your-email@gmail.com"
smtp_password = "your-app-password"
```

### 4. Run the Application

```bash
python app.py
```

The API will be available at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Lost Items
- `POST /api/report-lost-item` - Report a lost item
- `GET /api/lost-items/<user_id>` - Get user's lost items

### Found Items
- `POST /api/log-found-item` - Log a found item
- `GET /api/admin/found-items` - Get all found items (admin only)

### Admin
- `GET /api/admin/lost-items` - Get all lost items
- `POST /api/init-db` - Initialize database with default data

## Database Schema

The system uses the following main tables:
- `users` - System users (students, staff, admin)
- `students` - Student-specific information
- `staff` - Staff-specific information
- `offices` - University offices
- `lost_items` - Lost item reports
- `found_items` - Found items inventory
- `matches` - Links between lost and found items
- `notifications` - System notifications
- `archives` - Archived items

## Features

- **User Management**: Registration and authentication for students, staff, and admin
- **Lost Item Reporting**: Users can report lost items with detailed information
- **Found Item Logging**: Admin can log found items into the system
- **Automatic Matching**: System automatically checks for matches between lost and found items
- **Email Notifications**: Automatic email notifications for various events
- **Status Tracking**: Comprehensive status tracking for all items
- **Archiving**: Automatic archiving of unclaimed items after 30 days

## Status Types

- **Reported**: Item has been reported as lost
- **Found**: Item has been recovered
- **Matched**: Potential owner has been identified
- **Claimed**: Item has been picked up by the owner
- **Unclaimed**: Item not collected within 7 days
- **Archived**: Item removed from active list after 30 days
