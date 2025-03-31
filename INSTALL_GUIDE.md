# Object Dimension Tracker - Installation Guide

This guide will help you install and run the Object Dimension Tracker application on your local machine.

## System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Node.js**: Version 18 or higher
- **Python**: Version 3.8 or higher
- **PostgreSQL**: Version 12 or higher
- **Web Browser**: Chrome, Firefox, Edge, or Safari (latest versions recommended)

## Step 1: Download the Application

You can download the application in one of two ways:

### Option 1: Download ZIP File
1. Download the ZIP file containing the application code
2. Extract the ZIP file to a folder on your computer

### Option 2: Clone the Repository (if you have Git installed)
```bash
git clone <repository-url>
cd object-dimension-tracker
```

## Step 2: Set Up the Database

1. Install PostgreSQL if you haven't already:
   - [Windows](https://www.postgresql.org/download/windows/)
   - [macOS](https://www.postgresql.org/download/macosx/)
   - [Linux](https://www.postgresql.org/download/linux/)

2. Create a new PostgreSQL database:
   ```bash
   psql -U postgres
   CREATE DATABASE object_dimension_tracker;
   \q
   ```

3. Create a `.env` file in the project root folder with the following content:
   ```
   DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/object_dimension_tracker
   SESSION_SECRET=your_secret_key_here
   ```
   Replace `yourpassword` with your PostgreSQL password and `your_secret_key_here` with a random string.

## Step 3: Install Dependencies

### Node.js Dependencies
```bash
npm install
```

### Python Dependencies
```bash
# Basic dependencies (required)
pip install flask numpy opencv-python pillow requests

# For full functionality (optional)
pip install torch torchvision
```

> **Note**: The advanced object detection features require PyTorch, but the application will run in fallback mode without it.

## Step 4: Initialize the Database

```bash
npm run db:push
```

This command will create all the necessary tables in your database.

## Step 5: Start the Application

```bash
npm run dev
```

The application should now be running on [http://localhost:5000](http://localhost:5000).

## Troubleshooting

### Database Connection Issues

1. Verify your PostgreSQL service is running
2. Check the connection details in your `.env` file
3. Run the database test script to verify your connection:
   ```bash
   node debug-db.js
   ```

### Python Model Server Issues

If you encounter issues with the Python model server:

1. Make sure Python 3.8+ is installed and accessible in your PATH
2. Check that all required Python dependencies are installed
3. The application will use a fallback mode if advanced dependencies like PyTorch are not available

### Port Already in Use

If port 5000 is already in use:

1. Change the port in `server/index.ts` (line 67)
2. Update any references to that port accordingly

## Running in Production

To build and run the application in production mode:

```bash
npm run build
npm run start
```

## Windows-Specific Notes

If you're running on Windows:

1. The server binding has been modified to work on Windows
2. The Python model server uses `127.0.0.1` instead of `0.0.0.0` on Windows
3. Make sure to use the correct path formats for Windows in any configuration files

## Support

If you encounter any issues that aren't covered in this guide, please contact the application developer for assistance.